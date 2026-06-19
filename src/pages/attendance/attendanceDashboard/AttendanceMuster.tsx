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
import { attendanceService } from "../../../services/modules/attendance";
import type { MusterRow } from "../../../services/modules/attendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG } from "./const";
import type { AttendanceStatus } from "../../../services/modules/attendance";
import { MUSTER_STATUS_CELL, MUSTER_STATUS_ABBR, MONTHS, getDaysInMonth, getCurrentMonthYear } from "./const";
import type { Branches, Department } from "../../employees/type";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

const LEGEND = [
  { abbr: "P", label: "Present", color: "bg-green-500" },
  { abbr: "A", label: "Absent", color: "bg-red-500" },
  { abbr: "L", label: "Late", color: "bg-amber-400" },
  { abbr: "H", label: "Half Day", color: "bg-purple-400" },
  { abbr: "OD", label: "On Duty", color: "bg-cyan-500" },
  { abbr: "LV", label: "Leave", color: "bg-violet-400" },
  { abbr: "PM", label: "Permission", color: "bg-orange-400" },
  { abbr: "HO", label: "Holiday", color: "bg-slate-300" },
  { abbr: "WO", label: "Weekly Off", color: "bg-amber-200" },
  { abbr: "IR", label: "Irregular", color: "bg-pink-400" },
];

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
      const data = res?.data?.data ?? res?.data;
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

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <IconButton size="small" onClick={prevMonth}>
            <ChevronLeftOutlined className="text-gray-800"/>
          </IconButton>
          <span className="text-base font-semibold text-gray-800 min-w-[120px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <IconButton size="small" onClick={nextMonth}>
            <ChevronRightOutlined className="text-gray-800"/>
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
                <TableChartOutlined fontSize="small"/>
              </button>
            </Tooltip>
            <Tooltip title="Monthly Register">
              <button
                onClick={() => setViewMode("register")}
                className={`px-2 py-1.5 text-xs flex items-center gap-1 transition-colors
                  ${viewMode === "register" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <ViewListOutlined fontSize="small"/>
              </button>
            </Tooltip>
          </div>
          <Tooltip title="Export Excel">
            <IconButton size="small" className="border border-gray-300">
              <FileDownloadOutlined fontSize="small" className="text-gray-800"/>
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" className="border border-gray-300" onClick={() => window.print()}>
              <PrintOutlined fontSize="small" className="text-gray-800"/>
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
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["S No","Emp Code", "Name", "Department", "Designation", "Shift",
                      "Present", "Absent", "Late", "Leave", "On Duty", "Half Day", "OT (h)", "Att %", "Status"].map(h => (
                      <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registerRows.map((r: any, i: number) => (
                    <TableRow key={r.employeeId ?? i} hover sx={getRowColor(i)}>
                      <TableCell className="text-gray-800" >{i + 1}</TableCell>
                      <TableCell className="text-gray-800">{r.employeeCode}</TableCell>
                      <TableCell className="text-gray-800 whitespace-nowrap">{r.employeeName}</TableCell>
                      <TableCell className="text-gray-800">{r.department}</TableCell>
                      <TableCell className="text-gray-800">{r.designation}</TableCell>
                      <TableCell className="text-gray-800">{r.shiftCode}</TableCell>
                      <TableCell className="!text-center !text-green-600 !font-bold">{r.totalPresent ?? r.presentDays ?? "—"}</TableCell>
                      <TableCell className="!text-center !text-red-500 !font-bold">{r.totalAbsent ?? r.absentDays ?? "—"}</TableCell>
                      <TableCell className="!text-center !text-amber-400 !font-bold">{r.totalLate ?? r.lateDays ?? "—"}</TableCell>
                      <TableCell className="!text-center !text-violet-400 !font-bold">{r.totalLeave ?? r.leaveDays ?? "—"}</TableCell>
                      <TableCell className="!text-center !text-cyan-500 !font-bold">{r.totalOnDuty ?? r.onDutyDays ?? "—"}</TableCell>
                      <TableCell className="!text-center !text-purple-300 !font-bold">{r.totalHalfDay ?? r.halfDays ?? "—"}</TableCell>
                      <TableCell className="!text-center text-gray-800">{((r.totalOT ?? r.totalOtMinutes ?? 0) / 60).toFixed(1)}</TableCell>
                      <TableCell className="!text-center">
                        <span className={`px-2 py-0.5 !my-2 rounded-full font-semibold                           ${(r.attendancePercentage ?? 0) >= 90 ? "bg-green-100 text-green-700"
                            : (r.attendancePercentage ?? 0) >= 75 ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"}`}>
                          {(r.attendancePercentage ?? 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                            ${ATTENDANCE_STATUS_BG[r.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                            {ATTENDANCE_STATUS_LABELS[r.status as AttendanceStatus] ?? r.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse min-w-full">
              <thead>
                {/* Day numbers row */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-20 bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[50px]">
                    Code
                  </th>
                  <th className="sticky left-[50px] z-20 bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[150px]">
                    Employee
                  </th>
                  {dayNumbers.map((d) => (
                    <th
                      key={d}
                      className={`px-1 py-1 text-center font-semibold min-w-[32px] border-r border-gray-100
                        ${isHoliday(d) ? "bg-slate-100 text-slate-500" : ""}
                        ${isWeeklyOff(d) ? "bg-gray-100 text-gray-400" : ""}
                      `}
                    >
                      <div>{d}</div>
                      <div className="text-[9px] font-normal text-gray-400">{getDayLabel(d)}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold border-l border-gray-200 bg-gray-50 min-w-[36px]">P</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[36px]">A</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[36px]">L</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[40px]">OT(h)</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold bg-gray-50 min-w-[40px]">Att%</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, ri) => (
                  <tr key={emp.employeeId} style={getRowColor(ri)}>
                    <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-3 py-1.5 text-gray-600 font-mono">
                      {emp.employeeCode}
                    </td>
                    <td className="sticky left-[50px] z-10 bg-inherit border-r border-gray-200 px-3 py-1.5 text-gray-800 font-medium whitespace-nowrap">
                      {emp.employeeName}
                    </td>
                    {dayNumbers.map((d) => {
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
                              ? `${MUSTER_STATUS_ABBR[cell.status ?? ""] || cell.status}${cell.checkIn ? ` | In: ${cell.checkIn}` : ""}${cell.checkOut ? ` | Out: ${cell.checkOut}` : ""}`
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
                    })}
                    <td className="px-2 py-1.5 text-center text-green-600 font-semibold border-l border-gray-200">
                      {emp.totalPresent}
                    </td>
                    <td className="px-2 py-1.5 text-center text-red-500 font-semibold">{emp.totalAbsent}</td>
                    <td className="px-2 py-1.5 text-center text-violet-600 font-semibold">{emp.totalLeave}</td>
                    <td className="px-2 py-1.5 text-center text-orange-600">
                      {(emp.totalOT / 60).toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`text-xs font-semibold ${emp.attendancePercentage >= 90 ? "text-green-600" : emp.attendancePercentage >= 75 ? "text-amber-600" : "text-red-500"}`}>
                        {emp.attendancePercentage.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Summary Footer */}
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td colSpan={2} className="sticky left-0 bg-gray-100 px-3 py-2 font-semibold text-gray-700 border-r border-gray-200">
                    Day Total
                  </td>
                  {dayNumbers.map((d) => {
                    const presentCount = employees.filter((emp) => {
                      const cell = getCellForDay(emp, d);
                      const s = cell?.status;
                      return s === "present" || s === "checked_in" || s === "checked_out" || s === "late";
                    }).length;
                    return (
                      <td key={d} className="px-0.5 py-2 text-center text-[10px] font-semibold text-gray-600 border-r border-gray-100">
                        {presentCount > 0 ? presentCount : ""}
                      </td>
                    );
                  })}
                  <td colSpan={5} className="border-l border-gray-200" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
