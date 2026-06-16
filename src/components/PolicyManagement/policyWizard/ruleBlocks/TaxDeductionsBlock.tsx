import React from 'react';
import { Grid, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { RuleBlockProps } from './types';

export const TaxDeductionsBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 2 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.tds?.applicable} onChange={(e) => set('tds.applicable', e.target.checked)} />} label="TDS Applicable" />
    </Grid>
    {localConfig.tds?.applicable && (
      <>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tax Regime</InputLabel>
            <Select value={localConfig.tds?.regime || 'NEW'} onChange={(e) => set('tds.regime', e.target.value)}>
              <MenuItem value="OLD">Old Regime (with deductions)</MenuItem>
              <MenuItem value="NEW">New Regime (lower rates, fewer deductions)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel control={<Switch checked={!!localConfig.tds?.declarationRequired} onChange={(e) => set('tds.declarationRequired', e.target.checked)} />} label="Declaration Required" />
        </Grid>
      </>
    )}
  </Grid>
);
