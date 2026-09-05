import { useState, useEffect, useCallback } from "react";
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
import type { Branches, Department } from "../../employees/type";
import { branchService } from "../../../services/modules/branch";
import { getRowColor } from "../../const";
import { selectSx } from "../../../const";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  percentage?: number;
}

const StatCard = ({ label, value, icon, color, percentage }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-2 py-2.5 hover:shadow-sm transition-shadow duration-200
     flex-1 min-w-[80px] max-w-[170px]">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
        <span className="flex-shrink-0" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-base font-semibold text-gray-800">
          {value}
        </span>
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

export function AttendanceSummary() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [deptData, setDeptData] = useState<DepartmentWiseSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);

  const loadSummary = useCallback(async () => {
    showSpinner();
    try {
      const res: any = await attendanceService.getSummary({
        date: selectedDate,
        departmentId: departmentId === 'All' ? undefined : departmentId || undefined,
        branchId: branchId === 'All' ? undefined : branchId || undefined,
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

  // const getRegisterContent = async (params: Record<string, any>) => {
  //   const res: any = await attendanceService.getRegister(params);
  //   const data = res?.data?.data ?? res?.data;
  //   return (Array.isArray(data) ? data : data?.content ?? []) as { status: string; department?: string }[];
  // };
  const getRegisterContent = async (params: Record<string, any>) => {
    try {
      const res: any = await attendanceService.getRegister({
        startDate: params.startDate || selectedDate,
        endDate: params.endDate || selectedDate,
        departmentId: params.departmentId === 'All' ? undefined : params.departmentId || undefined,
        branchId: params.branchId === 'All' ? undefined : params.branchId || undefined,
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
      console.error('Error fetching register:', error);
      return [];
    }
  };

  const loadTrends = useCallback(async () => {
    try {
      const dates = Array.from({ length: 7 }, (_, i) =>
        dayjs(selectedDate).subtract(6 - i, "day").format("YYYY-MM-DD")
      );

      // Fetch all dates in parallel
      const trendPromises = dates.map(async (d) => {
        const params = {
          startDate: d,
          endDate: d,
          departmentId: departmentId === 'All' ? undefined : departmentId || undefined,
          branchId: branchId === 'All' ? undefined : branchId || undefined,
        };

        try {
          const res: any = await attendanceService.getRegister(params);
          const data = res?.data?.data ?? res?.data;
          const content = Array.isArray(data) ? data : data?.content ?? [];

          return {
            date: d,
            present: content.filter((r: any) =>
              ["present", "checked_in", "checked_out", "late", "on_duty"].includes(r.status)
            ).length,
            absent: content.filter((r: any) => r.status === "absent").length,
            late: content.filter((r: any) => r.status === "late").length,
          };
        } catch (error) {
          console.error(`Error fetching data for ${d}:`, error);
          return {
            date: d,
            present: 0,
            absent: 0,
            late: 0,
          };
        }
      });

      const trendRows = await Promise.all(trendPromises);
      setTrends(trendRows);
    } catch (error) {
      console.error('Error loading trends:', error);
      setTrends([]);
    }
  }, [selectedDate, departmentId, branchId]);

  const loadDepartmentWise = useCallback(async () => {
    if (departments.length === 0) {
      await fetchMasterData();
      return;
    }
    try {
      const content = await getRegisterContent({
        startDate: selectedDate, endDate: selectedDate,
        departmentId: departmentId === 'All' ? undefined : departmentId || undefined,
        branchId: branchId === 'All' ? undefined : branchId || undefined,
      });
      let filteredContent = content;
      if (departmentId) {
        const selectedDept = departments.find(d => d.id === departmentId);
        if (selectedDept) {
          filteredContent = content.filter(r => r.department === selectedDept.departmentName);
        }
      }
      const departmentWise: DepartmentWiseSummary[] = departments
        .map((dept) => {
          const deptRecords = filteredContent.filter((r) => r.department === dept.departmentName);
          if (deptRecords.length === 0) return null;

          const present = deptRecords.filter((r) => ["present", "checked_in", "checked_out", "late", "on_duty"].includes(r.status)).length;
          return {
            department: dept.departmentName,
            total: deptRecords.length,
            present,
            absent: deptRecords.length - present,
            attendancePercentage: deptRecords.length ? Math.round((present / deptRecords.length) * 1000) / 10 : 0,
          };
        })
        .filter((d): d is DepartmentWiseSummary => d !== null)
        .filter((d) => d.total > 0);
      departmentWise.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

      setDeptData(departmentWise);
    } catch {
      setDeptData([]);
    }
  }, [selectedDate, departments, departmentId, branchId,]);

  const fetchMasterData = useCallback(async () => {
    try {
      const depRes: any = await departmentService.getActiveDepartments();
      const depData = depRes.data?.content || depRes.data || [];
      setDepartments(Array.isArray(depData) ? depData : []);
      const branRes: any = await branchService.getActiveBranches();
      const branData = branRes.data?.content || branRes.data || [];
      setBranches(Array.isArray(branData) ? branData : []);
    } catch (error: any) {
      console.error('Failed to fetch master data:', error);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadSummary(),
        loadTrends(),
        loadDepartmentWise()
      ]);
    };
    loadAllData();
  }, [selectedDate, departmentId, branchId]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const pieData = summary
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
    : [];

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
                      value={selectedDate ? dayjs(selectedDate) : null}
                      onChange={(newValue) => { setSelectedDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); }}
                      maxDate={new Date() ? dayjs(new Date()) : undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <FormControl>
                    <InputLabel>Department</InputLabel>
                    <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} label="Department" sx={selectSx}>
                      <MenuItem value="All">All Departments</MenuItem>
                      {departments.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <InputLabel>Branch</InputLabel>
                    <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} label="Branch" sx={selectSx}>
                      <MenuItem value="All">All Branches</MenuItem>
                      {branches.map(b => (
                        <MenuItem key={b.id} value={b.id}>{b.branchName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {/* <Button
                onClick={loadSummary}
                className="!border-primary !text-primary"
                startIcon={<RefreshOutlined className="!w-4 text-primary" />}
              >
                Refresh
              </Button> */}
              </div>
            </div>
            <div className="text-right text-[12px] text-gray-800 font-bold">
              <div>{dayjs(selectedDate).format("dddd, D MMMM YYYY")}</div>
              {/* <div>Half Day: {summary.halfDay} &nbsp;|&nbsp; Irregular: {summary.irregular}</div> */}
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
              percentage={(summary.totalEmployees / summary.totalEmployees) * 100}
            />
            <StatCard
              label="Present"
              value={summary.present}
              icon={<CheckCircleOutlined fontSize="medium" />}
              color="#10d3a2"
              bgColor="bg-green-50"
              percentage={(summary.present / summary.totalEmployees) * 100}
            />
            <StatCard
              label="Absent"
              value={summary.absent}
              icon={<CancelOutlined fontSize="medium" />}
              color="#e66262"
              bgColor="bg-red-50"
              percentage={(summary.absent / summary.totalEmployees) * 100}
            />
            <StatCard
              label="Late Arrivals"
              value={summary.late}
              icon={<AccessTimeOutlined fontSize="medium" />}
              color="#f1aa30"
              bgColor="bg-amber-50"
              percentage={(summary.late / summary.totalEmployees) * 100}
            />
            <StatCard
              label="Early Departures"
              value={summary.earlyOut}
              icon={<ExitToAppOutlined fontSize="medium" />}
              color="#ec4899"
              bgColor="bg-pink-50"
              percentage={(summary.earlyOut / summary.totalEmployees) * 100}
            />
            <StatCard
              label="On Duty"
              value={summary.onDuty}
              icon={<WorkOutlineOutlined fontSize="medium" />}
              color="#44bacf"
              bgColor="bg-cyan-50"
              percentage={(summary.onDuty / summary.totalEmployees) * 100}
            />
            <StatCard
              label="On Leave"
              value={summary.onLeave}
              icon={<BeachAccessOutlined fontSize="medium" />}
              color="#8b5cf6"
              bgColor="bg-violet-50"
              percentage={(summary.onLeave / summary.totalEmployees) * 100}
            />
            <StatCard
              label="Overtime"
              value={summary.overtime}
              icon={<WatchLaterOutlined fontSize="medium" />}
              color="#f97316"
              bgColor="bg-orange-50"
              percentage={(summary.overtime / summary.totalEmployees) * 100}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-3 text-sm">Distribution</div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} employees`, String(name),]} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>

            {/* Bar Chart — Trends */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-3 text-sm">Last 7 Days Trend</div>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={trends} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => dayjs(d).format("DD MMM")}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(d) => dayjs(d).format("DD MMM YYYY")}
                    />
                    <Legend iconType="circle" iconSize={10} />
                    <Bar dataKey="present" fill="#10d3a2" name="Present" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="absent" fill="#e66262" name="Absent" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="late" fill="#f1aa30" name="Late" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Department-wise table */}
          {deptData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-700 mb-3 text-sm">Department-wise Summary</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-200 dark:bg-head text-[12px]">
                      <th className="text-left py-2 px-3 text-gray-800 font-bold">S No</th>
                      <th className="text-left py-2 px-3 text-gray-800 font-bold">Department</th>
                      <th className="text-center py-2 px-3 text-gray-800 font-bold">Total</th>
                      <th className="text-center py-2 px-3 text-gray-800 font-bold">Present</th>
                      <th className="text-center py-2 px-3 text-gray-800 font-bold">Absent</th>
                      <th className="text-center py-2 px-3 text-gray-800 font-bold">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptData.map((dept, i) => (
                      <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-[12px]" style={getRowColor(i)}>
                        <td className="py-2 px-3 font-medium text-gray-700">{i + 1}</td>
                        <td className="py-2 px-3 font-medium text-gray-700">{dept.department}</td>
                        <td className="py-2 px-3 text-center text-gray-600">{dept.total}</td>
                        <td className="py-2 px-3 text-center text-green-600 font-medium">{dept.present}</td>
                        <td className="py-2 px-3 text-center text-red-500">{dept.absent}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${dept.attendancePercentage >= 90
                              ? "bg-green-100 text-green-700"
                              : dept.attendancePercentage >= 75
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {dept.attendancePercentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
