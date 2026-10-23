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
  ToggleButton,
  ToggleButtonGroup,
  Menu,
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
  PlayArrowOutlined,
  ViewColumnOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_BG,
  // formatTimewithSec,
  type InlineDisplayProps,
  type RegisterEmployee,
  type TodaySummary,
  type Holiday,
  STATUS_CHIP_OPTIONS,
  inlineInputSx,
  punchTimeColor,
} from "../const";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import type { Department, Branches, Employee } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { DateTimePicker } from "@mui/x-date-pickers";
import { useAuth } from "../../../auth/authContext";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { NotificationsActiveOutlined } from "@mui/icons-material";
import { biometricService, type BiometricDevice, type StagedPunch } from "../../../services/modules/biometricDevice";
import { formatDateTime, formatMinutes } from "../../../utils/dateFormatter";
import { employeeService } from "../../../services/modules/employees";
import { useNavigate } from "react-router-dom";
import { shiftService } from "../../../services/modules/shifts";
import { pairMovements, type PairedMovement } from "../movement";
import { permissionRequestService } from "../../../services/modules/permissionRequests";

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
      className={`min-w-[70px] text-[12px] p-1.5 text-center rounded-sm transition-colors ${disabled
        ? ""
        : "cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-300"
        } ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  );
}

type EditableField =
  | "checkInDate"
  | "checkInTime"
  | "checkOutDate"
  | "checkOutTime";

// ── Column visibility config ──────────────────────────────────────────────
type ColumnKey =
  | "department"
  | "shift"
  | "checkInDate"
  | "checkInTime"
  | "checkOutDate"
  | "checkOutTime"
  | "earlyOut"
  | "late"
  | "overtime"
  | "worked"
  | "status"
  | "movement";

const COLUMN_CONFIG: { key: ColumnKey; label: string }[] = [
  { key: "department", label: "Department" },
  { key: "shift", label: "Shift" },
  { key: "checkInDate", label: "Check In Date" },
  { key: "checkInTime", label: "Check In Time" },
  { key: "checkOutDate", label: "Check Out Date" },
  { key: "checkOutTime", label: "Check Out Time" },
  { key: "earlyOut", label: "Early Out (min)" },
  { key: "late", label: "Late (min)" },
  { key: "overtime", label: "Overtime (min)" },
  { key: "worked", label: "Worked (min)" },
  { key: "status", label: "Status" },
  { key: "movement", label: "Movement" },
];

const COLUMN_STORAGE_KEY = "dailyRegisterVisibleColumns";

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = COLUMN_CONFIG.reduce(
  (acc, c) => ({ ...acc, [c.key]: true }),
  {} as Record<ColumnKey, boolean>,
);

const loadVisibleColumns = (): Record<ColumnKey, boolean> => {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_COLUMNS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VISIBLE_COLUMNS, ...parsed };
  } catch {
    return DEFAULT_VISIBLE_COLUMNS;
  }
};

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
  const navigate = useNavigate();

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline edit tracking
  const [inlineEditInProgress, _setInlineEditInProgress] = useState<string | null>(null);

  // Which inline cell is currently open for editing.
  const [editingField, setEditingField] = useState<string | null>(null);

  // Local draft value held while the picker is open.
  const [draftDateTime, setDraftDateTime] = useState<any | null>(null);

  const [midNoWarningDialog, setMidNoWarningDialog] = useState(false);
  const [employeesWithoutMidNo, setEmployeesWithoutMidNo] = useState<Employee[]>([]);
  const [pendingFetchParams, setPendingFetchParams] = useState<{
    fromDate: string;
    toDate: string;
    deviceIps: string[];
    selectedDevicesData: BiometricDevice[];
  } | null>(null);

  // Staged punches state
  const [stagedPunches, setStagedPunches] = useState<StagedPunch[]>([]);
  const [hasStagedPunches, setHasStagedPunches] = useState(false);
  const [loadingStagedPunches, setLoadingStagedPunches] = useState(true);
  const [stagedPunchCheckFailed, setStagedPunchCheckFailed] = useState(false);
  const [stagingPunches, setStagingPunches] = useState(false);
  const canEditPunchTimes =
    hasStagedPunches && !loadingStagedPunches && !stagedPunchCheckFailed;
  const [shiftColorMap, setShiftColorMap] = useState<Record<string, string>>({});


  // ── Column visibility ───────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] =
    useState<Record<ColumnKey, boolean>>(loadVisibleColumns);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementEmployee, setMovementEmployee] = useState<RegisterEmployee | null>(null);
  const [movementRows, setMovementRows] = useState<PairedMovement[]>([]);
  const [movementSavingIdx, setMovementSavingIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {
      // ignore storage errors (quota / private mode)
    }
  }, [visibleColumns]);

  useEffect(() => {
    shiftService
      .getShifts({ page: 0, size: 1000, sort: "shiftCode,ASC" })
      .then((res: any) => {
        const list = res?.content ?? res?.data?.content ?? res?.data ?? [];
        const map: Record<string, string> = {};
        (Array.isArray(list) ? list : []).forEach((s: any) => {
          if (s.shiftCode) {
            map[s.shiftCode] = s.color || "#3b82f6"; // fallback color
          }
        });
        setShiftColorMap(map);
      })
      .catch(() => {
        // non-blocking — shift colors are cosmetic
      });
  }, []);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showColumn = (key: ColumnKey) => visibleColumns[key] !== false;

  const editKey = (employeeId: string, field: string) => `${employeeId}:${field}`;
  const isEditingField = (employeeId: string, field: string) =>
    editingField === editKey(employeeId, field);

  const openField = (
    employeeId: string,
    field: string,
    initial?: dayjs.Dayjs | null,
  ) => {
    if (!canEditPunchTimes) return;
    setEditingField(editKey(employeeId, field));
    setDraftDateTime(initial ?? null);
  };

  const closeField = () => {
    setEditingField(null);
    setDraftDateTime(null);
  };

  // ── Directly update staged punch via API ──────────────────────────────────
  const updateStagedPunchAPI = async (
    emp: RegisterEmployee,
    field: EditableField,
    value: dayjs.Dayjs,
  ) => {
    if (!canEditPunchTimes) {
      showSnackbar("Punch details can only be edited while staged punches exist", "warning");
      return;
    }

    // Format as wall-clock digits without timezone offset
    const formattedValue = value.format("YYYY-MM-DDTHH:mm:ss");

    let checkInTime: string | null | undefined = undefined;
    let checkOutTime: string | null | undefined = undefined;

    if (field === "checkInDate" || field === "checkInTime") {
      checkInTime = formattedValue;
    } else {
      checkOutTime = formattedValue;
    }

    showSpinner();
    try {
      const updated = await biometricService.updateStagedPunch(
        emp.employeeId,
        dayjs(emp.checkInDate || emp.checkOutDate || date).format("YYYY-MM-DD"),
        {
          checkInTime: checkInTime ?? null,
          checkOutTime: checkOutTime ?? null,
          remarks: null,
        },
      );

      // Update local state with server response
      setEmployees((prev) =>
        prev.map((e) =>
          e.employeeId === emp.employeeId
            ? {
              ...e,
              checkInTime: updated.checkInTime ?? e.checkInTime,
              checkOutTime: updated.checkOutTime ?? e.checkOutTime,
              checkInDate: updated.checkInTime
                ? dayjs(updated.checkInTime).format("YYYY-MM-DD")
                : e.checkInDate,
              checkOutDate: updated.checkOutTime
                ? dayjs(updated.checkOutTime).format("YYYY-MM-DD")
                : e.checkOutDate,
              status: updated.status as any,
              workedMinutes: updated.workedMinutes,
              lateMinutes: updated.lateMinutes,
              earlyOutMinutes: updated.earlyOutMinutes,
              overtimeMinutes: updated.overtimeMinutes,
            }
            : e,
        ),
      );
      showSnackbar("Punch updated", "success");
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? err?.message ?? "Failed to update staged punch",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  // Validate the current draft value
  const validateDraft = (
    emp: RegisterEmployee,
    field: EditableField,
    value: dayjs.Dayjs,
    showToasts: boolean,
  ): boolean => {
    if (value.isAfter(dayjs())) {
      if (showToasts) showSnackbar("Attendance time cannot be in the future", "warning");
      return false;
    }
    if (field.startsWith("checkOut")) {
      if (!emp.checkInTime) {
        if (showToasts) showSnackbar("Please mark check-in first", "warning");
        return false;
      }
      if (value.isBefore(dayjs(emp.checkInTime))) {
        if (showToasts) showSnackbar("Check-out cannot be before check-in", "warning");
        return false;
      }
    }
    return true;
  };

  // Build the final dayjs value for a field, merging date+time correctly
  const buildFieldValue = (emp: RegisterEmployee, field: EditableField) => {
    const selected = dayjs(draftDateTime);
    if (!selected.isValid()) return null;
    if (field.endsWith("Time")) {
      const baseDate =
        field === "checkInTime"
          ? emp.checkInTime || emp.checkInDate || date
          : emp.checkOutTime || emp.checkOutDate || date;
      return dayjs(`${dayjs(baseDate).format("YYYY-MM-DD")}T${selected.format("HH:mm:ss")}`);
    }
    return selected;
  };

  // Initial value for a field when opening it programmatically
  const getInitialForField = (
    emp: RegisterEmployee,
    field: EditableField,
  ): dayjs.Dayjs | null => {
    switch (field) {
      case "checkInDate":
        return dayjs(emp.checkInTime || emp.checkInDate || date);
      case "checkInTime":
        return emp.checkInTime ? dayjs(emp.checkInTime) : null;
      case "checkOutDate":
        return dayjs(emp.checkOutTime || emp.checkOutDate || date);
      case "checkOutTime":
        return emp.checkOutTime ? dayjs(emp.checkOutTime) : null;
    }
  };

  // Determine which fields are editable for a given employee
  const getEditableFieldsForEmployee = (emp: RegisterEmployee): EditableField[] => {
    const fields: EditableField[] = [];
    const hasCheckInDate = !!emp.checkInDate;
    const hasCheckOutDate = !!emp.checkOutDate;
    const hasCheckInTime = !!emp.checkInTime;

    if (!hasCheckInDate) fields.push("checkInDate");
    fields.push("checkInTime");
    if (hasCheckInTime && !hasCheckOutDate) fields.push("checkOutDate");
    if (hasCheckInTime) fields.push("checkOutTime");

    return fields;
  };

  // Pick the first editable field for an employee
  const getFirstEditableField = (emp: RegisterEmployee): EditableField | null => {
    const fields = getEditableFieldsForEmployee(emp);
    return fields[0] ?? null;
  };

  // Only commit on blur when focus actually leaves the picker UI.
  const handleFieldBlur = (
    e: React.FocusEvent<HTMLDivElement>,
    emp: RegisterEmployee,
    field: EditableField,
  ) => {
    const next = e.relatedTarget as HTMLElement | null;

    if (
      next &&
      (next.closest(".MuiPickersPopper-root") ||
        next.closest(".MuiDialog-root") ||
        next.closest(".MuiPickersInputBase-root") ||
        next.closest(".MuiPickersSectionList-root") ||
        next.getAttribute("role") === "dialog" ||
        next.getAttribute("aria-label")?.toLowerCase().includes("choose"))
    ) {
      return;
    }

    if (!next) return;

    commitOnBlur(emp, field);
  };

  // commitAndMoveNext — row-wise navigation
  const commitAndMoveNext = (emp: RegisterEmployee, field: EditableField) => {
    const value = buildFieldValue(emp, field);
    if (value) {
      if (!validateDraft(emp, field, value, true)) return;
      updateStagedPunchAPI(emp, field, value);
    }

    closeField();

    const editableFields = getEditableFieldsForEmployee(emp);
    const currentIndex = editableFields.indexOf(field);
    const nextField = editableFields[currentIndex + 1];

    if (nextField) {
      const nextInitial = getInitialForField(emp, nextField);
      setTimeout(() => {
        openField(emp.employeeId, nextField, nextInitial);
      }, 30);
      return;
    }

    const currentRowIdx = employees.findIndex((e) => e.employeeId === emp.employeeId);
    if (currentRowIdx === -1) return;

    for (let i = currentRowIdx + 1; i < employees.length; i++) {
      const nextEmp = employees[i];
      if (!nextEmp || nextEmp.status === "leave") continue;

      const targetField = getFirstEditableField(nextEmp);
      if (!targetField) continue;

      const nextInitial = getInitialForField(nextEmp, targetField);
      setTimeout(() => {
        openField(nextEmp.employeeId, targetField, nextInitial);
      }, 30);
      return;
    }
  };

  // Save the open field when user clicks away (blur)
  const commitOnBlur = (emp: RegisterEmployee, field: EditableField) => {
    if (field === "checkInDate" && emp.checkInDate) {
      closeField();
      return;
    }
    if (field === "checkOutDate" && emp.checkOutDate) {
      closeField();
      return;
    }

    const value = buildFieldValue(emp, field);
    if (!value) {
      closeField();
      return;
    }

    if (!validateDraft(emp, field, value, false)) {
      closeField();
      return;
    }

    updateStagedPunchAPI(emp, field, value);
    closeField();
  };

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
  const [importType, setImportType] = useState<"daywise" | "weekwise" | "monthwise">("daywise");

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectAllDevices, setSelectAllDevices] = useState(false);
  const [punchImportFromDate, setPunchImportFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [punchImportToDate, setPunchImportToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [deviceImportLoading, setDeviceImportLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState<any>({});

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
        const res = await attendanceService.getProcessAttendanceStatus({
          date,
          departmentId: departmentId === "All" ? undefined : departmentId || undefined,
        });
        setProcessStatus(res.data || {})
      } catch {
        showSnackbar("Failed to fetch status", "error")
      }
    };
    fetchProcessStatus();
  }, [date, departmentId]);

  // Load staged punches from Redis
  const loadStagedPunches = useCallback(async () => {
    setLoadingStagedPunches(true);
    setStagedPunchCheckFailed(false);
    try {
      const data = await biometricService.getStagedPunches({
        from: date,
        to: date,
        status: statusFilter == "missed_out" ? "checked_in" : statusFilter || undefined
      });
      const list = Array.isArray(data) ? data : [];
      setStagedPunches(list);
      setHasStagedPunches(list.length > 0);
      return list;
    } catch {
      setStagedPunches([]);
      setHasStagedPunches(false);
      setStagedPunchCheckFailed(true);
      return null;
    } finally {
      setLoadingStagedPunches(false);
    }
  }, [date, statusFilter]);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      // 1. Check staged punches first
      const staged = await loadStagedPunches();
      if (staged === null) {
        setEmployees([]);
        setTotal(0);
        return;
      }

      // 2. If no staged data, fall back to register API
      if (staged.length === 0) {
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
      } else {
        // 3. If staged data exists, use it directly
        const mapped: RegisterEmployee[] = staged.map((s) => ({
          employeeId: s.employeeId,
          employeeName: s.employeeName,
          employeeCode: s.employeeCode,
          department: s.department ?? "",
          designation: s.designation ?? "",
          template: s.template ?? "",
          checkInTime: s.checkInTime ?? null,
          checkOutTime: s.checkOutTime ?? null,
          checkInDate: s.checkInTime ? dayjs(s.checkInTime).format("YYYY-MM-DD") : null,
          checkOutDate: s.checkOutTime ? dayjs(s.checkOutTime).format("YYYY-MM-DD") : null,
          shiftCode: s.shiftCode,
          shiftStart: s.shiftStart ?? "",
          shiftEnd: s.shiftEnd ?? "",
          status: s.status == "checked_in" ? "missed_punch" : s.status,
          workedMinutes: s.workedMinutes,
          lateMinutes: s.lateMinutes,
          earlyOutMinutes: s.earlyOutMinutes,
          overtimeMinutes: s.overtimeMinutes,
          correctionPending: false,
          movement: s.movement ?? [],

        } as any));
        setEmployees(mapped);
        setTotal(mapped.length);
      }
    } catch {
      showSnackbar("Failed to load daily register", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [date, departmentId, branchId, statusFilter, loadStagedPunches]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[] | any[];
    rows: any[];
    source?: string | null;
    importType?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    totalPunches?: number;
    daysImported?: number;
    skipped?: number;
  } | null>(null);

  const [punchImportOpen, setPunchImportOpen] = useState(false);
  const [punchSource, setPunchSource] = useState("manual");
  const [punchEntries, setPunchEntries] = useState<any[]>([]);
  const [punchImporting, _setPunchImporting] = useState(false);
  const [punchImportResult, setPunchImportResult] = useState<any>(null);
  const [deviceFetchSummary, setDeviceFetchSummary] = useState({
    total: 0,
    matched: 0,
    unknown: 0,
  });
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [timeUnit, setTimeUnit] = useState<"min" | "hrs">(
    (sessionStorage.getItem("dailyRegisterTimeUnit") as "min" | "hrs") ?? "min",
  );

  useEffect(() => {
    sessionStorage.setItem("dailyRegisterTimeUnit", timeUnit);
  }, [timeUnit]);

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
      employeeService.getEmployees({ includeInactive: true }),
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
    if (!canEditPunchTimes) {
      showSnackbar("Punch details can only be edited while staged punches exist", "warning");
      return;
    }
    setPunchEmployee(emp);
    setPunchType(type);
    setPunchTime(dayjs(`${date}T00:00:00`).toISOString());
    setPunchRemarks("");
    setPunchDialogOpen(true);
  }

  async function submitPunch() {
    if (!canEditPunchTimes) {
      showSnackbar("Punch details can only be edited while staged punches exist", "warning");
      setPunchDialogOpen(false);
      return;
    }
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

  const SUCCESS_ROW_MESSAGES = new Set([
    "imported",
    "success",
    "staged to punch_data",
    "staged",
  ]);

  async function handleImportFile() {
    if (!importFile) {
      showSnackbar("Please select a file to import", "warning");
      return;
    }
    setImporting(true);
    setImportResult(null);
    showSpinner();
    try {
      const ext = importFile.name.split(".").pop()?.toLowerCase();
      const format = ext === "xlsx" || ext === "xls" ? "excel" : "csv";

      const res: any = await attendanceService.stageAttendanceFile(
        { format, source: importSource, type: importType },
        importFile,
      );
      const data = res?.data?.data ?? res?.data;
      if (!data) throw new Error("The server did not return an attendance import result");

      const totalPunches = Number(data.totalPunches ?? 0);
      const failed = Number(data.errors ?? 0);
      const success = Math.max(totalPunches - failed, 0);

      // Treat known success messages as success; only others become "errors".
      const errors: string[] = Array.isArray(data.rows)
        ? data.rows
          .filter((r: any) => {
            const m = String(r?.message ?? "").toLowerCase();
            return m && !SUCCESS_ROW_MESSAGES.has(m);
          })
          .map((r: any) =>
            r.employeeCode ? `${r.employeeCode}: ${r.message}` : String(r.message),
          )
        : [];

      showSnackbar(
        failed === 0
          ? `Staged ${totalPunches} punches`
          : failed === totalPunches
            ? `All ${totalPunches} records failed`
            : `Staged ${success} / ${totalPunches} (${failed} failed)`,
        failed === 0 ? "success" : failed === totalPunches ? "error" : "warning",
      );

      setImportResult({
        success,
        failed,
        errors,
        rows: data.rows || [],
        source: data.source ?? null,
        importType: data.importType ?? null,
        periodStart: data.periodStart ?? null,
        periodEnd: data.periodEnd ?? null,
        totalPunches,
        daysImported: Number(data.daysImported ?? 0),
        skipped: Number(data.skipped ?? 0),
      });

      await loadRegister();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to import attendance";
      showSnackbar(msg, "error");
      setImportResult({ success: 0, failed: 1, errors: [msg], rows: [] });
    } finally {
      setImporting(false);
      hideSpinner();
    }
  }

  // async function handlePreviewFile() {
  //   if (!importFile) {
  //     showSnackbar("Please select a file first", "warning");
  //     return;
  //   }
  //   try {
  //     const extension = importFile.name.split(".").pop()?.toLowerCase();
  //     let preview: any = [];

  //     if (extension === "xlsx" || extension === "xls") {
  //       const excelData = await readExcelFile(importFile);
  //       if (excelData && excelData.length > 0) {
  //         const headers = Object.keys(excelData[0]);
  //         const employeeCodeKey =
  //           headers.find(
  //             (h) =>
  //               h.toLowerCase().includes("employee") ||
  //               h.toLowerCase().includes("emp") ||
  //               h.toLowerCase().includes("code"),
  //           ) || headers[0];
  //         const timestampKey =
  //           headers.find(
  //             (h) =>
  //               h.toLowerCase().includes("timestamp") ||
  //               h.toLowerCase().includes("time") ||
  //               h.toLowerCase().includes("date"),
  //           ) || headers[1];

  //         preview = excelData.slice(0, 5).map((row: any) => {
  //           const employeeCode = row[employeeCodeKey] || "N/A";
  //           const originalTimestamp = row[timestampKey] || "N/A";

  //           let formattedTimestamp = "N/A";
  //           let isValid = false;

  //           if (originalTimestamp !== "N/A" && originalTimestamp) {
  //             const parsed = dayjs(originalTimestamp);
  //             if (parsed.isValid()) {
  //               formattedTimestamp = parsed.toISOString();
  //               isValid = true;
  //             } else {
  //               const parsed2 = dayjs(originalTimestamp, [
  //                 "YYYY-MM-DD HH:mm:ss",
  //                 "YYYY-MM-DD HH:mm",
  //                 "YYYY-MM-DD",
  //               ]);
  //               if (parsed2.isValid()) {
  //                 formattedTimestamp = parsed2.toISOString();
  //                 isValid = true;
  //               } else {
  //                 formattedTimestamp = `Invalid format: ${originalTimestamp}`;
  //               }
  //             }
  //           }

  //           return {
  //             employeeCode: String(employeeCode),
  //             originalTimestamp: String(originalTimestamp),
  //             formattedTimestamp,
  //             isValid,
  //           };
  //         });
  //       }
  //     }

  //     setPreviewData(preview);
  //     if (preview.length === 0) {
  //       showSnackbar("No valid data rows found in the file", "warning");
  //     } else {
  //       showSnackbar(`Preview loaded with ${preview.length} rows`, "success");
  //     }
  //   } catch (error) {
  //     showSnackbar("Failed to preview file. Please check the file format.", "error");
  //   }
  // }

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

  const statCards = todaySummary
    ? [
      { label: "Total", value: todaySummary.totalEmployees, color: "text-blue-600", border: "border-blue-500" },
      { label: "Present", value: todaySummary.present, color: "text-green-600", border: "border-green-500" },
      { label: "Late", value: todaySummary.late, color: "text-amber-600", border: "border-amber-500" },
      { label: "Absent", value: todaySummary.absent, color: "text-red-500", border: "border-red-500" },
      { label: "On Leave", value: todaySummary.onLeave, color: "text-violet-600", border: "border-violet-500" },
      { label: "Missed Punch", value: todaySummary.missedPunchCount, color: "text-cyan-600", border: "border-cyan-500" },
      { label: "Irregular", value: todaySummary.irregular, color: "text-pink-600", border: "border-pink-500" },
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

    const selectedDevicesData = devices.filter((d) => selectedDeviceIds.includes(d.id));
    const deviceIpsWithPorts = selectedDevicesData.map(
      (device) => `${device.ipAddress}:${device.port || 4370}`,
    );

    let employeesToCheck = employeesData;
    if (branchId) {
      employeesToCheck = employeesData.filter(
        (emp: any) => emp.branchId === branchId || emp.branch?.id === branchId
      );
    }

    const employeesWithoutMid = employeesToCheck.filter(
      (emp: any) => !emp.midNo || emp.midNo.trim() === ""
    );

    if (employeesWithoutMid.length > 0) {
      setEmployeesWithoutMidNo(employeesWithoutMid);
      setPendingFetchParams({
        fromDate: punchImportFromDate,
        toDate: punchImportToDate,
        deviceIps: deviceIpsWithPorts,
        selectedDevicesData,
      });
      setMidNoWarningDialog(true);
      return;
    }

    await proceedWithFetch(deviceIpsWithPorts, selectedDevicesData);
  };

  const proceedWithFetch = async (
    deviceIpsWithPorts: string[],
    _selectedDevicesData: BiometricDevice[]
  ) => {
    setDeviceImportLoading(true);
    setStagingPunches(true);
    showSpinner();

    try {
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

      // ── Stage punches into Redis ────────────────────────────────────
      try {
        await biometricService.stagePunches({
          from: punchImportFromDate,
          to: punchImportToDate,
        });
        await loadRegister();
        showSnackbar(
          `Fetched ${punchesData.length} logs: ${newPunchEntries.length} matched, ${unknownCount} unknown — staged successfully`,
          "success",
        );
      } catch (stageErr: any) {
        showSnackbar(
          `Fetched ${punchesData.length} logs but staging failed: ${stageErr?.message ?? "Unknown error"}`,
          "warning",
        );
      }
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to fetch punch logs from devices",
        "error",
      );
    } finally {
      setDeviceImportLoading(false);
      setStagingPunches(false);
      hideSpinner();
      setPendingFetchParams(null);
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

  const visibleColumnCount =
    2 /* selection + name */ +
    COLUMN_CONFIG.filter((c) => showColumn(c.key)).length +
    1 /* action */;

  // ── Run Attendance (commits staged Redis → attendance_records) ──────────
  const runAttendance = async () => {
    showSpinner();
    try {
      // await biometricService.runAttendance();
      // showSnackbar("Attendance committed successfully", "success");
      const result = await biometricService.runAttendance({ from: date, to: date });
      showSnackbar(
        `Attendance committed: ${result.daysImported} day(s), ${result.totalPunches} punches` +
        (result.skipped ? `, ${result.skipped} skipped` : "") +
        (result.errors ? `, ${result.errors} errors` : ""),
        result.errors > 0 ? "warning" : "success",
      );
      const response: any = await attendanceService.getRegister({
        startDate: date,
        endDate: date,
        departmentId: departmentId === "All" ? undefined : departmentId || undefined,
        branchId: branchId || undefined,
        status: statusFilter || undefined,
      });
      const data = response?.data?.data ?? response?.data;
      const employeesData = Array.isArray(data) ? data : (data?.content ?? []);
      setEmployees(employeesData);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
      await loadStagedPunches();
      await loadTodaySummary();
    } catch (error: any) {
      showSnackbar(error?.response?.data?.message ?? error?.message ?? "Failed to run attendance", "error");
    } finally {
      hideSpinner();
    }
  }

  const getDisplayStatus = (emp: RegisterEmployee): string => {
    const rawStatus = (emp.status ?? "").toString().toLowerCase();

    if (rawStatus === "irregular") {
      const earlyOut = Number(emp.earlyOutMinutes ?? 0);
      const late = Number(emp.lateMinutes ?? 0);

      if (earlyOut > 0 && late > 0) return "lateinearlyout";
      if (earlyOut > 0 && late === 0) return "earlyout";
    }

    return rawStatus;
  };

  // const hasIrregular = employees.some(
  //   (emp) => ATTENDANCE_STATUS_LABELS[emp.status]?.toLowerCase() === "irregular",
  // );
  const hasIrregular = employees.some(
    (emp) => getDisplayStatus(emp) === "irregular",
  );

  const hasMissedPunch = employees.some(
    (emp) => ATTENDANCE_STATUS_LABELS[emp.status]?.toLowerCase() === "checked_in",
  );

  const openMovements = (emp: RegisterEmployee) => {
    setMovementEmployee(emp);
    setMovementRows(pairMovements(emp.movement ?? []));
    setMovementDialogOpen(true);
  };


  const handleMovementClassify = async (
    row: PairedMovement,
    value: "official" | "personal" | "break",
  ) => {
    if (!movementEmployee) return;

    setMovementRows((prev) =>
      prev.map((r) =>
        r.index === row.index ? { ...r, classification: value, saving: true } : r,
      ),
    );
    setMovementSavingIdx(row.index);

    try {
      let permissionRequestId: string | null = null;

      if (value === "official" || value === "personal") {
        const created = await permissionRequestService.createPermission({
          employeeId: movementEmployee.employeeId,
          permissionType: value === "official" ? "official_work" : "personal_work",
          date: dayjs(movementEmployee.checkInDate ?? date).format("YYYY-MM-DD"),
          departureTime: dayjs(row.outTime).format("HH:mm:ss"),
          expectedReturnTime: dayjs(
            row.inTime ?? movementEmployee.checkOutTime ?? new Date()
          ).format("HH:mm:ss"),
          destination: "Biometric Movement",
          reason: value,
          generateGatePassSlip: true,
        });
        permissionRequestId = created?.id ?? null;
      }

      setMovementRows((prev) =>
        prev.map((r) =>
          r.index === row.index
            ? { ...r, classification: value, permissionRequestId, saving: false }
            : r,
        ),
      );

      showSnackbar(
        value === "break"
          ? `Movement #${row.index} marked as break`
          : `Permission request (${value}) created for movement #${row.index}`,
        "success",
      );
    } catch (err: any) {
      setMovementRows((prev) =>
        prev.map((r) =>
          r.index === row.index ? { ...r, classification: null, saving: false } : r,
        ),
      );
      showSnackbar(
        err?.response?.data?.message ?? err?.message ?? "Failed to classify movement",
        "error",
      );
    } finally {
      setMovementSavingIdx(null);
    }
  };

  return (
    <div className="p-4 space-y-3">
      {stagedPunchCheckFailed && (
        <Alert severity="error">
          Staged punches could not be checked. Punch editing and attendance processing are disabled until the check succeeds.
        </Alert>
      )}

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

          {hasStagedPunches && !loadingStagedPunches && !stagedPunchCheckFailed ? (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PlayArrowOutlined className="!w-4" />}
              onClick={runAttendance}
            >
              Run Attendance ({stagedPunches.length})
            </Button>
          ) : !loadingStagedPunches &&
            !stagedPunchCheckFailed &&
            !loading &&
            employees.length > 0 &&
            !processStatus?.locked ? (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PlayArrowOutlined className="!w-4" />}
              onClick={() => navigate(`/attendance/process?fromDate=${encodeURIComponent(date)}&toDate=${encodeURIComponent(date)}`)}
            >
              {processStatus?.processed ? "Re-process Attendance" : "Process Attendance"}
            </Button>
          ) : null}
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
          <ToggleButtonGroup
            size="small"
            exclusive
            value={timeUnit}
            onChange={(_, val) => val && setTimeUnit(val)}
            aria-label="time display unit"
          >
            <ToggleButton value="min" className="text-gray-800" sx={{ px: 1.5, py: 0.25, textTransform: "none", fontSize: 12 }}>
              min
            </ToggleButton>
            <ToggleButton value="hrs" className="text-gray-800" sx={{ px: 1.5, py: 0.25, textTransform: "none", fontSize: 12 }}>
              hrs
            </ToggleButton>
          </ToggleButtonGroup>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_CHIP_OPTIONS.map((o) => {
              const isIrregularOption = o.value === "irregular" || o.value === "missed_out";
              const shouldBlink = isIrregularOption && (hasIrregular || hasMissedPunch) && statusFilter !== o.value;
              return (
                <Chip
                  key={o.value}
                  label={o.label}
                  size="small"
                  variant={statusFilter === o.value ? "filled" : "outlined"}
                  color={statusFilter === o.value ? "primary" : "default"}
                  onClick={() => setStatusFilter(o.value)}
                  className={`cursor-pointer text-gray-800 ${shouldBlink && stagedPunches.length > 0 ? "!bg-red-500 !text-white animate-blink" : ""}`}
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
              )
            })}
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
        <div className="flex">
          {/* ── Table ── */}
          <div className="flex-1 min-w-0">
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
                    <TableCell className="!font-bold !sticky left-[68px] !z-40">
                      Emp Name
                    </TableCell>
                    {showColumn("department") && (
                      <TableCell className="!font-bold">Department</TableCell>
                    )}
                    {showColumn("shift") && (
                      <TableCell className="!font-bold">Shift</TableCell>
                    )}
                    {showColumn("checkInDate") && (
                      <TableCell className="!font-bold">Check In Date</TableCell>
                    )}
                    {showColumn("checkInTime") && (
                      <TableCell className="!font-bold">Check In Time</TableCell>
                    )}
                    {showColumn("checkOutDate") && (
                      <TableCell className="!font-bold">Check Out Date</TableCell>
                    )}
                    {showColumn("checkOutTime") && (
                      <TableCell className="!font-bold">Check Out Time</TableCell>
                    )}
                    {showColumn("earlyOut") && (
                      <TableCell className="!font-bold">Early Out ({timeUnit})</TableCell>
                    )}
                    {showColumn("late") && (
                      <TableCell className="!font-bold">Late ({timeUnit})</TableCell>
                    )}
                    {showColumn("overtime") && (
                      <TableCell className="!font-bold">Overtime ({timeUnit})</TableCell>
                    )}
                    {showColumn("worked") && (
                      <TableCell className="!font-bold">Worked ({timeUnit})</TableCell>
                    )}
                    {showColumn("movement") && (
                      <TableCell className="!font-bold !sticky right-[99px] !z-40">Movement</TableCell>
                    )}
                    {showColumn("status") && (
                      <TableCell className="!font-bold !sticky right-[69px] !z-40">
                        Status
                      </TableCell>
                    )}
                    <TableCell className="!font-bold !sticky right-0 !z-40">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>{/* Loading placeholder */}</TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumnCount} align="center" className="py-8">
                        <div className="text-[12px] text-gray-400 pt-7">
                          No records for {dayjs(date).format("DD MMM YYYY")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp, i) => {
                      const isLeave = emp.status === "leave";
                      const isEditing = inlineEditInProgress === emp.employeeId;

                      const displayCheckInDate = emp.checkInDate
                        ? dayjs(emp.checkInDate).format("DD MMM YYYY")
                        : null;

                      const displayCheckInTime = emp.checkInTime
                        ? dayjs(emp.checkInTime).format("HH:mm:ss")
                        : null;

                      const displayCheckOutDate = emp.checkOutDate
                        ? dayjs(emp.checkOutDate).format("DD MMM YYYY")
                        : null;

                      const displayCheckOutTime = emp.checkOutTime
                        ? dayjs(emp.checkOutTime).format("HH:mm:ss")
                        : null;

                      const lockCheckInDate = !!emp.checkInDate;
                      const lockCheckOutDate = !!emp.checkOutDate;

                      return (
                        <TableRow
                          key={emp.employeeId || i}
                          sx={{
                            ...getRowColor(i),
                          }}
                        >
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
                          <TableCell className="!sticky left-[68px] !z-20 bg-inherit ">
                            <div className="flex items-center gap-1">
                              <div>
                                {emp.employeeName} ({emp.employeeCode})
                              </div>
                            </div>
                            <div className="text-blue-500">{emp.template || "-"}</div>
                          </TableCell>

                          {showColumn("department") && (
                            <TableCell>
                              <div>{emp.department || "-"}</div>
                              <div className="text-blue-500">{emp.designation || "-"}</div>
                            </TableCell>
                          )}

                          {showColumn("shift") && (
                            <TableCell className="text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                                  style={{
                                    backgroundColor: shiftColorMap[emp.shiftCode] || "#9ca3af",
                                  }}
                                  title={emp.shiftCode ? `Shift ${emp.shiftCode}` : "No shift"}
                                />
                                <div>{emp.shiftCode || "-"}</div>
                              </div>
                              <div className="text-primary font-bold">
                                {emp.shiftStart || "-"} - {emp.shiftEnd || "-"}
                              </div>
                            </TableCell>
                          )}

                          {/* ─── CHECK-IN DATE ─── */}
                          {showColumn("checkInDate") && (
                            <TableCell data-edit-cell="checkInDate">
                              <div className="flex items-center gap-1">
                                {isEditingField(emp.employeeId, "checkInDate") && canEditPunchTimes && !processStatus.locked ? (
                                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                                    <DateTimePicker
                                      value={draftDateTime}
                                      onChange={(newValue) => setDraftDateTime(newValue)}
                                      format="DD/MM/YYYY HH:mm:ss"
                                      ampm={false}
                                      maxDateTime={dayjs()}
                                      disabled={isLeave || isEditing || !canEditPunchTimes}
                                      slotProps={{
                                        textField: {
                                          variant: "outlined",
                                          autoFocus: true,
                                          onKeyDown: (e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              commitAndMoveNext(emp, "checkInDate");
                                            } else if (e.key === "Escape") {
                                              closeField();
                                            }
                                          },
                                          onBlur: (e) => handleFieldBlur(e, emp, "checkInDate"),
                                          sx: {
                                            ...inlineInputSx,
                                            width: "140px",
                                            ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                              padding: "0 2px 0 5px !important",
                                            },
                                          },
                                        },
                                        popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                      }}
                                    />
                                  </LocalizationProvider>
                                ) : (
                                  <InlineDisplay
                                    value={displayCheckInDate}
                                    onClick={() =>
                                      !isLeave &&
                                      canEditPunchTimes &&
                                      !isEditing &&
                                      !processStatus.locked &&
                                      !lockCheckInDate &&
                                      openField(
                                        emp.employeeId,
                                        "checkInDate",
                                        dayjs(emp.checkInTime || emp.checkInDate || date),
                                      )
                                    }
                                    disabled={isLeave || isEditing || lockCheckInDate || !canEditPunchTimes}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}

                          {/* ─── CHECK-IN TIME ─── */}
                          {showColumn("checkInTime") && (
                            <TableCell data-edit-cell="checkInTime">
                              <div className="flex items-center gap-1">
                                {isEditingField(emp.employeeId, "checkInTime") && canEditPunchTimes && !processStatus.locked ? (
                                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                      ampm={false}
                                      value={draftDateTime}
                                      onChange={(newValue) => setDraftDateTime(newValue)}
                                      format="HH:mm:ss"
                                      disabled={isLeave || isEditing || !canEditPunchTimes}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          variant: "outlined",
                                          autoFocus: true,
                                          onKeyDown: (e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              commitAndMoveNext(emp, "checkInTime");
                                            } else if (e.key === "Escape") {
                                              closeField();
                                            }
                                          },
                                          onBlur: (e) => handleFieldBlur(e, emp, "checkInTime"),
                                          sx: {
                                            ...inlineInputSx,
                                            width: "80px",
                                            "& .MuiInputBase-input": {
                                              color:
                                                (emp.status ?? "").toString().toLowerCase().match(/irregular|missed|checked_?in/)
                                                  ? "#dc2626" // red-600 when problem status
                                                  : emp.checkInTime
                                                    ? "#15803d"
                                                    : "#ef4444",
                                            },
                                            ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                              padding: "5px !important",
                                            },
                                          },
                                        },
                                        popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                      }}
                                    />
                                  </LocalizationProvider>
                                ) : (
                                  <InlineDisplay
                                    value={displayCheckInTime}
                                    onClick={() =>
                                      !isLeave &&
                                      canEditPunchTimes &&
                                      !isEditing &&
                                      !processStatus.locked &&
                                      openField(
                                        emp.employeeId,
                                        "checkInTime",
                                        emp.checkInTime ? dayjs(emp.checkInTime) : null,
                                      )
                                    }
                                    disabled={isLeave || isEditing || !canEditPunchTimes}
                                    className={punchTimeColor(emp, "checkInTime")}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}

                          {/* ─── CHECK-OUT DATE ─── */}
                          {showColumn("checkOutDate") && (
                            <TableCell data-edit-cell="checkOutDate">
                              <div className="flex items-center gap-1">
                                {isEditingField(emp.employeeId, "checkOutDate") && canEditPunchTimes && !processStatus.locked ? (
                                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                                    <DateTimePicker
                                      value={draftDateTime}
                                      onChange={(newValue) => setDraftDateTime(newValue)}
                                      format="DD/MM/YYYY HH:mm:ss"
                                      ampm={false}
                                      maxDateTime={dayjs()}
                                      minDateTime={emp.checkInTime ? dayjs(emp.checkInTime) : undefined}
                                      disabled={isLeave || isEditing || !emp.checkInTime || !canEditPunchTimes}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          variant: "outlined",
                                          autoFocus: true,
                                          onKeyDown: (e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              commitAndMoveNext(emp, "checkOutDate");
                                            } else if (e.key === "Escape") {
                                              closeField();
                                            }
                                          },
                                          onBlur: (e) => handleFieldBlur(e, emp, "checkOutDate"),
                                          sx: {
                                            ...inlineInputSx,
                                            width: "140px",
                                            "& .MuiInputBase-input": {
                                              color: emp.checkOutDate ? "#1f2937" : "#9ca3af",
                                            },
                                            ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                              padding: "0 2px 0 5px !important",
                                            },
                                          },
                                        },
                                        popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                      }}
                                    />
                                  </LocalizationProvider>
                                ) : (
                                  <InlineDisplay
                                    value={displayCheckOutDate}
                                    onClick={() =>
                                      !isLeave &&
                                      canEditPunchTimes &&
                                      !isEditing &&
                                      !processStatus.locked &&
                                      emp.checkInTime &&
                                      !lockCheckOutDate &&
                                      openField(
                                        emp.employeeId,
                                        "checkOutDate",
                                        dayjs(emp.checkOutTime || emp.checkOutDate || date),
                                      )
                                    }
                                    disabled={isLeave || isEditing || !emp.checkInTime || lockCheckOutDate || !canEditPunchTimes}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}

                          {/* ─── CHECK-OUT TIME ─── */}
                          {showColumn("checkOutTime") && (
                            <TableCell data-edit-cell="checkOutTime">
                              <div className="flex items-center gap-1">
                                {isEditingField(emp.employeeId, "checkOutTime") && canEditPunchTimes && !processStatus.locked ? (
                                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                      ampm={false}
                                      value={draftDateTime}
                                      onChange={(newValue) => setDraftDateTime(newValue)}
                                      format="HH:mm:ss"
                                      disabled={isLeave || isEditing || !emp.checkInTime || !canEditPunchTimes}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          variant: "outlined",
                                          autoFocus: true,
                                          onKeyDown: (e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              commitAndMoveNext(emp, "checkOutTime");
                                            } else if (e.key === "Escape") {
                                              closeField();
                                            }
                                          },
                                          onBlur: (e) => handleFieldBlur(e, emp, "checkOutTime"),
                                          sx: {
                                            ...inlineInputSx,
                                            width: "80px",
                                            "& .MuiInputBase-input": {
                                              color:
                                                (emp.status ?? "").toString().toLowerCase().match(/irregular|missed|checked_?in/)
                                                  ? "#dc2626"
                                                  : emp.checkOutTime
                                                    ? "#2563eb"
                                                    : "#9ca3af",
                                            },
                                            ".MuiPickersInputBase-root.MuiPickersOutlinedInput-root": {
                                              padding: "5px !important",
                                            },
                                          },
                                        },
                                        popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 10 } },
                                      }}
                                    />
                                  </LocalizationProvider>
                                ) : (
                                  <InlineDisplay
                                    value={displayCheckOutTime}
                                    onClick={() =>
                                      !isLeave &&
                                      canEditPunchTimes &&
                                      !isEditing &&
                                      !processStatus.locked &&
                                      emp.checkInTime &&
                                      openField(
                                        emp.employeeId,
                                        "checkOutTime",
                                        emp.checkOutTime ? dayjs(emp.checkOutTime) : null,
                                      )
                                    }
                                    disabled={isLeave || isEditing || !emp.checkInTime || !canEditPunchTimes}
                                    className={punchTimeColor(emp, "checkOutTime")}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}

                          {showColumn("earlyOut") && (
                            <TableCell>{formatMinutes(timeUnit, emp.earlyOutMinutes)}</TableCell>
                          )}
                          {showColumn("late") && (
                            <TableCell>{formatMinutes(timeUnit, emp.lateMinutes)}</TableCell>
                          )}
                          {showColumn("overtime") && (
                            <TableCell>{formatMinutes(timeUnit, emp.overtimeMinutes)}</TableCell>
                          )}
                          {showColumn("worked") && (
                            <TableCell>{formatMinutes(timeUnit, emp.workedMinutes)}</TableCell>
                          )}

                          {showColumn("movement") && (
                            <TableCell className="!sticky right-[99px] !z-20 bg-inherit">
                              {emp.movement && emp.movement.length > 0 ? (
                                <Tooltip
                                  title={`${pairMovements(emp.movement).length} movement(s) — click to review`}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    className="!text-primary !border-primary !text-[11px] !py-0 !px-2 !min-w-0"
                                    startIcon={<SwapHorizOutlined className="!w-3.5 !h-3.5" />}
                                    onClick={() => openMovements(emp)}
                                  >
                                    {pairMovements(emp.movement).length}
                                  </Button>
                                </Tooltip>
                              ) : (
                                <span className="text-gray-400 text-[12px]">-</span>
                              )}
                            </TableCell>
                          )}

                          {showColumn("status") && (
                            <TableCell className="!sticky right-[69px] !z-20 !bg-inherit">
                              {(() => {
                                const displayStatus = getDisplayStatus(emp);
                                const label =
                                  ATTENDANCE_STATUS_LABELS[displayStatus as keyof typeof ATTENDANCE_STATUS_LABELS] ??
                                  ATTENDANCE_STATUS_LABELS[emp.status] ??
                                  displayStatus;
                                const bg =
                                  ATTENDANCE_STATUS_BG[displayStatus as keyof typeof ATTENDANCE_STATUS_BG] ??
                                  ATTENDANCE_STATUS_BG[emp.status] ??
                                  "bg-gray-100 text-gray-600";

                                return (
                                  <div className="flex items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${bg}`}>
                                      {label}
                                    </span>
                                    {emp.correctionPending && (
                                      <Tooltip title="Correction pending approval">
                                        <PendingActionsOutlined className="!w-4 !h-4 text-amber-500" />
                                      </Tooltip>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                          )}

                          <TableCell className="!sticky right-0 !z-20 !bg-inherit">
                            {!isLeave ? (
                              <div className="flex items-center gap-1">
                                {!emp.checkInTime && (
                                  <Tooltip title="Mark Check-in">
                                    <IconButton
                                      size="small"
                                      onClick={() => openPunch(emp, "checkIn")}
                                      disabled={!canEditPunchTimes}
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
                                      disabled={!canEditPunchTimes}
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
          </div>

          {/* ── Vertical column filter ── */}
          <div className="border-l border-gray-200 flex items-start pt-2 px-1">
            <Tooltip title="Show / hide columns" placement="left" arrow>
              <button
                type="button"
                onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                className="flex flex-col items-center gap-1 px-1.5 py-2 rounded hover:bg-gray-100 text-gray-600"
                aria-label="Column settings"
              >
                <ViewColumnOutlined fontSize="small" />
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  Columns
                </span>
              </button>
            </Tooltip>

            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={() => setColumnMenuAnchor(null)}
              anchorOrigin={{ vertical: "top", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            // PaperProps={{ sx: { minWidth: 210, maxHeight: 400 } }}
            >
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-gray-700">Columns</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => setVisibleColumns({ ...DEFAULT_VISIBLE_COLUMNS })}
                  >
                    All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() =>
                      setVisibleColumns(
                        COLUMN_CONFIG.reduce(
                          (acc, c) => ({ ...acc, [c.key]: false }),
                          {} as Record<ColumnKey, boolean>,
                        ),
                      )
                    }
                  >
                    None
                  </button>
                </div>
              </div>

              {COLUMN_CONFIG.map((col) => (
                <MenuItem
                  key={col.key}
                  dense
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(col.key);
                  }}
                  className="!py-0.5"
                >
                  <Checkbox
                    size="small"
                    checked={showColumn(col.key)}
                    className="!py-0.5 !pr-1 text-gray-800"
                  />
                  <span className="text-[12px] text-gray-700">{col.label}</span>
                </MenuItem>
              ))}
            </Menu>
          </div>
        </div>

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

      {/* MID No Warning Dialog */}
      <Dialog
        open={midNoWarningDialog}
        onClose={() => {
          setMidNoWarningDialog(false);
          setEmployeesWithoutMidNo([]);
          setPendingFetchParams(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <WarningAmberOutlined className="text-amber-500" />
            Employees Without MID Number
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setMidNoWarningDialog(false);
              setEmployeesWithoutMidNo([]);
              setPendingFetchParams(null);
            }}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          <div className="space-y-4">
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <span className="text-[12px]">
                <strong>{employeesWithoutMidNo.length}</strong> employee
                {employeesWithoutMidNo.length !== 1 ? "s" : ""} do not have a MID number
                assigned. Their attendance logs will <strong>not</strong> be fetched from
                the biometric machine.
              </span>
            </Alert>

            <div className="border border-amber-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
                <span className="text-[12px] font-medium text-amber-700">
                  Employees Without MID Number ({employeesWithoutMidNo.length})
                </span>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {employeesWithoutMidNo.map((emp: any, index: number) => (
                  <div
                    key={emp.id || emp.employeeId || index}
                    className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {emp.name || emp.employeeName}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {emp.employeeId || emp.employeeCode}
                        {emp.department && ` • ${emp.department}`}
                      </div>
                    </div>
                    <Chip
                      label="No MID"
                      size="small"
                      className="!bg-amber-100 !text-amber-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Alert severity="info" sx={{ py: 0.5 }}>
              <div className="text-[12px]">
                <strong>To fix this:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>
                    Go to the <strong>Employees list</strong> and update the MID number
                    for each employee, or
                  </li>
                  <li>
                    Use <strong>Bulk Mapping</strong> in Device Integration to assign
                    MID numbers in bulk
                  </li>
                </ul>
              </div>
            </Alert>
          </div>
        </DialogContent>

        <DialogActions className="!p-3 !border-t !border-gray-200 flex-wrap gap-2">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => {
              setMidNoWarningDialog(false);
              setEmployeesWithoutMidNo([]);
              setPendingFetchParams(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<GroupOutlined />}
            onClick={() => {
              setMidNoWarningDialog(false);
              setPunchImportOpen(false);
              navigate("/employees");
            }}
          >
            Go to Employees
          </Button>
          <Button
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<PunchClockOutlined />}
            onClick={() => {
              setMidNoWarningDialog(false);
              setPunchImportOpen(false);
              navigate("/attendance/management/biometric");
            }}
          >
            Bulk Mapping
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<PunchClockOutlined />}
            onClick={async () => {
              setMidNoWarningDialog(false);
              if (pendingFetchParams) {
                await proceedWithFetch(
                  pendingFetchParams.deviceIps,
                  pendingFetchParams.selectedDevicesData
                );
              }
            }}
          >
            Proceed Anyway
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
              <FormControl fullWidth size="small">
                <InputLabel>Period Type</InputLabel>
                <Select
                  value={importType}
                  label="Period Type"
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
                  Uploading and staging attendance punches...
                </div>
              </div>
            )}

            {/* ── Staged response summary ── */}
            {importResult && !importing && (
              <div
                className={`border rounded-lg p-3 bg-white-50 space-y-2 ${importResult.failed > 0 && importResult.success === 0
                  ? "border-red-200 bg-red-50"
                  : importResult.failed > 0
                    ? "border-orange-200 bg-orange-50"
                    : "border-green-200 bg-green-50"
                  }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {importResult.failed > 0 && importResult.success === 0 ? (
                      <ErrorOutlined className="text-red-500" fontSize="small" />
                    ) : importResult.failed > 0 ? (
                      <WarningAmberOutlined className="text-orange-500" fontSize="small" />
                    ) : (
                      <CheckCircleOutlined className="text-green-500" fontSize="small" />
                    )}
                    <span className="text-sm font-medium text-gray-800">
                      Import Result
                    </span>
                  </div>
                  <span className="text-[12px]">
                    <span className="text-green-600 font-semibold">{importResult.success}</span>{" "}
                    staged
                    {importResult.skipped ? (
                      <span className="text-amber-600 ml-2">{importResult.skipped} skipped</span>
                    ) : null}
                    {importResult.failed > 0 && (
                      <span className="text-red-600 ml-2">{importResult.failed} failed</span>
                    )}
                  </span>
                </div>

                {/* Meta — one compact line */}
                <div className="text-[11px] text-gray-600">
                  {importResult.source && (
                    <span className="capitalize">{importResult.source}</span>
                  )}
                  {importResult.importType && (
                    <>
                      {" · "}
                      <span className="capitalize">{importResult.importType.toLowerCase()}</span>
                    </>
                  )}
                  {importResult.periodStart && importResult.periodEnd && (
                    <>
                      {" · "}
                      {dayjs(importResult.periodStart).format("DD MMM")} →{" "}
                      {dayjs(importResult.periodEnd).format("DD MMM YYYY")}
                    </>
                  )}
                  {" · "}
                  {importResult.totalPunches ?? 0} punches
                  {/* {importResult.daysImported ? ` · ${importResult.daysImported} days` : ""} */}
                </div>

                {/* Rows */}
                {importResult.rows.length > 0 && (
                  <div className="max-h-[180px] overflow-y-auto bg-white-50 rounded border border-gray-200">
                    <table className="w-full text-[12px]">
                      <tbody>
                        {importResult.rows.map((row: any, idx: number) => {
                          const msg = String(row?.message ?? "");
                          const ok = SUCCESS_ROW_MESSAGES.has(msg.toLowerCase());
                          return (
                            <tr key={idx} className="border-b border-gray-200 last:border-0">
                              <td className="px-2 py-1 font-mono text-gray-800 w-[70px]">
                                {row.employeeCode || "-"}
                              </td>
                              <td className="px-2 py-1 text-gray-500 w-[100px]">
                                {row.date ? dayjs(row.date).format("DD MMM") : "-"}
                              </td>
                              <td className={`px-2 py-1 ${ok ? "text-green-700" : "text-red-600"}`}>
                                {msg || "-"}
                              </td>
                              <td className="px-2 py-1 text-center w-[28px]">
                                {ok ? (
                                  <CheckCircleOutlined className="text-green-500 !w-3.5 !h-3.5" />
                                ) : (
                                  <ErrorOutlined className="text-red-500 !w-3.5 !h-3.5" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Errors (only real ones) */}
                {importResult.errors.length > 0 && (
                  <div className="max-h-[90px] overflow-y-auto bg-white/50 rounded p-2">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <div key={i} className="text-[12px] text-red-600 py-0.5">• {e}</div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        + {importResult.errors.length - 5} more
                      </div>
                    )}
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
                  <li>The selected register date is used for the file date span</li>
                </ul>
              </div>
            </Alert>

            {/* <div className="flex gap-2">
              <Button
                variant="outlined"
                size="small"
                className="!text-primary !border-primary"
                onClick={handlePreviewFile}
                disabled={!importFile || importing}
              >
                Preview Data
              </Button>
            </div> */}

            {/* {previewData.length > 0 && (
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
                        <th className="px-3 py-1.5 text-left text-gray-600">Employee</th>
                        <th className="px-3 py-1.5 text-left text-gray-600">Original Timestamp</th>
                        <th className="px-3 py-1.5 text-left text-gray-600">Formatted</th>
                        <th className="px-3 py-1.5 text-center text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 font-mono">{row.employeeCode}</td>
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
            )} */}
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
                      onChange={(newValue) => {
                        setPunchImportFromDate(
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                        );
                        setPunchImportToDate(
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                        )
                      }
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

            {punchSource === "biometric" && devices.length > 0 ? (
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
            ) : (
              punchSource === "biometric" && devices.length === 0 && (
                <Button variant="outlined" className="!text-primary !border-primary" onClick={() => navigate("/attendance/management/biometric")}>
                  Add Biometric Device
                </Button>
              )
            )}

            {punchSource === "biometric" && deviceFetchSummary.total > 0 && (
              <div className="border border-green-200 rounded overflow-hidden">
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center justify-between">
                  <div className="text-[12px] font-medium text-green-700">
                    <div>
                      Fetched from Devices ({deviceFetchSummary.total} total logs)
                    </div>
                    <div className="mt-0.5 text-[11px] text-black">
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
                      className="grid grid-cols-[30px_2fr_2fr_2fr_1fr] gap-2 px-3 py-2 border-b border-gray-200"
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

            {(punchImporting || deviceImportLoading || stagingPunches) && <LinearProgress />}
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

      {/* ── Movements Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={movementDialogOpen}
        onClose={() => {
          setMovementDialogOpen(false);
          setMovementEmployee(null);
          setMovementRows([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <SwapHorizOutlined className="text-primary" />
            Movements
            {movementEmployee && (
              <span className="text-[12px] font-normal text-gray-500">
                ({movementEmployee.employeeName} ({movementEmployee.employeeCode}) ·{" "}
                {dayjs(date).format("DD MMM YYYY")})
              </span>
            )}
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setMovementDialogOpen(false);
              setMovementEmployee(null);
              setMovementRows([]);
            }}
          >
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          {movementRows.length === 0 ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <span className="text-[12px]">No movements recorded for this employee.</span>
            </Alert>
          ) : (
            <div className="space-y-2">
              {movementEmployee && (
                <div className="grid grid-cols-3 items-center justify-center gap-2 text-[12px] bg-gray-50 border border-gray-200 rounded p-2">
                  <div>
                    <span className="text-gray-500">Check-in:</span>{" "}
                    <b className="text-green-600">
                      {movementEmployee.checkInTime
                        ? dayjs(movementEmployee.checkInTime).format("HH:mm:ss")
                        : "-"}
                    </b>
                  </div>
                  <div>
                    <span className="text-gray-500">Movements:</span>{" "}
                    <b className="text-blue-500">{movementRows.length}</b>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-out:</span>{" "}
                    <b className="text-green-600">
                      {movementEmployee.checkOutTime
                        ? dayjs(movementEmployee.checkOutTime).format("HH:mm:ss")
                        : "-"}
                    </b>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-[36px_1fr_1fr_90px_180px_150px] gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200 text-[12px] font-medium text-gray-800">
                  <div className="!font-bold">#</div>
                  <div className="!font-bold">OUT</div>
                  <div className="!font-bold">IN</div>
                  <div className="!font-bold">Duration</div>
                  <div className="!font-bold">Classification</div>
                  <div className="!font-bold">Permission Req.</div>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {movementRows.map((row) => (
                    <div
                      key={row.index}
                      className="grid grid-cols-[36px_1fr_1fr_90px_180px_150px] gap-2 px-3 py-2 border-b border-gray-200 last:border-0 items-center"
                    >
                      <div className="text-[12px] text-gray-400">{row.index}</div>

                      <div className="text-[12px]">
                        {dayjs(row.outTime).format("DD MMM HH:mm:ss")}
                      </div>

                      <div className="text-[12px]">
                        {row.inTime ? (
                          dayjs(row.inTime).format("DD MMM HH:mm:ss")
                        ) : (
                          <span className="text-amber-600">Still out</span>
                        )}
                      </div>

                      <div className="text-[12px] text-gray-700">
                        {row.durationMinutes != null
                          ? formatMinutes(timeUnit, row.durationMinutes)
                          : "-"}
                      </div>

                      <div>
                        <ToggleButtonGroup
                          size="small"
                          exclusive
                          value={row.classification}
                          onChange={(_, val) => {
                            if (!val) return;
                            handleMovementClassify(row, val);
                          }}
                          disabled={row.saving || movementSavingIdx === row.index}
                          className="text-gray-800"
                        >
                          <ToggleButton
                            value="official"
                            className="text-gray-800 border-gray-200"
                            sx={{ px: 1, py: 0.25, textTransform: "none", fontSize: 11 }}
                          >
                            Official
                          </ToggleButton>
                          <ToggleButton
                            value="personal"
                            className="text-gray-800 border-gray-200"
                            sx={{ px: 1, py: 0.25, textTransform: "none", fontSize: 11 }}
                          >
                            Personal
                          </ToggleButton>
                          <ToggleButton
                            value="break"
                            className="text-gray-800 border-gray-200"
                            sx={{ px: 1, py: 0.25, textTransform: "none", fontSize: 11 }}
                          >
                            Break
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </div>

                      <div className="text-[12px]">
                        {row.classification === "break" ? (
                          <Chip
                            size="small"
                            label="No request (break)"
                            className="!bg-amber-100 !text-amber-700"
                          />
                        ) : row.classification ? (
                          row.saving ? (
                            <span className="text-gray-500">Creating…</span>
                          ) : row.permissionRequestId ? (
                            <Chip
                              size="small"
                              label={`Request created (${row.classification})`}
                              className={
                                row.classification === "official"
                                  ? "!bg-blue-100 !text-blue-700"
                                  : "!bg-emerald-100 !text-emerald-700"
                              }
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="No request"
                              className="!bg-gray-100 !text-gray-600"
                            />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => {
              setMovementDialogOpen(false);
              setMovementEmployee(null);
              setMovementRows([]);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}