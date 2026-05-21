import { useState, useEffect } from 'react';
import {
  Button, Card, CardContent, Dialog, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Alert, Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ViewIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { normalizeOnboardingAssignmentsResponse, onBoardService } from '../../../../services/modules/onBoard';
import { employeeService, normalizeEmployeesResponse } from '../../../../services/modules/employees';
import { useUI } from '../../../../context/Snackbar';

export const AssignOnboarding = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    checklistId: '',
    startDate: dayjs().format('YYYY-MM-DD')
  });

  const fetchData = async () => {
    try {
      showSpinner();
      const [checklistsResult, employeesResult, assignmentsResult] = await Promise.allSettled([
        onBoardService.getChecklists({ isActive: true, size: 100 }),
        employeeService.getEmployees({
          page: 0,
          size: 20,
          sort: "name,ASC",
          includeInactive: false,
        }),
        onBoardService.getAssignments({ size: 100 })
      ]);

      if (checklistsResult.status === 'fulfilled') {
        const checklistsRes: any = checklistsResult.value;
        setChecklists(checklistsRes.data?.content || checklistsRes.data || []);
      }

      if (employeesResult.status === 'fulfilled') {
        setEmployees(normalizeEmployeesResponse(employeesResult.value));
      } else {
        showSnackbar(employeesResult.reason?.message || 'Failed to load employees', 'error');
      }

      if (assignmentsResult.status === 'fulfilled') {
        setAssignments(normalizeOnboardingAssignmentsResponse(assignmentsResult.value));
      }
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!formData.employeeId || !formData.checklistId) {
      showSnackbar('Please select employee and checklist', 'error');
      return;
    }
    try {
      showSpinner();
      await onBoardService.assignOnboarding(formData);
      setIsDialogOpen(false);
      setFormData({ employeeId: '', checklistId: '', startDate: dayjs().format('YYYY-MM-DD') });
      fetchData();
      showSnackbar('Onboarding assigned successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    showConfirmDialog({
      title: 'Deactivate Onboarding Assignment',
      message: 'Are you sure you want to deactivate this onboarding assignment?',
      confirmText: 'Deactivate',
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteEmployeeOnboarding(id);
          fetchData();
          showSnackbar('Onboarding assignment deactivated successfully!', 'success');
        } catch (error: any) {
          showSnackbar(error.message, 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const handleSendWelcome = async (assignment: any) => {
    if (!assignment.employeeId) {
      showSnackbar('Cannot send welcome message: employee id is missing.', 'error');
      return;
    }

    try {
      showSpinner();
      await onBoardService.sendWelcomeMessage(assignment.employeeId);
      showSnackbar('Welcome message sent successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleViewDetails = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsDetailsOpen(true);
    if (!assignment.employeeId) {
      showSnackbar('Cannot load progress: employee id is missing.', 'error');
      return;
    }

    try {
      showSpinner();
      const progressRes:any = await onBoardService.getProgress(assignment.employeeId);
      setSelectedAssignment({ ...assignment, progress: progressRes.data });
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const getSelectedChecklist = () => {
    return checklists.find(c => c.id === formData.checklistId);
  };

  const getSelectedEmployee = () => {
    return employees.find(e => e.id === formData.employeeId);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-medium font-semibold text-primary">Assign Onboarding</h1>
        <Button
          variant="contained"
          onClick={() => setIsDialogOpen(true)}
          className="!bg-primary"
        >
          Assign New Onboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-6">
        <div>
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{assignments.length}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Grid>
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {assignments.filter(a => a.status === 'In Progress').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {assignments.filter(a => a.status === 'Completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assignments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Checklist</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Expected End Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="!w-8 !h-8 !bg-primary">
                      {assignment.employeeName?.charAt(0)}
                    </Avatar>
                    <div>
                      <div className="font-medium">{assignment.employeeName}</div>
                      <div className="text-xs text-gray-500">{assignment.employeeId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{assignment.checklistName}</TableCell>
                <TableCell>
                  <Chip label={assignment.status} size="small" color={getStatusColor(assignment.status)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${assignment.progress || 0}%` }} />
                    </div>
                    <span className="text-xs">{assignment.progress || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>{dayjs(assignment.startDate).format('DD MMM YYYY')}</TableCell>
                <TableCell className={dayjs(assignment.expectedEndDate).isBefore(dayjs()) && assignment.status !== 'Completed' ? 'text-red-600 font-medium' : ''}>
                  {dayjs(assignment.expectedEndDate).format('DD MMM YYYY')}
                </TableCell>
                <TableCell align="center">
                  <div className="flex gap-1 justify-center">
                    <IconButton size="small" aria-label={`View progress for ${assignment.employeeName || 'employee'}`} onClick={() => handleViewDetails(assignment)} color="primary">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label={`Send welcome to ${assignment.employeeName || 'employee'}`} onClick={() => handleSendWelcome(assignment)} color="secondary">
                      <SendIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label={`Deactivate assignment for ${assignment.employeeName || 'employee'}`} onClick={() => handleDeleteAssignment(assignment.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <FormControl fullWidth>
              <InputLabel id="assign-onboarding-employee-label">Select Employee</InputLabel>
              <Select
                labelId="assign-onboarding-employee-label"
                id="assign-onboarding-employee"
                value={formData.employeeId}
                label="Select Employee"
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {getSelectedEmployee() && (
              <Alert severity="info" className="text-sm">
                Assigning to: {getSelectedEmployee()?.name} - {getSelectedEmployee()?.designation}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel id="assign-onboarding-checklist-label">Select Checklist</InputLabel>
              <Select
                labelId="assign-onboarding-checklist-label"
                id="assign-onboarding-checklist"
                value={formData.checklistId}
                label="Select Checklist"
                onChange={(e) => setFormData({ ...formData, checklistId: e.target.value })}
              >
                {checklists.map((checklist) => (
                  <MenuItem key={checklist.id} value={checklist.id}>
                    {checklist.name} ({checklist.tasks?.length || 0} tasks)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {getSelectedChecklist() && (
              <Alert severity="info" className="text-sm">
                {getSelectedChecklist()?.tasks?.length || 0} tasks to complete
              </Alert>
            )}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dayjs(formData.startDate)}
                onChange={(date) => setFormData({ ...formData, startDate: date?.format('YYYY-MM-DD') || '' })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained" className="!bg-primary">Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedAssignment && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAssignment.employeeName}</h3>
                  <p className="text-sm text-gray-600">{selectedAssignment.checklistName}</p>
                </div>
                <Chip label={selectedAssignment.status} color={getStatusColor(selectedAssignment.status)} />
              </div>

              <div className="border-t pt-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm">{selectedAssignment.progress?.overallProgress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${selectedAssignment.progress?.overallProgress || 0}%` }} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>✅ Completed: {selectedAssignment.progress?.completedTasks || 0}</div>
                  <div>🔄 In Progress: {selectedAssignment.progress?.inProgressTasks || 0}</div>
                  <div>⏳ Pending: {selectedAssignment.progress?.pendingTasks || 0}</div>
                  <div>⚠️ Overdue: {selectedAssignment.progress?.overdueTasks || 0}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
