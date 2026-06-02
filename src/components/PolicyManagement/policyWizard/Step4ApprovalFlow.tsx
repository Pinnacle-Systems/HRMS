import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, IconButton, Button, Chip, Divider,
  Tooltip, Alert, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon, ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { type ApprovalFlowConfig, type ApprovalLevel, PolicyDomain } from '../../../types/policy';

interface Step4ApprovalFlowProps {
  config: ApprovalFlowConfig | null;
  onChange: (config: ApprovalFlowConfig) => void;
  domain?: string;
}

// Domain-aware auto-approve label / unit
const AUTO_APPROVE_META: Record<string, { label: string; unit: string; helper: string }> = {
  [PolicyDomain.LEAVE]:    { label: 'Auto-approve below (days)', unit: 'days', helper: 'Leave requests shorter than this are auto-approved' },
  [PolicyDomain.EXPENSE]:  { label: 'Auto-approve below (₹)',    unit: '₹',    helper: 'Expense claims under this amount are auto-approved' },
  [PolicyDomain.OVERTIME]: { label: 'Auto-approve below (hours)',unit: 'hrs',  helper: 'Overtime requests under this duration are auto-approved' },
  [PolicyDomain.COMP_OFF]: { label: 'Auto-approve below (days)', unit: 'days', helper: 'Comp-off requests shorter than this are auto-approved' },
  [PolicyDomain.WORK_FROM_HOME]: { label: 'Auto-approve below (days)', unit: 'days', helper: 'WFH requests shorter than this are auto-approved' },
};

const DEFAULT_META = { label: 'Auto-approve threshold', unit: 'units', helper: 'Requests below this threshold are auto-approved' };

export const Step4ApprovalFlow: React.FC<Step4ApprovalFlowProps> = ({ config, onChange, domain }) => {
  const [localConfig, setLocalConfig] = useState<ApprovalFlowConfig>(
    config || { levels: [], autoApproveBelowDays: 0, parallelApproval: false, notifyOnSubmit: true, notifyOnApproval: true, rejectionRequiresReason: true }
  );

  const meta = (domain && AUTO_APPROVE_META[domain]) ? AUTO_APPROVE_META[domain] : DEFAULT_META;

  const updateConfig = (updates: Partial<ApprovalFlowConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const addApprovalLevel = () => {
    const newLevel: ApprovalLevel = {
      level: localConfig.levels.length + 1,
      approverType: 'REPORTING_MANAGER',
      timeoutDays: 2,
      escalationTo: 'HR',
    };
    updateConfig({ levels: [...localConfig.levels, newLevel] });
  };

  const removeApprovalLevel = (index: number) => {
    const newLevels = localConfig.levels.filter((_, i) => i !== index);
    newLevels.forEach((l, i) => { l.level = i + 1; });
    updateConfig({ levels: newLevels });
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    const newLevels = [...localConfig.levels];
    const swap = direction === 'up' ? index - 1 : index + 1;
    [newLevels[index], newLevels[swap]] = [newLevels[swap], newLevels[index]];
    newLevels.forEach((l, i) => { l.level = i + 1; });
    updateConfig({ levels: newLevels });
  };

  const updateLevel = (index: number, updates: Partial<ApprovalLevel>) => {
    const newLevels = [...localConfig.levels];
    newLevels[index] = { ...newLevels[index], ...updates };
    updateConfig({ levels: newLevels });
  };

  const APPROVER_LABELS: Record<string, string> = {
    REPORTING_MANAGER: 'Reporting Manager',
    HR:                'HR Department',
    DEPARTMENT_HEAD:   'Department Head',
    ADMIN:             'System Admin',
    SPECIFIC_USER:     'Specific User',
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Configure Approval Workflow</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define who approves requests under this policy. You can have multiple sequential levels.
      </Typography>

      <Grid container spacing={3}>
        {/* Left column — settings */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Auto-approval</Typography>
              <TextField
                fullWidth type="number" size="small"
                label={meta.label}
                value={localConfig.autoApproveBelowDays}
                onChange={(e) => updateConfig({ autoApproveBelowDays: parseInt(e.target.value) || 0 })}
                helperText={meta.helper}
                sx={{ mb: 1, '& .MuiFormHelperText-root': { color: 'var(--text-primary)' } }}
              />
              <Typography variant="caption" color="text.secondary">
                Set to 0 to disable auto-approval.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Approval Mode</Typography>
              <FormControlLabel
                control={<Switch size="small" checked={!!localConfig.parallelApproval}
                  onChange={(e) => updateConfig({ parallelApproval: e.target.checked })} />}
                label="Parallel Approval" />
              <Typography variant="caption" sx={{ mb: 1.5 }}>
                All approvers get notified at once. Sequential otherwise.
              </Typography>
              <FormControlLabel
                control={<Switch size="small" checked={localConfig.rejectionRequiresReason !== false}
                  onChange={(e) => updateConfig({ rejectionRequiresReason: e.target.checked })} />}
                label="Rejection Requires Reason" />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Notifications</Typography>
              <FormControlLabel
                control={<Switch size="small" checked={localConfig.notifyOnSubmit !== false}
                  onChange={(e) => updateConfig({ notifyOnSubmit: e.target.checked })} />}
                label="Notify approver on submit" />
              <FormControlLabel
                control={<Switch size="small" checked={localConfig.notifyOnApproval !== false}
                  onChange={(e) => updateConfig({ notifyOnApproval: e.target.checked })} />}
                label="Notify employee on decision" />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Fallback Approver</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>If all levels unavailable</InputLabel>
                <Select value={localConfig.fallbackApprover || ''} label="If all levels unavailable"
                  onChange={(e) => updateConfig({ fallbackApprover: e.target.value || undefined })}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="HR">HR Department</MenuItem>
                  <MenuItem value="ADMIN">System Admin</MenuItem>
                  <MenuItem value="DEPARTMENT_HEAD">Department Head</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column — approval levels */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box className="flex justify-between items-center mb-2">
            <Typography variant="subtitle2">
              Approval Levels
              {localConfig.parallelApproval && (
                <Chip label="Parallel" size="small" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addApprovalLevel}>
              Add Level
            </Button>
          </Box>

          {localConfig.levels.map((level, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box className="flex justify-between items-center mb-2">
                  <Box className="flex items-center gap-1">
                    <Chip label={`Level ${level.level}`} color="primary" size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {APPROVER_LABELS[level.approverType] ?? level.approverType}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Move up">
                      <span>
                        <IconButton size="small" onClick={() => moveLevel(index, 'up')} disabled={index === 0}>
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton size="small" onClick={() => moveLevel(index, 'down')} disabled={index === localConfig.levels.length - 1}>
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeApprovalLevel(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Approver Type</InputLabel>
                      <Select value={level.approverType} label="Approver Type"
                        onChange={(e) => updateLevel(index, { approverType: e.target.value as any })}>
                        <MenuItem value="REPORTING_MANAGER">Reporting Manager</MenuItem>
                        <MenuItem value="DEPARTMENT_HEAD">Department Head</MenuItem>
                        <MenuItem value="HR">HR Department</MenuItem>
                        <MenuItem value="ADMIN">System Admin</MenuItem>
                        <MenuItem value="SPECIFIC_USER">Specific User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {level.approverType === 'SPECIFIC_USER' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth size="small" label="User ID or Email"
                        placeholder="Enter user ID or email"
                        value={level.approverId || ''}
                        onChange={(e) => updateLevel(index, { approverId: e.target.value })} />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth type="number" size="small" label="Timeout (days)"
                      value={level.timeoutDays ?? 2}
                      onChange={(e) => updateLevel(index, { timeoutDays: parseInt(e.target.value) })}
                      helperText="Days before escalation" />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Escalate To</InputLabel>
                      <Select value={level.escalationTo || ''} label="Escalate To"
                        onChange={(e) => updateLevel(index, { escalationTo: e.target.value || undefined })}>
                        <MenuItem value="">No escalation</MenuItem>
                        <MenuItem value="NEXT_LEVEL">Next Level</MenuItem>
                        <MenuItem value="HR">HR Department</MenuItem>
                        <MenuItem value="ADMIN">System Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          {localConfig.levels.length === 0 && (
            <Alert severity="info" action={<Button color="info" size="small" onClick={addApprovalLevel}>Add Level</Button>}>
              No approval levels. All requests will be auto-approved or use auto-approval threshold.
            </Alert>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Alert severity="success" variant="outlined">
        <Typography variant="body2">
          This workflow applies to all {domain ? domain.replace(/_/g, ' ').toLowerCase() : ''} requests under this policy.
          {localConfig.parallelApproval
            ? ' All approvers are notified simultaneously.'
            : ' Approvers are notified in sequence — Level 1 first.'}
        </Typography>
      </Alert>
    </Box>
  );
};
