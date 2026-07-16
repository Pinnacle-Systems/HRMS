import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const ProbationRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Probation Duration (days)" value={localConfig.probationDuration ?? 90} onChange={(e) => set('probationDuration', parseInt(e.target.value) || 0)} helperText="Standard: 3 months (90 days)" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Salary % During Probation" value={localConfig.salaryPercentageDuringProbation ?? 100} 
      slotProps={{ htmlInput: { max: 100, min: 0 } }}
      onChange={(e) => set('salaryPercentageDuringProbation', parseInt(e.target.value) || 100)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.benefitsEligible} onChange={(e) => set('benefitsEligible', e.target.checked)} />} label="Benefits Eligible" />
    </Grid>
     <Grid size={{ xs: 12, md: 3 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.performanceReviewRequired} onChange={(e) => set('performanceReviewRequired', e.target.checked)} />} label="Performance Review Required" />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.extensionAllowed} onChange={(e) => set('extensionAllowed', e.target.checked)} />} label="Extension Allowed" />
    </Grid>
    {localConfig.extensionAllowed && (
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max Extension (days)" value={localConfig.maxExtensionDays ?? 90} onChange={(e) => set('maxExtensionDays', parseInt(e.target.value) || 0)} />
      </Grid>
    )}
  </Grid>
);
