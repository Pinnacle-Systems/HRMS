import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  NightsStay as NightIcon,
  WbSunny as DayIcon,
  Autorenew as RotationalIcon,
  AccessTime as FlexibleIcon,
  LightMode as MorningIcon,
  Bedtime as EveningIcon,
  CloseOutlined,
} from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useUI } from '../../../context/Snackbar';
import type { Shift, ShiftStats } from '../../../services/modules/shifts';
import { days, getShiftTypeClass, colorClasses } from './const';
import { shiftService } from '../../../services/modules/shifts';
import { GlobalPagination } from '../../../components/GlobalPagination';

// Form data interface
interface ShiftFormData {
  shiftName: string;
  shiftCode: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  shiftType: string;
  graceTime: number;
  breakTime: number;
  active: boolean;
  color: string;
  weeklyOff: string[];
  description: string;
  nightShift: boolean;
}

export const ShiftList = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftTypes, setShiftTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<ShiftStats>({
    totalShifts: 0,
    activeShifts: 0,
    nightShifts: 0,
    flexibleShifts: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ShiftFormData>({
    shiftName: '',
    shiftCode: '',
    startTime: dayjs('2000-01-01 09:00'),
    endTime: dayjs('2000-01-01 18:00'),
    shiftType: 'General',
    graceTime: 15,
    breakTime: 60,
    active: true,
    color: '#3b82f6',
    weeklyOff: ['MON'],
    description: '',
    nightShift: false
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  // const handleSortChange = (newSortBy: string, newSortOrder?: "ASC" | "DESC") => {
  //   setSortBy(newSortBy);
  //   setSortOrder(newSortOrder || "ASC");
  //   setPage(0);
  // };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  // Convert time string (e.g., "14:30:00") to Dayjs
  const timeStringToDayjs = (timeString?: string): Dayjs | null => {
    if (!timeString) return null;
    const [hours, minutes, seconds] = timeString.split(':');
    return dayjs(`2000-01-01 ${hours}:${minutes}:${seconds || '00'}`);
  };

  // Convert Dayjs to time string for API (e.g., "09:00:00")
  const dayjsToTimeString = (dateTime: Dayjs | null): string => {
    if (!dateTime) return '00:00:00';
    return dateTime.format('HH:mm:ss');
  };

  const getShiftTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'night':
        return <NightIcon className="!text-indigo-700 !w-4 !h-4" />;
      case 'flexible':
        return <FlexibleIcon className="!text-green-700 !w-4 !h-4" />;
      case 'rotational':
        return <RotationalIcon className="!text-orange-700 !w-4 !h-4" />;
      case 'morning':
        return <MorningIcon className="!text-yellow-700 !w-4 !h-4" />;
      case 'evening':
        return <EveningIcon className="!text-purple-700 !w-4 !h-4" />;
      default:
        return <DayIcon className="!text-blue-700 !w-4 !h-4" />;
    }
  };

  const fetchData = async () => {
    try {
      showSpinner();
      const params: any = {
        page: page,
        size: limit,
        sort: 'shiftName,asc'
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const [shiftsData, statsData, shiftType] = await Promise.all([
        shiftService.getShifts(params),
        shiftService.getShiftStats(),
        shiftService.getShiftTypes()
      ]);
      setShifts(shiftsData.content);
      setTotal(shiftsData.totalElements || 0);
      setStats(statsData);
      setShiftTypes(shiftType.data);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch data', 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [page, limit, searchTerm]);

  const handleSave = async () => {
    if (!formData.shiftName || !formData.shiftCode || !formData.startTime || !formData.endTime) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    // Prepare API data with string time format
    const apiData = {
      shiftName: formData.shiftName,
      shiftCode: formData.shiftCode,
      shiftType: formData.shiftType,
      startTime: dayjsToTimeString(formData.startTime), // Returns "09:00:00"
      endTime: dayjsToTimeString(formData.endTime),     // Returns "18:00:00"
      breakTime: formData.breakTime,
      graceTime: formData.graceTime,
      weeklyOff: formData.weeklyOff, // Already in correct format like ["MON", "TUE"]
      color: formData.color,
      description: formData.description,
      active: formData.active,
      nightShift: formData.shiftType.toLowerCase() === 'night'
    };

    try {
      showSpinner();
      if (editingShift) {
        await shiftService.updateShift(editingShift.id, apiData);
        showSnackbar('Shift updated successfully!', 'success');
      } else {
        await shiftService.createShift(apiData);
        showSnackbar('Shift created successfully!', 'success');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('API Error:', error);
      showSnackbar(error.message || 'Failed to save shift', 'error');
    } finally {
      hideSpinner();
    }
  };

  const resetForm = () => {
    setEditingShift(null);
    setFormData({
      shiftName: '',
      shiftCode: '',
      startTime: dayjs('2000-01-01 09:00'),
      endTime: dayjs('2000-01-01 18:00'),
      shiftType: 'General',
      graceTime: 15,
      breakTime: 60,
      active: true,
      color: '#3b82f6',
      weeklyOff: ['MON'],
      description: '',
      nightShift: false
    });
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      shiftName: shift.shiftName,
      shiftCode: shift.shiftCode,
      startTime: timeStringToDayjs(shift.startTime),
      endTime: timeStringToDayjs(shift.endTime),
      shiftType: shift.shiftType,
      graceTime: shift.graceTime,
      breakTime: shift.breakTime,
      active: shift.active,
      color: shift.color,
      weeklyOff: shift.weeklyOff,
      description: shift.description || '',
      nightShift: shift.nightShift
    });
    setIsDialogOpen(true);
  };

  const filteredShifts = shifts.filter(shift =>
    shift.shiftName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.shiftCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsCards = [
    { label: 'Total Shifts', value: stats.totalShifts, icon: <TimeIcon />, color: 'red' },
    { label: 'Active Shifts', value: stats.activeShifts, icon: <DayIcon />, color: 'green' },
    { label: 'Night Shifts', value: stats.nightShifts, icon: <NightIcon />, color: 'blue' },
    { label: 'Flexible', value: stats.flexibleShifts, icon: <TimeIcon />, color: 'yellow' },
  ];

  // Format time string to 12-hour format
  const formatTimeTo12Hour = (timeString?: string): string => {
    if (!timeString) return '--:--';

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '--:--';

      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return '--:--';
    }
  };

  const handleToggleStatus = async (shift: Shift) => {
    showSpinner();
    try {
      const res: any = await shiftService.updateShiftStatus(shift.id, { isActive: !shift.active });
      if (res.success) {
        showSnackbar(`Shift ${!shift.active ? "activated" : "deactivated"} successfully!`, "success");
        await fetchData();
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "600px",
      maxWidth: "600px",
    },
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-[12px]">
        {statsCards.map((stat, index) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses];

          return (
            <div
              key={index}
              className={`bg-white rounded-lg px-4 py-2 shadow-sm border-l-4 ${colors.border}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className={`font-bold text-xl ${colors.text}`}>
                    {stat.value}
                  </div>

                  <div className="text-gray-500 text-[12px]">
                    {stat.label}
                  </div>
                </div>

                <div className={colors.icon}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <TextField
          placeholder="Search by name or code..."
          size="small"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-80"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="!bg-primary whitespace-nowrap"
        >
          Create Shift
        </Button>
      </div>

      {/* Shifts Table */}
      <TableContainer className='h-[calc(100vh-372px)] bg-white-50'>
        <Table className='border'>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className='!font-semibold'>S No</TableCell>
              <TableCell className='!font-semibold'>Shift Name</TableCell>
              <TableCell className='!font-semibold'>Code</TableCell>
              <TableCell className='!font-semibold'>Timing</TableCell>
              <TableCell className='!font-semibold'>Break</TableCell>
              <TableCell className='!font-semibold'>Hours</TableCell>
              <TableCell className='!font-semibold'>Grace</TableCell>
              <TableCell className='!font-semibold'>Type</TableCell>
              <TableCell className='!font-semibold'>Weekly Off</TableCell>
              <TableCell className='!font-semibold'>Status</TableCell>
              <TableCell className='!font-semibold'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredShifts.map((shift, index) => (
              <TableRow key={shift.id} className="hover:bg-gray-50">
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: shift.color }}
                    />
                    <span>{shift.shiftName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {/* <Chip label={shift.shiftCode} size="small" className="!font-mono" /> */}
                  <span className="!font-mono">{shift.shiftCode}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TimeIcon fontSize="small" className="text-gray-400" />
                    <span>
                      {formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{shift.breakTime} min</TableCell>
                <TableCell>{shift.totalHours}h</TableCell>
                <TableCell>{shift.graceTime} min</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={shift.shiftType}
                    icon={getShiftTypeIcon(shift.shiftType)}
                    className={getShiftTypeClass(shift.shiftType)}
                  />
                </TableCell>
                <TableCell>{shift.weeklyOff?.join(', ') || 'None'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={shift.active ? 'Active' : 'Inactive'}
                    color={shift.active ? 'success' : 'error'}
                    onClick={() => handleToggleStatus(shift)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(shift)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => {
                      showConfirmDialog({
                        title: 'Delete Shift',
                        message: `Are you sure you want to delete "${shift.shiftName}"?`,
                        confirmText: 'Delete',
                        onConfirm: async () => {
                          try {
                            showSpinner();
                            await shiftService.deleteShift(shift.id);
                            showSnackbar('Shift deleted successfully!', 'success');
                            fetchData();
                          } catch (error: any) {
                            showSnackbar(error.message || 'Failed to delete shift', 'error');
                          } finally {
                            hideSpinner();
                          }
                        }
                      });
                    }} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredShifts.length === 0 && (
          <div className="bg-white border border-gray-200 border-t-0 text-gray-900 text-center py-8 text-gray-500"> No shifts available!</div>
        )}
      </TableContainer>

      {/* Global Pagination */}
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

      {/* Create/Edit Shift Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" sx={commonsx}>
        <div className="flex items-center p-2 justify-between border-b border-gray-300">
          <div className="text-primary ml-4">
            {editingShift ? 'Edit Shift' : 'Create New Shift'}
          </div>
          <IconButton onClick={() => setIsDialogOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-6 pt-4">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Shift Name"
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Shift Code"
                  value={formData.shiftCode}
                  onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })}
                  required
                />
              </Grid>
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(value) => setFormData({ ...formData, startTime: value })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(value) => setFormData({ ...formData, endTime: value })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Grace Time (minutes)"
                  value={formData.graceTime}
                  onChange={(e) => setFormData({ ...formData, graceTime: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Break Time (minutes)"
                  value={formData.breakTime}
                  onChange={(e) => setFormData({ ...formData, breakTime: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Weekly Off</InputLabel>
                  <Select
                    multiple
                    value={formData.weeklyOff}
                    className='!text-[12px]'
                    label="Weekly Off"
                    onChange={(e) => setFormData({ ...formData, weeklyOff: e.target.value as string[] })}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                  >
                    {days.map(day => (
                      <MenuItem key={day} value={day} className='!text-[12px]'>{day}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="color"
                  label="Shift Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={formData.shiftType}
                    label="Shift Type"
                    className='!text-[12px]'
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        shiftType: newType,
                        nightShift: newType.toLowerCase() === 'night'
                      });
                    }}
                  >
                    {shiftTypes.map((type) => (
                      <MenuItem key={type} value={type} className='!text-[12px]'>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-300'>
          <Button variant='outlined' className='!border-gray-300 !text-gray-800' onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingShift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};