import { useState } from "react";
import { TextField, Box, Button, Snackbar, Alert } from "@mui/material";
import type { AlertColor } from "@mui/material";
import { companyFields, fileUploadFields } from "./const";
import { FileUpload } from "../../components/FileUpload";
import { validateField, validationRules } from "../../utils/validation";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DynamicSelectWithAdd } from "../../components/SelectField";

interface CompanyInfo {
  name: string;
  address: string;
  gst: string;
  pan: string;
  country: string;
  states: string;
  timezone: string;
  currency: string;
  pf_no: string;
  tan_no: string;
  esi_no: string;
  lin_no: string;
  registration_no: string;
  twitter: string;
  logo: string | File;
  signature: string | File;
}

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "VibeHR Solutions",
    address: "123 Business Park, Mumbai, India",
    gst: "27AAAAA1234A1Z",
    pan: "AAAAA1234A",
    country: "",
    states: "",
    timezone: "",
    currency: "",
    pf_no: "",
    tan_no: "",
    esi_no: "",
    lin_no: "",
    registration_no: "",
    twitter: "",
    logo: "",
    signature: "",
  });

  const [logoFile, setLogoFile] = useState<File | string>("");
  const [signatureFile, setSignatureFile] = useState<File | string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as AlertColor,
  });

  // Master data state for select fields
  const [masterOptions, setMasterOptions] = useState({
    division: ["IT", "HR", "Finance", "Operations", "Marketing"],
    type_name: [
      'Head Office',
    ],
    city: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"],
    country: ["India", "USA", "UK", "Canada", "Australia"],
    states: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "West Bengal"],
    timezone: ["IST", "EST", "PST", "GMT", "CST"],
    currency: ["INR", "USD", "EUR", "GBP", "JPY"],
  });

  const handleChange = (key: string, value: string | string[]) => {
    setCompanyInfo({ ...companyInfo, [key]: value });
    const error = validateField(key, value as string);
    setErrors((prev) => ({ ...prev, [key]: error }));
  };

  const handleFileChange = (key: string, file: File | string) => {
    setCompanyInfo({ ...companyInfo, [key]: file });
    if (key === "logo") setLogoFile(file);
    if (key === "signature") setSignatureFile(file);
  };

  const handleAddOption = (fieldKey: string, newOption: string) => {
    setMasterOptions({
      ...masterOptions,
      [fieldKey]: [
        ...masterOptions[fieldKey as keyof typeof masterOptions],
        newOption,
      ],
    });
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    (Object.keys(companyInfo) as Array<keyof CompanyInfo>).forEach((key) => {
      const value = companyInfo[key];
      if (value && typeof value === "string" && value.trim() !== "") {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
          hasError = true;
        }
      }
    });

    setErrors(newErrors);

    if (!hasError) {
      console.log("Saving company settings:", companyInfo);
      console.log("Logo file:", logoFile);
      console.log("Signature file:", signatureFile);
      setSnackbar({
        open: true,
        message: "Company settings saved successfully!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: "Please fix validation errors before saving",
        severity: "error",
      });
    }
  };

  const handleCancel = () => {
    setLogoFile("");
    setSignatureFile("");
    setErrors({});
    setSnackbar({
      open: true,
      message: "Changes discarded",
      severity: "info",
    });
  };

  // Configuration for which select fields should show add button
  const getSelectConfig = (key: string) => {
    const configs: Record<
      string,
      { multiple: boolean; showAddButton: boolean }
    > = {
      division: { multiple: false, showAddButton: true },
      type_name: { multiple: false, showAddButton: true },
      city: { multiple: false, showAddButton: true },
      country: { multiple: false, showAddButton: false },
      states: { multiple: true, showAddButton: true },
      timezone: { multiple: false, showAddButton: false },
      currency: { multiple: false, showAddButton: false },
    };
    return configs[key] || { multiple: false, showAddButton: true };
  };

  // Common sx styles for all fields
  const commonSx = {
    width: 'max-content',
    minWidth: '200px',
    maxWidth: '100%',
    "& .MuiFormHelperText-root": {
      fontSize: "10px",
      marginLeft: 0,
    },
    "& textarea": {
      width: "max-content !important",
      minWidth: "395px"
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
        {companyFields.map(
          ({ key, label, multiline, placeholder, type }) => {
            const hasError = !!errors[key];
            const rules = validationRules[key as keyof typeof validationRules];
            const value = companyInfo[key as keyof typeof companyInfo];

            return (
              <div key={key}>
                {type === "text" && (
                  <TextField
                    label={label}
                    multiline={multiline}
                    // rows={rows}
                    placeholder={
                      placeholder ||
                      (rules?.formatExample
                        ? `e.g., ${rules.formatExample}`
                        : `Enter ${label}`)
                    }
                    value={value || ""}
                    error={hasError}
                    helperText={hasError ? errors[key] : ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    sx={commonSx}
                  />
                )}

                {type === "date" && (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label={label}
                      // value={value || null}
                      onChange={(newValue) =>
                        handleChange(key, newValue?.format("YYYY-MM-DD") || "")
                      }
                      sx={commonSx}
                      slotProps={{
                        textField: {
                          error: hasError,
                          helperText: hasError ? errors[key] : "",
                          sx: commonSx,
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}

                {type === "select" && (
                  <DynamicSelectWithAdd
                    label={label}
                    value={
                      typeof value === "string" || Array.isArray(value)
                        ? value
                        : ""
                    }
                    onChange={(newValue: string | string[]) =>
                      handleChange(key, newValue)
                    }
                    options={
                      masterOptions[key as keyof typeof masterOptions] || []
                    }
                    onAddOption={(newOption: string) =>
                      handleAddOption(key, newOption)
                    }
                    error={hasError}
                    helperText={hasError ? errors[key] : ""}
                    placeholder={placeholder}
                    multiple={getSelectConfig(key).multiple}
                    showAddButton={getSelectConfig(key).showAddButton}
                    sx={commonSx}
                  />
                )}
              </div>
            );
          },
        )}
      </div>

      <Box className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fileUploadFields.map((field) => (
            <FileUpload
              key={field.key}
              label={field.label}
              value={field.key === "logo" ? logoFile : signatureFile}
              onChange={(file) => handleFileChange(field.key, file)}
              accept={field.accept}
              maxSize={field.maxSize}
              description={field.description}
            />
          ))}
        </div>
      </Box>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4">
        <Button
          variant="outlined"
          className="!capitalize !border-gray-300 !text-gray-800"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          className="!capitalize !bg-primary"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CompanySettings;
