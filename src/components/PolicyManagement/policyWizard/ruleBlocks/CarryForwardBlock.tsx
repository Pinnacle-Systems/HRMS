import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const CarryForwardBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Max Carry Forward (Days)" value={localConfig?.carryForward?.maxDays || 30} onChange={(e) => set('carryForward.maxDays', parseInt(e.target.value) || 0)} helperText="As per Factories Act, max 30 days" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Valid Until (Months)" value={localConfig?.carryForward?.validUntilMonths || 3} onChange={(e) => set('carryForward.validUntilMonths', parseInt(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig?.carryForward?.allowEncashment} onChange={(e) => set('carryForward.allowEncashment', e.target.checked)} />} label="Allow Encashment" />
    </Grid>
  </Grid>
);
