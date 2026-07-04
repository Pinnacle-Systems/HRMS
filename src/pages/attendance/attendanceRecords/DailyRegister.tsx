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
import type { Department, Branches } from "../../employees/type";
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

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState<
    "check_in" | "check_out" | "attendance"
  >("check_in");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [employeesToRem, setEmployeesToRem] = useState<any[]>([]);
  const [sendVia, setSendVia] = useState(["email"]);

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
  const [importDate, setImportDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const [punchImportOpen, setPunchImportOpen] = useState(false);
  const [punchSource, setPunchSource] = useState("manual");
  const [punchEntries, setPunchEntries] = useState<any[]>([]);
  const [punchImporting, setPunchImporting] = useState(false);
  const [punchImportResult, setPunchImportResult] = useState<any>(null);

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
    ])
      .then(([depRes, branRes]: any[]) => {
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
      })
      .catch(() => { });
  }, []);

  const todayHoliday = holidays.find((h) => h.date === date);

  // ── Punch dialog ──────────────────────────────────────────────────────────
  function openPunch(emp: RegisterEmployee, type: "checkIn" | "checkOut") {
    setPunchEmployee(emp);
    setPunchType(type);
    setPunchTime(dayjs().toISOString());
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
      await attendanceService.bulkCheckin({
        employeeIds: employeesToCheckin.map((e) => e.employeeId),
        checkinTime: bulkCheckinTime,
        reason: bulkCheckinRemarks,
        markedBy: session?.user.userId || "system",
      });
      showSnackbar(
        `Bulk check-in successful for ${employeesToCheckin.length} employees`,
        "success",
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

  // ── Import Handlers ──────────────────────────────────────────────────────
  async function handleImportFile() {
    if (!importFile) {
      showSnackbar("Please select a file to import", "warning");
      return;
    }

    setImporting(true);
    setImportResult(null);
    showSpinner();

    try {
      const res: any = await attendanceService.importAttendanceFile(
        { format: "", source: "" },
        importFile,
      );
      const data = res?.data?.data ?? res?.data;
      setImportResult({
        success: data?.success || 0,
        failed: data?.failed || 0,
        errors: data?.errors || [],
      });
      showSnackbar(
        `Imported ${data?.success || 0} records successfully`,
        data?.failed > 0 ? "warning" : "success",
      );
      loadRegister();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message ?? "Failed to import attendance",
        "error",
      );
    } finally {
      setImporting(false);
      hideSpinner();
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
          employeeCode: e.employeeCode || undefined,
          timestamp: e.timestamp,
          deviceId: e.deviceId || undefined,
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
    ]
    : [];

  const handleEmployee = async (employee:any) => {
    if (!employee) return;
    if (employeesToRem.find(e => e.employeeId === employee.id)) {
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

  return (
    <div className="p-4 space-y-3">
      {/* Summary cards */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-gray-500">
          Today's Summary
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
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {statCards.map(({ label, value, color, border }) => (
            <div
              key={label}
              className={`border ${border} rounded-lg p-3 text-center`}
            >
              <div className={`text-xl font-bold ${color}`}>
                {value ? value : 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
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
          sx={{ py: 0.5 }}
        >
          <span className="text-sm font-medium">
            Holiday: {todayHoliday?.name}
          </span>
          {todayHoliday?.type && (
            <span className="text-xs text-gray-500 ml-2">
              ({todayHoliday?.type})
            </span>
          )}
        </Alert>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-gray-200 rounded-lg px-3 py-2 flex-wrap">
          <GroupOutlined fontSize="small" className="text-primary" />
          <span className="text-[12px] text-blue-500 font-bold">
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
              onClick={() => setBulkCheckinOpen(true)}
            >
              Bulk Check-in
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
                <TableCell padding="checkbox" className="bg-gray-50">
                  <Checkbox
                    size="small"
                    // className="!text-gray-500"
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
                  "S No",
                  "Emp Code",
                  "Name",
                  "Department",
                  "Shift",
                  "Shift Time",
                  "Check In",
                  "Check Out",
                  "Status",
                  "Action",
                ].map((h) => (
                  <TableCell key={h} className="!font-bold">
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
                  <TableCell colSpan={11} align="center" className="py-8">
                    <div className="text-[12px] text-gray-400 pt-7">
                      No records for {dayjs(date).format("DD MMM YYYY")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, i) => (
                  <TableRow
                    key={emp.employeeId || i}
                    hover
                    selected={selected.has(emp.employeeId)}
                    sx={getRowColor(i)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        // className="!text-gray-500"
                        color="primary"
                        checked={selected.has(emp.employeeId)}
                        onChange={() => toggleSelect(emp.employeeId)}
                      />
                    </TableCell>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{emp.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {emp.employeeName}
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
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                        ${ATTENDANCE_STATUS_BG[emp.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {ATTENDANCE_STATUS_LABELS[emp.status] ?? emp.status}
                      </span>
                    </TableCell>
                    <TableCell>
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
              <span className="text-xs">
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
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <PlaylistAddCheckCircleOutlined className="text-primary" />
            Bulk Check-in
          </span>
          <IconButton size="small" onClick={() => {
            setBulkCheckinOpen(false);
            setBulkCheckinEmployees([]);
            setSelectAllChecked(false);
          }}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-8">
            {/* Employee Selection */}
            <Autocomplete
              multiple
              options={[
                {
                  employeeId: "ALL",
                  employeeName: "Select All",
                  department: "",
                  employeeCode: "ALL"
                },
                ...employees.filter((emp) => emp.status !== 'leave'),
              ]}
              disableCloseOnSelect
              value={bulkCheckinEmployees}
              getOptionLabel={(option) =>
                `${option.employeeName} ${option.department ? `- ${option.department}` : ""}`
              }
              onChange={(_, value) => {
                const ids = value.map((v) => v.employeeId);

                if (ids.includes("ALL")) {
                  if (bulkCheckinEmployees.length === employees.length) {
                    setBulkCheckinEmployees([]);
                    setSelectAllChecked(false);
                  } else {
                    const nonLeaveEmployees = employees.filter((emp) => emp.status !== 'leave');
                    setBulkCheckinEmployees(nonLeaveEmployees);
                    setSelectAllChecked(true);
                  }
                } else {
                  setBulkCheckinEmployees(value);
                  setSelectAllChecked(value.length === employees.filter((emp) => emp.status !== 'leave').length);
                }
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                const isAll = option.employeeId === "ALL";
                const nonLeaveEmployees = employees.filter((emp) => emp.status !== 'leave');
                const isChecked = isAll
                  ? bulkCheckinEmployees.length === nonLeaveEmployees.length
                  : bulkCheckinEmployees.some((emp) => emp.employeeId === option.employeeId);

                return (
                  <li key={key} {...optionProps} className='!p-2 !flex !items-start'>
                    <Checkbox
                      className='!grid !items-start !justify-start !py-0'
                      checked={isChecked}
                    />
                    <div>
                      <div className="text-[12px]">
                        {option.employeeName} {!isAll && `- ${option.employeeCode}`}
                      </div>
                      {!isAll && (
                        <span className='text-[10px] text-gray-500'>
                          {option.department ? option.department : ''}
                        </span>
                      )}
                      {isAll && (
                        <span className='text-[10px] text-gray-500'>
                          Select all {nonLeaveEmployees.length} employees
                        </span>
                      )}
                    </div>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search & Add Employees"
                  placeholder="Type employee name or code..."
                />
              )}
              className="w-full"
            />

            {bulkCheckinEmployees.length > 0 && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <span className="text-xs">
                  {bulkCheckinEmployees.length === employees.filter((emp) => emp.status !== 'leave').length
                    ? `All ${bulkCheckinEmployees.length} employees selected`
                    : `${bulkCheckinEmployees.length} employee${bulkCheckinEmployees.length !== 1 ? "s" : ""} selected`}
                </span>
              </Alert>
            )}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Check-in Time"
                value={bulkCheckinTime ? dayjs(bulkCheckinTime) : null}
                onChange={(newValue) =>
                  setBulkCheckinTime(
                    newValue ? dayjs(newValue).toISOString() : "",
                  )
                }
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>

            <TextField
              label="Remarks (optional)"
              fullWidth
              multiline
              rows={2}
              value={bulkCheckinRemarks}
              onChange={(e) => setBulkCheckinRemarks(e.target.value)}
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
            }}
            disabled={bulkCheckinSubmitting}
          >
            Cancel
          </Button>
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
              (bulkCheckinEmployees.length === 0 && !selectAllChecked)
            }
          >
            {bulkCheckinSubmitting
              ? "Processing..."
              : `Check-in ${selectAllChecked
                ? `All ${employees.filter((emp) => emp.status !== 'leave').length} Employees`
                : `${bulkCheckinEmployees.length} Employee${bulkCheckinEmployees.length !== 1 ? "s" : ""}`}`}
          </Button>
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
                  <span className="text-xs text-primary font-medium">
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
                <div className="text-xs text-gray-400 mt-2">
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
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <CloudUploadOutlined className="text-primary" />
            Import Attendance
          </span>
          <IconButton size="small" onClick={() => setImportDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-6">
          <div className="space-y-4">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Import Date"
                value={importDate ? dayjs(importDate) : null}
                onChange={(newValue) =>
                  setImportDate(
                    newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                  )
                }
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="import-file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImportFile(file);
                }}
                className="hidden"
              />
              <label htmlFor="import-file" className="cursor-pointer block">
                <InsertDriveFileOutlined className="text-gray-400" fontSize="large" />
                <div className="text-sm text-gray-600 mt-2">
                  {importFile ? importFile.name : "Click to select file (Excel/CSV)"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Supported formats: .xlsx, .xls, .csv
                </div>
              </label>
            </div>

            {importResult && (
              <div className="space-y-2">
                <Alert severity={importResult.failed > 0 ? "warning" : "success"}>
                  <span className="text-sm">
                    Success: {importResult.success} | Failed: {importResult.failed}
                  </span>
                </Alert>
                {importResult.errors.length > 0 && (
                  <div className="max-h-[100px] overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-500 py-0.5">
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {importing && <LinearProgress />}
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => setImportDialogOpen(false)}
            disabled={importing}
          >
            Close
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleImportFile}
            disabled={importing || !importFile}
            startIcon={<CloudUploadOutlined />}
          >
            {importing ? "Importing..." : "Import File"}
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
        fullWidth
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
                  onChange={(e) => setPunchSource(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                  <MenuItem value="device">Device</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="web">Web</MenuItem>
                </Select>
              </FormControl>

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
            </div>

            {/* Punch Entries - Grid Layout */}
            {punchEntries.length > 0 && (
              <div className="border border-gray-200 rounded overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="col-span-1 text-xs font-medium text-gray-600">#</span>
                  <span className="col-span-4 text-xs font-medium text-gray-600">Employee</span>
                  <span className="col-span-4 text-xs font-medium text-gray-600">Timestamp</span>
                  <span className="col-span-2 text-xs font-medium text-gray-600">Device</span>
                  <span className="col-span-1 text-xs font-medium text-gray-600 text-center">Action</span>
                </div>

                {/* Rows */}
                {punchEntries.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-gray-100 last:border-0"
                  >
                    <span className="col-span-1 text-xs text-gray-400">{index + 1}</span>

                    <div className="col-span-4">
                      <EmployeeSelector
                        value={entry.employeeData || null}
                        onChange={(val) => handleEmployeeSelect(val, index)}
                      />
                    </div>

                    <div className="col-span-4">
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

                    <div className="col-span-2">
                      <TextField
                        size="small"
                        placeholder="Device ID"
                        value={entry.deviceId}
                        onChange={(e) =>
                          updatePunchEntry(index, "deviceId", e.target.value)
                        }
                        fullWidth
                      />
                    </div>

                    <div className="col-span-1 flex justify-center">
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

            {/* Import Result */}
            {punchImportResult && (
              <Alert
                severity={punchImportResult.errors > 0 ? "warning" : "success"}
                className="!py-1"
              >
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span>Total: <strong>{punchImportResult.totalPunches}</strong></span>
                  <span>•</span>
                  <span>Days: <strong>{punchImportResult.daysImported}</strong></span>
                  {punchImportResult.errors > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">Errors: <strong>{punchImportResult.errors}</strong></span>
                    </>
                  )}
                </div>
              </Alert>
            )}

            {punchImporting && <LinearProgress />}
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
    </div>
  );
}