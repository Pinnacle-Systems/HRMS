import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Switch,
  FormControlLabel, IconButton, Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { EntitlementConfig } from '../../../../types/policy';
import type { LeaveType } from '../../../../services';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

interface LeaveEntitlementsBlockProps extends RuleBlockProps {
  leaveType: LeaveType[];
}

export const LeaveEntitlementsBlock: React.FC<LeaveEntitlementsBlockProps> = ({ localConfig, set, leaveType }) => {
  const handleLeaveTypeChange = (index: number, field: keyof EntitlementConfig, value: any) => {
    const updated = [...(localConfig.entitlements || [])];
    if (field === 'leaveType') {
      const selectedLeave = leaveType.find((lt) => lt.code === value);
      updated[index] = {
        ...updated[index],
        leaveType: value,
        name: selectedLeave ? selectedLeave.name : ''
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    set('entitlements', updated);
  };

  const addLeaveType = () => {
    const blank: EntitlementConfig = {
      leaveType: '', name: '', annualEntitlement: 0, accrualType: 'YEARLY',
      allowedDuringProbation: false, requiresDocument: false,
    };
    set('entitlements', [...(localConfig?.entitlements || []), blank]);
  };

  const removeLeaveType = (index: number) => {
    const updated = [...(localConfig.entitlements || [])];
    updated.splice(index, 1);
    set('entitlements', updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">Leave Types & Entitlements (as per Indian Labour Laws)</Typography>
        <IconButton onClick={addLeaveType} color="primary" size="small"><AddIcon /></IconButton>
      </Box>
      {(localConfig?.entitlements || []).map((leave, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 2 }} className='!border-gray-200'>
          <CardContent className='!bg-white-50 text-gray-800'>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Leave Type {index + 1}</Typography>
              <IconButton size="small" onClick={() => removeLeaveType(index)}><DeleteIcon fontSize="small" className='text-red-500' /></IconButton>
            </Box>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Leave Code</InputLabel>
                  <Select
                    value={leave.leaveType}
                    onChange={(e) => handleLeaveTypeChange(index, 'leaveType', e.target.value)}
                    label="Leave Code"
                    sx={selectSx}
                  >
                    {leaveType.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth label="Leave Name" disabled className='!dark:text-gray-100' value={leave.name} onChange={(e) => handleLeaveTypeChange(index, 'name', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth type="number" label="Annual Days" value={leave.annualEntitlement} onChange={(e) => handleLeaveTypeChange(index, 'annualEntitlement', parseInt(e.target.value) || 0)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Accrual Type</InputLabel>
                  <Select value={leave.accrualType} onChange={(e) => handleLeaveTypeChange(index, 'accrualType', e.target.value)} sx={selectSx}>
                    <MenuItem value="FullCredit">Immediate (Full Credit)</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                    {/* <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="HALF-YEARLY">Half-Yearly</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                    <MenuItem value="ATTENDANCE">Based on Attendance</MenuItem>
                    <MenuItem value="WORKING-DAYS">Based on Working Days</MenuItem>          */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth type="number" label="Accrual (Days)" value={leave?.maxAccrual || ''} onChange={(e) => handleLeaveTypeChange(index,'maxAccrual', parseInt(e.target.value) || undefined)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel control={<Switch checked={!!leave.allowedDuringProbation} onChange={(e) => handleLeaveTypeChange(index, 'allowedDuringProbation', e.target.checked)} />} label="During Probation" />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel control={<Switch checked={!!leave.encashable} onChange={(e) => handleLeaveTypeChange(index, 'encashable', e.target.checked)} />} label="Encashable" />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <FormControlLabel control={<Switch checked={!!leave.enableProRata} onChange={(e) => handleLeaveTypeChange(index, 'enableProRata', e.target.checked)} />} label="Enable Pro-rata Accrual" />
                <span className='text-blue-500 text-[10px]'>(Leave accrual proportional to joining date (as per Indian Labour Laws))</span>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel control={<Switch checked={!!leave.carryForwardUnused} onChange={(e) => handleLeaveTypeChange(index, 'carryForwardUnused', e.target.checked)} />} label="Carry Forward Unused Leave" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      {(!localConfig?.entitlements || localConfig?.entitlements.length === 0) && (
        <Alert severity="info">No leave types configured. Click Add to create leave types.</Alert>
      )}
    </Box>
  );
};
