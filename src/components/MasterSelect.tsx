import { DynamicSelectWithAdd } from "./SelectField";
import type { SxProps, Theme } from "@mui/system";

interface MasterSelectProps {
  options: any[];
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
  options,
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

  const selectedLabel =
    options.find((item) => item.id === value)?.name || "";

  return (
    <DynamicSelectWithAdd
      label={label || ""}
      value={selectedLabel}
      options={options.map((item) => item.name)}
      onChange={(selectedName: any) => {

        const selected = options.find(
          (item) => item.name === selectedName
        );

        onChange(selected?.id || "");
      }}
      onAddOption={() => {}}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      showAddButton={false}
      sx={sx}
    />
  );
};