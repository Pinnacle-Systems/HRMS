import React from 'react';
import {
  Box, Alert, Grid, FormControlLabel, Switch, Typography, IconButton, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

export const LoanAdvanceRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const loanTypes = localConfig.loanAdvanceRules?.loanTypes || [];

  const addLoan = () => set('loanAdvanceRules.loanTypes', [
    ...loanTypes,
    {
      type: 'SALARY_ADVANCE',
      name: '',
      maxAmount: 0,
      maxMonthlyMultiplier: 2,
      interestRate: 0,
      maxRepaymentMonths: 3,
      maxEMIPercentage: 50,
      minServiceMonths: 6,
      collateralRequired: false,
      preClosureAllowed: true,
      maxActiveLoans: 1,
    },
  ]);

  const updateLoan = (index: number, field: string, value: any) => {
    const updated = [...loanTypes];
    updated[index] = { ...updated[index], [field]: value };
    set('loanAdvanceRules.loanTypes', updated);
  };

  const removeLoan = (index: number) => {
    const updated = [...loanTypes];
    updated.splice(index, 1);
    set('loanAdvanceRules.loanTypes', updated);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Configure employee loan and salary advance policies. EMI deductions are processed via payroll each month.
      </Alert>

      {/* Global controls */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.loanAdvanceRules?.deductionFromSalary} onChange={(e) => set('loanAdvanceRules.deductionFromSalary', e.target.checked)} />}
            label="Auto-deduct EMI from Salary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.loanAdvanceRules?.requiresManagerApproval} onChange={(e) => set('loanAdvanceRules.requiresManagerApproval', e.target.checked)} />}
            label="Manager Approval"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.loanAdvanceRules?.requiresHRApproval} onChange={(e) => set('loanAdvanceRules.requiresHRApproval', e.target.checked)} />}
            label="HR Approval"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.loanAdvanceRules?.requiresFinanceApproval} onChange={(e) => set('loanAdvanceRules.requiresFinanceApproval', e.target.checked)} />}
            label="Finance Approval"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" className="text-gray-700">Loan / Advance Types</Typography>
        <IconButton onClick={addLoan} size="small"><AddIcon className='!text-gray-800' /></IconButton>
      </Box>

      {loanTypes.length === 0 ? (
        <Alert severity="warning">No loan types configured. Click + to add one.</Alert>
      ) : (
        loanTypes.map((loan, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }} className="!border-gray-200">
            <CardContent className='bg-white-50'>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <div className="text-gray-800 text-[12px] !mb-4">Loan Type {index + 1}</div>
                <IconButton size="small" onClick={() => removeLoan(index)}><DeleteIcon fontSize="small" className="text-red-500" /></IconButton>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loan Type</InputLabel>
                    <Select value={loan.type} label="Loan Type" onChange={(e) => updateLoan(index, 'type', e.target.value)} sx={selectSx}>
                      <MenuItem value="Salary Advance">Salary Advance</MenuItem>
                      <MenuItem value="Personal Loan">Personal Loan</MenuItem>
                      <MenuItem value="Festival Advance">Festival Advance</MenuItem>
                      <MenuItem value="Education Loan">Education Loan</MenuItem>
                      <MenuItem value="Medical Advance">Medical Advance</MenuItem>
                      <MenuItem value="Vehicle Loan">Vehicle Loan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth label="Display Name" value={loan.name} onChange={(e) => updateLoan(index, 'name', e.target.value)} placeholder="e.g. Festival Advance" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Max Amount (₹)" value={loan.maxAmount ?? ''}
                    onChange={(e) => updateLoan(index, 'maxAmount', parseFloat(e.target.value) || 0)} placeholder="0 = use salary multiplier" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Max Monthly Salary Multiplier"
                    value={loan.maxMonthlyMultiplier ?? ''}
                    onChange={(e) => updateLoan(index, 'maxMonthlyMultiplier', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2 = 2× monthly salary" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Interest Rate (% p.a.)"
                    value={loan.interestRate ?? 0} onChange={(e) => updateLoan(index, 'interestRate', parseFloat(e.target.value) || 0)}
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Max Repayment (months)"
                    value={loan.maxRepaymentMonths ?? 12} onChange={(e) => updateLoan(index, 'maxRepaymentMonths', parseInt(e.target.value) || 1)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Max EMI (% of salary)"
                    value={loan.maxEMIPercentage ?? 40} onChange={(e) => updateLoan(index, 'maxEMIPercentage', parseFloat(e.target.value) || 0)}
                    slotProps={{ htmlInput: { min: 1, max: 100 } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Min Service (months)"
                    value={loan.minServiceMonths ?? 6} onChange={(e) => updateLoan(index, 'minServiceMonths', parseInt(e.target.value) || 0)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Max Active Loans"
                    value={loan.maxActiveLoans ?? 1} onChange={(e) => updateLoan(index, 'maxActiveLoans', parseInt(e.target.value) || 1)} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControlLabel className='!text-gray-800' control={<Switch checked={!!loan.collateralRequired} onChange={(e) => updateLoan(index, 'collateralRequired', e.target.checked)} />} label="Collateral Required" />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControlLabel className='!text-gray-800' control={<Switch checked={!!loan.preClosureAllowed} onChange={(e) => updateLoan(index, 'preClosureAllowed', e.target.checked)} />} label="Pre-closure Allowed" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};
