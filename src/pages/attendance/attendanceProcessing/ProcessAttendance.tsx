import { useState, useEffect } from "react";
import {
  FormControlLabel, Switch, LinearProgress, Alert,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip,
} from "@mui/material";
import {
  PlayArrowOutlined, CheckCircleOutlined, ErrorOutlined,
  WarningAmberOutlined, InfoOutlined, LockOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { ProcessResult, AttendanceStatus, WorkerType } from "../../../services/modules/attendanceTypes";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG, formatTime, WORKER_TYPE_OPTIONS } from "../const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { useAuth } from "../../../auth/authContext";

export function ProcessAttendance() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  // State
  const [fromDate, setFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [workerType, setWorkerType] = useState<WorkerType>("Both");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reprocess, setReprocess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCloseOption, setShowCloseOption] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const { session } = useAuth();

  // Fetch departments
  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);

  async function handleProcess() {
    // Validation
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
    if (!workerType) {
      showSnackbar("Please select worker type", "warning");
      return;
    }
    showConfirmDialog({
      title: "Process Attendance",
      message: reprocess
        ? `Re-process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}? 
       This will overwrite existing processed records.`
        : `Process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}?`,
      confirmText: "Process",
      onConfirm: async () => {
        setProcessing(true);
        setResult(null);
        setError(null);
        setShowCloseOption(false);
        setIsClosed(false);
        showSpinner();

        try {
          const res: any = await attendanceService.processAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            workerType: workerType,
            reprocess: reprocess,
          });

          const data = res?.data?.data ?? res?.data;
          setResult(data);
          setIsClosed(data?.locked || false);

          const isToday = fromDate === dayjs().format("YYYY-MM-DD") &&
            toDate === dayjs().format("YYYY-MM-DD");
          const canClose = !data?.locked && data?.processed > 0;

          if (isToday && canClose) {
            setShowCloseOption(true);
            showSnackbar(
              `${data?.processed ?? 0} ${workerType === 'Both' ? 'both Staff and Labour' : workerType} records processed. Click "Close & Finalize" to lock these records.`,
              "info"
            );
          } else {
            showSnackbar(
              `Processed ${data?.processed ?? 0} ${workerType === 'Both' ? 'both Staff and Labour' : workerType} records successfully`,
              "success"
            );
          }
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

  async function handleCloseAndFinalize() {
    if (!result || result.processed === 0) {
      showSnackbar("No processed records to close", "warning");
      return;
    }
    showConfirmDialog({
      title: "Close & Finalize Attendance",
      message: `Are you sure you want to close attendance for ${fromDate} for ${workerType === 'Both' ? 'both Staff and Labour' : workerType}? 
       This will lock all records and prevent further modifications.
        This action cannot be undone!`,
      confirmText: "Close & Finalize",
      onConfirm: async () => {
        setProcessing(true);
        showSpinner();
        try {
          const res: any = await attendanceService.processAndCloseAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            workerType: workerType,
            reprocess: false,
            lockReason: `End of day processing - ${workerType === 'Both' ? 'both Staff and Labour' : workerType}`,
            lockedBy: session?.user.userId || "System",
          });
          const updatedData = res?.data?.data ?? res?.data;
          setResult(prev => ({
            ...prev!,
            locked: updatedData.locked,
            message: updatedData.message
          }));
          setIsClosed(true);
          setShowCloseOption(false);
          showSnackbar(
            `Attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} closed and finalized successfully!`,
            "success"
          );
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "Failed to close attendance";
          showSnackbar(msg, "error");
        } finally {
          setProcessing(false);
          hideSpinner();
        }
      },
    });
  }

  async function handleManualClose() {
    if (!result || result.processed === 0) {
      showSnackbar("No processed records to close", "warning");
      return;
    }
    const lockReason = prompt("Please provide a reason for closing this attendance:", "Manual closure");
    if (lockReason === null) return;

    if (!lockReason.trim()) {
      showSnackbar("Lock reason is required", "warning");
      return;
    }

    showConfirmDialog({
      title: "Close & Finalize Attendance",
      message: `Are you sure you want to close attendance for ${fromDate} to ${toDate} for ${workerType === 'Both' ? 'both Staff and Labour' : workerType}?`,
      confirmText: "Close",
      onConfirm: async () => {
        setProcessing(true);
        showSpinner();
        try {
          const res: any = await attendanceService.processAndCloseAttendance({
            fromDate,
            toDate,
            departmentId: departmentId || undefined,
            workerType: workerType,
            reprocess: false,
            lockReason: lockReason.trim(),
            lockedBy: session?.user.userId || "System",
          });

          const updatedData = res?.data?.data ?? res?.data;
          setResult(prev => ({
            ...prev!,
            locked: updatedData.locked,
            message: updatedData.message
          }));
          setIsClosed(true);
          setShowCloseOption(false);

          showSnackbar(
            `Attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} closed successfully!`,
            "success"
          );
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "Failed to close attendance";
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

          <FormControl sx={{ width: 180 }} required>
            <InputLabel>Worker Type *</InputLabel>
            <Select
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value as WorkerType)}
              label="Worker Type *"
              sx={selectSx}
            >
              {WORKER_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ width: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              label="Department"
              sx={selectSx}
            >
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
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Chip
            label={`Worker Type: ${workerType === 'Both' ? 'Staff and Labour' : workerType}`}
            size="small"
            color={workerType === 'Both' ? 'primary' : 'default'}
            variant="outlined"
            className={`${workerType !== 'Both' ? 'text-gray-800' : ''}`}
          />
          {departmentId && (
            <Chip
              label={`Dept: ${departments.find(d => d.id === departmentId)?.departmentName || ''}`}
              size="small"
              variant="outlined"
              className="text-gray-800"
            />
          )}
          {reprocess && (
            <Chip
              label="Reprocess Mode"
              size="small"
              color="info"
              icon={<WarningAmberOutlined className="!w-3" />}
            />
          )}
          <button
            onClick={handleProcess}
            disabled={processing || !workerType}
            className="ml-auto flex items-center justify-center gap-2 px-5 py-2 bg-primary text-white rounded text-[12px] font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-center"
          >
            <PlayArrowOutlined fontSize="small" />
            {processing ? "Processing..." : "Process Attendance"}
          </button>
        </div>

        {reprocess && (
          <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ py: 0.5, mt: 2 }}>
            <span className="text-xs">
              Re-processing will overwrite existing attendance statuses for the selected period and worker type.
            </span>
          </Alert>
        )}

        {processing && (
          <div className="mt-3">
            <LinearProgress color="primary" />
            <div className="text-xs text-gray-500 mt-1 text-center">
              Processing {workerType === 'Both' ? 'Staff and Labour' : workerType} attendance records...
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert severity="error">
          <span className="text-[12px]">{error}</span>
        </Alert>
      )}

      {/* Close Option Banner */}
      {showCloseOption && !isClosed && result && result.processed > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <InfoOutlined className="text-amber-600" />
            <span className="text-[12px] text-amber-800">
              Attendance for {workerType === 'Both' ? 'both Staff and Labour' : workerType} processed for {fromDate}. Click below to close and finalize.
            </span>
          </div>
          <button
            onClick={handleCloseAndFinalize}
            className="px-4 py-1.5 bg-amber-600 text-white rounded text-[12px] font-medium hover:bg-amber-700 transition-colors"
          >
            <LockOutlined fontSize="small" className="mr-1 !w-4" />
            Close & Finalize
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-700">
              Processing Results
              <span className="ml-2 text-xs font-normal text-gray-500">
                {workerType === 'Both' ? 'Staff and Labour' : workerType}
              </span>
            </div>
            {result.locked && (
              <Chip
                label="Closed & Finalized"
                color="success"
                size="small"
                icon={<LockOutlined />}
              />
            )}
          </div>

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

          {/* Status message */}
          {result.message && (
            <Alert severity={result.locked ? "success" : "info"} sx={{ py: 0.5 }}>
              <span className="text-xs">{result.message}</span>
            </Alert>
          )}

          {/* Manual Close Button (for non-today dates) */}
          {!result.locked && result.processed > 0 && !showCloseOption && (
            <div className="flex justify-end">
              <button
                onClick={handleManualClose}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
              >
                <LockOutlined fontSize="small" className="mr-1" />
                Close Attendance
              </button>
            </div>
          )}

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
                      <TableCell align="center" sx={{ padding: '8px !important' }}>
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
            Select "Both" to process both Staff and Labour attendance together.
          </span>
        </Alert>
      </div>
    </div>
  );
}