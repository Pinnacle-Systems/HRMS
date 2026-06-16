import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const AccrualRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControl fullWidth>
        <InputLabel>Accrual Frequency</InputLabel>
        <Select value={localConfig?.accrualRules?.accrualFrequency || 'MONTHLY'} onChange={(e) => set('accrualRules.accrualFrequency', e.target.value)}>
          <MenuItem value="MONTHLY">Monthly</MenuItem>
          <MenuItem value="QUARTERLY">Quarterly</MenuItem>
          <MenuItem value="YEARLY">Yearly</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth type="number" label="Max Accrual (Days)" value={localConfig?.accrualRules?.maxAccrual || ''} onChange={(e) => set('accrualRules.maxAccrual', parseInt(e.target.value) || undefined)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControl fullWidth>
        <InputLabel>Leave Year Start</InputLabel>
        <Select value={localConfig?.accrualRules?.leaveYearStartMonth ?? 4} onChange={(e) => set('accrualRules.leaveYearStartMonth', Number(e.target.value))}>
          {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((m, i) => (<MenuItem key={i + 1} value={((i + 3) % 12) + 1}>{m}</MenuItem>))}
        </Select>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12, md: 8 }}>
      <FormControlLabel control={<Switch checked={!!localConfig?.accrualRules?.enableProRata} onChange={(e) => set('accrualRules.enableProRata', e.target.checked)} />} label="Enable Pro-rata Accrual" />
      <span className='text-gray-500 text-[12px]'>Leave accrual proportional to joining date (as per Indian Labour Laws)</span>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig?.accrualRules?.carryForwardUnused} onChange={(e) => set('accrualRules.carryForwardUnused', e.target.checked)} />} label="Carry Forward Unused Leave" />
    </Grid>
  </Grid>
);
