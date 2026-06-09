import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  // People as PeopleIcon,
  Assignment as AssignmentIcon,
  PlayArrow as TestIcon,
  // CheckCircle as ActivateIcon,
  // Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { policyApi } from '../../services/modules/policy';
import type { PolicyDefinition, PolicyVersion, PolicyAssignment } from '../../types/policy';
import { PolicyPreviewSimulator } from '../../components/PolicyManagement/PolicyPreviewSimulator';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { useUI } from '../../context/Snackbar';

export default function PolicyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const { showSpinner, hideSpinner } = useUI();

  useEffect(() => {
    if (id) {
      loadPolicyData();
    }
  }, [id]);

  const loadPolicyData = async () => {
    showSpinner()
    try {
      const [policyData, versionsData] = await Promise.all([
        policyApi.getPolicyById(id!),
        policyApi.getPolicyVersions(id!),
      ]);
      setPolicy(policyData);
      setVersions(versionsData);

      if (versionsData[0]) {
        const assignmentsData = await policyApi.getAssignments(versionsData[0].id);
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    } finally {
      hideSpinner()
    }
  };

  const handleActivate = async (versionId: string) => {
    try {
      await policyApi.activateVersion(versionId);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    try {
      // API call to schedule activation
      setScheduleDialogOpen(false);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to schedule:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'PENDING_APPROVAL': return 'info';
      case 'SCHEDULED': return 'primary';
      case 'EXPIRED': return 'error';
      default: return 'secondary';
    }
  };

  if (!policy) return null;

  // const activeVersion = versions.find(v => v.status === 'ACTIVE');
  const currentVersion = versions[0];

  return (
    <div>
      <Box className="flex items-center mb-3">
        <IconButton onClick={() => navigate('/policies')}>
          <BackIcon className='text-gray-800' />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {policy.name} (View Details)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {policy.description}
          </Typography>
        </Box>
        {/* {!activeVersion && (
          <Button
            variant="contained"
            className='!bg-primary'
            startIcon={<TestIcon />}
            onClick={() => setTestDialogOpen(true)}
          >
            Test Policy
          </Button>
        )} */}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <div className='mb-3 bg-white text-gray-800'>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Overview" className='text-gray-800' />
              <Tab label="Versions" className='text-gray-800' />
              <Tab label="Assignments" className='text-gray-800' />
              <Tab label="Audit Log" className='text-gray-800' />
            </Tabs>

            <Box>
              {activeTab === 0 && (
                <Box className="p-5">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Policy ID
                      </Typography>
                      <Typography variant="body2">{policy.id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Domain
                      </Typography>
                      <div> <Chip label={policy.domain} size="small" className='bg-gray-100 text-gray-800' /></div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <div>
                        <Chip
                          label={policy.status}
                          color={getStatusColor(policy.status) as any}
                          size="small"
                        />
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body2">{policy.createdBy}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(policy.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(policy.updatedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Current Version: v{currentVersion?.versionNumber}
                  </Typography>
                  {currentVersion?.config && (
                    <Box component="pre" className='bg-head' sx={{
                      // bgcolor: 'action.hover',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: 12,
                    }}>
                      {JSON.stringify(currentVersion.config, null, 2)}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <TableContainer className='p-5'>
                  <Table className='bg-white-50 border border-gray-200 rounded-lg shadow-sm'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>Effective From</TableCell>
                        <TableCell>Effective To</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell>v{version.versionNumber}</TableCell>
                          <TableCell>{new Date(version.effectiveFrom).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {version.effectiveTo ? new Date(version.effectiveTo).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={version.status}
                              color={getStatusColor(version.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{version.createdBy}</TableCell>
                          <TableCell>
                            {version.status === 'PENDING_APPROVAL' && (
                              <Button size="small" color="success">
                                Approve
                              </Button>
                            )}
                            {version.status === 'DRAFT' && (
                              <>
                                <Button size="small" onClick={() => handleActivate(version.id)}>
                                  Activate
                                </Button>
                                <Button size="small" onClick={() => setScheduleDialogOpen(true)}>
                                  Schedule
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 2 && (
                <TableContainer className='p-5'>
                  <Table className='bg-white-50 border border-gray-200 rounded-lg shadow-sm'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Assignment Type</TableCell>
                        <TableCell>Values</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Effective Period</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            {assignment.branchId && 'Branch'}
                            {assignment.departmentId && 'Department'}
                            {assignment.designationId && 'Designation'}
                            {assignment.employeeId && 'Specific Employee'}
                          </TableCell>
                          <TableCell>
                            {assignment.branchId ||
                              assignment.departmentId ||
                              assignment.designationId ||
                              assignment.employeeId}
                          </TableCell>
                          <TableCell>{assignment.priority}</TableCell>
                          <TableCell>
                            {new Date(assignment.effectiveFrom).toLocaleDateString()} -
                            {assignment.effectiveTo ? new Date(assignment.effectiveTo).toLocaleDateString() : 'Ongoing'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 3 && (
                <div className="p-2">
                  <Alert severity="info" className='!m-5'>
                    Audit logs will be displayed here. This includes all policy changes, approvals, and activations.
                  </Alert>
                </div>
              )}
            </Box>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className='p-3 mb-3 bg-white'>
            <Typography variant="subtitle1" className='!mb-3'>
              Quick Actions
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HistoryIcon />}
              sx={{ mb: 1 }}
              onClick={() => setActiveTab(1)}
            >
              View Version History
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssignmentIcon />}
              sx={{ mb: 1 }}
              onClick={() => setActiveTab(2)}
            >
              Manage Assignments
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TestIcon />}
              sx={{ mb: 1 }}
              onClick={() => setTestDialogOpen(true)}
            >
              Test Policy
            </Button>
            <Button
              fullWidth
              variant='contained'
              className='!bg-primary'
              startIcon={<EditIcon />}
              onClick={() => navigate(`/policies/${id}/edit`)}
            >
              Edit
            </Button>
          </div>

          <div className="p-4 bg-white">
            <Typography variant="subtitle1" className="!mb-3 font-semibold">
              Statistics
            </Typography>

            <Box className="flex gap-4 flex-wrap">
              <Chip
                label={`Versions: ${versions.length ?? 0}`}
                color="primary"
                variant="outlined"
              />

              <Chip
                label={`Assignments: ${assignments.length ?? 0}`}
                color="success"
                variant="outlined"
              />

              <Chip
                label="Evaluations (30d): - 0"
                color="warning"
                variant="outlined"
              />
            </Box>
          </div>
        </Grid>
      </Grid>

      {/* Test Policy Dialog */}
      <PolicyPreviewSimulator
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        policyVersionId={currentVersion?.id || ''}
      />

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>Schedule Policy Activation</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Activation Date & Time"
              value={scheduleDate ? dayjs(scheduleDate) : null}
              onChange={(newValue) =>
                setScheduleDate(newValue ? dayjs(newValue).format("YYYY-MM-DDTHH:mm:ss") : "")
              }
              sx={{
                mt: 2,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions className='!p-4'>
          <Button onClick={() => setScheduleDialogOpen(false)} variant='outlined' className='!border-gray-200 !text-gray-800'>Cancel</Button>
          <Button onClick={handleSchedule} variant="contained" className='!bg-primary'>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};