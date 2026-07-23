import React, { useMemo, useState } from "react";
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  type SxProps,
  type Theme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const ADD_OPTION_VALUE = "##ADD_NEW_OPTION##";

interface DynamicSelectWithAddProps {
  label: string;
  title?: string;
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
  multiple = false,
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
    [addedOptions, options]
  );

  const baseOptions = useMemo(
    () => localOptions.map((opt) => ({ label: opt, value: opt })),
    [localOptions]
  );

  const filterOptions = (
    options: Array<{ label: string; value: string }>,
    { inputValue }: { inputValue: string }
  ) => {
    // Filter regular options by input value
    const filtered = options.filter(
      (opt) =>
        opt.value !== ADD_OPTION_VALUE &&
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    if (showAddButton) {
      // Determine the label for the add option
      const addLabel = inputValue.trim()
        ? `Add "${inputValue.trim()}"`
        : `Add New ${label || title || ""}`;

      // Check if the input exactly matches an existing option
      const exactMatch = localOptions.some(
        (opt) => opt.toLowerCase() === inputValue.trim().toLowerCase()
      );

      // If there's no exact match, show the add option with the input text
      // Otherwise, show the generic "Add New" label
      const finalLabel = exactMatch ? `Add New ${label || title || ""}` : addLabel;

      // Create the add option object
      const addOption = {
        label: finalLabel,
        value: ADD_OPTION_VALUE,
      };

      // Push it to the end of the filtered list
      filtered.push(addOption);
    }

    return filtered;
  };

  // Convert external value to Autocomplete's expected format
  const autocompleteValue = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return localOptions
        .filter((opt) => value.includes(opt))
        .map((opt) => ({ label: opt, value: opt }));
    } else {
      const strValue = typeof value === "string" ? value : "";
      const found = localOptions.find((opt) => opt === strValue);
      return found ? { label: found, value: found } : null;
    }
  }, [value, multiple, localOptions]);

  const handleAutocompleteChange = (
    _event: React.SyntheticEvent,
    newValue:
      | { label: string; value: string }
      | Array<{ label: string; value: string }>
      | null
  ) => {
    if (multiple) {
      const selected = (newValue as Array<{ label: string; value: string }>) || [];
      const values = selected
        .map((item) => item.value)
        .filter((v) => v !== ADD_OPTION_VALUE);
      onChange(values);
    } else {
      if (newValue === null) {
        onChange("");
        return;
      }
      const selected = newValue as { label: string; value: string };
      if (selected.value === ADD_OPTION_VALUE) {
        setOpenDialog(true);
        return;
      }
      onChange(selected.value);
    }
  };

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
      setNewOption("");
      setOpenDialog(false);
    } catch (error) {
      console.error("Failed to add option:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Custom render for options – make "Add New" sticky with a divider
  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: { label: string; value: string }
  ) => {
    const isAddOption = option.value === ADD_OPTION_VALUE;

    return (
      <li
        {...props}
        style={{
          ...props.style,
          ...(isAddOption && {
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            marginTop: "8px",
            padding: "8px 16px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
          }),
        }}
      >
        {isAddOption ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "#1976d2",
              fontWeight: 500,
            }}
          >
            <AddIcon fontSize="small" />
            <span>{option.label}</span>
          </div>
        ) : (
          option.label
        )}
      </li>
    );
  };

  return (
    <>
      <Autocomplete
        multiple={multiple}
        options={baseOptions} // pass only the regular options
        value={autocompleteValue}
        onChange={handleAutocompleteChange}
        disableClearable={false}
        disabled={disabled}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) =>
          option.value === selected.value && option.value !== ADD_OPTION_VALUE
        }
        renderOption={renderOption}
        filterOptions={filterOptions} // custom filter
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            required={required}
            sx={{
              "& .MuiInputBase-root": {
                fontSize: "12px",
                color: "gray.800",
              },
              ...sx,
            }}
          />
        )}
        slotProps={{
          listbox: {
            sx: {
              maxHeight: 180,
              overflow: "auto",
              paddingBottom: 0,
              "& .MuiAutocomplete-option": {
                padding: "6px 16px",
              },
            },
          },
          paper: {
            sx: {
              overflow: "visible",
            },
          },
        }}
      />

      {/* Dialog (unchanged) */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setNewOption("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="!text-gray-800 !border-b !border-gray-200">
          Add New {label || title}
        </DialogTitle>
        <DialogContent className="!pt-4">
          <TextField
            autoFocus
            margin="dense"
            label={`New ${label || title}`}
            type="text"
            variant="outlined"
            value={newOption}
            fullWidth
            onChange={(e) => setNewOption(e.target.value)}
            placeholder={`Enter new ${(label || title || "").toLowerCase()}`}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddOption();
              }
            }}
            helperText={
              localOptions.includes(newOption.trim())
                ? "This value already exists"
                : ""
            }
            error={localOptions.includes(newOption.trim())}
            disabled={isAdding}
          />
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
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
            disabled={
              !newOption.trim() ||
              localOptions.includes(newOption.trim()) ||
              isAdding
            }
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};