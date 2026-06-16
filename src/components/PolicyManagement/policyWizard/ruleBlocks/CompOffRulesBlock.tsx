import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const CompOffRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Validity (days)" value={localConfig.compOffValidityDays ?? 90} onChange={(e) => set('compOffValidityDays', parseInt(e.target.value) || 90)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Min OT Hours for Comp-off" value={localConfig.minOTHoursForCompOff ?? 4} onChange={(e) => set('minOTHoursForCompOff', parseFloat(e.target.value) || 4)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Max Balance (days)" value={localConfig.maxCompOffBalance ?? 5} onChange={(e) => set('maxCompOffBalance', parseInt(e.target.value) || 5)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.requiresManagerApproval} onChange={(e) => set('requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.autoExpireUnused} onChange={(e) => set('autoExpireUnused', e.target.checked)} />} label="Auto-Expire Unused" />
    </Grid>
  </Grid>
);
