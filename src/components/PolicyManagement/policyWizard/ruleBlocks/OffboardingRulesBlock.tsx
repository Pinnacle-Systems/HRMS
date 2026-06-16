import React from 'react';
import {
  Grid, TextField, FormControlLabel, Switch, FormControl, InputLabel, Select,
  MenuItem, Divider, Box, Typography, IconButton, Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { RuleBlockProps } from './types';

export const OffboardingRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const checklist: string[] = localConfig.clearanceChecklist || [];
  const addItem = () => set('clearanceChecklist', [...checklist, '']);
  const updateItem = (i: number, val: string) => {
    const updated = [...checklist]; updated[i] = val; set('clearanceChecklist', updated);
  };
  const removeItem = (i: number) => set('clearanceChecklist', checklist.filter((_, idx) => idx !== i));

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Full & Final Settlement (days)" value={localConfig.fullAndFinalSettlementDays ?? 45} onChange={(e) => set('fullAndFinalSettlementDays', parseInt(e.target.value) || 45)} helperText="Days to process F&F after exit" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.exitInterviewRequired} onChange={(e) => set('exitInterviewRequired', e.target.checked)} />} label="Exit Interview Required" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.assetReturnRequired} onChange={(e) => set('assetReturnRequired', e.target.checked)} />} label="Asset Return Required" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.experienceLetterProvided} onChange={(e) => set('experienceLetterProvided', e.target.checked)} />} label="Experience Letter Issued" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.relievingLetterProvided} onChange={(e) => set('relievingLetterProvided', e.target.checked)} />} label="Relieving Letter Issued" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.knowledgeTransferRequired} onChange={(e) => set('knowledgeTransferRequired', e.target.checked)} />} label="Knowledge Transfer Required" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="KT Duration (days)" value={localConfig.knowledgeTransferDays ?? 7} onChange={(e) => set('knowledgeTransferDays', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Rehire Eligibility</InputLabel>
          <Select value={localConfig.rehireEligibility || 'CASE_BY_CASE'} onChange={(e) => set('rehireEligibility', e.target.value)}>
            <MenuItem value="ELIGIBLE">Always Eligible</MenuItem>
            <MenuItem value="CASE_BY_CASE">Case by Case</MenuItem>
            <MenuItem value="NOT_ELIGIBLE">Not Eligible</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Clearance Checklist</Typography>
          <IconButton size="small" onClick={addItem} color="primary"><AddIcon /></IconButton>
        </Box>
        {checklist.length === 0 && (
          <Alert severity="info">No clearance items. Click + to add items employees must clear before exit.</Alert>
        )}
        {checklist.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth size="small"
              placeholder={`Clearance item ${i + 1}`}
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
            />
            <IconButton size="small" onClick={() => removeItem(i)}>
              <DeleteIcon fontSize="small" className='text-red-500' />
            </IconButton>
          </Box>
        ))}
      </Grid>
    </Grid>
  );
};
