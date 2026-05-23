import React, { useState } from 'react';
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
  Typography,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  FilterAltOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import type {
  FilterRule,
  FilterCondition,
  FilterField,
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
  const [rules, setRules] = useState<FilterRule[]>(initialFilters?.rules || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [condition, setCondition] = useState<FilterCondition>(
    initialFilters?.condition || "AND"
  );

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
      onApply({
        condition,
        rules: rules.filter(rule => validateRule(rule)),
      });

      onClose();
    }
  };
  // Clear all filters
  const handleClear = () => {
    setRules([]);
    setErrors({});
  };

  // Render value input based on field type and operator
  const renderValueInput = (rule: FilterRule) => {
    const field = getField(rule.field);
    if (!field) return null;

    const operator = rule.operator;
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      return null;
    }
    getInputTypeForOperator(operator, field.type);

    // Between operator
    if (operator === 'between') {
      return (
        <Box sx={{ display: 'block', gap: 1, alignItems: 'center' }}>
          {field.type === 'date' ? (
            <>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From"
                  value={rule.value ? dayjs(rule.value) : null}
                  onChange={(date: Dayjs | null) => {
                    updateRule(rule.id, {
                      value: date ? date.format("YYYY-MM-DD") : "",
                    });
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        flex: 1,
                        "& .MuiInputLabel-root": {
                          top: 0,
                        },
                        "& .MuiInputLabel-shrink": {
                          top: 0,
                        },
                      },
                    },
                  }}
                />

                <DatePicker
                  label="To"
                  value={rule.value2 ? dayjs(rule.value2) : null}
                  className='!mt-1'
                  onChange={(date: Dayjs | null) => {
                    updateRule(rule.id, {
                      value2: date ? date.format("YYYY-MM-DD") : "",
                    });
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        flex: 1,
                        "& .MuiInputLabel-root": {
                          top: 0,
                        },
                        "& .MuiInputLabel-shrink": {
                          top: 0,
                        },
                      },
                    },
                  }}
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
          className='!text-[12px]'
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
          className='!text-[12px]'
          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Select value</MenuItem>
          {field.options?.map(opt => (
            <MenuItem key={opt.value} className='!text-[12px]' value={opt.value}>{opt.label}</MenuItem>
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
      fullScreen
      hideBackdrop={false}
      slotProps={{
        paper: {
          sx: {
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            margin: 0,
            width: {
              xs: "100%",
              sm: "700px",
            },
            maxWidth: "100%",
            height: "100vh",
            maxHeight: "100vh",
            borderRadius: {
              xs: 0,
              sm: "20px 0 0 20px",
            },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterAltOutlined className='bg-primary-50 rounded-sm !w-5 text-primary' />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{
          "&.MuiDialogContent-root": {
            padding: 1,
            paddingTop: 2
          },
          overflowY: "auto",
          flex: 1,
        }}>
          {/* AND OR OPERATOR */}
          {/* {rules.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <RadioGroup
                row
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as FilterCondition)
                }
              >
                <FormControlLabel
                  value="AND"
                  control={<Radio size="small" />}
                  label="AND"
                />

                <FormControlLabel
                  value="OR"
                  control={<Radio size="small" />}
                  label="OR"
                />
              </RadioGroup>
            </Box>
          )} */}
          {rules.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "12px",
                  padding: "4px",
                  gap: "4px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Button
                  size="small"
                  variant={condition === "AND" ? "contained" : "text"}
                  onClick={() => setCondition("AND")}
                  sx={{
                    minWidth: "50px",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                    backgroundColor:
                      condition === "AND" ? "#1976d2" : "transparent",
                    color: condition === "AND" ? "#fff" : "#6b7280",
                    "&:hover": {
                      backgroundColor:
                        condition === "AND"
                          ? "#1976d2"
                          : "#e5e7eb",
                      boxShadow: "none",
                    },
                  }}
                >
                  AND
                </Button>

                <Button
                  size="small"
                  variant={condition === "OR" ? "contained" : "text"}
                  onClick={() => setCondition("OR")}
                  sx={{
                    minWidth: "50px",
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                    backgroundColor:
                      condition === "OR" ? "#1976d2" : "transparent",
                    color: condition === "OR" ? "#fff" : "#6b7280",
                    "&:hover": {
                      backgroundColor:
                        condition === "OR"
                          ? "#1976d2"
                          : "#e5e7eb",
                      boxShadow: "none",
                    },
                  }}
                >
                  OR
                </Button>
              </Box>
            </Box>
          )}
          {/* Filter rules */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rules.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body2" className='text-gray-800'>
                  No filters applied. Click "Add Filter" to get started.
                </Typography>
              </Box>
            ) : (
              rules.map((rule) => {
                const operators = getAvailableOperators(rule.field);
                return (
                  <Box key={rule.id}>
                    {/* Rule Row */}
                    < Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        // p: 2,
                        m: 1,
                        // border: '1px solid',
                        // borderColor: 'divider',
                        // borderRadius: 2,
                        bgcolor: 'bg-white',
                      }}
                    >
                      {/* Field selector */}
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Field</InputLabel>
                        <Select
                          value={rule.field}
                          label="Field"
                          size='small'
                          className='!text-[12px]'
                          onChange={(e) => {
                            const newFieldId = e.target.value;
                            const defaultOperators =
                              getAvailableOperators(newFieldId);

                            updateRule(rule.id, {
                              field: newFieldId,
                              operator:
                                defaultOperators[0] || 'equals',
                              value: '',
                              value2: '',
                            });
                          }}
                        >
                          {fields.map((f) => (
                            <MenuItem key={f.id} value={f.id} className='!text-[12px]'>
                              {f.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Operator selector */}
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={rule.operator}
                          label="Operator"
                          className='!text-[12px]'
                          onChange={(e) => {
                            updateRule(rule.id, {
                              operator:
                                e.target.value as FilterOperator,
                              value: '',
                              value2: '',
                            });
                          }}
                        >
                          {operators.map((op) => (
                            <MenuItem key={op} value={op} className='!text-[12px]'>
                              {operatorLabels[op]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Value input */}
                      <Box sx={{ flex: 1 }}>
                        {renderValueInput(rule)}
                        {errors[rule.id] && (
                          <FormHelperText error>
                            {errors[rule.id]}
                          </FormHelperText>
                        )}
                      </Box>

                      {/* Delete button */}
                      <IconButton
                        size="small"
                        onClick={() => removeRule(rule.id)}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteIcon className='!text-red-500' />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </DialogContent >

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
            <Button variant='outlined' onClick={onClose} className='!text-gray-800 !border-gray-300'>Cancel</Button>
            <Button onClick={handleApply} variant="contained" className='!bg-primary' sx={{ ml: 1 }}>
              Apply Filters
            </Button>
          </Box>
        </DialogActions>
      </Box >
    </Dialog >
  );
};

export default FilterPopup;