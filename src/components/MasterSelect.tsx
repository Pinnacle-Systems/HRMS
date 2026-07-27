import Autocomplete from "@mui/material/Autocomplete";
// import { DynamicSelectWithAdd } from "./SelectField";
import type { SxProps, Theme } from "@mui/system";
import { TextField } from "@mui/material";

interface MasterSelectProps {
  type?: "country" | "state" | "city";
  countries?: any[];
  states?: any[];
  cities?: any[];
  options?: any[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export const MasterSelect = ({
  type,
  countries = [],
  states = [],
  cities = [],
  options: propOptions,
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder,
  required,
  disabled,
  sx,
}: MasterSelectProps) => {

  let options = propOptions;
  if (!options || options.length === 0) {
    if (type === "country") {
      options = countries;
    } else if (type === "state") {
      options = states;
    } else if (type === "city") {
      options = cities;
    }
  }

  const optionsArray = Array.isArray(options) ? options : [];

  const selectedItem = optionsArray.find(
    (item) => String(item?.id) === String(value) || String(item?.value) === String(value)
  ) || null;

  // const selectedLabel = selectedItem?.name || selectedItem?.label || "";

  return (
    // <DynamicSelectWithAdd
    //   label={label || ""}
    //   value={selectedLabel}
    //   options={optionsArray.map((item) => item?.name || item?.label || "")}
    //   onChange={(selectedName: string | string[]) => {
    //     const name = Array.isArray(selectedName) ? selectedName[0] : selectedName;
    //     const selected = optionsArray.find(
    //       (item) => (item?.name || item?.label) === name
    //     );
    //     onChange(selected?.id || selected?.value || "");
    //   }}
    //   onAddOption={() => {}}
    //   error={error}
    //   helperText={helperText}
    //   placeholder={placeholder}
    //   required={required}
    //   disabled={disabled}
    //   showAddButton={false}
    //   sx={sx}
    // />
    <Autocomplete
      fullWidth
      options={optionsArray}
      getOptionLabel={(option) => option?.name || option?.label || ""}
      value={selectedItem}
      onChange={(_event, newValue) => {
        if (newValue) {
          onChange(newValue?.id || newValue?.value || "");
        } else {
          onChange("")
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
        />
      )}
      sx={{
        ...sx,
        '& .MuiOutlinedInput-root': {
          padding: '0px 4px !important',
          minHeight: '37px',
        },
        '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
          padding: '2px !important',
        },
      }}
    />
  );
};