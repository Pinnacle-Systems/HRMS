import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, IconButton, Button, Chip, Divider,
  Tooltip, Alert, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon, ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { type ApprovalFlowConfig, type ApprovalLevel } from '../../../types/policy';
import { APPROVER_LABELS, AUTO_APPROVE_META, DEFAULT_META, helperSx } from '../const';
import type { Step4ApprovalFlowProps } from '../types';
import { policyService } from '../../../services';
import { useUI } from '../../../context/Snackbar';
import { selectSx } from '../../../const';

const EMPTY_CONFIG: ApprovalFlowConfig = {
  levels: [],
  autoApproveBelowDays: 0,
  parallelApproval: false,
  notifyOnSubmit: true,
  notifyOnApproval: true,
  rejectionRequiresReason: true,
};

function mapApiToConfig(data: any): ApprovalFlowConfig {
  return {
    levels: (data.levels ?? []).map((l: any) => ({
      id: l.id,
      level: l.levelNo ?? l.level,
      approverType: l.approverType,
      approverId: l.approverId,
      timeoutDays: l.timeoutDays,
      escalationTo: l.escalationTo,
    })),
    autoApproveBelowDays: data.autoApproveThreshold ?? 0,
    parallelApproval: data.parallelApproval ?? false,
    notifyOnSubmit: true,
    notifyOnApproval: true,
    rejectionRequiresReason: data.rejectionRequiresReason ?? true,
    fallbackApprover: data.fallbackApprover,
  };
}

export function buildFlowPayload(cfg: ApprovalFlowConfig) {
  return {
    autoApproveThreshold: cfg.autoApproveBelowDays,
    parallelApproval: cfg.parallelApproval ?? false,
    rejectionRequiresReason: cfg.rejectionRequiresReason ?? true,
    fallbackApprover: cfg.fallbackApprover ?? null,
  };
}

export function buildLevelPayload(level: ApprovalLevel) {
  return {
    levelNo: level.level,
    approverType: level.approverType,
    approverId: level.approverId ?? null,
    timeoutDays: level.timeoutDays ?? 2,
    escalationTo: level.escalationTo ?? null,
    conditionJson: level.condition ?? {},
  };
}

export const Step4ApprovalFlow: React.FC<Step4ApprovalFlowProps> = ({
  config,
  onChange,
  domain,
  versionId,
}) => {
  const [localConfig, setLocalConfig] = useState<ApprovalFlowConfig>(config ?? EMPTY_CONFIG);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useUI();
  const settingsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelDebounces = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const meta = (domain && AUTO_APPROVE_META[domain]) ? AUTO_APPROVE_META[domain] : DEFAULT_META;

  // Load existing flow when versionId is available
  useEffect(() => {
    if (!versionId) return;
    setLoading(true);
    policyService.getApprovalFlowByVersion(versionId)
      .then((res: any) => {
        if (res?.data) {
          const mapped = mapApiToConfig(res.data);
          setFlowId(res.data.id);
          setLocalConfig(mapped);
          onChange(mapped);
        }
      })
      .catch(() => {
        // No flow yet for this version — local state only until user adds a level
      })
      .finally(() => setLoading(false));
  }, [versionId]);

  // Ensure/create the flow and return its id
  const ensureFlow = async (cfg: ApprovalFlowConfig): Promise<string> => {
    if (flowId) return flowId;
    const res: any = await policyService.createApprovalFlow(versionId!, buildFlowPayload(cfg));
    const id: string = res.data.id;
    setFlowId(id);
    return id;
  };

  const pushConfig = (next: ApprovalFlowConfig) => {
    setLocalConfig(next);
    onChange(next);
  };

  // Debounced save of flow-level settings (autoApprove, parallelApproval, etc.)
  const saveFlowSettings = (next: ApprovalFlowConfig) => {
    if (!versionId) return;
    if (settingsDebounce.current) clearTimeout(settingsDebounce.current);
    settingsDebounce.current = setTimeout(async () => {
      try {
        if (flowId) {
          await policyService.updateApprovalFlow(flowId, buildFlowPayload(next));
        } else {
          const res: any = await policyService.createApprovalFlow(versionId, buildFlowPayload(next));
          setFlowId(res.data.id);
        }
      } catch {
        showSnackbar('Failed to save flow settings', 'error');
      }
    }, 800);
  };

  const updateConfig = (updates: Partial<ApprovalFlowConfig>) => {
    const next = { ...localConfig, ...updates };
    pushConfig(next);
    saveFlowSettings(next);
  };

  const addApprovalLevel = async () => {
    const newLevel: ApprovalLevel = {
      level: localConfig.levels.length + 1,
      approverType: 'REPORTING_MANAGER',
      timeoutDays: 2,
      escalationTo: 'HR',
    };

    if (!versionId) {
      pushConfig({ ...localConfig, levels: [...localConfig.levels, newLevel] });
      return;
    }

    setSaving(true);
    try {
      const fid = await ensureFlow(localConfig);
      const res: any = await policyService.createApprovalLevel(fid, buildLevelPayload(newLevel));
      const savedLevel: ApprovalLevel = { ...newLevel, id: res.data.id };
      pushConfig({ ...localConfig, levels: [...localConfig.levels, savedLevel] });
    } catch {
      showSnackbar('Failed to add approval level', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeApprovalLevel = async (index: number) => {
    const level = localConfig.levels[index];

    if (versionId && level.id) {
      setSaving(true);
      try {
        await policyService.deleteApprovalLevel(level.id);
      } catch {
        showSnackbar('Failed to remove approval level', 'error');
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    const newLevels = localConfig.levels
      .filter((_, i) => i !== index)
      .map((l, i) => ({ ...l, level: i + 1 }));
    pushConfig({ ...localConfig, levels: newLevels });
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    const swap = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...localConfig.levels];
    [reordered[index], reordered[swap]] = [reordered[swap], reordered[index]];
    const newLevels = reordered.map((l, i) => ({ ...l, level: i + 1 }));
    pushConfig({ ...localConfig, levels: newLevels });
  };

  const updateLevel = (index: number, updates: Partial<ApprovalLevel>) => {
    const newLevels = [...localConfig.levels];
    newLevels[index] = { ...newLevels[index], ...updates };
    pushConfig({ ...localConfig, levels: newLevels });

    if (!versionId || !newLevels[index].id) return;

    if (levelDebounces.current[index]) clearTimeout(levelDebounces.current[index]);
    levelDebounces.current[index] = setTimeout(async () => {
      try {
        await policyService.updateApprovalLevel(newLevels[index].id!, buildLevelPayload(newLevels[index]));
      } catch {
        showSnackbar('Failed to update approval level', 'error');
      }
    }, 800);
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center py-16">
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Configure Approval Workflow</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define who approves requests under this policy. You can have multiple sequential levels.
      </Typography>

      <Grid container spacing={3}>
        {/* Left column — settings */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" className='bg-white-50 text-gray-800' sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom color='info'>Auto-approval</Typography>
              <TextField
                fullWidth type="number" size="small"
                label={meta.label}
                value={localConfig.autoApproveBelowDays}
                onChange={(e) => updateConfig({ autoApproveBelowDays: parseInt(e.target.value) || 0 })}
                helperText={meta.helper}
                sx={{ my: 2, '& .MuiFormHelperText-root': { color: 'var(--text-primary)' } }}
              />
              <Typography variant="caption" color="text.secondary">
                Set to 0 to disable auto-approval.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }} className='bg-white-50 text-gray-800'>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom color='info'>Approval Mode</Typography>
              <FormControlLabel
                control={<Switch size="small" checked={!!localConfig.parallelApproval}
                  onChange={(e) => updateConfig({ parallelApproval: e.target.checked })} />}
                label="Parallel Approval" />
              <div className='text-[12px] text-gray-500 mb-2'>
                All approvers get notified at once. Sequential otherwise.
              </div>
              <FormControlLabel
                control={<Switch size="small" checked={localConfig.rejectionRequiresReason !== false}
                  onChange={(e) => updateConfig({ rejectionRequiresReason: e.target.checked })} />}
                label="Rejection Requires Reason" />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 2 }} className='bg-white-50 text-gray-800'>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom color='info'>Notifications</Typography>
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

          <Card variant="outlined" className='bg-white-50 text-gray-800'>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom color='info'>Fallback Approver</Typography>
              <FormControl fullWidth className='!mt-5'>
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
            <Button
              size="small"
              variant="outlined"
              startIcon={saving ? <CircularProgress size={14} /> : <AddIcon />}
              onClick={addApprovalLevel}
              disabled={saving}
            >
              Add Level
            </Button>
          </Box>

          {localConfig.levels.map((level, index) => (
            <Card key={level.id ?? index} sx={{ mb: 2 }} className='bg-white-50'>
              <CardContent>
                <Box className="flex justify-between items-center mb-2">
                  <Box className="flex items-center gap-1 mb-4">
                    <Chip label={`Level ${level.level}`} color="primary" size="small" />
                    <div className='text-[12px] text-gray-800 ml-2'>
                      {APPROVER_LABELS[level.approverType] ?? level.approverType}
                    </div>
                  </Box>
                  <Box>
                    <Tooltip title="Move up">
                      <span>
                        <IconButton size="small" onClick={() => moveLevel(index, 'up')} disabled={index === 0}>
                          <ArrowUpIcon fontSize="small" className={`${index === 0 ? 'text-gray-400 dark:text-[#6d7991]' : 'text-gray-800'}`} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton size="small" onClick={() => moveLevel(index, 'down')} disabled={index === localConfig.levels.length - 1}>
                          <ArrowDownIcon fontSize="small" className={`${index === localConfig.levels.length - 1 ? 'text-gray-400 dark:text-[#6d7991]' : 'text-gray-800'}`} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeApprovalLevel(index)} disabled={saving}>
                        <DeleteIcon fontSize="small" className='text-red-500' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Approver Type</InputLabel>
                      <Select value={level.approverType} label="Approver Type" sx={selectSx}
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
                      helperText="Days before escalation"
                      sx={helperSx} />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Escalate To</InputLabel>
                      <Select value={level.escalationTo || ''} label="Escalate To" sx={selectSx}
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
            <Alert severity="info" action={<Button color="info" size="small" onClick={addApprovalLevel} disabled={saving}>Add Level</Button>}>
              No approval levels. All requests will be auto-approved or use auto-approval threshold.
            </Alert>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Alert severity="success" variant="outlined" className='bg-white-50'>
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
