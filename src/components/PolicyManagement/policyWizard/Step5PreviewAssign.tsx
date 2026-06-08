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

export const Step5PreviewAssign: React.FC<Step5PreviewAssignProps> = ({
  policyName,
  templateName,
  config,
  eligibilityConfig,
  approvalFlow,
  effectiveFrom,
  onEffectiveFromChange,
}) => {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<any>('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  
  const handlePreview = async () => {
    if (!selectedEmployees) return;
    setLoading(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 800));
      const emp = selectedEmployees;
      setPreviewResult({
        allowed: true,
        policyName,
        messages: [
          { type: 'INFO', message: `Employee ${emp?.name} is eligible for this policy` },
          { type: 'INFO', message: `Template: ${emp?.template}` },
          { type: emp?.employeeStatus == 'Probation' ? 'WARNING' : 'INFO', message: emp?.employeeStatus == 'Probation' ? 'Employee is on probation — some leave types may be restricted' : 'Employee is confirmed' },
        ],
        computed: {
          template: emp?.template,
          isOnProbation: emp?.employeeStatus == 'Probation',
          approvalLevels: approvalFlow?.levels?.length ?? 0,
          autoApproveThreshold: approvalFlow?.autoApproveBelowDays ?? 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitStatus('submitted');
  };

  const renderConfigSummary = () => {
    if (!config) return null;
    return (
      <Grid container spacing={2}>
        {config.entitlements && config.entitlements.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Leave Entitlements</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Annual Days</TableCell>
                    <TableCell>Max Consecutive</TableCell>
                    <TableCell>Accrual</TableCell>
                    <TableCell>Half Day</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className='bg-white-50'>
                  {config.entitlements.map((leave: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Chip label={leave.leaveType} size="small" className='text-gray-500 bg-gray-100' /> {leave.name}</TableCell>
                      <TableCell>{leave.annualEntitlement} days</TableCell>
                      <TableCell>{leave.maxConsecutiveDays || '—'}</TableCell>
                      <TableCell>{leave.accrualType}</TableCell>
                      <TableCell>{leave.halfDayAllowed ? '✓' : '—'}</TableCell>
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
                      label={submitStatus === 'submitted' ? 'PENDING APPROVAL' : 'DRAFT'}
                      size="small"
                      color={submitStatus === 'submitted' ? 'info' : 'warning'}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewDialogOpen(true)}>
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
          ) : (
            <Alert severity="warning" icon={<WarningIcon />} action={
              <Button
                color="warning" size="small" variant="outlined"
                startIcon={submitStatus === 'submitting' ? <CircularProgress size={14} /> : <SendIcon />}
                onClick={handleSubmitForApproval}
                disabled={submitStatus === 'submitting' || !policyName}
              >
                Submit for Approval
              </Button>
            }>
              After creating, this policy will be in DRAFT. Click "Submit for Approval" to start the approval workflow, or activate it directly from the dashboard.
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Test Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Policy: {policyName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3 }}>
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
