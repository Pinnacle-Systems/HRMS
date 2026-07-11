import { useEffect, useState, useCallback } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import {
  CloseOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import LeavePageShell from "../components/LeavePageShell";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import { formatDate } from "../leaveFormatters";
import {
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { TeamCalendarLeaveRequest } from "../../../services/modules/leaveTypes";
import { leaveService } from "../../../services";
import { getRowColor } from "../../const";

export default function TeamCalendarPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [entries, setEntries] = useState<TeamCalendarLeaveRequest[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TeamCalendarLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  // const [total, setTotal] = useState(0);
  // const [page, setPage] = useState(0);
  // const [limit, setLimit] = useState(1);

  // Dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TeamCalendarLeaveRequest | null>(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    totalEmployees: 0,
    totalDays: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    lopDays: 0,
  });

  const fetchTeamCalendar = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getTeamCalendar({
        fromDate,
        toDate,
      });

      const data = response?.data ?? [];
      setEntries(data);
      setFilteredEntries(data);
      // setTotal(data.length || 0)
      // Calculate statistics
      calculateStatistics(data);
    } catch (err: any) {
      showSnackbar(err?.message || "Team calendar is not available", "error");
      setEntries([]);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [fromDate, toDate]);

  // const handlePageChange = (newPage: number) => {
  //   setPage(newPage - 1);
  // };

  // const handleLimitChange = (newLimit: number) => {
  //   setLimit(newLimit);
  //   setPage(0);
  // };

  const calculateStatistics = (data: TeamCalendarLeaveRequest[]) => {
    const uniqueEmployees = new Set(data.map(r => r.employeeId));
    const totalDays = data.reduce((sum, r) => sum + r.totalDays, 0);
    const lopDays = data.filter(r => r.lop).reduce((sum, r) => sum + r.totalDays, 0);

    setStatistics({
      totalRequests: data.length,
      totalEmployees: uniqueEmployees.size,
      totalDays,
      pending: data.filter(r => r.currentStatus === 'PENDING').length,
      approved: data.filter(r => r.currentStatus === 'APPROVED').length,
      rejected: data.filter(r => r.currentStatus === 'REJECTED').length,
      lopDays,
    });
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...entries];
    setFilteredEntries(filtered);
  }, [entries]);

  useEffect(() => {
    fetchTeamCalendar();
  }, []);

  const handleApplyFilters = () => {
    fetchTeamCalendar();
  }

  const openDetail = (entry: TeamCalendarLeaveRequest) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  // Get session display
  const getSessionDisplay = (entry: TeamCalendarLeaveRequest) => {
    if (entry.fromSession === 'full' || !entry.fromSession) {
      return 'Full Day';
    }
    return `${entry.fromSession} - ${entry.toSession}`;
  };

  return (
    <LeavePageShell
      group="manager"
      title="Team Calendar"
      subtitle="See who is on leave across your team"
    >
      {/* Statistics Cards */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-7 gap-3 mb-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <CardContent className="p-3 !pb-0">
              <div className="text-blue-600 text-[12px] font-medium">Total Requests</div>
              <div className="text-blue-700 text-xl font-bold">{statistics.totalRequests}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-purple-600 text-[12px] font-medium">Employees</div>
              <div className="text-purple-700 text-xl font-bold">{statistics.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-green-600 text-[12px] font-medium">Total Leave Days</div>
              <div className="text-green-700 text-xl font-bold">{statistics.totalDays}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-amber-600 text-[12px] font-medium">Pending</div>
              <div className="text-amber-700 text-xl font-bold">{statistics.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-emerald-600 text-[12px] font-medium">Approved</div>
              <div className="text-emerald-700 text-xl font-bold">{statistics.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-red-600 text-[12px] font-medium">Rejected</div>
              <div className="text-red-700 text-xl font-bold">{statistics.rejected}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <CardContent className="p-3 !pb-3">
              <div className="text-orange-600 text-[12px] font-medium">LOP Days</div>
              <div className="text-orange-700 text-xl font-bold">{statistics.lopDays}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="p-4 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="flex items-center gap-2">
                <DatePicker
                  label="From Date"
                  value={fromDate ? dayjs(fromDate) : null}
                  onChange={(newValue) => setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                  maxDate={toDate ? dayjs(toDate) : undefined}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <span className="text-gray-400">→</span>
                <DatePicker
                  label="To Date"
                  value={toDate ? dayjs(toDate) : null}
                  onChange={(newValue) => setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
                  minDate={fromDate ? dayjs(fromDate) : undefined}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </div>
            </LocalizationProvider>
            <div className="flex items-center gap-1">
              <Tooltip title="Apply Filters">
                <Button
                  variant="contained"
                  className="!bg-primary"
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  Apply
                </Button>
              </Tooltip>
            </div>

            {/* <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentId}
                label="Department"
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                ))}
              </Select>
            </FormControl> */}

          </div>
        </div>
      </div>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} className="overflow-auto" sx={leaveTableContainerSx}>
        <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>S No</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Employee</TableCell>
              {/* <TableCell className={leaveTableHeaderCellClassName}>Department</TableCell> */}
              <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Date Range</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Session</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>LOP</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredEntries.map((entry, index) => (
              <TableRow key={entry.id} hover sx={getRowColor(index)}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="font-medium">{entry.employeeName}</div>
                </TableCell>
                {/* <TableCell>
                  {entry.department || "—"}
                </TableCell> */}
                <TableCell>
                  <div>
                    <div>{entry.leaveTypeName || entry.leaveTypeCode} <span className="text-gray-500 text-[10px]">({entry.leaveTypeCode})</span></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {/* <div>{getDateRange(entry)}</div> */}
                    <div className="text-[12px] text-gray-500">
                      {formatDate(entry.fromDate)} - {formatDate(entry.toDate)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="!capitalize">{getSessionDisplay(entry)}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${entry.totalDays} day${entry.totalDays > 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <LeaveStatusBadge status={entry.currentStatus} />
                </TableCell>
                <TableCell>
                  {entry.lop ? (
                    <Chip label="LOP" size="small" color="error" />
                  ) : (
                    <Chip label="Paid" size="small" color="success" />
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => openDetail(entry)}>
                      <VisibilityOutlined fontSize="small" className="text-primary !w-4" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {loading && (
              <TableRow>
                <TableCell colSpan={10}>
                  <DataState compact type="loading" title="Loading team calendar..." />
                </TableCell>
              </TableRow>
            )}


            {!loading  && filteredEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <DataState
                    compact
                    type="empty"
                    title={entries.length === 0 ? "No team leave found." : "No results match your filters."}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {/* {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={true}
        />
      )} */}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <div className="flex items-center justify-between !p-2 border-b border-gray-200">
          <span className="pl-4 text-[12px] font-medium">Leave Request Details</span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          {selectedEntry && (
            <div className="space-y-4 py-2">
              {/* Employee Info */}
              <div className="bg-head rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold">{selectedEntry.employeeName}</div>
                    <div className="text-[12px] text-gray-500">{selectedEntry.employeeId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-gray-500">Request #{selectedEntry.requestNumber}</div>
                    <div className="text-[12px] text-gray-500">{formatDate(selectedEntry.submittedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <div className="text-[12px] text-gray-500">Leave Type</div>
                    <div className="text-[12px] text-gray-800">
                      {selectedEntry.leaveTypeName} ({selectedEntry.leaveTypeCode})
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-3">
                    <div className="text-[12px] text-gray-500">Total Days</div>
                    <div className="text-[12px] text-gray-800">
                      {selectedEntry.totalDays} day{selectedEntry.totalDays > 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Details */}
              <div className="bg-head rounded p-3">
                <div className="text-[12px] text-gray-500 mb-2">Leave Dates</div>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.dates.map((date, index) => (
                    <Chip
                      key={index}
                      label={`${dayjs(date.leaveDate).format("DD MMM")} (${date.sessionType})`}
                      size="small"
                      color={date.holiday ? "warning" : date.weeklyOff ? "info" : "default"}
                      variant="outlined"
                      className="text-gray-800 bg-gray-200"
                    />
                  ))}
                </div>
              </div>

              {/* Approval Details */}
              {selectedEntry.approvals.length > 0 && (
                <div className="bg-head rounded p-3">
                  <div className="text-[12px] text-gray-500 mb-2">Approvals</div>
                  {selectedEntry.approvals.map((approval, index) => (
                    <div key={index} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                      <div>
                        <div className="text-[12px] font-medium">{approval.approverName}</div>
                        <div className="text-[12px] text-gray-500">Level {approval.approvalLevel}</div>
                      </div>
                      <div className="text-right">
                        <Chip
                          label={approval.actionTaken}
                          size="small"
                          color={
                            approval.actionTaken === 'APPROVED' ? 'success' :
                              approval.actionTaken === 'REJECTED' ? 'error' : 'info'
                          }
                        />
                        {approval.actionComments && (
                          <div className="text-[12px] text-gray-500">{approval.actionComments}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-head rounded p-2">
                  <div className="text-[12px] text-gray-500">Pay Type</div>
                  <div className="text-[12px] font-medium">
                    {selectedEntry.payrollTreatment || "Standard"}
                  </div>
                </div>
                <div className="bg-head rounded p-2">
                  <div className="text-[12px] text-gray-500">HR Verified</div>
                  <div className="text-[12px] font-medium">
                    {selectedEntry.hrVerified ? "✅ Yes" : "❌ No"}
                    {selectedEntry.hrVerifiedBy && (
                      <div className="text-[12px] text-gray-500">by {selectedEntry.hrVerifiedBy}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              {selectedEntry.appliedReason && (
                <div className="bg-head rounded p-3">
                  <div className="text-[12px] text-gray-500">Reason</div>
                  <div className="text-[12px]">{selectedEntry.appliedReason}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}