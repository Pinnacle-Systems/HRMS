// components/SelectField.tsx
import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  type SxProps,
  type Theme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface DynamicSelectWithAddProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: string[];
  onAddOption: (newOption: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  multiple?: boolean;
  showAddButton?: boolean;
  disabled?: boolean;
  required?: boolean;
  sx?: SxProps<Theme>;
}

export const DynamicSelectWithAdd: React.FC<DynamicSelectWithAddProps> = ({
  label,
  value,
  onChange,
  options,
  onAddOption,
  error,
  helperText,
  placeholder,
  multiple = false,
  showAddButton = true,
  disabled = false,
  required = false,
  sx,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [localOptions, setLocalOptions] = useState(options);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const handleAddOption = () => {
    if (newOption.trim() && !localOptions.includes(newOption.trim())) {
      const updatedOptions = [...localOptions, newOption.trim()];
      setLocalOptions(updatedOptions);
      if (onAddOption) {
        onAddOption(newOption.trim());
      }
      setNewOption("");
      setOpenDialog(false);

      // Auto-select the newly added option for single select
      if (!multiple && onChange) {
        onChange(newOption.trim());
      }
    }
  };

  // Render selected values
  const renderValue = (selected: any) => {
    // if (multiple && Array.isArray(selected) && selected.length > 0) {
    //   return (
    //     <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
    //       {selected.map((val: string) => (
    //         <Chip 
    //           key={val} 
    //           label={val} 
    //           size="small" 
    //           className="!text-gray-800 !bg-gray-100" 
    //         />
    //       ))}
    //     </Box>
    //   );
    // }
    return selected || placeholder || `Select ${label}`;
  };

  // Build menu items
  const menuItems = [
    ...localOptions.map((option: string) => (
      <MenuItem key={option} value={option}>
        {multiple && <Checkbox checked={value?.includes(option)} />}
        <ListItemText primary={option} />
      </MenuItem>
    )),
    showAddButton && <Divider key="divider" />,
    showAddButton && (
      <MenuItem
        key="add-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenDialog(true);
        }}
        sx={{
          color: "primary.main",
          justifyContent: "center",
          gap: 1,
          py: 1,
        }}
      >
        <AddIcon fontSize="small" />
        <span style={{ fontSize: "12px", fontWeight: 500 }}>Add New {label}</span>
      </MenuItem>
    ),
  ].filter(Boolean);

  return (
    <>
      <FormControl
        error={error}
        disabled={disabled}
        required={required}
        sx={{
          width: "max-content",
          minWidth: "200px",
          maxWidth: "100%",
          ...sx,
        }}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          multiple={multiple}
          value={value || (multiple ? [] : "")}
          onChange={(e) => onChange(e.target.value)}
          input={<OutlinedInput label={label} />}
          sx={{
            "& .MuiPaper-root": {
              Height: 100,
              },
          }}
          renderValue={renderValue}
        >
          {menuItems}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      {/* Add New Option Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        className="w-[100vw]"
      >
        <DialogTitle className="!text-primary !font-bold">
          Add New {label}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`New ${label}`}
            type="text"
            variant="outlined"
            value={newOption}
            className="w-[400px]"
            onChange={(e) => setNewOption(e.target.value)}
            placeholder={`Enter new ${label.toLowerCase()}`}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddOption();
              }
            }}
            helperText={
              localOptions.includes(newOption) ? "This value already exists" : ""
            }
            error={localOptions.includes(newOption)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setNewOption("");
            }}
            className="!capitalize !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddOption}
            variant="contained"
            className="!capitalize !bg-primary !text-white"
            disabled={!newOption.trim() || localOptions.includes(newOption.trim())}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};