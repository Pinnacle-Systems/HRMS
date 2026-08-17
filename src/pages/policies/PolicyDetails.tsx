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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  PlayArrow as TestIcon,
  CloseOutlined,
  AssessmentOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import type { PolicyDefinition, PolicyVersion, PolicyAssignment, PolicyAuditLog } from '../../types/policy';
import { PolicyPreviewSimulator } from '../../components/PolicyManagement/PolicyPreviewSimulator';
import { useUI } from '../../context/Snackbar';
import { policyService } from '../../services';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import { getStatusColor } from './const';
import { getRowColor } from '../const';
import ConfigurationViewer from '../../components/PolicyManagement/ConfigurationViewer';

export default function PolicyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [assignments, setAssignments] = useState<Record<string, PolicyAssignment[]>>({});
  const [auditLogs, setAuditLogs] = useState<PolicyAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVersionId, setRejectingVersionId] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const { showSpinner, hideSpinner, showSnackbar } = useUI();

  useEffect(() => {
    if (id) {
      loadPolicyData();
    }
  }, [id]);

  const loadPolicyData = async () => {
    showSpinner();
    try {
      const [policyData, versionsData, auditData]: any = await Promise.all([
        policyService.getPolicyById(id!),
        policyService.getPolicyVersions(id!),
        policyService.getPolicyAudit(id!),
      ]);
      setPolicy(policyData.data || {});
      setVersions(versionsData.data || []);
      setAuditLogs(auditData.data || []);
      if (versionsData.data.length > 0) {
        const assignmentsResults = await Promise.all(
          versionsData.data.map(async (v: any) => {
            const assignmentsData: any = await policyService.getAssignmentsByVersion(v.id);
            return { versionId: v.versionNo, assignments: assignmentsData.data };
          })
        );

        // Process all assignments
        assignmentsResults.forEach(({ versionId, assignments }) => {
          setAssignments(prev => ({ ...prev, [versionId]: assignments }));
        });
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    } finally {
      hideSpinner();
    }
  };

  // The policy's own status mirrors its latest/active version's status, so
  // every version-status transition (activate, approve, reject) must push
  // the same status onto the policy record. PUT replaces the whole
  // resource, so the rest of the fields are carried over from the
  // currently loaded policy state.
  const syncPolicyStatus = async (status: string) => {
    await policyService.updatePolicy(id!, {
      companyId: policy?.companyId,
      templateId: policy?.templateId,
      domainId: policy?.domainId,
      policyCode: policy?.policyCode,
      policyName: policy?.policyName,
      description: policy?.description,
      effectiveFrom: policy?.effectiveFrom,
      effectiveTo: policy?.effectiveTo,
      status,
    });
  };

  const handleActivate = async (versionId: string) => {
    showSpinner();
    try {
      const res: any = await policyService.activateVersion(versionId);
      await syncPolicyStatus(res?.data?.status ?? 'ACTIVE');
      await policyService.createNotify(versionId, { message: `Activated new version for policy ${policy?.policyName}`, channel: "push" })
      showSnackbar('Version activated successfully', 'success');
      loadPolicyData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to activate version', 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleApprove = async (versionId: string) => {
    showSpinner();
    try {
      const res: any = await policyService.approveVersion(versionId);
      await syncPolicyStatus(res?.data?.status ?? 'ACTIVE');
      showSnackbar('Version approved successfully', 'success');
      loadPolicyData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to approve version', 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleOpenReject = (versionId: string) => {
    setRejectingVersionId(versionId);
    setRejectRemarks('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingVersionId) return;
    showSpinner();
    try {
      const res: any = await policyService.rejectVersion(rejectingVersionId, rejectRemarks);
      await syncPolicyStatus(res?.data?.status ?? 'DRAFT');
      showSnackbar('Version rejected', 'success');
      setRejectDialogOpen(false);
      loadPolicyData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to reject version', 'error');
    } finally {
      hideSpinner();
    }
  };

  if (!policy) return null;

  const currentVersion = versions[0];

  return (
    <div>
      <Box className="flex items-center mb-3">
        <IconButton onClick={() => navigate('/policies')}>
          <BackIcon className='text-gray-800' />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {policy.policyName} (View Details)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {policy.description}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <div className='mb-3 bg-white text-gray-800'>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--color-primary)",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}>
              <Tab label="Overview" className='!text-gray-800' />
              <Tab label="Versions" className='!text-gray-800' />
              <Tab label="Assignments" className='!text-gray-800' />
              <Tab label="Audit Log" className='!text-gray-800' />
            </Tabs>

            <Box>
              {activeTab === 0 && (
                <Box className="p-5">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Policy ID
                      </Typography>
                      <Typography variant="body2">{policy.policyCode}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Domain
                      </Typography>
                      <div> <Chip label={policy.domainName} size="small" className='bg-gray-100 text-gray-800' /></div>
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
                      <Typography variant="body2">{policy.createdByName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(policy.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(policy.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Current Version: v{currentVersion?.versionNo}
                  </Typography>
                  {/* {currentVersion?.configJson && (
                    <Box component="pre" className='bg-head' sx={{
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: 12,
                    }}>
                      {JSON.stringify(currentVersion.configJson, null, 2)}
                    </Box>
                  )} */}
                  <ConfigurationViewer
                    configJson={currentVersion.configJson}
                    versionNo={currentVersion.versionNo}
                  />
                </Box>
              )}

              {activeTab === 1 && (
                <TableContainer className='p-5 !max-h-[calc(100vh-200px)]'>
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
                      {versions.map((version, index) => (
                        <TableRow key={version.id} sx={getRowColor(index)}>
                          <TableCell>v{version.versionNo}</TableCell>
                          <TableCell>{formatDate(version.effectiveFrom)}</TableCell>
                          <TableCell>
                            {version.effectiveTo ? formatDate(version.effectiveTo) : 'Ongoing'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={version.status}
                              color={getStatusColor(version.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{version.createdByName}</TableCell>
                          <TableCell>
                            {version.status === 'PENDING_APPROVAL' && (
                              <>
                                <Button size="small" color="success" onClick={() => handleApprove(version.id)}>
                                  Approve
                                </Button>
                                <Button size="small" color="error" onClick={() => handleOpenReject(version.id)}>
                                  Reject
                                </Button>
                              </>
                            )}
                            {version.status === 'DRAFT' && (
                              <>
                                <Button size="small" onClick={() => handleActivate(version.id)}>
                                  Activate
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
                <TableContainer className='p-5 !max-h-[calc(100vh-200px)]'>
                  <Table className='bg-white-50 border border-gray-200 rounded-lg shadow-sm'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>Assignment Type</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Effective Period</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(assignments).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" className='!text-gray-400'>
                            No assignments configured.
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(assignments).flatMap(([versionNo, versionAssignments]) =>
                          versionAssignments?.map((assignment, index) => (
                            <TableRow key={assignment.id} sx={getRowColor(index)}>
                              <TableCell>v{versionNo}</TableCell>
                              <TableCell>
                                {assignment.branchId ? 'Branch'
                                  : assignment.departmentId ? 'Department'
                                    : assignment.designationId ? 'Designation'
                                      : assignment.employmentType ? 'Employment Type'
                                        : assignment.templateName ? 'Template'
                                          : assignment.employeeId ? 'Specific Employee'
                                          : assignment.employeeCategory ? 'Employee Category'

                                            : 'All Employees'}
                              </TableCell>
                              <TableCell>
                                {assignment.branchId ? assignment.branchName :
                                  assignment.departmentId ? assignment.departmentName :
                                    assignment.designationId ? assignment.designationName :
                                      assignment.employmentType ? assignment.employmentTypeName :
                                        assignment.templateName ? assignment.templateName :
                                          assignment.employeeId ? assignment.employeeName :
                                          assignment.employeeCategory ? assignment.employeeCategory :
                                            'Company-wide'}
                              </TableCell>
                              <TableCell>{assignment.priority}</TableCell>
                              <TableCell>
                                {formatDate(assignment.effectiveFrom)} ---{' '}
                                {assignment.effectiveTo ? formatDate(assignment.effectiveTo) : 'Ongoing'}
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 3 && (
                <div className="p-5">
                  {auditLogs.length === 0 ? (
                    <div>
                      <Alert severity="info" className='!m-2'>
                        Audit logs will be displayed here. This includes all policy changes, approvals, and activations.
                      </Alert>
                    </div>
                  ) : (
                    <TableContainer className="!max-h-[calc(100vh-200px)]">
                      <Table stickyHeader className="bg-white-50 border border-gray-200 rounded-sm shadow-sm">
                        <TableHead>
                          <TableRow>
                            <TableCell>S No</TableCell>
                            <TableCell>Action Type</TableCell>
                            <TableCell>Action By</TableCell>
                            <TableCell>Date & Time</TableCell>
                            <TableCell>Remarks</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(
                            auditLogs.map((log, index) => (
                              <TableRow key={log.id} sx={getRowColor(index)}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <Chip label={log.actionType} size="small" variant="outlined" className='text-gray-800' />
                                </TableCell>
                                <TableCell>{log.actionByName}</TableCell>
                                <TableCell>{formatDateTime(log.actionDate)}</TableCell>
                                <TableCell>{log.remarks || '-'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>

              )}
            </Box>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* Quick Actions Card */}
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <Box className="px-4 py-3 border-b border-gray-200 bg-head">
              <Typography variant="subtitle2" className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-primary">⚡</span> Quick Actions
              </Typography>
            </Box>

            <Box className="p-4 space-y-2 bg-white-50">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<HistoryIcon className='!w-4'/>}
                onClick={() => setActiveTab(1)}
                className="!text-gray-600 !border-gray-200 !bg-white hover:!border-primary hover:!text-primary !p-3 rounded-md normal-case"
              >
                View Version History
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssessmentOutlined className='!w-4'/>}
                onClick={() => setActiveTab(2)}
                className="!text-gray-600 !border-gray-200 !bg-white hover:!border-primary hover:!text-primary !p-3 rounded-md normal-case"
              >
                Manage Assignments
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<TestIcon className='!w-4'/>}
                onClick={() => setTestDialogOpen(true)}
                className="!text-gray-600 !border-gray-200 !bg-white hover:!border-primary hover:!text-primary !p-3 rounded-md normal-case"
              >
                Test Policy
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon className='!w-4'/>}
                onClick={() => navigate(`/policies/${id}/edit`)}
                className="!text-gray-600 !border-gray-200 !bg-white hover:!border-primary hover:!text-primary !p-3 rounded-md normal-case"
              >
                Edit Policy
              </Button>
            </Box>
          </Box>

          {/* Statistics Card */}
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Box className="px-4 py-3 border-b border-gray-200 bg-head">
              <Typography variant="subtitle2" className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-primary">📊</span> Statistics
              </Typography>
            </Box>

            <Box className="p-4 bg-white-50">
              <Box className="grid grid-cols-1 gap-3">
                <Box className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-300">
                  <Box className="flex items-center gap-3">
                    <Box className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <HistoryIcon className="text-blue-600" sx={{ fontSize: 16 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 block">Versions</Typography>
                      <Typography variant="h6" className="font-bold text-gray-800">
                        {versions.length ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-300">
                  <Box className="flex items-center gap-3">
                    <Box className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <AssignmentIcon className="text-green-600" sx={{ fontSize: 16 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 block">Assignments</Typography>
                      <Typography variant="h6" className="font-bold text-gray-800">
                        {Object.values(assignments).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-300">
                  <Box className="flex items-center gap-3">
                    <Box className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600 text-xs font-bold">📋</span>
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 block">Audit Logs</Typography>
                      <Typography variant="h6" className="font-bold text-gray-800">
                        {auditLogs.length > 0 ? auditLogs.length : 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Test Policy Dialog */}
      <PolicyPreviewSimulator
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        policyVersionId={currentVersion?.id || ''}
      />

      {/* Reject Version Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className='text-gray-800 flex items-center justify-between border-b border-gray-200 !p-2'>
          <div className='!ml-4'>Reject Version</div>
          <IconButton>
            <CloseOutlined className='text-gray-800 !w-4' />
          </IconButton>
        </DialogTitle>
        <DialogContent className='!p-4'>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Remarks"
            placeholder="Provide a reason for rejection..."
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setRejectDialogOpen(false)} variant='outlined' className='!border-gray-200 !text-gray-800'>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
};