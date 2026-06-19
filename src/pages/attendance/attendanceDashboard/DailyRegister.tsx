import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Checkbox, Alert, Chip,
} from "@mui/material";
import {
  LoginOutlined, LogoutOutlined, RefreshOutlined, CheckCircleOutlined,
  FilterListOutlined, GroupOutlined, EventNoteOutlined, CloseOutlined,
  WbSunnyOutlined, InfoOutlined,
  
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { AttendanceStatus } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG, formatTime,

} from "./const";
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
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const { session } = useAuth();

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Check-in / Check-out dialog
  const [punchDialogOpen, setPunchDialogOpen] = useState(false);
  const [punchType, setPunchType] = useState<"checkIn" | "checkOut">("checkIn");
  const [punchEmployee, setPunchEmployee] = useState<RegisterEmployee | null>(null);
  const [punchTime, setPunchTime] = useState("");
  const [punchRemarks, setPunchRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk status dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  // const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present");
  const [bulkRemarks, setBulkRemarks] = useState("");

  const loadRegister = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getRegister({
        date,
        departmentId: departmentId || undefined,
        branchId: branchId || undefined,
        status: statusFilter || undefined,
        page,
        size: limit,
      });
      const data = res?.data?.data ?? res?.data;
      setEmployees(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load daily register", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [date, departmentId, branchId, statusFilter, page, limit]);

  const loadTodaySummary = useCallback(async () => {
    try {
      const res: any = await attendanceService.getToday({ date });
      const data = res?.data?.data ?? res?.data;
      setTodaySummary(data ?? null);
    } catch {
      // non-critical
    }
  }, [date]);

  const loadHolidays = useCallback(async () => {
    try {
      const d = dayjs(date);
      const res: any = await attendanceService.getHolidays({ year: d.year(), month: d.month() + 1 });
      const data = res?.data?.data ?? res?.data;
      setHolidays(Array.isArray(data) ? data : []);
    } catch {
      // non-critical
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
    ]).then(([depRes, branRes]: any[]) => {
      setDepartments(Array.isArray(depRes.data?.content || depRes.data)
        ? (depRes.data?.content || depRes.data) : []);
      setBranches(Array.isArray(branRes.data?.content || branRes.data)
        ? (branRes.data?.content || branRes.data) : []);
    }).catch(() => { });
  }, []);

  const todayHoliday = holidays.find(h => h.date === date);

  // ── Punch dialog ──────────────────────────────────────────────────────────
  function openPunch(emp: RegisterEmployee, type: "checkIn" | "checkOut") {
    setPunchEmployee(emp);
    setPunchType(type);
    setPunchTime(dayjs().format("YYYY-MM-DDTHH:mm"));
    setPunchRemarks("");
    setPunchDialogOpen(true);
  }

  async function submitPunch() {
    if (!punchEmployee || !punchTime) return;
    setSubmitting(true);
    // punchEmployee.employeeId 
    try {
      if (punchType === "checkIn") {
        await attendanceService.checkIn({
          employeeId: "ed665db9-2746-459b-b2ef-53aed4852e61",
          checkInTime: punchTime,
          markedBy: session?.user.userId,
          remarks: punchRemarks || undefined,
        });
      } else {
        await attendanceService.checkOut({
          employeeId: punchEmployee.employeeId,
          checkOutTime: punchTime,
          markedBy: "admin",
          remarks: punchRemarks || undefined,
        });
      }
      showSnackbar(
        `${punchType === "checkIn" ? "Check-in" : "Check-out"} marked for ${punchEmployee.employeeName}`,
        "success"
      );
      setPunchDialogOpen(false);
      loadRegister();
      loadTodaySummary();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to mark attendance", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Bulk daily status ─────────────────────────────────────────────────────
  async function submitBulkStatus() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await attendanceService.postDailyStatus({
        processDate: date,
        employeeIds: [("ed665db9-2746-459b-b2ef-53aed4852e61")],
      });
      showSnackbar(`Daily status posted for ${selected.size} employees`, "success");
      setBulkDialogOpen(false);
      setSelected(new Set());
      loadRegister();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to post daily status", "error");
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
          showSnackbar(err?.response?.data?.message ?? "Failed to bulk process", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === employees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(employees.map(e => e.employeeId)));
    }
  }

  const handlePageChange = (p: number) => { setPage(p - 1); };
  const handleLimitChange = (l: number) => { setLimit(l); setPage(0); };

  const statCards = todaySummary
    ? [
      { label: "Total", value: todaySummary.totalEmployees, color: "text-blue-600", border: "border-blue-500" },
      { label: "Present", value: todaySummary.present, color: "text-green-600", border: "border-green-500" },
      { label: "Late", value: todaySummary.late, color: "text-amber-600", border: "border-amber-500" },
      { label: "Absent", value: todaySummary.absent, color: "text-red-500", border: "border-red-500" },
      { label: "On Leave", value: todaySummary.onLeave, color: "text-violet-600", border: "border-violet-500" },
      { label: "Checked In", value: todaySummary.checkedIn, color: "text-cyan-600", border: "border-cyan-500" },
    ]
    : [];

  return (
    <div className="p-4 space-y-3">
      {/* Summary cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {statCards.map(({ label, value, color, border }) => (
            <div key={label} className={`border ${border} rounded-lg p-3 text-center`}>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
      {/* Date + Filters */}
      <div className="flex items-center gap-3 border border-gray-200 p-2 rounded-md justify-between">
        <div className="flex items-center gap-2">
          <FilterListOutlined className="text-gray-600" fontSize="small" />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              className="!w-[450px]"
              value={date ? dayjs(date) : null}
              onChange={(newValue) => { setDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); }}
              maxDate={new Date() ? dayjs(new Date()) : undefined}
              slotProps={{
                textField: {
                  size: "small",
                },
              }}
            />
          </LocalizationProvider>
          <FormControl >
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              label="Department"
              onChange={e => { setDepartmentId(e.target.value); setPage(0); }}
              sx={selectSx}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl >
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchId}
              label="Branch"
              onChange={e => { setBranchId(e.target.value); setPage(0); }}
              sx={selectSx}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.branchName}</MenuItem>)}
            </Select>
          </FormControl>
        </div>

        <div className="flex">
          {/* Status quick chips with improved styling */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_CHIP_OPTIONS.slice(0, 5).map(o => (
              <Chip
                key={o.value}
                label={o.label}
                size="small"
                variant={statusFilter === o.value ? "filled" : "outlined"}
                color={statusFilter === o.value ? "primary" : "default"}
                onClick={() => { setStatusFilter(o.value); setPage(0); }}
                className="cursor-pointer transition-all duration-200 hover:scale-105 text-gray-800"
                sx={{
                  borderRadius: '8px',
                  fontWeight: statusFilter === o.value ? 600 : 400,
                  ...(statusFilter === o.value && {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }
                  }),
                  ...(statusFilter !== o.value && {
                    borderColor: '#e2e8f0',
                  })
                }}
              />
            ))}
          </div>

          {/* Action buttons with modern styling */}
          <div className="ml-3 flex items-center gap-1">
            <Tooltip title="Refresh data" arrow>
              <IconButton
                size="small"
                onClick={() => { loadRegister(); loadTodaySummary(); }}
                // className="hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                sx={{
                  borderRadius: '10px',
                  padding: '8px',
                  '&:hover': { transform: 'rotate(90deg)' }
                }}
              >
                <RefreshOutlined fontSize="small" className="text-gray-500" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Holiday banner */}
      {todayHoliday && (
        <Alert
          severity="info"
          icon={<WbSunnyOutlined className="!w-4" />}
          sx={{ py: 0.5 }}
          className="flex items-center"
        >
          <span className="text-sm font-medium">Holiday: {todayHoliday?.name}</span>
          {todayHoliday?.type && <span className="text-xs text-gray-500 ml-2">({todayHoliday?.type})</span>}
        </Alert>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-gray-200 rounded-lg px-3 py-2">
          <GroupOutlined fontSize="small" className="text-primary" />
          <span className="text-sm text-primary font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <Button
              size="small"
              variant="outlined"
              startIcon={<EventNoteOutlined fontSize="small" />}
              onClick={() => setBulkDialogOpen(true)}
            >
              Post Daily Status
            </Button>
            <Button
              size="small"
              variant="outlined"
              // className="!text-primary !border-primary"
              startIcon={<CheckCircleOutlined fontSize="small" />}
              onClick={handleBulkProcess}
            >
              Bulk Process
            </Button>
            <Button size="small" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {/* Register Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className='max-h-[calc(100vh-540px)]'>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" className="bg-gray-50">
                  <Checkbox
                    size="small"
                    className="!text-gray-500"
                    indeterminate={selected.size > 0 && selected.size < employees.length}
                    checked={employees.length > 0 && selected.size === employees.length}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                {[
                  "S No", "Emp Code", "Name", "Department", "Shift",
                  "Shift Start", "Check In", "Check Out",
                  "Status", "Actions",
                ].map(h => (
                  <TableCell key={h} className="!font-bold">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" className="py-8 text-gray-400 text-sm">
                    Loading register...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" className="py-8 text-gray-400 text-sm">
                    No records for {dayjs(date).format("DD MMM YYYY")}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, i) => (
                  <TableRow key={emp.employeeId} hover selected={selected.has(emp.employeeId)}
                    sx={getRowColor(i)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        className="!text-gray-500"
                        checked={selected.has(emp.employeeId)}
                        onChange={() => toggleSelect(emp.employeeId)}
                      />
                    </TableCell>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{emp.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {emp.employeeName}
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.shiftCode}</TableCell>
                    <TableCell className=" text-gray-500">{formatTime(emp.shiftStart)}</TableCell>
                    <TableCell>
                      {emp.checkInTime
                        ? <span className="text-green-700 font-semibold">{formatTime(emp.checkInTime)}</span>
                        : <span className="text-red-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {emp.checkOutTime
                        ? <span className="text-blue-600 font-semibold">{formatTime(emp.checkOutTime)}</span>
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={` px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                        ${ATTENDANCE_STATUS_BG[emp.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {ATTENDANCE_STATUS_LABELS[emp.status] ?? emp.status}
                      </span>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total} page={page + 1} limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Check-in / Check-out Dialog */}
      <Dialog open={punchDialogOpen} onClose={() => setPunchDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">{punchType === "checkIn" ? "Mark Check-in" : "Mark Check-out"}</span>
          <IconButton size="small" onClick={() => setPunchDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-5">
            {punchEmployee && (
              <div className="bg-head rounded px-3 py-2 text-[12px] mb-3">
                <span className="font-medium text-gray-800">{punchEmployee.employeeName}</span>
                <span className="text-gray-500 ml-2">({punchEmployee.employeeCode})</span>
              </div>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label={punchType === "checkIn" ? "Check-in Time" : "Check-out Time"}
                value={punchTime ? dayjs(punchTime) : null}
                onChange={(newValue) => {
                  setPunchTime(newValue ? dayjs(newValue).toISOString() : '');
                }}
                slotProps={{
                  textField: {
                    size: 'small',
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
              onChange={e => setPunchRemarks(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200 !p-4">
          <Button variant="outlined" className="!text-gray-800 !border-gray-200"
            onClick={() => setPunchDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            color={punchType === "checkIn" ? "success" : "primary"}
            onClick={submitPunch}
            disabled={submitting || !punchTime}
            startIcon={punchType === "checkIn" ? <LoginOutlined /> : <LogoutOutlined />}
          >
            {submitting ? "Saving..." : punchType === "checkIn" ? "Confirm Check-in" : "Confirm Check-out"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Daily Status Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="xs" fullWidth>
        <div className="flex items-center border-gray-200 border-b justify-between p-2">
          <span className="text-gray-800 ml-4 text-[12px]">Post Daily Status</span>
          <IconButton size="small" onClick={() => setBulkDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-3 pt-1">
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
              onChange={e => setBulkRemarks(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button variant="outlined" className="!text-gray-800 !border-gray-200"
            onClick={() => setBulkDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitBulkStatus}
            disabled={submitting}
            startIcon={<EventNoteOutlined />}
          >
            {submitting ? "Posting..." : "Post Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
