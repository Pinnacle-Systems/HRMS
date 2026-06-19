import { useState, useEffect } from "react";
import {
  FormControlLabel, Switch, LinearProgress, Alert,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PlayArrowOutlined, CheckCircleOutlined, ErrorOutlined,
  WarningAmberOutlined, InfoOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { ProcessResult, AttendanceStatus } from "../../../services/modules/attendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG, formatTime } from "./const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

export function ProcessAttendance() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  const [fromDate, setFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);
  const [reprocess, setReprocess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!fromDate || !toDate) {
      showSnackbar("Please select date range", "warning");
      return;
    }
    if (dayjs(toDate).isBefore(dayjs(fromDate))) {
      showSnackbar("End date must be after start date", "warning");
      return;
    }
    if (dayjs(fromDate).isAfter(dayjs())) {
      showSnackbar("Cannot process future dates", "warning");
      return;
    }

    showConfirmDialog({
      title: "Process Attendance",
      message: reprocess
        ? `Re-process attendance from ${fromDate} to ${toDate}? This will overwrite existing processed records.`
        : `Process attendance from ${fromDate} to ${toDate}?`,
      confirmText: "Process",
      onConfirm: async () => {
        setProcessing(true);
        setResult(null);
        setError(null);
        showSpinner();
        try {
          const res: any = await attendanceService.processAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            reprocess,
          });
          const data = res?.data?.data ?? res?.data;
          setResult(data);
          showSnackbar(
            `Processed ${data?.processed ?? 0} records successfully`,
            "success"
          );
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "Failed to process attendance";
          setError(msg);
          showSnackbar(msg, "error");
        } finally {
          setProcessing(false);
          hideSpinner();
        }
      },
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[30%_auto] gap-4">
        {/* Process Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="font-semibold text-gray-700 mb-6">Process Configuration</div>

          <div className="space-y-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="From Date"
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(newValue) => {
                    setFromDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
                  }}
                  maxDate={dayjs()}
                />
                <DatePicker
                  label="To Date"
                  value={toDate ? dayjs(toDate) : null}
                  onChange={(newValue) => {
                    setToDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
                  }}
                  maxDate={dayjs()}
                  minDate={fromDate ? dayjs(fromDate) : undefined}
                />
              </div>
            </LocalizationProvider>
            <FormControl>
              <InputLabel>Department</InputLabel>
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} label="Department" sx={selectSx}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={reprocess}
                  onChange={(e) => setReprocess(e.target.checked)}
                  size="small"
                  color="warning"
                />
              }
              label={
                <span className="text-[12px] text-gray-700">
                  Re-process already processed records
                </span>
              }
            />
            {reprocess && (
              <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ py: 0.5 }}>
                <span className="text-xs">
                  Re-processing will overwrite existing attendance statuses for the selected period.
                </span>
              </Alert>
            )}
          </div>

          <button
            onClick={handleProcess}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlayArrowOutlined fontSize="small" />
            {processing ? "Processing..." : "Process Attendance"}
          </button>

          {processing && (
            <div>
              <LinearProgress color="primary" />
              <div className="text-xs text-gray-500 mt-1 text-center">
                Processing attendance records...
              </div>
            </div>
          )}
        </div>

        {/* Rules / Info Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="font-semibold text-gray-700">Processing Rules</div>
          <div className="grid grid-cols-3 gap-2 text-[12px] text-gray-600">
            {[
              { icon: <CheckCircleOutlined fontSize="small" className="text-green-500" />, text: "Present — both check-in and check-out within shift" },
              { icon: <WarningAmberOutlined fontSize="small" className="text-amber-500" />, text: "Late — check-in after shift start grace period" },
              { icon: <ErrorOutlined fontSize="small" className="text-pink-500" />, text: "Early Out — check-out before shift end time" },
              { icon: <InfoOutlined fontSize="small" className="text-pink-400" />, text: "Irregular — only one punch (check-in OR check-out)" },
              { icon: <ErrorOutlined fontSize="small" className="text-red-500" />, text: "Absent — no biometric/manual punch recorded" },
              { icon: <CheckCircleOutlined fontSize="small" className="text-cyan-500" />, text: "On Duty — approved on-duty request present" },
              { icon: <CheckCircleOutlined fontSize="small" className="text-violet-500" />, text: "Leave — approved leave application for the date" },
              { icon: <InfoOutlined fontSize="small" className="text-orange-400" />, text: "Permission — approved short leave/permission request" },
              { icon: <InfoOutlined fontSize="small" className="text-slate-400" />, text: "Holiday / Weekly Off — as per company calendar" },
              { icon: <CheckCircleOutlined fontSize="small" className="text-orange-500" />, text: "OT — hours worked beyond shift end (shift-policy based)" },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-2">
                {icon}
                <span>{text}</span>
              </div>
            ))}
          </div>
          <Alert severity="info" sx={{ py: 0.5 }}>
            <span className="text-xs">
              Only dates up to today can be processed. Finalised periods cannot be re-processed.
            </span>
          </Alert>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert severity="error">
          <span className="text-sm">{error}</span>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="font-semibold text-gray-700">Processing Results</div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Employees", value: result.totalEmployees, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Processed", value: result.processed, color: "text-green-600", bg: "bg-green-50" },
              { label: "Skipped", value: result.skipped, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Errors", value: result.errors, color: "text-red-600", bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className={`text-xs ${color} mt-0.5`}>{label}</div>
              </div>
            ))}
          </div>

          {/* Employee Results Table */}
          {result.employees && result.employees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border border-gray-200 rounded-lg">
                <thead>
                  <tr className="border-b border-gray-200 bg-head">
                    <th className="text-left py-2 px-3">S No</th>
                    <th className="text-left py-2 px-3">Code</th>
                    <th className="text-left py-2 px-3 ">Employee</th>
                    <th className="text-center py-2 px-3 ">Status</th>
                    <th className="text-center py-2 px-3 ">Check In</th>
                    <th className="text-center py-2 px-3 ">Check Out</th>
                    <th className="text-center py-2 px-3 ">Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {result.employees.map((emp, i) => (
                    <tr key={emp.employeeId} style={getRowColor(i)}>
                      <td className="py-2 px-3 text-gray-600 font-mono ">{i + 1}</td>
                      <td className="py-2 px-3 text-gray-600 font-mono ">{emp.employeeCode}</td>
                      <td className="py-2 px-3 font-medium text-gray-800 ">{emp.employeeName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={` px-2 py-0.5 rounded-full font-medium ${ATTENDANCE_STATUS_BG[emp.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {ATTENDANCE_STATUS_LABELS[emp.status as AttendanceStatus] ?? emp.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center !font-mono">
                        {formatTime(emp.checkInTime)}
                      </td>
                      <td className="py-2 px-3 text-center !font-mono">
                        {formatTime(emp.checkOutTime)}
                      </td>
                      <td className="py-2 px-3 text-center">{emp.shiftCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
