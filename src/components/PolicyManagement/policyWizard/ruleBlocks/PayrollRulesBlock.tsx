import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

export const PayrollRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Basic (% of CTC)" value={localConfig.payrollComponents?.basic?.percentage ?? 40} onChange={(e) => set('payrollComponents.basic.percentage', parseFloat(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="HRA (% of Basic)" value={localConfig.payrollComponents?.hra?.percentage ?? 40} onChange={(e) => set('payrollComponents.hra.percentage', parseFloat(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <FormControl fullWidth size="small">
        <InputLabel>HRA City Type</InputLabel>
        <Select value={localConfig.payrollComponents?.hra?.cityType || 'METRO'} sx={selectSx}
        onChange={(e) => set('payrollComponents.hra.cityType', e.target.value)}>
          <MenuItem value="METRO">Metro (50% exemption)</MenuItem>
          <MenuItem value="NON_METRO">Non-Metro (40% exemption)</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  </Grid>
);
