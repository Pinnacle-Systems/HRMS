import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const WFHRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="WFH Days Per Month" value={localConfig.wfhDaysPerMonth ?? 8} onChange={(e) => set('wfhDaysPerMonth', parseInt(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Advance Notice (days)" value={localConfig.advanceNoticeDays ?? 1} onChange={(e) => set('advanceNoticeDays', parseInt(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.requiresManagerApproval} onChange={(e) => set('requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.geofencingEnabled} onChange={(e) => set('geofencingEnabled', e.target.checked)} />} label="Enable Geofencing" />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.eligibleAfterProbation} onChange={(e) => set('eligibleAfterProbation', e.target.checked)} />} label="Eligible After Probation" />
    </Grid>
  </Grid>
);
