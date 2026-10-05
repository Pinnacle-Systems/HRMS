import React from 'react';
import { Grid, TextField } from '@mui/material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';

export const CarryForwardBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
  const carryForward =
    localConfig?.carryForward && typeof localConfig.carryForward === 'object'
      ? localConfig.carryForward
      : {};

  // Disable only if NO entitlement has carry forward enabled
  const isDisabled = !localConfig.entitlements?.some(
    (entitlement) => entitlement.carryForwardUnused === true
  );

  const handleFieldChange = (field: string, value: any) => {
    if (isDisabled) return;
    set('carryForward', { ...carryForward, [field]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth size="small" type="number"
          label="Max Carry Forward (Days)"
          value={carryForward.maxDays ?? 30}
          onChange={(e) => handleFieldChange('maxDays', parseInt(e.target.value) || 0)}
          helperText={
            isDisabled
              ? 'Enable "Carry Forward Unused Leave" for at least one leave type'
              : 'As per Factories Act, max 30 days'
          }
          sx={helperSx}
          disabled={isDisabled}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth size="small" type="number"
          label="Valid Until (Months)"
          value={carryForward.validUntilMonths ?? 3}
          onChange={(e) => handleFieldChange('validUntilMonths', parseInt(e.target.value) || 0)}
          disabled={isDisabled}
        />
      </Grid>
    </Grid>
  );
};