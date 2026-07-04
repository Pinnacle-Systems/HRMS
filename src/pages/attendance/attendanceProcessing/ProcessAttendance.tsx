import { useState, useEffect } from "react";
import {
  FormControlLabel, Switch, LinearProgress, Alert,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  PlayArrowOutlined, CheckCircleOutlined, ErrorOutlined,
  WarningAmberOutlined, InfoOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { ProcessResult, AttendanceStatus } from "../../../services/modules/attendanceTypes";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG, formatTime } from "../const";
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
      {/* Process Configuration */}
      <div className="bg-white-50 border border-gray-200 rounded-lg p-4">
        <div className="font-semibold text-gray-700 mb-4">Process Configuration</div>

        <div className="flex flex-wrap items-start gap-4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From Date"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={(newValue) => {
                setFromDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
              }}
              maxDate={dayjs()}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
            <DatePicker
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              onChange={(newValue) => {
                setToDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
              }}
              maxDate={dayjs()}
              minDate={fromDate ? dayjs(fromDate) : undefined}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
          </LocalizationProvider>

          <FormControl sx={{ width: 220 }}>
            <InputLabel>Department</InputLabel>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} label="Department" sx={selectSx}>
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            sx={{ mt: 0.5 }}
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

          <button
            onClick={handleProcess}
            disabled={processing}
            className="ml-auto flex items-center justify-center gap-2 px-5 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-center"
          >
            <PlayArrowOutlined fontSize="small" />
            {processing ? "Processing..." : "Process Attendance"}
          </button>
        </div>

        {reprocess && (
          <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ py: 0.5, mt: 2 }}>
            <span className="text-xs">
              Re-processing will overwrite existing attendance statuses for the selected period.
            </span>
          </Alert>
        )}

        {processing && (
          <div className="mt-3">
            <LinearProgress color="primary" />
            <div className="text-xs text-gray-500 mt-1 text-center">
              Processing attendance records...
            </div>
          </div>
        )}
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
            <TableContainer className="max-h-[calc(100vh-500px)]">
              <Table size="small" stickyHeader className="text-[12px] border border-gray-200">
                <TableHead>
                  <TableRow className="bg-head">
                    <TableCell className="!font-bold">S No</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold" align="center">Status</TableCell>
                    <TableCell className="!font-bold" align="center">Check In</TableCell>
                    <TableCell className="!font-bold" align="center">Check Out</TableCell>
                    <TableCell className="!font-bold" align="center">Shift</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.employees.map((emp, i) => (
                    <TableRow key={emp.employeeId} hover sx={getRowColor(i)}>
                      <TableCell className="text-gray-600 font-mono">{i + 1}</TableCell>
                      <TableCell className="text-gray-600 font-mono">{emp.employeeCode}</TableCell>
                      <TableCell className="font-medium text-gray-800">{emp.employeeName}</TableCell>
                      <TableCell align="center" sx={{
                        padding: '8px !important',
                      }}>
                        <span className={`px-2 py-0.5 rounded-full m-5 font-medium ${ATTENDANCE_STATUS_BG[emp.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {ATTENDANCE_STATUS_LABELS[emp.status as AttendanceStatus] ?? emp.status}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        {emp.checkInTime ? formatTime(emp.checkInTime) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {emp.checkOutTime ? formatTime(emp.checkOutTime) : '-'}
                      </TableCell>
                      <TableCell align="center">{emp.shiftCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}

      {/* Rules / Info Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="font-semibold text-gray-700">Processing Rules</div>
        <div className="flex flex-wrap gap-5 text-[12px] text-gray-600">
          {[
            { icon: <CheckCircleOutlined fontSize="small" className="text-green-500" />, text: "Present" },
            { icon: <WarningAmberOutlined fontSize="small" className="text-amber-500" />, text: "Late" },
            { icon: <ErrorOutlined fontSize="small" className="text-pink-500" />, text: "Early Out" },
            { icon: <InfoOutlined fontSize="small" className="text-pink-400" />, text: "Irregular" },
            { icon: <ErrorOutlined fontSize="small" className="text-red-500" />, text: "Absent" },
            { icon: <CheckCircleOutlined fontSize="small" className="text-cyan-500" />, text: "On Duty" },
            { icon: <CheckCircleOutlined fontSize="small" className="text-violet-500" />, text: "Leave" },
            { icon: <InfoOutlined fontSize="small" className="text-orange-400" />, text: "Permission" },
            { icon: <InfoOutlined fontSize="small" className="text-slate-400" />, text: "Holiday / Weekly Off" },
            { icon: <CheckCircleOutlined fontSize="small" className="text-orange-500" />, text: "OT" },
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
  );
}
