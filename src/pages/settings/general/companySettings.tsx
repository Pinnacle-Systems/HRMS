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
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const {
    countries,
    states,
    cities,
    loading,
    fetchStatesByCountry,
    fetchCitiesByCountry,
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

      // OPTIONAL
      await fetchCitiesByCountry(value);
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
        const logoUrl = response.data?.logoUrl || response.data?.url;
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
        const signatureUrl = response.data?.signatureUrl || response.data?.url;
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
      setCompanyInfo({ ...companyInfo, [key]: file });
      if (key === "logo") setLogoFile(file);
      if (key === "signature") setSignatureFile(file);
      return;
    }
    if (key === "logo") {
      await handleLogoUpload(file);
    } else if (key === "signature") {
      await handleSignatureUpload(file);
    }
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const companyId = "3ddb07c5-45ab-4ab5-ba45-e3f3f6874e14";
        const response: any = await companyService.getCompanyById(companyId);
        setCompanyInfo({
          companyType: "Head Office",
          ...response.data,
        });
        if (response.data?.logoUrl) setLogoFile(response.data.logoUrl.replace(/([^:]\/)\/+/g, "$1"));
        if (response.data?.signatureUrl) setSignatureFile(response.data.signatureUrl);
      } catch (err: any) {
        showSnackbar(err.message || "Failed to fetch company info", 'error');
      }
    };
    fetchCompanyInfo();
  }, [showSnackbar]);

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
          // "currencyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
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
          "signatoryDesignation": companyInfo.signatoryDesignation
        }
        const res: any = await companyService.updateCompany(companyInfo.id, updatedValue);
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      } catch (error: any) {
        showSnackbar(error.message, "error");
      } finally {
        hideSpinner();
      }
    } else {
      try {
        const res: any = await companyService.createCompany(companyInfo);
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      } catch (error: any) {
        showSnackbar(error.message, "error");
      } finally {
        hideSpinner();
      }
    }

  };

  const handleCancel = () => {
    setLogoFile("");
    setSignatureFile("");
    setErrors({});
  };

  // Common sx styles for all fields
  const commonSx = {
    width: "max-content",
    minWidth: "194px",
    maxWidth: "100%",
    background: "var(--bg-primary)",
    "& .MuiPickersOutlinedInput-root": {
      width: "194px"
    },
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
            className={`${key == "contact_email" ? "!w-[230px]" : ""}`}
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
            className={`${key == "contact_email" ? "!w-[230px]" : ""}`}
          />
        )}

        {type === "date" && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              value={value ? dayjs(value) : null}
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
                  : cities
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
            sx={commonSx}
          >
            <InputLabel>{label}</InputLabel>
            <Select
              label={label}
              value={value || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="!text-[12px]"
            >
              <MenuItem value="">
                <em>{placeholder || `Select ${label}`}</em>
              </MenuItem>
              {(field.options || []).map((option: any) => (
                <MenuItem key={option.value} value={option.value} className="!text-[12px]">
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{errors[key]}</FormHelperText>}
          </FormControl>
        )}
        {type === "map" && (
          <LocationMap
            mapUrl={mapUrl}
            googleMapLink={googleMapLink}
            style={{
              height: "137px",
              width: "400px",
            }}
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
                    <div className="flex flex-wrap items-center gap-y-5 gap-x-4">
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
                companyId={companyInfo.id ? companyInfo.id : ''}
              />
            ))}
          </div>
        </Box>
      </div>
    </>
  );
};

export default CompanySettings;
