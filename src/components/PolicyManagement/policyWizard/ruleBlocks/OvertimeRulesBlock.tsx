import React, { useRef, useState } from 'react';
import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Switch, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

const FORMULA_TOKENS = [
  { name: 'Basic', id: 'Basic' },
  { name: 'DA', id: 'Da' },
  { name: 'OT Hrs', id: 'OT Hrs' },
];

const FormulaBuilder: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [insertToken, setInsertToken] = useState('');

  const handleInsert = (token: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const next = value.slice(0, start) + token + value.slice(end);
      onChange(next);
      // Restore focus and cursor after the inserted token
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      onChange(value + token);
    }
    setInsertToken('');
  };

  return (
    <div className="flex items-center gap-1 min-w-[240px]">
      <FormControl size="small" sx={{ minWidth: 90 }}>
        <Select
          value={insertToken}
          displayEmpty
          onChange={(e) => handleInsert(e.target.value as string)}
          renderValue={() => <span className="text-gray-400 text-xs">Insert</span>}
        >
          {FORMULA_TOKENS.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputRef={inputRef}
        placeholder="e.g. Basic+Da*2"
        slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
      />
    </div>
  );
};

interface OvertimeRulesBlockProps extends RuleBlockProps {
  otValues: any[];
}

export const OvertimeRulesBlock: React.FC<OvertimeRulesBlockProps> = ({ localConfig, set, otValues }) => {
  const configs = localConfig?.overtimeRules?.configs || [];
  const totalPossibleConfigurations = otValues.length * 2;
  const allConfigurationsUsed = configs.length >= totalPossibleConfigurations;

  const addRow = () => {
    const combinations = ['WEEKDAY', 'HOLIDAY'].flatMap(
      (type) =>
        otValues.map((item) => ({
          otDay: type,
          otCode: item.code,
        }))
    );
    const available = combinations.find(
      (combo) =>
        !configs.some(
          (config) =>
            config.otDay === combo.otDay &&
            config.otCode === combo.otCode
        )
    );
    if (!available) return;
    set('overtimeRules.configs', [
      ...configs,
      {
        ...available,
        multiplier: 0,
        formula: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    set(
      'overtimeRules.configs',
      configs.filter((_, i) => i !== index)
    );
  };

  const updateRow = (index: number, field: string, value: any) => {
    const updated = configs.map((row, i) =>
      i === index
        ? { ...row, [field]: value }
        : row
    );
    set('overtimeRules.configs', updated);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Day" value={localConfig.overtimeRules?.maxHoursPerDay ?? 4} onChange={(e) => set('overtimeRules.maxHoursPerDay', parseFloat(e.target.value) || 0)} helperText="Statutory max: 4 hours" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Month" value={localConfig.overtimeRules?.maxHoursPerMonth ?? 50} onChange={(e) => set('overtimeRules.maxHoursPerMonth', parseFloat(e.target.value) || 0)} helperText="Statutory max: 50 hours" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Compensation Type</InputLabel>
          <Select value={localConfig.overtimeRules?.compensationType || 'PAY'} sx={selectSx}
          onChange={(e) => set('overtimeRules.compensationType', e.target.value)}>
            <MenuItem value="PAY">Cash Payment Only</MenuItem>
            <MenuItem value="COMP_OFF">Compensatory Off</MenuItem>
            <MenuItem value="COMP_OFF_OR_PAY">Employee's Choice</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.overtimeRules?.requiresManagerApproval} onChange={(e) => set('overtimeRules.requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Overtime Rate Configuration
        </Typography>
        <TableContainer className='border border-gray-200 rounded-md pb-2'>
          <Table className=''>
            <TableHead>
              <TableRow>
                <TableCell>OT Day</TableCell>
                <TableCell>OT Value</TableCell>
                <TableCell>Multiplier</TableCell>
                <TableCell>Formula</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" >
                    <div className='!p-4'> No OT Policies found</div>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl>
                        <Select
                          size="small"
                          value={row.otDay}
                          onChange={(e) => {
                            const newType = e.target.value;

                            const duplicateExists = configs.some(
                              (config, i) =>
                                i !== index &&
                                config.otDay === newType &&
                                config.otCode === row.otCode
                            );
                            if (duplicateExists) {
                              return;
                            }

                            updateRow(index, 'otDay', newType);
                          }}
                        >
                          <MenuItem value="WEEKDAY">
                            Weekday
                          </MenuItem>
                          <MenuItem value="HOLIDAY">
                            Holiday
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl>
                        <Select
                          size="small"
                          value={row.otCode}
                          onChange={(e) =>
                            updateRow(index, 'otCode', e.target.value)
                          }
                        >
                          {otValues.map((item) => {
                            const alreadyUsed = configs.some(
                              (config, i) =>
                                i !== index &&
                                config.otDay === row.otDay &&
                                config.otCode === item.code
                            );

                            return (
                              <MenuItem
                                key={item.code}
                                value={item.code}
                                disabled={alreadyUsed}
                              >
                                {item.name}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        slotProps={{
                          htmlInput: {
                            step: 0.5,
                            min: 0,
                          },
                        }}
                        value={row.multiplier}
                        onChange={(e) =>
                          updateRow(
                            index,
                            'multiplier',
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <FormulaBuilder
                        value={row.formula}
                        onChange={(v) => updateRow(index, 'formula', v)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => removeRow(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-end  mt-2">
          <Button
            startIcon={<AddIcon />}
            onClick={addRow}
            disabled={allConfigurationsUsed}
            className={`${allConfigurationsUsed ? '' : '!text-primary !border-primary '}`}
            variant='outlined'
          >
            Add OT Configuration
          </Button>
        </div>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" sx={{ mb: 2 }}>As per Factories Act, 1948 - Overtime at double the ordinary rate of wages</Alert>
      </Grid>
    </Grid>
  );
};
