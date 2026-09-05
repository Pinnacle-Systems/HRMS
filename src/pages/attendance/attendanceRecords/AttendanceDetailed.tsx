import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Chip,
  Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField,
  
} from "@mui/material";
import {
   FilterListOutlined, FileDownloadOutlined,
  VisibilityOutlined, EditOutlined, CloseOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { AttendanceRecord, CorrectionRequestPayload } from "../../../services/modules/attendanceTypes";
import { GlobalPagination } from "../../../components/GlobalPagination";
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG,
  STATUS_FILTER_OPTIONS, formatMinutes, formatTime,
} from "../const";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import type { Department } from "../../employees/type";
import { departmentService } from "../../../services/modules/department";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

export function AttendanceDetailed() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [shiftCode, _setShiftCode] = useState("");
  const [status, setStatus] = useState("");
  // const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Correction dialog
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState<Partial<CorrectionRequestPayload>>({});
  const [submitting, setSubmitting] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);


  const loadRecords = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getDetailed({
        fromDate, toDate,
        departmentId: departmentId === "All" ? undefined : departmentId,
        shiftCode: shiftCode || undefined,
        status: (status as any) || undefined,
        search: selectedEmployee?.id || undefined,
        page, size: limit,
      });
      const data = res?.data?.data ?? res?.data;
      setRecords(data?.content ?? data ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load attendance records", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [fromDate, toDate, departmentId, shiftCode, status, selectedEmployee, page, limit]);

  const fetchMasterData = async () => {
    try {
      const depRes: any = await departmentService.getActiveDepartments();
      const depData = depRes.data?.content || depRes.data || [];
      setDepartments(depData);
    } catch (error: any) {
      console.error('Failed to fetch master data:', error);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  function openDetail(record: AttendanceRecord) {
    setSelectedRecord(record);
    setDetailOpen(true);
  }

  function openCorrection(record: AttendanceRecord) {
    setSelectedRecord(record);
    setCorrectionForm({
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      currentCheckIn: record.checkInTime,
      currentCheckOut: record.checkOutTime,
      requestedCheckIn: record.checkInTime ?? "",
      requestedCheckOut: record.checkOutTime ?? "",
      reason: "",
    });
    setCorrectionOpen(true);
  }

  async function submitCorrection() {
    if (!correctionForm.reason) {
      showSnackbar("Reason is required", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await attendanceService.requestCorrection(correctionForm as CorrectionRequestPayload);
      showSnackbar("Correction request submitted", "success");
      setCorrectionOpen(false);
    } catch {
      showSnackbar("Failed to submit correction", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterListOutlined className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters</span>
            {(fromDate || toDate || status !== "all" || departmentId) && (
              <Chip
                label="Active Filters"
                size="small"
                color="primary"
                onDelete={() => {
                  setFromDate("");
                  setToDate("");
                  setStatus("all");
                  setDepartmentId("");
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="Export Data">
              <IconButton size="small" className="text-gray-500 hover:text-gray-700">
                <FileDownloadOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Filter Body */}
        <div className="p-4 pt-5 bg-white-50">
          <div className="grid grid-cols-1 gap-y-5 md:grid-cols-2 items-center">
            <div className="grid grid-cols-3 gap-3">
              <div className="">
                <EmployeeSelector
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  label="Select Employee"
                />
              </div>
              <FormControl >
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => { setStatus(e.target.value); setPage(0); }}
                  sx={selectSx}
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Department</InputLabel>
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} label="Department" sx={selectSx}>
                  <MenuItem value="All">All Departments</MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Filters Group */}
            <div className="flex items-center justify-end gap-2">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <div className="flex items-center gap-2">
                  <DatePicker
                    label="From"
                    value={fromDate ? dayjs(fromDate) : null}
                    onChange={(newValue) => setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                    maxDate={toDate ? dayjs(toDate) : undefined}
                    slotProps={{ textField: { sx: { width: "140px" } } }}
                  />
                  <span className="text-gray-400">→</span>
                  <DatePicker
                    label="To"
                    value={toDate ? dayjs(toDate) : null}
                    onChange={(newValue) => setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                    minDate={fromDate ? dayjs(fromDate) : undefined}
                    slotProps={{ textField: { sx: { width: "140px" } } }}
                  />
                </div>
              </LocalizationProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className='max-h-[calc(100vh-400px)]'>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  "S No",  "Name", "Date",
                  "Shift", "Check In", "Check Out",
                  "Worked", "Late In", "Early Out", "OT", "Status", "Actions",
                ].map((h) => (
                  <TableCell
                    key={h}
                    className={`!font-bold !text-gray-700 ${h === "S No" ? "!sticky left-0 !z-30" : ""} ${h === "Name" ? "!sticky left-[59px] !z-30" : ""}
                     ${h === "Date" ? "!sticky left-[128px] !z-30" : ""} 
                     ${h === "Status" ? "!sticky right-[76px] !z-30" : ""}
                      ${h === "Actions" ? "!sticky right-0 !z-30" : ""}`}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" className="py-8 text-gray-400 text-sm">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    <div className="!py-8 text-gray-400">No records found</div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, index) => (
                  <TableRow key={r.id || index}  sx={getRowColor(index)}>
                    <TableCell className="sticky left-0 z-20 bg-inherit">{index + 1}</TableCell>
                    {/* <TableCell>{r.employeeCode}</TableCell> */}
                    <TableCell className="whitespace-nowrap sticky left-[59px] z-20 bg-inherit">
                      <div className="grid">
                        <div>{r.employeeName}  <span className="text-[10px] text-gray-500">({r.employeeCode})</span></div>
                        <div className="text-blue-500"> {r.department ?? "-"}</div>
                      </div>
                    </TableCell>
                    {/* <TableCell>{r.department ?? "-"}</TableCell> */}
                    <TableCell className=" whitespace-nowrap sticky left-[210px] z-20 bg-inherit">
                      {dayjs(r.attendanceDate).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell>
                      <div>{r.shiftCode || '-'}</div>
                      {r.shiftStart && <span className="text-primary">{r.shiftStart} - {r.shiftEnd}</span>}
                    </TableCell>
                    <TableCell>
                      {r.checkInTime ? formatTime(r.checkInTime) : '-'}
                    </TableCell>
                    <TableCell>
                      {r.checkOutTime ? formatTime(r.checkOutTime) : '-'}
                    </TableCell>
                    <TableCell>
                      {r.workedMinutes ? formatMinutes(r.workedMinutes) : '-'}
                    </TableCell>
                    <TableCell>
                      {r.lateMinutes > 0 ? (
                        <span className="text-amber-600">{formatMinutes(r.lateMinutes)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {r.earlyOutMinutes > 0 ? (
                        <span className="text-pink-600">{formatMinutes(r.earlyOutMinutes)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {r.overtimeMinutes > 0 ? (
                        <span className="text-orange-600">{formatMinutes(r.overtimeMinutes)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap sticky right-[88px] z-20 bg-inherit">
                      <span className={`whitespace-nowrap px-2 py-1 rounded-2xl ${ATTENDANCE_STATUS_BG[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {ATTENDANCE_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap sticky right-0 z-20 bg-inherit">
                      <div className="flex items-center gap-1">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(r)}>
                            <VisibilityOutlined fontSize="small" className="text-primary !w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Request Correction">
                          <IconButton size="small" onClick={() => openCorrection(r)}>
                            <EditOutlined fontSize="small" className="text-blue-500 !w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between !p-2 border-b border-gray-200">
          <span className="pl-4 text-[12px]">Attendance Details</span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          {selectedRecord && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  ["Employee", `${selectedRecord.employeeName} (${selectedRecord.employeeCode})`],
                  ["Date", dayjs(selectedRecord.attendanceDate).format("DD MMM YYYY, dddd")],
                  ["Shift", selectedRecord.shiftCode],
                  ["Department", selectedRecord.department ?? "—"],
                  ["Designation", selectedRecord.designation ?? "—"],
                  ["Status", ATTENDANCE_STATUS_LABELS[selectedRecord.status]],
                  ["Check In", formatTime(selectedRecord.checkInTime)],
                  ["Check Out", formatTime(selectedRecord.checkOutTime)],
                  ["Worked Hours", formatMinutes(selectedRecord.workedMinutes)],
                  ["Late Minutes", selectedRecord.lateMinutes ? formatMinutes(selectedRecord.lateMinutes) : "—"],
                  ["Early Out", selectedRecord.earlyOutMinutes ? formatMinutes(selectedRecord.earlyOutMinutes) : "—"],
                  ["Overtime", selectedRecord.overtimeMinutes ? formatMinutes(selectedRecord.overtimeMinutes) : "—"],
                  ["Check-in Geofence", selectedRecord.checkInWithinGeofence ? "Within Range" : "Outside Range"],
                  ["Check-out Geofence", selectedRecord.checkOutWithinGeofence ? "Within Range" : "Outside Range"],
                  ["Remarks", selectedRecord.remarks ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-head rounded p-2">
                    <div className="text-gray-500 text-[12px]">{label}</div>
                    <div className="text-gray-800 text-[12px] mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={() => setDetailOpen(false)}>Close</Button>
          {selectedRecord && (
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => { setDetailOpen(false); openCorrection(selectedRecord); }}
            >
              Request Correction
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={correctionOpen} onClose={() => setCorrectionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
          <span className="pl-4">Request Attendance Correction</span>
          <IconButton size="small" onClick={() => setCorrectionOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 gap-y-7">
              <div>
                <label className="text-[12px] text-gray-500 block mb-1">Current Check-in</label>
                <div className="text-sm text-gray-700 font-mono bg-head rounded px-3 py-2">
                  {formatTime(correctionForm.currentCheckIn ?? null)}
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 block mb-1">Current Check-out</label>
                <div className="text-sm text-gray-700 font-mono bg-head rounded px-3 py-2">
                  {formatTime(correctionForm.currentCheckOut ?? null)}
                </div>
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Requested Check-in"
                  value={correctionForm.requestedCheckIn ? dayjs(correctionForm.requestedCheckIn) : null}
                  onChange={(newValue) => {
                    setCorrectionForm((f) => ({...f, requestedCheckIn:newValue ? dayjs(newValue).toISOString() : ''}));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
               <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Requested Check-out"
                  value={correctionForm.requestedCheckOut ? dayjs(correctionForm.requestedCheckOut) : null}
                  onChange={(newValue) => {
                    setCorrectionForm((f) => ({...f, requestedCheckOut:newValue ? dayjs(newValue).toISOString() : ''}));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            <TextField
              label="Reason"
              fullWidth
              multiline
              required
              rows={3}
              value={correctionForm.reason ?? ""}
              onChange={(e) => setCorrectionForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button className="!text-gray-800 !border-gray-200" variant="outlined"
            onClick={() => setCorrectionOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitCorrection}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
