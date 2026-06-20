import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from "@mui/material";
import {
  PersonOutlined, ScheduleOutlined, EventNoteOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { AttendanceRecord, AttendanceStatus, EmployeeAttendanceInfo } from "../../../services/modules/attendance";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG,
  formatTime, formatMinutes,
} from "./const";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import LoginOutlined from "@mui/icons-material/LoginOutlined";
import { getRowColor } from "../../const";

export function EmployeeView() {
  const { showSnackbar } = useUI();

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [attendanceInfo, setAttendanceInfo] = useState<EmployeeAttendanceInfo | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);

  async function loadEmployeeData() {
    if (!selectedEmployee?.id) {
      showSnackbar("Please select an employee", "warning");
      return;
    }
    // Load info card
    setInfoLoading(true);
    attendanceService.getAttendanceInfo(selectedEmployee.id).then((res: any) => {
      const data = res?.data?.data ?? res?.data;
      setAttendanceInfo(data ?? null);
    }).catch(() => {
      setAttendanceInfo(null);
    }).finally(() => setInfoLoading(false));

    // Load attendance records
    setLoading(true);
    try {
      const res: any = await attendanceService.getEmployeeAttendance(selectedEmployee.id, {
        fromDate,
        toDate,
      });
      const data = res?.data?.data ?? res?.data;
      setRecords(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      showSnackbar("Failed to load attendance records", "error");
    } finally {
      setLoading(false);
    }
  }

  // Computed summary from loaded records
  const summary = records.length > 0 ? {
    present: records.filter(r => ["present", "checked_in", "checked_out"].includes(r.status)).length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    leave: records.filter(r => r.status === "leave").length,
    totalOT: records.reduce((s, r) => s + r.overtimeMinutes, 0),
    totalWorked: records.reduce((s, r) => s + r.workedMinutes, 0),
    workingDays: records.filter(r => !["holiday", "weekly_off"].includes(r.status)).length,
  } : null;

  return (
    <div className="p-4 space-y-4">
      {/* Search Panel */}
      <div className="bg-white-50 border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[260px]">
            <EmployeeSelector
              value={selectedEmployee}
              onChange={val => { setSelectedEmployee(val); setAttendanceInfo(null); setRecords([]); }}
              label="Select Employee"
            />
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={v => setFromDate(v ? dayjs(v).format("YYYY-MM-DD") : "")}
              slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
            />
            <DatePicker
              label="To"
              value={toDate ? dayjs(toDate) : null}
              onChange={v => setToDate(v ? dayjs(v).format("YYYY-MM-DD") : "")}
              maxDate={dayjs()}
              slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
            />
          </LocalizationProvider>
          <button
            onClick={loadEmployeeData}
            disabled={!selectedEmployee?.id}
            className="px-4 py-2 bg-primary text-white text-[12px] rounded hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Load Attendance
          </button>
        </div>
      </div>

      {/* Employee Info Card */}
      {infoLoading ? (
        <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
      ) : attendanceInfo ? (

        <div className="bg-white  border border-gray-200 rounded-xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">

            {/* Employee Identity with Avatar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                  <PersonOutlined className="text-primary" fontSize="small" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-bold text-gray-800 text-[12px]">{attendanceInfo.employeeName}</div>
                <div className="text-[12px] text-gray-400">{attendanceInfo.employeeCode}</div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-10 bg-gray-200/80"></div>

            {/* Department */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <WorkOutlineOutlined fontSize="small" className="text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Department</div>
                <div className="text-[12px] font-medium text-gray-700">{attendanceInfo.department}</div>
              </div>
            </div>

            {/* Shift */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <ScheduleOutlined fontSize="small" className="text-purple-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Shift</div>
                <div className="text-[12px] font-medium text-gray-700">
                  {attendanceInfo.shiftName}
                  <span className="text-gray-400 font-normal text-xs ml-1">
                    ({formatTime(attendanceInfo.shiftStart)} – {formatTime(attendanceInfo.shiftEnd)})
                  </span>
                </div>
              </div>
            </div>

            {/* Today's Status with enhanced badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <EventNoteOutlined fontSize="small" className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Status</div>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium
          ${ATTENDANCE_STATUS_BG[attendanceInfo.todayStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${attendanceInfo.todayStatus === 'present' ? 'bg-green-500' :
                    attendanceInfo.todayStatus === 'absent' ? 'bg-red-500' :
                      attendanceInfo.todayStatus === 'late' ? 'bg-amber-500' :
                        'bg-gray-400'
                    }`}></span>
                  {ATTENDANCE_STATUS_LABELS[attendanceInfo.todayStatus] ?? attendanceInfo.todayStatus}
                </span>
              </div>
            </div>

            {/* Today Check-in with time */}
            {attendanceInfo.todayCheckIn && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <LoginOutlined fontSize="small" className="text-green-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Check-in</div>
                  <div className="text-sm font-semibold text-emerald-700">{formatTime(attendanceInfo.todayCheckIn)}</div>
                </div>
              </div>
            )}

            {/* Pending Corrections Badge */}
            {attendanceInfo.pendingCorrections > 0 && (
              <div className="ml-auto">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-full px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-medium text-amber-700">
                    {attendanceInfo.pendingCorrections} pending correction{attendanceInfo.pendingCorrections > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Summary chips */}
      {summary && (
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {[
            { label: "Working Days", value: summary.workingDays, color: "text-gray-700", bg: "bg-gray-100" },
            { label: "Present", value: summary.present, color: "text-green-600", bg: "bg-green-50" },
            { label: "Absent", value: summary.absent, color: "text-red-500", bg: "bg-red-50" },
            { label: "Late", value: summary.late, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Leave", value: summary.leave, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Total OT", value: formatMinutes(summary.totalOT), color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Worked", value: formatMinutes(summary.totalWorked), color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-lg p-2 text-center`}>
              <div className={`text-base font-bold ${color}`}>{value}</div>
              <div className={`text-[10px] ${color} mt-0.5`}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance records table */}
      {(loading || records.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><CircularProgress /></div>
          ) : (
            <TableContainer className="max-h-[calc(100vh-500px)] overflow-auto">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {["S No","Date", "Day", "Shift", "Check In", "Check Out", "Worked", "Late", "OT", "Status", "Remarks"].map(h => (
                      <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((r, i) => (
                    <TableRow
                      key={r.attendanceDate ?? i}
                      hover
                      sx={getRowColor(i)}
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {dayjs(r.attendanceDate).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell >
                        {dayjs(r.attendanceDate).format("ddd")}
                      </TableCell>
                      <TableCell>{r.shiftCode}</TableCell>
                      <TableCell>
                        {r.checkInTime
                          ? <span className="text-green-700">{formatTime(r.checkInTime)}</span>
                          : <span>-</span>}
                      </TableCell>
                      <TableCell>
                        {r.checkOutTime
                          ? <span className="text-blue-700">{formatTime(r.checkOutTime)}</span>
                          : <span>-</span>}
                      </TableCell>
                      <TableCell>
                        {r.workedMinutes ? formatMinutes(r.workedMinutes) : "-"}
                      </TableCell>
                      <TableCell>
                        {r.lateMinutes > 0
                          ? <span className="text-amber-600">{formatMinutes(r.lateMinutes)}</span>
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {r.overtimeMinutes > 0
                          ? <span className="text-orange-600">{formatMinutes(r.overtimeMinutes)}</span>
                          : "-"}
                      </TableCell>
                      <TableCell  sx={{
                        padding: '8px !important',
                      }}>
                        <span className={` px-2 py-0.5 rounded-lg whitespace-nowrap
                          ${ATTENDANCE_STATUS_BG[r.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {ATTENDANCE_STATUS_LABELS[r.status as AttendanceStatus] ?? r.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate" title={r.remarks}>
                        {r.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedEmployee && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <PersonOutlined fontSize="large" />
          <div className="mt-2 text-sm">Select an employee to view their attendance</div>
        </div>
      )}
    </div>
  );
}
