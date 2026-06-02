import { useEffect, useState } from "react";
import { TextField, Box, Button, Select, FormControl, InputLabel, MenuItem, FormHelperText } from "@mui/material";
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
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import type { CompanyInfo } from "./type";
import { companyService } from "../../../services/modules/company";
import { useUI } from "../../../context/Snackbar";
import { useMasterData } from "../../../hooks/useMasterData";
import { MasterSelect } from "../../../components/MasterSelect";
import LocationMap from "../../../components/Map";
import dayjs from "dayjs";

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<Partial<any>>({
    companyType: "Head Office",
  });
  const [logoFile, setLogoFile] = useState<any>("");
  const [signatureFile, setSignatureFile] = useState<File | string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const {
    countries,
    states,
    cities,
    currencies,
    loading,
    fetchStatesByCountry,
    fetchCitiesByState,
  } = useMasterData();
  const [mapUrl, setMapUrl] = useState("");

  const [googleMapLink, setGoogleMapLink] = useState("");

  const generateMapFromAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    setMapUrl(
      `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    );
    setGoogleMapLink(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    );
  };

  const handleMasterDataChange = async (
    key: string,
    value: string
  ) => {
    setCompanyInfo((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    // Country selected
    if (key === "countryId") {
      setCompanyInfo((prev: any) => ({
        ...prev,
        countryId: value,
        stateId: "",
        cityId: "",
      }));
      await fetchStatesByCountry(value);
    }

    // State selected
    if (key === "stateId") {
      setCompanyInfo((prev: any) => ({
        ...prev,
        stateId: value,
        cityId: "",
      }));
      await fetchCitiesByState(value);
    }
  };

  const handleChange = async (key: string, value: string | string[]) => {
    setCompanyInfo({ ...companyInfo, [key]: value });
    const error = validateField(key, value as string);
    setErrors((prev) => ({ ...prev, [key]: error }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (companyInfo.companyAddress) {
        generateMapFromAddress(companyInfo.companyAddress);
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [companyInfo.companyAddress]);

  const handleLogoUpload = async (file: File) => {
    const companyId = companyInfo.id;
    if (!companyId) {
      showSnackbar("Please save company info before uploading logo", "warning");
      return;
    }
    showSpinner();
    try {
      const response: any = await companyService.uploadLogo(companyId, file);
      if (response.success) {
        const rawUrl = response.data?.logoUrl || response.data?.url;
        const ts = new Date().getTime();
        const logoUrl = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=${ts}`;
        setLogoFile(logoUrl);
        setCompanyInfo((prev: any) => ({ ...prev, logoUrl }));
        showSnackbar("Logo uploaded successfully!", "success");
      } else {
        showSnackbar(response.message, "error");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // Handle signature upload
  const handleSignatureUpload = async (file: File) => {
    const companyId = companyInfo.id;
    if (!companyId) {
      showSnackbar("Please save company info before uploading signature", "warning");
      return;
    }
    showSpinner();
    try {
      const response: any = await companyService.uploadSignature(companyId, file);
      if (response.success) {
        const rawUrl = response.data?.signatureUrl || response.data?.url;
        const ts = new Date().getTime();
        const signatureUrl = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=${ts}`;
        setSignatureFile(signatureUrl);
        setCompanyInfo((prev: any) => ({ ...prev, signatureUrl }));
        showSnackbar("Signature uploaded successfully!", "success");
      } else {
        showSnackbar(response.message, "error");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleFileChange = async (key: string, file: File | string) => {
    if (typeof file === "string") {
      const companyId = companyInfo.id;
      if (key === "logoUrl") {
        if (companyId) {
          showSpinner();
          try {
            await companyService.deleteLogo(companyId);
            setCompanyInfo((prev: any) => ({ ...prev, logoUrl: "" }));
            setLogoFile("");
            showSnackbar("Logo removed successfully!", "success");
          } catch (error: any) {
            showSnackbar(error.message || "Failed to remove logo", "error");
          } finally {
            hideSpinner();
          }
        } else {
          setCompanyInfo((prev: any) => ({ ...prev, logoUrl: "" }));
          setLogoFile("");
        }
      } else if (key === "signatureUrl") {
        if (companyId) {
          showSpinner();
          try {
            await companyService.deleteSignature(companyId);
            setCompanyInfo((prev: any) => ({ ...prev, signatureUrl: "" }));
            setSignatureFile("");
            showSnackbar("Signature removed successfully!", "success");
          } catch (error: any) {
            showSnackbar(error.message || "Failed to remove signature", "error");
          } finally {
            hideSpinner();
          }
        } else {
          setCompanyInfo((prev: any) => ({ ...prev, signatureUrl: "" }));
          setSignatureFile("");
        }
      }
      return;
    }
    if (key === "logoUrl") {
      await handleLogoUpload(file);
    } else if (key === "signatureUrl") {
      await handleSignatureUpload(file);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const companyData: any = await companyService.getCompany();
      const companyId = companyData.data.length ? companyData.data?.[0].id : '';
      if (companyId) {
        const response: any = await companyService.getCompanyById(companyId);
        setCompanyInfo({
          companyType: "Head Office",
          ...response.data,
        });
        if (response.data.countryId) {
          void fetchStatesByCountry(response.data.countryId);
        }
        if (response.data.stateId) {
          void fetchCitiesByState(response.data.stateId);
        }
        if (response.data?.logoUrl) {
          const logoUrl = `${response.data.logoUrl}?v=${Date.now()}`;
          setLogoFile(logoUrl);
          setCompanyInfo((prev: any) => ({ ...prev, logoUrl }));
        }
        if (response.data?.signatureUrl) {
          const signatureUrl = `${response.data.signatureUrl}?v=${Date.now()}`;
          setSignatureFile(signatureUrl);
          setCompanyInfo((prev: any) => ({ ...prev, signatureUrl }));
        }
      }
    } catch (err: any) {
      showSnackbar(err.message || "Failed to fetch company info", 'error');
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

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
    if (companyInfo.id) {
      try {
        const updatedValue = {
          "companyName": companyInfo.companyName,
          aliasName: companyInfo.aliasName || "",
          code: companyInfo.code || "",
          costCode: companyInfo.costCode || "",
          "companyType": companyInfo.companyType,
          "companyAddress": companyInfo.companyAddress,
          "countryId": companyInfo.countryId,
          "stateId": companyInfo.stateId,
          "cityId": companyInfo.cityId,
          "pincode": companyInfo.pincode,
          // "timeZone": companyInfo.company,
          "currencyId": companyInfo.currencyId,
          "email": companyInfo.email,
          "phone": companyInfo.phone,
          "website": companyInfo.website,
          "fax": companyInfo.fax,
          "cin": companyInfo.cin,
          // "incorporationDate": "2026-05-11",
          // "udyamNo": companyInfo.company,
          licenseNo: companyInfo.licenseNo || "",
          tinNo: companyInfo.tinNo || "",
          cstNo: companyInfo.cstNo || "",
          cstDate: companyInfo.cstDate || "",
          "pfNo": companyInfo.pfNo,
          "tanNo": companyInfo.tanNo,
          "panNo": companyInfo.panNo,
          "esiNo": companyInfo.esiNo,
          "linNo": companyInfo.linNo,
          "gstNo": companyInfo.gstNo,
          "registrationCertificateNo": companyInfo.registrationCertificateNo,
          esicCode: companyInfo.esicCode || "",
          estdCode: companyInfo.estdCode || "",
          contactName: companyInfo.contactName || "",
          designation: companyInfo.designation || "",
          phoneNo: companyInfo.phoneNo || "",
          contactEmail: companyInfo.contactEmail || "",
          "payrollFrequency": companyInfo.company,
          "salaryPayDay": companyInfo.salaryPayDay,
          "fiscalYearStartMonth": companyInfo.fiscalYearStartMonth,
          "twitterHandle": companyInfo.twitterHandle,
          "linkedinUrl": companyInfo.linkedinUrl,
          "facebookUrl": companyInfo.facebookUrl,
          "instagramHandle": companyInfo.instagramHandle,
          "signatoryName": companyInfo.signatoryName,
          "signatoryDesignation": companyInfo.signatoryDesignation,
        }
        const res: any = await companyService.updateCompany(companyInfo.id, updatedValue);
        if (res.success) {
          showSnackbar("Company settings saved successfully!", "success");
        }
      } catch (error: any) {
        showSnackbar(error.message, "error");
      } finally {
        hideSpinner();
      }
    } else {
      try {
        const payload = { ...companyInfo };
        delete payload['currency'];
        const res: any = await companyService.createCompany(payload);
        if (res.success) {
          showSnackbar("Company settings saved successfully!", "success");
        }
        await fetchCompanyInfo();
      } catch (error: any) {
        showSnackbar(error.message, "error");
      } finally {
        hideSpinner();
      }
    }
  };

  const handleCancel = async () => {
    setLogoFile("");
    setSignatureFile("");
    setErrors({});
    showConfirmDialog({
      title: "Delete Branch",
      message: `Are you sure you want to delete "${companyInfo.companyName}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const res: any = await companyService.deleteCompanyById(companyInfo.id);
          if (res.success) {
            showSnackbar(res.message, "success");
            await fetchCompanyInfo();
          }
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Common sx styles for all fields
  const commonSx = {
    width: "100%",
    minWidth: 0,
    background: "var(--bg-primary)",
    "& .MuiFormHelperText-root": {
      fontSize: "10px",
      marginLeft: 0,
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
    const { key, label, multiline, rows, placeholder, type, required, disabled } = field;
    const hasError = !!errors[key];
    const rules = validationRules[key as keyof typeof validationRules];
    const value = companyInfo[key];

    return (
      <div key={key}>
        {type === "text" && (
          <TextField
            label={label}
            multiline={multiline}
            rows={rows}
            required={required}
            disabled={disabled}
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

        {type === "number" && (
          <TextField
            type="number"
            label={label}
            required={required}
            disabled={disabled}
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
              value={value ? dayjs(value) : null}
              onChange={(newValue) =>
                handleChange(key, dayjs(newValue)?.format("YYYY-MM-DD") || "")
              }
              sx={commonSx}
              slotProps={{
                textField: {
                  error: hasError,
                  helperText: hasError ? errors[key] : "",
                  sx: commonSx,
                },
                openPickerButton: {
                  color: "primary",
                  edge: "end",
                },
              }}
            />
          </LocalizationProvider>
        )}

        {type === "master-select" && (
          <MasterSelect
            label={label}
            value={companyInfo[key] || ""}
            onChange={(newValue) =>
              handleMasterDataChange(key, newValue)
            }
            options={
              key === "countryId"
                ? countries
                : key === "stateId"
                  ? states
                  : key === "currencyId" ? currencies : cities
            }
            error={hasError}
            helperText={hasError ? errors[key] : ""}
            placeholder={placeholder}
            required={required}
            disabled={loading}
            sx={commonSx}
          />
        )}

        {type === "select" && (
          <FormControl
            fullWidth
            size="small"
            error={hasError}
            required={required}
            disabled={disabled}
            sx={{
              ...commonSx,
              "& .MuiInputLabel-root": {
                top: '2px',
              },
              "& .MuiInputLabel-shrink": {
                top: '2px',
              },
            }}
          >
            <InputLabel>{label}</InputLabel>
            <Select
              label={label}
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <MenuItem value="">
                <em>{placeholder || `Select ${label}`}</em>
              </MenuItem>
              {(field.options || []).map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{errors[key]}</FormHelperText>}
          </FormControl>
        )}

        {/* {type === "add-select" && (
          <DynamicSelectWithAdd
            label={label}
            value={companyInfo[key] || ""}
            required={required}
            onChange={(value) => {
              const selected = currencyOptions.find(
                (opt: any) => opt.name === value
              );

              setCompanyInfo((prev: any) => ({
                ...prev,
                currency: value,
                currencyId: selected?.id || "",
              }));
            }}
            options={currencyOptions.map(
              (opt: any) => opt.name
            )}
            onAddOption={(newOption) =>
              handleAddOption(newOption)
            }
            showAddButton={true}
            sx={commonSx}
          />
        )} */}

        {type === "map" && (
          <LocationMap
            mapUrl={mapUrl}
            googleMapLink={googleMapLink}
            style={{ height: "100px", width: "100%" }}
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
          {(companyInfo && companyInfo.id) &&
            <Button
              variant="outlined"
              className="!text-gray-800 !border-gray-300"
              onClick={handleCancel}
            >
              Delete
            </Button>
          }
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
        <div className="space-y-4">
          {groupedSections.map((section, sectionIndex) => {
            const renderGridFields = (fields: any[], gridClass: string) => (
              <div className={`grid gap-x-3 gap-y-6 ${gridClass}`}>
                {fields.map((field: any) => (
                  <div key={field.key}
                    className={`min-w-0 ${field.key === "contactEmail" ? "md:col-span-2" : ""}`}
                  >
                    {renderField(field)}
                  </div>
                ))}
              </div>
            );

            const hasSubSections = section.subSections.length > 0;

            if (hasSubSections) {
              const isSpecial = (f: any) =>
                f.type === "map" || (f.multiline && f.rows && f.rows > 1);
              const regularFields = section.fields.filter((f: any) => !isSpecial(f));
              const specialFields = section.fields.filter(isSpecial); // address + map
              return (
                <div key={section.id || sectionIndex} className="border p-4 pt-6 rounded-lg bg-white dark:bg-white-50 border-gray-300 space-y-4">
                  {/* Top row: companyName, aliasName, code, costCode, companyType */}
                  {regularFields.length > 0 && renderGridFields(regularFields, "grid-cols-2 md:grid-cols-3 lg:grid-cols-[2fr_2fr_1fr_1fr_1fr]")}
                  {/* Bottom: left = Address + Map stacked, right = subsection fields */}
                  <div className="grid md:flex items-center gap-4">
                    {/* Left column: Address + Map stacked, each full width */}
                    {specialFields.length > 0 && (
                      <div className="flex gap-4 md:w-1/2 w-full min-w-0">
                        {specialFields.map((field: any) => (
                          <div key={field.key} className="w-full min-w-0">
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Right column: Country, State, City, Pincode, Phone, Fax, Email */}
                    <div className="flex-1 min-w-0">
                      {section.subSections.map((sub: any, subIdx: number) => (
                        <div key={sub.id || subIdx} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-5">
                          {sub.fields.map((field: any) => (
                            <div
                              key={field.key}
                              className={`min-w-0 ${field.key === "email" ? "md:col-span-2" : ""}`}
                            >
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            const gridClass =
              // fieldCount % 7 === 0 ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-7" :
              // fieldCount % 9 === 0 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-7" :
              // fieldCount % 3 === 0 ? "grid-cols-2 sm:grid-cols-3" :
              "grid-cols-2 sm:grid-cols-4 md:grid-cols-7";

            return (
              <div key={section.id || sectionIndex} className="border py-6 px-4 rounded-lg bg-white dark:bg-white-50 border-gray-300">
                {renderGridFields(section.fields, gridClass)}
              </div>
            );
          })}
        </div>

        {
          companyInfo.id &&
          <Box className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fileUploadFields.map((field) => (
                <FileUpload
                  key={field.key}
                  label={field.label}
                  value={field.key === "logoUrl" ? logoFile : signatureFile}
                  onChange={(file) => handleFileChange(field.key, file)}
                  accept={field.accept}
                  maxSize={field.maxSize}
                  description={field.description}
                  companyId={companyInfo.id}
                />
              ))}
            </div>
          </Box>
        }
      </div>
    </>
  );
};

export default CompanySettings;