import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Today as TodayIcon,
  ViewWeek as WeekIcon,
  ViewModule as MonthIcon,
  FilterList as FilterIcon,
  SwapHoriz as SwapIcon,
  Notifications as NotificationIcon,
  PictureAsPdf as PdfIcon,
  GetApp as ExcelIcon,
  // AccessTime as TimeIcon,
  // CheckCircle as CheckIcon,
  // Cancel as CancelIcon,
  // EventBusy as AbsentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useUI } from '../../../context/Snackbar';
import { shiftService } from '../../../services/modules/shifts';
import type {
  Shift,
  ShiftSchedule,
  SwapRequest,
  ScheduleStats,
  ShiftDistribution,
  // SwapRequestStatus,
} from '../../../services/modules/shifts';
import { departmentService } from '../../../services/modules/department';
import { branchService } from '../../../services/modules/branch';
import type { Branch } from '../../settings/general/type';
import type { Department } from '../../employees/type';
import { formatTimeTo12Hour, statusColors } from './const';
import { getRowColor } from '../../const';

export const ShiftScheduleView = () => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // State for UI
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [department, setDepartment] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [shift, setShift] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [branch, setBranch] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const [status, setStatus] = useState('all');

  // Data states
  const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [stats, setStats] = useState<ScheduleStats>({
    totalScheduled: 0,
    completed: 0,
    inProgress: 0,
    weeklyOff: 0,
    unassigned: 0,
    byStatus: {}
  });

  const [shiftDistribution, setShiftDistribution] = useState<ShiftDistribution[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<ShiftSchedule[]>([]);

  // Dialog states
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  // const [selectedSwapRequest, setSelectedSwapRequest] = useState<SwapRequest | null>(null);
  const [swapActionLoading, setSwapActionLoading] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Fetch all data
  const fetchAllData = async () => {
    showSpinner();
    try {
      await Promise.all([
        fetchSchedule(),
        fetchSwapRequests(),
        fetchScheduleStats(),
        fetchShiftDistribution(),
        fetchUpcomingShifts(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Failed to load schedule data', 'error');
    } finally {
      hideSpinner();
    }
  };

  const fetchMasterData = async () => {
    try {
      const deptRes: any = await departmentService.getDepartments();
      const departmentsData = deptRes.data?.content || deptRes.data || [];
      setDepartment(departmentsData);

      const branchRes: any = await branchService.getDropdownBranches();
      const branchesData = branchRes.data?.content || branchRes.data || [];
      setBranch(branchesData);

      const shiftRes: any = await shiftService.getShiftDropdown();
      const shiftData = shiftRes.data?.content || shiftRes.data || [];
      setShift(shiftData);

    } catch (error: any) {
      showSnackbar(error.message, 'error');
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Fetch schedule based on filters
  const fetchSchedule = async () => {
    try {
      const params: any = {
        view,
        date: selectedDate.format('YYYY-MM-DD'),
      };
      if (selectedDepartment !== 'all') params.departmentId = selectedDepartment;
      if (selectedShift !== 'all') params.shiftId = selectedShift;
      if (selectedBranch !== 'all') params.branchId = selectedBranch;
      if (status !== 'all') params.status = status;

      const response = await shiftService.getSchedule(params);
      setSchedule(response.data || []);
    } catch (error) {
      showSnackbar('Failed to fetch schedule', 'error');
    }
  };

  // Fetch swap requests
  const fetchSwapRequests = async () => {
    try {
      const response = await shiftService.getSwapRequests({ status: 'PENDING' });
      setSwapRequests(response.content || []);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    }
  };

  // Fetch schedule statistics
  const fetchScheduleStats = async () => {
    try {
      const params = {
        date: selectedDate.format('YYYY-MM-DD'),
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      };
      const response = await shiftService.getScheduleStats(params);
      setStats(response.data || {
        scheduled: 0,
        completed: 0,
        absent: 0,
        onLeave: 0,
        late: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch shift distribution
  const fetchShiftDistribution = async () => {
    try {
      const params = {
        date: selectedDate.format('YYYY-MM-DD'),
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        from: selectedDate.format('YYYY-MM-DD'),
        to: selectedDate.format('YYYY-MM-DD')
      };
      const response = await shiftService.getShiftDistribution(params);
      setShiftDistribution(Array.isArray(response.data.buckets) ? response.data.buckets : []);
    } catch (error) {
      console.error('Error fetching shift distribution:', error);
    }
  };

  // Fetch upcoming shifts
  const fetchUpcomingShifts = async () => {
    try {
      const params = {
        limit: 5,
        date: selectedDate.format('YYYY-MM-DD'),
      };
      const response = await shiftService.getUpcomingShifts(params);
      setUpcomingShifts(response.data || []);
    } catch (error) {
      console.error('Error fetching upcoming shifts:', error);
    }
  };

  // Handle swap request status update
  const handleUpdateSwapRequestStatus = async (id: string, status: "APPROVED" | "REJECTED" | "CANCELLED",) => {
    setSwapActionLoading(true);
    try {
      await shiftService.updateSwapRequestStatus(id, { status });
      showSnackbar(`Swap request ${status} successfully`, 'success');
      setSwapDialogOpen(false);
      await fetchSwapRequests();
    } catch (error) {
      console.error('Error updating swap request:', error);
      showSnackbar('Failed to update swap request', 'error');
    } finally {
      setSwapActionLoading(false);
    }
  };

  // Handle create swap request
  // const handleCreateSwapRequest = async (data: any) => {
  //   try {
  //     await shiftService.createSwapRequest(data);
  //     showSnackbar('Swap request created successfully', 'success');
  //     await fetchSwapRequests();
  //   } catch (error) {
  //     console.error('Error creating swap request:', error);
  //     showSnackbar('Failed to create swap request', 'error');
  //   }
  // };

  // Handle send notifications
  const handleSendNotifications = async () => {
    setSendingNotification(true);
    try {
      const params = {
        date: selectedDate.format('YYYY-MM-DD'),
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        message: notificationMessage || 'Shift reminder for today',
      };
      await shiftService.sendShiftNotifications(params);
      showSnackbar('Notifications sent successfully', 'success');
      setNotificationDialogOpen(false);
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending notifications:', error);
      showSnackbar('Failed to send notifications', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  // Handle export to PDF
  const handleExportPDF = async () => {
    try {
      const params = {
        view,
        date: selectedDate.format("YYYY-MM-DD"),
        department: selectedDepartment !== "all" ? selectedDepartment : undefined,
        branch: selectedBranch !== "all" ? selectedBranch : undefined,
      };
      await shiftService.exportScheduleToPDF(params);
      showSnackbar("PDF exported successfully", "success",);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to export PDF", "error",);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    try {
      const params = {
        view,
        date: selectedDate.format("YYYY-MM-DD"),
        department: selectedDepartment !== "all" ? selectedDepartment : undefined,
        branch: selectedBranch !== "all" ? selectedBranch : undefined,
      };
      await shiftService.exportScheduleToExcel(params);
      showSnackbar("Excel exported successfully", "success",);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to export Excel", "error",);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    await Promise.all([
      fetchSchedule(),
      fetchScheduleStats(),
      fetchShiftDistribution(),
      fetchUpcomingShifts(),
    ]);
  };

  // Handle date change
  const handleDateChange = (date: any) => {
    if (date) {
      setSelectedDate(dayjs(date));
    }
  };

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchAllData();
  }, [selectedDate, view]);

  // Apply filters when filter values change
  useEffect(() => {
    // if (!loading) {
    applyFilters();
    // }
  }, [selectedDepartment, selectedShift, selectedBranch, status]);

  return (
    <div className='p-4 bg-gray-50'>
      {/* Filters */}
      <div className="mb-3 bg-white border border-gray-200 p-3 pt-1">
        <div className='flex flex-wrap mb-1'>
          <Button startIcon={<FilterIcon />}>Apply Filters</Button>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              key="all"
              label="All"
              clickable
              color="default"
              onClick={() => setStatus("all")}
              className={`!rounded-xl !font-medium !h-[25px] ${status == 'all' ? '!shadow-md !bg-primary !text-white' : 'bg-gray-50 text-gray-800'}`}
            />
            {Object.entries(stats.byStatus ?? {}).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key} (${value})`}
                clickable
                color={status === key ? 'primary' : 'default'}
                onClick={() => setStatus(key)}
                className={`!rounded-xl !font-medium !h-[25px] ${status === key ? '!shadow-md !bg-primary !text-white' : 'bg-gray-50 text-gray-800'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="grid grid-cols-4 gap-3 items-center">
            {/* Department */}
            <FormControl size="small" className="min-w-[100px]">
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                displayEmpty
                className="!rounded-sm"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {department.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Shift */}
            <FormControl size="small" className="min-w-[100px]">
              <Select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                displayEmpty
                className="!rounded-sm !text-[12px]"
              >
                <MenuItem value="all">All Shifts</MenuItem>
                {shift.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.shiftName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Branch */}
            <FormControl size="small" className="min-w-[100px]">
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                displayEmpty
                className="!rounded-sm  !text-[12px]"
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branch.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="flex items-center gap-4">
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, val) => val && setView(val)}
              size="small"
            >
              <ToggleButton value="daily" className='!capitalize !text-gray-800'>
                <TodayIcon className="mr-1 !w-3" /> Daily
              </ToggleButton>
              <ToggleButton value="weekly" className='!capitalize !text-gray-800'>
                <WeekIcon className="mr-1 !w-3" /> Weekly
              </ToggleButton>
              <ToggleButton value="monthly" className='!capitalize !text-gray-800'>
                <MonthIcon className="mr-1 !w-3" /> Monthly
              </ToggleButton>
            </ToggleButtonGroup>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={view === 'daily' ? 'Today' : view === 'weekly' ? 'Week of' : 'Month'}
                value={selectedDate}
                onChange={handleDateChange}
                slotProps={{ textField: { size: 'small', className: '' } }}
                sx={{
                    "& .MuiIconButton-root": {
                      color: "dodgerblue",
                    },
                  }}
              />
            </LocalizationProvider>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <TableContainer className='rounded-sm !max-h-[calc(100vh-320px)] overflow-auto' >
            <Table stickyHeader className='border border-gray-200 '>
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="text-gray-500 text-center py-8">
                        No Data Available
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  schedule.map((item, index) => (
                    <TableRow key={item.id || `${item.employeeId}-${index}`} className="hover:bg-gray-50" sx={getRowColor(index)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="!w-8 !h-8 !bg-primary">
                            {item.employeeName?.charAt(0) || '?'}
                          </Avatar>
                          <span className="font-medium">{item.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatTimeTo12Hour(item.startTime)}  - {formatTimeTo12Hour(item.endTime)}</TableCell>
                      <TableCell>
                        <Chip label={item.shiftCode} size="small" className="!font-mono"
                          sx={{
                            backgroundColor: item.color ? `${item.color}20` : "#e5e7eb",
                            color: `${item.color}` || "#e5e7eb"
                          }} />

                      </TableCell>
                      <TableCell>{item.department || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span style={{ color: statusColors[item.status as keyof typeof statusColors] }}>
                            {item.status}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className='bg-white border border-gray-200 rounded-sm' >
            <div className='!p-3'>
              <div className="font-semibold text-primary mb-2">
                UPCOMING TODAY
              </div>
              <div className="space-y-3 overflow-auto h-[calc(100vh-670px)]">
                {upcomingShifts.length === 0 ? (
                  <Typography variant="body2" className="text-gray-500 text-center py-4">
                    No upcoming shifts
                  </Typography>
                ) : (
                  upcomingShifts.map((item, index) => (
                    <div key={item.id || `${item.employeeId}-${index}`} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">
                          {item.employeeName}
                        </div>
                        <Typography variant="caption" className="text-gray-500">
                          ( {item.startTime}  - {item.endTime}) • {item.shiftCode}
                        </Typography>
                      </div>
                      <Chip
                        size="small"
                        label={item.status}
                        style={{
                          backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}20`,
                          color: statusColors[item.status as keyof typeof statusColors],
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-sm' >
            <div className='!p-3'>
              <div className="font-semibold text-primary mb-2">
                QUICK ACTIONS
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outlined"
                  startIcon={<SwapIcon />}
                  onClick={() => setSwapDialogOpen(true)}
                  className="!normal-case"
                >
                  Swap Requests{' '}
                  {swapRequests.length > 0 && (
                    <Badge badgeContent={swapRequests.length} color="error" className="ml-2" />
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NotificationIcon />}
                  onClick={() => setNotificationDialogOpen(true)}
                  className="!normal-case"
                >
                  Notifications
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={handleExportPDF}
                  className="!normal-case"
                >
                  Export PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={handleExportExcel}
                  className="!normal-case"
                >
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-sm' >
            <div className='!p-3'>
              <div className="font-semibold text-primary mb-2">
                DISTRIBUTION
              </div>
              <div className="space-y-2">
                {shiftDistribution.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No data available
                  </div>
                ) : (
                  shiftDistribution.map((shift) => (
                    <div key={shift.shiftCode}
                      className="flex items-center justify-between rounded-xl border p-2" style={{ borderColor: shift.color }}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: shift.color }} />
                        <div>
                          <div className="text-sm text-gray-800 font-mono">{shift.shiftCode}</div>
                          <div className="text-xs text-gray-500">{shift.shiftName}</div>
                        </div>
                      </div>
                      <Chip
                        label={`${shift.employeeCount} emp`}
                        size="small"
                        sx={{
                          backgroundColor: `${shift.color}20`,
                          color: shift.color,
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Requests Dialog */}
      <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Swap Requests</DialogTitle>
        <DialogContent>
          {swapRequests.length === 0 ? (
            <Typography className="text-center py-4 text-gray-500">
              No pending swap requests
            </Typography>
          ) : (
            <div className="space-y-3 mt-2">
              {swapRequests.map((request, index) => (
                <Paper key={request.id || index} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography variant="subtitle2" className="font-semibold">
                        {request.requesterEmployeeName}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        From: {request.requesterShiftCode} → To: {request.targetShiftCode}
                      </Typography>
                      <Typography variant="caption" className="text-gray-400">
                        Date: {dayjs(request.requesterDate).format('MMM DD, YYYY')}
                      </Typography>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleUpdateSwapRequestStatus(request.id, 'APPROVED')}
                        disabled={swapActionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleUpdateSwapRequestStatus(request.id, 'REJECTED')}
                        disabled={swapActionLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Paper>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwapDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Shift Notifications</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Custom Message (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Reminder: Your shift starts at 9:00 AM today..."
          />
          <Typography variant="caption" className="text-gray-500 mt-2 block">
            Notifications will be sent to all employees based on the current filters
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotifications}
            variant="contained"
            disabled={sendingNotification}
          >
            {sendingNotification ? 'Sending...' : 'Send Notifications'}
          </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
};