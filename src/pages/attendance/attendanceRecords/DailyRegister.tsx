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
  WbSunnyOutlined,
  InfoOutlined,
  CloudUploadOutlined,
  PunchClockOutlined,
  InsertDriveFileOutlined,
  Add,
  PlaylistAddCheckCircleOutlined,
  DownloadOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { AttendanceStatus } from "../../../services/modules/attendanceTypes";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_BG,
  formatTime,
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
interface RegisterEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftCode: string;
  shiftStart: string;
  shiftEnd: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  workedMinutes: number;
  lateMinutes: number;
}
interface TodaySummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  onDuty: number;
  checkedIn: number;
  notYetIn: number;
  attendancePercentage: number;
}

interface Holiday {
  date: string;
  name: string;
  type: string;
}

const STATUS_CHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "checked_in", label: "Checked In" },
  { value: "on_duty", label: "On Duty" },
  { value: "leave", label: "On Leave" },
  { value: "holiday", label: "Holiday" },
  { value: "weekly_off", label: "Weekly Off" },
];

export function DailyRegister() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employees, setEmployees] = useState<RegisterEmployee[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [total, setTotal] = useState(0);
  // const [page, setPage] = useState(0);
  // const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const { session } = useAuth();

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Check-in / Check-out dialog
  const [punchDialogOpen, setPunchDialogOpen] = useState(false);
  const [punchType, setPunchType] = useState<"checkIn" | "checkOut">("checkIn");
  const [punchEmployee, setPunchEmployee] = useState<RegisterEmployee | null>(
    null,
  );
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
    type: 'checkIn' | 'checkOut';
    total: number;
    success: number;
    skipped: number;
    errors: number;
    results: any[];
    checkoutTime?: string;
  } | null>(null);

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState<
    "check_in" | "check_out" | "attendance"
  >("check_in");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [employeesToRem, setEmployeesToRem] = useState<any[]>([]);
  const [sendVia, setSendVia] = useState(["email"]);
  const [importSource, setImportSource] = useState("biometric");
  const [importStartDate, setImportStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importEndDate, setImportEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importType, setImportType] = useState<'daywise' | 'weekwise' | 'monthwise'>('daywise');

  // Add these state variables after the existing ones
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectAllDevices, setSelectAllDevices] = useState(false);
  const [punchImportFromDate, setPunchImportFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [punchImportToDate, setPunchImportToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [deviceImportLoading, setDeviceImportLoading] = useState(false);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getRegister({
        startDate: date,
        endDate: date,
        departmentId: departmentId || undefined,
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
      hideSpinner();
    }
  }, [date, departmentId, branchId, statusFilter]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  // const [importDate, setImportDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[] | any[];
    rows: any[]
  } | null>(null);

  const [punchImportOpen, setPunchImportOpen] = useState(false);
  const [punchSource, setPunchSource] = useState("manual");
  const [punchEntries, setPunchEntries] = useState<any[]>([]);
  const [punchImporting, setPunchImporting] = useState(false);
  const [punchImportResult, setPunchImportResult] = useState<any>(null);
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
    loadHolidays();
  }, [loadTodaySummary, loadHolidays]);

  useEffect(() => {
    Promise.all([
      departmentService.getActiveDepartments(),
      branchService.getActiveBranches(),
      biometricService.getAllDevices(),
      employeeService.getEmployees({ includeInactive: true, size: 10000 }), // Fetch all employees for matching
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
        )
      })
      .catch(() => { });
  }, []);

  const todayHoliday = holidays.find((h) => h.date === date);

  // ── Punch dialog ──────────────────────────────────────────────────────────
  function openPunch(emp: RegisterEmployee, type: "checkIn" | "checkOut") {
    setPunchEmployee(emp);
    setPunchType(type);
    setPunchTime(dayjs(`${date}T${dayjs().format('HH:mm:ss')}`).toISOString());
    setPunchRemarks("");
    setPunchDialogOpen(true);
  }

  async function submitPunch() {
    if (!punchEmployee || !punchTime) return;
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
      });
      showSnackbar(
        `Daily status posted for ${selected.size} employees`,
        "success",
      );
      setBulkDialogOpen(false);
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
          showSnackbar(
            `Attendance processed for ${selected.size} employees`,
            "success",
          );
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
        type: 'checkIn',
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

  // Bulk check out
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
        type: 'checkOut',
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
    if (selected.size === employees.length) {
      setSelected(new Set());
      setSelectAllChecked(false);
    } else {
      setSelected(new Set(employees.map((e) => e.employeeId)));
      setSelectAllChecked(true);
    }
  }

  // ── Reminder Handlers ────────────────────────────────────────────────────
  async function handleSendReminders() {
    if (!reminderMessage.trim()) {
      showSnackbar("Please enter a reminder message", "warning");
      return;
    }

    setSendingReminders(true);
    showSpinner();
    try {
      await attendanceService.sendReminders({
        recipientType: reminderType,
        reminderMessage: reminderMessage,
        employeeIds: employeesToRem.map((e) => e.id),
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

  // const handleAddEmployee = (employee: any) => {
  //   if (!employee) return;
  //   if (employeesToRem.find((e) => e.id === employee.id)) {
  //     showSnackbar("Employee already added", "warning");
  //     return;
  //   }
  //   setEmployeesToRem([...employeesToRem, employee]);
  // };

  // const handleRemoveEmployee = (id: string) => {
  //   setEmployeesToRem(employeesToRem.filter((e) => e.id !== id));
  // };

  const handleSendViaChange = (event: any) => {
    const value = event.target.value;
    if (value.length === 0) {
      showSnackbar("Please select at least one channel", "warning");
      return;
    }
    setSendVia(value);
  };

  // async function handleImportFile() {
  //   if (!importFile) {
  //     showSnackbar("Please select a file to import", "warning");
  //     return;
  //   }
  //   if (!importStartDate || !importEndDate) {
  //     showSnackbar("Please select date range", "warning");
  //     return;
  //   }
  //   if (dayjs(importEndDate).isBefore(dayjs(importStartDate))) {
  //     showSnackbar("End date must be after start date", "warning");
  //     return;
  //   }
  //   setImporting(true);
  //   setImportResult(null);
  //   showSpinner();

  //   try {
  //     const extension = importFile.name.split('.').pop()?.toLowerCase();
  //     let format = 'csv';
  //     if (extension === 'xlsx' || extension === 'xls') {
  //       format = 'excel';
  //     } else if (extension === 'txt' || extension === 'csv') {
  //       format = 'csv';
  //     }
  //     const params = {
  //       format,
  //       source: importSource,
  //       type: importType,
  //       startDate: importStartDate,
  //       endDate: importEndDate,
  //     };

  //     let fileToUpload = importFile;

  //     // Upload the file
  //     const res: any = await attendanceService.importAttendanceFile(params, fileToUpload);
  //     const data = res?.data?.data ?? res?.data;
  //     if (data) {
  //       const totalPunches = data.totalPunches || 0;
  //       const errorCount = data.errors || 0;
  //       const successCount = totalPunches - errorCount;
  //       const errorMessages: string[] = [];
  //       if (data.rows && Array.isArray(data.rows)) {
  //         data.rows.forEach((row: any) => {
  //           if (row.message && row.message !== 'imported') {
  //             const errorMsg = row.employeeCode
  //               ? `${row.employeeCode}: ${row.message}`
  //               : row.message;
  //             errorMessages.push(errorMsg);
  //           }
  //         });
  //       }
  //       if (errorCount > 0 && successCount === 0) {
  //         showSnackbar(
  //           `All ${totalPunches} records failed to import. Please check the format.`,
  //           "error"
  //         );
  //       } else if (errorCount > 0) {
  //         showSnackbar(
  //           `Imported with ${errorCount} error(s). ${successCount} successful.`,
  //           "warning"
  //         );
  //       } else {
  //         showSnackbar(
  //           `Successfully imported ${totalPunches} attendance records`,
  //           "success"
  //         );
  //       }
  //       setImportResult({
  //         success: successCount,
  //         failed: errorCount,
  //         errors: errorMessages,
  //         rows: data.rows || []
  //       });
  //       if (successCount > 0) {
  //         loadRegister();
  //         loadTodaySummary();
  //       }
  //     }
  //   } catch (err: any) {
  //     const errorMessage = err?.response?.data?.message
  //       || err?.message
  //       || "Failed to import attendance";
  //     showSnackbar(errorMessage, "error");
  //     setImportResult({
  //       success: 0,
  //       failed: 1,
  //       errors: [errorMessage],
  //       rows: []
  //     });
  //   } finally {
  //     setImporting(false);
  //     hideSpinner();
  //   }
  // }

  // Preview handler - Updated for Excel support

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
      const extension = importFile.name.split('.').pop()?.toLowerCase();
      let format = 'csv';
      // Determine format
      if (extension === 'xlsx' || extension === 'xls') {
        format = 'excel';
      } else if (extension === 'txt' || extension === 'csv') {
        format = 'csv';
      }
      let fileToUpload = importFile;
      // If it's an Excel file, read and convert to a properly formatted CSV
      if (format === 'excel') {
        try {
          const excelData = await readExcelFile(importFile);
          if (!excelData || excelData.length === 0) {
            showSnackbar("No data found in the Excel file", "warning");
            return;
          }
          // Get headers and identify columns
          const headers = Object.keys(excelData[0]);
          const employeeCodeKey = headers.find(h =>
            ['employee code', 'employeecode', 'employee', 'emp code', 'empcode', 'code', 'employee id', 'employeeid', 'empid', 'id'].some(key =>
              h.toLowerCase().replace(/\s/g, '') === key.replace(/\s/g, '') ||
              h.toLowerCase().includes(key.toLowerCase())
            )
          ) || headers[0];
          const timestampKey = headers.find(h =>
            ['timestamp', 'time', 'date', 'datetime', 'punch time', 'punchtime', 'checkin time', 'checkintime'].some(key =>
              h.toLowerCase().replace(/\s/g, '') === key.replace(/\s/g, '') ||
              h.toLowerCase().includes(key.toLowerCase())
            )
          ) || headers[1];
          // Format data for CSV
          const rows: any[] = [];
          let errorCount = 0;
          for (const row of excelData) {
            let employeeCode = row[employeeCodeKey] || '';
            let timestamp = row[timestampKey] || '';
            if (!employeeCode && !timestamp) continue;
            // Format timestamp
            let formattedTimestamp = '';
            if (timestamp) {
              let parsed = dayjs(timestamp);
              // Handle Excel date serial numbers
              if (typeof timestamp === 'number' && !parsed.isValid()) {
                const excelEpoch = dayjs('1899-12-30');
                parsed = excelEpoch.add(timestamp, 'day');
              }
              if (parsed.isValid()) {
                // Always convert to UTC ISO string
                formattedTimestamp = parsed.utc().toISOString();
              } else {
                // Try alternative formats
                const formats = [
                  'YYYY-MM-DD HH:mm:ss',
                  'YYYY-MM-DD HH:mm',
                  'YYYY-MM-DD',
                  'DD/MM/YYYY HH:mm:ss',
                  'DD/MM/YYYY HH:mm',
                  'DD/MM/YYYY',
                  'MM/DD/YYYY HH:mm:ss',
                  'MM/DD/YYYY HH:mm',
                  'MM/DD/YYYY'
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
                timestamp: formattedTimestamp
              });
            }
          }
          if (rows.length === 0) {
            showSnackbar("No valid records found in the Excel file", "warning");
            return;
          }

          // Create CSV file
          const csvHeader = 'employeeCode,timestamp';
          const csvRows = rows.map(row => `${row.employeeCode},${row.timestamp}`);
          const csvContent = [csvHeader, ...csvRows].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          fileToUpload = new File([blob], `import_${dayjs().format('YYYY-MM-DD')}.csv`, {
            type: 'text/csv',
            lastModified: new Date().getTime()
          });

          // Update format to CSV
          format = 'csv';
        } catch (error) {
          console.error('Error reading Excel file:', error);
          showSnackbar("Failed to read Excel file. Please ensure it's a valid Excel file.", "error");
          return;
        }
      }

      // Prepare params
      const params = {
        format: format,
        source: importSource,
        type: importType,
        startDate: importStartDate,
        endDate: importEndDate,
      };
      // Upload the file
      const res: any = await attendanceService.importAttendanceFile(params, fileToUpload);
      const data = res?.data?.data ?? res?.data;

      if (data) {
        const totalPunches = data.totalPunches || 0;
        const errorCount = data.errors || 0;
        const successCount = totalPunches - errorCount;

        // Collect error messages
        const errorMessages: string[] = [];
        if (data.rows && Array.isArray(data.rows)) {
          data.rows.forEach((row: any) => {
            if (row.message && row.message !== 'imported' && row.message !== 'success') {
              const errorMsg = row.employeeCode
                ? `${row.employeeCode}: ${row.message}`
                : row.message;
              errorMessages.push(errorMsg);
            }
          });
        }

        // Show appropriate message
        if (errorCount > 0 && successCount === 0) {
          showSnackbar(
            `All ${totalPunches} records failed to import. Please check the format.`,
            "error"
          );
        } else if (errorCount > 0) {
          showSnackbar(
            `Imported with ${errorCount} error(s). ${successCount} successful.`,
            "warning"
          );
        } else {
          showSnackbar(
            `Successfully imported ${totalPunches} attendance records`,
            "success"
          );
        }

        setImportResult({
          success: successCount,
          failed: errorCount,
          errors: errorMessages,
          rows: data.rows || []
        });

        if (successCount > 0) {
          loadRegister();
          loadTodaySummary();
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message
        || err?.message
        || "Failed to import attendance";
      showSnackbar(errorMessage, "error");
      setImportResult({
        success: 0,
        failed: 1,
        errors: [errorMessage],
        rows: []
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
      const extension = importFile.name.split('.').pop()?.toLowerCase();
      let preview: any = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const excelData = await readExcelFile(importFile);
        if (excelData && excelData.length > 0) {
          const headers = Object.keys(excelData[0]);
          const employeeCodeKey = headers.find(h =>
            h.toLowerCase().includes('employee') ||
            h.toLowerCase().includes('emp') ||
            h.toLowerCase().includes('code')
          ) || headers[0];
          const timestampKey = headers.find(h =>
            h.toLowerCase().includes('timestamp') ||
            h.toLowerCase().includes('time') ||
            h.toLowerCase().includes('date')
          ) || headers[1];

          preview = excelData.slice(0, 5).map((row: any) => {
            const employeeCode = row[employeeCodeKey] || 'N/A';
            const originalTimestamp = row[timestampKey] || 'N/A';

            let formattedTimestamp = 'N/A';
            let isValid = false;

            if (originalTimestamp !== 'N/A' && originalTimestamp) {
              // Try to format the timestamp
              const parsed = dayjs(originalTimestamp);
              if (parsed.isValid()) {
                formattedTimestamp = parsed.toISOString();
                isValid = true;
              } else {
                // Try alternative formats
                const parsed2 = dayjs(originalTimestamp, [
                  'YYYY-MM-DD HH:mm:ss',
                  'YYYY-MM-DD HH:mm',
                  'YYYY-MM-DD'
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
              isValid
            };
          });
        }
      } else {
        // Handle CSV/TXT similarly with proper formatting
        // ... (existing CSV preview code with the same formatting logic)
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
  }

  async function handleBatchPunchImport() {
    const validEntries = punchEntries.filter(
      (e) => e.employeeId && e.timestamp,
    );

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
          deviceId: e.deviceId || e.machineInOutGridId || "",
        })),
      };
      const res: any = await attendanceService.importAttendance(payload);
      const data = res?.data?.data ?? res?.data;
      setPunchImportResult(data);
      showSnackbar(
        data?.message ||
        `Imported ${data?.totalPunches || 0} punches successfully`,
        data?.errors > 0 ? "warning" : "success",
      );
      loadRegister();
      loadTodaySummary();
      setPunchImportOpen(false);
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

  // const handlePageChange = (p: number) => {
  //   setPage(p - 1);
  // };
  // const handleLimitChange = (l: number) => {
  //   setLimit(l);
  //   setPage(0);
  // };

  const statCards = todaySummary
    ? [
      {
        label: "Total",
        value: todaySummary.totalEmployees,
        color: "text-blue-600",
        border: "border-blue-500",
      },
      {
        label: "Present",
        value: todaySummary.present,
        color: "text-green-600",
        border: "border-green-500",
      },
      {
        label: "Late",
        value: todaySummary.late,
        color: "text-amber-600",
        border: "border-amber-500",
      },
      {
        label: "Absent",
        value: todaySummary.absent,
        color: "text-red-500",
        border: "border-red-500",
      },
      {
        label: "On Leave",
        value: todaySummary.onLeave,
        color: "text-violet-600",
        border: "border-violet-500",
      },
      {
        label: "Checked In",
        value: todaySummary.checkedIn,
        color: "text-cyan-600",
        border: "border-cyan-500",
      },
      {
        label: "Not Yet In",
        value: todaySummary.notYetIn,
        color: "text-pink-600",
        border: "border-pink-500",
      },
      {
        label: "Attendance %",
        value: todaySummary.attendancePercentage,
        color: "text-emerald-600",
        border: "border-emerald-500",
      },
    ]
    : [];

  const handleEmployee = async (employee: any) => {
    if (!employee) return;
    const employeeId = employee.id || employee.employeeId;
    if (employeesToRem.find(e => e.employeeId === employeeId)) {
      showSnackbar("Employee already added", "warning");
      return;
    }
    setEmployeesToRem([...employeesToRem, employee]);
    if (!selected.has(employee.id)) {
      const newSelected = new Set(selected);
      newSelected.add(employee.id);
      setSelected(newSelected);
    }
  }

  // When opening the reminder dialog, pre-populate with selected employees
  const handleOpenReminderDialog = () => {
    if (selected.size > 0) {
      // Get selected employees from the employees list
      const selectedEmployees = employees.filter(emp => selected.has(emp.employeeId));
      setEmployeesToRem(selectedEmployees);
    } else {
      setEmployeesToRem([]);
    }
    setReminderDialogOpen(true);
  };

  // Add these handlers after the existing handlers
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceIds(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  const handleSelectAllDevices = () => {
    if (selectAllDevices) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(devices.map(d => d.id));
    }
    setSelectAllDevices(!selectAllDevices);
  };

  // Add this function after the existing handlers
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
      const selectedDevicesData = devices.filter(d => selectedDeviceIds.includes(d.id));

      // Format device IPs with ports as "ip:port"
      const deviceIpsWithPorts = selectedDevicesData.map(device =>
        `${device.ipAddress}:${device.port || 4370}`
      );

      // Call the fetch logs API
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
        const matchedEmp = employeesData.find(
          (emp) => emp.midNo == punch.mid_no
        );
        return {
          ...punch,
          employeeName: matchedEmp ? matchedEmp.name : "Unknown",
          employeeCode: matchedEmp ? matchedEmp.employeeId : "Unknown",
          employeeId: matchedEmp ? matchedEmp.id : "Unknown", //coment
          // deviceId: selectedDevicesData.find(d => d.id === punch.machineInOutGridId)?.id || "",
        };
      });
      const newPunchEntries = newPunchEntriesFilter.filter((item: any) => item.employeeId !== "Unknown")

      // Add to existing punch entries
      setPunchEntries(prev => [...prev, ...newPunchEntries]);
      showSnackbar(
        `Successfully fetched ${newPunchEntries.length} punch logs from ${selectedDeviceIds.length} device(s)`,
        "success"
      );
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to fetch punch logs from devices",
        "error"
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

  return (
    <div className="p-4 space-y-3">
      {/* Summary cards */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-gray-500">
          {getSummaryHeader()}
        </div>

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
            <div
              key={label}
              className={`border ${border} rounded-lg p-3 text-center`}
            >
              <div className={`text-xl font-bold ${color}`}>
                {value ? value : 0}
              </div>
              <div className="text-[12px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Date + Filters */}
      <div className="flex items-center gap-3 border border-gray-200 p-2 rounded-md justify-between flex-wrap">
        <div className="flex items-center gap-2">
          <FilterListOutlined className="text-gray-600" fontSize="small" />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              // className="!w-[150px]"
              value={date ? dayjs(date) : null}
              onChange={(newValue) => {
                setDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
                // setPage(0);
              }}
              maxDate={dayjs()}
            />
          </LocalizationProvider>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              label="Department"
              onChange={(e) => {
                setDepartmentId(e.target.value);
                // setPage(0);
              }}
              sx={selectSx}
            >
              <MenuItem value="">All Departments</MenuItem>
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
              onChange={(e) => {
                setBranchId(e.target.value);
                // setPage(0);
              }}
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
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status quick chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_CHIP_OPTIONS.slice(0, 5).map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                size="small"
                variant={statusFilter === o.value ? "filled" : "outlined"}
                color={statusFilter === o.value ? "primary" : "default"}
                onClick={() => {
                  setStatusFilter(o.value);
                  // setPage(0);
                }}
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

      {/* Holiday banner */}
      {todayHoliday && (
        <Alert
          severity="info"
          icon={<WbSunnyOutlined className="!w-4" />}
        // sx={{ py: 0.5 }}
        >
          <span className="text-[12px] font-bold mr-2">
            Holiday: {todayHoliday?.name}
          </span>
          {todayHoliday?.type && (
            <span className="text-[12px] text-primary">
              ({todayHoliday?.type})
            </span>
          )}
        </Alert>
      )}

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
                const selectedEmployees = employees.filter(emp => selected.has(emp.employeeId));
                setBulkCheckinEmployees(selectedEmployees);
                setBulkCheckinOpen(true);
              }}
            >
              Bulk Action
            </Button>
            <Button size="small" variant="outlined"
              className="!text-gray-800 !border-gray-200" onClick={() => {
                setSelected(new Set());
                setSelectAllChecked(false);
              }}>
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
              ? "max-h-[calc(100vh-520px)]"
              : "max-h-[calc(100vh-440px)]"
            }`}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!sticky left-0 !z-40">
                  <Checkbox
                    size="small"
                    color="primary"
                    indeterminate={
                      selected.size > 0 && selected.size < employees.length
                    }
                    checked={
                      employees.length > 0 && selected.size === employees.length
                    }
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                {[
                  "Emp Name",
                  "Department",
                  "Shift",
                  "Shift Time",
                  "Check In",
                  "Check Out",
                  "Status",
                  "Action",
                ].map((h, i) => (
                  <TableCell key={h} className={`!font-bold ${i == 0 ? '!sticky left-[68px] !z-40' :
                    h == 'Action' ? '!sticky right-0 !z-40' : h == 'Status' ? '!sticky right-[69px] !z-40' : ''}`}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  {/* <TableCell colSpan={10} align="center" className="py-8">
                    <div className="flex items-center justify-center">
                      <LinearProgress className="w-32" />
                    </div>
                  </TableCell> */}
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" className="py-8">
                    <div className="text-[12px] text-gray-400 pt-7">
                      No records for {dayjs(date).format("DD MMM YYYY")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, i) => (
                  <TableRow
                    key={emp.employeeId || i}
                    // selected={selected.has(emp.employeeId)}
                    sx={getRowColor(i)}
                  >
                    <TableCell className="!sticky left-0 !z-20 bg-inherit">
                      <Checkbox
                        size="small"
                        color="primary"
                        className="!border-red-500"
                        checked={selected.has(emp.employeeId)}
                        onChange={() => toggleSelect(emp.employeeId)}
                        disabled={emp.status == 'leave'}
                      /> <span className="ml-2">{i + 1}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap !sticky left-[68px] !z-20 bg-inherit">
                      <span>{emp.employeeName}</span>
                      <span className="text-gray-500"> - {emp.employeeCode}</span>
                    </TableCell>
                    <TableCell>{emp.department || '-'}</TableCell>
                    <TableCell>{emp.shiftCode || '-'}</TableCell>
                    <TableCell className="text-gray-500">
                      {emp.shiftStart || "-"} - {emp.shiftEnd || "-"}
                    </TableCell>
                    <TableCell>
                      {emp.checkInTime ? (
                        <span className="text-green-700 font-semibold">
                          {formatTime(emp.checkInTime)}
                        </span>
                      ) : (
                        <span className="text-red-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.checkOutTime ? (
                        <span className="text-blue-600 font-semibold">
                          {formatTime(emp.checkOutTime)}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell className="!sticky right-[69px] !z-20 !bg-inherit">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                        ${ATTENDANCE_STATUS_BG[emp.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {ATTENDANCE_STATUS_LABELS[emp.status] ?? emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="!sticky right-0 !z-20 !bg-inherit">
                      {emp.status !== 'leave' ? (
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="text-end text-gray-500 p-2 text-[12px]">
          Showing {total} records
        </div>
        {/* Uncomment pagination if needed */}
        {/* {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )} */}
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
                onChange={(newValue) => {
                  setPunchTime(newValue ? dayjs(newValue).toISOString() : "");
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
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
            disabled={submitting || !punchTime}
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
          <IconButton size="small" onClick={() => {
            setBulkCheckinOpen(false);
            setBulkCheckinEmployees([]);
            setSelectAllChecked(false);
            setBulkActionType("checkIn");
          }}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-6">
            {/* Show selected from table */}
            {/* {selected.size > 0 && (
              <Alert severity="info" className="!py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]">
                    <strong>{selected.size}</strong> employee{selected.size !== 1 ? 's' : ''} selected from table
                  </span>
                  <Button
                    size="small"
                    variant="outlined"
                    className="!text-primary !border-primary"
                    onClick={() => {
                      setSelected(new Set());
                      setBulkCheckinEmployees([]);
                      setSelectAllChecked(false);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </Alert>
            )} */}

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
                      label={`${emp.employeeName || emp.name} (${emp.employeeCode || emp.employeeId})`}
                      size="small"
                      onDelete={() => {
                        // Remove from bulk list
                        setBulkCheckinEmployees(
                          bulkCheckinEmployees.filter(e => e.employeeId !== emp.employeeId)
                        );
                        // Also remove from main selection
                        const newSelected = new Set(selected);
                        newSelected.delete(emp.employeeId);
                        setSelected(newSelected);
                        // Update select all state
                        const nonLeaveEmployees = employees.filter((e) => e.status !== 'leave');
                        setSelectAllChecked(
                          bulkCheckinEmployees.length - 1 === nonLeaveEmployees.length
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
                  .filter((emp) => emp.status !== 'leave')
                  .filter((emp) => !bulkCheckinEmployees.some(e => e.employeeId === emp.employeeId))
                  .map(emp => ({
                    employeeId: emp.employeeId,
                    employeeName: emp.employeeName,
                    employeeCode: emp.employeeCode,
                    department: emp.department
                  }))}
                disableCloseOnSelect
                value={[]}
                getOptionLabel={(option) =>
                  `${option.employeeName} ${option.employeeCode ? `- ${option.employeeCode}` : ""}`
                }
                onChange={(_, value) => {
                  if (value.length > 0) {
                    // Add selected employees to bulk list
                    const newEmployees = [...bulkCheckinEmployees, ...value];
                    setBulkCheckinEmployees(newEmployees);

                    // Also add to main selection
                    const newSelected = new Set(selected);
                    value.forEach(emp => newSelected.add(emp.employeeId));
                    setSelected(newSelected);

                    // Update select all state
                    const nonLeaveEmployees = employees.filter((e) => e.status !== 'leave');
                    setSelectAllChecked(newEmployees.length === nonLeaveEmployees.length);
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps} className='!px-3 !py-1 !flex !items-start'>
                      <Checkbox checked={false} className='!py-0' />
                      <div>
                        <div className="text-[12px]">
                          {option.employeeName} - {option.employeeCode}
                        </div>
                        {option.department && (
                          <span className='text-[10px] text-gray-500'>
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
                    {bulkCheckinEmployees.length} employee{bulkCheckinEmployees.length !== 1 ? "s" : ""} selected for {bulkActionType === "checkIn" ? "check-in" : "check-out"}
                    {selected.size > 0 && ` (${selected.size} from table)`}
                  </span>
                  {/* Quick select all button */}
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      className="!text-primary !border-primary"
                      onClick={() => {
                        const nonLeaveEmployees = employees.filter((emp) => emp.status !== 'leave');
                        if (bulkCheckinEmployees.length === nonLeaveEmployees.length) {
                          // Deselect all
                          setBulkCheckinEmployees([]);
                          setSelected(new Set());
                          setSelectAllChecked(false);
                        } else {
                          // Select all
                          setBulkCheckinEmployees(nonLeaveEmployees);
                          const newSelected = new Set(nonLeaveEmployees.map(emp => emp.employeeId));
                          setSelected(newSelected);
                          setSelectAllChecked(true);
                        }
                      }}
                    >
                      {bulkCheckinEmployees.length === employees.filter((emp) => emp.status !== 'leave').length
                        ? "Deselect All"
                        : `Select All (${employees.filter((emp) => emp.status !== 'leave').length})`}
                    </Button>
                  </div>
                </div>


              </div>
            )}

            {/* Time Picker - changes based on action type */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label={bulkActionType === "checkIn" ? "Check-in Time" : "Check-out Time"}
                value={bulkActionType === "checkIn" ? (bulkCheckinTime ? dayjs(bulkCheckinTime) : null) : (bulkCheckoutTime ? dayjs(bulkCheckoutTime) : null)}
                onChange={(newValue) => {
                  if (bulkActionType === "checkIn") {
                    setBulkCheckinTime(newValue ? dayjs(newValue).toISOString() : "");
                  } else {
                    setBulkCheckoutTime(newValue ? dayjs(newValue).toISOString() : "");
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
              value={bulkActionType === "checkIn" ? bulkCheckinRemarks : bulkCheckoutRemarks}
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
              // Optionally clear the selection from table
              // setSelected(new Set());
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
                const nonLeaveEmployees = employees.filter((emp) => emp.status !== 'leave');
                const employeesToCheckin = selectAllChecked
                  ? nonLeaveEmployees
                  : bulkCheckinEmployees;
                submitBulkCheckin(employeesToCheckin);
              }}
              disabled={
                bulkCheckinSubmitting ||
                bulkCheckinEmployees.length === 0
              }
              startIcon={<LoginOutlined />}
            >
              {bulkCheckinSubmitting
                ? "Processing..."
                : `Check-in ${bulkCheckinEmployees.length} Employee${bulkCheckinEmployees.length !== 1 ? "s" : ""}`}
            </Button>
          ) : (
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => {
                const nonLeaveEmployees = employees.filter((emp) => emp.status !== 'leave');
                const employeesToCheckout = selectAllChecked
                  ? nonLeaveEmployees
                  : bulkCheckinEmployees;
                submitBulkCheckout(employeesToCheckout);
              }}
              disabled={
                bulkCheckoutSubmitting ||
                bulkCheckinEmployees.length === 0
              }
              startIcon={<LogoutOutlined />}
            >
              {bulkCheckoutSubmitting
                ? "Processing..."
                : `Check-out ${bulkCheckinEmployees.length} Employee${bulkCheckinEmployees.length !== 1 ? "s" : ""}`}
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
          <IconButton size="small" onClick={() => {
            setReminderDialogOpen(false);
            setEmployeesToRem([]);
            setReminderMessage("");
          }}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="grid gap-6">
            {/* Show selected count and info */}
            {selected.size > 0 && (
              <Alert severity="info" className="flex items-center">
                <div className="flex items-center justify-between">
                  <div className="text-[12px]">
                    <strong>{selected.size}</strong> employee{selected.size !== 1 ? 's' : ''} selected from table
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

            {/* Employee Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Recipients</span>
                {selected.size > 0 && (
                  <span className="text-[12px] text-primary font-medium">
                    {employeesToRem.length} employees selected
                  </span>
                )}
              </div>

              {/* Show selected employees as chips */}
              {employeesToRem.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-lg p-2 min-h-[40px] max-h-[150px] overflow-y-auto">
                  {employeesToRem.map((emp) => (
                    <Chip
                      key={emp.employeeId}
                      label={`${emp.employeeName || emp.name} (${emp.employeeCode || emp.employeeId})`}
                      size="small"
                      onDelete={() => {
                        setEmployeesToRem(employeesToRem.filter(e => e.employeeId !== emp.employeeId));
                        const newSelected = new Set(selected);
                        newSelected.delete(emp.employeeId);
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

              {/* Employee Selector - only show when no employees are selected or to add more */}
              <div className="mt-3">
                <EmployeeSelector
                  value={null}
                  onChange={handleEmployee}
                  label="Search & Add More Employees"
                  placeholder="Type employee name or code..."
                />
              </div>
            </div>

            {/* Reminder Type */}
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

            {/* Send Via */}
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

            {/* Summary of recipients */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Total Recipients:</span>
                <span className="font-bold text-gray-800">{employeesToRem.length}</span>
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

            {/* Message */}
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder={`Enter reminder message for ${reminderType.replace("_", " ")}`}
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
            disabled={sendingReminders || !reminderMessage.trim() || employeesToRem.length === 0}
            startIcon={<NotificationsActiveOutlined />}
          >
            {sendingReminders
              ? "Sending..."
              : `Send to ${employeesToRem.length} Employee${employeesToRem.length !== 1 ? 's' : ''}`}
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
            {/* Date Range and Configuration */}
            <div className="grid grid-cols-2 mt-3 gap-3 gap-y-5">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={importStartDate ? dayjs(importStartDate) : null}
                  onChange={(newValue) =>
                    setImportStartDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
                  }
                  maxDate={dayjs()}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={importEndDate ? dayjs(importEndDate) : null}
                  onChange={(newValue) =>
                    setImportEndDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
                  }
                  maxDate={dayjs()}
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
                  {/* <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="web">Web</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem> */}
                </Select>
              </FormControl>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="import-file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (max 10MB)
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

            {/* Template Download */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <span className="text-[12px] text-gray-600">
                Need a sample file?
              </span>
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
                      "error"
                    );
                  }
                }}
                disabled={importing}
                className="!text-[12px] !border-gray-300"
              >
                Download Template
              </Button>
            </div>

            {/* Progress */}
            {importing && (
              <div className="space-y-1">
                <LinearProgress />
                <div className="text-[12px] text-gray-500 text-center">
                  Importing attendance records...
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResult && !importing && (
              <div className={`border rounded-lg p-3 ${importResult.failed > 0 && importResult.success === 0
                ? 'border-red-200 bg-red-50'
                : importResult.failed > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-green-200 bg-green-50'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {importResult.failed > 0 && importResult.success === 0 ? (
                      <ErrorOutlined className="text-red-500" fontSize="small" />
                    ) : importResult.failed > 0 ? (
                      <WarningAmberOutlined className="text-orange-500" fontSize="small" />
                    ) : (
                      <CheckCircleOutlined className="text-green-500" fontSize="small" />
                    )}
                    <span className="text-sm font-medium">
                      {importResult.failed > 0 && importResult.success === 0
                        ? 'Import Failed'
                        : importResult.failed > 0
                          ? 'Partial Success'
                          : 'Success'}
                    </span>
                  </div>
                  <span className="text-sm">
                    <span className="text-green-600">{importResult.success}</span> successful
                    {importResult.failed > 0 && (
                      <span className="text-red-600 ml-2">{importResult.failed} failed</span>
                    )}
                  </span>
                </div>

                {/* Error details with timestamp format help */}
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[12px] font-medium text-gray-700 mb-1">
                      Error Details:
                    </div>
                    <div className="max-h-[120px] overflow-y-auto bg-white/50 rounded p-2">
                      {importResult.errors.slice(0, 5).map((error, index) => {
                        // Check if it's a timestamp error
                        const isTimestampError = error.toLowerCase().includes('timestamp') ||
                          error.toLowerCase().includes('unparseable');
                        return (
                          <div key={index} className={`text-[12px] py-0.5 ${isTimestampError ? 'text-amber-600' : 'text-red-600'
                            }`}>
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

                    {/* Show timestamp format hint if timestamp errors exist */}
                    {importResult.errors.some(e =>
                      e.toLowerCase().includes('timestamp') ||
                      e.toLowerCase().includes('unparseable')
                    ) && (
                        <Alert severity="info" sx={{ py: 0.5, mt: 2 }}>
                          <div className="text-[12px]">
                            <strong>Expected timestamp format:</strong>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5">
                              <li>ISO format: <code>2026-07-14T09:00:00</code></li>
                              <li>Date & Time: <code>2026-07-14 09:00</code> or <code>2026-07-14 09:00:00</code></li>
                              <li>Excel date: <code>2026-07-14</code> (time will be defaulted)</li>
                            </ul>
                            <div className="mt-1">
                              <Button
                                variant="text"
                                size="small"
                                className="!text-primary !p-0"
                                onClick={async () => {
                                  try {
                                    await attendanceService.downloadImportTemplate();
                                    showSnackbar("Template downloaded successfully", "success");
                                  } catch (error: any) {
                                    showSnackbar(
                                      error?.message || "Failed to download template.",
                                      "error"
                                    );
                                  }
                                }}
                              >
                                Download sample template with correct format
                              </Button>
                            </div>
                          </div>
                        </Alert>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Info Alert */}
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
            {/* Preview Results */}
            {previewData.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-[12px] font-medium text-gray-600">Preview (first 5 rows)</span>
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
                          <td className="px-3 py-1.5 text-gray-500">{row.originalTimestamp}</td>
                          <td className="px-3 py-1.5 font-mono">{row.formattedTimestamp}</td>
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
            {/* Toolbar */}
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
                  {/* <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="web">Web</MenuItem> */}
                </Select>
              </FormControl>
              {
                punchSource === "manual" ? (
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
                      <Button
                        size="small"
                        color="error"
                        onClick={clearPunchEntries}
                      >
                        Clear All
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 mt-5">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="From Date"
                        value={punchImportFromDate ? dayjs(punchImportFromDate) : null}
                        onChange={(newValue) =>
                          setPunchImportFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
                        }
                        maxDate={dayjs()}
                        slotProps={{ textField: { style: { width: '140px' } } }}
                      />
                      <DatePicker
                        label="To Date"
                        value={punchImportToDate ? dayjs(punchImportToDate) : null}
                        onChange={(newValue) =>
                          setPunchImportToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
                        }
                        maxDate={dayjs()}
                        minDate={punchImportFromDate ? dayjs(punchImportFromDate) : undefined}
                        slotProps={{ textField: { style: { width: '140px' } } }}
                      />
                    </LocalizationProvider>

                    <Button
                      variant="contained"
                      className="!bg-primary"
                      onClick={handleFetchFromDevices}
                      disabled={deviceImportLoading || selectedDeviceIds.length === 0}
                      startIcon={deviceImportLoading ? <CircularProgress size={20} /> : <PunchClockOutlined />}
                    >
                      {deviceImportLoading ? 'Fetching...' : 'Fetch from Devices'}
                    </Button>
                  </div>
                )
              }
            </div>

            {/* Punch Entries - Grid Layout */}
            {punchSource === "manual" && punchEntries.length > 0 && (
              <div className="border border-gray-200 rounded overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[25px_220px_180px_140px_95px] gap-4 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="text-[12px] font-medium text-gray-600 !w-[20px]">#</div>
                  <div className="text-[12px] font-medium text-gray-600">Employee</div>
                  <div className="text-[12px] font-medium text-gray-600">Timestamp</div>
                  <div className="text-[12px] font-medium text-gray-600">Device</div>
                  <div className="text-[12px] font-medium text-gray-600 text-center">Action</div>
                </div>

                {/* Rows */}
                {punchEntries.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="grid grid-cols-[25px_220px_180px_140px_95px] gap-4 px-3 py-2 items-center border-b border-gray-100 last:border-0"
                  >
                    <div className="text-[12px] text-gray-400 !w-[20px]">{index + 1}</div>

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
                          onChange={(newValue) =>
                            updatePunchEntry(
                              index,
                              "timestamp",
                              newValue ? dayjs(newValue).toISOString() : ""
                            )
                          }
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>

                    <div className="">
                      {/* <TextField
                        size="small"
                        placeholder="Device ID"
                        value={entry.deviceId}
                        onChange={(e) =>
                          updatePunchEntry(index, "deviceId", e.target.value)
                        }
                        fullWidth
                      /> */}
                      <FormControl >
                        <Select
                          value={entry.deviceId || ''}
                          onChange={(e) => updatePunchEntry(index, "deviceId", e.target.value)}
                          displayEmpty
                          sx={selectSx}
                        >
                          {
                            devices.map((d) => (
                              <MenuItem key={d.id} value={d.id}>{d.deviceName}</MenuItem>
                            ))
                          }
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

            {/* Device Selection Table (only shown when "From Devices" is selected) */}
            {punchSource === "biometric" && devices.length > 0 && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-2 bg-gray-50 border-b items-center border-gray-200">
                  <div className="flex items-center">
                    <Checkbox
                      size="small"
                      checked={selectAllDevices}
                      indeterminate={selectedDeviceIds.length > 0 && selectedDeviceIds.length < devices.length}
                      onChange={handleSelectAllDevices}
                    />
                  </div>
                  <div className="text-[12px] font-medium text-gray-600">Device Name</div>
                  <div className="text-[12px] font-medium text-gray-600">IP Address</div>
                  <div className="text-[12px] font-medium text-gray-600">Location</div>
                  <div className="text-[12px] font-medium text-gray-600">Status</div>
                </div>

                <div className="max-h-[200px] overflow-y-auto">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-2 items-center border-b border-gray-200"
                    >
                      <div className="flex items-center">
                        <Checkbox
                          size="small"
                          checked={selectedDeviceIds.includes(device.id)}
                          onChange={() => handleSelectDevice(device.id)}
                        />
                      </div>
                      <div className="text-[12px] text-gray-800">{device.deviceName}</div>
                      <div className="text-[12px] text-gray-600">{device.ipAddress}:{device.port || 4370}</div>
                      <div className="text-[12px] text-gray-600">{device.location || 'N/A'}</div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${device.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] text-gray-500">{device.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-[12px] text-gray-600">
                  Selected: <strong>{selectedDeviceIds.length}</strong> device{selectedDeviceIds.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Show fetched entries from devices */}
            {punchSource === "biometric" && punchEntries.length > 0 && (
              <div className="border border-green-200 rounded overflow-hidden">
                <div className="bg-green-50 px-3 py-2 border-b border-green-200 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-green-700">
                    Fetched from Devices ({punchEntries.length} entries)
                  </span>
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
                    <div key={entry.id || index} className="grid grid-cols-[30px_1fr_2fr_2fr_1fr] gap-2 px-3 py-2 border-b border-gray-200">
                      <div className="text-[12px] text-gray-400">{index + 1}</div>
                      <div className="text-[12px]">
                        <span className="font-medium">{entry.employeeName}</span>
                        <span className="text-gray-500 ml-1">({entry.mid_no})</span>
                      </div>
                      <div className="text-[12px] text-gray-600">
                        {/* {dayjs(entry.timestamp).format('DD/MM/YYYY HH:mm:ss')} */}
                        {formatDateTime(entry.timestamp) !== dayjs(entry.timestamp).format('DD/MM/YYYY HH:mm:ss') && (
                          <span className="ml-2 text-gray-500">{formatDateTime(entry.timestamp)}</span>
                        )}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {devices.find(d => d.id === entry.machineInOutGridId)?.deviceName || entry.deviceId}
                        <span className="ml-1 text-red-500">({entry.machineIP})</span>
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {entry.machineType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Result */}
            {punchImportResult && (
              <Alert
                severity={punchImportResult.errors > 0 ? "warning" : "success"}
                className="!py-1"
              >
                <div className="flex items-center gap-4 text-[12px] justify-between">
                  <div>Total Punches Imported: <strong>{punchImportResult.totalPunches} Punches</strong></div>
                  <div>Import Type: <strong>{punchImportResult.importType}</strong></div>
                  <div>Skipped : <strong>{punchImportResult.skipped}</strong></div>
                  {punchImportResult.errors > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">Errors: <strong>{punchImportResult.errors}</strong></span>
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

      {/* Check in check out result  */}
      <Dialog
        open={bulkActionResult?.open || false}
        onClose={() => setBulkActionResult(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-3">
          <span className="!pl-4 flex items-center gap-2">
            {bulkActionResult?.type === 'checkIn' ? (
              <LoginOutlined className="text-emerald-500" />
            ) : (
              <LogoutOutlined className="text-blue-500" />
            )}
            Bulk {bulkActionResult?.type === 'checkIn' ? 'Check-in' : 'Check-out'} Results
          </span>
          <IconButton size="small" onClick={() => setBulkActionResult(null)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-4">
          <div className="space-y-4">
            {/* Summary Cards */}
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

            {/* Checkout Time if available */}
            {bulkActionResult?.checkoutTime && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <span className="text-[12px]">
                  Check-out time: <strong>{dayjs(bulkActionResult.checkoutTime).format('DD MMM YYYY, hh:mm A')}</strong>
                </span>
              </Alert>
            )}

            {/* Results Details */}
            {bulkActionResult?.results && bulkActionResult.results.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-[12px] font-medium text-gray-600">Detailed Results</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {bulkActionResult.results.map((result, index) => {
                    const isSuccess = result.message === 'checked_in' || result.message === 'checked_out';
                    const isSkipped = result.message?.includes('skipped');
                    const isError = !isSuccess && !isSkipped;

                    let statusColor = 'text-emerald-600';
                    let statusBg = 'bg-emerald-50';
                    let statusIcon = <CheckCircleOutlined className="!w-4 !h-4" />;

                    if (isSkipped) {
                      statusColor = 'text-amber-600';
                      statusBg = 'bg-amber-50';
                      statusIcon = <InfoOutlined className="!w-4 !h-4" />;
                    } else if (isError) {
                      statusColor = 'text-red-600';
                      statusBg = 'bg-red-50';
                      statusIcon = <CloseOutlined className="!w-4 !h-4" />;
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0 ${statusBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={statusColor}>
                            {statusIcon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {result.employeeCode || ''}
                            </div>
                            <div className="text-[12px] text-gray-500">
                              {result.employeeId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status && (
                            <span className={`
                        text-[12px] px-2 py-0.5 rounded-full
                        ${result.status === 'present' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${result.status === 'absent' ? 'bg-red-100 text-red-700' : ''}
                        ${result.status === 'late' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                              {result.status}
                            </span>
                          )}
                          <span className={`text-[12px] font-medium ${statusColor}`}>
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