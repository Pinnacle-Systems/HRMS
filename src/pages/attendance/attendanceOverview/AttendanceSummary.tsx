import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import {
  PeopleOutlined, CheckCircleOutlined, CancelOutlined,
  AccessTimeOutlined, ExitToAppOutlined,
  BeachAccessOutlined, WatchLaterOutlined, TrendingUpOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { AttendanceSummary, DailyTrend, DepartmentWiseSummary } from "../../../services/modules/attendanceTypes";
import { ATTENDANCE_STATUS_COLORS } from "../const";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import { selectSx } from "../../../const";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/authContext";

/**
 * NOTE: DepartmentWiseSummary must include these fields in
 * `services/modules/attendanceTypes.ts`:
 *
 *   export interface DepartmentWiseSummary {
 *     department: string;
 *     total: number;
 *     present: number;
 *     absent: number;
 *     late: number;
 *     irregular: number;
 *     onLeave: number;
 *     attendancePercentage: number;
 *   }
 *
 * And DailyTrend should include `irregular` (optional, defaults to 0).
 */

// ---------- Status classification (single source of truth) ----------
// Used by BOTH the 7-day trend and the department table so numbers agree.

const PRESENT_STATUSES = [
  "present",
  "checked_in",
  "checked_out",
  "on_duty",
  "night_duty",
  "missed_punch",
] as const;

const LATE_STATUSES = ["late"] as const;
const IRREGULAR_STATUSES = ["irregular", "half_day"] as const;
const LEAVE_STATUSES = ["leave", "on_leave"] as const;
const ABSENT_STATUSES = ["absent"] as const;

// ---------- StatCard ----------

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  percentage?: number;
  onClick?: () => void;
}

const StatCard = ({ label, value, icon, color, percentage, onClick }: StatCardProps) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 px-2 py-2.5 hover:shadow-sm transition-shadow duration-200
     flex-1 min-w-[80px] max-w-[170px] ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
        <span className="flex-shrink-0" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-base font-semibold text-gray-800">{value}</span>
        {percentage !== undefined && percentage > 0 && (
          <span className="text-[9px] font-medium text-gray-400 mb-0.5">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      {percentage !== undefined && (
        <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ---------- Shared Chart UI primitives ----------

function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-800 text-sm truncate">{title}</div>
          {subtitle && (
            <div className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</div>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message, height }: { message: string; height: number }) {
  return (
    <div
      className="flex items-center justify-center text-gray-300 text-sm"
      style={{ height }}
    >
      {message}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-[11px]">
      {label && (
        <div className="font-semibold text-gray-700 mb-1.5 pb-1.5 border-b border-gray-100">
          {dayjs(label).isValid() ? dayjs(label).format("ddd, DD MMM YYYY") : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => {
          const name = p.name ?? p.payload?.name ?? p.payload?.department;
          const value = p.value;
          const color = p.color ?? p.payload?.color ?? p.fill ?? "#64748b";
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{name}</span>
              <span className="ml-auto font-semibold text-gray-800 tabular-nums">
                {value}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function AttendanceSummary() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [deptData, setDeptData] = useState<DepartmentWiseSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const uiRef = useRef({ showSnackbar, showSpinner, hideSpinner });
  useEffect(() => {
    uiRef.current = { showSnackbar, showSpinner, hideSpinner };
  });

  const branchId = session?.branchId;

  const openDetailedView = (status?: string) => {
    const params = new URLSearchParams({ date: selectedDate });
    if (status) params.set("status", status);
    navigate(`/attendance/records/detailed?${params.toString()}`);
  };

  // -------- Data loaders --------

  const loadSummary = useCallback(async () => {
    const { showSpinner, showSnackbar, hideSpinner } = uiRef.current;
    showSpinner();
    try {
      const res: any = await attendanceService.getSummary({
        date: selectedDate,
        departmentId: departmentId === "All" ? undefined : departmentId || undefined,
        branchId: branchId || undefined,
      });
      const data = res?.data?.data ?? res?.data;
      setSummary(data?.summary ?? data ?? null);
    } catch {
      showSnackbar("Failed to load attendance summary", "error");
      setSummary(null);
    } finally {
      hideSpinner();
    }
  }, [selectedDate, departmentId, branchId]);

  const getRegisterContent = useCallback(
    async (params: Record<string, any>) => {
      try {
        const res: any = await attendanceService.getRegister({
          startDate: params.startDate || selectedDate,
          endDate: params.endDate || selectedDate,
          departmentId:
            params.departmentId === "All" ? undefined : params.departmentId || undefined,
          branchId: branchId || undefined,
        });
        const data = res?.data?.data ?? res?.data;
        return (Array.isArray(data) ? data : data?.content ?? []) as {
          status: string;
          department?: string;
          employeeId?: string;
          employeeName?: string;
          departmentId?: string;
          branchId?: string;
        }[];
      } catch (error) {
        console.error("Error fetching register:", error);
        return [];
      }
    },
    [selectedDate, branchId],
  );

  const loadTrends = useCallback(async () => {
    try {
      const dates = Array.from({ length: 7 }, (_, i) =>
        dayjs(selectedDate).subtract(6 - i, "day").format("YYYY-MM-DD"),
      );

      const trendRows = await Promise.all(
        dates.map(async (d) => {
          try {
            const res: any = await attendanceService.getRegister({
              startDate: d,
              endDate: d,
              departmentId:
                departmentId === "All" ? undefined : departmentId || undefined,
              branchId: branchId || undefined,
            });
            const data = res?.data?.data ?? res?.data;
            const content = Array.isArray(data) ? data : data?.content ?? [];

            const count = (set: readonly string[]) =>
              content.filter((r: any) => set.includes(r.status)).length;

            return {
              date: d,
              present: count(PRESENT_STATUSES),
              absent: count(ABSENT_STATUSES),
              late: count(LATE_STATUSES),
              irregular: count(IRREGULAR_STATUSES),
              onLeave: count(LEAVE_STATUSES),
            };
          } catch (error) {
            console.error(`Error fetching data for ${d}:`, error);
            return {
              date: d,
              present: 0,
              absent: 0,
              late: 0,
              irregular: 0,
              onLeave: 0,
            };
          }
        }),
      );

      setTrends(trendRows as DailyTrend[]);
    } catch (error) {
      console.error("Error loading trends:", error);
      setTrends([]);
    }
  }, [selectedDate, departmentId, branchId]);

  const loadDepartmentWise = useCallback(async () => {
    if (departments.length === 0) return;

    try {
      const content = await getRegisterContent({
        startDate: selectedDate,
        endDate: selectedDate,
        departmentId:
          departmentId === "All" ? undefined : departmentId || undefined,
        branchId: branchId || undefined,
      });

      let filteredContent = content;
      if (departmentId && departmentId !== "All") {
        const selectedDept = departments.find((d) => d.id === departmentId);
        if (selectedDept) {
          filteredContent = content.filter(
            (r) => r.department === selectedDept.departmentName,
          );
        }
      }

      const departmentWise: DepartmentWiseSummary[] = departments
        .map((dept) => {
          const deptRecords = filteredContent.filter(
            (r) => r.department === dept.departmentName,
          );
          if (deptRecords.length === 0) return null;

          const count = (set: readonly string[]) =>
            deptRecords.filter((r) => set.includes(r.status)).length;

          const presentRaw = count(PRESENT_STATUSES);
          const late = count(LATE_STATUSES);
          const irregular = count(IRREGULAR_STATUSES);
          const onLeave = count(LEAVE_STATUSES);
          const absent = count(ABSENT_STATUSES);
          const present = presentRaw + late + irregular;
          const total = deptRecords.length;

          return {
            department: dept.departmentName,
            total,
            present,
            absent,
            late,
            irregular,
            onLeave,
            attendancePercentage: total
              ? Math.round((present / total) * 1000) / 10
              : 0,
          } as DepartmentWiseSummary;
        })
        .filter((d): d is DepartmentWiseSummary => d !== null)
        .filter((d) => d.total > 0);

      departmentWise.sort(
        (a, b) => b.attendancePercentage - a.attendancePercentage,
      );
      setDeptData(departmentWise);
    } catch (error) {
      console.error("Error loading department-wise summary:", error);
      setDeptData([]);
    }
  }, [selectedDate, departmentId, branchId, departments, getRegisterContent]);

  const fetchMasterData = useCallback(async () => {
    try {
      const depRes: any = await departmentService.getActiveDepartments();
      const depData = depRes.data?.content || depRes.data || [];
      setDepartments(Array.isArray(depData) ? depData : []);
    } catch (error: any) {
      console.error("Failed to fetch master data:", error);
    }
  }, []);

  // -------- Effects (three isolated, no identity churn) --------

  // 1) Fetch departments once.
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // 2) Summary + trends on date / department change.
  useEffect(() => {
    loadSummary();
    loadTrends();
  }, [loadSummary, loadTrends]);

  // 3) Department-wise only after departments are loaded, and re-run
  //    when date/dept change or when the list length changes.
  //    Depend on `departments.length` (primitive) to avoid loop from
  //    new array references.
  useEffect(() => {
    if (departments.length === 0) return;
    loadDepartmentWise();
  }, [selectedDate, departmentId, departments.length, loadDepartmentWise]);

  // -------- Derived chart data --------

  const pieData = useMemo(
    () =>
      summary
        ? [
            { name: "Present", value: summary.present, color: ATTENDANCE_STATUS_COLORS.present },
            { name: "Absent", value: summary.absent, color: ATTENDANCE_STATUS_COLORS.absent },
            { name: "Late", value: summary.late, color: ATTENDANCE_STATUS_COLORS.late },
            { name: "On Leave", value: summary.onLeave, color: ATTENDANCE_STATUS_COLORS.leave },
            { name: "On Duty", value: summary.onDuty, color: ATTENDANCE_STATUS_COLORS.on_duty },
            { name: "Permission", value: summary.permission, color: ATTENDANCE_STATUS_COLORS.permission },
            { name: "Holiday", value: summary.holiday, color: ATTENDANCE_STATUS_COLORS.holiday },
            { name: "Weekly Off", value: summary.weeklyOff, color: ATTENDANCE_STATUS_COLORS.weekly_off },
          ].filter((d) => d.value > 0)
        : [],
    [summary],
  );

  const exceptionData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Late", value: summary.late ?? 0, color: ATTENDANCE_STATUS_COLORS.late ?? "#f1aa30" },
      { name: "Half Day", value: summary.halfDay ?? 0, color: "#f59e0b" },
      { name: "Irregular", value: summary.irregular ?? 0, color: "#ec4899" },
      { name: "Permission", value: summary.permission ?? 0, color: ATTENDANCE_STATUS_COLORS.permission ?? "#8b5cf6" },
      { name: "Absent", value: summary.absent ?? 0, color: ATTENDANCE_STATUS_COLORS.absent ?? "#e66262" },
    ].filter((d) => d.value > 0);
  }, [summary]);

  const exceptionTotal = exceptionData.reduce((s, d) => s + d.value, 0);

  // -------- Render --------

  return (
    <div className="p-4 space-y-4">
      {summary ? (
        <>
          {/* Attendance % Banner */}
          <div className="border-2 border-primary rounded-lg py-3 px-5 pt-0 flex items-center justify-between bg-white-50">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <TrendingUpOutlined className="text-primary" fontSize="large" />
                <div>
                  <div className="text-sm text-gray-500">Attendance Rate</div>
                  <div className="text-2xl font-bold text-primary">
                    {summary.attendancePercentage?.toFixed(1) ?? "—"}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 p-2 pt-5 rounded-md">
                <div className="grid grid-cols-3 items-center gap-3">
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                    <DatePicker
                      label="Effective From"
                      className="!w-[200px]"
                      format="DD/MM/YYYY"
                      value={selectedDate ? dayjs(selectedDate) : null}
                      onChange={(newValue) => {
                        setSelectedDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "");
                      }}
                      maxDate={dayjs(new Date())}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                  <FormControl>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
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
                </div>
              </div>
            </div>
            <div className="text-right text-[12px] text-gray-800 font-bold">
              <div>{dayjs(selectedDate).format("dddd, D MMMM YYYY")}</div>
              <div className="flex gap-2 mt-2 justify-end">
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Half Day: {summary.halfDay}
                </div>
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Irregular: {summary.irregular}
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <StatCard
              label="Total Employees"
              value={summary.totalEmployees}
              icon={<PeopleOutlined fontSize="medium" />}
              color="#3b82f6"
              bgColor="bg-blue-50"
              percentage={100}
            />
            <StatCard
              label="Present"
              value={summary.present}
              icon={<CheckCircleOutlined fontSize="medium" />}
              color="#10d3a2"
              bgColor="bg-green-50"
              percentage={summary.totalEmployees ? (summary.present / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("present")}
            />
            <StatCard
              label="Absent"
              value={summary.absent}
              icon={<CancelOutlined fontSize="medium" />}
              color="#e66262"
              bgColor="bg-red-50"
              percentage={summary.totalEmployees ? (summary.absent / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("absent")}
            />
            <StatCard
              label="Late Arrivals"
              value={summary.late}
              icon={<AccessTimeOutlined fontSize="medium" />}
              color="#f1aa30"
              bgColor="bg-amber-50"
              percentage={summary.totalEmployees ? (summary.late / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("late")}
            />
            <StatCard
              label="Irregular"
              value={summary.irregular}
              icon={<ExitToAppOutlined fontSize="medium" />}
              color="#ec4899"
              bgColor="bg-pink-50"
              percentage={summary.totalEmployees ? (summary.irregular / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("irregular")}
            />
            <StatCard
              label="On Duty"
              value={summary.onDuty}
              icon={<WorkOutlineOutlined fontSize="medium" />}
              color="#44bacf"
              bgColor="bg-cyan-50"
              percentage={summary.totalEmployees ? (summary.onDuty / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("on_duty")}
            />
            <StatCard
              label="On Leave"
              value={summary.onLeave}
              icon={<BeachAccessOutlined fontSize="medium" />}
              color="#8b5cf6"
              bgColor="bg-violet-50"
              percentage={summary.totalEmployees ? (summary.onLeave / summary.totalEmployees) * 100 : 0}
              onClick={() => openDetailedView("leave")}
            />
            <StatCard
              label="Overtime"
              value={summary.overtime}
              icon={<WatchLaterOutlined fontSize="medium" />}
              color="#f97316"
              bgColor="bg-orange-50"
              percentage={summary.totalEmployees ? (summary.overtime / summary.totalEmployees) * 100 : 0}
            />
          </div>

          {/* ===== Row 1: 7-Day Trend (2) + Status Distribution (1) + Exceptions (1) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <ChartCard
              className="lg:col-span-2"
              title="7-Day Attendance"
              subtitle="Present · Absent · Late · On Leave"
            >
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trends} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => dayjs(d).format("DD MMM")}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 5 }}
                      name="Present"
                    />
                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 5 }}
                      name="Absent"
                    />
                    <Line
                      type="monotone"
                      dataKey="late"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 5 }}
                      name="Late"
                    />
                    <Line
                      type="monotone"
                      dataKey="onLeave"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2.5, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 5 }}
                      name="On Leave"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No trend data available" height={240} />
              )}
            </ChartCard>

            <ChartCard title="Status Distribution" subtitle="Today's breakdown">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip unit="employees" />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No data available" height={260} />
              )}
            </ChartCard>

            <ChartCard
              title="Exceptions"
              subtitle={exceptionTotal > 0 ? `${exceptionTotal} need attention` : "All clear today"}
            >
              {exceptionData.length > 0 ? (
                <div className="flex flex-col">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={exceptionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={74}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {exceptionData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip unit="employees" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-gray-800">{exceptionTotal}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Total</span>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    {exceptionData.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-[12px] px-1 py-0.5 rounded hover:bg-gray-50"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-gray-600 truncate">{d.name}</span>
                        <span className="ml-auto font-semibold text-gray-800 tabular-nums">{d.value}</span>
                        <span className="text-gray-400 text-[10px] tabular-nums w-9 text-right">
                          {exceptionTotal > 0 ? `${Math.round((d.value / exceptionTotal) * 100)}%` : "0%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState message="No exceptions today" height={200} />
              )}
            </ChartCard>
          </div>

          {/* ===== Row 2: Department table (2) + Last 7 Days bar (2) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {deptData.length > 0 && (
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Department-wise Summary</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{deptData.length} departments</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-2 text-[12px] text-gray-500 font-semibold">#</th>
                        <th className="text-left px-2 text-[12px] text-gray-500 font-semibold">Department</th>
                        <th className="text-center px-2 text-[12px] text-gray-500 font-semibold">Total</th>
                        <th className="text-center px-2 text-[12px] text-gray-500 font-semibold">Present</th>
                        <th className="text-center px-2 text-[12px] text-gray-500 font-semibold">Late</th>
                        <th className="text-center px-2 text-[12px] text-gray-500 font-semibold">Irregular</th>
                        <th className="text-center px-2 text-[12px] text-gray-500 font-semibold">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptData.map((dept, i) => {
                        const pct = dept.attendancePercentage;
                        const color =
                          pct >= 90 ? "#10b981" : pct >= 75 ? "#f59e0b" : "#ef4444";
                        return (
                          <tr key={dept.department ?? i} className="border-b border-gray-200">
                            <td className="px-2 text-gray-400 text-[12px]">{i + 1}</td>
                            <td className="px-2 font-medium text-gray-700 text-[12px]">{dept.department}</td>
                            <td className="px-2 text-center text-gray-600 text-[12px]">{dept.total}</td>
                            <td className="px-2 text-center text-green-600 text-[12px] font-medium">
                              {dept.present}
                            </td>
                            <td className="px-2 text-center text-amber-600 text-[12px]">{dept.late}</td>
                            <td className="px-2 text-center text-pink-600 text-[12px]">{dept.irregular}</td>
                            <td className="px-2">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                                  />
                                </div>
                                <span
                                  className="text-[11px] font-semibold w-10 text-right"
                                  style={{ color }}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <ChartCard
              className={deptData.length > 0 ? "lg:col-span-2" : "lg:col-span-4"}
              title="Last 7 Days"
              subtitle="Daily comparison"
            >
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trends} barSize={14} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => dayjs(d).format("DD")}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="present" fill="#10b981" name="Present" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No trend data available" height={260} />
              )}
            </ChartCard>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <TrendingUpOutlined fontSize="large" />
          <div className="mt-2 text-sm">No summary data for the selected date</div>
        </div>
      )}
    </div>
  );
}