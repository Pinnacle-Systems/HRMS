// components/FilterPopup.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Box,
  Chip,
  Divider,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import type {
  FilterRule,
  FilterCondition,
  FilterField,
  FilterConfig,
  FilterPopupProps,
  FilterOperator,
} from '../types/filter';
import { operatorLabels, getOperatorsForFieldType, getInputTypeForOperator } from '../types/filterOperators';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const FilterPopup: React.FC<FilterPopupProps> = ({
  open,
  onClose,
  onApply,
  fields,
  initialFilters,
  title = 'Advanced Filters',
}) => {
  const [condition, setCondition] = useState<FilterCondition>(initialFilters?.condition || 'AND');
  const [rules, setRules] = useState<FilterRule[]>(initialFilters?.rules || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add new rule
  const addRule = () => {
    const newRule: FilterRule = {
      id: generateId(),
      field: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };
    setRules([...rules, newRule]);
  };

  // Remove rule
  const removeRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
  };

  // Update rule
  const updateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  // Get field by ID
  const getField = (fieldId: string): FilterField | undefined => {
    return fields.find(f => f.id === fieldId);
  };

  // Validate rule
  const validateRule = (rule: FilterRule): boolean => {
    const field = getField(rule.field);
    if (!field) return false;
    
    if (rule.operator === 'isEmpty' || rule.operator === 'isNotEmpty') {
      return true;
    }
    
    if (rule.operator === 'between') {
      return !!rule.value && !!rule.value2;
    }
    
    if (rule.operator === 'in' || rule.operator === 'notIn') {
      return Array.isArray(rule.value) && rule.value.length > 0;
    }
    
    if (field.type === 'boolean') {
      return rule.value !== undefined && rule.value !== '';
    }
    
    return rule.value !== undefined && rule.value !== null && rule.value !== '';
  };

  // Validate all rules
  const validateRules = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    rules.forEach(rule => {
      if (!validateRule(rule)) {
        newErrors[rule.id] = 'This field is required';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Apply filters
  const handleApply = () => {
    if (validateRules()) {
      onApply({ condition, rules: rules.filter(rule => validateRule(rule)) });
      onClose();
    }
  };

  // Clear all filters
  const handleClear = () => {
    setRules([]);
    setCondition('AND');
    setErrors({});
  };

  // Render value input based on field type and operator
  const renderValueInput = (rule: FilterRule) => {
    const field = getField(rule.field);
    if (!field) return null;
    
    const operator = rule.operator;
    const inputType = getInputTypeForOperator(operator, field.type);
    
    // Between operator
    if (operator === 'between') {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {field.type === 'date' ? (
            <>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From"
                  value={rule.value ? dayjs(rule.value) : null}
                  onChange={(date: Dayjs | null) => {
                    updateRule(rule.id, { value: date ? date.format('YYYY-MM-DD') : '' });
                  }}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                />
                <DatePicker
                  label="To"
                  value={rule.value2 ? dayjs(rule.value2) : null}
                  onChange={(date: Dayjs | null) => {
                    updateRule(rule.id, { value2: date ? date.format('YYYY-MM-DD') : '' });
                  }}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                />
              </LocalizationProvider>
            </>
          ) : (
            <>
              <TextField
                type="number"
                size="small"
                placeholder="Min"
                value={rule.value || ''}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2">to</Typography>
              <TextField
                type="number"
                size="small"
                placeholder="Max"
                value={rule.value2 || ''}
                onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                sx={{ flex: 1 }}
              />
            </>
          )}
        </Box>
      );
    }
    
    // In/Not In operators (multi-select)
    if (operator === 'in' || operator === 'notIn') {
      const options = field.options || [];
      return (
        <Autocomplete
          multiple
          size="small"
          options={options}
          getOptionLabel={(option) => option.label}
          value={options.filter(opt => (rule.value || []).includes(opt.value))}
          onChange={(_, newValue) => {
            updateRule(rule.id, { value: newValue.map(v => v.value) });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select values"
              variant="outlined"
            />
          )}
          sx={{ minWidth: 200 }}
        />
      );
    }
    
    // Boolean field
    if (field.type === 'boolean') {
      return (
        <Select
          size="small"
          value={rule.value === undefined ? '' : rule.value}
          onChange={(e) => updateRule(rule.id, { value: e.target.value === 'true' })}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      );
    }
    
    // Date field
    if (field.type === 'date') {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select date"
            value={rule.value ? dayjs(rule.value) : null}
            onChange={(date: Dayjs | null) => {
              updateRule(rule.id, { value: date ? date.format('YYYY-MM-DD') : '' });
            }}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
          />
        </LocalizationProvider>
      );
    }
    
    // Select field
    if (field.type === 'select') {
      return (
        <Select
          size="small"
          value={rule.value || ''}
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Select value</MenuItem>
          {field.options?.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      );
    }
    
    // Default text/number input
    return (
      <TextField
        type={field.type === 'number' ? 'number' : 'text'}
        size="small"
        placeholder={`Enter ${field.label.toLowerCase()}`}
        value={rule.value || ''}
        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
        sx={{ minWidth: 200 }}
      />
    );
  };
  
  // Get available operators for a field
  const getAvailableOperators = (fieldId: string): FilterOperator[] => {
    const field = getField(fieldId);
    if (!field) return [];
    return getOperatorsForFieldType(field.type);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    //   PaperProps={{ sx: { minHeight: 400, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {/* Condition selector (AND/OR) */}
        {rules.length > 1 && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <RadioGroup
              row
              value={condition}
              onChange={(e) => setCondition(e.target.value as FilterCondition)}
              sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1 }}
            >
              <FormControlLabel value="AND" control={<Radio size="small" />} label="Match ALL rules (AND)" />
              <FormControlLabel value="OR" control={<Radio size="small" />} label="Match ANY rule (OR)" />
            </RadioGroup>
          </Box>
        )}
        
        {/* Filter rules */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">No filters applied. Click "Add Filter" to get started.</Typography>
            </Box>
          ) : (
            rules.map((rule, index) => {
              const field = getField(rule.field);
              const operators = getAvailableOperators(rule.field);
              
              return (
                <Box key={rule.id}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {/* Field selector */}
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={rule.field}
                        label="Field"
                        onChange={(e) => {
                          const newFieldId = e.target.value;
                          const newField = getField(newFieldId);
                          const defaultOperators = getAvailableOperators(newFieldId);
                          updateRule(rule.id, {
                            field: newFieldId,
                            operator: defaultOperators[0] || 'equals',
                            value: '',
                          });
                        }}
                      >
                        {fields.map(f => (
                          <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Operator selector */}
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={rule.operator}
                        label="Operator"
                        onChange={(e) => {
                          updateRule(rule.id, {
                            operator: e.target.value as FilterOperator,
                            value: '',
                            value2: '',
                          });
                        }}
                      >
                        {operators.map(op => (
                          <MenuItem key={op} value={op}>{operatorLabels[op]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Value input */}
                    <Box sx={{ flex: 1 }}>
                      {renderValueInput(rule)}
                      {errors[rule.id] && (
                        <FormHelperText error>{errors[rule.id]}</FormHelperText>
                      )}
                    </Box>
                    
                    {/* Delete button */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeRule(rule.id)}
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {/* AND/OR separator between rules */}
                  {index < rules.length - 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Chip
                        label={condition}
                        size="small"
                        sx={{
                          bgcolor: condition === 'AND' ? 'primary.light' : 'secondary.light',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        <Box>
          <Button
            startIcon={<AddIcon />}
            onClick={addRule}
            variant="outlined"
            size="small"
          >
            Add Filter
          </Button>
          {rules.length > 0 && (
            <Button
              onClick={handleClear}
              color="inherit"
              size="small"
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} variant="contained" color="primary" sx={{ ml: 1 }}>
            Apply Filters
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FilterPopup;