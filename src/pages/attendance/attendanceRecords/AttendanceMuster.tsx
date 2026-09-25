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
import { MONTHS, getDaysInMonth, getCurrentMonthYear, formatTime } from "../const";
import type { Branches, Department } from "../../employees/type";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import type { MusterRow } from "../../../services/modules/attendanceTypes";
import { apiService } from "../../../services";

const FALLBACK_LEGEND = [
  { status: "present", specification: "P", label: "Present", color: "#24b428" },
  { status: "absent", specification: "A", label: "Absent", color: "#dc268c" },
  { status: "late", specification: "L", label: "Late", color: "#CA8A04" },
  { status: "half_day", specification: "H", label: "Half Day", color: "#14B8A6" },
  { status: "on_duty", specification: "OD", label: "On Duty", color: "#0EA5E9" },
  { status: "leave", specification: "LV", label: "Leave", color: "#F97316" },
  { status: "permission", specification: "PM", label: "Permission", color: "#06B6D4" },
  { status: "holiday", specification: "HD", label: "Holiday", color: "#3B82F6" },
  { status: "weekly_off", specification: "WO", label: "Week Off", color: "#9CA3AF" },
  { status: "irregular", specification: "IR", label: "Irregular", color: "#B45309" },
  { status: "missed_out", specification: "MO", label: "Missed Out", color: "#9333EA" },
  { status: "night_duty", specification: "ND", label: "Night Duty", color: "#6366F1" },
  { status: "wfh", specification: "WFH", label: "WFH", color: "#10B981" },
  { status: "comp_off", specification: "CO", label: "Comp Off", color: "#EC4899" },
];

const SUMMARY_COL_WIDTH = 46;
const REGISTER_PINNED_WIDTH = 85;

type StatusMap = Record<string, { abbr: string; color: string; label: string }>;

type SummaryColumn = {
  key: string;
  abbr: string;
  color: string;
  label: string;
  field: string;
  pinned?: boolean;
};

const MUSTER_SUMMARY_ORDER = [
  "present",
  "absent",
  "late",
  "leave",
  "irregular",
];

const MUSTER_SUMMARY_FIELD_MAP: Record<string, string> = {
  present: "totalPresent",
  absent: "totalAbsent",
  late: "totalLate",
  leave: "totalLeave",
  irregular: "totalIrregular",
};

const REGISTER_EXCLUDED_STATUSES = ["early_out", "irregular_early_out"];

const REGISTER_FIELD_ALIASES: Record<string, string[]> = {
  present: ["totalPresent", "presentDays", "present"],
  absent: ["totalAbsent", "absentDays", "absent"],
  late: ["totalLate", "lateDays", "late"],
  leave: ["totalLeave", "leaveDays", "leave"],
  irregular: ["totalIrregular", "irregularDays", "irregular"],
  half_day: ["totalHalfDay", "halfDays", "halfDay"],
  on_duty: ["totalOnDuty", "onDutyDays", "onDuty"],
  permission: ["permissionDays", "totalPermission", "permission"],
  early_out: ["earlyOutDays", "totalEarlyOut", "earlyOut", "early_out"],
  lop: ["lopDays", "totalLop", "lop"],
  missed_out: ["missedOutDays", "totalMissedOut", "missedOut"],
  weekly_off: ["weeklyOffDays", "totalWeeklyOff", "weeklyOff", "weekOff"],
  holiday: ["holidayDays", "totalHoliday", "holiday", "holidays"],
  worked_hours: ["workedHours", "totalWorkedHours", "worked_hours"],
  ot_hours: ["otHours", "totalOtHours", "otHours"],
  // ot_minutes: ["otMinutes", "totalOtMinutes", "otMinutes"],
  night_duty: ["nightDutyDays", "totalNightDuty", "nightDuty"],
  wfh: ["wfhDays", "totalWfh", "wfh"],
  comp_off: ["compOffDays", "totalCompOff", "compOff"],
};

/** Full-form header labels for register columns */
const REGISTER_HEADER_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  on_duty: "On Duty",
  leave: "Leave",
  permission: "Permission",
  holiday: "Holiday",
  weekly_off: "Week Off",
  irregular: "Irregular",
  missed_out: "Missed Out",
  night_duty: "Night Duty",
  wfh: "WFH",
  comp_off: "Comp Off",
  lop: "Lop",
  worked_hours: "Worked(h)",
  ot_hours: "OT (h)",
  // ot_minutes: "OT (m)",
  att: "Att %",
};

/** Extra (non-legend) columns for the Monthly Register, placed before OT columns. */
const REGISTER_EXTRA_COLUMNS: SummaryColumn[] = [
  {
    key: "lop",
    abbr: "Lop",
    color: "#dc268c",
    label: "Loss of Pay",
    field: "lop",
  },
  {
    key: "worked_hours",
    abbr: "Worked(h)",
    color: "#14a85c",
    label: "Worked Hours",
    field: "workedHours",
  },
];

function buildLegendMaps(apiLegend: any[]): { mappings: StatusMap; normalized: any[] } {
  const source = apiLegend?.length ? apiLegend : FALLBACK_LEGEND;
  const mappings: StatusMap = {};
  const normalized: any[] = [];

  source.forEach((item: any) => {
    const key = item.status;
    if (!key) return;
    mappings[key] = {
      abbr: item.specification ?? "?",
      color: item.color ?? "#9CA3AF",
      label: item.label ?? key,
    };
    normalized.push({
      status: key,
      abbr: item.specification ?? "?",
      label: item.label ?? key,
      color: item.color ?? "#9CA3AF",
    });
  });

  return { mappings, normalized };
}

function buildMusterSummaryColumns(legend: any[]): SummaryColumn[] {
  const map = new Map(legend.map((l) => [l.status, l]));
  const cols: SummaryColumn[] = [];

  MUSTER_SUMMARY_ORDER.forEach((status) => {
    const item = map.get(status);
    const field = MUSTER_SUMMARY_FIELD_MAP[status];
    if (!item || !field) return;
    cols.push({
      key: status,
      abbr: item.abbr,
      color: item.color,
      label: item.label,
      field,
    });
  });

  cols.push({
    key: "ot",
    abbr: "OT(h)",
    color: "#EA580C",
    label: "Overtime (hours)",
    field: "totalOT",
  });
  cols.push({
    key: "att",
    abbr: "Att%",
    color: "#09b30f",
    label: "Attendance Percentage",
    field: "attendancePercentage",
  });

  return cols;
}

function buildRegisterColumns(legend: any[]): SummaryColumn[] {
  const cols: SummaryColumn[] = [];

  // 1. All legend statuses (in legend order), excluding ones we explicitly skip
  legend.forEach((item) => {
    if (REGISTER_EXCLUDED_STATUSES.includes(item.status)) return;
    cols.push({
      key: item.status,
      abbr: REGISTER_HEADER_LABELS[item.status] ?? item.label ?? item.status,
      color: item.color,
      label: item.label,
      field: item.status,
    });
  });

  // 2. Extra non-legend columns (Lop, Worked(h))
  REGISTER_EXTRA_COLUMNS.forEach((extra) => {
    if (cols.find((c) => c.key === extra.key)) return;
    cols.push(extra);
  });

  // 3. OT columns (scrollable, right after Worked(h))
  cols.push({
    key: "ot_hours",
    abbr: REGISTER_HEADER_LABELS.ot_hours,
    color: "#EA580C",
    label: "Overtime (hours)",
    field: "otHours",
  });
  // cols.push({
  //   key: "ot_minutes",
  //   abbr: REGISTER_HEADER_LABELS.ot_minutes,
  //   color: "#EA580C",
  //   label: "Overtime (minutes)",
  //   field: "otMinutes",
  // });

  // 4. Att% (only pinned-right column)
  cols.push({
    key: "att",
    abbr: REGISTER_HEADER_LABELS.att,
    color: "#09b30f",
    label: "Attendance Percentage",
    field: "attendancePercentage",
    pinned: true,
  });

  return cols;
}

function hexToRgba(hex: string, alpha = 0.15): string {
  if (!hex) return `rgba(156, 163, 175, ${alpha})`;
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveRegisterValue(row: any, status: string): number {
  const aliases = REGISTER_FIELD_ALIASES[status] ?? [];
  for (const key of aliases) {
    if (row[key] !== undefined && row[key] !== null) return Number(row[key]);
  }
  return 0;
}

function getSolidRowBg(rowStyle: any): string {
  const c = rowStyle?.backgroundColor;
  if (!c || c === "transparent" || c === "inherit") return "#ffffff";
  return c;
}

// ——— Attendance percentage color helper ———
function getAttendanceColor(pct: number): string {
  if (pct < 30) return "#dc2626"; // red
  if (pct < 70) return "#d19d02"; // amber
  return "#039208"; // green
}

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
    shiftEnd,
  } = cell;

  let amStatus: string | null = null;
  let pmStatus: string | null = null;
  let overallStatus: string | null = null;
  const details: string[] = [];

  if (checkIn && checkOut) {
    amStatus = firstHalf === "late" ? "late" : "present";
    pmStatus = secondHalf === "late" ? "late" : "present";
    overallStatus = firstHalf === "late" ? "late" : "present";
    details.push(`✅ Full Day (${formatTime(checkIn)} - ${formatTime(checkOut)})`);
  } else if (checkIn && !checkOut) {
    amStatus = firstHalf === "late" ? "late" : "present";
    pmStatus = "absent";
    overallStatus = "half_day";
    details.push(`⏳ Half Day (In: ${formatTime(checkIn)})`);
  } else if (!checkIn && checkOut) {
    amStatus = "late";
    pmStatus = "present";
    overallStatus = "late";
    details.push(`⏰ Late Arrival (Out: ${formatTime(checkOut)})`);
  } else if (firstHalf === "present" || secondHalf === "present") {
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
  } else if (firstHalf === "weekly_off" || secondHalf === "weekly_off") {
    amStatus = "weekly_off";
    pmStatus = "weekly_off";
    overallStatus = "weekly_off";
    details.push("📅 Weekly Off");
  } else {
    amStatus = firstHalf || null;
    pmStatus = secondHalf || null;
    overallStatus = firstHalf || secondHalf || null;
  }

  if (shiftCode) {
    details.push(`Shift: ${shiftCode} (${shiftStart || "N/A"} - ${shiftEnd || "N/A"})`);
  }

  if (workedMinutes) {
    const hours = Math.floor(workedMinutes / 60);
    const mins = workedMinutes % 60;
    details.push(`⏱️ ${hours}h ${mins}m worked`);
  }

  return { overallStatus, amStatus, pmStatus, details: details.join(" | ") };
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

  // Dynamic legend & mappings from API
  const [legend, setLegend] = useState<any[]>([]);
  const [statusMappings, setStatusMappings] = useState<StatusMap>({});
  const [musterColumns, setMusterColumns] = useState<SummaryColumn[]>([]);
  const [registerColumns, setRegisterColumns] = useState<SummaryColumn[]>([]);

  const daysInMonth = getDaysInMonth(year, month);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Split register columns: scrollable (middle) vs pinned-right (only Att%)
  const registerScrollableColumns = registerColumns.filter((c) => !c.pinned);
  const registerPinnedColumns = registerColumns.filter((c) => c.pinned);

  // Compute right offset for a pinned-right register column at index `idx`
  const getRegisterPinRightOffset = (idx: number) =>
    `${(registerPinnedColumns.length - 1 - idx) * REGISTER_PINNED_WIDTH}px`;

  // Compute right offset for a muster summary column at index `idx`
  const getMusterRightOffset = (idx: number) =>
    `${(musterColumns.length - 1 - idx) * SUMMARY_COL_WIDTH}px`;

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
        month,
        year,
        departmentId: departmentId !== "All" ? departmentId : undefined,
        branchId: branchId || undefined,
      });
      const data = res?.data?.data ?? res?.data;
      setEmployees(data?.employees ?? []);
      setHolidays(data?.holidays ?? []);
      setWeeklyOffs(data?.weeklyOffs ?? []);
      setWorkingDays(data?.workingDays ?? 0);

      const { mappings, normalized } = buildLegendMaps(data?.legend ?? []);
      setStatusMappings(mappings);
      setLegend(normalized);
      setMusterColumns(buildMusterSummaryColumns(normalized));
      setRegisterColumns(buildRegisterColumns(normalized));
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
      console.error("Failed to fetch master data:", error);
    }
  };

  const loadMonthlyRegister = useCallback(async () => {
    setRegisterLoading(true);
    try {
      const res: any = await attendanceService.getMonthlyRegister({
        month,
        year,
        departmentId: departmentId !== "All" ? departmentId : undefined,
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
        exportFormat: "excel",
      });
      await apiService.downloadFromPath(res.data.fileUrl, `attendance_${month}_${year}.xlsx`);
      showSnackbar(`Muster exported successfully for ${MONTHS[month - 1]} ${year}`, "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Export failed", "error");
    } finally {
      hideSpinner();
    }
  }

  // Render a colored badge using dynamic color from API legend
  const renderStatusBadge = (statusKey: string | null, fallback = "—") => {
    if (!statusKey || !statusMappings[statusKey]) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 text-[8px] font-bold bg-gray-100 text-gray-400">
          {fallback}
        </span>
      );
    }
    const info = statusMappings[statusKey];
    return (
      <span
        className="inline-flex items-center justify-center px-2 py-1 text-[8px] font-bold border"
        style={{
          backgroundColor: hexToRgba(info.color, 0.15),
          borderColor: info.color,
          color: info.color,
        }}
      >
        {info.abbr}
      </span>
    );
  };

  const REGISTER_COL_WIDTHS = {
    sNo: 60,
    name: 120,
    designation: 120,
  };

  const REGISTER_OFFSETS = {
    sNo: 0,
    name: REGISTER_COL_WIDTHS.sNo,
    designation: REGISTER_COL_WIDTHS.sNo + REGISTER_COL_WIDTHS.name,
  };

  const Z = {
    headerLeft1: 50,
    headerLeft2: 51,
    headerLeft3: 52,
    headerRightBase: 55,
    bodyLeft1: 20,
    bodyLeft2: 21,
    bodyLeft3: 22,
    bodyRightBase: 25,
  };

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
              <MenuItem value="All">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className="!w-[180px]">
            <InputLabel>Branch</InputLabel>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} label="Branch" sx={selectSx}>
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.branchName}</MenuItem>
              ))}
            </Select>
          </FormControl>
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

      {/* Dynamic Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        {legend.map(({ abbr, label, color, status }) => (
          <div key={status} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-700">{label}</span>
            <span className="text-[10px] text-gray-400 font-mono">({abbr})</span>
          </div>
        ))}
      </div>

      {/* Monthly Register — only Att% is right-sticky */}
      {viewMode === "register" && (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          {registerLoading ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">Loading monthly register...</div>
          ) : registerRows.length === 0 ? (
            <div className="flex justify-center py-16 text-gray-400 text-sm">No register data for selected period</div>
          ) : (
            <>
              <TableContainer className="max-h-[calc(100vh-370px)]">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        className="!font-bold whitespace-nowrap"
                        sx={{
                          position: "sticky",
                          left: 0,
                          zIndex: Z.headerLeft1,
                          backgroundColor: "#ffffff",
                          boxSizing: "border-box",
                          width: REGISTER_COL_WIDTHS.sNo,
                          minWidth: REGISTER_COL_WIDTHS.sNo,
                        }}
                      >
                        S No
                      </TableCell>

                      <TableCell
                        className="!font-bold whitespace-nowrap"
                        sx={{
                          position: "sticky",
                          left: `${REGISTER_OFFSETS.name}px`,
                          zIndex: Z.headerLeft2,
                          backgroundColor: "#ffffff",
                          boxSizing: "border-box",
                          width: REGISTER_COL_WIDTHS.name,
                          minWidth: REGISTER_COL_WIDTHS.name,
                        }}
                      >
                        Name
                      </TableCell>

                      <TableCell
                        className="!font-bold whitespace-nowrap"
                        sx={{
                          position: "sticky",
                          left: `${REGISTER_OFFSETS.designation}px`,
                          zIndex: Z.headerLeft3,
                          backgroundColor: "#ffffff",
                          boxSizing: "border-box",
                          width: REGISTER_COL_WIDTHS.designation,
                          minWidth: REGISTER_COL_WIDTHS.designation,
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        Designation
                      </TableCell>

                      {registerScrollableColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className="!font-bold !text-[11px] !text-center"
                          style={{ color: col.color}}
                        >
                          {col.abbr}
                        </TableCell>
                      ))}

                      {registerPinnedColumns.map((col, idx) => (
                        <TableCell
                          key={col.key}
                          className="!font-bold whitespace-nowrap !text-center"
                          sx={{
                            position: "sticky",
                            right: getRegisterPinRightOffset(idx),
                            zIndex: Z.headerRightBase + idx,
                            backgroundColor: "#ffffff",
                            boxSizing: "border-box",
                            color: col.color,
                            width: REGISTER_PINNED_WIDTH,
                            minWidth: REGISTER_PINNED_WIDTH,
                            borderLeft: "1px solid #e5e7eb",
                          }}
                          title={col.label}
                        >
                          {col.abbr}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pagedRegisterRows.map((r: any, i: number) => {
                      const rowStyle = getRowColor(i);
                      const rowBg = getSolidRowBg(rowStyle);
                      return (
                        <TableRow key={r.employeeId ?? i} sx={rowStyle}>
                          <TableCell
                            sx={{
                              position: "sticky",
                              left: 0,
                              zIndex: Z.bodyLeft1,
                              backgroundColor: rowBg,
                              boxSizing: "border-box",
                              width: REGISTER_COL_WIDTHS.sNo,
                              minWidth: REGISTER_COL_WIDTHS.sNo,
                            }}
                          >
                            {(registerPage - 1) * registerLimit + i + 1}
                          </TableCell>

                          <TableCell
                            className="text-gray-800 whitespace-nowrap"
                            sx={{
                              position: "sticky",
                              left: `${REGISTER_OFFSETS.name}px`,
                              zIndex: Z.bodyLeft2,
                              backgroundColor: rowBg,
                              boxSizing: "border-box",
                              width: REGISTER_COL_WIDTHS.name,
                              minWidth: REGISTER_COL_WIDTHS.name,
                            }}
                          >
                            <div className="grid">
                              <div className="truncate">{r.employeeName}</div>
                              <span className="text-primary text-[10px]">{r.employeeCode}</span>
                            </div>
                          </TableCell>

                          <TableCell
                            sx={{
                              position: "sticky",
                              left: `${REGISTER_OFFSETS.designation}px`,
                              zIndex: Z.bodyLeft3,
                              backgroundColor: rowBg,
                              boxSizing: "border-box",
                              width: REGISTER_COL_WIDTHS.designation,
                              minWidth: REGISTER_COL_WIDTHS.designation,
                              borderRight: "1px solid #e5e7eb",
                            }}
                          >
                            <div className="grid">
                              <div className="truncate">{r.designation || "-"}</div>
                              <span className="text-blue-500 text-[10px] truncate">{r.department}</span>
                            </div>
                          </TableCell>

                          {registerScrollableColumns.map((col) => {
                            const value = resolveRegisterValue(r, col.key);
                            return (
                              <TableCell key={col.key} className="!text-center" style={{ width: 60, minWidth: 60 }}>
                                <span style={{ color: col.color }} className="!font-bold">
                                  {value || "-"}
                                </span>
                              </TableCell>
                            );
                          })}

                          {registerPinnedColumns.map((col, idx) => {
                            const pct = Number(r.attendancePercentage ?? 0);
                            const color = getAttendanceColor(pct);
                            return (
                              <TableCell
                                key={col.key}
                                className="!text-center"
                                sx={{
                                  position: "sticky",
                                  right: getRegisterPinRightOffset(idx),
                                  zIndex: Z.bodyRightBase + idx,
                                  backgroundColor: rowBg,
                                  boxSizing: "border-box",
                                  width: REGISTER_PINNED_WIDTH,
                                  minWidth: REGISTER_PINNED_WIDTH,
                                  borderLeft: "1px solid #e5e7eb",
                                }}
                              >
                                <span
                                  className="px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                                  style={{
                                    backgroundColor: hexToRgba(color, 0.15),
                                    color,
                                  }}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
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
              <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="sticky left-0 top-0 z-40 bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[50px]">
                        Code
                      </th>
                      <th className="sticky left-[53px] top-0 z-[41] bg-gray-50 border-r border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold min-w-[150px]">
                        Employee
                      </th>

                      {dayNumbers.map((d) => (
                        <th
                          key={d}
                          className={`sticky top-0 z-20 bg-gray-50 px-1 py-1 text-center font-semibold min-w-[32px] border-r border-gray-100
                            ${isHoliday(d) ? "bg-slate-100 text-slate-500" : ""}
                            ${isWeeklyOff(d) ? "bg-gray-100 text-gray-400" : ""}
                          `}
                        >
                          <div>{d}</div>
                          <div className="text-[9px] font-normal text-gray-400">{getDayLabel(d)}</div>
                        </th>
                      ))}

                      {musterColumns.map((col, idx) => (
                        <th
                          key={col.key}
                          title={col.label}
                          style={{
                            right: getMusterRightOffset(idx),
                            minWidth: `${SUMMARY_COL_WIDTH}px`,
                            width: `${SUMMARY_COL_WIDTH}px`,
                            zIndex: 60 + idx,
                          }}
                          className={`sticky top-0 px-1 py-2 text-center font-semibold bg-gray-50 text-gray-500
                            ${idx === 0 ? "border-l border-gray-200" : ""}`}
                        >
                          {col.abbr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEmployees.map((emp, ri) => {
                      const rowStyle = getRowColor(ri);
                      const rowBg = getSolidRowBg(rowStyle);
                      return (
                        <tr key={emp.employeeId} style={rowStyle}>
                          <td
                            className="sticky left-0 z-20 whitespace-nowrap border-r border-gray-200 px-3 py-1.5 text-gray-600 font-mono"
                            style={{ backgroundColor: rowBg }}
                          >
                            {emp.employeeCode}
                          </td>
                          <td
                            className="sticky left-[53px] z-[21] border-r border-gray-200 px-3 py-1.5 text-gray-800 font-medium whitespace-nowrap"
                            style={{ backgroundColor: rowBg }}
                          >
                            {emp.employeeName}
                          </td>

                          {dayNumbers.map((d) => {
                            const cell = getCellForDay(emp, d);
                            const status = getAttendanceStatus(cell);
                            const isHol = isHoliday(d);
                            const isWO = isWeeklyOff(d);
                            const showHoliday = isHol && !cell;
                            const showWeeklyOff = isWO && !cell;
                            const amInfo = status.amStatus ? statusMappings[status.amStatus] : null;
                            const pmInfo = status.pmStatus ? statusMappings[status.pmStatus] : null;

                            return (
                              <Tooltip
                                key={d}
                                title={
                                  <div className="text-xs">
                                    <div className="font-bold mb-1">Attendance Details</div>
                                    <div>AM: {status.amStatus || "—"}</div>
                                    <div>PM: {status.pmStatus || "—"}</div>
                                    <div className="mt-1 text-gray-300">{status.details}</div>
                                  </div>
                                }
                              >
                                <td className="px-0.5 py-1 text-center border-r border-gray-100">
                                  {cell ? (
                                    <div>
                                      {amInfo?.abbr === pmInfo?.abbr ? (
                                        renderStatusBadge(status.amStatus)
                                      ) : (
                                        <div className="flex items-center justify-center">
                                          {renderStatusBadge(status.amStatus)}
                                          <div className="h-6" />
                                          {renderStatusBadge(status.pmStatus)}
                                        </div>
                                      )}
                                    </div>
                                  ) : showHoliday ? (
                                    <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                                      HO
                                    </span>
                                  ) : showWeeklyOff ? (
                                    <span className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">
                                      WO
                                    </span>
                                  ) : (
                                    <span className="text-gray-200">—</span>
                                  )}
                                </td>
                              </Tooltip>
                            );
                          })}

                          {musterColumns.map((col, idx) => {
                            const rawValue = (emp as any)[col.field];
                            const isFirst = idx === 0;

                            if (col.key === "att") {
                              const pct = Number(rawValue ?? 0);
                              const color = getAttendanceColor(pct);
                              return (
                                <td
                                  key={col.key}
                                  style={{
                                    right: getMusterRightOffset(idx),
                                    minWidth: `${SUMMARY_COL_WIDTH}px`,
                                    backgroundColor: rowBg,
                                    zIndex: 40 + idx,
                                  }}
                                  className={`sticky px-1 py-1.5 text-center ${isFirst ? "border-l border-gray-200" : ""}`}
                                >
                                  <span
                                    className="font-semibold whitespace-nowrap"
                                    style={{ color }}
                                  >
                                    {pct.toFixed(0)}%
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={col.key}
                                style={{
                                  right: getMusterRightOffset(idx),
                                  minWidth: `${SUMMARY_COL_WIDTH}px`,
                                  backgroundColor: rowBg,
                                  zIndex: 40 + idx,
                                }}
                                className={`sticky px-1 py-1.5 text-center font-semibold ${isFirst ? "border-l border-gray-200" : ""}`}
                              >
                                <span style={{ color: col.color }}>{rawValue ?? 0}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="sticky bottom-0 z-30">
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-40 bg-gray-100 px-3 py-2 font-semibold text-gray-700 border-r border-gray-200"
                      >
                        Day Total
                      </td>
                      {dayNumbers.map((d) => {
                        const presentCount = employees.filter((emp) => {
                          const cell = getCellForDay(emp, d);
                          const s = getAttendanceStatus(cell);
                          return ["present", "late", "half_day"].includes(s.overallStatus ?? "");
                        }).length;
                        return (
                          <td
                            key={d}
                            className="bg-gray-100 px-0.5 py-2 text-center text-[10px] font-semibold text-gray-600 border-r border-gray-100"
                          >
                            {presentCount > 0 ? presentCount : ""}
                          </td>
                        );
                      })}
                      <td
                        colSpan={musterColumns.length}
                        style={{
                          right: 0,
                          minWidth: `${musterColumns.length * SUMMARY_COL_WIDTH}px`,
                        }}
                        className="sticky z-40 bg-gray-100 border-l border-gray-200"
                      />
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