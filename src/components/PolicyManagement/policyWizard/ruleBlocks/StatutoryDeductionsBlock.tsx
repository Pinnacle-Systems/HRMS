import React from 'react';
import { Grid, Typography, Divider, TextField, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

interface StatutoryDeductionsBlockProps extends RuleBlockProps {
  states: any[];
}

export const StatutoryDeductionsBlock: React.FC<StatutoryDeductionsBlockProps> = ({ localConfig, set, states }) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color='info'>PF (Employees' Provident Fund - 12% as per EPF Act)</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Employee PF (%)" value={localConfig.pf?.employeeContribution ?? 12} onChange={(e) => set('pf.employeeContribution', parseFloat(e.target.value) || 12)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Employer PF (%)" value={localConfig.pf?.employerContribution ?? 12} onChange={(e) => set('pf.employerContribution', parseFloat(e.target.value) || 12)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="PF Wage Ceiling (₹)" value={localConfig.pf?.ceiling ?? 15000} onChange={(e) => set('pf.ceiling', parseFloat(e.target.value) || 15000)} />
    </Grid>

    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>ESI (Employee State Insurance - as per ESI Act, 1948)</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Employee ESI (%)" value={localConfig.esi?.employeeContribution ?? 0.75} onChange={(e) => set('esi.employeeContribution', parseFloat(e.target.value) || 0.75)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Employer ESI (%)" value={localConfig.esi?.employerContribution ?? 3.25} onChange={(e) => set('esi.employerContribution', parseFloat(e.target.value) || 3.25)} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="ESI Limit (₹)" value={localConfig.esi?.applicableBelowCTC ?? 21000} onChange={(e) => set('esi.applicableBelowCTC', parseFloat(e.target.value) || 21000)} />
    </Grid>

    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>Professional Tax (State specific)</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <FormControlLabel control={<Switch checked={!!localConfig.professionalTax?.applicable} onChange={(e) => set('professionalTax.applicable', e.target.checked)} />} label="Professional Tax Applicable" />
    </Grid>
    {localConfig.professionalTax?.applicable && (
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel>State</InputLabel>
          <Select value={localConfig.professionalTax?.state} onChange={(e) => set('professionalTax.state', e.target.value)}>
            {states.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
    )}

    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>Gratuity (Payment of Gratuity Act, 1972)</Typography></Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Eligible After (years)" value={localConfig.gratuity?.eligibleAfterYears ?? 5} onChange={(e) => set('gratuity.eligibleAfterYears', parseInt(e.target.value) || 5)} helperText="Statutory: 5 years" sx={helperSx} />
    </Grid>
    <Grid size={{ xs: 12, md: 3 }}>
      <TextField fullWidth size="small" type="number" label="Rate (days/year)" value={localConfig.gratuity?.rate ?? 15} onChange={(e) => set('gratuity.rate', parseInt(e.target.value) || 15)} />
    </Grid>
  </Grid>
);
