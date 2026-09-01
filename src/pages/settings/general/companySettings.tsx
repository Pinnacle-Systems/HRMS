import { useEffect, useState } from "react";
import {
  TextField,
  Box,
  Button,
  Typography,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  Paper,
  Collapse,
  Card,
  CardContent,
} from "@mui/material";
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
import { fiscalYearService } from "../../../services/modules/fiscalYear";
import { formatDate } from "../../leave/leaveFormatters";
import { CloseOutlined, BusinessCenter, ExpandMore, ExpandLess } from "@mui/icons-material";
import { handleEnterAsTab } from "../../const";
import { branchService } from "../../../services/modules/branch";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges";
import { selectSx } from "../../../const";

// Helper to check if two objects are equal
const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// GST Search Type
type GSTSearchType = 'by_gst' | 'by_company';

interface GSTSearchResult {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: string;
  taxpayerType: string;
  constitution: string;
  registrationDate: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  centreJurisdiction: string;
  stateJurisdiction: string;
  stateCode: string;
  pan: string;
  entityType: string;
  source: string;
  provider: string;
  fetchedAt: string;
}

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<Partial<any>>({
    companyType: "Head Office",
  });
  const [initialCompanyInfo, setInitialCompanyInfo] = useState<Partial<any>>({});
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
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [fiscalYearForm, setFiscalYearForm] = useState({
    id: "",
    yearLabel: "",
    startDate: "",
    endDate: "",
  });
  const [fiscalYearLoading, setFiscalYearLoading] = useState(false);
  const [fiscalYearDialogOpen, setFiscalYearDialogOpen] = useState(false);

  // GST Search States
  const [gstSearchType, setGstSearchType] = useState<GSTSearchType>('by_gst');
  const [gstSearch, setGstSearch] = useState("");
  const [companyNameSearch, setCompanyNameSearch] = useState("");
  const [selectedStateForSearch, setSelectedStateForSearch] = useState("");
  const [gstSearchResults, setGstSearchResults] = useState<GSTSearchResult[]>([]);
  const [showGstResults, setShowGstResults] = useState(false);
  const [isSearchingGst, setIsSearchingGst] = useState(false);
  const [expandedGstResult, setExpandedGstResult] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = !isEqual(companyInfo, initialCompanyInfo) ||
    (logoFile !== "" && typeof logoFile !== 'string' && !companyInfo.logoUrl) ||
    (signatureFile !== "" && typeof signatureFile !== 'string' && !companyInfo.signatureUrl);

  // Handle save for navigation
  const handleSaveForNavigation = async (callback?: () => void): Promise<void> => {
    await handleSave(callback);
  };

  // Use the unsaved changes hook
  useUnsavedChanges({
    hasUnsavedChanges: hasUnsavedChanges && !isSaving,
    onSave: handleSaveForNavigation,
    message: 'You have unsaved company settings. Do you want to save before leaving?'
  });

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

    if (key === "countryId") {
      setCompanyInfo((prev: any) => ({
        ...prev,
        countryId: value,
        stateId: "",
        cityId: "",
      }));
      await fetchStatesByCountry(value);
    }

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

  const resetFiscalYearForm = () => {
    setFiscalYearForm({ id: "", yearLabel: "", startDate: "", endDate: "" });
  };

  const handleFiscalYearFieldChange = (key: keyof typeof fiscalYearForm, value: string) => {
    setFiscalYearForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchFiscalYears = async () => {
    if (!companyInfo.id) {
      setFiscalYears([]);
      return;
    }
    setFiscalYearLoading(true);
    try {
      const response: any = await fiscalYearService.getFiscalYears(companyInfo.id);
      if (response?.success) {
        const data = Array.isArray(response.data) ? response.data : [];
        setFiscalYears(data);
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load fiscal years", "error");
    } finally {
      setFiscalYearLoading(false);
    }
  };

  const handleFiscalYearSubmit = async () => {
    if (!companyInfo.id) {
      showSnackbar("Please save company information before managing fiscal years", "warning");
      return;
    }
    const { yearLabel, startDate, endDate } = fiscalYearForm;
    if (!yearLabel.trim() || !startDate || !endDate) {
      showSnackbar("Please complete year label, start date and end date", "warning");
      return;
    }
    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      showSnackbar("Start date cannot be later than end date", "warning");
      return;
    }
    setFiscalYearLoading(true);
    try {
      const payload = {
        yearLabel: yearLabel.trim(),
        startDate,
        endDate,
      };
      const response: any = fiscalYearForm.id
        ? await fiscalYearService.updateFiscalYear(companyInfo.id, fiscalYearForm.id, payload)
        : await fiscalYearService.createFiscalYear(companyInfo.id, payload);

      if (response?.success) {
        showSnackbar(
          fiscalYearForm.id ? "Fiscal year updated successfully" : "Fiscal year created successfully",
          "success",
        );
        resetFiscalYearForm();
        await fetchFiscalYears();
      } else {
        showSnackbar(response?.message || "Unable to save fiscal year", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to save fiscal year", "error");
    } finally {
      setFiscalYearLoading(false);
    }
  };

  const handleActivateFiscalYear = async (yearId: string) => {
    if (!companyInfo.id) return;
    setFiscalYearLoading(true);
    try {
      const response: any = await fiscalYearService.activateFiscalYear(companyInfo.id, yearId);
      if (response?.success) {
        showSnackbar("Fiscal year activated successfully", "success");
        await fetchFiscalYears();
      } else {
        showSnackbar(response?.message || "Unable to activate fiscal year", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to activate fiscal year", "error");
    } finally {
      setFiscalYearLoading(false);
    }
  };

  const handleDeleteFiscalYear = async (yearId: string) => {
    if (!companyInfo.id) return;
    showConfirmDialog({
      title: "Delete Fiscal Year",
      message: "Are you sure you want to delete this fiscal year?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setFiscalYearLoading(true);
        try {
          const response: any = await fiscalYearService.deleteFiscalYear(companyInfo.id, yearId);
          if (response?.success) {
            showSnackbar("Fiscal year deleted successfully", "success");
            await fetchFiscalYears();
          } else {
            showSnackbar(response?.message || "Unable to delete fiscal year", "error");
          }
        } catch (error: any) {
          showSnackbar(error?.message || "Unable to delete fiscal year", "error");
        } finally {
          setFiscalYearLoading(false);
        }
      },
    });
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
        const data = {
          companyType: "Head Office",
          ...response.data,
        };
        setCompanyInfo(data);
        setInitialCompanyInfo(data);

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
          setInitialCompanyInfo((prev: any) => ({ ...prev, logoUrl }));
        }
        if (response.data?.signatureUrl) {
          const signatureUrl = `${response.data.signatureUrl}?v=${Date.now()}`;
          setSignatureFile(signatureUrl);
          setCompanyInfo((prev: any) => ({ ...prev, signatureUrl }));
          setInitialCompanyInfo((prev: any) => ({ ...prev, signatureUrl }));
        }
      } else {
        // New company - no data yet
        const emptyData = { companyType: "Head Office" };
        setCompanyInfo(emptyData);
        setInitialCompanyInfo(emptyData);
      }
    } catch (err: any) {
      showSnackbar(err.message || "Failed to fetch company info", 'error');
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  useEffect(() => {
    if (companyInfo.id) {
      void fetchFiscalYears();
    }
  }, [companyInfo.id]);

  const handleSave = async (callback?: () => void) => {
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
      if (callback) callback();
      return;
    }
    setIsSaving(true);
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
          "currencyId": companyInfo.currencyId,
          "email": companyInfo.email,
          "phone": companyInfo.phone,
          "website": companyInfo.website,
          "fax": companyInfo.fax,
          "cin": companyInfo.cin,
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
          // Update initial state after save
          setInitialCompanyInfo({ ...companyInfo });
          if (callback) callback();
        }
      } catch (error: any) {
        showSnackbar(error.message, "error");
        if (callback) callback();
      } finally {
        hideSpinner();
        setIsSaving(false);
      }
    } else {
      try {
        const payload = { ...companyInfo };
        delete payload['currency'];
        const res: any = await companyService.createCompany(payload);
        if (res.success) {
          showSnackbar("Company settings saved successfully!", "success");
          await fetchCompanyInfo();
          await createDefaultBranch();
          // Update initial state after save
          setInitialCompanyInfo({ ...companyInfo });
          if (callback) callback();
        }
      } catch (error: any) {
        showSnackbar(error.message, "error");
        if (callback) callback();
      } finally {
        hideSpinner();
        setIsSaving(false);
      }
    }
  };

  const createDefaultBranch = async () => {
    try {
      await branchService.createDefaultBranch();
      showSnackbar("Default branch created successfully.", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const handleCancel = async () => {
    if (hasUnsavedChanges) {
      const userChoice = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!userChoice) {
        return;
      }
    }

    showConfirmDialog({
      title: "Delete Company",
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
    '& .MuiOutlinedInput-root': {
      padding: '0px 4px !important',
      minHeight: '37px !important',
    },
    "& .MuiSelect-select": {
      padding: "5px !important",
      width: "150px !important",
    },
    '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
      padding: '2px !important',
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

  // GST Search Functions
  const handleGSTSearch = async () => {
    if (gstSearchType === 'by_gst') {
      // Search by GST Number
      if (!gstSearch || gstSearch.length < 15) {
        showSnackbar("Please enter a valid 15-digit GSTIN", "warning");
        return;
      }
      await searchByGSTNumber(gstSearch);
    } else {
      // Search by Company Name and State
      if (!companyNameSearch.trim()) {
        showSnackbar("Please enter a company name", "warning");
        return;
      }
      await searchByCompanyName(companyNameSearch, selectedStateForSearch);
    }
  };

  const searchByGSTNumber = async (gstNo: string) => {
    setIsSearchingGst(true);
    setShowGstResults(false);
    try {
      const response: any = await companyService.getCompanyDetailsByGSTLookup({
        gstNo: gstNo.trim().toUpperCase(),
        refresh: true
      });

      if (response?.success && response?.data) {
        const gstData = response.data;
        setGstSearchResults([gstData]);
        setShowGstResults(true);
        
        // Show source information
        let sourceMessage = '';
        if (gstData.source === 'provider') {
          sourceMessage = `Fetched live from ${gstData.provider || 'GST registry'}`;
        } else if (gstData.source === 'cache') {
          sourceMessage = 'Retrieved from cache (up to date)';
        } else if (gstData.source === 'cache-stale') {
          sourceMessage = 'Using cached data (live fetch failed)';
        } else {
          sourceMessage = 'Data fetched successfully';
        }
        
        showSnackbar(`GST details found! (${sourceMessage})`, "success");
      } else {
        // Try fallback to existing company records
        const fallbackResponse: any = await companyService.getCompanyDetailsByGST({
          gstNo: gstNo.trim().toUpperCase()
        });
        if (fallbackResponse?.success && fallbackResponse?.data?.length > 0) {
          const companyData = fallbackResponse.data[0];
          // Convert to GST result format
          const gstResult: GSTSearchResult = {
            gstin: companyData.gstNo || gstNo,
            legalName: companyData.companyName,
            tradeName: companyData.aliasName || companyData.companyName,
            status: "Active",
            taxpayerType: "Regular",
            constitution: companyData.companyType || "",
            registrationDate: companyData.incorporationDate || "",
            address: companyData.companyAddress || "",
            city: companyData.cityName || "",
            state: companyData.stateName || "",
            pincode: companyData.pincode || "",
            centreJurisdiction: "",
            stateJurisdiction: "",
            stateCode: "",
            pan: companyData.panNo || "",
            entityType: "",
            source: "local",
            provider: "local",
            fetchedAt: new Date().toISOString()
          };
          setGstSearchResults([gstResult]);
          setShowGstResults(true);
          showSnackbar("Company details fetched from existing records!", "success");
        } else {
          showSnackbar(response?.message || "No GST details found", "error");
          setGstSearchResults([]);
        }
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to fetch GST details", "error");
      setGstSearchResults([]);
    } finally {
      setIsSearchingGst(false);
    }
  };

  const searchByCompanyName = async (companyName: string, state?: string) => {
    setIsSearchingGst(true);
    setShowGstResults(false);
    try {
      const response: any = await companyService.searchGSTByCompany({
        companyName: companyName.trim(),
        state: state || undefined
      });

      if (response?.success && response?.data && response.data.length > 0) {
        // Convert company search results to GST result format
        const results: GSTSearchResult[] = response.data.map((item: any) => ({
          gstin: item.gstNo || "",
          legalName: item.companyName || companyName,
          tradeName: item.companyName || companyName,
          status: "Active",
          taxpayerType: "Regular",
          constitution: "",
          registrationDate: "",
          address: "",
          city: "",
          state: item.stateName || state || "",
          pincode: "",
          centreJurisdiction: "",
          stateJurisdiction: "",
          stateCode: "",
          pan: "",
          entityType: "",
          source: "local",
          provider: "local",
          fetchedAt: new Date().toISOString()
        }));
        setGstSearchResults(results);
        setShowGstResults(true);
        showSnackbar(`Found ${results.length} GSTIN(s) for "${companyName}"`, "success");
      } else {
        showSnackbar("No GSTIN found for the given company name", "info");
        setGstSearchResults([]);
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to search GST by company name", "error");
      setGstSearchResults([]);
    } finally {
      setIsSearchingGst(false);
    }
  };

  const applyGSTResultToForm = (result: GSTSearchResult) => {
    const fullAddress = [
      result.address,
      result.city,
      result.state,
      result.pincode
    ].filter(Boolean).join(', ');

    setCompanyInfo((prev: any) => ({
      ...prev,
      gstNo: result.gstin || prev.gstNo,
      companyName: result.legalName || prev.companyName,
      aliasName: result.tradeName || prev.aliasName,
      panNo: result.pan || prev.panNo,
      companyAddress: fullAddress || result.address || prev.companyAddress,
      city: result.city || prev.city,
      state: result.state || prev.state,
      pincode: result.pincode || prev.pincode,
      registrationCertificateNo: result.gstin || prev.registrationCertificateNo,
      incorporationDate: result.registrationDate || prev.incorporationDate,
      companyType: result.constitution || prev.companyType,
    }));

    if (fullAddress) {
      generateMapFromAddress(fullAddress);
    }

    setShowGstResults(false);
    showSnackbar("GST details applied to form successfully!", "success");
  };

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
            disabled={disabled || isSaving}
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
            disabled={disabled || isSaving}
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
            disabled={loading || isSaving}
            sx={commonSx}
          />
        )}

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

  // Get available states for search (from master data)
  const searchStates = states.map((state: any) => ({
    id: state.id,
    name: state.name
  }));

  return (
    <>
      <Box onKeyDown={handleEnterAsTab}>
        <div className="flex item-center justify-between mb-3 mt-3">
          <div className="text-gray-500 text-[12px] flex items-center gap-1">
            Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
            <span className="text-primary font-medium">
              {getCurrentRouteLabel()}
            </span>
            <div className={`text-[12px] ml-3 cursor-pointer ${fiscalYears.length == 0 ? 'animate-blink text-white bg-red-500 px-2 rounded-lg' : 'text-sky-500 underline'}`}
              onClick={() => {
                setFiscalYearDialogOpen(true);
              }}
            >
              Manage Fiscal Years
            </div>
            {hasUnsavedChanges && (
              <Chip
                label="Unsaved Changes"
                size="small"
                color="warning"
                className="ml-2"
              />
            )}
          </div>

          {/* GST Search Section */}
          <div className="flex items-center gap-3">
            {/* Search Type Toggle */}
            <FormControl size="small">
              <Select
                className="bg-white"
                value={gstSearchType}
                onChange={(e) => setGstSearchType(e.target.value as GSTSearchType)}
                sx={selectSx}
              >
                <MenuItem value="by_gst">By GSTIN</MenuItem>
                <MenuItem value="by_company">By Company</MenuItem>
              </Select>
            </FormControl>

            {gstSearchType === 'by_gst' ? (
              <TextField
                size="small"
                placeholder="Enter GSTIN (e.g., 22AAAAA0000A1Z5)"
                className="!w-[350px]"
                value={gstSearch}
                onChange={(e) => setGstSearch(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleGSTSearch()}
              />
            ) : (
              <div className="flex gap-2">
                <TextField
                  size="small"
                  placeholder="Company name"
                  className="!w-[300px] bg-white"
                  value={companyNameSearch}
                  onChange={(e) => setCompanyNameSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGSTSearch()}
                />
                <FormControl size="small">
                  <Select
                    value={selectedStateForSearch}
                    onChange={(e) => setSelectedStateForSearch(e.target.value)}
                    displayEmpty
                    className="bg-white"
                    sx={selectSx}
                  >
                    <MenuItem value="">All States</MenuItem>
                    {searchStates.map((state) => (
                      <MenuItem key={state.id} value={state.name}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

            <Button
              variant="contained"
              className="!bg-primary !text-white !px-6"
              onClick={handleGSTSearch}
              disabled={isSearchingGst}
              size="small"
            >
              {isSearchingGst ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {(companyInfo && companyInfo.id) &&
              <Button
                variant="outlined"
                className="!text-gray-800 !border-gray-300 !px-6"
                onClick={handleCancel}
                disabled={isSaving}
                size="small"
              >
                Delete
              </Button>
            }
            <Button
              variant="contained"
              color="primary"
              className="!bg-primary"
              onClick={() => handleSave()}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
              size="small"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* GST Search Results */}
        <Collapse in={showGstResults && gstSearchResults.length > 0}>
          <Paper className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <Typography variant="subtitle2" className="!font-semibold text-gray-800">
                <BusinessCenter className="!w-4 !h-4 mr-2 text-primary" />
                GST Search Results ({gstSearchResults.length})
              </Typography>
              <Button
                size="small"
                onClick={() => setShowGstResults(false)}
                className="!text-gray-500"
              >
                <CloseOutlined className="!w-4 !h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-auto">
              {gstSearchResults.map((result, index) => (
                <Card key={index} variant="outlined" className="!border-gray-200 bg-white">
                  <CardContent className="!p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with Status and Source */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Typography variant="subtitle2" className="!font-semibold text-gray-800">
                            {result.legalName}
                          </Typography>
                          <Chip
                            label={result.status || "Active"}
                            size="small"
                            color={result.status === "Active" ? "success" : "default"}
                          />
                          {result.source && (
                            <Chip
                              label={result.source === 'local' ? 'Local DB' : 'GST Registry'}
                              size="small"
                              variant="outlined"
                              color={result.source === 'local' ? 'info' : 'primary'}
                            />
                          )}
                        </div>

                        {/* GSTIN */}
                        <Typography variant="body2" className="!text-gray-600 !text-[12px] !mt-1">
                          <span className="font-medium">GSTIN:</span> {result.gstin}
                        </Typography>

                        {/* Trade Name (if different) */}
                        {result.tradeName && result.tradeName !== result.legalName && (
                          <Typography variant="body2" className="!text-gray-500 !text-[12px]">
                            <span className="font-medium">Trade Name:</span> {result.tradeName}
                          </Typography>
                        )}

                        {/* Address */}
                        {result.address && (
                          <Typography variant="body2" className="!text-gray-500 !text-[12px]">
                            <span className="font-medium">Address:</span> {[result.address, result.city, result.state, result.pincode].filter(Boolean).join(', ')}
                          </Typography>
                        )}

                        {/* PAN and Registration Date */}
                        <div className="flex gap-4 mt-1">
                          {result.pan && (
                            <Typography variant="body2" className="!text-gray-500 !text-[12px]">
                              <span className="font-medium">PAN:</span> {result.pan}
                            </Typography>
                          )}
                          {result.registrationDate && (
                            <Typography variant="body2" className="!text-gray-500 !text-[12px]">
                              <span className="font-medium">Registration:</span> {formatDate(result.registrationDate)}
                            </Typography>
                          )}
                        </div>

                        {/* Expand for more details */}
                        <Button
                          size="small"
                          onClick={() => setExpandedGstResult(expandedGstResult === result.gstin ? null : result.gstin)}
                          endIcon={expandedGstResult === result.gstin ? <ExpandLess /> : <ExpandMore />}
                          className="!text-xs !mt-1 !text-primary"
                        >
                          {expandedGstResult === result.gstin ? "Hide Details" : "Show Details"}
                        </Button>

                        <Collapse in={expandedGstResult === result.gstin}>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] bg-gray-50 p-2 rounded border border-gray-100">
                            {result.constitution && (
                              <div className="text-gray-800"><span className="font-medium">Constitution:</span> {result.constitution}</div>
                            )}
                            {result.entityType && (
                              <div className="text-gray-800"><span className="font-medium">Entity Type:</span> {result.entityType}</div>
                            )}
                            {result.taxpayerType && (
                              <div className="text-gray-800"><span className="font-medium">Taxpayer Type:</span> {result.taxpayerType}</div>
                            )}
                            {result.stateCode && (
                              <div className="text-gray-800"><span className="font-medium">State Code:</span> {result.stateCode}</div>
                            )}
                            {result.centreJurisdiction && (
                              <div className="text-gray-800"><span className="font-medium">Centre Jurisdiction:</span> {result.centreJurisdiction}</div>
                            )}
                            {result.stateJurisdiction && (
                              <div className="col-span-2 text-gray-800"><span className="font-medium">State Jurisdiction:</span> {result.stateJurisdiction}</div>
                            )}
                            {result.fetchedAt && (
                              <div className="col-span-2 text-gray-400 !text-[10px] !mt-1">
                                Fetched at: {new Date(result.fetchedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </Collapse>
                      </div>
                      
                      {/* Apply Button */}
                      <Button
                        variant="contained"
                        size="small"
                        className="!bg-primary !text-white !ml-2 whitespace-nowrap"
                        onClick={() => applyGSTResultToForm(result)}
                      >
                        Apply to Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Paper>
        </Collapse>

        {/* Show unsaved changes warning */}
        {hasUnsavedChanges && (
          <Alert severity="warning" className="mb-4">
            You have unsaved changes. Please save before leaving this page.
          </Alert>
        )}

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
                const specialFields = section.fields.filter(isSpecial);
                return (
                  <div key={section.id || sectionIndex} className="border p-4 pt-6 rounded-lg bg-white dark:bg-white-50 border-gray-300 space-y-4">
                    {regularFields.length > 0 && renderGridFields(regularFields, "grid-cols-2 md:grid-cols-3 lg:grid-cols-[2fr_2fr_1fr_1fr_1fr]")}
                    <div className="grid md:flex items-center gap-4">
                      {specialFields.length > 0 && (
                        <div className="flex gap-4 md:w-1/2 w-full min-w-0">
                          {specialFields.map((field: any) => (
                            <div key={field.key} className="w-full min-w-0">
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      )}
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

              const gridClass = "grid-cols-2 sm:grid-cols-4 md:grid-cols-7";

              return (
                <div key={section.id || sectionIndex} className="border py-6 px-4 rounded-lg bg-white dark:bg-white-50 border-gray-300">
                  {renderGridFields(section.fields, gridClass)}
                </div>
              );
            })}
          </div>

          {companyInfo.id && (
            <>
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
            </>
          )}
        </div>
      </Box>
      {/* Fiscal Year Dialog */}
      <Dialog
        open={fiscalYearDialogOpen}
        onClose={() => setFiscalYearDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="!p-2 border-b border-gray-200">
          <Box className="flex items-center justify-between !ml-4">
            <div>
              <Typography variant="h6">Fiscal Year Management</Typography>
              <Typography variant="body2" color="text.secondary" className="!text-[10px]">
                Manage payroll and reporting periods for this company.
              </Typography>
            </div>
            <IconButton onClick={() => setFiscalYearDialogOpen(false)}>
              <CloseOutlined className="text-gray-800" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="!p-4 !mt-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Year Label"
                value={fiscalYearForm.yearLabel}
                onChange={(e) => handleFiscalYearFieldChange("yearLabel", e.target.value)}
                placeholder="e.g. 2024-25"
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={fiscalYearForm.startDate ? dayjs(fiscalYearForm.startDate) : null}
                  onChange={(newValue) =>
                    handleFiscalYearFieldChange("startDate", dayjs(newValue)?.format("YYYY-MM-DD") || "")
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={fiscalYearForm.endDate ? dayjs(fiscalYearForm.endDate) : null}
                  minDate={fiscalYearForm.startDate ? dayjs(fiscalYearForm.startDate) : undefined}
                  onChange={(newValue) =>
                    handleFiscalYearFieldChange("endDate", dayjs(newValue)?.format("YYYY-MM-DD") || "")
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                className="!bg-primary"
                onClick={handleFiscalYearSubmit}
                disabled={fiscalYearLoading}
              >
                {fiscalYearForm.id ? "Update Fiscal Year" : "Create Fiscal Year"}
              </Button>
              {fiscalYearForm.id && (
                <Button variant="outlined" color="warning" onClick={resetFiscalYearForm}>
                  Cancel Edit
                </Button>
              )}
            </Stack>

            {fiscalYearLoading && !fiscalYears.length && (
              <Alert severity="info">Loading fiscal years…</Alert>
            )}

            {!fiscalYearLoading && fiscalYears.length === 0 && (
              <Alert severity="info">No fiscal years have been created yet for this company.</Alert>
            )}

            {fiscalYears.length > 0 && (
              <div className="space-y-2 !h-[calc(100vh-470px)] overflow-auto">
                {fiscalYears.map((year: any) => (
                  <div key={year.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Typography variant="subtitle2">Year Label : {year.yearLabel}</Typography>
                        {year.active ? <Chip label="Active" color="success" size="small" /> : <Chip label="Inactive" size="small" color="error" />}
                      </div>
                      <Typography variant="body2" color="text.secondary" className="!mt-1">
                        {year.startDate ? formatDate(year.startDate) : ''}  -  {year.endDate ? formatDate(year.endDate) : ''}
                      </Typography>
                    </div>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      {!year.active && (
                        <Button size="small" variant="outlined" color="success" onClick={() => handleActivateFiscalYear(year.id)}>
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setFiscalYearForm({
                            id: year.id,
                            yearLabel: year.yearLabel,
                            startDate: year.startDate,
                            endDate: year.endDate,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteFiscalYear(year.id)}>
                        Delete
                      </Button>
                    </Stack>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setFiscalYearDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompanySettings;