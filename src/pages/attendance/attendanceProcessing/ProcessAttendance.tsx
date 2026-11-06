import { useState, useEffect, useCallback, useRef } from "react";
import {
  LinearProgress, Alert,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tooltip, TextField,
} from "@mui/material";
import {
  PlayArrowOutlined,
  WarningAmberOutlined, InfoOutlined, LockOutlined, PendingActionsOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { ProcessResult, AttendanceStatus, WorkerType } from "../../../services/modules/attendanceTypes";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG, WORKER_TYPE_OPTIONS, formatTimewithSec } from "../const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { useAuth } from "../../../auth/authContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiService } from "../../../services";
import { formatDate } from "../../leave/leaveFormatters";
import { biometricService } from "../../../services/modules/biometricDevice";

interface PreCheckIssue {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  shiftCode?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  reason: string;
  meta?: Record<string, any>;
}

interface PreCheckState {
  missedPunches: PreCheckIssue[];
  absents: PreCheckIssue[];
  nightDuty: PreCheckIssue[];
  skippedCount: number;
}

interface BlockedCorrection {
  employeeCode?: string;
  employeeName?: string;
  date?: string;
  raw?: string;
}

function buildPreCheck(employees: any[], skippedCount = 0): PreCheckState {
  const missedPunches: PreCheckIssue[] = [];
  const absents: PreCheckIssue[] = [];
  const nightDuty: PreCheckIssue[] = [];

  for (const emp of employees || []) {
    const hasIn = !!emp.checkInTime;
    const hasOut = !!emp.checkOutTime;

    if (emp.status == "missed_out") {
      missedPunches.push({
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        shiftCode: emp.shiftCode,
        checkInTime: emp.checkInTime,
        checkOutTime: emp.checkOutTime,
        status: emp.status,
        reason: !hasIn
          ? "Missing check-in"
          : !hasOut
            ? "Missing check-out"
            : "Missed punch flagged",
      });
    }

    if (emp.status === "absent") {
      absents.push({
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        shiftCode: emp.shiftCode,
        checkInTime: emp.checkInTime,
        checkOutTime: emp.checkOutTime,
        status: emp.status,
        reason:
          hasIn || hasOut
            ? "Marked absent but has a punch — verify"
            : "No punches — confirm truly absent",
      });
    }

    if (emp.status == "night_duty") {
      nightDuty.push({
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        shiftCode: emp.shiftCode,
        checkInTime: emp.checkInTime,
        checkOutTime: emp.checkOutTime,
        status: emp.status,
        reason: "Night shift — verify cross-midnight hours",
      });
    }
  }

  return { missedPunches, absents, nightDuty, skippedCount };
}

/**
 * Backend CONFLICT message shape:
 *   "Approval Pending: 1 attendance correction(s) between 2026-09-03 and 2026-09-03
 *    are not approved or rejected yet. Decide them before reprocessing:
 *    1002 SATHEESH KUMAR 2026-09-03. List them with GET /api/attendance/corrections?status=pending."
 *
 * We extract "code NAME date" triplets from the part after "reprocessing:".
 */
function parseBlockedCorrections(message: string): BlockedCorrection[] {
  const result: BlockedCorrection[] = [];
  if (!message) return result;

  const marker = "reprocessing:";
  const idx = message.toLowerCase().indexOf(marker);
  const tail = idx >= 0 ? message.slice(idx + marker.length) : message;

  const trimmed = tail.split(/List them|\.\s*$/i)[0].trim();
  if (!trimmed) return result;

  const pieces = trimmed.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

  for (const p of pieces) {
    const m = p.match(/^(\S+)\s+(.+?)\s+(\d{4}-\d{2}-\d{2})$/);
    if (m) {
      result.push({
        employeeCode: m[1],
        employeeName: m[2].trim(),
        date: m[3],
        raw: p,
      });
    } else if (p) {
      result.push({ raw: p });
    }
  }
  return result;
}

export function ProcessAttendance() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const showSnackbarRef = useRef(showSnackbar);
  showSnackbarRef.current = showSnackbar;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialFromDate =
    searchParams.get("fromDate") ||
    sessionStorage.getItem("attendanceDetailedFromDate") ||
    sessionStorage.getItem("dailyRegisterDate") ||
    dayjs().format("YYYY-MM-DD");
  const initialToDate =
    searchParams.get("toDate") ||
    sessionStorage.getItem("attendanceDetailedToDate") ||
    sessionStorage.getItem("dailyRegisterDate") ||
    initialFromDate;

  // ── Dates ──────────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);   // ← FIX: preserve initialToDate
  const [departmentId, setDepartmentId] = useState("");
  const [workerType, setWorkerType] = useState<WorkerType>("Both");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reprocess, setReprocess] = useState(searchParams.get("reprocess") === "true");

  // ── Process result state ───────────────────────────────────────────────
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCloseOption, setShowCloseOption] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [processStatus, setProcessStatus] = useState<{
    processed: boolean;
    locked: boolean;
    recordCount: number;
    recommendedAction?: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // ── Staged punch state ─────────────────────────────────────────────────
  const [hasStagedPunches, setHasStagedPunches] = useState(false);
  const [isCheckingStagedPunches, setIsCheckingStagedPunches] = useState(true);
  const [stagedPunchCheckFailed, setStagedPunchCheckFailed] = useState(false);
  const canProcessAttendance =
    !hasStagedPunches && !isCheckingStagedPunches && !stagedPunchCheckFailed;

  const [_hasRegisterData, setHasRegisterData] = useState(false);
  const [_isCheckingRegister, setIsCheckingRegister] = useState(true);
  const [_registerCheckFailed, setRegisterCheckFailed] = useState(false);

  const { session } = useAuth();

  // ── Validation ─────────────────────────────────────────────────────────
  const [validationResult, setValidationResult] = useState<ProcessResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // ── Per-date edit / corrections flags ──────────────────────────────────
  const [hasEditsSinceProcess, setHasEditsSinceProcess] = useState(false);
  const [hasPendingCorrections, setHasPendingCorrections] = useState(false);
  const [blockedCorrections, setBlockedCorrections] = useState<BlockedCorrection[]>([]);

  // ── NEW: only allow close when the most recent process actually succeeded ──
  const [lastProcessSucceeded, setLastProcessSucceeded] = useState(false);

  // ── Pre-check dialog ───────────────────────────────────────────────────
  const [preCheck, setPreCheck] = useState<PreCheckState | null>(null);
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [preCheckConfirmed, setPreCheckConfirmed] = useState(false);

  // ── Manual close dialog ────────────────────────────────────────────────
  const [manualCloseOpen, setManualCloseOpen] = useState(false);
  const [manualCloseReason, setManualCloseReason] = useState("");

  // ── Derived: does this date (range) have corrections → force Reprocess ──
  const hasCorrectionsForDate =
    hasPendingCorrections ||
    blockedCorrections.length > 0 ||
    Boolean(processStatus?.processed);

  // Mutually-exclusive buttons
  const showProcessButton =
    !hasCorrectionsForDate &&
    processStatus?.processed !== true &&
    !processStatus?.locked;

  const showReprocessButton =
    hasCorrectionsForDate && !processStatus?.locked;

  // ── Hydrate per-date flags from localStorage ──────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`attendanceEdits:${fromDate}`);
      const parsed = raw ? JSON.parse(raw) : {};
      setHasEditsSinceProcess(Boolean(parsed.hasEditsSinceProcess));
      setHasPendingCorrections(Boolean(parsed.hasPendingCorrections));
    } catch {
      setHasEditsSinceProcess(false);
      setHasPendingCorrections(false);
    }
  }, [fromDate, toDate]);

  // Persist "date has corrections" so a reload doesn't un-gate Process
  useEffect(() => {
    if (hasCorrectionsForDate) {
      try {
        const raw = localStorage.getItem(`attendanceEdits:${fromDate}`) ?? "{}";
        const parsed = JSON.parse(raw);
        localStorage.setItem(
          `attendanceEdits:${fromDate}`,
          JSON.stringify({ ...parsed, hasPendingCorrections: true }),
        );
      } catch { }
    }
  }, [hasCorrectionsForDate, fromDate]);

  // ── Invalidate "success" + "blocked" when target changes ──────────────
  useEffect(() => {
    setLastProcessSucceeded(false);
    setBlockedCorrections([]);
    setShowCloseOption(false);
  }, [fromDate, toDate, workerType, departmentId]);

  // ── Cancel-safe staged-punch check ────────────────────────────────────
  const latestStagedCheck = useRef(0);

  const checkForStagedPunches = useCallback(async () => {
    const requestId = ++latestStagedCheck.current;
    setIsCheckingStagedPunches(true);
    try {
      const stagedPunches = await biometricService.getStagedPunches({
        from: fromDate,
        to: toDate,
      });
      if (requestId !== latestStagedCheck.current) return false;
      const hasStaged = stagedPunches.length > 0;
      setHasStagedPunches(hasStaged);
      setStagedPunchCheckFailed(false);
      if (hasStaged) {
        showSnackbarRef.current(
          "Process, validate, and finalize are unavailable while staged punches exist. Commit them on the Daily Register first.",
          "warning",
        );
      }
      return !hasStaged;
    } catch (err: any) {
      if (requestId !== latestStagedCheck.current) return false;
      setStagedPunchCheckFailed(true);
      showSnackbarRef.current(
        err?.response?.data?.message ?? err?.message ?? "Failed to check staged punches",
        "error",
      );
      return false;
    } finally {
      if (requestId === latestStagedCheck.current) {
        setIsCheckingStagedPunches(false);
      }
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void checkForStagedPunches();
  }, [checkForStagedPunches]);

  // ── Register-data check (informational only — no longer gates Process) ──
  useEffect(() => {
    let cancelled = false;
    const checkRegisterData = async () => {
      setIsCheckingRegister(true);
      setRegisterCheckFailed(false);
      try {
        const response: any = await attendanceService.getRegister({
          startDate: fromDate,
          endDate: toDate,
          departmentId: departmentId || undefined,
        });
        const data = response?.data?.data ?? response?.data;
        const employees = Array.isArray(data) ? data : data?.content ?? [];
        const total = Array.isArray(data)
          ? data.length
          : data?.totalElements ?? employees.length;
        if (!cancelled) setHasRegisterData(total > 0);
      } catch (err: any) {
        if (!cancelled) {
          setHasRegisterData(false);
          setRegisterCheckFailed(true);
          showSnackbarRef.current(
            err?.response?.data?.message ?? err?.message ?? "Failed to check attendance register",
            "error",
          );
        }
      } finally {
        if (!cancelled) setIsCheckingRegister(false);
      }
    };
    void checkRegisterData();
    return () => { cancelled = true; };
  }, [fromDate, toDate, departmentId]);

  // ── Departments ────────────────────────────────────────────────────────
  useEffect(() => {
    departmentService
      .getActiveDepartments()
      .then((res: any) => {
        const data = res.data?.content || res.data || [];
        setDepartments(Array.isArray(data) ? data : []);
      })
      .catch(() => { });
  }, []);

  // ── Range-aware status fetch ──────────────────────────────────────────
  const fetchStatusForRange = useCallback(async () => {
    if (!fromDate || !toDate) return null;

    const fetchOne = async (date: string) => {
      const res: any = await attendanceService.getProcessAttendanceStatus({
        date,
        departmentId: departmentId || undefined,
        workerType: workerType ? workerType.toUpperCase() : undefined,
      });
      return res?.data?.data ?? res?.data ?? null;
    };

    if (fromDate === toDate) return fetchOne(fromDate);

    const days: string[] = [];
    for (let d = dayjs(fromDate); !d.isAfter(dayjs(toDate)); d = d.add(1, "day")) {
      days.push(d.format("YYYY-MM-DD"));
    }
    const results = await Promise.all(days.map((d) => fetchOne(d).catch(() => null)));
    const valid = results.filter(Boolean);
    if (valid.length === 0) return null;
    return {
      processed: valid.every((r: any) => r.processed === true),
      locked: valid.every((r: any) => r.locked === true),
      recordCount: valid.reduce((s: number, r: any) => s + (r.recordCount ?? 0), 0),
    };
  }, [fromDate, toDate, departmentId, workerType]);

  useEffect(() => {
    if (!fromDate || !toDate) {
      setProcessStatus(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoadingStatus(true);
      try {
        const data = await fetchStatusForRange();
        if (!cancelled) {
          setProcessStatus(data ?? null);
          setIsClosed(Boolean(data?.locked));
          // Only re-enable close if status says processed AND we've previously
          // succeeded locally; render still gates on lastProcessSucceeded.
          setShowCloseOption(Boolean(data?.processed && !data?.locked));
        }
      } catch {
        if (!cancelled) setProcessStatus(null);
      } finally {
        if (!cancelled) setIsLoadingStatus(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [fetchStatusForRange, fromDate, toDate]);

  // ── Filter handlers ────────────────────────────────────────────────────
  const clearValidation = () => {
    setValidationResult(null);
    setError(null);
  };

  const handleFromDateChange = (newValue: any, context: any) => {
    if (context.validationError == null) {
      setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
      clearValidation();
    }
  };

  const handleToDateChange = (newValue: any, context: any) => {
    if (context.validationError == null) {
      setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
      clearValidation();
    }
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    clearValidation();
  };

  const handleWorkerTypeChange = (value: WorkerType) => {
    setWorkerType(value);
    clearValidation();
  };

  const clearEditFlags = () => {
    setHasEditsSinceProcess(false);
    try {
      localStorage.setItem(
        `attendanceEdits:${fromDate}`,
        JSON.stringify({ hasEditsSinceProcess: false, hasPendingCorrections: false }),
      );
    } catch { }
  };

  // ── Validate ───────────────────────────────────────────────────────────
  async function handleValidate() {
    if (!(await checkForStagedPunches())) return;
    if (hasPendingCorrections || blockedCorrections.length > 0) {
      showSnackbar("Pending punch corrections must be approved before validating.", "warning");
      return;
    }
    if (processStatus?.locked) {
      showSnackbar("This attendance date is closed and finalized", "warning");
      return;
    }
    if (!fromDate || !toDate) {
      showSnackbar("Please select date range", "warning");
      return;
    }
    if (dayjs(toDate).isBefore(dayjs(fromDate))) {
      showSnackbar("End date must be after start date", "warning");
      return;
    }
    if (dayjs(fromDate).isAfter(dayjs())) {
      showSnackbar("Cannot process future dates", "warning");
      return;
    }
    if (!workerType) {
      showSnackbar("Please select worker type", "warning");
      return;
    }

    setIsValidating(true);
    showSpinner();
    setValidationResult(null);
    setError(null);

    try {
      const res: any = await attendanceService.validateAttendance({
        fromDate,
        toDate,
        departmentId: departmentId || undefined,
        workerType,
        reprocess: reprocess || Boolean(processStatus?.processed),
      });

      const data = res?.data?.data ?? res?.data;
      setValidationResult(data);

      const skippedCount = data.skippedEmployees?.length || 0;
      const readyCount = data.summary?.employeesProcessed || 0;

      if (skippedCount > 0) {
        showSnackbar(
          `${skippedCount} employee(s) have no shift assigned. Please fix before processing.`,
          "warning",
        );
      } else if (readyCount === 0) {
        showSnackbar(
          "No employees found for the selected criteria. Please check your filters.",
          "warning",
        );
      } else {
        showSnackbar(
          `Validation complete. ${readyCount} employee(s) ready for processing.`,
          "success",
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to validate attendance";
      setError(msg);
      showSnackbar(msg, "error");
    } finally {
      setIsValidating(false);
      hideSpinner();
    }
  }

  // ── Process (first-process only) ──────────────────────────────────────
  async function handleProcess() {
    if (!(await checkForStagedPunches())) return;

    // Never allow first-process when corrections exist / already processed
    if (
      hasPendingCorrections ||
      blockedCorrections.length > 0 ||
      processStatus?.processed === true
    ) {
      showSnackbar(
        "This date has pending corrections or was already processed. Use Reprocess Attendance instead.",
        "warning",
      );
      return;
    }
    if (processStatus?.locked) {
      showSnackbar("This attendance date is closed and finalized", "warning");
      return;
    }
    if (!fromDate || !toDate) {
      showSnackbar("Please select date range", "warning");
      return;
    }
    if (dayjs(toDate).isBefore(dayjs(fromDate))) {
      showSnackbar("End date must be after start date", "warning");
      return;
    }
    if (dayjs(fromDate).isAfter(dayjs())) {
      showSnackbar("Cannot process future dates", "warning");
      return;
    }
    if (!workerType) {
      showSnackbar("Please select worker type", "warning");
      return;
    }

    const hasSkippedEmployees =
      validationResult?.skippedEmployees && validationResult.skippedEmployees.length > 0;

    if (hasSkippedEmployees) {
      const skippedNames = validationResult!.skippedEmployees!
        .map((emp) => `• ${emp.employeeName} (${emp.employeeCode})${emp.reason ? ` - ${emp.reason}` : ""}`)
        .join("\n");

      showConfirmDialog({
        title: "⚠️ Warning: Employees Will Be Skipped",
        message:
          `${validationResult!.skippedEmployees!.length} employee(s) will be skipped because they have no shift assigned.\n\n` +
          `Skipped employees:\n${skippedNames}\n\n` +
          `These employees will be marked as absent. Do you want to continue?`,
        confirmText: "Continue Processing",
        cancelText: "Cancel & Fix Shifts",
        onConfirm: async () => {
          await executeProcess(false);
        },
      });
      return;
    }

    if (!validationResult) {
      showConfirmDialog({
        title: "Process Attendance",
        message: `Process attendance for ${
          workerType === "Both" ? "both Staff and Labour" : workerType
        } from ${fromDate} to ${toDate}?`,
        confirmText: "Process",
        cancelText: "Cancel",
        onConfirm: async () => {
          await executeProcess(false);
        },
      });
      return;
    }

    if (validationResult.summary?.employeesProcessed === 0) {
      showSnackbar("No employees ready for processing. Please check your filters.", "warning");
      return;
    }

    showConfirmDialog({
      title: "Process Attendance",
      message:
        `Process attendance for ${
          workerType === "Both" ? "both Staff and Labour" : workerType
        } from ${fromDate} to ${toDate}?\n\n` +
        `${validationResult.summary.employeesProcessed} employees will be processed.`,
      confirmText: "Process",
      cancelText: "Cancel",
      onConfirm: async () => {
        await executeProcess(false);
      },
    });
  }

  // ── Reprocess (only when corrections exist / already processed) ───────
  function handleReprocess() {
    if (processStatus?.locked) {
      showSnackbar("This attendance date is closed and finalized", "warning");
      return;
    }
    if (!hasCorrectionsForDate) {
      showSnackbar(
        "This date has no corrections and has not been processed. Use Process Attendance instead.",
        "warning",
      );
      return;
    }
    if (hasPendingCorrections || blockedCorrections.length > 0) {
      showSnackbar(
        "Approve or reject the pending corrections before reprocessing.",
        "warning",
      );
      return;
    }
    if (!validationResult) {
      showSnackbar("Validate attendance before reprocessing", "warning");
      return;
    }
    if (validationResult.summary?.employeesProcessed === 0) {
      showSnackbar("No employees ready for reprocessing. Please check your filters.", "warning");
      return;
    }
    showConfirmDialog({
      title: "Reprocess Attendance",
      message: `Reprocess attendance for ${
        workerType === "Both" ? "both Staff and Labour" : workerType
      } on ${fromDate}? This will overwrite existing processed records.`,
      confirmText: "Reprocess",
      cancelText: "Cancel",
      onConfirm: async () => {
        setReprocess(true);
        clearValidation();
        await executeProcess(true);
      },
    });
  }

  // ── The actual process API call ───────────────────────────────────────
  async function executeProcess(reprocessOverride = reprocess) {
    if (!(await checkForStagedPunches())) return;
    setProcessing(true);
    setResult(null);
    setError(null);
    setShowCloseOption(false);
    setIsClosed(false);
    setLastProcessSucceeded(false);
    setBlockedCorrections([]);
    showSpinner();

    try {
      const res: any = await attendanceService.processAttendance({
        fromDate,
        toDate,
        departmentId: departmentId || undefined,
        employeeIds: undefined,
        workerType,
        reprocess: reprocessOverride,
      });

      const data = res?.data?.data ?? res?.data;

      // Treat "success:false" inside a 2xx payload as a failure too
      const success = res?.data?.success !== false && data?.success !== false;
      if (!success) {
        const msg = res?.data?.message ?? data?.message ?? "Processing did not succeed";
        setError(msg);
        showSnackbar(msg, "error");
        return;
      }

      setResult(data);
      await refreshProcessStatus();

      // ── NEW: only mark success here → Close & Finalize becomes available ──
      setLastProcessSucceeded(true);
      clearEditFlags();

      const skippedInProcess = data.skippedEmployees?.length || 0;
      const processedCount = data.processed ?? data.summary?.employeesProcessed ?? 0;

      const canClose = !data?.locked && processedCount > 0;
      setIsClosed(Boolean(data?.locked));
      if (canClose) {
        setProcessStatus((current) => ({
          ...(current ?? { recordCount: 0 }),
          processed: true,
          locked: false,
          recordCount: Math.max(current?.recordCount ?? 0, processedCount),
        }));
      }
      setShowCloseOption(canClose);

      if (canClose) {
        showSnackbar(
          `${processedCount} ${
            workerType === "Both" ? "both Staff and Labour" : workerType
          } records processed successfully! ` +
            `${data.summary?.present || 0} present, ${data.summary?.absent || 0} absent. ` +
            (skippedInProcess > 0 ? `${skippedInProcess} employee(s) skipped. ` : "") +
            `Click "Close & Finalize" to lock these records.`,
          "info",
        );
      } else {
        let message =
          `Processed ${processedCount} ${
            workerType === "Both" ? "both Staff and Labour" : workerType
          } records successfully. ` +
          `${data.summary?.present || 0} present, ${data.summary?.absent || 0} absent.`;
        if (skippedInProcess > 0) {
          message += ` ${skippedInProcess} employee(s) were skipped.`;
        }
        showSnackbar(message, "success");
      }
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ?? err?.message ?? "Failed to process attendance";
      setError(msg);

      const errCode =
        err?.response?.data?.error ?? err?.response?.data?.code ?? "";
      const isConflict =
        String(errCode).toUpperCase() === "CONFLICT" ||
        /approval pending/i.test(msg) ||
        /not approved or rejected yet/i.test(msg);

      if (isConflict) {
        const parsed = parseBlockedCorrections(msg);
        setBlockedCorrections(parsed);
        setHasPendingCorrections(true);
        try {
          localStorage.setItem(
            `attendanceEdits:${fromDate}`,
            JSON.stringify({ hasEditsSinceProcess, hasPendingCorrections: true }),
          );
        } catch { }
        showSnackbar(
          "Processing blocked: pending attendance corrections must be approved first.",
          "error",
        );
      } else {
        showSnackbar(msg, "error");
      }
    } finally {
      setProcessing(false);
      hideSpinner();
    }
  }

  async function refreshProcessStatus() {
    if (!fromDate || !toDate) return;
    try {
      const data = await fetchStatusForRange();
      setProcessStatus(data ?? null);
      setIsClosed(Boolean(data?.locked));
      setShowCloseOption(Boolean(data?.processed && !data?.locked));
    } catch {
      // Keep the last known result if the refresh fails.
    }
  }

  // ── Close & Finalize ──────────────────────────────────────────────────
  async function handleCloseAndFinalize() {
    if (!lastProcessSucceeded) {
      showSnackbar(
        "Process attendance successfully before closing & finalizing.",
        "warning",
      );
      return;
    }
    if (!(await checkForStagedPunches())) return;
    if (hasPendingCorrections || blockedCorrections.length > 0) {
      showSnackbar("Resolve pending corrections before closing attendance.", "warning");
      return;
    }
    if (hasEditsSinceProcess) {
      showSnackbar(
        "Punches were edited after processing. Reprocess attendance first, then close.",
        "warning",
      );
      return;
    }
    if (processStatus?.locked) {
      showSnackbar("This attendance date is already closed and finalized", "warning");
      return;
    }

    let skippedCount = result?.skippedEmployees?.length ?? 0;
    let employees: ProcessResult["employees"] = [];

    showSpinner();
    try {
      const registerResponse: any = await attendanceService.getRegister({
        startDate: fromDate,
        endDate: toDate,
        departmentId: departmentId || undefined,
      });
      const registerData = registerResponse?.data?.data ?? registerResponse?.data;
      const registerEmployees = Array.isArray(registerData)
        ? registerData
        : registerData?.content ?? registerData?.records ?? [];
      if (!Array.isArray(registerEmployees) || registerEmployees.length === 0) {
        showSnackbar(
          "No generated attendance records were found in the register for the selected date range.",
          "warning",
        );
        return;
      }

      employees = result?.employees?.length
        ? result.employees
        : registerEmployees.map((employee: any) => ({
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            employeeCode: employee.employeeCode,
            status: employee.status,
            checkInTime: employee.checkInTime ?? undefined,
            checkOutTime: employee.checkOutTime ?? undefined,
            shiftCode: employee.shiftCode ?? "",
          }));
      skippedCount = result?.skippedEmployees?.length ?? 0;
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to verify generated attendance records",
        "error",
      );
      return;
    } finally {
      hideSpinner();
    }

    const pc = buildPreCheck(employees, skippedCount);
    const totalIssues =
      pc.missedPunches.length + pc.absents.length + pc.nightDuty.length;

    if (totalIssues === 0) {
      confirmAndClose(true, skippedCount);
      return;
    }

    setPreCheck(pc);
    setPreCheckConfirmed(false);
    setPreCheckOpen(true);
  }

  function confirmAndClose(
    preCheckDone: boolean,
    skippedCount = result?.skippedEmployees?.length ?? 0,
  ) {
    const hasSkipped = skippedCount > 0;

    showConfirmDialog({
      title: "Close & Finalize Attendance",
      message:
        `Are you sure you want to close attendance for ( ${fromDate} to ${toDate} ) for ${
          workerType === "Both" ? "both Staff and Labour" : workerType
        }? \n\n` +
        `This will lock all records and prevent further modifications. ` +
        (hasSkipped
          ? `${skippedCount} employee(s) were skipped and will remain unprocessed. `
          : "") +
        `This action cannot be undone!`,
      confirmText: "Close & Finalize",
      cancelText: "Cancel",
      onConfirm: async () => {
        if (!(await checkForStagedPunches())) return;
        setProcessing(true);
        showSpinner();
        try {
          const res: any = await attendanceService.processAndCloseAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            workerType,
            reprocess: false,
            lockReason: `End of day processing - ${
              workerType === "Both" ? "both Staff and Labour" : workerType
            }`,
            lockedBy: session?.user.userId || "System",
            preCheckDone,
            preCheckDoneBy: session?.user.email,
            preCheckDoneDateTime: new Date().toISOString(),
          });

          const updatedData = res?.data?.data ?? res?.data;
          setResult((prev) => ({
            ...prev!,
            locked: updatedData.locked || true,
            message: updatedData.message || "Attendance closed successfully",
          }));
          setIsClosed(true);
          setShowCloseOption(false);
          setLastProcessSucceeded(false);
          setBlockedCorrections([]);
          await refreshProcessStatus();

          showSnackbar(
            `Attendance for ${
              workerType === "Both" ? "both Staff and Labour" : workerType
            } closed and finalized successfully!`,
            "success",
          );

          setTimeout(() => {
            void generateFinalizedReports();
          }, 400);
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "Failed to close attendance";
          showSnackbar(msg, "error");
        } finally {
          setProcessing(false);
          hideSpinner();
          setPreCheck(null);
          setPreCheckConfirmed(false);
        }
      },
    });
  }

  async function generateFinalizedReports() {
    try {
      const params = {
        fromDate,
        toDate,
        departmentId: departmentId || undefined,
        workerType,
        format: "pdf",
      };
      const res = await attendanceService.exportDaily(params);
      await apiService.downloadFromPath(
        res.data.fileUrl,
        `Attendance Report ${formatDate(fromDate)} - ${formatDate(toDate)}.pdf`,
      );
      showSnackbar("Attendance report downloaded", "success");
    } catch {
      showSnackbar("Attendance was finalized, but report generation failed", "warning");
    }
  }

  // ── Manual Close — proper dialog, gated on lastProcessSucceeded ───────
  function handleManualClose() {
    if (!lastProcessSucceeded) {
      showSnackbar("Process attendance successfully before closing.", "warning");
      return;
    }
    if (hasPendingCorrections || blockedCorrections.length > 0) {
      showSnackbar("Resolve pending corrections before closing attendance.", "warning");
      return;
    }
    if (hasEditsSinceProcess) {
      showSnackbar("Reprocess attendance before closing.", "warning");
      return;
    }
    if (!result || result.processed === 0) {
      showSnackbar("No processed records to close", "warning");
      return;
    }
    setManualCloseReason("");
    setManualCloseOpen(true);
  }

  async function submitManualClose() {
    const reason = manualCloseReason.trim();
    if (!reason) {
      showSnackbar("Lock reason is required", "warning");
      return;
    }
    if (!(await checkForStagedPunches())) return;

    setManualCloseOpen(false);
    const hasSkipped =
      result?.skippedEmployees && result.skippedEmployees.length > 0;

    showConfirmDialog({
      title: "Close & Finalize Attendance",
      message:
        `Are you sure you want to close attendance for ${fromDate} to ${toDate} for ${
          workerType === "Both" ? "both Staff and Labour" : workerType
        }?` +
        (hasSkipped
          ? `\n\nNote: ${result!.skippedEmployees!.length} employee(s) were skipped and will remain unprocessed.`
          : ""),
      confirmText: "Close",
      cancelText: "Cancel",
      onConfirm: async () => {
        setProcessing(true);
        showSpinner();
        try {
          const res: any = await attendanceService.processAndCloseAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            workerType,
            reprocess: false,
            lockReason: reason,
            lockedBy: session?.user.userId || "System",
            preCheckDone: false,
          });

          const updatedData = res?.data?.data ?? res?.data;
          setResult((prev) => ({
            ...prev!,
            locked: updatedData.locked || true,
            message: updatedData.message || "Attendance closed successfully",
          }));
          setIsClosed(true);
          setShowCloseOption(false);
          setLastProcessSucceeded(false);
          setBlockedCorrections([]);
          await refreshProcessStatus();

          showSnackbar(
            `Attendance for ${
              workerType === "Both" ? "both Staff and Labour" : workerType
            } closed successfully!`,
            "success",
          );
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "Failed to close attendance";
          showSnackbar(msg, "error");
        } finally {
          setProcessing(false);
          hideSpinner();
        }
      },
    });
  }

  return (
    <div className="p-4 space-y-4">
      {/* ────────── Process Configuration ────────── */}
      <div className="bg-white-50 border border-gray-200 rounded-lg p-4">
        <div className="font-semibold text-gray-700 mb-4">Process Configuration</div>

        <div className="flex flex-wrap items-start gap-4">
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              label="From Date"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={handleFromDateChange}
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              slotProps={{ textField: { sx: { width: 170 } } }}
            />
            <DatePicker
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              onChange={handleToDateChange}
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              minDate={fromDate ? dayjs(fromDate) : undefined}
              slotProps={{ textField: { sx: { width: 170 } } }}
            />
          </LocalizationProvider>

          <FormControl sx={{ width: 180 }} required>
            <InputLabel>Worker Type</InputLabel>
            <Select
              value={workerType}
              onChange={(e) => handleWorkerTypeChange(e.target.value as WorkerType)}
              label="Worker Type"
              sx={selectSx}
            >
              {WORKER_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ width: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              label="Department"
              sx={selectSx}
            >
              <MenuItem value="All">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.departmentName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {processStatus && (
            <Chip
              label={
                processStatus.locked
                  ? "Closed & Finalized"
                  : processStatus.processed
                    ? "Processed"
                    : "Not Processed"
              }
              color={
                processStatus.locked ? "success" : processStatus.processed ? "warning" : "default"
              }
              icon={processStatus.locked ? <LockOutlined className="!w-4" /> : undefined}
            />
          )}

          {hasEditsSinceProcess && (
            <Chip
              label="Edits pending — reprocess required"
              color="warning"
              icon={<WarningAmberOutlined className="!w-4" />}
            />
          )}

          {(hasPendingCorrections || blockedCorrections.length > 0) && (
            <Chip
              label="Corrections pending approval"
              color="warning"
              variant="outlined"
              icon={<PendingActionsOutlined className="!w-4" />}
              onClick={() =>  navigate(
                        `/attendance/management/corrections`,
                      )}
            />
          )}
        </div>

        {/* ────────── Chips row ────────── */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Chip
            label={`Worker Type: ${workerType === "Both" ? "Staff and Labour" : workerType}`}
            size="small"
            color={workerType === "Both" ? "primary" : "default"}
            variant="outlined"
            className={`${workerType !== "Both" ? "text-gray-800" : ""}`}
          />
          {departmentId && (
            <Chip
              label={`Dept: ${
                departments.find((d) => d.id === departmentId)?.departmentName || ""
              }`}
              size="small"
              variant="outlined"
              className="text-gray-800"
            />
          )}
          {reprocess && (
            <Chip
              label="Reprocess Mode"
              size="small"
              color="info"
              icon={<WarningAmberOutlined className="!w-3" />}
            />
          )}

          {validationResult && (
            <div className="flex items-center gap-2">
              <Chip
                label={`${validationResult.summary?.employeesProcessed || 0} ready`}
                size="small"
                color="success"
                className="text-green-700 bg-green-50"
              />
              {(validationResult.skippedEmployees?.length || 0) > 0 && (
                <Chip
                  label={`⚠️ ${validationResult.skippedEmployees!.length} skipped`}
                  size="small"
                  color="warning"
                  className="text-amber-700 bg-amber-50"
                />
              )}
              {(validationResult.errors || 0) > 0 && (
                <Chip
                  label={`❌ ${validationResult.errors} errors`}
                  size="small"
                  color="error"
                  className="text-red-700 bg-red-50"
                />
              )}
              <button
                onClick={clearValidation}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          )}

          {/* ────────── Action buttons (mutually exclusive) ────────── */}
          <div className="ml-auto flex gap-2">
            {!processStatus?.locked && canProcessAttendance && (
              <Tooltip
                title="Check the selected attendance for missing shifts and other issues. Validation does not change records."
                arrow
              >
                <span>
                  <button
                    onClick={handleValidate}
                    disabled={
                      isValidating ||
                      processing ||
                      isLoadingStatus ||
                      !workerType ||
                      !canProcessAttendance ||
                      hasPendingCorrections ||
                      blockedCorrections.length > 0
                    }
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <InfoOutlined fontSize="small" />
                    {isValidating ? "Validating..." : "Validate Attendance"}
                  </button>
                </span>
              </Tooltip>
            )}

            {/* ── PROCESS — only for a clean, unprocessed date ── */}
            {showProcessButton && canProcessAttendance && (
              <button
                onClick={handleProcess}
                disabled={
                  processing ||
                  isValidating ||
                  isLoadingStatus ||
                  !workerType ||
                  !canProcessAttendance ||
                  hasPendingCorrections ||
                  blockedCorrections.length > 0
                }
                title={
                  hasPendingCorrections || blockedCorrections.length > 0
                    ? "Pending corrections must be approved first"
                    : undefined
                }
                className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-white rounded text-[12px] font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlayArrowOutlined fontSize="small" />
                {processing || isLoadingStatus ? "Processing..." : "Process Attendance"}
              </button>
            )}

            {/* ── REPROCESS — only for processed / corrected dates ── */}
            {showReprocessButton && canProcessAttendance && (
              <Tooltip
                title={
                  hasEditsSinceProcess
                    ? "You edited punches after processing. Reprocess to apply the changes before finalizing."
                    : hasPendingCorrections || blockedCorrections.length > 0
                      ? "This date has pending corrections. Approve them, then reprocess to apply the changes."
                      : "Recalculate existing attendance. This replaces the current unlocked results."
                }
                arrow
              >
                <span>
                  <button
                    onClick={handleReprocess}
                    disabled={
                      processing ||
                      isValidating ||
                      isLoadingStatus ||
                      !workerType ||
                      !canProcessAttendance ||
                      !validationResult ||
                      hasPendingCorrections ||
                      blockedCorrections.length > 0
                    }
                    className={`flex items-center justify-center gap-2 px-5 py-2 rounded text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      hasEditsSinceProcess || blockedCorrections.length > 0
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    <PlayArrowOutlined fontSize="small" />
                    {hasEditsSinceProcess || blockedCorrections.length > 0
                      ? "Reprocess Required"
                      : "Reprocess Attendance"}
                  </button>
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        <p className="mt-2 text-[11px] text-gray-500">
          Validate checks readiness without saving changes. Reprocess recalculates already
          processed, unlocked records after you have corrected attendance data.
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          {hasCorrectionsForDate
            ? hasPendingCorrections || blockedCorrections.length > 0
              ? "Reprocess is disabled until all pending corrections are approved or rejected."
              : "This date has been processed (or has corrections). Use Reprocess Attendance to apply changes."
            : "This date has not been processed. Use Process Attendance to create the records."}
        </p>

        {hasStagedPunches && (
          <Alert
            severity="warning"
            sx={{ py: 0.5, mt: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(`/attendance/register?date=${fromDate}`)}
              >
                Go to Register
              </Button>
            }
          >
            Staged biometric punches must be committed on the Daily Register before attendance can
            be processed, validated, or finalized.
          </Alert>
        )}

        {stagedPunchCheckFailed && (
          <Alert severity="error" sx={{ py: 0.5, mt: 2 }}>
            Staged punches could not be checked. Processing actions are disabled until the check
            succeeds.
          </Alert>
        )}

        {(hasPendingCorrections || blockedCorrections.length > 0) && (
          <Alert severity="warning" sx={{ py: 0.5, mt: 2 }}>
            Punch corrections are pending approval. Processing is disabled until they are resolved.
          </Alert>
        )}

        {blockedCorrections.length > 0 && (
          <Alert
            severity="error"
            icon={<PendingActionsOutlined fontSize="small" />}
            sx={{ mt: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  navigate(`/attendance/corrections?status=pending&date=${fromDate}`)
                }
              >
                Review Corrections
              </Button>
            }
          >
            <div className="text-[12px]">
              <div className="font-semibold mb-1">
                Processing blocked — {blockedCorrections.length} attendance correction(s) pending
                approval:
              </div>
              <ul className="list-disc ml-4 space-y-0.5">
                {blockedCorrections.map((b, i) => (
                  <li key={i}>
                    {b.employeeCode ?? "-"} {b.employeeName ? `— ${b.employeeName}` : ""}{" "}
                    {b.date ? `(${b.date})` : ""}
                  </li>
                ))}
              </ul>
              <div className="mt-1 text-[11px] opacity-80">
                Approve or reject these corrections before processing attendance.
              </div>
            </div>
          </Alert>
        )}

        {reprocess && !processStatus?.locked && (
          <Alert
            severity="warning"
            icon={<WarningAmberOutlined fontSize="small" />}
            sx={{ py: 0.5, mt: 2 }}
          >
            <span className="text-xs">
              Reprocessing will overwrite existing attendance statuses for the selected period
              and worker type.
            </span>
          </Alert>
        )}

        {processing && (
          <div className="mt-3">
            <LinearProgress color="primary" />
            <div className="text-xs text-gray-500 mt-1 text-center">
              Processing {workerType === "Both" ? "Staff and Labour" : workerType} attendance
              records...
            </div>
          </div>
        )}
      </div>

      {/* ────────── Error Display ────────── */}
      {error && (
        <Alert severity="error">
          <span className="text-[12px]">{error}</span>
        </Alert>
      )}

      {/* ────────── Close & Finalize banner (only after success) ────────── */}
      {showCloseOption &&
        lastProcessSucceeded &&
        canProcessAttendance &&
        !isClosed &&
        !processStatus?.locked &&
        !hasEditsSinceProcess && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <InfoOutlined className="text-amber-600" />
              <span className="text-[12px] text-amber-800">
                Attendance for{" "}
                {workerType === "Both" ? "both Staff and Labour" : workerType} processed for{" "}
                {fromDate} to {toDate}. Click below to close and finalize.
              </span>
            </div>
            <button
              onClick={handleCloseAndFinalize}
              className="px-4 py-1.5 bg-amber-600 text-white rounded text-[12px] font-medium hover:bg-amber-700 transition-colors"
            >
              <LockOutlined fontSize="small" className="mr-1 !w-4" />
              Close & Finalize
            </button>
          </div>
        )}

      {/* ────────── Edits pending → guide to reprocess ────────── */}
      {showCloseOption &&
        lastProcessSucceeded &&
        !isClosed &&
        !processStatus?.locked &&
        hasEditsSinceProcess && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <WarningAmberOutlined className="text-orange-600" />
              <span className="text-[12px] text-orange-800">
                Punches were edited after processing. Click <strong>Reprocess Required</strong>{" "}
                above to apply the changes, then you can close and finalize.
              </span>
            </div>
            <button
              onClick={handleReprocess}
              disabled={
                !validationResult ||
                processing ||
                isValidating ||
                hasPendingCorrections ||
                blockedCorrections.length > 0
              }
              className="px-4 py-1.5 bg-orange-600 text-white rounded text-[12px] font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayArrowOutlined fontSize="small" className="mr-1 !w-4" />
              Reprocess Now
            </button>
          </div>
        )}

      {/* ────────── Absent warning ────────── */}
      {(result?.summary?.absent ?? 0) > 0 && !result?.locked && (
        <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />}>
          <span className="text-xs">
            {result?.summary?.absent} employee(s) marked Absent. Please verify before finalizing —
            some may have missed punches, approved leave, or on-duty records.
          </span>
        </Alert>
      )}

      {/* ────────── Results ────────── */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold flex items-center gap-4 text-gray-700">
              Processing Results
              <span className="ml-2 text-xs font-normal text-gray-500">
                {workerType === "Both" ? "Staff and Labour" : workerType}
              </span>
              {(result.skippedEmployees?.length || 0) > 0 && (
                <span className="text-[12px] font-medium text-red-500 flex items-center gap-2">
                  <WarningAmberOutlined fontSize="small" />
                  {result.skippedEmployees!.length} Employee(s) Skipped
                </span>
              )}
            </div>
            {result.locked && (
              <Chip
                label="Closed & Finalized"
                color="success"
                size="small"
                icon={<LockOutlined />}
              />
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Total Employees",
                value: result.totalEmployees || 0,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Processed",
                value: result.processed || 0,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Skipped",
                value:
                  result.skippedEmployees?.length ||
                  result.skipped ||
                  result.skippedCount ||
                  0,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Errors",
                value: result.errors || 0,
                color: "text-red-600",
                bg: "bg-red-50",
              },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className={`text-xs ${color} mt-0.5`}>{label}</div>
              </div>
            ))}
          </div>

          {/* Attendance Summary Card */}
          {result?.summary && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-semibold text-gray-700">📊 Attendance Summary</h4>
                <span className="text-[10px] text-gray-400">
                  {result.processed} employees processed
                  {(result.skippedEmployees?.length || 0) > 0 &&
                    ` (${result.skippedEmployees!.length} skipped)`}
                </span>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-700">
                    {result.summary?.present || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Present</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                  <div className="text-lg font-bold text-red-700">
                    {result.summary?.absent || 0}
                  </div>
                  <div className="text-[10px] text-red-600 font-medium">Absent</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                  <div className="text-lg font-bold text-amber-700">
                    {result.summary?.late || 0}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium">Late</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
                  <div className="text-lg font-bold text-purple-700">
                    {(result.summary?.leave || 0) + (result.summary?.weeklyOff || 0)}
                  </div>
                  <div className="text-[10px] text-purple-600 font-medium">Leave/Off</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100">
                  <div className="text-lg font-bold text-indigo-700">
                    {result.summary?.holidays || 0}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium">Holidays</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
                  <div className="text-lg font-bold text-pink-700">
                    {result.summary?.earlyOut || 0}
                  </div>
                  <div className="text-[10px] text-pink-600 font-medium">Early Out</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 text-center border border-rose-100">
                  <div className="text-lg font-bold text-rose-400">
                    {result.summary?.missedPunches || 0}
                  </div>
                  <div className="text-[10px] text-rose-400 font-medium">Missed Punches</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
                  <div className="text-lg font-bold text-orange-700">
                    {result.summary?.overtimeHours || 0}h
                  </div>
                  <div className="text-[10px] text-orange-600 font-medium">Overtime</div>
                </div>
              </div>
            </div>
          )}

          {result.message && (
            <Alert severity={result.locked ? "success" : "info"} sx={{ py: 0.5 }}>
              <span className="text-xs">{result.message}</span>
            </Alert>
          )}

          {/* Manual Close — only after success + no edits */}
          {canProcessAttendance &&
            lastProcessSucceeded &&
            !result.locked &&
            !processStatus?.locked &&
            (result.processed ?? 0) > 0 &&
            !showCloseOption &&
            !hasEditsSinceProcess && (
              <div className="flex justify-end">
                <button
                  onClick={handleManualClose}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                >
                  <LockOutlined fontSize="small" className="mr-1" />
                  Close Attendance
                </button>
              </div>
            )}

          {/* Employee Results Table */}
          {result.employees && result.employees.length > 0 && (
            <TableContainer className="max-h-[calc(100vh-300px)]">
              <Table size="small" stickyHeader className="text-[12px] border border-gray-200">
                <TableHead>
                  <TableRow className="bg-head">
                    <TableCell className="!font-bold">S No</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold" align="center">Status</TableCell>
                    <TableCell className="!font-bold" align="center">Check In</TableCell>
                    <TableCell className="!font-bold" align="center">Check Out</TableCell>
                    <TableCell className="!font-bold" align="center">Shift</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.employees.map((emp, i) => (
                    <TableRow key={emp.employeeId} sx={getRowColor(i)}>
                      <TableCell className="text-gray-600 font-mono">{i + 1}</TableCell>
                      <TableCell className="text-gray-600 font-mono">{emp.employeeCode}</TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {emp.employeeName}
                      </TableCell>
                      <TableCell align="center" sx={{ padding: "8px !important" }}>
                        <span
                          className={`px-2 py-0.5 rounded-full m-5 font-medium ${
                            ATTENDANCE_STATUS_BG[emp.status as AttendanceStatus] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ATTENDANCE_STATUS_LABELS[emp.status as AttendanceStatus] ?? emp.status}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        {emp.checkInTime ? formatTimewithSec(emp.checkInTime) : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {emp.checkOutTime ? formatTimewithSec(emp.checkOutTime) : "-"}
                      </TableCell>
                      <TableCell align="center">{emp.shiftCode || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Skipped Employees */}
          {result.skippedEmployees && result.skippedEmployees.length > 0 && (
            <div>
              <div className="text-[12px] font-medium text-amber-600 mb-2 flex items-center gap-2">
                <WarningAmberOutlined fontSize="small" />
                Skipped Employees ({result.skippedEmployees.length})
              </div>
              <TableContainer className="max-h-[300px] border border-gray-200 rounded">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow className="bg-amber-50">
                      <TableCell className="!font-bold">S No</TableCell>
                      <TableCell className="!font-bold">Code</TableCell>
                      <TableCell className="!font-bold">Employee</TableCell>
                      <TableCell className="!font-bold">Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.skippedEmployees.map((emp, i) => (
                      <TableRow key={emp.employeeId} hover sx={getRowColor(i)}>
                        <TableCell>
                          <div className="py-2">{i + 1}</div>
                        </TableCell>
                        <TableCell>{emp.employeeCode}</TableCell>
                        <TableCell>{emp.employeeName}</TableCell>
                        <TableCell className="text-amber-600">
                          {emp.reason || "No shift assigned"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </div>
      )}

      {/* ────────── Validation results ────────── */}
      {validationResult && !processing && !result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-700">
              Validation Results
              <span className="ml-2 text-xs font-normal text-gray-500">
                {workerType === "Both" ? "Staff and Labour" : workerType}
              </span>
            </div>
            <Chip
              label={
                (validationResult.skippedEmployees?.length || 0) === 0
                  ? "Ready to Process"
                  : "Issues Found"
              }
              color={
                (validationResult.skippedEmployees?.length || 0) === 0 ? "success" : "warning"
              }
              size="small"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {validationResult.totalEmployees || 0}
              </div>
              <div className="text-xs text-blue-600">Total Employees</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {validationResult.summary?.employeesProcessed || 0}
              </div>
              <div className="text-xs text-green-600">Ready for Processing</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {validationResult.skippedEmployees?.length || 0}
              </div>
              <div className="text-xs text-amber-600">Will be Skipped</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {validationResult.errors || 0}
              </div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
          </div>

          {validationResult.skippedEmployees &&
            validationResult.skippedEmployees.length > 0 && (
              <div id="skipped-employees">
                <div className="text-[12px] font-medium text-amber-600 mb-2 flex items-center gap-2">
                  <WarningAmberOutlined fontSize="small" />
                  Skipped Employees —{" "}
                  {validationResult.message || "No shift assigned for these employees"}
                </div>
                <TableContainer className="max-h-[200px] border border-gray-200 rounded">
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow className="bg-amber-50">
                        <TableCell className="!font-bold">S No</TableCell>
                        <TableCell className="!font-bold">Employee Code</TableCell>
                        <TableCell className="!font-bold">Employee Name</TableCell>
                        <TableCell className="!font-bold">Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.skippedEmployees.map((emp, i) => (
                        <TableRow key={emp.employeeId} hover sx={getRowColor(i)}>
                          <TableCell>
                            <div className="p-2">{i + 1}</div>
                          </TableCell>
                          <TableCell>{emp.employeeCode}</TableCell>
                          <TableCell>{emp.employeeName}</TableCell>
                          <TableCell className="text-amber-600">
                            {emp.reason || "No shift assigned"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            )}
        </div>
      )}

      {/* ────────── Rules / Info ────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Alert severity="info" sx={{ py: 0.5 }}>
          <span className="text-xs">
            <strong>Processing Rules:</strong>
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              <li>Only dates up to today can be processed</li>
              <li>Staged punches must be committed from the Daily Register first</li>
              <li>If the date has corrections → only <strong>Reprocess</strong> is offered</li>
              <li>If the date is clean → only <strong>Process</strong> is offered</li>
              <li>Pending corrections block both actions until approved</li>
              <li>Edits after processing require a reprocess before close & finalize</li>
              <li>Close & Finalize is enabled only after a successful process call</li>
              <li>Finalised periods must be unlocked before they can be reprocessed</li>
            </ul>
          </span>
        </Alert>
      </div>

      {/* ────────── Pre-Check Dialog ────────── */}
      <Dialog open={preCheckOpen} onClose={() => setPreCheckOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle className="border-b border-gray-200">
          Pre-Close Verification — {formatDate(fromDate)} to {formatDate(toDate)}
          <div className="text-xs text-gray-500 mt-1 font-normal">
            Verify the following records before finalizing. Once locked, records cannot be modified.
          </div>
        </DialogTitle>

        <DialogContent dividers>
          <div className="flex flex-wrap gap-2 mb-4">
            <Chip
              color={preCheck?.missedPunches.length ? "warning" : "success"}
              label={`Missed Punches: ${preCheck?.missedPunches.length ?? 0}`}
            />
            <Chip
              color={preCheck?.absents.length ? "error" : "success"}
              label={`Absents: ${preCheck?.absents.length ?? 0}`}
            />
            <Chip
              color={preCheck?.nightDuty.length ? "info" : "default"}
              label={`Night Duty: ${preCheck?.nightDuty.length ?? 0}`}
              className="text-gray-800 bg-gray-200"
            />
          </div>

          {preCheck && preCheck.missedPunches.length > 0 && (
            <section className="mb-5">
              <div className="font-semibold text-amber-700 mb-2 text-[12px]">
                ⚠️ Missed Punch Records ({preCheck.missedPunches.length})
              </div>
              <TableContainer className="border border-gray-200 rounded max-h-[220px]">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow className="bg-amber-50">
                      <TableCell className="!font-bold">Code</TableCell>
                      <TableCell className="!font-bold">Name</TableCell>
                      <TableCell className="!font-bold">Shift</TableCell>
                      <TableCell className="!font-bold">In</TableCell>
                      <TableCell className="!font-bold">Out</TableCell>
                      <TableCell className="!font-bold">Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preCheck.missedPunches.map((mp, i) => (
                      <TableRow key={mp.employeeId} sx={getRowColor(i)}>
                        <TableCell className="font-mono text-xs">{mp.employeeCode}</TableCell>
                        <TableCell>
                          <div className="p-2">{mp.employeeName}</div>
                        </TableCell>
                        <TableCell>{mp.shiftCode ?? "-"}</TableCell>
                        <TableCell>
                          {mp.checkInTime ? formatTimewithSec(mp.checkInTime) : "-"}
                        </TableCell>
                        <TableCell>
                          {mp.checkOutTime ? formatTimewithSec(mp.checkOutTime) : "-"}
                        </TableCell>
                        <TableCell className="text-amber-600 text-xs">{mp.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </section>
          )}

          {preCheck && preCheck.absents.length > 0 && (
            <section className="mb-5">
              <div className="font-semibold text-red-700 mb-2 text-[12px]">
                🔴 Absent Records — Verify Before Finalizing ({preCheck.absents.length})
              </div>
              <TableContainer className="border border-gray-200 rounded max-h-[220px]">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow className="bg-red-50">
                      <TableCell className="!font-bold">Code</TableCell>
                      <TableCell className="!font-bold">Name</TableCell>
                      <TableCell className="!font-bold">Shift</TableCell>
                      <TableCell className="!font-bold">In</TableCell>
                      <TableCell className="!font-bold">Out</TableCell>
                      <TableCell className="!font-bold">Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preCheck.absents.map((a, i) => (
                      <TableRow
                        key={a.employeeId}
                        sx={getRowColor(i)}
                        className={a.checkInTime || a.checkOutTime ? "bg-amber-50" : ""}
                      >
                        <TableCell className="font-mono text-xs">{a.employeeCode}</TableCell>
                        <TableCell>
                          <div className="p-2">{a.employeeName}</div>
                        </TableCell>
                        <TableCell>{a.shiftCode ?? "-"}</TableCell>
                        <TableCell>
                          {a.checkInTime ? formatTimewithSec(a.checkInTime) : "-"}
                        </TableCell>
                        <TableCell>
                          {a.checkOutTime ? formatTimewithSec(a.checkOutTime) : "-"}
                        </TableCell>
                        <TableCell className="text-red-600 text-xs">{a.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </section>
          )}

          {preCheck && preCheck.nightDuty.length > 0 && (
            <section className="mb-5">
              <div className="font-semibold text-indigo-700 mb-2 text-[12px]">
                🌙 Night Duty Records ({preCheck.nightDuty.length})
              </div>
              <TableContainer className="border border-gray-200 rounded max-h-[220px]">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow className="bg-indigo-50">
                      <TableCell className="!font-bold">Code</TableCell>
                      <TableCell className="!font-bold">Name</TableCell>
                      <TableCell className="!font-bold">Shift</TableCell>
                      <TableCell className="!font-bold">In</TableCell>
                      <TableCell className="!font-bold">Out</TableCell>
                      <TableCell className="!font-bold">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preCheck.nightDuty.map((n) => (
                      <TableRow key={n.employeeId} hover>
                        <TableCell className="font-mono text-xs">{n.employeeCode}</TableCell>
                        <TableCell>{n.employeeName}</TableCell>
                        <TableCell>{n.shiftCode ?? "-"}</TableCell>
                        <TableCell>
                          {n.checkInTime ? formatTimewithSec(n.checkInTime) : "-"}
                        </TableCell>
                        <TableCell>
                          {n.checkOutTime ? formatTimewithSec(n.checkOutTime) : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ATTENDANCE_STATUS_BG[n.status as AttendanceStatus] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ATTENDANCE_STATUS_LABELS[n.status as AttendanceStatus] ?? n.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </section>
          )}

          {preCheck &&
            preCheck.missedPunches.length === 0 &&
            preCheck.absents.length === 0 &&
            preCheck.nightDuty.length === 0 && (
              <Alert severity="success">No exceptions found. Safe to finalize.</Alert>
            )}

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preCheckConfirmed}
                onChange={(e) => setPreCheckConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-amber-900">
                I have reviewed all missed punch, absent, and night duty records above and confirm
                they are accurate. I understand this will lock attendance for{" "}
                <strong>
                  {formatDate(fromDate)} to {formatDate(toDate)}
                </strong>{" "}
                and cannot be undone.
              </span>
            </label>
          </div>
        </DialogContent>

        <DialogActions className="!border-t !border-gray-200">
          <Button
            onClick={() => setPreCheckOpen(false)}
            className="!text-gray-800 !border-gray-200"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setPreCheckOpen(false);
              confirmAndClose(true, preCheck?.skippedCount ?? 0);
            }}
            disabled={!preCheckConfirmed || processing || !canProcessAttendance}
            variant="contained"
            color="success"
          >
            Confirm & Finalize
          </Button>
        </DialogActions>
      </Dialog>

      {/* ────────── Manual Close Dialog ────────── */}
      <Dialog
        open={manualCloseOpen}
        onClose={() => setManualCloseOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="border-b border-gray-200">Close & Finalize Attendance</DialogTitle>
        <DialogContent className="!pt-4 space-y-3">
          <Alert severity="warning">
            Closing locks all records for {fromDate} to {toDate}. This cannot be undone without an
            unlock request.
          </Alert>
          <TextField
            label="Reason for closing"
            value={manualCloseReason}
            onChange={(e) => setManualCloseReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={2}
            autoFocus
          />
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200">
          <Button
            variant="outlined"
            onClick={() => setManualCloseOpen(false)}
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={!manualCloseReason.trim() || processing}
            onClick={() => void submitManualClose()}
          >
            {processing ? "Closing..." : "Close & Finalize"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}