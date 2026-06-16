import React from 'react';
import {
  Box, Alert, IconButton, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, FormControl, Select, MenuItem, TextField, Switch, Grid, FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { chipSx } from '../../const';
import type { ExpenseCat } from '../../types';
import type { RuleBlockProps } from './types';

interface ExpenseLimitsBlockProps extends RuleBlockProps {
  expenseCategory: ExpenseCat[];
}

export const ExpenseLimitsBlock: React.FC<ExpenseLimitsBlockProps> = ({ localConfig, set, expenseCategory }) => {
  const expenseLimits = (localConfig.expenseLimits || {}) as Record<string, any>;
  const rows = Object.entries(expenseLimits);
  const usedNames = new Set(Object.keys(expenseLimits));

  const addExpenseRow = () => {
    const available = expenseCategory.find((cat) => !usedNames.has(cat.name));
    if (!available) return;
    set('expenseLimits', { ...expenseLimits, [available.name]: { daily: '', monthly: '', requiresReceipt: false } });
  };

  const deleteExpenseRow = (catName: string) => {
    const updated = { ...expenseLimits };
    delete updated[catName];
    set('expenseLimits', updated);
  };

  const changeExpenseCategory = (oldName: string, newName: string) => {
    const updated: Record<string, any> = {};
    for (const [key, val] of Object.entries(expenseLimits)) {
      updated[key === oldName ? newName : key] = val;
    }
    set('expenseLimits', updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Alert severity="info" sx={{ flex: 1, mr: 2 }}>As per Income Tax Act, 1961 - Expense reimbursement limits for tax exemption</Alert>
        <IconButton onClick={addExpenseRow} color="primary" size="small" disabled={rows.length >= expenseCategory.length}><AddIcon /></IconButton>
      </Box>
      <TableContainer className='border border-gray-200'>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Category</TableCell>
              <TableCell>Daily Limit (₹)</TableCell>
              <TableCell>Monthly Limit (₹)</TableCell>
              <TableCell>Requires Receipt</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <div className='!p-4 text-gray-400'>No expense limits configured. Click + to add.</div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(([catName, limits]) => (
                <TableRow key={catName}>
                  <TableCell>
                    <FormControl size="small">
                      <Select
                        value={catName}
                        onChange={(e) => changeExpenseCategory(catName, e.target.value)}
                        sx={chipSx}
                      >
                        {expenseCategory.map((cat) => (
                          <MenuItem key={cat.id} value={cat.name} disabled={usedNames.has(cat.name) && cat.name !== catName}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" sx={{ width: 100, "& .MuiInputBase-input": { padding: "5px 10px" } }}
                      value={limits.daily ?? ''}
                      onChange={(e) => { const v = parseFloat(e.target.value); set(`expenseLimits.${catName}.daily`, isNaN(v) ? '' : v); }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" sx={{ width: 100, "& .MuiInputBase-input": { padding: "5px 10px" } }}
                      value={limits.monthly ?? ''}
                      onChange={(e) => { const v = parseFloat(e.target.value); set(`expenseLimits.${catName}.monthly`, isNaN(v) ? '' : v); }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch checked={!!limits.requiresReceipt} onChange={(e) => set(`expenseLimits.${catName}.requiresReceipt`, e.target.checked)} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => deleteExpenseRow(catName)}>
                      <DeleteIcon fontSize="small" className='text-red-500' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Settlement Days" value={localConfig.settlementDays ?? 7} onChange={(e) => set('settlementDays', parseInt(e.target.value) || 0)} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel control={<Switch checked={!!localConfig.perDiemAllowed} onChange={(e) => set('perDiemAllowed', e.target.checked)} />} label="Allow Per Diem" />
        </Grid>
      </Grid>
    </Box>
  );
};
