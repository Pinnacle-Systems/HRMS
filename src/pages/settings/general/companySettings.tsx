import { useState } from "react";
import { TextField, Box, Button } from "@mui/material";
import {
  companyFieldsWithSections,
  fileUploadFields,
  getCurrentRouteLabel,
} from "../const";
import { FileUpload } from "../../../components/FileUpload";
import { validateField, validationRules } from "../../../utils/validation";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DynamicSelectWithAdd } from "../../../components/SelectField";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import type { CompanyInfo } from "./type";
import { companyService } from "../../../services/modules/company";
import { useUI } from "../../../context/Snackbar";

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({});
  const [logoFile, setLogoFile] = useState<File | string>("");
  const [signatureFile, setSignatureFile] = useState<File | string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  // Master data state for select fields
  const [masterOptions, setMasterOptions] = useState({
    type_name: ["Head Office"],
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

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    let hasError = false;
    companyFieldsWithSections.forEach((field) => {
      const value = companyInfo[field.key as keyof CompanyInfo];
      if (field.required) {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[field.key] = `${field.label} is required`;
          hasError = true;
        }
      }
      if (value && typeof value === "string" && value.trim() !== "") {
        const error = validateField(field.key!, value);
        if (error) {
          newErrors[field.key!] = error;
          hasError = true;
        }
      }
    });
    setErrors(newErrors);
    if (hasError) {
      showSnackbar("Please fix validation errors before saving", "error");
      return;
    }
    showSpinner();
    try {
      const res = await companyService.createCompany(companyInfo);
      if (res.success) {
        showSnackbar(res.message, "success");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleCancel = () => {
    setLogoFile("");
    setSignatureFile("");
    setErrors({});
  };

  // Configuration for which select fields should show add button
  const getSelectConfig = (key: string) => {
    const configs: Record<
      string,
      { multiple: boolean; showAddButton: boolean }
    > = {
      type_name: { multiple: false, showAddButton: false },
      city: { multiple: false, showAddButton: false },
      country: { multiple: false, showAddButton: false },
      states: { multiple: true, showAddButton: false },
      timezone: { multiple: false, showAddButton: false },
      currency: { multiple: false, showAddButton: false },
    };
    return configs[key] || { multiple: false, showAddButton: true };
  };

  // Common sx styles for all fields
  const commonSx = {
    width: "max-content",
    minWidth: "193px",
    maxWidth: "100%",
    background: "var(--bg-primary)",
    "& .MuiFormHelperText-root": {
      fontSize: "10px",
      marginLeft: 0,
    },
    "& textarea": {
      width: "max-content !important",
      minWidth: "382px",
    },
  };

  // Group fields by section and sub-section
  const groupedSections: any[] = [];
  let currentSection: any = null;
  let currentSubSection: any = null;

  companyFieldsWithSections.forEach((field) => {
    if (field.isSection) {
      if (currentSection) {
        groupedSections.push(currentSection);
      }
      currentSection = {
        title: field.section,
        fields: [],
        subSections: [],
      };
      currentSubSection = null;
    } else if (field.isSubSection) {
      currentSubSection = {
        title: field.subSection,
        fields: [],
      };
      currentSection.subSections.push(currentSubSection);
    } else if (field.key) {
      if (currentSubSection) {
        currentSubSection.fields.push(field);
      } else if (currentSection) {
        currentSection.fields.push(field);
      }
    }
  });

  if (currentSection) {
    groupedSections.push(currentSection);
  }

  // renderField function
  const renderField = (field: any) => {
    const { key, label, multiline, rows, placeholder, type, required } = field;
    const hasError = !!errors[key];
    const rules = validationRules[key as keyof typeof validationRules];
    const value = companyInfo[key as keyof typeof companyInfo];

    return (
      <div key={key}>
        {type === "text" && (
          <TextField
            label={label}
            multiline={multiline}
            rows={rows}
            required={required}
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
            className={`${key == "contact_email" ? "!w-[230px]" : ""}`}
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
            value={value}
            onChange={(newValue: string | string[]) =>
              handleChange(key, newValue)
            }
            options={masterOptions[key as keyof typeof masterOptions] || []}
            onAddOption={(newOption: string) => handleAddOption(key, newOption)}
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
  };

  return (
    <>
      <div className="flex item-center justify-between mb-3 mt-3">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {getCurrentRouteLabel()}
          </span>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="!bg-primary"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
      <div className="overflow-auto h-[calc(100vh-200px)]">
        <div className="space-y-4 ">
          {groupedSections.map((section, sectionIndex) => (
            <div
              key={section.id || sectionIndex}
              className="space-y-2 mb-2  border p-5 rounded-lg bg-gray-50"
            >
              <div className="flex flex-wrap">
                {section.fields.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-y-5 gap-x-4">
                      {section.fields.map((field: any) => renderField(field))}
                      {section.subSections.length > 0 && (
                        <>
                          {section.subSections.map(
                            (subSection: any, subIdx: number) => (
                              <div
                                key={subSection.id || subIdx}
                                className="grid grid-cols-3 gap-4"
                              >
                                {subSection.fields.map((field: any) =>
                                  renderField(field),
                                )}
                              </div>
                            ),
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <Box className="mt-4">
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
      </div>
    </>
  );
};

export default CompanySettings;
