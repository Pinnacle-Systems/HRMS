import React from 'react';
import {
  Box, Alert, Grid, TextField, FormControlLabel, Switch, Typography, IconButton,
  Card, CardContent, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

export const BonusRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const bonusTypes = localConfig.bonusRules?.bonusTypes || [];

  const addBonus = () => set('bonusRules.bonusTypes', [
    ...bonusTypes,
    {
      type: 'ANNUAL',
      name: '',
      calculationBasis: 'BASIC',
      percentage: 8.33,
      payoutFrequency: 'ANNUAL',
      payoutMonth: 3,
      eligibilityMonths: 6,
      performanceLinked: false,
      prorationApplicable: true,
      clawbackPeriodMonths: 0,
      taxable: true,
    },
  ]);

  const updateBonus = (index: number, field: string, value: any) => {
    const updated = [...bonusTypes];
    updated[index] = { ...updated[index], [field]: value };
    set('bonusRules.bonusTypes', updated);
  };

  const removeBonus = (index: number) => {
    const updated = [...bonusTypes];
    updated.splice(index, 1);
    set('bonusRules.bonusTypes', updated);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 4 }}>
        Payment of Bonus Act, 1965 — Minimum bonus: 8.33% of annual wages (max ₹7,000/month ceiling). Applicable to employees earning up to ₹21,000/month.
      </Alert>

      {/* Global controls */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            fullWidth size="small" type="number" label="Budget Cap (% of payroll)"
            value={localConfig.bonusRules?.budgetCapPercentage ?? 15}
            onChange={(e) => set('bonusRules.budgetCapPercentage', parseFloat(e.target.value) || 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.bonusRules?.requiresManagerApproval} onChange={(e) => set('bonusRules.requiresManagerApproval', e.target.checked)} />}
            label="Manager Approval"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.bonusRules?.requiresHRApproval} onChange={(e) => set('bonusRules.requiresHRApproval', e.target.checked)} />}
            label="HR Approval"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" className="text-gray-700">Bonus Types</Typography>
        <IconButton onClick={addBonus} size="small"><AddIcon /></IconButton>
      </Box>

      {bonusTypes.length === 0 ? (
        <Alert severity="warning">No bonus types configured. Click + to add one.</Alert>
      ) : (
        bonusTypes.map((bonus, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }} className="!border-gray-200">
            <CardContent className='bg-white-50'>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" className="text-gray-800">Bonus {index + 1}</Typography>
                <IconButton size="small" onClick={() => removeBonus(index)}><DeleteIcon fontSize="small" className="text-red-500" /></IconButton>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Bonus Type</InputLabel>
                    <Select value={bonus.type} label="Bonus Type" onChange={(e) => updateBonus(index, 'type', e.target.value)} sx={selectSx}>
                      <MenuItem value="ANNUAL">Annual Bonus</MenuItem>
                      <MenuItem value="PERFORMANCE">Performance Bonus</MenuItem>
                      <MenuItem value="FESTIVAL">Festival Bonus</MenuItem>
                      <MenuItem value="RETENTION">Retention Bonus</MenuItem>
                      <MenuItem value="REFERRAL">Referral Bonus</MenuItem>
                      <MenuItem value="JOINING">Joining Bonus</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth label="Display Name" value={bonus.name} onChange={(e) => updateBonus(index, 'name', e.target.value)} placeholder="e.g. Diwali Bonus" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Calculation Basis</InputLabel>
                    <Select value={bonus.calculationBasis} label="Calculation Basis" sx={selectSx}
                    onChange={(e) => updateBonus(index, 'calculationBasis', e.target.value)}>
                      <MenuItem value="BASIC">Basic Salary</MenuItem>
                      <MenuItem value="GROSS">Gross Salary</MenuItem>
                      <MenuItem value="CTC">CTC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payout Frequency</InputLabel>
                    <Select value={bonus.payoutFrequency} label="Payout Frequency" sx={selectSx}
                    onChange={(e) => updateBonus(index, 'payoutFrequency', e.target.value)}>
                      <MenuItem value="ANNUAL">Annual</MenuItem>
                      <MenuItem value="SEMI_ANNUAL">Semi-Annual</MenuItem>
                      <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                      <MenuItem value="ONE_TIME">One-Time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Percentage (%)" value={bonus.percentage ?? ''} onChange={(e) => updateBonus(index, 'percentage', parseFloat(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Fixed Amount (₹)" value={bonus.fixedAmount ?? ''} onChange={(e) => updateBonus(index, 'fixedAmount', parseFloat(e.target.value) || undefined)} placeholder="0 = use %" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Payout Month" value={bonus.payoutMonth ?? ''} onChange={(e) => updateBonus(index, 'payoutMonth', parseInt(e.target.value) || undefined)}
                    slotProps={{ htmlInput: { min: 1, max: 12 } }} placeholder="1–12" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Min Service (months)" value={bonus.eligibilityMonths ?? 6} onChange={(e) => updateBonus(index, 'eligibilityMonths', parseInt(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Clawback Period (months)" value={bonus.clawbackPeriodMonths ?? 0} onChange={(e) => updateBonus(index, 'clawbackPeriodMonths', parseInt(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControlLabel className='!text-gray-800' control={<Switch checked={!!bonus.performanceLinked} onChange={(e) => updateBonus(index, 'performanceLinked', e.target.checked)} />} label="Performance Linked" />
                </Grid>
                {bonus.performanceLinked && (
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField fullWidth size="small" type="number" label="Min Rating (1–5)" value={bonus.minPerformanceRating ?? 3}
                      onChange={(e) => updateBonus(index, 'minPerformanceRating', parseFloat(e.target.value) || 3)}
                      slotProps={{ htmlInput: { min: 1, max: 5, step: 0.5 } }} />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControlLabel className='!text-gray-800' control={<Switch checked={!!bonus.prorationApplicable} onChange={(e) => updateBonus(index, 'prorationApplicable', e.target.checked)} />} label="Pro-rata Applicable" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControlLabel className='!text-gray-800' control={<Switch checked={!!bonus.taxable} onChange={(e) => updateBonus(index, 'taxable', e.target.checked)} />} label="Taxable (TDS)" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};
