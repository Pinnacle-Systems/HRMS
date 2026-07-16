import React from 'react';
import {
  Box, Alert, Grid, FormControlLabel, Switch, Typography, IconButton, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, TextField,
  Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

export const LoanAdvanceRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const loanTypes = localConfig.loanAdvanceRules?.loanTypes || [];
  
  // Helper function to safely set nested properties
  const setNestedValue = (path: string, value: any) => {
    set(`loanAdvanceRules.${path}`, value);
  };

  const addLoan = () => {
    const newLoan = {
      type: 'SALARY_ADVANCE' as const,
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
    };
    setNestedValue('loanTypes', [...loanTypes, newLoan]);
  };

  const updateLoan = (index: number, field: string, value: any) => {
    const updated = [...loanTypes];
    updated[index] = { ...updated[index], [field]: value };
    setNestedValue('loanTypes', updated);
  };

  const removeLoan = (index: number) => {
    const updated = [...loanTypes];
    updated.splice(index, 1);
    setNestedValue('loanTypes', updated);
  };

  // Get nested values with safe fallbacks
  const approvalMatrix = localConfig.loanAdvanceRules?.approvalMatrix || {};
  
  // CRITICAL FIX: Ensure emiSkipRequest exists with all properties
  const repaymentRules = {
    emiSkipRequest: {
      allowed: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.emiSkipRequest?.allowed ?? false,
      maxSkipsPerYear: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.emiSkipRequest?.maxSkipsPerYear ?? 2,
      skipReasons: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.emiSkipRequest?.skipReasons ?? [],
      recoveryMethod: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.emiSkipRequest?.recoveryMethod ?? 'TENOR_EXTENSION',
      requiresApproval: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.emiSkipRequest?.requiresApproval ?? true,
    },
    earlyClosure: {
      allowed: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.earlyClosure?.allowed ?? true,
      processingFeePercentage: localConfig.loanAdvanceRules?.repaymentRecoveryRules?.earlyClosure?.processingFeePercentage ?? 2,
    }
  };

  const overlappingPolicy = {
    allowConcurrentLoans: localConfig.loanAdvanceRules?.overlappingLoanPolicy?.allowConcurrentLoans ?? true,
    maxTotalDeductionPercentage: localConfig.loanAdvanceRules?.overlappingLoanPolicy?.maxTotalDeductionPercentage ?? 50,
    pendingArrearHandling: localConfig.loanAdvanceRules?.overlappingLoanPolicy?.pendingArrearHandling ?? 'REJECT',
    maxActiveLoansCombined: localConfig.loanAdvanceRules?.overlappingLoanPolicy?.maxActiveLoansCombined ?? 3,
  };

  // Safe update functions for nested properties
  const updateEmiSkip = (field: string, value: any) => {
    setNestedValue(`repaymentRecoveryRules.emiSkipRequest.${field}`, value);
  };

  const updateEarlyClosure = (field: string, value: any) => {
    setNestedValue(`repaymentRecoveryRules.earlyClosure.${field}`, value);
  };

  const updateOverlappingPolicy = (field: string, value: any) => {
    setNestedValue(`overlappingLoanPolicy.${field}`, value);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Configure employee loan and salary advance policies. EMI deductions are processed via payroll each month.
      </Alert>

      {/* SECTION 1: SANCTIONING - Approval Matrix */}
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Approval Matrix</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={!!approvalMatrix.deductionFromSalary} 
                onChange={(e) => setNestedValue('approvalMatrix.deductionFromSalary', e.target.checked)} 
              />
            }
            label="Auto-deduct EMI from Salary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={!!approvalMatrix.requiresManagerApproval} 
                onChange={(e) => setNestedValue('approvalMatrix.requiresManagerApproval', e.target.checked)} 
              />
            }
            label="Manager Approval"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={!!approvalMatrix.requiresHRApproval} 
                onChange={(e) => setNestedValue('approvalMatrix.requiresHRApproval', e.target.checked)} 
              />
            }
            label="HR Approval"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={!!approvalMatrix.requiresFinanceApproval} 
                onChange={(e) => setNestedValue('approvalMatrix.requiresFinanceApproval', e.target.checked)} 
              />
            }
            label="Finance Approval"
          />
        </Grid>
      </Grid>

      {/* Loan Types */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" className="text-gray-700">Loan / Advance Types</Typography>
        <IconButton onClick={addLoan} size="small"><AddIcon className='!text-gray-800' /></IconButton>
      </Box>

      {loanTypes.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>No loan types configured. Click + to add one.</Alert>
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
                    <Select 
                      value={loan.type} 
                      label="Loan Type" 
                      onChange={(e) => updateLoan(index, 'type', e.target.value)} 
                      sx={selectSx}
                    >
                      <MenuItem value="SALARY_ADVANCE">Salary Advance</MenuItem>
                      <MenuItem value="PERSONAL_LOAN">Personal Loan</MenuItem>
                      <MenuItem value="FESTIVAL_ADVANCE">Festival Advance</MenuItem>
                      <MenuItem value="EDUCATION_LOAN">Education Loan</MenuItem>
                      <MenuItem value="MEDICAL_ADVANCE">Medical Advance</MenuItem>
                      <MenuItem value="VEHICLE_LOAN">Vehicle Loan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    label="Display Name" 
                    value={loan.name} 
                    onChange={(e) => updateLoan(index, 'name', e.target.value)} 
                    placeholder="e.g. Festival Advance" 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max Amount (₹)" 
                    value={loan.maxAmount ?? ''}
                    onChange={(e) => updateLoan(index, 'maxAmount', parseFloat(e.target.value) || 0)} 
                    placeholder="0 = use salary multiplier" 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max Monthly Salary Multiplier"
                    value={loan.maxMonthlyMultiplier ?? ''}
                    onChange={(e) => updateLoan(index, 'maxMonthlyMultiplier', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2 = 2× monthly salary" 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Interest Rate (% p.a.)"
                    value={loan.interestRate ?? 0} 
                    onChange={(e) => updateLoan(index, 'interestRate', parseFloat(e.target.value) || 0)}
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max Repayment (months)"
                    value={loan.maxRepaymentMonths ?? 12} 
                    onChange={(e) => updateLoan(index, 'maxRepaymentMonths', parseInt(e.target.value) || 1)} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max EMI (% of salary)"
                    value={loan.maxEMIPercentage ?? 40} 
                    onChange={(e) => updateLoan(index, 'maxEMIPercentage', parseFloat(e.target.value) || 0)}
                    slotProps={{ htmlInput: { min: 1, max: 100 } }} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Min Service (months)"
                    value={loan.minServiceMonths ?? 6} 
                    onChange={(e) => updateLoan(index, 'minServiceMonths', parseInt(e.target.value) || 0)} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Max Active Loans"
                    value={loan.maxActiveLoans ?? 1} 
                    onChange={(e) => updateLoan(index, 'maxActiveLoans', parseInt(e.target.value) || 1)} 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControlLabel 
                    className='!text-gray-800' 
                    control={
                      <Switch 
                        checked={!!loan.collateralRequired} 
                        onChange={(e) => updateLoan(index, 'collateralRequired', e.target.checked)} 
                      />
                    } 
                    label="Collateral Required" 
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControlLabel 
                    className='!text-gray-800' 
                    control={
                      <Switch 
                        checked={!!loan.preClosureAllowed} 
                        onChange={(e) => updateLoan(index, 'preClosureAllowed', e.target.checked)} 
                      />
                    } 
                    label="Pre-closure Allowed" 
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      {/* SECTION 2: REPAYMENT RECOVERY */}
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Repayment & Recovery Rules</Typography>
      
      <Accordion defaultExpanded sx={{ mb: 2 }} className='!bg-white-50 border border-gray-200'>
        <AccordionSummary expandIcon={<ExpandMoreIcon className='text-gray-800'/>}>
          <Typography className='text-gray-800'>EMI Skip Request</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={repaymentRules.emiSkipRequest.allowed} 
                    onChange={(e) => updateEmiSkip('allowed', e.target.checked)} 
                  />
                }
                label="Allow EMI Skip"
                className='text-gray-800'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Skips Per Year"
                value={repaymentRules.emiSkipRequest.maxSkipsPerYear}
                onChange={(e) => updateEmiSkip('maxSkipsPerYear', parseInt(e.target.value) || 0)}
                disabled={!repaymentRules.emiSkipRequest.allowed}
              />
            </Grid>
             <Grid size={{ xs: 12, md:3 }}>
              <FormControl fullWidth>
                <InputLabel>Skip Reasons</InputLabel>
                <Select
                  multiple
                  value={repaymentRules.emiSkipRequest.skipReasons}
                  label="Skip Reasons"
                  onChange={(e) => updateEmiSkip('skipReasons', e.target.value)}
                  disabled={!repaymentRules.emiSkipRequest.allowed}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  sx={selectSx}
                >
                  <MenuItem value="MEDICAL_EMERGENCY">Medical Emergency</MenuItem>
                  <MenuItem value="SALARY_CREDIT_DELAY">Salary Credit Delay</MenuItem>
                  <MenuItem value="FAMILY_EVENT">Family Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Recovery Method</InputLabel>
                <Select
                  value={repaymentRules.emiSkipRequest.recoveryMethod}
                  label="Recovery Method"
                  onChange={(e) => updateEmiSkip('recoveryMethod', e.target.value)}
                  disabled={!repaymentRules.emiSkipRequest.allowed}
                  sx={selectSx}
                >
                  <MenuItem value="TENOR_EXTENSION">Tenor Extension (Add 1 month)</MenuItem>
                  <MenuItem value="CATCH_UP">Catch Up (Double deduction next month)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={repaymentRules.emiSkipRequest.requiresApproval} 
                    onChange={(e) => updateEmiSkip('requiresApproval', e.target.checked)} 
                    disabled={!repaymentRules.emiSkipRequest.allowed}
                  />
                }
                label="Requires Approval"
                className='text-gray-800'
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded sx={{ mb: 2 }} className='!bg-white-50 border border-gray-200'>
        <AccordionSummary expandIcon={<ExpandMoreIcon className='text-gray-800'/>}>
          <Typography className='text-gray-800'>Early Closure</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={repaymentRules.earlyClosure.allowed} 
                    onChange={(e) => updateEarlyClosure('allowed', e.target.checked)} 
                  />
                }
                label="Allow Early Closure"
                className='text-gray-800'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Processing Fee (%)"
                value={repaymentRules.earlyClosure.processingFeePercentage}
                onChange={(e) => updateEarlyClosure('processingFeePercentage', parseFloat(e.target.value) || 0)}
                disabled={!repaymentRules.earlyClosure.allowed}
                slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      {/* SECTION 3: OVERLAPPING LOAN POLICY */}
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Overlapping Loan Policy</Typography>
      
      <Card variant="outlined" sx={{ mb: 2 }} className="!border-gray-200 bg-white-50">
        <CardContent >
          <Grid container spacing={2} className="!mt-4">
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={overlappingPolicy.allowConcurrentLoans} 
                    onChange={(e) => updateOverlappingPolicy('allowConcurrentLoans', e.target.checked)} 
                  />
                }
                label="Allow Concurrent Loans"
                className='text-gray-800'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Total Deduction (%)"
                value={overlappingPolicy.maxTotalDeductionPercentage}
                onChange={(e) => updateOverlappingPolicy('maxTotalDeductionPercentage', parseFloat(e.target.value) || 0)}
                slotProps={{ htmlInput: { min: 1, max: 100 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Active Loans Combined"
                value={overlappingPolicy.maxActiveLoansCombined}
                onChange={(e) => updateOverlappingPolicy('maxActiveLoansCombined', parseInt(e.target.value) || 1)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Pending Arrear Handling</InputLabel>
                <Select
                  value={overlappingPolicy.pendingArrearHandling}
                  label="Pending Arrear Handling"
                  onChange={(e) => updateOverlappingPolicy('pendingArrearHandling', e.target.value)}
                  sx={selectSx}
                >
                  <MenuItem value="REJECT">Reject New Loan</MenuItem>
                  <MenuItem value="CONSOLIDATE">Consolidate with New Loan</MenuItem>
                  <MenuItem value="PARALLEL_WITH_ADJUSTED_TENURE">Parallel with Adjusted Tenure</MenuItem>
                  <MenuItem value="MANUAL_OVERRIDE">Manual Override Required</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};