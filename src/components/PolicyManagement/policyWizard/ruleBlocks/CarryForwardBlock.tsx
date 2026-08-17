import React from 'react';
import { Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const CarryForwardBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  // Ensure carryForward is always an object
   const carryForward = localConfig?.carryForward && typeof localConfig.carryForward === 'object' 
    ? localConfig.carryForward 
    : {};

  const handleFieldChange = (field: string, value: any) => {
    const current = carryForward;
    const updated = {
      ...current,
      [field]: value
    };
    
    // Always set as object, never boolean
    set('carryForward', updated);
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField 
          fullWidth 
          size="small" 
          type="number" 
          label="Max Carry Forward (Days)" 
          value={carryForward.maxDays || 30} 
          onChange={(e) => handleFieldChange('maxDays', parseInt(e.target.value) || 0)} 
          helperText="As per Factories Act, max 30 days" 
          sx={helperSx} 
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField 
          fullWidth 
          size="small" 
          type="number" 
          label="Valid Until (Months)" 
          value={carryForward.validUntilMonths || 3} 
          onChange={(e) => handleFieldChange('validUntilMonths', parseInt(e.target.value) || 0)} 
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel 
          control={
            <Switch 
              checked={!!carryForward.allowEncashment} 
              onChange={(e) => handleFieldChange('allowEncashment', e.target.checked)} 
            />
          } 
          label="Allow Encashment" 
        />
      </Grid>
    </Grid>
  );
};