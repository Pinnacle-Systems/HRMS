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
  PlayArrowOutlined,
  WarningAmberOutlined, InfoOutlined, LockOutlined
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

  const [validationResult, setValidationResult] = useState<ProcessResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch departments
  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);

  // Clear validation when filters change
  const clearValidation = () => {
    setValidationResult(null);
    setError(null);
  };

  // Handle filter changes
  const handleFromDateChange = (newValue: any) => {
    setFromDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
    clearValidation();
  };

  const handleToDateChange = (newValue: any) => {
    setToDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '');
    clearValidation();
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    clearValidation();
  };

  const handleWorkerTypeChange = (value: WorkerType) => {
    setWorkerType(value);
    clearValidation();
  };

  const handleReprocessChange = (checked: boolean) => {
    setReprocess(checked);
    clearValidation();
  };

  async function handleValidate() {
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

    setIsValidating(true);
    showSpinner();
    setValidationResult(null);
    setError(null);

    try {
      const res: any = await attendanceService.validateAttendance({
        fromDate,
        toDate,
        departmentId: departmentId || undefined,
        workerType: workerType,
        reprocess: reprocess,
      });

      const data = res?.data?.data ?? res?.data;
      setValidationResult(data);

      if (data.skippedEmployees && data.skippedEmployees.length > 0) {
        showSnackbar(
          `${data.skippedEmployees.length} employee(s) have no shift assigned. Please fix before processing.`,
          "warning"
        );
      } else {
        showSnackbar(
          `Validation complete. ${data.processed} employee(s) ready for processing.`,
          "success"
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to validate attendance";
      setError(msg);
      showSnackbar(msg, "error");
    } finally {
      setIsValidating(false);
      hideSpinner();
    }
  }

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

    if (!workerType) {
      showSnackbar("Please select worker type", "warning");
      return;
    }

    const hasSkippedEmployees = validationResult?.skippedEmployees && validationResult?.skippedEmployees?.length > 0;

    if (hasSkippedEmployees) {
      const skipEmployeeNames = validationResult.skippedEmployees
        .map(emp => `• ${emp.employeeName} (${emp.employeeCode}): ${emp.reason}`)
        .join('\n');

      showConfirmDialog({
        title: "⚠️ Warning: Employees Will Be Skipped",
        message:
          `There are ${validationResult.skippedEmployees.length} employee(s) that will be skipped because they have no shift assigned.
             ${skipEmployeeNames}`,
        confirmText: "Continue Processing",
        cancelText: "Cancel & Fix Shifts",
        onConfirm: async () => {
          await executeProcess();
        },
      });
      return;
    }

    if (!validationResult) {
      showConfirmDialog({
        title: "Process Attendance",
        message: reprocess
          ? `Re-process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}? \n\nThis will overwrite existing processed records.`
          : `Process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}?`,
        confirmText: "Process",
        cancelText: "Cancel",
        onConfirm: async () => {
          await executeProcess();
        },
      });
      return;
    }

    if (validationResult.processed === 0) {
      showSnackbar("No employees ready for processing. Please check your filters.", "warning");
      return;
    }

    showConfirmDialog({
      title: "Process Attendance",
      message: reprocess
        ? `Re-process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}? 
       This will overwrite existing processed records.`
        : `Process attendance for ${workerType === 'Both' ? 'both Staff and Labour' : workerType} from ${fromDate} to ${toDate}?`,
      confirmText: "Process",
      cancelText: "Cancel",
      onConfirm: async () => {
        await executeProcess();
      },
    });
  }

  // Execute process function
  async function executeProcess() {
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
        employeeIds: undefined,
        workerType: workerType,
        reprocess: reprocess,
      });

      const data = res?.data?.data ?? res?.data;
      setResult(data);
      setIsClosed(data?.locked || false);

      const isToday = fromDate === dayjs().format("YYYY-MM-DD") &&
        toDate === dayjs().format("YYYY-MM-DD");
      const canClose = !data?.locked && data?.processed > 0;

      // Show detailed summary
      // if (data.summary) {
      //   const summaryMessage = `
      //   ✅ Processed: ${data.processed} employees
      //   📊 Present: ${data.summary.present}
      //   ❌ Absent: ${data.summary.absent}
      //   ⏰ Late: ${data.summary.late}
      //   🏖️ Leave/Off: ${data.summary.leave + data.summary.weeklyOff}
      //   🎉 Holidays: ${data.summary.holidays}
      //   ⏱️ Overtime: ${data.summary.overtimeHours}h
      //   ${data.summary.errors > 0 ? `⚠️ Errors: ${data.summary.errors}` : ''}
      // `;
      // }

      if (isToday && canClose) {
        setShowCloseOption(true);
        showSnackbar(
          `${data?.processed ?? 0} ${workerType === 'Both' ? 'both Staff and Labour' : workerType} records processed successfully! 
        ${data.summary?.present || 0} present, ${data.summary?.absent || 0} absent. 
        Click "Close & Finalize" to lock these records.`,
          "info"
        );
      } else {
        showSnackbar(
          `Processed ${data?.processed ?? 0} ${workerType === 'Both' ? 'both Staff and Labour' : workerType} records successfully. 
        ${data.summary?.present || 0} present, ${data.summary?.absent || 0} absent.`,
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
  }

  // Close and Finalize function
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
      cancelText: "Cancel",
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

  // Manual Close function
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
      cancelText: "Cancel",
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
              onChange={handleFromDateChange}
              maxDate={dayjs()}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
            <DatePicker
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              onChange={handleToDateChange}
              maxDate={dayjs()}
              minDate={fromDate ? dayjs(fromDate) : undefined}
              slotProps={{ textField: { size: "small", sx: { width: 170 } } }}
            />
          </LocalizationProvider>

          <FormControl sx={{ width: 180 }} required>
            <InputLabel>Worker Type *</InputLabel>
            <Select
              value={workerType}
              onChange={(e) => handleWorkerTypeChange(e.target.value as WorkerType)}
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
              onChange={(e) => handleDepartmentChange(e.target.value)}
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
                onChange={(e) => handleReprocessChange(e.target.checked)}
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

          {/* Validation status chips */}
          {validationResult && (
            <div className="flex items-center gap-2">
              <Chip
                label={`${validationResult.processed} ready`}
                size="small"
                color="success"
                className="text-green-700 bg-green-50"
              />
              {validationResult.skippedEmployees.length > 0 && (
                <Chip
                  label={`⚠️ ${validationResult.skippedEmployees.length} skipped`}
                  size="small"
                  color="warning"
                  className="text-amber-700 bg-amber-50"
                />
              )}
              {validationResult.errors > 0 && (
                <Chip
                  label={`❌ ${validationResult.errors} errors`}
                  size="small"
                  color="error"
                  className="text-red-700 bg-red-50"
                />
              )}
              <button
                onClick={clearValidation}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleValidate}
              disabled={isValidating || processing || !workerType}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <InfoOutlined fontSize="small" />
              {isValidating ? "Validating..." : "Validate"}
            </button>
            <button
              onClick={handleProcess}
              disabled={processing || isValidating || !workerType}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-white rounded text-[12px] font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayArrowOutlined fontSize="small" />
              {processing ? "Processing..." : "Process Attendance"}
            </button>
          </div>
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
              { label: "Skipped", value: result.skippedEmployees.length, color: "text-amber-600", bg: "bg-amber-50" },
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

          {/* Skipped Employees Table */}
          {result.skippedEmployees && result.skippedEmployees.length > 0 && (
            <TableContainer className="max-h-[calc(100vh-500px)]">
              <Table size="small" stickyHeader className="text-[12px] border border-gray-200">
                <TableHead>
                  <TableRow className="bg-head">
                    <TableCell className="!font-bold">S No</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold">Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.skippedEmployees.map((emp, i) => (
                    <TableRow key={emp.employeeId} hover sx={getRowColor(i)}>
                      <TableCell className="text-gray-600 "><div className="py-2">{i + 1}</div></TableCell>
                      <TableCell className="text-gray-600 "><div className="py-2">{emp.employeeCode}</div></TableCell>
                      <TableCell className="font-medium  text-gray-800"><div className="py-2">{emp.employeeName}</div></TableCell>
                      <TableCell className="text-gray-600 "><div className="py-2">{emp.reason}</div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}

      {/* Show validation results */}
      {validationResult && !processing && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-700">
              Validation Results
              <span className="ml-2 text-xs font-normal text-gray-500">
                {workerType === 'Both' ? 'Staff and Labour' : workerType}
              </span>
            </div>
            <Chip
              label={validationResult.skippedEmployees.length === 0 ? "Ready to Process" : "Issues Found"}
              color={validationResult.skippedEmployees.length === 0 ? "success" : "warning"}
              size="small"
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{validationResult.totalEmployees}</div>
              <div className="text-xs text-blue-600">Total Employees</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{validationResult.processed}</div>
              <div className="text-xs text-green-600">Ready for Processing</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{validationResult.skippedEmployees.length}</div>
              <div className="text-xs text-amber-600">Will be Skipped</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{validationResult.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
          </div>

          {/* Skipped Employees Table */}
          {validationResult.skippedEmployees && validationResult.skippedEmployees.length > 0 && (
            <div id="skipped-employees">
              <div className="text-[12px] font-medium text-red-500 mb-2 flex items-center gap-2 animate-blink">
                <WarningAmberOutlined fontSize="small" />
                Skipped Employees - {validationResult.message || "No shift assigned for these employees"}
              </div>
              <TableContainer className="max-h-[200px] border border-gray-200 rounded">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow className="bg-amber-50">
                      <TableCell className="!font-bold">S No</TableCell>
                      <TableCell className="!font-bold">Employee Code</TableCell>
                      <TableCell className="!font-bold">Employee Name</TableCell>
                      <TableCell className="!font-bold">Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResult.skippedEmployees.map((emp, i) => (
                      <TableRow key={emp.employeeId} hover sx={getRowColor(i)}>
                        <TableCell><div className="p-2">{i + 1}</div></TableCell>
                        <TableCell>{emp.employeeCode}</TableCell>
                        <TableCell>{emp.employeeName}</TableCell>
                        <TableCell className="text-amber-600">{emp.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </div>
      )}

      {/* Attendance Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[13px] font-semibold text-gray-700">📊 Attendance Summary</h4>
          {result?.summary && (
            <span className="text-[10px] text-gray-400">
              {result.processed} employees processed
              {result.skippedEmployees.length > 0 && ` (${result.skippedEmployees.length} skipped)`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {/* Present */}
          <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
            <div className="text-lg font-bold text-emerald-700">
              {result?.summary?.present || 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Present</div>
          </div>

          {/* Absent */}
          <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
            <div className="text-lg font-bold text-red-700">
              {result?.summary?.absent || 0}
            </div>
            <div className="text-[10px] text-red-600 font-medium">Absent</div>
          </div>

          {/* Late */}
          <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
            <div className="text-lg font-bold text-amber-700">
              {result?.summary?.late || 0}
            </div>
            <div className="text-[10px] text-amber-600 font-medium">Late</div>
          </div>

          {/* Leave & Weekly Off */}
          <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
            <div className="text-lg font-bold text-purple-700">
              {(result?.summary?.leave || 0) + (result?.summary?.weeklyOff || 0)}
            </div>
            <div className="text-[10px] text-purple-600 font-medium">Leave/Off</div>
          </div>

          {/* Holidays */}
          <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100">
            <div className="text-lg font-bold text-indigo-700">
              {result?.summary?.holidays || 0}
            </div>
            <div className="text-[10px] text-indigo-600 font-medium">Holidays</div>
          </div>

          {/* Early Out */}
          <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
            <div className="text-lg font-bold text-pink-700">
              {result?.summary?.earlyOut || 0}
            </div>
            <div className="text-[10px] text-pink-600 font-medium">Early Out</div>
          </div>

          {/* Missed Punches */}
          <div className="bg-rose-50 rounded-lg p-2 text-center border border-rose-100">
            <div className="text-lg font-bold text-rose-400">
              {result?.summary?.missedPunches || 0}
            </div>
            <div className="text-[10px] text-rose-400 font-medium">Missed Punches</div>
          </div>

          {/* Overtime */}
          <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
            <div className="text-lg font-bold text-orange-700">
              {result?.summary?.overtimeHours || 0}h
            </div>
            <div className="text-[10px] text-orange-600 font-medium">Overtime</div>
          </div>
        </div>

        {/* Errors Alert */}
        {/* {result?.summary?.errors && (
          <div className="mt-3 p-2 bg-rose-50 rounded-lg border border-rose-200 text-center">
            <span className="text-[11px] text-rose-700">
              ⚠️ {result.summary.errors} error{result.summary.errors > 1 ? 's' : ''} found during processing
            </span>
          </div>
        )} */}
      </div>

      {/* Rules / Info Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Alert severity="info" sx={{ py: 0.5 }}>
          <span className="text-xs">
            <strong>Processing Rules:</strong>
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              <li>Only dates up to today can be processed</li>
              <li>Finalised periods cannot be re-processed</li>
              <li>Select "Both" to process both Staff and Labour attendance together</li>
              <li>Use "Validate" first to check for any issues before processing</li>
              <li>Employees without shifts will be skipped and listed separately</li>
            </ul>
          </span>
        </Alert>
      </div>
    </div>
  );
}