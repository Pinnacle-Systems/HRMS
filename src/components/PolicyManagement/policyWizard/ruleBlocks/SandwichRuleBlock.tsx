import React from 'react';
import { Box, FormControlLabel, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const SandwichRuleBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => (
  <Box>
    <FormControlLabel control={<Switch checked={!!localConfig?.sandwichRule?.enabled} onChange={(e) => set('sandwichRule.enabled', e.target.checked)} />} label="Enable Sandwich Rule" />
    <span className='text-gray-500 text-[12px]'>Weekends/holidays between leave days counted as leave (Indian courts precedent)</span>
  </Box>
);
