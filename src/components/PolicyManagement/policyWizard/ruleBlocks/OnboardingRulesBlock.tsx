import React from 'react';
import { Grid, TextField, FormControlLabel, Switch, Divider, Box, Typography, IconButton, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const OnboardingRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const tasks: string[] = localConfig.onboardingTasks || [];
  const addTask = () => set('onboardingTasks', [...tasks, '']);
  const updateTask = (i: number, val: string) => {
    const updated = [...tasks]; updated[i] = val; set('onboardingTasks', updated);
  };
  const removeTask = (i: number) => set('onboardingTasks', tasks.filter((_, idx) => idx !== i));

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Probation Duration (days)" value={localConfig.probationDuration ?? 90} onChange={(e) => set('probationDuration', parseInt(e.target.value) || 90)} helperText="Duration of probation period" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.trainingRequired} onChange={(e) => set('trainingRequired', e.target.checked)} />} label="Training Required" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.mentorAssigned} onChange={(e) => set('mentorAssigned', e.target.checked)} />} label="Assign Mentor" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.backgroundVerificationRequired} onChange={(e) => set('backgroundVerificationRequired', e.target.checked)} />} label="Background Verification" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.buddySystemEnabled} onChange={(e) => set('buddySystemEnabled', e.target.checked)} />} label="Buddy System" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Induction Duration (days)" value={localConfig.inductionDurationDays ?? 7} onChange={(e) => set('inductionDurationDays', parseInt(e.target.value) || 0)} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Onboarding Task Checklist</Typography>
          <IconButton size="small" onClick={addTask} color="primary"><AddIcon /></IconButton>
        </Box>
        {tasks.length === 0 && (
          <Alert severity="info">No tasks added. Click + to add onboarding tasks.</Alert>
        )}
        {tasks.map((task, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth size="small"
              placeholder={`Task ${i + 1}`}
              value={task}
              onChange={(e) => updateTask(i, e.target.value)}
            />
            <IconButton size="small" onClick={() => removeTask(i)}>
              <DeleteIcon fontSize="small" className='text-red-500' />
            </IconButton>
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};
