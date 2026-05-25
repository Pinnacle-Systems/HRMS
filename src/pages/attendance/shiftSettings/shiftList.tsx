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
import dayjs from 'dayjs';
import { useUI } from '../../../context/Snackbar';
import type { Shift, ShiftStats } from './types';
import { days, getShiftTypeClass, shiftTypes } from './const';

// Mock API service
const shiftApi = {
  getShifts: async () => {
    // Replace with actual API call
    return {
      data: [
        {
          id: "001",
          shiftName: "General SHIFT",
          shiftCode: "GEN-001",
          startTime: "10:00",
          endTime: "18:00",
          graceTime: 15,
          breakTime: 45,
          shiftType: 'Night',
          isActive: true,
          color: "#23e1de",
          weeklyOff: ["Sunday", "Thursday", "Tuesday"],
          description: "EFT",
          totalHours: 8
        },
        {
          id: "002",
          shiftName: "General SHIFT",
          shiftCode: "GEN-001",
          startTime: "10:00",
          endTime: "18:00",
          graceTime: 15,
          breakTime: 45,
          shiftType: 'General',
          isActive: true,
          color: "#98e123",
          weeklyOff: ["Sunday", "Thursday", "Tuesday"],
          description: "EFT",
          totalHours: 8
        },
        {
          id: "003",
          shiftName: "General SHIFT",
          shiftCode: "GEN-001",
          startTime: "10:00",
          endTime: "18:00",
          graceTime: 15,
          breakTime: 45,
          shiftType: 'Flexible',
          isActive: true,
          color: "#e12923",
          weeklyOff: ["Sunday", "Thursday", "Tuesday"],
          description: "EFT",
          totalHours: 8
        },
        {
          id: "004",
          shiftName: "General SHIFT",
          shiftCode: "GEN-001",
          startTime: "10:00",
          endTime: "18:00",
          graceTime: 15,
          breakTime: 45,
          shiftType: 'Rotational',
          isActive: true,
          color: "#9b23e1",
          weeklyOff: ["Sunday", "Thursday", "Tuesday"],
          description: "EFT",
          totalHours: 8
        }
      ]
    };
  },
  getStats: async () => {
    // Replace with actual API call
    return { data: { totalShifts: 0, activeShifts: 0, nightShifts: 0, flexibleShifts: 0 } };
  },
  createShift: async (data: any) => {
    return { data: { id: Date.now().toString(), ...data } };
  },
  updateShift: async (id: string, data: any) => {
    return { data: { id, ...data } };
  },
  deleteShift: async (id: string) => {
    return { data: {id} };
  }
};

export const ShiftList = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState<ShiftStats>({
    totalShifts: 0,
    activeShifts: 0,
    nightShifts: 0,
    flexibleShifts: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Shift>>({
    shiftName: '',
    shiftCode: '',
    startTime: '09:00',
    endTime: '18:00',
    shiftType: 'General',
    graceTime: 15,
    breakTime: 60,
    isActive: true,
    color: '#3b82f6',
    weeklyOff: ['Sunday'],
    description: ''
  });

  const getShiftTypeIcon = (type: string) => {
    switch (type) {
      case 'Night':
        return <NightIcon className="!text-indigo-700 !w-4 !h-4" />;

      case 'Flexible':
        return <FlexibleIcon className="!text-green-700 !w-4 !h-4" />;

      case 'Rotational':
        return <RotationalIcon className="!text-orange-700 !w-4 !h-4" />;

      case 'Morning':
        return <MorningIcon className="!text-yellow-700 !w-4 !h-4" />;

      case 'Evening':
        return <EveningIcon className="!text-purple-700 !w-4 !h-4" />;

      default:
        return <DayIcon className="!text-blue-700 !w-4 !h-4" />;
    }
  };

  const fetchData = async () => {
    try {
      showSpinner();
      const [shiftsRes, statsRes] = await Promise.all([
        shiftApi.getShifts(),
        shiftApi.getStats()
      ]);
      setShifts(shiftsRes.data);
      setStats(statsRes.data);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.shiftName || !formData.shiftCode || !formData.startTime || !formData.endTime) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    const start = dayjs(`2000-01-01 ${formData.startTime}`);
    const end = dayjs(`2000-01-01 ${formData.endTime}`);
    let hours = end.diff(start, 'hour', true);
    if (hours < 0) hours += 24;
    formData.totalHours = parseFloat(hours.toFixed(2));
    console.log(formData);
    // try {
    //   showSpinner();
    //   if (editingShift) {
    //     await shiftApi.updateShift(editingShift.id, formData);
    //     showSnackbar('Shift updated successfully!', 'success');
    //   } else {
    //     await shiftApi.createShift(formData);
    //     showSnackbar('Shift created successfully!', 'success');
    //   }
    //   setIsDialogOpen(false);
    //   setEditingShift(null);
    //   setFormData({
    //     shiftName: '',
    //     shiftCode: '',
    //     startTime: '09:00',
    //     endTime: '18:00',
    //     graceTime: 15,
    //     breakTime: 60,
    //     isNightShift: false,
    //     isActive: true,
    //     color: '#3b82f6',
    //     weeklyOff: ['Sunday'],
    //     description: ''
    //   });
    //   fetchData();
    // } catch (error: any) {
    //   showSnackbar(error.message, 'error');
    // } finally {
    //   hideSpinner();
    // }
  };

  const filteredShifts = shifts.filter(shift =>
    shift.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.shiftCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log(filteredShifts);

  const statsCards = [
    { label: 'Total Shifts', value: stats.totalShifts, icon: <TimeIcon />, color: 'red' },
    { label: 'Active Shifts', value: stats.activeShifts, icon: <DayIcon />, color: 'green' },
    { label: 'Night Shifts', value: stats.nightShifts, icon: <NightIcon />, color: 'indigo' },
    { label: 'Flexible', value: stats.flexibleShifts, icon: <TimeIcon />, color: 'yellow' },
  ];

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className={`border-l-4 border-${stat.color}-500 bg-white`}>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-800">
                    {stat.value}
                  </div>
                  <div className="text-gray-500">
                    {stat.label}
                  </div>
                </div>
                <div className={`text-${stat.color}-500`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <TextField
          placeholder="Search by name or code..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // InputProps={{
          //   startAdornment: (
          //     <InputAdornment position="start">
          //       <SearchIcon />
          //     </InputAdornment>
          //   ),
          // }}
          className="w-80"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingShift(null);
            setFormData({
              shiftName: '',
              shiftCode: '',
              startTime: '09:00',
              endTime: '18:00',
              graceTime: 15,
              breakTime: 60,
              // isNightShift: false,
              isActive: true,
              color: '#3b82f6',
              weeklyOff: ['Sunday'],
              description: ''
            });
            setIsDialogOpen(true);
          }}
          className="!bg-primary whitespace-nowrap"
        >
          Create Shift
        </Button>
      </div>

      {/* Shifts Table */}
      <TableContainer component={Paper}>
        <Table>
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
            {filteredShifts.length > 0 &&
              filteredShifts.map((shift, index) => (
                <TableRow key={shift.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <div className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: shift.color }}
                      />
                      <span>{shift.shiftName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={shift.shiftCode} size="small" className="!font-mono" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TimeIcon fontSize="small" className="text-gray-400" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>{shift.breakTime} min</TableCell>
                  <TableCell>{shift.totalHours}h</TableCell>
                  <TableCell>{shift.graceTime} min</TableCell>
                  <TableCell>
                    {/* <Chip
                      size="small"
                      icon={shift.isNightShift ? <NightIcon /> : <DayIcon />}
                      label={shift.isNightShift ? 'Night' : 'Day'}
                      className={shift.isNightShift ? '!bg-indigo-100 !text-indigo-700' : '!bg-blue-100 !text-blue-700'}
                    /> */}
                    <Chip
                      size="small"
                      label={shift.shiftType}
                      icon={getShiftTypeIcon(shift.shiftType)}
                      className={getShiftTypeClass(shift.shiftType)}
                    />
                  </TableCell>
                  <TableCell>{shift.weeklyOff?.join(', ')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={shift.isActive ? 'Active' : 'Inactive'}
                      color={shift.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => {
                        setEditingShift(shift);
                        setFormData(shift);
                        setIsDialogOpen(true);
                      }} color="primary">
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
                              await shiftApi.deleteShift(shift.id);
                              showSnackbar('Shift deleted successfully!', 'success');
                              fetchData();
                            } catch (error: any) {
                              showSnackbar(error.message, 'error');
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
      </TableContainer>

      {
        filteredShifts.length == 0 &&
        <div className='text-center border border-gray-200 text-gray-500 p-5'>
          No shifts available !
        </div>
      }

      {/* Create/Edit Shift Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <div className="flex items-center p-2 justify-between border-b border-gray-300">
          <div className="text-primary ml-4">
            {editingShift ? 'Edit Shift' : 'Create New Shift'}
          </div>
          <IconButton>
            <CloseOutlined onClick={() => setIsDialogOpen(false)} />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-6">
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
                    value={dayjs(`2000-01-01 ${formData.startTime}`)}
                    onChange={(value) => setFormData({ ...formData, startTime: value?.format('HH:mm') || '09:00' })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TimePicker
                    label="End Time"
                    value={dayjs(`2000-01-01 ${formData.endTime}`)}
                    onChange={(value) => setFormData({ ...formData, endTime: value?.format('HH:mm') || '18:00' })}
                    slotProps={{ textField: { fullWidth: true } }}
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
                  onChange={(e) => setFormData({ ...formData, graceTime: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Break Time (minutes)"
                  value={formData.breakTime}
                  onChange={(e) => setFormData({ ...formData, breakTime: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Weekly Off</InputLabel>
                  <Select
                    multiple
                    value={formData.weeklyOff || []}
                    className='!text-[12px]'
                    label="Weekly Off"
                    onChange={(e) => setFormData({ ...formData, weeklyOff: e.target.value as string[] })}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                  >
                    {days.map(day => (
                      <MenuItem key={day} value={day} className="!text-[12px]">{day}</MenuItem>
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
                {/* <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isNightShift}
                      onChange={(e) => setFormData({ ...formData, isNightShift: e.target.checked })}
                    />
                  }
                  label="Night Shift"
                /> */}
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={formData.shiftType || 'General'}
                    label="Shift Type"
                    className='!text-[12px]'
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shiftType: e.target.value,
                        // isNightShift: e.target.value === 'Night'
                      })
                    }
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
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-300'>
          <Button variant='outlined' className='!border-gray-300 !text-gray-800' onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingShift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};