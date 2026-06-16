import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, Switch, Alert } from '@mui/material';
import type { RuleBlockProps } from './types';

export const HolidayRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Holiday Types</InputLabel>
        <Select multiple value={localConfig.holidayTypes || ['NATIONAL', 'STATE', 'COMPANY']} onChange={(e) => set('holidayTypes', e.target.value)}>
          <MenuItem value="NATIONAL">National Holidays (3 days)</MenuItem>
          <MenuItem value="STATE">State Holidays</MenuItem>
          <MenuItem value="COMPANY">Company Holidays</MenuItem>
          <MenuItem value="OPTIONAL">Optional Holidays</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField fullWidth size="small" type="number" label="Optional Holiday Quota" value={localConfig.optionalHolidayQuota ?? 2} onChange={(e) => set('optionalHolidayQuota', parseInt(e.target.value) || 0)} />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.workOnHolidayAllowed} onChange={(e) => set('workOnHolidayAllowed', e.target.checked)} />} label="Work on Holiday Allowed" />
    </Grid>
    <Grid size={{ xs: 12 }}>
      <Alert severity="info">As per Negotiable Instruments Act, 1881 - 3 national holidays: Republic Day, Independence Day, Gandhi Jayanti</Alert>
    </Grid>
  </Grid>
);
