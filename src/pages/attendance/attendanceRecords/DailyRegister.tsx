import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  Alert,
  Chip,
  Box,
  LinearProgress,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  LoginOutlined,
  LogoutOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  FilterListOutlined,
  GroupOutlined,
  EventNoteOutlined,
  CloseOutlined,
  InfoOutlined,
  CloudUploadOutlined,
  PunchClockOutlined,
  InsertDriveFileOutlined,
  Add,
  PlaylistAddCheckCircleOutlined,
  DownloadOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
  PendingActionsOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_BG,
  formatTimewithSec,
  type InlineDisplayProps,
  type RegisterEmployee,
  type TodaySummary,
  type Holiday,
  STATUS_CHIP_OPTIONS,
  inlineInputSx,
} from "../const";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import type { Department, Branches, Employee } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { DateTimePicker } from "@mui/x-date-pickers";
import { useAuth } from "../../../auth/authContext";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { NotificationsActiveOutlined } from "@mui/icons-material";
import { readExcelFile } from "../../../utils/timeStampFormatter";
import { biometricService, type BiometricDevice } from "../../../services/modules/biometricDevice";
import { formatDateTime } from "../../../utils/dateFormatter";
import { employeeService } from "../../../services/modules/employees";
import { formatDate } from "../../leave/leaveFormatters";

function InlineDisplay({
  value,
  placeholder = "-",
  className = "",
  onClick,
  disabled = false,
}: InlineDisplayProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      title={disabled ? undefined : "Click to edit"}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`min-w-[70px] text-[12px] px-1 py-0.5 rounded transition-colors ${disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-300"
        } ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  );
}

export function DailyRegister() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const getInitialRegisterDate = () =>
    sessionStorage.getItem("dailyRegisterDate") ?? dayjs().format("YYYY-MM-DD");
  const [date, setDate] = useState(getInitialRegisterDate);
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employees, setEmployees] = useState<RegisterEmployee[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const { session } = useAuth();

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline edit tracking
  const [inlineEditInProgress, setInlineEditInProgress] = useState<string | null>(null);

  // Which inline cell is currently open for editing.
  // Key format: `${employeeId}:${field}` where field is
  // 'checkInDate' | 'checkInTime' | 'checkOutDate' | 'checkOutTime'
  const [editingField, setEditingField] = useState<string | null>(null);

  // Local draft value held while the picker is open. This is what makes the
  // picker actually editable — we never bind the picker to the server value.
  const [draftDateTime, setDraftDateTime] = useState<any | null>(null);

  const editKey = (employeeId: string, field: string) => `${employeeId}:${field}`;
  const isEditingField = (employeeId: string, field: string) =>
    editingField === editKey(employeeId, field);

  const openField = (
    employeeId: string,
    field: string,
    initial?: dayjs.Dayjs | null,
  ) => {
    setEditingField(editKey(employeeId, field));
    setDraftDateTime(initial ?? null);
  };

  const closeField = () => {
    setEditingField(null);
    setDraftDateTime(null);
  };

  // Correction dialog state
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [pendingCorrection, setPendingCorrection] = useState<{
    employee: RegisterEmployee;
    changes: Partial<{
      checkInDate: string;
      checkInTime: string;
      checkOutDate: string;
      checkOutTime: string;
    }>;
  } | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Check-in / Check-out dialog
  const [punchDialogOpen, setPunchDialogOpen] = useState(false);
  const [punchType, setPunchType] = useState<"checkIn" | "checkOut">("checkIn");
  const [punchEmployee, setPunchEmployee] = useState<RegisterEmployee | null>(null);
  const [punchTime, setPunchTime] = useState("");
  const [punchRemarks, setPunchRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk status dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [bulkCheckinOpen, setBulkCheckinOpen] = useState(false);
  const [bulkCheckinEmployees, setBulkCheckinEmployees] = useState<any[]>([]);
  const [bulkCheckinTime, setBulkCheckinTime] = useState(dayjs().toISOString());
  const [bulkCheckinRemarks, setBulkCheckinRemarks] = useState("");
  const [bulkCheckinSubmitting, setBulkCheckinSubmitting] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const [bulkActionType, setBulkActionType] = useState<"checkIn" | "checkOut">("checkIn");
  const [bulkCheckoutTime, setBulkCheckoutTime] = useState(dayjs().toISOString());
  const [bulkCheckoutRemarks, setBulkCheckoutRemarks] = useState("");
  const [bulkCheckoutSubmitting, setBulkCheckoutSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [bulkActionResult, setBulkActionResult] = useState<{
    open: boolean;
    type: "checkIn" | "checkOut";
    total: number;
    success: number;
    skipped: number;
    errors: number;
    results: any[];
    checkoutTime?: string;
  } | null>(null);

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState<"check_in" | "check_out" | "attendance">("check_in");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [employeesToRem, setEmployeesToRem] = useState<any[]>([]);
  const [sendVia, setSendVia] = useState(["email"]);
  const [importSource, setImportSource] = useState("biometric");
  const [importStartDate, setImportStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importEndDate, setImportEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importType, setImportType] = useState<"daywise" | "weekwise" | "monthwise">("daywise");

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectAllDevices, setSelectAllDevices] = useState(false);
  const [punchImportFromDate, setPunchImportFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [punchImportToDate, setPunchImportToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [deviceImportLoading, setDeviceImportLoading] = useState(false);

  useEffect(() => {
    if (date) {
      sessionStorage.setItem("dailyRegisterDate", date);
      window.dispatchEvent(new Event("attendance-date-changed"));
    }
  }, [date]);

  useEffect(() => {
    if (!date) return;
    const fetchProcessStatus = async () => {
      try {
        await attendanceService.getProcessAttendanceStatus({
          date,
          departmentId: departmentId === "All" ? undefined : departmentId || undefined,
        });
      } catch {
        // Advisory only
      }
    };
    fetchProcessStatus();
  }, [date, departmentId]);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await attendanceService.getRegister({
        startDate: date,
        endDate: date,
        departmentId: departmentId === "All" ? undefined : departmentId,
        branchId: branchId || undefined,
        status: statusFilter || undefined,
      });
      const data = res?.data?.data ?? res?.data;
      const employeesData = Array.isArray(data) ? data : (data?.content ?? []);
      setEmployees(employeesData);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load daily register", "error");
    } finally {
      setLoading(false);
    }
  }, [date, departmentId, branchId, statusFilter]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[] | any[];
    rows: any[];
  } | null>(null);

  const [punchImportOpen, setPunchImportOpen] = useState(false);
  const [punchSource, setPunchSource] = useState("manual");
  const [punchEntries, setPunchEntries] = useState<any[]>([]);
  const [punchImporting, setPunchImporting] = useState(false);
  const [punchImportResult, setPunchImportResult] = useState<any>(null);
  const [deviceFetchSummary, setDeviceFetchSummary] = useState({
    total: 0,
    matched: 0,
    unknown: 0,
  });
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);

  const loadTodaySummary = useCallback(async () => {
    try {
      const res: any = await attendanceService.getToday({ date });
      const data = res?.data?.data ?? res?.data;
      setTodaySummary(data ?? null);
    } catch (err: any) {
      showSnackbar(err.message, "error");
    }
  }, [date]);

  const loadHolidays = useCallback(async () => {
    try {
      const d = dayjs(date);
      const res: any = await attendanceService.getHolidays({
        year: d.year(),
        month: d.month() + 1,
      });
      const data = res?.data?.holidays ?? res?.data;
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showSnackbar(err.message, "error");
    }
  }, [date]);

  useEffect(() => {
    loadRegister();
  }, [loadRegister]);

  useEffect(() => {
    loadTodaySummary();
  }, [loadTodaySummary]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  useEffect(() => {
    Promise.all([
      departmentService.getActiveDepartments(),
      branchService.getActiveBranches(),
      biometricService.getAllDevices(),
      employeeService.getEmployees({ includeInactive: true, size: 10000 }),
    ])
      .then(([depRes, branRes, devRes, empRes]: any[]) => {
        setDepartments(
          Array.isArray(depRes.data?.content || depRes.data)
            ? depRes.data?.content || depRes.data
            : [],
        );
        setBranches(
          Array.isArray(branRes.data?.content || branRes.data)
            ? branRes.data?.content || branRes.data
            : [],
        );
        setDevices(
          Array.isArray(devRes.data?.content || devRes.data || devRes)
            ? devRes.data?.content || devRes.data || devRes
            : [],
        );
        setEmployeesData(
          Array.isArray(empRes.data?.content || empRes.data || empRes)
            ? empRes.data?.content || empRes.data || empRes
            : [],
        );
      })
      .catch(() => { });
  }, []);

  const todayHoliday = holidays.find((h) => h.date === date);

  // ── Punch dialog ──────────────────────────────────────────────────────────
  function openPunch(emp: RegisterEmployee, type: "checkIn" | "checkOut") {
    setPunchEmployee(emp);
    setPunchType(type);
    setPunchTime(dayjs(`${date}T00:00:00`).toISOString());
    setPunchRemarks("");
    setPunchDialogOpen(true);
  }

  async function submitPunch() {
    if (!punchEmployee || !punchTime) return;
    if (!isValidPunchTime(punchTime)) {
      showSnackbar("Please select a valid time before confirming", "warning");
      return;
    }

    setSubmitting(true);
    try {
      if (punchType === "checkIn") {
        await attendanceService.checkIn({
          employeeId: punchEmployee.employeeId,
          checkInTime: punchTime,
          markedBy: session?.user.userId,
          remarks: punchRemarks || undefined,
        });
      } else {
        await attendanceService.checkOut({
          employeeId: punchEmployee.employeeId,
          checkOutTime: punchTime,
          markedBy: session?.user.userId,
          remarks: punchRemarks || undefined,
        });
      }
      showSnackbar(
        `${punchType === "checkIn" ? "Check-in" : "Check-out"} marked for ${punchEmployee.employeeName}`,
        "success",
      );
      setPunchDialogOpen(false);
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to mark attendance",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Inline Edit Helpers ───────────────────────────────────────────────────
  function needsApproval(emp: RegisterEmployee): boolean {
    return !!(emp.checkInTime && emp.checkOutTime);
  }

  async function handleInlineCheckInDateChange(
    emp: RegisterEmployee,
    newDate: string,
    newTime: string,
  ) {
    if (inlineEditInProgress) return;
    setInlineEditInProgress(emp.employeeId);
    showSpinner();
    try {
      const newCheckInTime = dayjs(`${newDate}T${newTime}`).toISOString();
      await attendanceService.checkIn({
        employeeId: emp.employeeId,
        checkInTime: newCheckInTime,
        markedBy: session?.user?.userId,
        remarks: "Inline check-in update",
      });
      showSnackbar(`Check-in updated for ${emp.employeeName}`, "success");
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to update check-in", "error");
    } finally {
      setInlineEditInProgress(null);
      hideSpinner();
    }
  }

  async function handleInlineCheckOutDateChange(
    emp: RegisterEmployee,
    newDate: string,
    newTime: string,
  ) {
    if (inlineEditInProgress) return;
    if (!emp.checkInTime) {
      showSnackbar("Please mark check-in first", "warning");
      return;
    }
    setInlineEditInProgress(emp.employeeId);
    showSpinner();
    try {
      const newCheckOutTime = dayjs(`${newDate}T${newTime}`).toISOString();
      if (dayjs(newCheckOutTime).isBefore(dayjs(emp.checkInTime))) {
        showSnackbar("Check-out cannot be before check-in", "warning");
        return;
      }
      await attendanceService.checkOut({
        employeeId: emp.employeeId,
        checkOutTime: newCheckOutTime,
        markedBy: session?.user?.userId,
        remarks: "Inline check-out update",
      });
      showSnackbar(`Check-out updated for ${emp.employeeName}`, "success");
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to update check-out", "error");
    } finally {
      setInlineEditInProgress(null);
      hideSpinner();
    }
  }

  async function handleInlineCheckInTimeChange(emp: RegisterEmployee, newCheckInTime: string) {
    if (inlineEditInProgress) return;

    if (dayjs(newCheckInTime).isAfter(dayjs())) {
      showSnackbar("Check-in time cannot be in the future", "warning");
      return;
    }

    if (needsApproval(emp)) {
      requestCorrection(emp, { checkInTime: newCheckInTime });
      return;
    }

    setInlineEditInProgress(emp.employeeId);
    showSpinner();
    try {
      await attendanceService.checkIn({
        employeeId: emp.employeeId,
        checkInTime: newCheckInTime,
        markedBy: session?.user?.userId,
        remarks: "Inline check-in time update",
      });

      showSnackbar(`Check-in updated for ${emp.employeeName}`, "success");
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to update check-in",
        "error",
      );
    } finally {
      setInlineEditInProgress(null);
      hideSpinner();
    }
  }

  async function handleInlineCheckOutTimeChange(emp: RegisterEmployee, newCheckOutTime: string) {
    if (inlineEditInProgress) return;

    if (dayjs(newCheckOutTime).isAfter(dayjs())) {
      showSnackbar("Check-out time cannot be in the future", "warning");
      return;
    }

    if (emp.checkInTime && dayjs(newCheckOutTime).isBefore(dayjs(emp.checkInTime))) {
      showSnackbar("Check-out time cannot be before check-in time", "warning");
      return;
    }

    if (!emp.checkInTime) {
      showSnackbar("Please mark check-in first before marking check-out", "warning");
      return;
    }

    if (needsApproval(emp)) {
      requestCorrection(emp, { checkOutTime: newCheckOutTime });
      return;
    }

    setInlineEditInProgress(emp.employeeId);
    showSpinner();
    try {
      await attendanceService.checkOut({
        employeeId: emp.employeeId,
        checkOutTime: newCheckOutTime,
        markedBy: session?.user?.userId,
        remarks: "Inline check-out",
      });

      showSnackbar(`Check-out marked for ${emp.employeeName}`, "success");
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to mark check-out",
        "error",
      );
    } finally {
      setInlineEditInProgress(null);
      hideSpinner();
    }
  }

  function requestCorrection(
    emp: RegisterEmployee,
    changes: Partial<{
      checkInDate: string;
      checkInTime: string;
      checkOutDate: string;
      checkOutTime: string;
    }>,
  ) {
    setPendingCorrection({ employee: emp, changes });
    setCorrectionReason("");
    setCorrectionDialogOpen(true);
  }

  async function submitCorrection() {
    if (!pendingCorrection) return;
    if (!correctionReason.trim()) {
      showSnackbar("Please provide a reason for the correction", "warning");
      return;
    }

    const { employee: emp, changes } = pendingCorrection;

    const buildDateTime = (
      datePart: string | undefined,
      timePart: string | undefined,
      fallbackDate: string | undefined,
      fallbackTime: string | null,
    ): string => {
      if (timePart && timePart.includes("T") && dayjs(timePart).isValid()) {
        return dayjs(timePart).toISOString();
      }
      const effectiveDate = datePart ?? fallbackDate;
      if (!effectiveDate) return "";
      const effectiveTime = timePart
        ? dayjs(timePart).format("HH:mm:ss")
        : fallbackTime
          ? dayjs(fallbackTime).format("HH:mm:ss")
          : "00:00:00";
      return dayjs(`${effectiveDate}T${effectiveTime}`).toISOString();
    };

    const requestedCheckIn =
      buildDateTime(
        changes.checkInDate,
        changes.checkInTime,
        emp.checkInDate,
        emp.checkInTime,
      ) || (emp.checkInTime ?? "");

    const requestedCheckOut =
      buildDateTime(
        changes.checkOutDate,
        changes.checkOutTime,
        emp.checkOutDate,
        emp.checkOutTime,
      ) || (emp.checkOutTime ?? "");

    const payload = {
      employeeId: emp.employeeId,
      attendanceDate: date,
      currentCheckIn: emp.checkInTime ?? null,
      currentCheckOut: emp.checkOutTime ?? null,
      requestedCheckIn,
      requestedCheckOut,
      reason: correctionReason.trim(),
      supportingDocument: undefined,
    };

    setSubmittingCorrection(true);
    showSpinner();
    try {
      await attendanceService.requestCorrection(payload);

      showSnackbar(
        `Correction request submitted for ${emp.employeeName}. Pending approval.`,
        "success",
      );

      setCorrectionDialogOpen(false);
      setPendingCorrection(null);
      setCorrectionReason("");
      loadRegister();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to submit correction request",
        "error",
      );
    } finally {
      setSubmittingCorrection(false);
      hideSpinner();
    }
  }

  // ── Bulk daily status ─────────────────────────────────────────────────────
  async function submitBulkStatus() {
    if (selected.size === 0) {
      showSnackbar("Select at least one employee", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await attendanceService.postDailyStatus({
        processDate: date,
        employeeIds: Array.from(selected),
        remarks: bulkRemarks || undefined,
      } as any);
      showSnackbar(`Daily status posted for ${selected.size} employees`, "success");
      setBulkDialogOpen(false);
      setBulkRemarks("");
      setSelected(new Set());
      loadRegister();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to post daily status",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Bulk process ──────────────────────────────────────────────────────────
  async function handleBulkProcess() {
    if (selected.size === 0) {
      showSnackbar("Select at least one employee", "warning");
      return;
    }
    showConfirmDialog({
      title: "Bulk Process Attendance",
      message: `Process attendance for ${selected.size} selected employee(s) on ${dayjs(date).format("DD MMM YYYY")}?`,
      confirmText: "Process",
      onConfirm: async () => {
        showSpinner();
        try {
          await attendanceService.bulkProcess({
            processDate: date,
            employeeIds: Array.from(selected),
          });
          showSnackbar(`Attendance processed for ${selected.size} employees`, "success");
          setSelected(new Set());
          loadRegister();
        } catch (err: any) {
          showSnackbar(
            err?.response?.data?.message ?? "Failed to bulk process",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  }

  // ── Bulk Check-in ──────────────────────────────────────────────────────────
  async function submitBulkCheckin(employeesToCheckin = bulkCheckinEmployees) {
    if (employeesToCheckin.length === 0) {
      showSnackbar("Select at least one employee", "warning");
      return;
    }

    setBulkCheckinSubmitting(true);
    showSpinner();
    try {
      const response: any = await attendanceService.bulkCheckin({
        employeeIds: employeesToCheckin.map((e) => e.employeeId),
        checkinTime: bulkCheckinTime,
        reason: bulkCheckinRemarks,
        markedBy: session?.user.userId || "system",
      });
      const data = response?.data?.data ?? response?.data;
      setBulkActionResult({
        open: true,
        type: "checkIn",
        total: data.total || 0,
        success: data.checkedIn || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
        results: data.results || [],
      });
      showSnackbar(
        `Bulk check-in completed: ${data.checkedIn || 0} successful, ${data.skipped || 0} skipped`,
        data.errors > 0 ? "warning" : "success",
      );
      setBulkCheckinEmployees([]);
      setBulkCheckinRemarks("");
      setBulkCheckinOpen(false);
      setSelectAllChecked(false);
      setSelected(new Set());
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Bulk check-in failed",
        "error",
      );
    } finally {
      setBulkCheckinSubmitting(false);
      hideSpinner();
    }
  }

  async function submitBulkCheckout(employeesToCheckout = bulkCheckinEmployees) {
    if (employeesToCheckout.length === 0) {
      showSnackbar("Select at least one employee", "warning");
      return;
    }
    setBulkCheckoutSubmitting(true);
    showSpinner();
    try {
      const response: any = await attendanceService.bulkCheckOut({
        employeeIds: employeesToCheckout.map((e) => e.employeeId),
        checkoutTime: bulkCheckoutTime,
        reason: bulkCheckoutRemarks,
        markedBy: session?.user.userId || "system",
      });
      const data = response?.data?.data ?? response?.data;
      setBulkActionResult({
        open: true,
        type: "checkOut",
        total: data.total || 0,
        success: data.checkedOut || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
        results: data.results || [],
        checkoutTime: data.checkoutTime,
      });

      showSnackbar(
        `Bulk check-out completed: ${data.checkedOut || 0} successful, ${data.skipped || 0} skipped`,
        data.errors > 0 ? "warning" : "success",
      );
      setBulkCheckinEmployees([]);
      setBulkCheckoutRemarks("");
      setBulkCheckinOpen(false);
      setSelectAllChecked(false);
      setSelected(new Set());
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Bulk check-out failed",
        "error",
      );
    } finally {
      setBulkCheckoutSubmitting(false);
      hideSpinner();
    }
  }

  // ── Selection Handlers ────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const selectable = employees.filter((e) => e.status !== "leave");
    if (selected.size === selectable.length && selectable.length > 0) {
      setSelected(new Set());
      setSelectAllChecked(false);
    } else {
      setSelected(new Set(selectable.map((e) => e.employeeId)));
      setSelectAllChecked(true);
    }
  }

  // ── Reminder Handlers ────────────────────────────────────────────────────
  async function handleSendReminders() {
    if (!reminderMessage.trim()) {
      showSnackbar("Please enter a reminder message", "warning");
      return;
    }

    const employeeIds = employeesToRem
      .map((e: any) => e.employeeId ?? e.id)
      .filter(Boolean);

    if (employeeIds.length === 0) {
      showSnackbar("No valid employees selected", "warning");
      return;
    }

    setSendingReminders(true);
    showSpinner();
    try {
      await attendanceService.sendReminders({
        recipientType: reminderType,
        reminderMessage: reminderMessage,
        employeeIds,
        sendVia: sendVia,
      });
      showSnackbar(`Reminders sent successfully`, "success");
      setReminderDialogOpen(false);
      setReminderMessage("");
      setEmployeesToRem([]);
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to send reminders",
        "error",
      );
    } finally {
      setSendingReminders(false);
      hideSpinner();
    }
  }

  const handleSendViaChange = (event: any) => {
    const value = event.target.value;
    if (value.length === 0) {
      showSnackbar("Please select at least one channel", "warning");
      return;
    }
    setSendVia(value);
  };

  async function handleImportFile() {
    if (!importFile) {
      showSnackbar("Please select a file to import", "warning");
      return;
    }
    if (!importStartDate || !importEndDate) {
      showSnackbar("Please select date range", "warning");
      return;
    }
    if (dayjs(importEndDate).isBefore(dayjs(importStartDate))) {
      showSnackbar("End date must be after start date", "warning");
      return;
    }
    setImporting(true);
    setImportResult(null);
    showSpinner();
    try {
      const extension = importFile.name.split(".").pop()?.toLowerCase();
      let format = "csv";
      if (extension === "xlsx" || extension === "xls") {
        format = "excel";
      } else if (extension === "txt" || extension === "csv") {
        format = "csv";
      }
      let fileToUpload = importFile;
      if (format === "excel") {
        try {
          const excelData = await readExcelFile(importFile);
          if (!excelData || excelData.length === 0) {
            showSnackbar("No data found in the Excel file", "warning");
            return;
          }
          const headers = Object.keys(excelData[0]);
          const employeeCodeKey =
            headers.find((h) =>
              [
                "employee code",
                "employeecode",
                "employee",
                "emp code",
                "empcode",
                "code",
                "employee id",
                "employeeid",
                "empid",
                "id",
              ].some(
                (key) =>
                  h.toLowerCase().replace(/\s/g, "") === key.replace(/\s/g, "") ||
                  h.toLowerCase().includes(key.toLowerCase()),
              ),
            ) || headers[0];
          const timestampKey =
            headers.find((h) =>
              [
                "timestamp",
                "time",
                "date",
                "datetime",
                "punch time",
                "punchtime",
                "checkin time",
                "checkintime",
              ].some(
                (key) =>
                  h.toLowerCase().replace(/\s/g, "") === key.replace(/\s/g, "") ||
                  h.toLowerCase().includes(key.toLowerCase()),
              ),
            ) || headers[1];
          const rows: any[] = [];
          let errorCount = 0;
          for (const row of excelData) {
            let employeeCode = row[employeeCodeKey] || "";
            let timestamp = row[timestampKey] || "";
            if (!employeeCode && !timestamp) continue;
            let formattedTimestamp = "";
            if (timestamp) {
              let parsed = dayjs(timestamp);
              if (typeof timestamp === "number" && !parsed.isValid()) {
                const excelEpoch = dayjs("1899-12-30");
                parsed = excelEpoch.add(timestamp, "day");
              }
              if (parsed.isValid()) {
                formattedTimestamp = parsed.utc().toISOString();
              } else {
                const formats = [
                  "YYYY-MM-DD HH:mm:ss",
                  "YYYY-MM-DD HH:mm",
                  "YYYY-MM-DD",
                  "DD/MM/YYYY HH:mm:ss",
                  "DD/MM/YYYY HH:mm",
                  "DD/MM/YYYY",
                  "MM/DD/YYYY HH:mm:ss",
                  "MM/DD/YYYY HH:mm",
                  "MM/DD/YYYY",
                ];
                let found = false;
                for (const fmt of formats) {
                  const parsed2 = dayjs(timestamp, fmt);
                  if (parsed2.isValid()) {
                    formattedTimestamp = parsed2.utc().toISOString();
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  errorCount++;
                  continue;
                }
              }
            }

            if (employeeCode && formattedTimestamp) {
              rows.push({
                employeeCode: employeeCode.toString().trim(),
                timestamp: formattedTimestamp,
              });
            }
          }
          if (rows.length === 0) {
            showSnackbar("No valid records found in the Excel file", "warning");
            return;
          }

          const csvHeader = "employeeCode,timestamp";
          const csvRows = rows.map((row) => `${row.employeeCode},${row.timestamp}`);
          const csvContent = [csvHeader, ...csvRows].join("\n");

          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          fileToUpload = new File([blob], `import_${dayjs().format("YYYY-MM-DD")}.csv`, {
            type: "text/csv",
            lastModified: new Date().getTime(),
          });

          format = "csv";
        } catch (error) {
          showSnackbar(
            "Failed to read Excel file. Please ensure it's a valid Excel file.",
            "error",
          );
          return;
        }
      }

      const params = {
        format: format,
        source: importSource,
        type: importType,
        startDate: importStartDate,
        endDate: importEndDate,
      };
      const res: any = await attendanceService.importAttendanceFile(params, fileToUpload);
      const data = res?.data?.data ?? res?.data;

      if (data) {
        const totalPunches = data.totalPunches || 0;
        const errorCount = data.errors || 0;
        const successCount = totalPunches - errorCount;

        const errorMessages: string[] = [];
        if (data.rows && Array.isArray(data.rows)) {
          data.rows.forEach((row: any) => {
            if (row.message && row.message !== "imported" && row.message !== "success") {
              const errorMsg = row.employeeCode
                ? `${row.employeeCode}: ${row.message}`
                : row.message;
              errorMessages.push(errorMsg);
            }
          });
        }

        if (errorCount > 0 && successCount === 0) {
          showSnackbar(
            `All ${totalPunches} records failed to import. Please check the format.`,
            "error",
          );
        } else if (errorCount > 0) {
          showSnackbar(
            `Imported with ${errorCount} error(s). ${successCount} successful.`,
            "warning",
          );
        } else {
          showSnackbar(
            `Successfully imported ${totalPunches} attendance records`,
            "success",
          );
        }

        setImportResult({
          success: successCount,
          failed: errorCount,
          errors: errorMessages,
          rows: data.rows || [],
        });

        if (successCount > 0) {
          loadRegister();
          loadTodaySummary();
        }
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to import attendance";
      showSnackbar(errorMessage, "error");
      setImportResult({
        success: 0,
        failed: 1,
        errors: [errorMessage],
        rows: [],
      });
    } finally {
      setImporting(false);
      hideSpinner();
    }
  }

  async function handlePreviewFile() {
    if (!importFile) {
      showSnackbar("Please select a file first", "warning");
      return;
    }
    try {
      const extension = importFile.name.split(".").pop()?.toLowerCase();
      let preview: any = [];

      if (extension === "xlsx" || extension === "xls") {
        const excelData = await readExcelFile(importFile);
        if (excelData && excelData.length > 0) {
          const headers = Object.keys(excelData[0]);
          const employeeCodeKey =
            headers.find(
              (h) =>
                h.toLowerCase().includes("employee") ||
                h.toLowerCase().includes("emp") ||
                h.toLowerCase().includes("code"),
            ) || headers[0];
          const timestampKey =
            headers.find(
              (h) =>
                h.toLowerCase().includes("timestamp") ||
                h.toLowerCase().includes("time") ||
                h.toLowerCase().includes("date"),
            ) || headers[1];

          preview = excelData.slice(0, 5).map((row: any) => {
            const employeeCode = row[employeeCodeKey] || "N/A";
            const originalTimestamp = row[timestampKey] || "N/A";

            let formattedTimestamp = "N/A";
            let isValid = false;

            if (originalTimestamp !== "N/A" && originalTimestamp) {
              const parsed = dayjs(originalTimestamp);
              if (parsed.isValid()) {
                formattedTimestamp = parsed.toISOString();
                isValid = true;
              } else {
                const parsed2 = dayjs(originalTimestamp, [
                  "YYYY-MM-DD HH:mm:ss",
                  "YYYY-MM-DD HH:mm",
                  "YYYY-MM-DD",
                ]);
                if (parsed2.isValid()) {
                  formattedTimestamp = parsed2.toISOString();
                  isValid = true;
                } else {
                  formattedTimestamp = `Invalid format: ${originalTimestamp}`;
                }
              }
            }

            return {
              employeeCode: String(employeeCode),
              originalTimestamp: String(originalTimestamp),
              formattedTimestamp,
              isValid,
            };
          });
        }
      }

      setPreviewData(preview);
      if (preview.length === 0) {
        showSnackbar("No valid data rows found in the file", "warning");
      } else {
        showSnackbar(`Preview loaded with ${preview.length} rows`, "success");
      }
    } catch (error) {
      showSnackbar("Failed to preview file. Please check the file format.", "error");
    }
  }

  // ── Punch Import Handlers ────────────────────────────────────────────────
  function addPunchEntry() {
    setPunchEntries([
      ...punchEntries,
      {
        id: Date.now().toString(),
        employeeId: "",
        employeeCode: "",
        employeeName: "",
        employeeData: null,
        timestamp: dayjs().toISOString(),
        deviceId: "",
        punchType: "IN",
        machineInOutGridId: "",
      },
    ]);
  }

  function updatePunchEntry(index: number, field: string, value: string) {
    const updated = [...punchEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPunchEntries(updated);
  }

  function removePunchEntry(index: number) {
    setPunchEntries(punchEntries.filter((_, i) => i !== index));
  }

  function handleEmployeeSelect(val: any, index: number) {
    const updated = [...punchEntries];
    updated[index] = {
      ...updated[index],
      employeeId: val?.id || "",
      employeeName: val?.name || "",
      employeeData: val,
      employeeCode: val?.employeeId || val?.employeeCode || "",
    };
    setPunchEntries(updated);
  }

  function clearPunchEntries() {
    setPunchEntries([]);
    setPunchImportResult(null);
    setDeviceFetchSummary({ total: 0, matched: 0, unknown: 0 });
  }

  async function handleBatchPunchImport() {
    const validEntries = punchEntries.filter((e) => e.employeeId && e.timestamp);

    if (validEntries.length === 0) {
      showSnackbar("Please add at least one valid punch entry", "warning");
      return;
    }

    setPunchImporting(true);
    showSpinner();

    try {
      const payload = {
        source: punchSource,
        punches: validEntries.map((e) => ({
          employeeId: e.employeeId,
          employeeCode: e.employeeCode || "",
          timestamp: e.timestamp,
          punchType: e.punchType,
          deviceId: e.deviceId || e.machineInOutGridId || "",
        })),
      };
      const res: any = await attendanceService.importAttendance(payload);
      const data = res?.data?.data ?? res?.data;
      setPunchImportResult(data);
      const punchDates = validEntries
        .map((e) => dayjs(e.timestamp))
        .filter((d) => d.isValid());

      const fromDate = punchDates.length
        ? punchDates.reduce((min, d) => (d.isBefore(min) ? d : min)).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      const toDate = punchDates.length
        ? punchDates.reduce((max, d) => (d.isAfter(max) ? d : max)).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");
      try {
        await attendanceService.processAttendance({
          fromDate,
          toDate,
          departmentId: departmentId && departmentId !== "All" ? departmentId : undefined,
          employeeIds: undefined,
          workerType: "Both",
          reprocess: true,
        });

        showSnackbar(
          data?.message
            ? `${data.message} • Attendance processed for ${dayjs(fromDate).format("DD MMM")}${fromDate !== toDate ? ` – ${dayjs(toDate).format("DD MMM")}` : ""
            }`
            : `Imported ${data?.totalPunches || 0} punches and processed attendance`,
          data?.errors > 0 ? "warning" : "success",
        );
      } catch (processErr: any) {
        showSnackbar(
          `Punches imported, but processing failed: ${processErr?.response?.data?.message ?? processErr?.message ?? "Unknown error"
          }`,
          "warning",
        );
      }
      loadRegister();
      loadTodaySummary();
      setPunchImportOpen(false);
      setPunchEntries([]);
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to import punches",
        "error",
      );
    } finally {
      setPunchImporting(false);
      hideSpinner();
    }
  }

  const statCards = todaySummary
    ? [
      { label: "Total", value: todaySummary.totalEmployees, color: "text-blue-600", border: "border-blue-500" },
      { label: "Present", value: todaySummary.present, color: "text-green-600", border: "border-green-500" },
      { label: "Late", value: todaySummary.late, color: "text-amber-600", border: "border-amber-500" },
      { label: "Absent", value: todaySummary.absent, color: "text-red-500", border: "border-red-500" },
      { label: "On Leave", value: todaySummary.onLeave, color: "text-violet-600", border: "border-violet-500" },
      { label: "Missed Punch", value: todaySummary.checkedIn, color: "text-cyan-600", border: "border-cyan-500" },
      { label: "Not Yet In", value: todaySummary.notYetIn, color: "text-pink-600", border: "border-pink-500" },
      { label: "Attendance %", value: todaySummary.attendancePercentage, color: "text-emerald-600", border: "border-emerald-500" },
    ]
    : [];

  const handleEmployee = async (employee: any) => {
    if (!employee) return;
    const employeeId = employee.id || employee.employeeId;
    if (!employeeId) return;

    if (employeesToRem.find((e: any) => (e.employeeId ?? e.id) === employeeId)) {
      showSnackbar("Employee already added", "warning");
      return;
    }
    setEmployeesToRem([...employeesToRem, employee]);
    if (!selected.has(employeeId)) {
      const newSelected = new Set(selected);
      newSelected.add(employeeId);
      setSelected(newSelected);
    }
  };

  const handleOpenReminderDialog = () => {
    if (selected.size > 0) {
      const selectedEmployees = employees.filter((emp) => selected.has(emp.employeeId));
      setEmployeesToRem(selectedEmployees);
    } else {
      setEmployeesToRem([]);
    }
    setReminderDialogOpen(true);
  };

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) => {
      if (prev.includes(deviceId)) {
        return prev.filter((id) => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  const handleSelectAllDevices = () => {
    if (selectAllDevices) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(devices.map((d) => d.id));
    }
    setSelectAllDevices(!selectAllDevices);
  };

  const handleFetchFromDevices = async () => {
    if (!punchImportFromDate || !punchImportToDate) {
      showSnackbar("Please select both From Date and To Date", "warning");
      return;
    }

    if (selectedDeviceIds.length === 0) {
      showSnackbar("Please select at least one device", "warning");
      return;
    }

    if (dayjs(punchImportToDate).isBefore(dayjs(punchImportFromDate))) {
      showSnackbar("End date must be after start date", "warning");
      return;
    }

    setDeviceImportLoading(true);
    showSpinner();

    try {
      const selectedDevicesData = devices.filter((d) => selectedDeviceIds.includes(d.id));

      const deviceIpsWithPorts = selectedDevicesData.map(
        (device) => `${device.ipAddress}:${device.port || 4370}`,
      );

      const result: any = await biometricService.fetchLogs({
        from_date: punchImportFromDate,
        to_date: punchImportToDate,
        deviceIps: deviceIpsWithPorts,
      });

      const punchesData = result?.data || result || [];

      if (punchesData.length === 0) {
        showSnackbar("No punch logs found for the selected devices and date range", "info");
        return;
      }
      const newPunchEntriesFilter: any = punchesData.map((punch: any) => {
        const matchedEmp = employeesData.find((emp) => emp.midNo == punch.mid_no);
        return {
          ...punch,
          employeeName: matchedEmp ? matchedEmp.name : "Unknown",
          employeeCode: matchedEmp ? matchedEmp.employeeId : "Unknown",
          employeeId: matchedEmp ? matchedEmp.id : "Unknown",
          deviceId: punch.machineInOutGridId || punch.deviceId || "",
          punchType: punch.punchType || "IN",
        };
      });
      const newPunchEntries = newPunchEntriesFilter.filter(
        (item: any) => item.employeeId !== "Unknown",
      );

      const unknownCount = newPunchEntriesFilter.length - newPunchEntries.length;
      setDeviceFetchSummary((previous) => ({
        total: previous.total + punchesData.length,
        matched: previous.matched + newPunchEntries.length,
        unknown: previous.unknown + unknownCount,
      }));

      setPunchEntries((prev) => [...prev, ...newPunchEntries]);
      showSnackbar(
        `Fetched ${punchesData.length} logs: ${newPunchEntries.length} matched, ${unknownCount} unknown`,
        "success",
      );
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to fetch punch logs from devices",
        "error",
      );
    } finally {
      setDeviceImportLoading(false);
      hideSpinner();
    }
  };

  const getSummaryHeader = () => {
    const today = dayjs().format("YYYY-MM-DD");
    const selectedDate = dayjs(date);

    if (date === today) {
      return "Today's Summary";
    } else {
      return `Summary for ${selectedDate.format("DD MMM YYYY")}`;
    }
  };

  const isValidPunchTime = (timeStr: string): boolean => {
    if (!timeStr) return false;
    const d = dayjs(timeStr);
    if (!d.isValid()) return false;
    return d.hour() !== 0 || d.minute() !== 0 || d.second() !== 0;
  };

  const selectableEmployees = employees.filter((e) => e.status !== "leave");

  return (
    <div className="p-4 space-y-3">
      {/* Summary cards */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-gray-500">{getSummaryHeader()}</div>

        <div className="flex gap-2">
          <Button
            size="small"
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<CloudUploadOutlined className="!w-4" />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import from File
          </Button>
          <Button
            size="small"
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<PunchClockOutlined className="!w-4" />}
            onClick={() => setPunchImportOpen(true)}
          >
            Import Punches
          </Button>
          <Button
            size="small"
            variant="contained"
            className="!bg-primary"
            startIcon={<NotificationsActiveOutlined className="!w-4" />}
            onClick={handleOpenReminderDialog}
          >
            Send Reminders {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>
      </div>

      {statCards.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {statCards.map(({ label, value, color, border }) => (
            <div key={label} className={`border ${border} rounded-lg p-1 text-center`}>
              <div className={`text-[16px] font-bold ${color}`}>{value ? value : 0}</div>
              <div className="text-[12px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Date + Filters */}
      <div className="flex items-center gap-3 border border-gray-200 p-2 rounded-md justify-between flex-wrap">
        <div className="flex items-center gap-2">
          <FilterListOutlined className="text-gray-600" fontSize="small" />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(newValue) => {
                setDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
              }}
              format="DD/MM/YYYY"
              maxDate={dayjs()}
            />
          </LocalizationProvider>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              label="Department"
              onChange={(e) => setDepartmentId(e.target.value)}
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

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchId}
              label="Branch"
              onChange={(e) => setBranchId(e.target.value)}
              sx={selectSx}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {todayHoliday && (
            <div className="bg-primary-100 !whitespace-nowrap !px-2 !py-2 rounded-md">
              <span className="text-[12px] text-black mr-2">
                Holiday: {todayHoliday?.name}
              </span>
              {todayHoliday?.type && (
                <span className="text-[12px] text-primary font-bold">
                  ({todayHoliday?.type})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_CHIP_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                size="small"
                variant={statusFilter === o.value ? "filled" : "outlined"}
                color={statusFilter === o.value ? "primary" : "default"}
                onClick={() => setStatusFilter(o.value)}
                className="cursor-pointer text-gray-800"
                sx={{
                  borderRadius: "8px",
                  fontWeight: statusFilter === o.value ? 600 : 400,
                  ...(statusFilter === o.value && {
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    },
                  }),
                }}
              />
            ))}
          </div>

          <Tooltip title="Refresh data" arrow>
            <IconButton
              size="small"
              onClick={() => {
                loadRegister();
                loadTodaySummary();
              }}
              sx={{
                borderRadius: "10px",
                padding: "8px",
                "&:hover": { transform: "rotate(90deg)" },
              }}
            >
              <RefreshOutlined fontSize="small" className="text-gray-500" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-gray-200 rounded-lg px-3 py-2 flex-wrap">
          <GroupOutlined fontSize="small" className="text-gray-500" />
          <span className="text-[12px] text-green-700 font-bold">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-2 flex-wrap">
            <Button
              size="small"
              variant="outlined"
              className="!text-primary !border-primary"
              startIcon={<EventNoteOutlined fontSize="small" />}
              onClick={() => setBulkDialogOpen(true)}
            >
              Daily Status
            </Button>
            <Button
              size="small"
              variant="outlined"
              className="!text-primary !border-primary"
              startIcon={<CheckCircleOutlined fontSize="small" />}
              onClick={handleBulkProcess}
            >
              Bulk Process
            </Button>
            <Button
              size="small"
              variant="contained"
              className="!bg-primary"
              startIcon={<PlaylistAddCheckCircleOutlined fontSize="small" />}
              onClick={() => {
                setBulkActionType("checkIn");
                const selectedEmployees = employees.filter((emp) =>
                  selected.has(emp.employeeId),
                );
                setBulkCheckinEmployees(selectedEmployees);
                setBulkCheckinOpen(true);
              }}
            >
              Bulk Action
            </Button>
            <Button
              size="small"
              variant="outlined"
              className="!text-gray-800 !border-gray-200"
              onClick={() => {
                setSelected(new Set());
                setSelectAllChecked(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Register Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer
          className={`${todayHoliday && selected.size > 0
            ? "max-h-[calc(100vh-565px)]"
            : selected.size > 0 || todayHoliday
              ? "max-h-[calc(100vh-200px)]"
              : "max-h-[calc(100vh-200px)]"
            }`}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!sticky left-0 !z-40">
                  <Checkbox
                    size="small"
                    color="primary"
                    className="text-gray-800"
                    indeterminate={
                      selected.size > 0 && selected.size < selectableEmployees.length
                    }
                    checked={
                      selectableEmployees.length > 0 &&
                      selected.size === selectableEmployees.length
                    }
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                {[
                  "Emp Name",
                  "Shift",
                  "Check In Date",
                  "Check In Time",
                  "Check Out Date",
                  "Check Out Time",
                  "Early Out (min)",
                  "Late (min)",
                  "Overtime (min)",
                  "Worked (min)",
                  "Status",
                  "Action",
                ].map((h, i) => (
                  <TableCell
                    key={h}
                    className={`!font-bold ${i == 0
                      ? "!sticky left-[68px] !z-40"
                      : h == "Action"
                        ? "!sticky right-0 !z-40"
                        : h == "Status"
                          ? "!sticky right-[69px] !z-40"
                          : ""
                      }`}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>{/* Loading placeholder */}</TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" className="py-8">
                    <div className="text-[12px] text-gray-400 pt-7">
                      No records for {dayjs(date).format("DD MMM YYYY")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, i) => {
                  const isLeave = emp.status === "leave";
                  const isEditing = inlineEditInProgress === emp.employeeId;

                  return (
                    <TableRow key={emp.employeeId || i} sx={getRowColor(i)}>
                      <TableCell className="!sticky left-0 !z-20 bg-inherit">
                        <Checkbox
                          size="small"
                          color="primary"
                          className="!border-red-500 text-gray-800"
                          checked={selected.has(emp.employeeId)}
                          onChange={() => toggleSelect(emp.employeeId)}
                          disabled={isLeave}
                        />{" "}
                        <span>{i + 1}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap !sticky left-[68px] !z-20 bg-inherit">
                        <div>
                          {emp.employeeName} ({emp.employeeCode})
                        </div>
                        <div className="text-blue-500">{emp.department || "-"}</div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div>{emp.shiftCode || "-"}</div>
                        <div className="text-primary font-bold">
                          {emp.shiftStart || "-"} - {emp.shiftEnd || "-"}
                        </div>
                      </TableCell>

                      {/* ─── CHECK-IN DATE (shows only date) ─── */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditingField(emp.employeeId, "checkInDate") ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                              <DateTimePicker
                                autoFocus
                                open
                                onClose={closeField}
                                value={draftDateTime}
                                onChange={(newValue) => setDraftDateTime(newValue)}
                                onAccept={(newValue) => {
                                  if (!newValue) return;
                                  const selected = dayjs(newValue);
                                  if (selected.isAfter(dayjs())) {
                                    showSnackbar("Check-in cannot be in the future", "warning");
                                    return;
                                  }
                                  closeField();
                                  handleInlineCheckInDateChange(
                                    emp,
                                    selected.format("YYYY-MM-DD"),
                                    selected.format("HH:mm:ss"),
                                  );
                                }}
                                format="DD/MM/YYYY HH:mm:ss"
                                ampm={false}
                                maxDateTime={dayjs()}
                                disabled={isLeave || isEditing}
                                slotProps={{
                                  textField: {
                                    variant: "outlined",
                                    sx: {
                                      ...inlineInputSx,
                                      width: "160px",
                                      ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                        padding: "0 2px 0 0px !important",
                                      },
                                    },
                                  },
                                  popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                }}
                              />
                            </LocalizationProvider>
                          ) : (
                            <InlineDisplay
                              value={emp.checkInDate ? dayjs(emp.checkInDate).format("DD MMM YYYY") : null}
                              onClick={() =>
                                !isLeave &&
                                !isEditing &&
                                openField(
                                  emp.employeeId,
                                  "checkInDate",
                                  emp.checkInTime
                                    ? dayjs(emp.checkInTime)
                                    : emp.checkInDate
                                      ? dayjs(`${emp.checkInDate}T00:00:00`)
                                      : null,
                                )
                              }
                              disabled={isLeave || isEditing}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* ─── CHECK-IN TIME (shows only time) ─── */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditingField(emp.employeeId, "checkInTime") ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DateTimePicker
                                autoFocus
                                open
                                onClose={closeField}
                                value={draftDateTime}
                                onChange={(newValue) => setDraftDateTime(newValue)}
                                onAccept={(newValue) => {
                                  if (!newValue) return;
                                  const selected = dayjs(newValue);
                                  if (selected.isAfter(dayjs())) {
                                    showSnackbar("Check-in time cannot be in the future", "warning");
                                    return;
                                  }
                                  closeField();
                                  handleInlineCheckInTimeChange(emp, selected.toISOString());
                                }}
                                format="HH:mm:ss"
                                ampm={false}
                                maxDateTime={dayjs()}
                                disabled={isLeave || isEditing}
                                slots={{ openPickerIcon: AccessTimeOutlined }}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    variant: "outlined",
                                    sx: {
                                      ...inlineInputSx,
                                      width: "100px",
                                      "& .MuiInputBase-input": {
                                        color: emp.checkInTime ? "#15803d" : "#ef4444",
                                      },
                                      ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                        padding: "0 2px 0 0px !important",
                                      },
                                    },
                                  },
                                  popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                }}
                              />
                            </LocalizationProvider>
                          ) : (
                            <InlineDisplay
                              value={emp.checkInTime ? dayjs(emp.checkInTime).format("HH:mm:ss") : null}
                              onClick={() =>
                                !isLeave &&
                                !isEditing &&
                                openField(
                                  emp.employeeId,
                                  "checkInTime",
                                  emp.checkInTime ? dayjs(emp.checkInTime) : null,
                                )
                              }
                              disabled={isLeave || isEditing}
                              className={emp.checkInTime ? "text-green-700 font-semibold" : "text-red-500"}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* ─── CHECK-OUT DATE (shows only date) ─── */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditingField(emp.employeeId, "checkOutDate") ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                              <DateTimePicker
                                autoFocus
                                open
                                onClose={closeField}
                                value={draftDateTime}
                                onChange={(newValue) => setDraftDateTime(newValue)}
                                onAccept={(newValue) => {
                                  if (!newValue) return;
                                  const selected = dayjs(newValue);
                                  if (selected.isAfter(dayjs())) {
                                    showSnackbar("Check-out cannot be in the future", "warning");
                                    return;
                                  }
                                  if (emp.checkInTime && selected.isBefore(dayjs(emp.checkInTime))) {
                                    showSnackbar("Check-out cannot be before check-in", "warning");
                                    return;
                                  }
                                  closeField();
                                  handleInlineCheckOutDateChange(
                                    emp,
                                    selected.format("YYYY-MM-DD"),
                                    selected.format("HH:mm:ss"),
                                  );
                                }}
                                format="DD/MM/YYYY HH:mm:ss"
                                ampm={false}
                                maxDateTime={dayjs()}
                                minDateTime={emp.checkInTime ? dayjs(emp.checkInTime) : undefined}
                                disabled={isLeave || isEditing || !emp.checkInTime}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    variant: "outlined",
                                    sx: {
                                      ...inlineInputSx,
                                      width: "160px",
                                      "& .MuiInputBase-input": {
                                        color: emp.checkOutDate ? "#1f2937" : "#9ca3af",
                                      },
                                      ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                        padding: "0 2px 0 0px !important",
                                      },
                                    },
                                  },
                                  popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                }}
                              />
                            </LocalizationProvider>
                          ) : (
                            <InlineDisplay
                              value={emp.checkOutDate ? dayjs(emp.checkOutDate).format("DD MMM YYYY") : null}
                              onClick={() =>
                                !isLeave &&
                                !isEditing &&
                                emp.checkInTime &&
                                openField(
                                  emp.employeeId,
                                  "checkOutDate",
                                  emp.checkOutTime
                                    ? dayjs(emp.checkOutTime)
                                    : emp.checkOutDate
                                      ? dayjs(`${emp.checkOutDate}T00:00:00`)
                                      : null,
                                )
                              }
                              disabled={isLeave || isEditing || !emp.checkInTime}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* ─── CHECK-OUT TIME (shows only time) ─── */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isEditingField(emp.employeeId, "checkOutTime") ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DateTimePicker
                                autoFocus
                                open
                                onClose={closeField}
                                value={draftDateTime}
                                onChange={(newValue) => setDraftDateTime(newValue)}
                                onAccept={(newValue) => {
                                  if (!newValue) return;
                                  const selected = dayjs(newValue);
                                  if (selected.isAfter(dayjs())) {
                                    showSnackbar("Check-out time cannot be in the future", "warning");
                                    return;
                                  }
                                  if (emp.checkInTime && selected.isBefore(dayjs(emp.checkInTime))) {
                                    showSnackbar("Check-out time cannot be before check-in time", "warning");
                                    return;
                                  }
                                  closeField();
                                  handleInlineCheckOutTimeChange(emp, selected.toISOString());
                                }}
                                format="HH:mm:ss"
                                ampm={false}
                                maxDateTime={dayjs()}
                                minDateTime={emp.checkInTime ? dayjs(emp.checkInTime) : undefined}
                                disabled={isLeave || isEditing || !emp.checkInTime}
                                slots={{ openPickerIcon: AccessTimeOutlined }}
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    variant: "outlined",
                                    sx: {
                                      ...inlineInputSx,
                                      width: "100px",
                                      "& .MuiInputBase-input": {
                                        color: emp.checkOutTime ? "#2563eb !important" : "#9ca3af",
                                      },
                                      ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                        padding: "0 2px 0 0px !important",
                                      },
                                    },
                                  },
                                  popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                }}
                              />
                            </LocalizationProvider>
                          ) : (
                            <InlineDisplay
                              value={emp.checkOutTime ? dayjs(emp.checkOutTime).format("HH:mm:ss") : null}
                              onClick={() =>
                                !isLeave &&
                                !isEditing &&
                                emp.checkInTime &&
                                openField(
                                  emp.employeeId,
                                  "checkOutTime",
                                  emp.checkOutTime ? dayjs(emp.checkOutTime) : null,
                                )
                              }
                              disabled={isLeave || isEditing || !emp.checkInTime}
                              className={emp.checkOutTime ? "text-blue-600 font-semibold" : "text-gray-400"}
                            />
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{emp.earlyOutMinutes || 0}</TableCell>
                      <TableCell>{emp.lateMinutes || 0}</TableCell>
                      <TableCell>{emp.overtimeMinutes || 0}</TableCell>
                      <TableCell>{emp.workedMinutes || 0}</TableCell>
                      <TableCell className="!sticky right-[69px] !z-20 !bg-inherit">
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ATTENDANCE_STATUS_BG[emp.status] ??
                              "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {ATTENDANCE_STATUS_LABELS[emp.status] ?? emp.status}
                          </span>
                          {emp.correctionPending && (
                            <Tooltip title="Correction pending approval">
                              <PendingActionsOutlined className="!w-4 !h-4 text-amber-500" />
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="!sticky right-0 !z-20 !bg-inherit">
                        {!isLeave ? (
                          <div className="flex items-center gap-1">
                            {!emp.checkInTime && (
                              <Tooltip title="Mark Check-in">
                                <IconButton
                                  size="small"
                                  onClick={() => openPunch(emp, "checkIn")}
                                  className="!text-green-700"
                                >
                                  <LoginOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {emp.checkInTime && !emp.checkOutTime && (
                              <Tooltip title="Mark Check-out">
                                <IconButton
                                  size="small"
                                  onClick={() => openPunch(emp, "checkOut")}
                                  className="!text-blue-600"
                                >
                                  <LogoutOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {emp.checkInTime && emp.checkOutTime && (
                              <Tooltip title="Marked">
                                <IconButton size="small" className="!text-primary">
                                  <CheckCircleOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <Tooltip title="On Leave">
                            <IconButton size="small" className="!text-violet-700">
                              <CheckCircleOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="text-end text-gray-500 p-2 text-[12px]">
          Showing {total} records
        </div>
      </div>

      {/* ─── DIALOGS ─── */}

      {/* Check-in / Check-out Dialog */}
      <Dialog
        open={punchDialogOpen}
        onClose={() => setPunchDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">
            {punchType === "checkIn" ? "Mark Check-in" : "Mark Check-out"}
          </span>
          <IconButton size="small" onClick={() => setPunchDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-5">
            {punchEmployee && (
              <div className="bg-head rounded px-3 py-2 text-[12px] mb-3">
                <span className="font-medium text-gray-800">
                  {punchEmployee.employeeName}
                </span>
                <span className="text-gray-500 ml-2">
                  ({punchEmployee.employeeCode})
                </span>
              </div>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label={punchType === "checkIn" ? "Check-in Time" : "Check-out Time"}
                value={punchTime ? dayjs(punchTime) : null}
                format="DD/MM/YYYY HH:mm:ss"
                ampm={false}
                maxDateTime={dayjs()}
                minDateTime={
                  punchType === "checkOut" && punchEmployee?.checkInTime
                    ? dayjs(punchEmployee?.checkInTime)
                    : undefined
                }
                onChange={(newValue) => {
                  if (!newValue) {
                    setPunchTime("");
                    return;
                  }
                  const selected = dayjs(newValue);
                  if (selected.isAfter(dayjs())) {
                    return;
                  }
                  if (
                    punchType === "checkOut" &&
                    punchEmployee?.checkInTime &&
                    selected.isBefore(dayjs(punchEmployee.checkInTime))
                  ) {
                    return;
                  }
                  setPunchTime(selected.toISOString());
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !isValidPunchTime(punchTime),
                  },
                }}
              />
            </LocalizationProvider>
            <TextField
              label="Remarks (optional)"
              fullWidth
              multiline
              rows={2}
              value={punchRemarks}
              onChange={(e) => setPunchRemarks(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200 !p-4">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setPunchDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitPunch}
            disabled={submitting || !isValidPunchTime(punchTime)}
            startIcon={punchType === "checkIn" ? <LoginOutlined /> : <LogoutOutlined />}
          >
            {submitting
              ? "Saving..."
              : punchType === "checkIn"
                ? "Confirm Check-in"
                : "Confirm Check-out"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Correction Request Dialog */}
      <Dialog
        open={correctionDialogOpen}
        onClose={() => {
          if (!submittingCorrection) {
            setCorrectionDialogOpen(false);
            setPendingCorrection(null);
            setCorrectionReason("");
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <PendingActionsOutlined className="text-amber-500" />
            Request Attendance Correction
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setCorrectionDialogOpen(false);
              setPendingCorrection(null);
              setCorrectionReason("");
            }}
            disabled={submittingCorrection}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          {pendingCorrection && (
            <div className="space-y-4">
              <Alert severity="warning" sx={{ py: 0.5 }}>
                <span className="text-[12px]">
                  Both check-in and check-out already exist for{" "}
                  <strong>{pendingCorrection.employee.employeeName}</strong>.
                  Changes require approval.
                </span>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-3 text-[12px] space-y-2">
                <div className="font-medium text-gray-700 mb-2">Proposed Changes:</div>

                {pendingCorrection.changes.checkInDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Check-in Date:</span>
                    <span>
                      <span className="line-through text-gray-400 mr-2">
                        {pendingCorrection.employee.checkInDate
                          ? formatDate(pendingCorrection.employee.checkInDate)
                          : "-"}
                      </span>
                      <span className="text-green-600 font-medium">
                        → {formatDate(pendingCorrection.changes.checkInDate)}
                      </span>
                    </span>
                  </div>
                )}

                {pendingCorrection.changes.checkInTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Check-in Time:</span>
                    <span>
                      <span className="line-through text-gray-400 mr-2">
                        {pendingCorrection.employee.checkInTime
                          ? formatTimewithSec(pendingCorrection.employee.checkInTime)
                          : "-"}
                      </span>
                      <span className="text-green-600 font-medium">
                        → {formatTimewithSec(pendingCorrection.changes.checkInTime)}
                      </span>
                    </span>
                  </div>
                )}

                {pendingCorrection.changes.checkOutDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Check-out Date:</span>
                    <span>
                      <span className="line-through text-gray-400 mr-2">
                        {pendingCorrection.employee.checkOutDate
                          ? formatDate(pendingCorrection.employee.checkOutDate)
                          : "-"}
                      </span>
                      <span className="text-blue-600 font-medium">
                        → {formatDate(pendingCorrection.changes.checkOutDate)}
                      </span>
                    </span>
                  </div>
                )}

                {pendingCorrection.changes.checkOutTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Check-out Time:</span>
                    <span>
                      <span className="line-through text-gray-400 mr-2">
                        {pendingCorrection.employee.checkOutTime
                          ? formatTimewithSec(pendingCorrection.employee.checkOutTime)
                          : "-"}
                      </span>
                      <span className="text-blue-600 font-medium">
                        → {formatTimewithSec(pendingCorrection.changes.checkOutTime)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <TextField
                label="Reason for Correction *"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Please provide a reason for this correction..."
                disabled={submittingCorrection}
              />
            </div>
          )}
        </DialogContent>

        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => {
              setCorrectionDialogOpen(false);
              setPendingCorrection(null);
              setCorrectionReason("");
            }}
            disabled={submittingCorrection}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitCorrection}
            disabled={submittingCorrection || !correctionReason.trim()}
            startIcon={<PendingActionsOutlined />}
          >
            {submittingCorrection ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Daily Status Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <div className="flex items-center border-gray-200 border-b justify-between p-2">
          <span className="text-gray-800 ml-4 text-[12px]">Daily Status</span>
          <IconButton size="small" onClick={() => setBulkDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-6 pt-1 ">
            <Alert severity="info" icon={<InfoOutlined fontSize="small" />} sx={{ py: 0.5 }}>
              <span className="text-[12px]">
                Posting status for <b>{selected.size}</b> employees on{" "}
                <b>{dayjs(date).format("DD MMM YYYY")}</b>
              </span>
            </Alert>
            <TextField
              label="Remarks (optional)"
              fullWidth
              multiline
              rows={2}
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setBulkDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitBulkStatus}
            disabled={submitting}
            startIcon={<EventNoteOutlined />}
          >
            {submitting ? "Posting..." : "Post Daily Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Check-in Dialog */}
      <Dialog
        open={bulkCheckinOpen}
        onClose={() => {
          setBulkCheckinOpen(false);
          setBulkCheckinEmployees([]);
          setSelectAllChecked(false);
          setBulkActionType("checkIn");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <PlaylistAddCheckCircleOutlined className="text-primary" />
            Bulk Check-in / Check-out
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setBulkCheckinOpen(false);
              setBulkCheckinEmployees([]);
              setSelectAllChecked(false);
              setBulkActionType("checkIn");
            }}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-6">
            {/* Toggle between Check-in and Check-out */}
            <div className="flex justify-center gap-2">
              <Button
                variant={bulkActionType === "checkIn" ? "contained" : "outlined"}
                className={`flex-1 rounded-lg py-2.5 px-4 transition-all duration-300 backdrop-blur-sm w-max ${bulkActionType === "checkIn"
                  ? "!bg-gradient-to-br !from-emerald-400 !to-emerald-500 !text-white shadow-lg shadow-emerald-200/50"
                  : "!text-emerald-600 !border-emerald-500 hover:!bg-white/50 !backdrop-blur-sm"
                  }`}
                onClick={() => setBulkActionType("checkIn")}
                startIcon={<LoginOutlined className="!w-4 !h-4" />}
              >
                <span className="font-medium">Check-in</span>
              </Button>
              <Button
                variant={bulkActionType === "checkOut" ? "contained" : "outlined"}
                className={`flex-1 rounded-lg py-2.5 px-4 transition-all duration-300 backdrop-blur-sm w-max ${bulkActionType === "checkOut"
                  ? "!bg-gradient-to-br !from-blue-400 !to-blue-500 !text-white shadow-lg shadow-blue-200/50"
                  : "!text-blue-600 !border-blue-500 hover:!bg-white/50 !backdrop-blur-sm"
                  }`}
                onClick={() => setBulkActionType("checkOut")}
                startIcon={<LogoutOutlined className="!w-4 !h-4" />}
              >
                <span className="font-medium">Check-out</span>
              </Button>
            </div>

            {/* Show selected employees as chips */}
            {bulkCheckinEmployees.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-gray-600">
                    Selected Employees ({bulkCheckinEmployees.length})
                  </span>
                  <Button
                    size="small"
                    className="!text-red-500 !text-[12px]"
                    onClick={() => {
                      setBulkCheckinEmployees([]);
                      setSelectAllChecked(false);
                      setSelected(new Set());
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                  {bulkCheckinEmployees.map((emp) => (
                    <Chip
                      key={emp.employeeId}
                      label={`${emp.employeeName || emp.name} (${emp.employeeCode || emp.employeeId
                        })`}
                      size="small"
                      onDelete={() => {
                        setBulkCheckinEmployees(
                          bulkCheckinEmployees.filter(
                            (e) => e.employeeId !== emp.employeeId,
                          ),
                        );
                        const newSelected = new Set(selected);
                        newSelected.delete(emp.employeeId);
                        setSelected(newSelected);
                        const nonLeaveEmployees = employees.filter(
                          (e) => e.status !== "leave",
                        );
                        setSelectAllChecked(
                          bulkCheckinEmployees.length - 1 === nonLeaveEmployees.length,
                        );
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Employee Selection - Add more employees */}
            <div>
              <Autocomplete
                multiple
                options={employees
                  .filter((emp) => emp.status !== "leave")
                  .filter(
                    (emp) =>
                      !bulkCheckinEmployees.some(
                        (e) => e.employeeId === emp.employeeId,
                      ),
                  )
                  .map((emp) => ({
                    employeeId: emp.employeeId,
                    employeeName: emp.employeeName,
                    employeeCode: emp.employeeCode,
                    department: emp.department,
                  }))}
                disableCloseOnSelect
                value={[]}
                getOptionLabel={(option) =>
                  `${option.employeeName} ${option.employeeCode ? `- ${option.employeeCode}` : ""
                  }`
                }
                onChange={(_, value) => {
                  if (value.length > 0) {
                    const newEmployees = [...bulkCheckinEmployees, ...value];
                    setBulkCheckinEmployees(newEmployees);

                    const newSelected = new Set(selected);
                    value.forEach((emp) => newSelected.add(emp.employeeId));
                    setSelected(newSelected);

                    const nonLeaveEmployees = employees.filter(
                      (e) => e.status !== "leave",
                    );
                    setSelectAllChecked(
                      newEmployees.length === nonLeaveEmployees.length,
                    );
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li
                      key={key}
                      {...optionProps}
                      className="!px-3 !py-1 !flex !items-start"
                    >
                      <Checkbox checked={false} className="!py-0" />
                      <div>
                        <div className="text-[12px]">
                          {option.employeeName} - {option.employeeCode}
                        </div>
                        {option.department && (
                          <span className="text-[10px] text-gray-500">
                            {option.department}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add More Employees"
                    placeholder="Search by name or code..."
                    helperText="Search and add additional employees to the selection"
                  />
                )}
                className="w-full"
              />
            </div>

            {/* Summary of selected employees */}
            {bulkCheckinEmployees.length > 0 && (
              <div className="bg-sky-200/50 p-3 rounded-md">
                <div className="flex items-center justify-between w-full gap-4">
                  <span className="!text-[12px]">
                    {bulkCheckinEmployees.length} employee
                    {bulkCheckinEmployees.length !== 1 ? "s" : ""} selected for{" "}
                    {bulkActionType === "checkIn" ? "check-in" : "check-out"}
                    {selected.size > 0 && ` (${selected.size} from table)`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      className="!text-primary !border-primary"
                      onClick={() => {
                        const nonLeaveEmployees = employees.filter(
                          (emp) => emp.status !== "leave",
                        );
                        if (
                          bulkCheckinEmployees.length === nonLeaveEmployees.length
                        ) {
                          setBulkCheckinEmployees([]);
                          setSelected(new Set());
                          setSelectAllChecked(false);
                        } else {
                          setBulkCheckinEmployees(nonLeaveEmployees);
                          const newSelected = new Set(
                            nonLeaveEmployees.map((emp) => emp.employeeId),
                          );
                          setSelected(newSelected);
                          setSelectAllChecked(true);
                        }
                      }}
                    >
                      {bulkCheckinEmployees.length ===
                        employees.filter((emp) => emp.status !== "leave").length
                        ? "Deselect All"
                        : `Select All (${employees.filter((emp) => emp.status !== "leave")
                          .length
                        })`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Time Picker */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label={
                  bulkActionType === "checkIn" ? "Check-in Time" : "Check-out Time"
                }
                value={
                  bulkActionType === "checkIn"
                    ? bulkCheckinTime
                      ? dayjs(bulkCheckinTime)
                      : null
                    : bulkCheckoutTime
                      ? dayjs(bulkCheckoutTime)
                      : null
                }
                onChange={(newValue) => {
                  if (bulkActionType === "checkIn") {
                    setBulkCheckinTime(
                      newValue ? dayjs(newValue).toISOString() : "",
                    );
                  } else {
                    setBulkCheckoutTime(
                      newValue ? dayjs(newValue).toISOString() : "",
                    );
                  }
                }}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>

            <TextField
              label="Remarks (optional)"
              fullWidth
              multiline
              rows={2}
              value={
                bulkActionType === "checkIn" ? bulkCheckinRemarks : bulkCheckoutRemarks
              }
              onChange={(e) => {
                if (bulkActionType === "checkIn") {
                  setBulkCheckinRemarks(e.target.value);
                } else {
                  setBulkCheckoutRemarks(e.target.value);
                }
              }}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => {
              setBulkCheckinOpen(false);
              setBulkCheckinEmployees([]);
              setSelectAllChecked(false);
              setBulkActionType("checkIn");
            }}
            disabled={bulkCheckinSubmitting || bulkCheckoutSubmitting}
          >
            Cancel
          </Button>

          {bulkActionType === "checkIn" ? (
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => {
                const nonLeaveEmployees = employees.filter(
                  (emp) => emp.status !== "leave",
                );
                const employeesToCheckin = selectAllChecked
                  ? nonLeaveEmployees
                  : bulkCheckinEmployees;
                submitBulkCheckin(employeesToCheckin);
              }}
              disabled={bulkCheckinSubmitting || bulkCheckinEmployees.length === 0}
              startIcon={<LoginOutlined />}
            >
              {bulkCheckinSubmitting
                ? "Processing..."
                : `Check-in ${bulkCheckinEmployees.length} Employee${bulkCheckinEmployees.length !== 1 ? "s" : ""
                }`}
            </Button>
          ) : (
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => {
                const nonLeaveEmployees = employees.filter(
                  (emp) => emp.status !== "leave",
                );
                const employeesToCheckout = selectAllChecked
                  ? nonLeaveEmployees
                  : bulkCheckinEmployees;
                submitBulkCheckout(employeesToCheckout);
              }}
              disabled={bulkCheckoutSubmitting || bulkCheckinEmployees.length === 0}
              startIcon={<LogoutOutlined />}
            >
              {bulkCheckoutSubmitting
                ? "Processing..."
                : `Check-out ${bulkCheckinEmployees.length} Employee${bulkCheckinEmployees.length !== 1 ? "s" : ""
                }`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => {
          setReminderDialogOpen(false);
          setEmployeesToRem([]);
          setReminderMessage("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <NotificationsActiveOutlined className="text-primary" />
            Send Reminders
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setReminderDialogOpen(false);
              setEmployeesToRem([]);
              setReminderMessage("");
            }}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="grid gap-6">
            {selected.size > 0 && (
              <Alert severity="info" className="flex items-center">
                <div className="flex items-center justify-between">
                  <div className="text-[12px]">
                    <strong>{selected.size}</strong> employee
                    {selected.size !== 1 ? "s" : ""} selected from table
                  </div>
                  <Button
                    variant="outlined"
                    className="!text-primary !ml-6 !border-primary"
                    onClick={() => {
                      setEmployeesToRem([]);
                      setSelected(new Set());
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </Alert>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Recipients</span>
                {selected.size > 0 && (
                  <span className="text-[12px] text-primary font-medium">
                    {employeesToRem.length} employees selected
                  </span>
                )}
              </div>

              {employeesToRem.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-lg p-2 min-h-[40px] max-h-[150px] overflow-y-auto">
                  {employeesToRem.map((emp) => (
                    <Chip
                      key={emp.employeeId ?? emp.id}
                      label={`${emp.employeeName || emp.name} (${emp.employeeCode || emp.employeeId || emp.id
                        })`}
                      size="small"
                      onDelete={() => {
                        const empId = emp.employeeId ?? emp.id;
                        setEmployeesToRem(
                          employeesToRem.filter(
                            (e) => (e.employeeId ?? e.id) !== empId,
                          ),
                        );
                        const newSelected = new Set(selected);
                        newSelected.delete(empId);
                        setSelected(newSelected);
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </div>
              )}

              {employeesToRem.length === 0 && (
                <div className="text-[12px] text-gray-400 mt-2">
                  {selected.size === 0
                    ? "No employees selected. Search and add employees below, or select from the table."
                    : "Click 'Clear Selection' to remove all selected employees"}
                </div>
              )}

              <div className="mt-3">
                <EmployeeSelector
                  value={null}
                  onChange={handleEmployee}
                  label="Search & Add More Employees"
                  placeholder="Type employee name or code..."
                />
              </div>
            </div>

            <FormControl fullWidth size="small">
              <InputLabel>Reminder Type</InputLabel>
              <Select
                value={reminderType}
                label="Reminder Type"
                onChange={(e) => setReminderType(e.target.value as any)}
              >
                <MenuItem value="check_in">Check-in Reminder</MenuItem>
                <MenuItem value="check_out">Check-out Reminder</MenuItem>
                <MenuItem value="attendance">Attendance Reminder</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Send Via</InputLabel>
              <Select
                multiple
                value={sendVia}
                onChange={handleSendViaChange}
                label="Send Via"
                renderValue={(selected) => {
                  const selectedValues = selected as string[];
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedValues.map((value) => (
                        <Chip
                          key={value}
                          label={value.charAt(0).toUpperCase() + value.slice(1)}
                          size="small"
                          className="bg-gray-100 text-gray-800"
                        />
                      ))}
                    </Box>
                  );
                }}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="push">Push Notification</MenuItem>
              </Select>
            </FormControl>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Total Recipients:</span>
                <span className="font-bold text-gray-800">
                  {employeesToRem.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] mt-1">
                <span className="text-gray-600">From Table Selection:</span>
                <span className="font-bold text-primary">{selected.size}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] mt-1">
                <span className="text-gray-600">Manually Added:</span>
                <span className="font-bold text-gray-800">
                  {employeesToRem.length - selected.size}
                </span>
              </div>
            </div>

            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder={`Enter reminder message for ${reminderType.replace(
                "_",
                " ",
              )}`}
              helperText={`${reminderMessage.length}/500 characters`}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => {
              setReminderDialogOpen(false);
              setEmployeesToRem([]);
              setReminderMessage("");
            }}
            disabled={sendingReminders}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleSendReminders}
            disabled={
              sendingReminders ||
              !reminderMessage.trim() ||
              employeesToRem.length === 0
            }
            startIcon={<NotificationsActiveOutlined />}
          >
            {sendingReminders
              ? "Sending..."
              : `Send to ${employeesToRem.length} Employee${employeesToRem.length !== 1 ? "s" : ""
              }`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import from File Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setImportFile(null);
          setImportResult(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <CloudUploadOutlined className="text-primary" />
            Import Attendance from File
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setImportDialogOpen(false);
              setImportFile(null);
              setImportResult(null);
            }}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 mt-3 gap-3 gap-y-5">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <DatePicker
                  label="Start Date"
                  value={importStartDate ? dayjs(importStartDate) : null}
                  onChange={(newValue) => {
                    const formatted = newValue
                      ? dayjs(newValue).format("YYYY-MM-DD")
                      : "";
                    setImportStartDate(formatted);
                    setImportEndDate(formatted);
                  }}
                  maxDate={dayjs()}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={importEndDate ? dayjs(importEndDate) : null}
                  onChange={(newValue) =>
                    setImportEndDate(
                      newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                    )
                  }
                  maxDate={dayjs()}
                  format="DD/MM/YYYY"
                  minDate={importStartDate ? dayjs(importStartDate) : undefined}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </LocalizationProvider>

              <FormControl fullWidth size="small">
                <InputLabel>Period Type</InputLabel>
                <Select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  disabled={importing}
                >
                  <MenuItem value="daywise">Day-wise</MenuItem>
                  <MenuItem value="weekwise">Week-wise</MenuItem>
                  <MenuItem value="monthwise">Month-wise</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={importSource}
                  label="Source"
                  onChange={(e) => setImportSource(e.target.value)}
                  disabled={importing}
                >
                  <MenuItem value="biometric">Biometric</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="import-file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      showSnackbar("File size should be less than 10MB", "warning");
                      return;
                    }
                    setImportFile(file);
                    setImportResult(null);
                  }
                }}
                className="hidden"
                disabled={importing}
              />
              <label htmlFor="import-file" className="cursor-pointer block">
                <InsertDriveFileOutlined className="text-gray-400" fontSize="large" />
                <div className="text-sm text-gray-600 mt-2">
                  {importFile ? (
                    <div className="text-green-600 font-medium">
                      {importFile.name}
                      <div className="text-[12px] text-gray-500 font-normal mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  ) : (
                    "Click to select file or drag and drop"
                  )}
                </div>
                <div className="text-[12px] text-gray-400 mt-1">
                  Supported formats: Excel (.xlsx, .xls), CSV (.csv), Text (.txt)
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <span className="text-[12px] text-gray-600">Need a sample file?</span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlined />}
                onClick={async () => {
                  try {
                    await attendanceService.downloadImportTemplate();
                    showSnackbar("Template downloaded successfully", "success");
                  } catch (error: any) {
                    showSnackbar(
                      error?.message || "Failed to download template.",
                      "error",
                    );
                  }
                }}
                disabled={importing}
                className="!text-[12px] !border-gray-300"
              >
                Download Template
              </Button>
            </div>

            {importing && (
              <div className="space-y-1">
                <LinearProgress />
                <div className="text-[12px] text-gray-500 text-center">
                  Importing attendance records...
                </div>
              </div>
            )}

            {importResult && !importing && (
              <div
                className={`border rounded-lg p-3 ${importResult.failed > 0 && importResult.success === 0
                  ? "border-red-200 bg-red-50"
                  : importResult.failed > 0
                    ? "border-orange-200 bg-orange-50"
                    : "border-green-200 bg-green-50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {importResult.failed > 0 && importResult.success === 0 ? (
                      <ErrorOutlined className="text-red-500" fontSize="small" />
                    ) : importResult.failed > 0 ? (
                      <WarningAmberOutlined
                        className="text-orange-500"
                        fontSize="small"
                      />
                    ) : (
                      <CheckCircleOutlined
                        className="text-green-500"
                        fontSize="small"
                      />
                    )}
                    <span className="text-sm font-medium text-black">
                      {importResult.failed > 0 && importResult.success === 0
                        ? "Import Failed"
                        : importResult.failed > 0
                          ? "Partial Success"
                          : "Success"}
                    </span>
                  </div>
                  <span className="text-sm">
                    <span className="text-green-600">{importResult.success}</span>{" "}
                    <span className="text-black">successful</span>
                    {importResult.failed > 0 && (
                      <span className="text-red-600 ml-2">
                        {importResult.failed} failed
                      </span>
                    )}
                  </span>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[12px] font-medium text-gray-700 mb-1">
                      Error Details:
                    </div>
                    <div className="max-h-[120px] overflow-y-auto bg-white/50 rounded p-2">
                      {importResult.errors.slice(0, 5).map((error, index) => {
                        const isTimestampError =
                          error.toLowerCase().includes("timestamp") ||
                          error.toLowerCase().includes("unparseable");
                        return (
                          <div
                            key={index}
                            className={`text-[12px] py-0.5 ${isTimestampError ? "text-amber-600" : "text-red-600"
                              }`}
                          >
                            • {error}
                          </div>
                        );
                      })}
                      {importResult.errors.length > 5 && (
                        <div className="text-[12px] text-gray-500 mt-1">
                          + {importResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert severity="info" sx={{ py: 0.5 }}>
              <div className="text-[12px]">
                <strong>File format requirements:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Required columns: Employee Code, Timestamp</li>
                  <li>Optional columns: Punch Type (IN/OUT), Device ID</li>
                  <li>Date range filters will be applied automatically</li>
                </ul>
              </div>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="small"
                className="!text-primary !border-primary"
                onClick={handlePreviewFile}
                disabled={!importFile || importing}
              >
                Preview Data
              </Button>
            </div>

            {previewData.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-[12px] font-medium text-gray-600">
                    Preview (first 5 rows)
                  </span>
                </div>
                <div className="max-h-[150px] overflow-y-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 text-left text-gray-600">
                          Employee
                        </th>
                        <th className="px-3 py-1.5 text-left text-gray-600">
                          Original Timestamp
                        </th>
                        <th className="px-3 py-1.5 text-left text-gray-600">
                          Formatted
                        </th>
                        <th className="px-3 py-1.5 text-center text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 font-mono">
                            {row.employeeCode}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500">
                            {row.originalTimestamp}
                          </td>
                          <td className="px-3 py-1.5 font-mono">
                            {row.formattedTimestamp}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {row.isValid ? (
                              <CheckCircleOutlined className="text-green-500 !w-4 !h-4" />
                            ) : (
                              <ErrorOutlined className="text-red-500 !w-4 !h-4" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>

        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => {
              setImportDialogOpen(false);
              setImportFile(null);
              setImportResult(null);
            }}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleImportFile}
            disabled={importing || !importFile}
            startIcon={<CloudUploadOutlined />}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Punch Import Dialog */}
      <Dialog
        open={punchImportOpen}
        onClose={() => {
          setPunchImportOpen(false);
          clearPunchEntries();
        }}
        maxWidth="md"
      >
        <DialogTitle className="!p-2 !border-b !border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium ml-4">Import Punches</span>
            <IconButton
              size="small"
              onClick={() => {
                setPunchImportOpen(false);
                clearPunchEntries();
              }}
            >
              <CloseOutlined fontSize="small" className="text-gray-800" />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent className="!p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <FormControl size="small" className="!min-w-[140px]">
                <Select
                  value={punchSource}
                  onChange={(e) => {
                    setPunchSource(e.target.value);
                    setPunchEntries([]);
                    setPunchImportFromDate("");
                    setPunchImportToDate("");
                  }}
                  displayEmpty
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                </Select>
              </FormControl>
              {punchSource === "manual" ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    className="!text-primary !border-primary whitespace-nowrap"
                    onClick={addPunchEntry}
                  >
                    Add Row
                  </Button>

                  {punchEntries.length > 0 && (
                    <Button size="small" color="error" onClick={clearPunchEntries}>
                      Clear All
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 mt-5">
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                    <DatePicker
                      label="From Date"
                      value={punchImportFromDate ? dayjs(punchImportFromDate) : null}
                      onChange={(newValue) =>
                        setPunchImportFromDate(
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                        )
                      }
                      maxDate={dayjs()}
                      format="DD/MM/YYYY"
                      slotProps={{ textField: { style: { width: "140px" } } }}
                    />
                    <DatePicker
                      label="To Date"
                      value={punchImportToDate ? dayjs(punchImportToDate) : null}
                      onChange={(newValue) =>
                        setPunchImportToDate(
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                        )
                      }
                      maxDate={dayjs()}
                      format="DD/MM/YYYY"
                      minDate={
                        punchImportFromDate ? dayjs(punchImportFromDate) : undefined
                      }
                      slotProps={{ textField: { style: { width: "140px" } } }}
                    />
                  </LocalizationProvider>

                  <Button
                    variant="contained"
                    className="!bg-primary"
                    onClick={handleFetchFromDevices}
                    disabled={deviceImportLoading || selectedDeviceIds.length === 0}
                    startIcon={
                      deviceImportLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <PunchClockOutlined />
                      )
                    }
                  >
                    {deviceImportLoading ? "Fetching..." : "Fetch from Devices"}
                  </Button>
                </div>
              )}
            </div>

            {punchSource === "manual" && punchEntries.length > 0 && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-[25px_220px_180px_100px_140px_95px] gap-4 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="text-[12px] font-medium text-gray-600 !w-[20px]">
                    #
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Employee
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Timestamp
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Punch Type
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Device
                  </div>
                  <div className="text-[12px] font-medium text-gray-600 text-center">
                    Action
                  </div>
                </div>

                {punchEntries.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="grid grid-cols-[25px_220px_180px_100px_140px_95px] gap-4 px-3 py-2 items-center border-b border-gray-100 last:border-0"
                  >
                    <div className="text-[12px] text-gray-400 !w-[20px]">
                      {index + 1}
                    </div>

                    <div className="">
                      <EmployeeSelector
                        value={entry.employeeData || null}
                        onChange={(val) => handleEmployeeSelect(val, index)}
                      />
                    </div>

                    <div className="">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                          value={entry.timestamp ? dayjs(entry.timestamp) : null}
                          format="DD/MM/YYYY HH:mm:ss"
                          ampm={false}
                          maxDateTime={dayjs()}
                          onChange={(newValue) => {
                            if (!newValue) {
                              updatePunchEntry(index, "timestamp", "");
                              return;
                            }
                            const selected = dayjs(newValue);
                            if (!selected.isValid() || selected.isAfter(dayjs())) {
                              return;
                            }
                            updatePunchEntry(
                              index,
                              "timestamp",
                              selected.toISOString(),
                            );
                          }}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: entry.timestamp
                                ? !dayjs(entry.timestamp).isValid() ||
                                dayjs(entry.timestamp).isAfter(dayjs())
                                : false,
                              helperText:
                                entry.timestamp &&
                                  dayjs(entry.timestamp).isAfter(dayjs())
                                  ? "Punch time cannot be in the future"
                                  : "",
                            },
                            popper: {
                              sx: { zIndex: (theme) => theme.zIndex.modal + 10 },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>

                    <div>
                      <FormControl>
                        <Select
                          value={entry.punchType || ""}
                          onChange={(e) =>
                            updatePunchEntry(index, "punchType", e.target.value)
                          }
                          displayEmpty
                          sx={selectSx}
                        >
                          <MenuItem value="IN">IN</MenuItem>
                          <MenuItem value="OUT">OUT</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div className="">
                      <FormControl>
                        <Select
                          value={entry.deviceId || ""}
                          onChange={(e) =>
                            updatePunchEntry(index, "deviceId", e.target.value)
                          }
                          displayEmpty
                          sx={selectSx}
                        >
                          {devices.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                              {d.deviceName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    <div className="flex justify-center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removePunchEntry(index)}
                      >
                        <CloseOutlined fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {punchSource === "biometric" && devices.length > 0 && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-[30px_1fr_2fr_1fr_1fr_1fr] gap-2 bg-gray-50 border-b items-center border-gray-200">
                  <div className="flex items-center">
                    <Checkbox
                      size="small"
                      checked={selectAllDevices}
                      indeterminate={
                        selectedDeviceIds.length > 0 &&
                        selectedDeviceIds.length < devices.length
                      }
                      onChange={handleSelectAllDevices}
                      className="text-gray-800"
                    />
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Device Name
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    IP Address
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Location
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Machine Type
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">
                    Status
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="grid grid-cols-[30px_1fr_2fr_1fr_1fr_1fr] gap-2 items-center border-b border-gray-200"
                    >
                      <div className="flex items-center">
                        <Checkbox
                          size="small"
                          checked={selectedDeviceIds.includes(device.id)}
                          onChange={() => handleSelectDevice(device.id)}
                          className="text-gray-800"
                        />
                      </div>
                      <div className="text-[12px] text-gray-800">
                        {device.deviceName}
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {device.ipAddress}:{device.port || 4370}
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {device.location || "N/A"}
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {device.machineType || "N/A"}(
                        {device.machineSetUp || "N/A"})
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${device.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                        ></span>
                        <span className="text-[10px] text-gray-500">
                          {device.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-[12px] text-gray-600">
                  Selected: <strong>{selectedDeviceIds.length}</strong> device
                  {selectedDeviceIds.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {punchSource === "biometric" && deviceFetchSummary.total > 0 && (
              <div className="border border-green-200 rounded overflow-hidden">
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center justify-between">
                  <div className="text-[12px] font-medium text-green-700">
                    <div>
                      Fetched from Devices ({deviceFetchSummary.total} total logs)
                    </div>
                    <div className="mt-0.5 text-[11px] font-normal text-gray-600">
                      Matched: {deviceFetchSummary.matched} | Unknown:{" "}
                      {deviceFetchSummary.unknown} | Showing: {punchEntries.length}
                    </div>
                  </div>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setPunchEntries([]);
                    }}
                  >
                    Clear Fetched
                  </Button>
                </div>
                <div className="max-h-[150px] overflow-y-auto">
                  {punchEntries.map((entry, index) => (
                    <div
                      key={entry.id || index}
                      className="grid grid-cols-[30px_1fr_2fr_2fr_1fr] gap-2 px-3 py-2 border-b border-gray-200"
                    >
                      <div className="text-[12px] text-gray-400">{index + 1}</div>
                      <div className="text-[12px]">
                        <span className="font-medium">{entry.employeeName}</span>
                        <span className="text-gray-500 ml-1">
                          ({entry.mid_no})
                        </span>
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {formatDateTime(entry.timestamp) !==
                          dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm:ss") && (
                            <span className="ml-2 text-gray-500">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          )}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {devices.find((d) => d.id === entry.machineInOutGridId)
                          ?.deviceName || entry.deviceId}
                        <span className="ml-1 text-red-500">
                          ({entry.machineIP})
                        </span>
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {entry.machineType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {punchImportResult && (
              <Alert
                severity={punchImportResult.errors > 0 ? "warning" : "success"}
                className="!py-1"
              >
                <div className="flex items-center gap-4 text-[12px] justify-between">
                  <div>
                    Total Punches Imported:{" "}
                    <strong>{punchImportResult.totalPunches} Punches</strong>
                  </div>
                  <div>
                    Import Type: <strong>{punchImportResult.importType}</strong>
                  </div>
                  <div>
                    Skipped : <strong>{punchImportResult.skipped}</strong>
                  </div>
                  {punchImportResult.errors > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">
                        Errors: <strong>{punchImportResult.errors}</strong>
                      </span>
                    </>
                  )}
                </div>
              </Alert>
            )}

            {(punchImporting || deviceImportLoading) && <LinearProgress />}
          </div>
        </DialogContent>

        <DialogActions className="!px-4 !py-3 !border-t !border-gray-200">
          <Button
            onClick={() => {
              setPunchImportOpen(false);
              clearPunchEntries();
            }}
            disabled={punchImporting}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleBatchPunchImport}
            disabled={punchImporting || punchEntries.length === 0}
            startIcon={<PunchClockOutlined />}
          >
            {punchImporting
              ? "Importing..."
              : `Import ${punchEntries.length} Punches`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Result Dialog */}
      <Dialog
        open={bulkActionResult?.open || false}
        onClose={() => setBulkActionResult(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-3">
          <span className="!pl-4 flex items-center gap-2">
            {bulkActionResult?.type === "checkIn" ? (
              <LoginOutlined className="text-emerald-500" />
            ) : (
              <LogoutOutlined className="text-blue-500" />
            )}
            Bulk {bulkActionResult?.type === "checkIn" ? "Check-in" : "Check-out"}{" "}
            Results
          </span>
          <IconButton size="small" onClick={() => setBulkActionResult(null)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {bulkActionResult?.total || 0}
                </div>
                <div className="text-[12px] text-gray-500">Total</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-600">
                  {bulkActionResult?.success || 0}
                </div>
                <div className="text-[12px] text-emerald-600">Successful</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                <div className="text-2xl font-bold text-amber-600">
                  {bulkActionResult?.skipped || 0}
                </div>
                <div className="text-[12px] text-amber-600">Skipped</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {bulkActionResult?.errors || 0}
                </div>
                <div className="text-[12px] text-red-600">Errors</div>
              </div>
            </div>

            {bulkActionResult?.checkoutTime && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <span className="text-[12px]">
                  Check-out time:{" "}
                  <strong>
                    {dayjs(bulkActionResult.checkoutTime).format(
                      "DD MMM YYYY, hh:mm A",
                    )}
                  </strong>
                </span>
              </Alert>
            )}

            {bulkActionResult?.results && bulkActionResult.results.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-[12px] font-medium text-gray-600">
                    Detailed Results
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {bulkActionResult.results.map((result, index) => {
                    const isSuccess =
                      result.message === "checked_in" ||
                      result.message === "checked_out";
                    const isSkipped = result.message?.includes("skipped");
                    const isError = !isSuccess && !isSkipped;

                    let statusColor = "text-emerald-600";
                    let statusBg = "bg-emerald-50";
                    let statusIcon = <CheckCircleOutlined className="!w-4 !h-4" />;

                    if (isSkipped) {
                      statusColor = "text-amber-600";
                      statusBg = "bg-amber-50";
                      statusIcon = <InfoOutlined className="!w-4 !h-4" />;
                    } else if (isError) {
                      statusColor = "text-red-600";
                      statusBg = "bg-red-50";
                      statusIcon = <CloseOutlined className="!w-4 !h-4" />;
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 ${statusBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={statusColor}>{statusIcon}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {result.employeeCode || ""}
                            </div>
                            <div className="text-[12px] text-gray-500">
                              {result.employeeId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status && (
                            <span
                              className={`
                        text-[12px] px-2 py-0.5 rounded-full
                        ${result.status === "present"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : ""
                                }
                        ${result.status === "absent"
                                  ? "bg-red-100 text-red-700"
                                  : ""
                                }
                        ${result.status === "late"
                                  ? "bg-amber-100 text-amber-700"
                                  : ""
                                }
                      `}
                            >
                              {result.status}
                            </span>
                          )}
                          <span
                            className={`text-[12px] font-medium ${statusColor}`}
                          >
                            {result.message}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>

        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => setBulkActionResult(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}