import React, { useMemo, useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  ListItemText,
  Divider,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  type SxProps,
  type Theme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface DynamicSelectWithAddProps {
  label: string;
  title?:string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
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
  title,
  value,
  onChange,
  options,
  onAddOption,
  error,
  helperText,
  placeholder,
  // multiple = false,
  showAddButton = true,
  disabled = false,
  required = false,
  sx,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [newOption, setNewOption] = useState("");
  const [addedOptions, setAddedOptions] = useState<string[]>([]);
  const localOptions = useMemo(
    () => Array.from(new Set([...options, ...addedOptions])),
    [addedOptions, options],
  );  

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    if (localOptions.includes(newOption.trim())) {
      setNewOption("");
      setOpenDialog(false);
      return;
    }
    setIsAdding(true);
    try {
      await onAddOption(newOption.trim());
      setAddedOptions((current) => [...current, newOption.trim()]);
      // if (!multiple && onChange) {
      //   onChange(newOption.trim());
      // }
      setNewOption("");
      setOpenDialog(false);
    } catch (error) {
      console.error("Failed to add option:", error);
    } finally {
      setIsAdding(false);
    }
  };


  // Render selected values
  const renderValue = (selected: unknown) => {
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
    if (Array.isArray(selected)) {
      return selected.join(", ") || placeholder || `Select ${label ? label : title}`;
    }
    return String(selected);
  };

  // Build menu items
  const menuItems = [
    ...localOptions.map((option: string) => (
      <MenuItem key={option} value={option}>
        {/* {multiple && <Checkbox checked={value?.includes(option)} />} */}
        <ListItemText primary={option} />
      </MenuItem>
    )),
    showAddButton && (
      <div key="sticky-add"
        style={{
          position: "sticky",
          bottom: 0,
          background: "white",
          zIndex: 10,
        }}>
        <Divider key="divider" />
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
          <AddIcon fontSize="small" className="!h-8" />
          <span style={{ fontSize: "12px", fontWeight: 500 }}>Add New {label ? label : title}</span>
        </MenuItem>
      </div>
    ),
  ].filter(Boolean);

  return (
    <>
      <FormControl
        error={error}
        disabled={disabled}
        required={required}
        sx={{
          // width: "max-content",
          // minWidth: "180px",
          // maxWidth: "100%",
          ...sx,
        }}
      >
        <InputLabel>{label ? label : ''}</InputLabel>
        <Select
          // multiple={multiple}
          // value={value || (multiple ? [] : "")}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          input={<OutlinedInput label={label ? label : title} />}
          className="!text-[12px] !text-gray-800"
          // sx={{
          //   "& .MuiPaper-root": {
          //     Height: 100,
          //   },
          // }}
          renderValue={renderValue}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  maxHeight: 250,
                  pb: 0,
                },
              },
              list: {
                sx: {
                  pb: 0,
                },
              },
            },
          }}
        >
          {menuItems}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      {/* Add New Option Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setNewOption("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="!text-primary !font-bold !border-b !border-gray-200">
          Add New {label ? label : title}
        </DialogTitle>
        <DialogContent className="!pt-4">
          <TextField
            autoFocus
            margin="dense"
            label={`New ${label ? label : title}`}
            type="text"
            variant="outlined"
            value={newOption}
            fullWidth
            onChange={(e) => setNewOption(e.target.value)}
            placeholder={`Enter new ${label ? label.toLowerCase() : title ? title.toLowerCase() : ''}`}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddOption();
              }
            }}
            helperText={
              localOptions.includes(newOption) ? "This value already exists" : ""
            }
            error={localOptions.includes(newOption)}
            disabled={isAdding}
          />
        </DialogContent>
        <DialogActions className="border-t borde-gray-200 !p-4">
          <Button
            onClick={() => {
              setOpenDialog(false);
              setNewOption("");
            }}
            className="!text-gray-800 !border-gray-200"
            disabled={isAdding}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddOption}
            variant="contained"
            className="!bg-primary !text-white"
            disabled={!newOption.trim() || localOptions.includes(newOption.trim()) || isAdding}
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
