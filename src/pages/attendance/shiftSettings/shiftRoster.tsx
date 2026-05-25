import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Avatar
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  GroupAdd as BulkAssignIcon,
  Publish as PublishIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useUI } from '../../../context/Snackbar';

// Mock data
const mockEmployees = [
  { id: '1', name: 'Priya Sharma', department: 'Engineering', shiftCode: 'GEN-01', shifts: ['GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01'] },
  { id: '2', name: 'Alisha Khan', department: 'HR', shiftCode: 'GEN-01', shifts: ['GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01'] },
  { id: '3', name: 'Sneha Gupta', department: 'QA', shiftCode: 'MRN-01', shifts: ['MRN-01', 'MRN-01', 'MRN-01', 'MRN-01', 'MRN-01', 'MRN-01', 'MRN-01'] },
  { id: '4', name: 'Arjun Mehta', department: 'DevOps', shiftCode: 'ROT-A', shifts: ['ROT-A', 'ROT-A', 'ROT-A', 'ROT-A', 'ROT-A', 'WO', 'WO'] },
  { id: '5', name: 'Kavita Singh', department: 'Analytics', shiftCode: 'GEN-01', shifts: ['GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'WO', 'WO'] },
  { id: '6', name: 'Sanjay Kumar', department: 'Management', shiftCode: 'FLX-01', shifts: ['FLX-01', 'FLX-01', 'FLX-01', 'FLX-01', 'WL', 'WL', 'WL'] },
  { id: '7', name: 'Neha Joshi', department: 'Engineering', shiftCode: 'GEN-01', shifts: ['GEN-01', 'GEN-01', 'GEN-01', 'GEN-01', 'WO', 'WO', 'WO'] },
  { id: '8', name: 'Vijay Reddy', department: 'Architecture', shiftCode: 'NLT-01', shifts: ['NLT-01', 'NLT-01', 'NLT-01', 'NLT-01', 'Leave', 'Leave', 'Leave'] },
];

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const ShiftRoster = () => {
  const { showSnackbar } = useUI();
  const [selectedWeek, setSelectedWeek] = useState(dayjs());
  const [department, setDepartment] = useState('all');
  const [branch, setBranch] = useState('all');
  const [employees, setEmployees] = useState(mockEmployees);
  const [editingCell, setEditingCell] = useState<{ empId: string; day: string } | null>(null);

  const handleCopyPrevWeek = () => {
    showSnackbar('Previous week roster copied successfully!', 'success');
  };

  const handleBulkAssign = () => {
    showSnackbar('Bulk assignment initiated!', 'info');
  };

  const handlePublish = () => {
    showSnackbar('Roster published successfully!', 'success');
  };

  const handleShiftChange = (empId: string, day: string, newShift: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        const dayIndex = weekDays.indexOf(day);
        const newShifts = [...emp.shifts];
        newShifts[dayIndex] = newShift;
        return { ...emp, shifts: newShifts };
      }
      return emp;
    }));
    setEditingCell(null);
    showSnackbar('Shift updated successfully!', 'success');
  };

  const getShiftColor = (shiftCode: string) => {
    const colors: Record<string, string> = {
      'GEN-01': '#3b82f6',
      'MRN-01': '#f59e0b',
      'ROT-A': '#8b5cf6',
      'FLX-01': '#10b981',
      'NLT-01': '#6366f1',
      'WO': '#ef4444',
      'WL': '#f97316',
      'Leave': '#6b7280'
    };
    return colors[shiftCode] || '#9ca3af';
  };

  const shiftOptions = ['GEN-01', 'MRN-01', 'ROT-A', 'FLX-01', 'NLT-01', 'WO', 'WL', 'Leave'];

  const filteredEmployees = employees.filter(emp => 
    department === 'all' || emp.department === department
  );

  const departments = ['all', ...new Set(employees.map(e => e.department))];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Typography variant="h6" className="font-semibold text-gray-800 mb-1">
          Shift Roster
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Assign and publish weekly shift rosters for your team
        </Typography>
      </div>

      {/* Search Options */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Week Range"
                value={selectedWeek}
                onChange={(date) => setSelectedWeek(date || dayjs())}
                slotProps={{ textField: { size: 'small', className: 'w-48' } }}
              />
            </LocalizationProvider>
            
            <FormControl size="small" className="w-48">
              <InputLabel>All Departments</InputLabel>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="All Departments">
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" className="w-48">
              <InputLabel>All Branches</InputLabel>
              <Select value={branch} onChange={(e) => setBranch(e.target.value)} label="All Branches">
                <MenuItem value="all">All Branches</MenuItem>
                <MenuItem value="main">Main Branch</MenuItem>
                <MenuItem value="east">East Branch</MenuItem>
              </Select>
            </FormControl>

            <Button variant="outlined" startIcon={<CopyIcon />} onClick={handleCopyPrevWeek}>
              Copy Prev Week
            </Button>
            <Button variant="outlined" startIcon={<BulkAssignIcon />} onClick={handleBulkAssign}>
              Bulk Assign
            </Button>
            <Button variant="contained" startIcon={<PublishIcon />} onClick={handlePublish} className="!bg-primary">
              Publish Roster
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee List and Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employee List - Left Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">EMPLOYEE</Typography>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="!w-8 !h-8 !bg-primary">
                        {employee.name.charAt(0)}
                      </Avatar>
                      <div>
                        <Typography variant="body2" className="font-medium">{employee.name}</Typography>
                        <Typography variant="caption" className="text-gray-500">{employee.department}</Typography>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {weekDays.map((day, idx) => (
                        <div key={day} className="text-xs">
                          <div className="text-gray-400">{day}</div>
                          <Chip 
                            label={employee.shifts[idx]} 
                            size="small" 
                            className="!h-5 !text-[10px] !w-full"
                            sx={{ backgroundColor: `${getShiftColor(employee.shifts[idx])}20`, color: getShiftColor(employee.shifts[idx]) }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roster Table - Right Side */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell className="font-semibold">EMPLOYEE</TableCell>
                      {weekDays.map(day => (
                        <TableCell key={day} align="center" className="font-semibold">{day}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium sticky left-0 bg-white">
                          <div>
                            {employee.name}
                            <div className="text-gray-500">
                              {employee.department}
                            </div>
                          </div>
                        </TableCell>
                        {employee.shifts.map((shift, idx) => (
                          <TableCell key={idx} align="center" className="p-1">
                            {editingCell?.empId === employee.id && editingCell?.day === weekDays[idx] ? (
                              <Select
                                size="small"
                                value={shift}
                                onChange={(e) => handleShiftChange(employee.id, weekDays[idx], e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="w-24"
                              >
                                {shiftOptions.map(opt => (
                                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <Tooltip title="Click to edit">
                                <Chip
                                  label={shift}
                                  onClick={() => setEditingCell({ empId: employee.id, day: weekDays[idx] })}
                                  className="cursor-pointer hover:opacity-80"
                                  sx={{ backgroundColor: `${getShiftColor(shift)}20`, color: getShiftColor(shift), fontWeight: 500 }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    {shiftOptions.slice(0, 5).map(shift => (
                      <div key={shift} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getShiftColor(shift) }} />
                        <span className="text-xs">{shift}</span>
                        <span className="text-xs text-gray-500">
                          ({employees.filter(e => e.shifts.includes(shift)).length} emp)
                        </span>
                      </div>
                    ))}
                  </div>
                  <Alert severity="warning" className="text-sm">
                    <WarningIcon fontSize="small" /> Roster unpublished — pending approval
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts Section */}
      <Card className="mt-6 bg-yellow-50">
        <CardContent>
          <div className="flex items-start gap-3">
            <WarningIcon className="text-yellow-600" />
            <div>
              <Typography variant="subtitle2" className="text-yellow-800 font-semibold">Alerts</Typography>
              <Typography variant="body2" className="text-yellow-700">
                • Neha Joshi unassigned on Thu May 21<br />
                • Ravi Patel: overtime risk (5 nights)<br />
                • Roster unpublished pending approval
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};