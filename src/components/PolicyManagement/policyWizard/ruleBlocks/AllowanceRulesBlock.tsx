import React from 'react';
import { Box, Alert, Typography, IconButton, Card, CardContent, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RuleBlockProps } from './types';
import { useAllowanceList } from '../../../../hooks/useAllowance';
import { DynamicSelectWithAdd } from '../../../SelectField';
import { policyService } from '../../../../services/modules/policy';
import { useUI } from '../../../../context/Snackbar';

export const AllowanceRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const allowances = localConfig.allowances || [];  
  const { allowanceList, refetch } = useAllowanceList();
  const { showSnackbar } = useUI();

  const addAllowance = () => set('allowances', [...allowances, { type: 'HRA', taxExempt: false }]);
  const updateAllowance = (index: number, field: string, value: any) => {
    const updated = [...allowances];
    updated[index] = { ...updated[index], [field]: value };
    set('allowances', updated);
  };
  const removeAllowance = (index: number) => {
    const updated = [...allowances];
    updated.splice(index, 1);
    set('allowances', updated);
  };

  const addNewAllowance = async (newOption: any) => {
    try {
      const payload = {
        name: newOption,
        code: newOption.toUpperCase().split(" ")[0],
        active: true,
      };
      await policyService.createAllowance(payload);
      await refetch();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>Income Tax Act, 1961 - Allowances with tax exemptions</Alert>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1">Allowances</Typography>
        <IconButton onClick={addAllowance} size="small"><AddIcon /></IconButton>
      </Box>
      {allowances.map((allowance, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 2 }} className='!border-gray-200'>
          <CardContent className='!bg-white-50 !border-gray-200'>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" className='!mb-3 text-gray-800'>Allowance {index + 1}</Typography>
              <IconButton size="small" onClick={() => removeAllowance(index)}><DeleteIcon fontSize="small" className='text-red-500' /></IconButton>
            </Box>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  {/* <InputLabel>Allowance Type</InputLabel> */}
                  {/* <Select value={allowance.type || ''}
                    onChange={(e) => updateAllowance(index, 'type', e.target.value)}>
                    {
                      allowanceList.map((item) => (
                        <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>
                      ))
                    }
                  </Select> */}
                  <DynamicSelectWithAdd
                    label="Allowance Type"
                    title="Allowance Type"
                    value={allowance.type || ""}
                    disabled={false}
                    onChange={(value) => {
                      const selectedItem = allowanceList.find(item => item.name === value);
                      updateAllowance(index, 'type', selectedItem?.code || '');
                    }}
                    options={allowanceList.map(item => item.name)}
                    onAddOption={(newOption) => {
                      addNewAllowance(newOption)
                    }}
                    showAddButton={true}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth type="number" label="Percentage" value={allowance.percentage ?? ''} onChange={(e) => updateAllowance(index, 'percentage', parseFloat(e.target.value) || undefined)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth type="number" label="Fixed Amount (₹)" value={allowance.fixedAmount ?? ''} onChange={(e) => updateAllowance(index, 'fixedAmount', parseFloat(e.target.value) || undefined)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Basis</InputLabel>
                  <Select value={allowance.basis || ''} onChange={(e) => updateAllowance(index, 'basis', e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="BASIC">Basic</MenuItem>
                    <MenuItem value="CTC">CTC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} className="text-center text-gray-800">
                <FormControlLabel control={<Switch checked={!!allowance.taxExempt} onChange={(e) => updateAllowance(index, 'taxExempt', e.target.checked)} />} label="Tax Exempt" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      {(allowances.length === 0) && (
        <Alert severity="info">No allowance configured. Click + to Add create allowance.</Alert>
      )}
    </Box>
  );
};