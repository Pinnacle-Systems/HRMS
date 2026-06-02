import React from 'react';
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface FieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'switch' | 'slider' | 'date' | 'checkbox' | 'radio';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  defaultValue?: any;
  disabled?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

interface DynamicFormProps {
  schema: FieldSchema[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  values,
  onChange,
  errors = {},
}) => {
  const handleChange = (name: string, value: any) => {
    onChange({ ...values, [name]: value });
  };

  const renderField = (field: FieldSchema) => {
    const value = values[field.name] ?? field.defaultValue ?? '';
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <TextField
            fullWidth
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth required={field.required} error={!!error} disabled={field.disabled}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              {field.options?.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={field.disabled}
              />
            }
            label={field.label}
          />
        );

      case 'slider':
        return (
          <div>
            <div>{field.label}</div>
            <Slider
              value={value || field.min || 0}
              onChange={(_, val) => handleChange(field.name, val)}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={field.disabled}
              valueLabelDisplay="auto"
            />
            {field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
          </div>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={field.label}
              value={value ? new Date(value) : null}
              onChange={(date) => handleChange(field.name, date?.toISOString().split('T')[0])}
              disabled={field.disabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: field.required,
                  error: !!error,
                  helperText: error || field.helperText,
                },
              }}
            />
          </LocalizationProvider>
        );

      case 'checkbox':
        return (
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  disabled={field.disabled}
                />
              }
              label={field.label}
            />
            {field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
          </FormGroup>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" disabled={field.disabled}>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              {field.options?.map(opt => (
                <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
              ))}
            </RadioGroup>
          </FormControl>
        );

      default:
        return null;
    }
  };

  return (
    <Grid container spacing={2}>
      {schema.map((field) => (
        <Grid size={{xs:12}} key={field.name}>
          {renderField(field)}
        </Grid>
      ))}
    </Grid>
  );
};