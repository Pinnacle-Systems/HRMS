import React from 'react';
import { Grid, Typography, TextField, Divider, FormControlLabel, Switch } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const ShiftRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle2" color="info" className='!mb-1'>Timing Thresholds</Typography>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Late Penalty After (min)" value={localConfig.shiftConfig?.latePenaltyAfterMinutes ?? 30} onChange={(e) => set('shiftConfig.latePenaltyAfterMinutes', parseInt(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Half Day Threshold (min)" value={localConfig.shiftConfig?.halfDayMinutes ?? 240} onChange={(e) => set('shiftConfig.halfDayMinutes', parseInt(e.target.value) || 0)} helperText="Min hours for half day" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Full Day Threshold (min)" value={localConfig.shiftConfig?.fullDayMinutes ?? 480} onChange={(e) => set('shiftConfig.fullDayMinutes', parseInt(e.target.value) || 0)} helperText="Min hours for full day" sx={helperSx} />
    </Grid>

    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color="info" sx={{ my: 1 }} >Check-in Settings</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Regularizations / Month" value={localConfig.shiftConfig?.regularizationAllowedPerMonth ?? 3} onChange={(e) => set('shiftConfig.regularizationAllowedPerMonth', parseInt(e.target.value) || 0)} helperText="Max attendance corrections allowed" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 2 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.shiftConfig?.biometricRequired} onChange={(e) => set('shiftConfig.biometricRequired', e.target.checked)} />} label="Biometric Required" />
    </Grid>
    <Grid size={{ xs: 12, md: 2 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.shiftConfig?.wfhAllowed} onChange={(e) => set('shiftConfig.wfhAllowed', e.target.checked)} />} label="WFH Allowed" />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.shiftConfig?.mobileCheckInAllowed} onChange={(e) => set('shiftConfig.mobileCheckInAllowed', e.target.checked)} />} label="Mobile Check-in Allowed" />
    </Grid>

    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color="info" sx={{ my: 1 }}>Absence Penalties</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Absent Deduction (days salary)" value={localConfig.penalties?.absentDeductionPerDay ?? 1} onChange={(e) => set('penalties.absentDeductionPerDay', parseFloat(e.target.value) || 1)} helperText="Salary days deducted per absent day" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="LWP After (days)" value={localConfig.penalties?.lwpAfterDays ?? 3} onChange={(e) => set('penalties.lwpAfterDays', parseInt(e.target.value) || 3)} helperText="Consecutive absences before LWP" sx={helperSx} />
    </Grid>
  </Grid>
);
