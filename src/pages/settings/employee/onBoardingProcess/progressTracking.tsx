import { useState, useEffect } from 'react';
import {
  Card, CardContent, Grid, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress,
  Dialog, DialogContent, DialogTitle, Button,
  Accordion, AccordionSummary, AccordionDetails, Avatar
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, CheckCircle, Pending, Warning, 
  Visibility, TaskAlt, Schedule, Cancel, TrendingUp 
} from '@mui/icons-material';
import { onBoardService } from '../../../../services/modules/onBoard';
import { useUI } from '../../../../context/Snackbar';
import dayjs from 'dayjs';

export const ProgressTracking = () => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [onboardings, setOnboardings] = useState<any[]>([]);
  const [selectedOnboarding, setSelectedOnboarding] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    avgProgress: 0
  });

  const fetchOnboardings = async () => {
    try {
      showSpinner();
      const response:any = await onBoardService.getEmployeeOnboardings?.({ size: 100 });
      const data = response?.data?.content || response?.data || [];
      setOnboardings(data);
      
      // Calculate stats
      const inProgress = data.filter((o: any) => o.status === 'In Progress').length;
      const completed = data.filter((o: any) => o.status === 'Completed').length;
      const overdue = data.filter((o: any) => o.status === 'Overdue').length;
      const avgProgress = Math.round(data.reduce((sum: number, o: any) => sum + (o.progress || 0), 0) / (data.length || 1));
      
      setStats({
        total: data.length,
        inProgress,
        completed,
        overdue,
        avgProgress
      });
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchOnboardings();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOnboardings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewProgress = async (onboarding: any) => {
    setSelectedOnboarding(onboarding);
    setIsDetailsOpen(true);
    try {
      showSpinner();
      const progressRes:any = await onBoardService.getProgress(onboarding.id);
      setProgress(progressRes.data);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'In Progress': return <Schedule className="text-blue-500" />;
      case 'Overdue': return <Warning className="text-red-500" />;
      default: return <Pending className="text-gray-400" />;
    }
  };

  const getDaysRemaining = (expectedEndDate: string) => {
    const end = dayjs(expectedEndDate);
    const today = dayjs();
    const days = end.diff(today, 'day');
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `${days} days remaining`;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Onboarding Progress Tracking</h1>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.total}</Typography>
                  <Typography variant="body2">Total Onboardings</Typography>
                </div>
                <TaskAlt fontSize="large" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.inProgress}</Typography>
                  <Typography variant="body2">In Progress</Typography>
                </div>
                <Schedule fontSize="large" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.completed}</Typography>
                  <Typography variant="body2">Completed</Typography>
                </div>
                <CheckCircle fontSize="large" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.overdue}</Typography>
                  <Typography variant="body2">Overdue</Typography>
                </div>
                <Cancel fontSize="large" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.avgProgress}%</Typography>
                  <Typography variant="body2">Avg Progress</Typography>
                </div>
                <TrendingUp fontSize="large" />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onboarding List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Checklist</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Timeline</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {onboardings.map((onboarding) => (
              <TableRow key={onboarding.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="!w-8 !h-8 !bg-primary">
                      {onboarding.employeeName?.charAt(0)}
                    </Avatar>
                    <div>
                      <div className="font-medium">{onboarding.employeeName}</div>
                      <div className="text-xs text-gray-500">ID: {onboarding.employeeId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{onboarding.checklistName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(onboarding.status)}
                    <Chip 
                      label={onboarding.status} 
                      size="small" 
                      color={onboarding.status === 'Completed' ? 'success' : onboarding.status === 'Overdue' ? 'error' : 'info'}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="min-w-[150px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{onboarding.progress || 0}%</span>
                      <span className="text-gray-500">{onboarding.completedTasks || 0}/{onboarding.totalTasks || 0} tasks</span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={onboarding.progress || 0} 
                      className="h-2 rounded-full"
                      sx={{
                        backgroundColor: '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: onboarding.status === 'Overdue' ? '#ef4444' : '#3b82f6'
                        }
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Start: {dayjs(onboarding.startDate).format('DD MMM')}</div>
                    <div className={dayjs(onboarding.expectedEndDate).isBefore(dayjs()) && onboarding.status !== 'Completed' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      End: {dayjs(onboarding.expectedEndDate).format('DD MMM')}
                      <span className="text-xs ml-1">
                        ({getDaysRemaining(onboarding.expectedEndDate)})
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewProgress(onboarding)}
                    className="!border-primary !text-primary"
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Progress Details Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h6">{selectedOnboarding?.employeeName}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedOnboarding?.checklistName}
              </Typography>
            </div>
            <Chip 
              label={selectedOnboarding?.status} 
              color={selectedOnboarding?.status === 'Completed' ? 'success' : selectedOnboarding?.status === 'Overdue' ? 'error' : 'info'}
            />
          </div>
        </DialogTitle>
        <DialogContent className="pt-4">
          {progress?.tasks && (
            <div className="space-y-3">
              {/* Overall Progress Card */}
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent>
                  <div className="mb-2 flex justify-between items-center">
                    <Typography variant="body1" className="font-semibold">Overall Progress</Typography>
                    <Typography variant="h5" className="font-bold text-primary">{progress.overallProgress}%</Typography>
                  </div>
                  <LinearProgress variant="determinate" value={progress.overallProgress} className="h-2 rounded-full mb-3" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500 text-sm" />
                      <span>Completed: {progress.completedTasks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Schedule className="text-blue-500 text-sm" />
                      <span>In Progress: {progress.inProgressTasks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pending className="text-gray-400 text-sm" />
                      <span>Pending: {progress.pendingTasks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Warning className="text-red-500 text-sm" />
                      <span>Overdue: {progress.overdueTasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task List */}
              <Typography variant="subtitle1" className="font-semibold mt-4 mb-2">Task Details</Typography>
              
              {progress.tasks.map((task: any) => (
                <Accordion key={task.taskId} className="border rounded-lg">
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div className="flex items-center gap-3 w-full">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <Typography className="font-medium">{task.taskName}</Typography>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>Priority: <Chip label={task.priority} size="small" className="!h-4 !text-xs" /></span>
                          <span>Due: {task.dueDays} days from start</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'Completed' && task.completedAt && (
                          <span className="text-xs text-green-600">
                            Completed: {dayjs(task.completedAt).format('DD MMM')}
                          </span>
                        )}
                        {task.status === 'Overdue' && (
                          <span className="text-xs text-red-600">Overdue</span>
                        )}
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-3">
                      <Typography variant="body2" className="text-gray-700">
                        {task.description || 'No description provided'}
                      </Typography>
                      {task.startedAt && (
                        <div className="text-sm">
                          <span className="text-gray-500">Started:</span> {dayjs(task.startedAt).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="text-sm">
                          <span className="text-gray-500">Completed:</span> {dayjs(task.completedAt).format('DD MMM YYYY, hh:mm A')}
                        </div>
                      )}
                      {task.remarks && (
                        <div className="p-2 bg-gray-50 rounded">
                          <span className="text-gray-500">Remarks:</span> {task.remarks}
                        </div>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-2">
                          <Typography variant="subtitle2" className="mb-1">Attachments:</Typography>
                          {task.attachments.map((doc: any) => (
                            <a 
                              key={doc.id}
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary text-sm block hover:underline"
                            >
                              📎 {doc.documentName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};