import React, { useRef, useState, useMemo } from 'react';
import {
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Switch, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, Alert, Chip, Tooltip, Box,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { helperSx } from '../../const';
import type { RuleBlockProps } from './types';
import { selectSx } from '../../../../const';

// ============================================================
// PART 1: ALL AVAILABLE FORMULA TOKENS (Components)
// ============================================================
const FORMULA_TOKENS = [
  // Basic Salary Components
  { name: 'Basic', id: 'Basic', category: 'Salary', description: 'Monthly Basic Salary' },
  { name: 'DA', id: 'Da', category: 'Salary', description: 'Dearness Allowance' },
  { name: 'HRA', id: 'Hra', category: 'Salary', description: 'House Rent Allowance' },
  { name: 'Gross', id: 'Gross', category: 'Salary', description: 'Gross Salary (Basic + All Allowances)' },
  { name: 'CTC', id: 'Ctc', category: 'Salary', description: 'Cost to Company (Monthly)' },
  
  // Time Components
  { name: 'OT Hours', id: 'OT_Hrs', category: 'Time', description: 'Overtime Hours Worked' },
  { name: 'OT Minutes', id: 'OT_Min', category: 'Time', description: 'Overtime in Minutes' },
  { name: 'Working Days', id: 'Working_Days', category: 'Time', description: 'Paid Working Days in Month' },
  { name: 'Total Hours Month', id: 'Total_Hours', category: 'Time', description: 'Working Days × 8 Hours' },
  
  // Calculated Components
  { name: 'Hourly Rate', id: 'Hourly_Rate', category: 'Calculated', description: 'Basic / (Working Days × 8)' },
  { name: 'Daily Rate', id: 'Daily_Rate', category: 'Calculated', description: 'Basic / Working Days' },
  { name: 'Basic+DA', id: 'Basic_DA', category: 'Calculated', description: 'Basic + DA Combined' },
  
  // Functions
  { name: 'CEILING(OT_Hrs)', id: 'CEILING(OT_Hrs)', category: 'Functions', description: 'Round UP to nearest hour' },
  { name: 'FLOOR(OT_Hrs)', id: 'FLOOR(OT_Hrs)', category: 'Functions', description: 'Round DOWN to nearest hour' },
  { name: 'ROUND(OT_Hrs,1)', id: 'ROUND(OT_Hrs,1)', category: 'Functions', description: 'Round to 1 decimal' },
  { name: 'ROUND(OT_Hrs*2)/2', id: 'ROUND(OT_Hrs*2)/2', category: 'Functions', description: 'Round to nearest 0.5 hour' },
];

// ============================================================
// PART 2: FORMULA BUILDER WITH CATEGORIZED TOKENS
// ============================================================
const FormulaBuilder: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [insertToken, setInsertToken] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(FORMULA_TOKENS.map(t => t.category))];
  const filteredTokens = selectedCategory === 'All' 
    ? FORMULA_TOKENS 
    : FORMULA_TOKENS.filter(t => t.category === selectedCategory);

  const handleInsert = (token: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const next = value.slice(0, start) + token + value.slice(end);
      onChange(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      onChange(value + token);
    }
    setInsertToken('');
  };

  // Validate formula for common issues
  const getFormulaValidation = (formula: string) => {
    if (!formula) return { valid: true, message: '' };
    
    // Check for incomplete parentheses
    const openCount = (formula.match(/\(/g) || []).length;
    const closeCount = (formula.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
      return { valid: false, message: 'Mismatched parentheses' };
    }
    
    // Check for empty formula parts
    if (formula.includes('()')) {
      return { valid: false, message: 'Empty parentheses detected' };
    }
    
    return { valid: true, message: '' };
  };

  const validation = getFormulaValidation(value);

  return (
    <div className="flex flex-col gap-1 min-w-[280px]">
      <div className="flex items-center gap-1">
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
            displayEmpty
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={insertToken}
            displayEmpty
            onChange={(e) => handleInsert(e.target.value as string)}
            renderValue={() => <span className="text-gray-400 text-xs">Insert</span>}
            disabled={disabled}
          >
            {filteredTokens.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                <Tooltip title={t.description} placement="right">
                  <span>{t.name}</span>
                </Tooltip>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputRef={inputRef}
        placeholder="e.g. (Basic / (Working_Days * 8)) * OT_Hrs * Multiplier"
        disabled={disabled}
        error={!validation.valid}
        helperText={validation.valid ? 'Formula syntax is valid' : validation.message}
        slotProps={{ 
          htmlInput: { 
            style: { fontFamily: 'monospace', fontSize: 13 },
            className: 'font-mono text-[12px]'
          } 
        }}
      />
    </div>
  );
};

// ============================================================
// PART 3: CONSTANTS
// ============================================================
const OT_DAY_OPTIONS = [
  { value: 'WEEKDAY', label: 'Weekday' },
  { value: 'WEEKOFF', label: 'Week Off' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

// ============================================================
// PART 4: MAIN OVERTIME RULES COMPONENT
// ============================================================
interface OvertimeRulesBlockProps extends RuleBlockProps {
  otValues: any[];
}

export const OvertimeRulesBlock: React.FC<OvertimeRulesBlockProps> = ({ 
  localConfig, 
  set, 
  otValues = [] 
}) => {
  const configs = localConfig?.overtimeRules?.configs || [];
  
  // ============================================================
  // DYNAMIC MAPPING: Extract multiplier directly from code
  // ============================================================
  const getMultiplierFromCode = useMemo(() => {
    return (code: string): number => {
      // Special cases for non-numeric codes
      if (code === 'COMP' || code === 'COMP_OFF') {
        return 0; // Compensatory Off - no cash multiplier
      }
      if (code === 'NOOT' || code === 'NO_OT' || code === '0') {
        return 0; // No OT
      }
      
      // Try to parse the code as a number (1.5, 2, 2.5, etc.)
      const parsed = parseFloat(code);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
      
      // Fallback: check existing configs
      const existing = configs.find(c => c.otCode === code);
      if (existing) return existing.multiplier || 0;
      
      return 0;
    };
  }, [configs]);

  // ============================================================
  // GET DEFAULT FORMULA BASED ON OT CODE
  // ============================================================
  const getDefaultFormula = (code: string): string => {
    const isCompOff = ['COMP', 'COMP_OFF'].includes(code);
    const isNoOT = ['NOOT', 'NO_OT', '0'].includes(code);
    
    if (isCompOff) {
      return 'OT_Hrs';
    } else if (isNoOT) {
      return '0';
    } else {
      return '(Basic / (Working_Days * 8)) * OT_Hrs * Multiplier';
    }
  };

  // ============================================================
  // CHECK IF CODE IS COMPENSATORY OFF
  // ============================================================
  const isCompensatoryOff = (code: string): boolean => {
    return ['COMP', 'COMP_OFF'].includes(code);
  };

  // ============================================================
  // CHECK IF CODE IS NO OT
  // ============================================================
  const isNoOT = (code: string): boolean => {
    return ['NOOT', 'NO_OT', '0'].includes(code);
  };

  // ============================================================
  // CHECK IF CODE IS PAID OT
  // ============================================================
  const isPaidOT = (code: string): boolean => {
    return !isCompensatoryOff(code) && !isNoOT(code);
  };

  // ============================================================
  // GET CONFIGURATION SUMMARY
  // ============================================================
  const getConfigSummary = (row: any) => {
    const isCompOff = isCompensatoryOff(row.otCode);
    const isNoOt = isNoOT(row.otCode);
    
    if (isCompOff) return 'Accrues Compensatory Off';
    if (isNoOt) return 'No compensation';
    
    const multiplier = row.multiplier || getMultiplierFromCode(row.otCode);
    return `${multiplier}x Rate`;
  };

  // ============================================================
  // GET OT DAY LABEL
  // ============================================================
  // const getOTDayLabel = (value: string): string => {
  //   const option = OT_DAY_OPTIONS.find(opt => opt.value === value);
  //   return option?.label || value;
  // };

  // ============================================================
  // VALIDATE CONFIGURATION
  // ============================================================
  const validateConfig = (row: any) => {
    const isCompOff = isCompensatoryOff(row.otCode);
    const isNoOt = isNoOT(row.otCode);
    
    if (isCompOff || isNoOt) {
      return { valid: true, message: '' };
    }
    
    if (!row.multiplier || row.multiplier === 0) {
      return { valid: false, message: 'Multiplier cannot be 0 for paid OT' };
    }
    
    if (!row.formula || row.formula.trim() === '') {
      return { valid: false, message: 'Formula is required for paid OT' };
    }
    
    return { valid: true, message: '' };
  };

  // ============================================================
  // TOTAL POSSIBLE CONFIGURATIONS
  // ============================================================
  const totalPossibleConfigurations = otValues.length * OT_DAY_OPTIONS.length;
  const allConfigurationsUsed = configs.length >= totalPossibleConfigurations;

  // ============================================================
  // ADD ROW
  // ============================================================
  const addRow = () => {
    const combinations = OT_DAY_OPTIONS.flatMap(
      (dayOption) =>
        otValues.map((item) => ({
          otDay: dayOption.value,
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
    
    // Auto-set multiplier from code
    const defaultMultiplier = getMultiplierFromCode(available.otCode);
    const defaultFormula = getDefaultFormula(available.otCode);
    
    set('overtimeRules.configs', [
      ...configs,
      {
        ...available,
        multiplier: defaultMultiplier,
        formula: defaultFormula,
      },
    ]);
  };

  // ============================================================
  // REMOVE ROW
  // ============================================================
  const removeRow = (index: number) => {
    set(
      'overtimeRules.configs',
      configs.filter((_, i) => i !== index)
    );
  };

  // ============================================================
  // UPDATE ROW
  // ============================================================
  const updateRow = (index: number, field: string, value: any) => {
    const updated = configs.map((row, i) =>
      i === index
        ? { ...row, [field]: value }
        : row
    );
    set('overtimeRules.configs', updated);
  };

  // ============================================================
  // HANDLE OT VALUE CHANGE - Auto-fill from code
  // ============================================================
  const handleOTValueChange = (index: number, newCode: string) => {
    const row = configs[index];
    
    // Auto-set multiplier from code
    const newMultiplier = getMultiplierFromCode(newCode);
    
    // Auto-set formula
    let newFormula = row.formula;
    const isCompOff = isCompensatoryOff(newCode);
    const isNoOt = isNoOT(newCode);
    
    if (isCompOff) {
      newFormula = 'OT_Hrs';
    } else if (isNoOt) {
      newFormula = '0';
    } else if (!row.formula || row.formula === '' || row.formula === '0' || row.formula === 'OT_Hrs') {
      newFormula = '(Basic / (Working_Days * 8)) * OT_Hrs * Multiplier';
    }
    
    // Update all fields at once
    const updated = configs.map((config, i) => {
      if (i === index) {
        return {
          ...config,
          otCode: newCode,
          multiplier: newMultiplier,
          formula: newFormula,
        };
      }
      return config;
    });
    
    set('overtimeRules.configs', updated);
  };

  return (
    <Grid container spacing={3}>
      {/* ============================================================ */}
      {/* SECTION 1: GLOBAL OT SETTINGS */}
      {/* ============================================================ */}
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField 
          fullWidth 
          size="small" 
          type="number" 
          label="Max OT Hours / Day" 
          value={localConfig.overtimeRules?.maxHoursPerDay ?? 4} 
          onChange={(e) => set('overtimeRules.maxHoursPerDay', parseFloat(e.target.value) || 0)} 
          helperText="Statutory max: 4 hours" 
          sx={helperSx} 
        />
      </Grid>
      
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField 
          fullWidth 
          size="small" 
          type="number" 
          label="Max OT Hours / Month" 
          value={localConfig.overtimeRules?.maxHoursPerMonth ?? 50} 
          onChange={(e) => set('overtimeRules.maxHoursPerMonth', parseFloat(e.target.value) || 0)} 
          helperText="Statutory max: 50 hours" 
          sx={helperSx} 
        />
      </Grid>
      
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Compensation Type</InputLabel>
          <Select 
            value={localConfig.overtimeRules?.compensationType || 'PAY'} 
            sx={selectSx}
            onChange={(e) => set('overtimeRules.compensationType', e.target.value)}
          >
            <MenuItem value="PAY">Cash Payment Only</MenuItem>
            <MenuItem value="COMP_OFF">Compensatory Off Only</MenuItem>
            <MenuItem value="COMP_OFF_OR_PAY">Employee's Choice</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel 
          control={
            <Switch 
              checked={!!localConfig.overtimeRules?.requiresManagerApproval} 
              onChange={(e) => set('overtimeRules.requiresManagerApproval', e.target.checked)} 
            />
          } 
          label="Requires Manager Approval" 
        />
      </Grid>

      {/* ============================================================ */}
      {/* SECTION 2: OT RATE CONFIGURATION TABLE */}
      {/* ============================================================ */}
      <Grid size={{ xs: 12 }}>
        <Box className="flex items-center justify-between mb-2">
          <Typography>
            Overtime Rate Configuration
          </Typography>
          <Box className="flex items-center gap-2">
            <Chip 
              label={`${configs.length} of ${totalPossibleConfigurations} configured`} 
              color={configs.length === totalPossibleConfigurations ? 'success' : 'primary'}
              size="small"
            />
            <Chip 
              label={`${otValues.length} OT types`} 
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        
        <TableContainer className='border border-gray-200 rounded-md'>
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>OT Day</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>OT Value</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '120px' }}>Multiplier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Formula</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '140px' }}>Summary</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '60px' }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <div className='!p-8 text-gray-400'>
                      <Typography variant="body2">No OT Policies configured</Typography>
                      <Typography variant="caption">Click "Add OT Configuration" to set up overtime rules</Typography>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((row, index) => {
                  const validation = validateConfig(row);
                  const isNoOt = isNoOT(row.otCode);
                  const isPaid = isPaidOT(row.otCode);
                  const displayMultiplier = row.multiplier || getMultiplierFromCode(row.otCode);
                  
                  return (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
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
                            {OT_DAY_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={row.otCode}
                            onChange={(e) => {
                              const newCode = e.target.value;
                              handleOTValueChange(index, newCode);
                            }}
                          >
                            {otValues.map((item) => {
                              const alreadyUsed = configs.some(
                                (config, i) =>
                                  i !== index &&
                                  config.otDay === row.otDay &&
                                  config.otCode === item.code
                              );
                              const multiplier = getMultiplierFromCode(item.code);
                              const isCompOffItem = isCompensatoryOff(item.code);
                              const isNoOtItem = isNoOT(item.code);
                              
                              return (
                                <MenuItem
                                  key={item.code}
                                  value={item.code}
                                  disabled={alreadyUsed}
                                >
                                  <Box className="flex items-center gap-2">
                                    <span>{item.name}</span>
                                    {multiplier > 0 && (
                                      <Chip 
                                        label={`${multiplier}x`} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    )}
                                    {isCompOffItem && (
                                      <Chip label="Time Off" size="small" color="success" variant="outlined" />
                                    )}
                                    {isNoOtItem && (
                                      <Chip label="None" size="small" color="default" variant="outlined" />
                                    )}
                                  </Box>
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
                          fullWidth
                          slotProps={{
                            htmlInput: {
                              step: 0.5,
                              min: 0,
                            },
                          }}
                          value={displayMultiplier}
                          onChange={(e) =>
                            updateRow(index, 'multiplier', Number(e.target.value))
                          }
                          disabled={!isPaid}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: isPaid ? 'bold' : 'normal',
                              color: isPaid ? 'primary.main' : 'text.secondary',
                            }
                          }}
                          // InputProps={{
                          //   startAdornment: !isPaid ? (
                          //     <span className="text-gray-400 text-xs mr-1">N/A</span>
                          //   ) : null,
                          //   endAdornment: isPaid && displayMultiplier > 0 ? (
                          //     <span className="text-gray-500 text-xs">x</span>
                          //   ) : null
                          // }}
                        />
                      </TableCell>
                      
                      <TableCell sx={{ minWidth: 280 }}>
                        <FormulaBuilder
                          value={row.formula}
                          onChange={(v) => updateRow(index, 'formula', v)}
                          disabled={isNoOt}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box className="flex items-center gap-1">
                          {!validation.valid ? (
                            <Tooltip title={validation.message}>
                              <WarningIcon color="error" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                          <Typography variant="caption" className="text-gray-600">
                            {getConfigSummary(row)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => removeRow(index)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box className="flex items-center justify-between mt-2">
          <Typography variant="caption" className="text-gray-400">
            Configure all {otValues.length} OT values for {OT_DAY_OPTIONS.length} day types
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addRow}
            disabled={allConfigurationsUsed}
            variant="outlined"
            size="small"
            className={`${allConfigurationsUsed ? '' : '!text-primary !border-primary'}`}
          >
            Add OT Configuration
          </Button>
        </Box>
      </Grid>

      {/* ============================================================ */}
      {/* SECTION 3: INFO ALERTS */}
      {/* ============================================================ */}
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography>Factory Act, 1948 Guidelines:</Typography>
          <ul className="mt-1 ml-4 text-[12px]">
            <li>Overtime at double the ordinary rate of wages (2x)</li>
            <li>Maximum 4 hours per day</li>
            <li>Maximum 50 hours per quarter (≈16.6 hours/month)</li>
          </ul>
        </Alert>
        
        <Alert severity="warning" variant="outlined">
          <Typography variant="body2">
            <strong>Note:</strong> COMP / COMP_OFF configurations will <strong>not</strong> generate cash payment. 
            It will add to employee's Compensatory Off leave balance.
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  );
};