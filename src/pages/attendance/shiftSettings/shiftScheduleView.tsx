import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
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
  InputLabel,
  TextField,
  InputAdornment
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
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  EventBusy as AbsentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useUI } from '../../../context/Snackbar';

const mockSchedule = [
  { id: 1, name: 'Ravi Patel', time: '22:00', shift: 'NGT-01', status: 'Scheduled' },
  { id: 2, name: 'Arjun Mehta', time: '08:00', shift: 'ROT-A', status: 'Scheduled' },
  { id: 3, name: 'Sneha Gupta', time: '06:00', shift: 'MRN-01', status: 'Scheduled' },
  { id: 4, name: 'Priya Sharma', time: '09:00', shift: 'GEN-01', status: 'Completed' },
  { id: 5, name: 'Kavita Singh', time: '09:00', shift: 'GEN-01', status: 'Absent' },
  { id: 6, name: 'Neha Joshi', time: '09:00', shift: 'GEN-01', status: 'On Leave' },
  { id: 7, name: 'Sanjay Kumar', time: '10:00', shift: 'FLX-01', status: 'Late' },
];

const statusColors = {
  Scheduled: '#3b82f6',
  Completed: '#10b981',
  Absent: '#ef4444',
  'On Leave': '#f59e0b',
  Late: '#f97316'
};

export const ShiftScheduleView = () => {
  const { showSnackbar } = useUI();
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [department, setDepartment] = useState('all');
  const [shift, setShift] = useState('all');
  const [branch, setBranch] = useState('all');
  const [status, setStatus] = useState('all');

  const stats = {
    scheduled: 7,
    completed: 5,
    absent: 1,
    onLeave: 2
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    showSnackbar(`Exporting as ${type.toUpperCase()}...`, 'success');
  };

  const handleSwapRequest = () => {
    showSnackbar('Swap request sent!', 'info');
  };

  const handleNotification = () => {
    showSnackbar('Notifications sent!', 'success');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckIcon className="text-green-500" />;
      case 'Absent': return <CancelIcon className="text-red-500" />;
      case 'On Leave': return <AbsentIcon className="text-orange-500" />;
      default: return <TimeIcon className="text-blue-500" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Typography variant="h6" className="font-semibold text-gray-800 mb-1">
          Shift Schedule
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Monitor employee schedules and attendance integration
        </Typography>
      </div>

      {/* Date and View Controls */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={view === 'daily' ? 'Today' : view === 'weekly' ? 'Week of' : 'Month'}
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date || dayjs())}
                  slotProps={{ textField: { size: 'small', className: 'w-48' } }}
                />
              </LocalizationProvider>
              
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(_, val) => val && setView(val)}
                size="small"
              >
                <ToggleButton value="daily"><TodayIcon className="mr-1" /> Daily</ToggleButton>
                <ToggleButton value="weekly"><WeekIcon className="mr-1" /> Weekly</ToggleButton>
                <ToggleButton value="monthly"><MonthIcon className="mr-1" /> Monthly</ToggleButton>
              </ToggleButtonGroup>
            </div>

            <Button variant="outlined" startIcon={<FilterIcon />} size="small">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="text-center">
            <Typography variant="h3" className="font-bold text-blue-600">{stats.scheduled}</Typography>
            <Typography variant="body2" className="text-gray-600">Scheduled</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <Typography variant="h3" className="font-bold text-green-600">{stats.completed}</Typography>
            <Typography variant="body2" className="text-gray-600">Completed</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <Typography variant="h3" className="font-bold text-red-600">{stats.absent}</Typography>
            <Typography variant="body2" className="text-gray-600">Absent</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <Typography variant="h3" className="font-bold text-orange-600">{stats.onLeave}</Typography>
            <Typography variant="body2" className="text-gray-600">On Leave</Typography>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <FormControl size="small" className="w-40">
          <InputLabel>Department</InputLabel>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="Department">
            <MenuItem value="all">All Departments</MenuItem>
            <MenuItem value="engineering">Engineering</MenuItem>
            <MenuItem value="hr">HR</MenuItem>
            <MenuItem value="qa">QA</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" className="w-32">
          <InputLabel>Shift</InputLabel>
          <Select value={shift} onChange={(e) => setShift(e.target.value)} label="Shift">
            <MenuItem value="all">All Shifts</MenuItem>
            <MenuItem value="GEN-01">GEN-01</MenuItem>
            <MenuItem value="MRN-01">MRN-01</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" className="w-40">
          <InputLabel>Branch</InputLabel>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)} label="Branch">
            <MenuItem value="all">All Branches</MenuItem>
            <MenuItem value="main">Main Branch</MenuItem>
            <MenuItem value="east">East Branch</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" className="w-40">
          <InputLabel>Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="leave">On Leave</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Schedule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableContainer component={Paper}>
            <Table>
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSchedule.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="!w-8 !h-8 !bg-primary">
                          {item.name.charAt(0)}
                        </Avatar>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>
                      <Chip label={item.shift} size="small" className="!font-mono" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <span style={{ color: statusColors[item.status as keyof typeof statusColors] }}>
                          {item.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">UPCOMING TODAY</Typography>
              <div className="space-y-3">
                {mockSchedule.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <Typography variant="body2" className="font-medium">{item.name}</Typography>
                      <Typography variant="caption" className="text-gray-500">{item.time} • {item.shift}</Typography>
                    </div>
                    <Chip size="small" label={item.status} style={{ backgroundColor: `${statusColors[item.status as keyof typeof statusColors]}20`, color: statusColors[item.status as keyof typeof statusColors] }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">QUICK ACTIONS</Typography>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outlined" startIcon={<SwapIcon />} onClick={handleSwapRequest} className="!normal-case">
                  Swap Requests <Badge badgeContent={3} color="error" className="ml-2" />
                </Button>
                <Button variant="outlined" startIcon={<NotificationIcon />} onClick={handleNotification} className="!normal-case">
                  Notifications <Badge badgeContent={5} color="error" className="ml-2" />
                </Button>
                <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')} className="!normal-case">
                  Export PDF
                </Button>
                <Button variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')} className="!normal-case">
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Summary */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">DISTRIBUTION</Typography>
              <div className="space-y-2">
                {['GEN-01', 'NGT-01', 'FLX-01', 'ROT-A', 'MRN-01'].map(shift => (
                  <div key={shift} className="flex justify-between items-center">
                    <span className="font-mono">{shift}</span>
                    <Chip label={`${Math.floor(Math.random() * 10) + 1} emp`} size="small" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};