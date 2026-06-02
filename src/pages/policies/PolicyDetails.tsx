// src/pages/PolicyDetails.tsx

import  { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
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
  TextField,
  // FormControl,
  // InputLabel,
  // Select,
  // MenuItem,
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
import type{ PolicyDefinition, PolicyVersion, PolicyAssignment } from '../../types/policy';
import { PolicyPreviewSimulator } from '../../components/PolicyManagement/PolicyPreviewSimulator';

export  default function PolicyDetails()  {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  // const [loading, setLoading] = useState(true);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (id) {
      loadPolicyData();
    }
  }, [id]);

  const loadPolicyData = async () => {
    // setLoading(true);
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
      // setLoading(false);
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
      case 'EXPIRED': return 'default';
      default: return 'default';
    }
  };

  if (!policy) return null;

  const activeVersion = versions.find(v => v.status === 'ACTIVE');
  const currentVersion = versions[0];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box className="flex items-center mb-3">
        <IconButton onClick={() => navigate('/policies')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {policy.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {policy.description}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/policies/${id}/edit`)}
          sx={{ mr: 1 }}
        >
          Edit
        </Button>
        {activeVersion && (
          <Button
            variant="contained"
            startIcon={<TestIcon />}
            onClick={() => setTestDialogOpen(true)}
          >
            Test Policy
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Overview" />
              <Tab label="Versions" />
              <Tab label="Assignments" />
              <Tab label="Audit Log" />
            </Tabs>

            <Box>
              {activeTab === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid size={{xs:12,sm:6}}>
                      <Typography variant="caption" color="text.secondary">
                        Policy ID
                      </Typography>
                      <Typography variant="body2">{policy.id}</Typography>
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <Typography variant="caption" color="text.secondary">
                        Domain
                      </Typography>
                      <Chip label={policy.domain} size="small" />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        label={policy.status} 
                        color={getStatusColor(policy.status) as any}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <Typography variant="caption" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body2">{policy.createdBy}</Typography>
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {new Date(policy.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{xs:12,sm:6}}>
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
                    <Box component="pre" sx={{ 
                      bgcolor: 'action.hover', 
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
                <TableContainer>
                  <Table>
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
                <TableContainer>
                  <Table>
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
                <Alert severity="info">
                  Audit logs will be displayed here. This includes all policy changes, approvals, and activations.
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{xs:12,md:4}}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
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
              onClick={() => setTestDialogOpen(true)}
            >
              Test Policy
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Statistics
            </Typography>
            <Box className="flex-justify-between mb-1">
              <Typography variant="body2" color="text.secondary">Total Versions</Typography>
              <Typography variant="body2">{versions.length}</Typography>
            </Box>
            <Box className="flex-justify-between mb-1">
              <Typography variant="body2" color="text.secondary">Active Assignments</Typography>
              <Typography variant="body2">{assignments.length}</Typography>
            </Box>
            <Box className="flex-justify-between">
              <Typography variant="body2" color="text.secondary">Evaluations (30d)</Typography>
              <Typography variant="body2">-</Typography>
            </Box>
          </Paper>
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
          <TextField
            fullWidth
            type="datetime-local"
            label="Activation Date & Time"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            sx={{ mt: 2 }}
            // InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSchedule} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};