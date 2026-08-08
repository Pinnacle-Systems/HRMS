import { useState, useEffect, useCallback } from "react";
import {
  MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  FileDownloadOutlined, PrintOutlined, ChevronLeftOutlined, ChevronRightOutlined,
  TableChartOutlined, ViewListOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { attendanceService } from "../../../services/modules/attendance";
// import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG } from "../const";
import { MONTHS, getDaysInMonth, getCurrentMonthYear, formatTime } from "../const";
import type { Branches, Department } from "../../employees/type";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import type { MusterRow } from "../../../services/modules/attendanceTypes";
import { apiService } from "../../../services";

const LEGEND = [
  { abbr: "P", label: "Present", color: "bg-green-500" },
  { abbr: "A", label: "Absent", color: "bg-red-500" },
  { abbr: "L", label: "Late", color: "bg-amber-400" },
  { abbr: "H", label: "Half Day", color: "bg-blue-700" },
  { abbr: "OD", label: "On Duty", color: "bg-cyan-500" },
  { abbr: "LV", label: "Leave", color: "bg-violet-400" },
  { abbr: "PM", label: "Permission", color: "bg-orange-500" },
  { abbr: "HO", label: "Holiday", color: "bg-slate-300" },
  { abbr: "WO", label: "Weekly Off", color: "bg-gray-200" },
  { abbr: "IR", label: "Irregular", color: "bg-pink-400" },
];

const STATUS_MAPPINGS: any = {
  present: { abbr: 'P', class: 'bg-green-100 border border-green-700 text-green-700'},
  absent: { abbr: 'A', class: 'bg-red-100 border border-red-700 text-red-700' },
  'half-day': { abbr: 'HD', class: 'bg-blue-100 border border-blue-700 text-blue-700' },
  late: { abbr: 'L', class: 'bg-amber-100 text-amber-700 border border-amber-700' },
  leave: { abbr: 'LV', class: 'bg-violet-100 text-violet-700 border border-violet-700' },
  holiday: { abbr: 'HO', class: 'bg-slate-100 text-slate-700 border border-slate-300'},
  'weekly-off': { abbr: 'WO', class: 'bg-gray-100 text-gray-500 border border-gray-700' },
  'on-duty': { abbr: 'OD', class: 'bg-cyan-100 text-cyan-500 border border-cyan-700' },
  permission: { abbr: 'PM', class: 'bg-orange-100 text-orange-700 border border-orange-700' },
  irregular: { abbr: 'IR', class: 'bg-pink-100 text-pink-700 border border-pink-700' },
};

const getAttendanceStatus = (cell: any): {
  overallStatus: string | null;
  amStatus: string | null;
  pmStatus: string | null;
  details: string;
} => {
  if (!cell) {
    return { overallStatus: null, amStatus: null, pmStatus: null, details: "No data" };
  }

  const {
    firstHalf,
    secondHalf,
    checkIn,
    checkOut,
    workedMinutes,
    shiftCode,
    shiftStart,
    shiftEnd
  } = cell;

  let amStatus = null;
  let pmStatus = null;
  let overallStatus = null;
  let details = [];

  // Determine AM status
  if (checkIn && checkOut) {
    // Full day present
    amStatus = firstHalf === "late" ? "late" : "present";
    pmStatus = secondHalf === "late" ? "late" :"present";
    overallStatus = firstHalf === "late" ? "late" : "present";
    details.push(`✅ Full Day (${formatTime(checkIn)} - ${formatTime(checkOut)})`);
  } else if (checkIn && !checkOut) {
    // Half day present (checked in but not checked out)
    amStatus = firstHalf === "late" ? "late" : "present";
    pmStatus = "absent";
    overallStatus = "half-day";
    details.push(`⏳ Half Day (In: ${formatTime(checkIn)})`);
  } else if (!checkIn && checkOut) {
    // Late arrival (checked out but no check in)
    amStatus = "late";
    pmStatus = "present";
    overallStatus = "late";
    details.push(`⏰ Late Arrival (Out: ${formatTime(checkOut)})`);
  } else if (firstHalf === "present" || secondHalf === "present") {
    // Based on manual status
    amStatus = firstHalf === "present" ? "present" : null;
    pmStatus = secondHalf === "present" ? "present" : null;
    overallStatus = "present";
  } else if (firstHalf === "absent" && secondHalf === "absent") {
    amStatus = "absent";
    pmStatus = "absent";
    overallStatus = "absent";
    details.push("❌ Absent");
  } else if (firstHalf === "leave" || secondHalf === "leave") {
    amStatus = firstHalf === "leave" ? "leave" : null;
    pmStatus = secondHalf === "leave" ? "leave" : null;
    overallStatus = "leave";
    details.push("📋 Leave");
  } else if (firstHalf === "holiday" || secondHalf === "holiday") {
    amStatus = "holiday";
    pmStatus = "holiday";
    overallStatus = "holiday";
    details.push("🎉 Holiday");
  } else if (firstHalf === "weekly-off" || secondHalf === "weekly-off") {
    amStatus = "weekly-off";
    pmStatus = "weekly-off";
    overallStatus = "weekly-off";
    details.push("📅 Weekly Off");
  } else {
    // Default to firstHalf/secondHalf values if they exist
    amStatus = firstHalf || null;
    pmStatus = secondHalf || null;
    overallStatus = firstHalf || secondHalf || null;
  }

  // Add shift details
  if (shiftCode) {
    details.push(`Shift: ${shiftCode} (${shiftStart || 'N/A'} - ${shiftEnd || 'N/A'})`);
  }

  if (workedMinutes) {
    const hours = Math.floor(workedMinutes / 60);
    const mins = workedMinutes % 60;
    details.push(`⏱️ ${hours}h ${mins}m worked`);
  }

  return {
    overallStatus,
    amStatus,
    pmStatus,
    details: details.join(' | ')
  };
};

export function AttendanceMuster() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employees, setEmployees] = useState<MusterRow[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<string[]>([]);
  const [workingDays, setWorkingDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const [viewMode, setViewMode] = useState<"muster" | "register">("muster");
  const [registerRows, setRegisterRows] = useState<any[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerPage, setRegisterPage] = useState(1);
  const [registerLimit, setRegisterLimit] = useState(20);
  const [musterPage, setMusterPage] = useState(1);
  const [musterLimit, setMusterLimit] = useState(20);

  const daysInMonth = getDaysInMonth(year, month);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function getDayLabel(day: number) {
    const d = new Date(year, month - 1, day);
    return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
  }

  function isHoliday(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.includes(dateStr);
  }

  function isWeeklyOff(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return weeklyOffs.includes(dateStr);
  }

  const loadMuster = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getMuster({
        month, year,
        departmentId: departmentId || undefined,
        branchId: branchId || undefined,
      });
      const data = res?.data?.data ?? res?.data;
      setEmployees(data?.employees ?? []);
      setHolidays(data?.holidays ?? []);
      setWeeklyOffs(data?.weeklyOffs ?? []);
      setWorkingDays(data?.workingDays ?? 0);
    } catch {
      showSnackbar("Failed to load muster register", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [month, year, departmentId, branchId]);

  const fetchMasterData = async () => {
    try {
      const depRes: any = await departmentService.getActiveDepartments();
      const depData = depRes.data?.content || depRes.data || [];
      setDepartments(depData);
      const branRes: any = await branchService.getActiveBranches();
      const branData = branRes.data?.content || branRes.data || [];
      setBranches(branData);
    } catch (error: any) {
      console.error('Failed to fetch master data:', error);
    }
  };

  const loadMonthlyRegister = useCallback(async () => {
    setRegisterLoading(true);
    try {
      const res: any = await attendanceService.getMonthlyRegister({
        month, year,
        departmentId: departmentId || undefined,
        branchId: branchId || undefined,
      });
      const employees = res?.data?.employees ?? res?.data;
      const data = (Array.isArray(employees)
        ? employees
        : employees?.content ?? []
      ).map((emp: any) => ({
        ...emp,
        status:
          emp.attendancePercentage >= 90 ? "present" : emp.attendancePercentage >= 75 ? "late" : "absent",
      }));
      setRegisterRows(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      showSnackbar("Failed to load monthly register", "error");
    } finally {
      setRegisterLoading(false);
    }
  }, [month, year, departmentId, branchId]);

  useEffect(() => {
    loadMuster();
  }, [loadMuster]);

  useEffect(() => {
    if (viewMode === "register") loadMonthlyRegister();
  }, [viewMode, loadMonthlyRegister]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function getCellForDay(row: MusterRow, day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return row.attendance.find((a) => a.date === dateStr) ?? null;
  }

  useEffect(() => { setRegisterPage(1); }, [registerRows]);
  useEffect(() => { setMusterPage(1); }, [employees]);

  const pagedRegisterRows = registerRows.slice((registerPage - 1) * registerLimit, registerPage * registerLimit);
  const pagedEmployees = employees.slice((musterPage - 1) * musterLimit, musterPage * musterLimit);

  async function handleExport() {
    showSpinner();
    try {
      const res = await attendanceService.exportMonthly({
        month,
        year,
        departmentId: departmentId || undefined,
        branchId: branchId || undefined,
        exportFormat: 'excel'
      }
      );
      await apiService.downloadFromPath(res.data.fileUrl, `attendance_${month}_${year}.pdf`);
      showSnackbar(`Muster exported successfully for ${MONTHS[month - 1]} ${year}`, "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Export failed", "error");
    } finally {
      hideSpinner();
    }
  }

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <IconButton size="small" onClick={prevMonth}>
            <ChevronLeftOutlined className="text-gray-800" />
          </IconButton>
          <span className="text-base font-semibold text-gray-800 min-w-[120px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <IconButton size="small" onClick={nextMonth}>
            <ChevronRightOutlined className="text-gray-800" />
          </IconButton>
          <div className="text-[12px] text-gray-500 ml-2">
            Working Days: <span className="font-semibold text-gray-700">{workingDays}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FormControl className="!w-[180px]">
            <InputLabel>Department</InputLabel>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} label="Department" sx={selectSx}>
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className="!w-[180px]">
            <InputLabel>Branch</InputLabel>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} label="Department" sx={selectSx}>
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.branchName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* View toggle */}
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <Tooltip title="Muster Matrix">
              <button
                onClick={() => setViewMode("muster")}
                className={`px-2 py-1.5 text-xs flex items-center gap-1 transition-colors
                  ${viewMode === "muster" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <TableChartOutlined fontSize="small" />
              </button>
            </Tooltip>
            <Tooltip title="Monthly Register">
              <button
                onClick={() => setViewMode("register")}
                className={`px-2 py-1.5 text-xs flex items-center gap-1 transition-colors
                  ${viewMode === "register" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <ViewListOutlined fontSize="small" />
              </button>
            </Tooltip>
          </div>
          <Tooltip title="Export Excel">
            <IconButton size="small" className="border border-gray-300" onClick={() => handleExport()}>
              <FileDownloadOutlined fontSize="small" className="text-gray-800" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" className="border border-gray-300" onClick={() => window.print()}>
              <PrintOutlined fontSize="small" className="text-gray-800" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        {LEGEND.map(({ abbr, label, color }) => (
          <div key={abbr} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-700">{label}</span>
            <span className="text-[10px] text-gray-400 font-mono">({abbr})</span>
          </div>
        ))}
      </div>

      {/* Monthly Register Table View */}
      {viewMode === "register" && (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          {registerLoading ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">Loading monthly register...</div>
          ) : registerRows.length === 0 ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">No register data for selected period</div>
          ) : (
            <>
              <TableContainer className="max-h-[calc(100vh-400px)]">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {["S No", "Name", "Designation",
                        "Present", "Absent", "Late", "Half Day", "On Duty", "Leave", "Permission", "EarlyOut", "Lop", "Worked(h)", "OT (h)", "OT (m)", "Att %"].map((h, i) => (
                          <TableCell key={h} className={`${i == 0 ? 'left-0 sticky bg-inherit !z-50' : i == 1 ? 'left-[58px] sticky bg-inherit !z-50' : i == 2 ? 'left-[168px] sticky bg-inherit !z-50' :
                            i == 15 ? 'right-0 sticky bg-inherit !z-50' : ''} !font-bold whitespace-nowrap`}>{h}</TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedRegisterRows.map((r: any, i: number) => (
                      <TableRow key={r.employeeId ?? i} sx={getRowColor(i)} className="bg-inherit">
                        <TableCell className="sticky left-0 z-20 bg-inherit" >{(registerPage - 1) * registerLimit + i + 1}</TableCell>
                        <TableCell className="sticky left-[58px] bg-inherit z-20 text-gray-800 whitespace-nowrap">
                          <div className="grid">
                            <div>{r.employeeName} </div>
                            <span className="text-primary text-[10px]">{r.employeeCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="sticky left-[168px] bg-inherit z-20">
                          <div className="grid">
                            <div>{r.designation || '-'} </div>
                            <span className="text-blue-500 text-[10px]">{r.department}</span>
                          </div>
                        </TableCell>
                        <TableCell className="!text-center"><span className="!text-green-600 !font-bold">{r.totalPresent ?? r.presentDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-red-500 !font-bold">{r.totalAbsent ?? r.absentDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-amber-400 !font-bold">{r.totalLate ?? r.lateDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-blue-500 !font-bold">{r.totalHalfDay ?? r.halfDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-cyan-500 !font-bold">{r.totalOnDuty ?? r.onDutyDays ?? "—"}</span></TableCell>

                        <TableCell className="!text-center"><span className="!text-violet-400 !font-bold">{r.totalLeave ?? r.leaveDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-orange-500 !font-bold">{r.permissionDays ?? "—"}</span></TableCell>

                        <TableCell className="!text-center"><span className="!text-sky-500 !font-bold">{r.earlyOutDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-red-600 !font-bold">{r.lossOfPayDays ?? "—"}</span></TableCell>
                        <TableCell className="!text-center"><span className="!text-emerald-500 !font-bold">{r.totalWorkedHours ?? "—"}</span></TableCell>
                        <TableCell className="!text-center">{r.otHours ?? 0}</TableCell>
                        <TableCell className="!text-center">{((r.otHours ?? 0) * 60).toFixed(0)}</TableCell>
                        <TableCell className="!text-center sticky right-0 z-20 bg-inherit" sx={{
                          padding: '8px !important',
                        }}>
                          <span className={`px-2 py-0.5 !my-2 rounded-full font-semibold ${(r.attendancePercentage ?? 0) >= 90 ? "bg-green-100 text-green-700"
                            : (r.attendancePercentage ?? 0) >= 75 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"}`}>
                            {(r.attendancePercentage ?? 0).toFixed(1)}%
                          </span>
                        </TableCell>
                        {/* <TableCell>
                          {r.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                            ${ATTENDANCE_STATUS_BG[r.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                              {ATTENDANCE_STATUS_LABELS[r.status as AttendanceStatus] ?? r.status}
                            </span>
                          )}
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <GlobalPagination
                total={registerRows.length} page={registerPage} limit={registerLimit}
                onPageChange={setRegisterPage}
                onLimitChange={(l) => { setRegisterLimit(l); setRegisterPage(1); }}
              />
            </>
          )}
        </div>
      )}

      {/* Muster Matrix */}
      {viewMode === "muster" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">Loading muster...</div>
          ) : employees.length === 0 ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">No data for selected period</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[calc(100vh-400px)]">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    {/* Day numbers row */}
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="sticky left-0 top-0 z-30 bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[50px]">
                        Code
                      </th>
                      <th className="sticky left-[50px] top-0 z-30 bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[150px]">
                        Employee
                      </th>
                      {dayNumbers.map((d) => (
                        <th
                          key={d}
                          className={`sticky top-0 z-20  bg-gray-50 px-1 py-1 text-center font-semibold min-w-[32px] border-r border-gray-100
                        ${isHoliday(d) ? "bg-slate-100 text-slate-500" : ""}
                        ${isWeeklyOff(d) ? "bg-gray-100 text-gray-400" : ""}
                      `}
                        >
                          <div>{d}</div>
                          <div className="text-[9px] font-normal text-gray-400">{getDayLabel(d)}</div>
                        </th>
                      ))}
                      <th className="sticky top-0 right-[214px] z-20 px-2 py-2 text-center text-gray-600 font-semibold border-l border-gray-200 bg-gray-50 min-w-[36px]">P</th>
                      <th className="sticky top-0 right-[178px] z-20  px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[36px]">A</th>
                      <th className="sticky top-0 right-[142px] z-20 px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[36px]">L</th>
                      <th className="sticky top-0 right-[94px] z-20 px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[40px]">OT(h)</th>
                      <th className="sticky top-0 right-[43px] z-20 px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[40px]">OT(m)</th>
                      <th className="sticky top-0 right-0 z-20 px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[40px]">Att%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEmployees.map((emp, ri) => (
                      <tr key={emp.employeeId} style={getRowColor(ri)}>
                        <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-3 py-1.5 text-gray-600 font-mono">
                          {emp.employeeCode}
                        </td>
                        <td className="sticky left-[50px] z-10 bg-inherit border-r border-gray-200 px-3 py-1.5 text-gray-800 font-medium whitespace-nowrap">
                          {emp.employeeName}
                        </td>
                        {/* {dayNumbers.map((d) => {
                          const cell = getCellForDay(emp, d);
                          const status = cell?.status ?? null;
                          const abbr = status ? (MUSTER_STATUS_ABBR[status] ?? "?") : "";
                          const cellClass = status ? (MUSTER_STATUS_CELL[status] ?? "bg-gray-100 text-gray-500") : "";
                          const isHol = isHoliday(d);
                          const isWO = isWeeklyOff(d);

                          return (
                            <Tooltip
                              key={d}
                              title={
                                cell
                                  ? `${MUSTER_STATUS_ABBR[cell.status ?? ""] || cell.status}${cell.checkIn ? ` | In: ${formatDateTime(cell.checkIn)}` : ""}${cell.checkOut ? ` | Out: ${formatDateTime(cell.checkOut)}` : ""}`
                                  : isHol ? "Holiday" : isWO ? "Weekly Off" : "No data"
                              }
                            >
                              <td className="px-0.5 py-1 text-center border-r border-gray-100">
                                {cell && status ? (
                                  <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold ${cellClass}`}>
                                    {abbr}
                                  </span>
                                ) : isHol ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-slate-200 text-slate-500">HO</span>
                                ) : isWO ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] bg-gray-100 text-gray-400">WO</span>
                                ) : (
                                  <span className="text-gray-200">—</span>
                                )}
                              </td>
                            </Tooltip>
                          );
                        })} */}
                        {dayNumbers.map((d) => {
                          const cell = getCellForDay(emp, d);
                          const status = getAttendanceStatus(cell);
                          const isHol = isHoliday(d);
                          const isWO = isWeeklyOff(d);

                          // Determine if we should show holiday/weekly off
                          const showHoliday = isHol && !cell;
                          const showWeeklyOff = isWO && !cell;

                          // Get status display info
                          const amStatusInfo = status.amStatus ? STATUS_MAPPINGS[status.amStatus] : null;
                          const pmStatusInfo = status.pmStatus ? STATUS_MAPPINGS[status.pmStatus] : null;

                          return (
                            <Tooltip
                              key={d}
                              title={
                                <div className="text-xs">
                                  <div className="font-bold mb-1">Attendance Details</div>
                                  <div>AM: {status.amStatus || '—'}</div>
                                  <div>PM: {status.pmStatus || '—'}</div>
                                  <div className="mt-1 text-gray-300">{status.details}</div>
                                </div>
                              }
                            >
                              <td className="px-0.5 py-1 text-center border-r border-gray-100">
                                {cell ? (
                                  <div className="">
                                    {
                                      amStatusInfo?.abbr == pmStatusInfo?.abbr ? (
                                        <div className={`p-2 py-1 text-[8px] font-bold ${amStatusInfo?.class || 'bg-gray-100 text-gray-400'}`}>{amStatusInfo?.abbr || '—'}</div>
                                      ) : (
                                        <div className="flex items-center">
                                          <span className={`p-2 py-1 text-[8px] border-r-0 font-bold ${amStatusInfo?.class || 'bg-gray-100 text-gray-400'}`}>{amStatusInfo?.abbr || '—'}</span>
                                          <div className="h-6"></div>
                                          <span className={`p-2 py-1 text-[8px] font-bold ${pmStatusInfo?.class || 'bg-gray-100 text-gray-400'}`}>{pmStatusInfo?.abbr || '—'}</span>
                                        </div>
                                      )
                                    }
                                  </div>
                                ) : showHoliday ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">HO</span>
                                ) : showWeeklyOff ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">WO</span>
                                ) : (
                                  <span className="text-gray-200">—</span>
                                )}
                              </td>
                            </Tooltip>
                          );
                        })}
                        {/* {dayNumbers.map((d) => {
                          const cell = getCellForDay(emp, d);
                          const status = getAttendanceStatus(cell);
                          const isHol = isHoliday(d);
                          const isWO = isWeeklyOff(d);

                          const showHoliday = isHol && !cell;
                          const showWeeklyOff = isWO && !cell;

                          const amStatusInfo = status.amStatus ? STATUS_MAPPINGS[status.amStatus] : null;
                          const pmStatusInfo = status.pmStatus ? STATUS_MAPPINGS[status.pmStatus] : null;

                          // Get class for each half using MUSTER_STATUS_CELL
                          const amClass = status.amStatus ? (MUSTER_STATUS_CELL[status.amStatus] ?? "bg-gray-100 text-gray-500") : "bg-gray-100 text-gray-500";
                          const pmClass = status.pmStatus ? (MUSTER_STATUS_CELL[status.pmStatus] ?? "bg-gray-100 text-gray-500") : "bg-gray-100 text-gray-500";

                          // Get abbreviation for each half
                          const amAbbr = status.amStatus ? (MUSTER_STATUS_ABBR[status.amStatus] ?? "?") : "—";
                          const pmAbbr = status.pmStatus ? (MUSTER_STATUS_ABBR[status.pmStatus] ?? "?") : "—";

                          return (
                            <Tooltip
                              key={d}
                              title={
                                cell ? (
                                  <div className="text-xs">
                                    <div className="font-bold mb-1">Attendance Details</div>
                                    <div>AM: {status.amStatus || '—'}</div>
                                    <div>PM: {status.pmStatus || '—'}</div>
                                    <div className="mt-1 text-gray-300">{status.details}</div>
                                  </div>
                                ) : isHol ? (
                                  "Holiday"
                                ) : isWO ? (
                                  "Weekly Off"
                                ) : (
                                  "No data"
                                )
                              }
                            >
                              <td className="px-0.5 py-1 text-center border-r border-gray-100">
                                {cell ? (
                                  <div className="flex items-center gap-0.5">
                                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold ${amClass}`}>
                                      {amAbbr}
                                    </span>
                                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold ${pmClass}`}>
                                      {pmAbbr}
                                    </span>
                                  </div>
                                ) : showHoliday ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-slate-200 text-slate-500">HO</span>
                                ) : showWeeklyOff ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] bg-gray-100 text-gray-400">WO</span>
                                ) : (
                                  <span className="text-gray-200">—</span>
                                )}
                              </td>
                            </Tooltip>
                          );
                        })} */}
                        <td className="sticky right-[214px] z-10 bg-inherit px-2 py-1.5 text-center text-green-600 font-semibold border-l border-gray-200">
                          {emp.totalPresent}
                        </td>
                        <td className="sticky right-[178px] z-10 bg-inherit px-2 py-1.5 text-center text-red-500 font-semibold">{emp.totalAbsent}</td>
                        <td className="sticky right-[142px] z-10 bg-inherit px-2 py-1.5 text-center text-violet-600 font-semibold">{emp.totalLeave}</td>
                        <td className="sticky right-[94px] z-10 bg-inherit px-2 py-1.5 text-center text-orange-600">
                          {/* {(emp.totalOT / 60).toFixed(1)} */}
                          {emp.totalOT}
                        </td>
                        <td className="sticky right-[43px] z-10 bg-inherit px-2 py-1.5 text-center text-orange-600">
                          {(emp.totalOT * 60).toFixed(0)}
                        </td>
                        <td className="sticky right-0 z-10 bg-inherit px-2 py-1.5 text-center">
                          <span className={`text-xs font-semibold ${emp.attendancePercentage >= 90 ? "text-green-600" : emp.attendancePercentage >= 75 ? "text-amber-600" : "text-red-500"}`}>
                            {emp.attendancePercentage.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot className="sticky bottom-0 z-30">
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td colSpan={2} className="sticky left-0 z-30 bg-gray-100 px-3 py-2 font-semibold text-gray-700 border-r border-gray-200">
                        Day Total
                      </td>
                      {dayNumbers.map((d) => {
                        const presentCount = employees.filter((emp) => {
                          const cell = getCellForDay(emp, d);

                          // const s = cell?.status;
                          const s = getAttendanceStatus(cell);
                          return s.overallStatus === "present" || s.overallStatus === "checked_in" || s.overallStatus === "checked_out" || s.overallStatus === "late";
                        }).length;
                        return (
                          <td key={d} className="bg-gray-100 px-0.5 py-2 text-center text-[10px] font-semibold text-gray-600 border-r border-gray-100">
                            {presentCount > 0 ? presentCount : ""}
                          </td>
                        );
                      })}
                      <td colSpan={6} className="sticky right-0 z-30 bg-gray-100 border-l border-gray-200" />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <GlobalPagination
                total={employees.length} page={musterPage} limit={musterLimit}
                onPageChange={setMusterPage}
                onLimitChange={(l) => { setMusterLimit(l); setMusterPage(1); }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
