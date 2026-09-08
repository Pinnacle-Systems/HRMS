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
  Chip,
  Stack,
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
import type {
  FilterRule,
  // FilterConfig,
  FilterField,
  FilterPopupProps,
  FilterOperator,
} from '../types/filter';
import {
  operatorLabels,
  getOperatorsForFieldType,
  // getOperatorRequiresValue,
  // getOperatorRequiresSecondValue,
} from '../types/filterOperators';
import dayjs from 'dayjs';
import { selectSx } from '../const';

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
  const [condition, setCondition] = useState<'AND' | 'OR'>(
    initialFilters?.condition || "AND"
  );

  // Add new rule
  const addRule = () => {
    const firstField = fields[0];
    const operators = getOperatorsForFieldType(firstField?.type || 'text');

    const newRule: FilterRule = {
      id: generateId(),
      field: firstField?.id || '',
      operator: operators[0] || 'equals',
      value: '',
      value2: '',
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

    const operator = rule.operator;

    // Boolean operators don't need value
    if (['true', 'false', 'yes', 'no'].includes(operator)) {
      return true;
    }

    // Empty/Null operators don't need value
    if (['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(operator)) {
      return true;
    }

    // Between requires both values
    if (operator === 'between') {
      return !!rule.value && !!rule.value2;
    }

    // In/Not In requires array with values
    if (operator === 'in' || operator === 'notIn') {
      return Array.isArray(rule.value) && rule.value.length > 0;
    }

    // For other operators, value is required
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
      const validRules = rules.filter(rule => validateRule(rule));
      onApply({
        condition,
        rules: validRules,
      });
      onClose();
    }
  };

  // Clear all filters
  const handleClear = () => {
    setRules([]);
    setErrors({});
  };

  // Check if operator requires value
  // const requiresValue = (operator: FilterOperator): boolean => {
  //   return getOperatorRequiresValue(operator);
  // };

  // // Check if operator requires second value
  // const requiresSecondValue = (operator: FilterOperator): boolean => {
  //   return getOperatorRequiresSecondValue(operator);
  // };

  // Check if operator is boolean type
  const isBooleanOperator = (operator: FilterOperator): boolean => {
    return ['true', 'false', 'yes', 'no'].includes(operator);
  };

  // Render value input based on field type and operator
  const renderValueInput = (rule: FilterRule) => {
    const field = getField(rule.field);
    if (!field) return null;

    const operator = rule.operator;

    // Boolean operators - no input needed
    if (isBooleanOperator(operator)) {
      return null;
    }

    // Empty/Null operators - no input needed
    if (['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(operator)) {
      return null;
    }

    // Between operator
    if (operator === 'between') {
      return (
        <div>
          {renderSingleValueInput(rule, 'value', field)}
          <Typography variant="body2" className='text-gray-800 text-center' sx={{ m: 1.2 }}>
            and
          </Typography>
          {renderSingleValueInput(rule, 'value2', field)}
        </div>
      );
    }

    // In/Not In operators (multi-select)
    if (operator === 'in' || operator === 'notIn') {
      const options = field.options || [];
      const selectedValues = Array.isArray(rule.value) ? rule.value : [];

      return (
        <Autocomplete
          multiple
          size="small"
          options={options}
          getOptionLabel={(option) => option.label}
          value={options.filter(opt => selectedValues.some(v => String(v) === String(opt.value)))}
          onChange={(_, newValue) => {
            updateRule(rule.id, { value: newValue.map(v => v.value) });
          }}
          sx={{
            minWidth: 180,
            flex: 1,
            p: '0 !important',
            '& .MuiOutlinedInput-root': {
              padding: '6px'
            },
            '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
              padding: '4px !important'
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Select values..."
              sx={{ minWidth: 200 }}
            />
          )}
        // renderTags={(value: any, getTagProps: any) =>
        //   value.map((option: any, index: any) => (
        //     <Chip
        //       key={index}
        //       label={option.label}
        //       size="small"
        //       {...getTagProps({ index })}
        //     />
        //   ))
        // }
        // renderTags={(value:any, getTagProps:any) =>
        //   value.map((option, index) => {
        //     const { key, ...tagProps } = getTagProps({ index });
        //     return (
        //       <Chip
        //         key={key || index}
        //         label={option.label}
        //         size="small"
        //         {...tagProps}
        //       />
        //     );
        //   })
        // }
        />
      );
    }

    // Single value input
    return renderSingleValueInput(rule, 'value', field);
  };

  // Render single value input
  const renderSingleValueInput = (
    rule: FilterRule,
    key: 'value' | 'value2',
    field: FilterField
  ) => {
    const value = rule[key] || '';

    switch (field.type) {
      case 'select':
      case 'multiSelect':
        return (
          <Autocomplete
            options={field.options || []}
            value={field.options?.find((option) => String(option.value) === String(value)) || null}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, selected) => String(option.value) === String(selected.value)}
            onChange={(_, option) => updateRule(rule.id, { [key]: option?.value ?? '' })}
            renderInput={(params) => <TextField {...params} label={field.label} placeholder="Search..." />}
            sx={{
              minWidth: 180,
              flex: 1,
              p: '0 !important',
              '& .MuiOutlinedInput-root': {
                padding: '6px'
              },
              '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
                padding: '4px !important'
              }
            }}
          />
        );

      case 'boolean':
        return (
          <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
            <Select
              value={String(value)}
              onChange={(e) => updateRule(rule.id, { [key]: e.target.value === 'true' })}
              displayEmpty
              sx={selectSx}
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              label={key === 'value' ? 'From' : 'To'}
              value={value ? dayjs(value) : null}
              onChange={(date) => {
                updateRule(rule.id, {
                  [key]: date ? dayjs(date).format('YYYY-MM-DD') : '',
                });
              }}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  sx: { minWidth: 150, flex: 1 },
                },
              }}
            />
          </LocalizationProvider>
        );

      case 'number':
        return (
          <TextField
            type="number"
            size="small"
            value={value}
            onChange={(e) => updateRule(rule.id, { [key]: e.target.value })}
            placeholder="Enter value..."
            sx={{ minWidth: 150, flex: 1 }}
          />
        );

      case 'multiline':
        return (
          <TextField
            size="small"
            value={value}
            onChange={(e) => updateRule(rule.id, { [key]: e.target.value })}
            placeholder="Enter value..."
            multiline
            rows={2}
            sx={{ minWidth: 200, flex: 1 }}
          />
        );

      default:
        return (
          <TextField
            size="small"
            value={value}
            onChange={(e) => updateRule(rule.id, { [key]: e.target.value })}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            sx={{ minWidth: 150, flex: 1 }}
          />
        );
    }
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
              sm: "750px",
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
        <DialogTitle className='border-b border-gray-200 flex items-center justify-between'>
          <div className='flex items-center'>
            <FilterAltOutlined className='bg-primary-100 rounded-full !w-5 text-primary' />
            <div className='text-gray-800 ml-2'>{title}</div>
            {rules.length > 0 && (
              <Chip
                label={`${rules.length} filter${rules.length > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </div>
          <IconButton onClick={onClose} size="small">
            <CloseIcon className='text-gray-800' />
          </IconButton>
        </DialogTitle>

        <DialogContent className='bg-white' sx={{
          // "&.MuiDialogContent-root": {
          //   padding: 2,
          //   paddingTop: 2
          // },
          overflowY: "auto",
          flex: 1,
        }}>
          {/* AND/OR Condition Selector */}
          {rules.length > 1 && (
            <Box className="!bg-white"
              sx={{
                display: "flex",
                justifyContent: "center",
                // mb: 3,
                position: 'sticky',
                top: 0,
                zIndex: 999,
                pt: 2
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
                    backgroundColor: condition === "AND" ? "#1976d2" : "transparent",
                    color: condition === "AND" ? "#fff" : "#6b7280",
                    "&:hover": {
                      backgroundColor: condition === "AND" ? "#1976d2" : "#e5e7eb",
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
                    backgroundColor: condition === "OR" ? "#1976d2" : "transparent",
                    color: condition === "OR" ? "#fff" : "#6b7280",
                    "&:hover": {
                      backgroundColor: condition === "OR" ? "#1976d2" : "#e5e7eb",
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
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Typography variant="body2" className='text-gray-800'>
                  No filters applied. Click "Add Filter" to get started.
                </Typography>
              </Box>
            ) : (
              rules.map((rule) => {
                const field = getField(rule.field);
                const operators = getOperatorsForFieldType(field?.type || 'text');

                return (
                  <Box
                    key={rule.id}
                    className="!bg-white-50 border border-gray-200 !p-3 !pt-6"
                    sx={{
                      // p: { xs: 1.5, sm: 2 },
                      mt: 2,
                      border: '1px solid',
                      borderColor: errors[rule.id] ? 'error.main' : 'divider',
                      borderRadius: 1.5,
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      position: 'relative',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                    // alignItems={{ xs: 'stretch', sm: 'center' }}
                    // sx={{ width: '100%' }}
                    >
                      {/* Field selector */}
                      <Autocomplete
                        options={fields}
                        groupBy={(field) => field.group || 'General'}
                        getOptionLabel={(field) => field.label}
                        value={field || null}
                        isOptionEqualToValue={(option, selected) => option.id === selected.id}
                        onChange={(_, selectedField) => {
                          const defaultOperators = getOperatorsForFieldType(selectedField?.type || 'text');
                          updateRule(rule.id, {
                            field: selectedField?.id || '',
                            operator: defaultOperators[0] || 'equals',
                            value: '',
                            value2: '',
                          });
                        }}
                        renderInput={(params) => <TextField {...params} label="Field" placeholder="Search fields..." />}
                        sx={{
                          minWidth: 180,
                          flex: 1,
                          p: '0 !important',
                          '& .MuiOutlinedInput-root': {
                            padding: '6px'
                          },
                          '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
                            padding: '4px !important'
                          }
                        }}
                      />

                      {/* Operator selector */}
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={rule.operator || ''}
                          label="Operator"
                          sx={selectSx}
                          onChange={(e) => {
                            updateRule(rule.id, {
                              operator: e.target.value as FilterOperator,
                              value: '',
                              value2: '',
                            });
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Operator
                          </MenuItem>
                          {operators.map((op) => (
                            <MenuItem key={op} value={op} className='!text-[12px]'>
                              {operatorLabels[op]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Value input */}
                      <Box sx={{ flex: 1, minWidth: 200 }}>
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
                        sx={{ flex: '0 0 auto' }}
                      >
                        <DeleteIcon className='!text-red-500' />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })
            )}
          </Box>
        </DialogContent>

        <DialogActions className='border-t border-gray-200 flex items-center !justify-between !p-4'>
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
            <Button variant='outlined' onClick={onClose} className='!text-gray-800 !border-gray-300'>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              variant="contained"
              className='!bg-primary'
              sx={{ ml: 1 }}
              disabled={rules.length === 0}
            >
              Apply Filters ({rules.filter(r => validateRule(r)).length})
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default FilterPopup;