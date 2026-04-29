import { TextField, type TextFieldProps } from "@mui/material";
import { validateField, validationRules } from "../utils/validation";

interface ValidatedTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
}

export const ValidatedTextField = ({ 
  fieldKey, 
  value, 
  onChange, 
  label,
  placeholder,
  multiline,
  rows,
  ...props 
}: ValidatedTextFieldProps) => {
  const error = validateField(fieldKey, value);
  const rules = validationRules[fieldKey];
  
  return (
    <TextField
      {...props}
      label={label}
      value={value}
      multiline={multiline}
      rows={rows}
      error={!!error}
      helperText={error || (rules?.formatExample ? `Format: ${rules.formatExample}` : '')}
      placeholder={placeholder || (rules?.formatExample ? `e.g., ${rules.formatExample}` : `Enter ${label}`)}
      onChange={(e) => onChange(e.target.value)}
      className="!bg-white !dark:text-white"
      sx={{
        '& .MuiFormHelperText-root': {
          fontSize: '10px',
          marginLeft: 0,
        }
      }}
    />
  );
};