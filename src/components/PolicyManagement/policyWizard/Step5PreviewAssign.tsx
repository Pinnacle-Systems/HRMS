import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, TextField,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { MOCK_EMPLOYEES } from '../../../services/mockPolicyService';

interface Step5PreviewAssignProps {
  policyName: any;
  templateName?: string;
  config: any;
  eligibilityConfig: any;
  approvalFlow: any;
  effectiveFrom?: string;
  onEffectiveFromChange?: (date: string) => void;
}

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
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const sampleEmployees = MOCK_EMPLOYEES.map(e => ({
    id: e.id,
    name: e.name,
    role: e.designationId,
    department: e.departmentId,
    category: e.employeeCategory,
    isOnProbation: e.isOnProbation,
  }));

  const deptNames: Record<string,string> = { dept1:'Engineering', dept2:'Sales', dept3:'HR', dept4:'Production' };
  const desigNames: Record<string,string> = { des1:'Manager', des2:'Senior Engineer', des3:'Associate', des4:'Worker' };
  const catColors: Record<string,string> = { STAFF:'#1976d2', LABOUR:'#d32f2f', GROUND_WORKER:'#388e3c', SUPERVISOR:'#f57c00', TECHNICIAN:'#7b1fa2' };

  const handlePreview = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const emp = MOCK_EMPLOYEES.find(e => e.id === selectedEmployee);
      setPreviewResult({
        allowed: true,
        policyName,
        messages: [
          { type: 'INFO', message: `Employee ${emp?.name} is eligible for this policy` },
          { type: 'INFO', message: `Category: ${emp?.employeeCategory}` },
          { type: emp?.isOnProbation ? 'WARNING' : 'INFO', message: emp?.isOnProbation ? 'Employee is on probation — some leave types may be restricted' : 'Employee is confirmed' },
        ],
        computed: {
          employeeCategory: emp?.employeeCategory,
          isOnProbation: emp?.isOnProbation,
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
                <TableBody>
                  {config.entitlements.map((leave: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Chip label={leave.leaveType} size="small" /> {leave.name}</TableCell>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {approvalFlow.levels.map((level: any, i: number) => (
                <Chip key={i} label={`Level ${level.level}: ${level.approverType}`} variant="outlined" icon={<CheckIcon />} />
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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Policy Summary</Typography>
              <Divider sx={{ mb: 2 }} />
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
                  <TextField
                    fullWidth size="small" type="date" label="Effective From"
                    value={effectiveFrom || new Date().toISOString().split('T')[0]}
                    onChange={(e) => onEffectiveFromChange?.(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="When this policy takes effect"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Configuration Details</Typography>
              <Divider sx={{ mb: 2 }} />
              {renderConfigSummary()}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
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
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select an employee to see how this policy would apply to them.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Employee</InputLabel>
              <Select value={selectedEmployee} label="Select Employee"
                onChange={(e) => { setSelectedEmployee(e.target.value); setPreviewResult(null); }}>
                {sampleEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{emp.name} — {deptNames[emp.department] ?? emp.department} / {desigNames[emp.role] ?? emp.role}</span>
                      <Chip label={emp.category} size="small"
                        sx={{ bgcolor: catColors[emp.category] ?? '#999', color: '#fff', fontSize: '0.65rem' }} />
                      {emp.isOnProbation && <Chip label="Probation" size="small" color="warning" />}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button fullWidth variant="contained" onClick={handlePreview}
              disabled={!selectedEmployee || loading}>
              {loading ? <CircularProgress size={24} /> : 'Run Policy Test'}
            </Button>

            {previewResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Test Results</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
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
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
