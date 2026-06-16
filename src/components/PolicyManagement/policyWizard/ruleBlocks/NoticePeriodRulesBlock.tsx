import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const NoticePeriodRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Default (days)" value={localConfig.noticeDays?.DEFAULT ?? 30} onChange={(e) => set('noticeDays.DEFAULT', parseInt(e.target.value) || 30)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Manager (days)" value={localConfig.noticeDays?.MANAGER ?? 60} onChange={(e) => set('noticeDays.MANAGER', parseInt(e.target.value) || 60)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="During Probation (days)" value={localConfig.noticeDuringProbation ?? 7} onChange={(e) => set('noticeDuringProbation', parseInt(e.target.value) || 7)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.buyOutAllowed} onChange={(e) => set('buyOutAllowed', e.target.checked)} />} label="Notice Period Buy-out Allowed" />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.gardenLeaveAllowed} onChange={(e) => set('gardenLeaveAllowed', e.target.checked)} />} label="Garden Leave Allowed" />
    </Grid>
  </Grid>
);
