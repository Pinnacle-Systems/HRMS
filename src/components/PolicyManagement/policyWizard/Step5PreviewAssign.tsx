import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { helperSx } from '../const';
import { EmployeeSelector } from '../Common/EmployeeSelector';
import type { Employee } from '../../../types/policy';
import type { Step5PreviewAssignProps } from '../types';
import { policyService } from '../../../services';

const statusChipColor = (status?: string): 'default' | 'warning' | 'info' | 'success' => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'warning';
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
    case undefined:
      return 'info';
    default:
      return 'default';
  }
};

export const Step5PreviewAssign: React.FC<Step5PreviewAssignProps> = ({
  policyName,
  templateName,
  domain,
  config,
  eligibilityConfig,
  approvalFlow,
  effectiveFrom,
  onEffectiveFromChange,
  versionId,
  policyStatus,
  onSubmitForApproval,
}) => {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<any>('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  // Tracks the policy's real status. Seeded from the prop (the status the
  // policy actually has on the server) and only overwritten once the submit
  // call succeeds and the server confirms the new status — never guessed
  // from local UI interaction state.
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(policyStatus);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!selectedEmployees || !versionId) return;
    setLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const res: any = await policyService.previewVersion(versionId, {
        employeeId: selectedEmployees.id,
        domain: domain ?? '',
        action: 'APPLY',
        effectiveDate: effectiveFrom ?? new Date().toISOString().split('T')[0],
      });
      setPreviewResult(res.data ?? res);
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to run policy test');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!onSubmitForApproval) return;
    setSubmitStatus('submitting');
    setSubmitError(null);
    try {
      const status = await onSubmitForApproval();
      if (status) setCurrentStatus(status);
      setSubmitStatus('submitted');
    } catch (error: any) {
      setSubmitStatus('error');
      setSubmitError(error?.message || 'Failed to submit policy for approval');
    }
  };

  const renderConfigSummary = () => {
    // if (!config || !approvalFlow || !eligibilityConfig) return null;
    return (
      <Grid container spacing={2}>
        {config?.entitlements && config.entitlements.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Leave Entitlements</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Annual Days</TableCell>
                    <TableCell>Accrual Type</TableCell>
                    <TableCell>Max Accrual</TableCell>
                    <TableCell>Encashable</TableCell>
                    <TableCell>Enable Pro-rata</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className='bg-white-50'>
                  {config.entitlements.map((leave: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Chip label={leave.leaveType || leave.code} size="small" className='text-gray-500 bg-gray-100' /> {leave.name}</TableCell>
                      <TableCell>{leave.annualEntitlement} days</TableCell>
                      <TableCell>{leave.accrualType}</TableCell>
                      <TableCell>{leave.maxAccrual || '-'}</TableCell>
                      <TableCell>{leave.encashable ? '✓' : 'No'}</TableCell>
                      <TableCell>{leave.enableProRata ? '✓' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        )}
        {approvalFlow?.levels?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Approval Workflow</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {approvalFlow.levels.map((level: any, i: number) => (
                <Chip key={i} label={`Level ${level.level}: ${level.approverType}`} variant="outlined" className='text-gray-800' icon={<CheckIcon />} />
              ))}
              {approvalFlow.autoApproveBelowDays > 0 && (
                <Chip label={`Auto-approve below ${approvalFlow.autoApproveBelowDays}`} color="success" size="small" />
              )}
              {approvalFlow.parallelApproval && (
                <Chip label="Parallel Approval" color="info" size="small" />
              )}
            </Box>
          </Grid>
        )}
        {eligibilityConfig?.assignments?.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Eligibility Rules</Typography>
            {eligibilityConfig.assignments.map((rule: any, i: number) => (
              <Typography key={i} variant="body2" color="text.secondary">
                • {rule.type}: {rule.values.length} item(s) (Priority: {rule.priority})
                {rule.effectiveFrom && ` — from ${rule.effectiveFrom}`}
                {rule.effectiveTo && ` to ${rule.effectiveTo}`}
              </Typography>
            ))}
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Review & Create Policy</Typography>
      <Typography variant="body2" color="text.secondary">
        Review all configurations before creating the policy.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card className='border border-gray-200 !rounded-lg mt-2 bg-white-50 text-gray-800'>
            <CardContent className='!pb-2'>
              <Typography variant="subtitle1" gutterBottom className='mb-2 text-primary'>Policy Summary</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Policy Name</Typography>
                  <Typography variant="body2">{policyName || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Template</Typography>
                  <Typography variant="body2">{templateName || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip
                      label={(currentStatus ?? 'DRAFT').replace(/_/g, ' ')}
                      size="small"
                      color={statusChipColor(currentStatus)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                    <DatePicker
                      label="Effective From"
                      value={effectiveFrom ? dayjs(effectiveFrom) : dayjs()}
                      onChange={(newValue) =>
                        onEffectiveFromChange?.(
                          newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                        )
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          helperText: "When this policy takes effect",
                        },
                      }}
                      sx={helperSx}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card className='border border-gray-200 !rounded-lg bg-white-50 text-gray-800'>
            <CardContent className='!pb-4'>
              <Typography variant="subtitle1" gutterBottom className='mb-2 text-primary'>Configuration Details</Typography>
              {renderConfigSummary()}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card className='border border-gray-200 !rounded-lg bg-white-50 text-gray-800'>
            <CardContent>
              <Box className="flex justify-between items-center">
                <Typography variant="subtitle1">Test with Sample Employee</Typography>
                <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewDialogOpen(true)} disabled={!versionId}>
                  Test Policy
                </Button>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Alert severity="info" icon={<InfoIcon />}>
                Test the policy against a real employee profile to verify rules before activating.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          {submitStatus === 'submitted' ? (
            <Alert severity="success" icon={<CheckIcon />}>
              Policy submitted for approval. The approvers have been notified.
            </Alert>
          ) : onSubmitForApproval && (currentStatus ?? 'DRAFT') === 'DRAFT' ? (
            <Alert severity={submitStatus === 'error' ? 'error' : 'warning'} icon={submitStatus === 'error' ? undefined : <WarningIcon />} action={
              <Button
                color="warning" size="small" variant="outlined"
                startIcon={submitStatus === 'submitting' ? <CircularProgress size={14} /> : <SendIcon />}
                onClick={handleSubmitForApproval}
                disabled={submitStatus === 'submitting' || !policyName}
              >
                Submit for Approval
              </Button>
            }>
              {submitStatus === 'error' && submitError
                ? submitError
                : 'This policy is in DRAFT. Click "Submit for Approval" to start the approval workflow, or activate it directly from the dashboard.'}
            </Alert>
          ) : onSubmitForApproval ? (
            <Alert severity="info" icon={<InfoIcon />}>
              This policy is currently {(currentStatus ?? '').replace(/_/g, ' ')}. It can only be submitted for approval while in DRAFT.
            </Alert>
          ) : (
            <Alert severity="info" icon={<InfoIcon />}>
              Click "Create Policy" below to save and submit this policy for approval.
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Test Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className='border-b border-gray-200 !p-2 !pl-4'>Test Policy: {policyName}</DialogTitle>
        <DialogContent className='!p-4'>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select an employee to see how this policy would apply to them.
            </Typography>
            <EmployeeSelector
              value={selectedEmployees ? selectedEmployees : null}
              onChange={(value) => setSelectedEmployees(value as Employee[])}
              label="Select Employees"
              placeholder="Search multiple employees..."
            />
            <Button fullWidth variant="contained" onClick={handlePreview}
              disabled={!selectedEmployees || loading} className='!mt-4'>
              {loading ? <CircularProgress size={24} /> : 'Run Policy Test'}
            </Button>

            {previewError && (
              <Alert severity="error" sx={{ mt: 2 }}>{previewError}</Alert>
            )}
            {previewResult && (
              <Box sx={{ mt: 2 }} className="bg-gray-100 px-5 py-3 rounded-2xl">
                <Typography variant="subtitle2" gutterBottom>Test Results</Typography>
                <div className='p-2'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckIcon color="success" />
                    <Typography >
                      {previewResult.allowed ? 'Employee is eligible for this policy' : 'Employee is not eligible'}
                    </Typography>
                  </Box>
                  {previewResult.messages.map((msg: any, i: number) => (
                    <Typography key={i} variant="body2" color="text.secondary">• {msg.message}</Typography>
                  ))}
                  {previewResult.computed && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Computed:</Typography>
                      <pre style={{ fontSize: '11px', marginTop: 4 }}>
                        {JSON.stringify(previewResult.computed, null, 2)}
                      </pre>
                    </Box>
                  )}
                </div>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions className='!p-4 !pt-0'>
          <Button onClick={() => setPreviewDialogOpen(false)} variant='outlined' className='!text-gray-800 !border-gray-200'>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
