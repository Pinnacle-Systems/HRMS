import { useState, useEffect, useMemo } from "react";
import {
  employeeService,
  normalizeEmployeePageResponse,
  normalizeBulkUploadResponse,
  type EmployeeListQuery,
  type BulkUploadResponse,
  type EmployeeSummaryResponse,
} from "../../services/modules/employees";
import { departmentService } from "../../services/modules/department";
import { categoryService } from "../../services/modules/category";
import { useUI } from "../../context/Snackbar";
import { GlobalPagination } from "../../components/GlobalPagination";
import FilterPopup from "../../components/FilterPopup.tsx";
import {
  type Branches,
  type Department,
  type Designation,
  type Employee,
} from "./type";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  getRowColor,
  getStickyLeftSx,
  getStickyRightSx,
  handleEnterAsTab,
  stickyHeaderLeftSx,
  stickyHeaderRightSx,
} from "../const";
import { useNavigate } from "react-router-dom";
import { branchService } from "../../services/modules/branch";
import { formatDate } from "../../utils/dateFormatter";
import type { FilterConfig } from "../../types/filter.ts";
import { operatorLabels } from "../../types/filterOperators";
import { applyFiltersToData } from "../../utils/filterUtils";
import {
  getEmployeeFilterFields,
  buildEmployeeServerFilterParams,
  isEmployeeServerSupportedFilter,
  EMPLOYEE_FIELD_MAP,
} from "./employeeFilterConfig";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import type { Category } from "../../services/modules/shifts.ts";
import { ArrowDownward, ArrowUpward, CheckCircleOutlined, CloseOutlined, CloudUploadOutlined, DownloadOutlined, EditOutlined, FileDownloadOutlined, FileUploadOutlined, HowToRegOutlined, MoreVertOutlined, NoAccountsOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, IconButton, InputLabel, LinearProgress, Menu, MenuItem, Paper, Select, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { useAuth } from "../../auth/authContext.ts";
import { masterSx } from "./const.ts";
import DataState from "../../components/DataState.tsx";
import { dialogsx } from "../../const.ts";

export default function EmployeeManagement() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();
  const { session } = useAuth();
  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  // const [sortBy, setSortBy] = useState("");
  // const [sortOrder, setSortOrder] = useState("");
  const [sortCriteria, setSortCriteria] = useState<Array<{ field: string, order: 'ASC' | 'DESC' }>>([
    { field: 'createdAt', order: 'DESC' }
  ]);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterConfig | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<Employee>>({});

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(
    null,
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);
  const [empStatus, setEmpStatus] = useState<Category[]>([]);

  // Code Generation (used by Add Employee dialog)
  const [hasManualEmpId, setHasManualEmpId] = useState(false);
  const [empCodeType, setEmpCodeType] = useState("pattern");
  const [empGenerationFlow, setEmpGenerationFlow] = useState<
    "new" | "continue"
  >("new");
  const [empPrefix, setEmpPrefix] = useState("EMP");
  const [empStartNumber, setEmpStartNumber] = useState("1");
  const [zero, setZero] = useState(0);
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [empDigitCount, setEmpDigitCount] = useState("4");
  const [employeeIdConfig, setEmployeeIdConfig] = useState<any>(null);
  const [nextIdPreview, setNextIdPreview] = useState<string>("");

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [selectedEmployeeForExport, setSelectedEmployeeForExport] = useState<
    string | null
  >(null);

  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [actionMenuEmployee, setActionMenuEmployee] = useState<Employee | null>(
    null,
  );
  const [relievingDialogOpen, setRelievingDialogOpen] = useState(false);
  const [relievingDialogEmployee, setRelievingDialogEmployee] =
    useState<Employee | null>(null);
  const [relievingDate, setRelievingDate] = useState("");
  const [excelHasEmployeeIdColumn, setExcelHasEmployeeIdColumn] =
    useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");

  const filterFields = useMemo(
    () =>
      getEmployeeFilterFields(departments, designations, branches, empStatus),
    [departments, designations, branches, empStatus],
  );

  const loadEmployeeIdConfig = async () => {
    try {
      const res: any = await employeeService.getEmployeeId();
      const config = res?.data ?? res;
      setEmployeeIdConfig(config);
      if (!config.configured) {
        setEmpGenerationFlow("new");
        setExcelHasEmployeeIdColumn(true);
        return;
      }
      // Always restore saved config values into the form fields
      setEmpCodeType(config.formatType.toLowerCase());
      setEmpPrefix(config.prefix || "EMP");
      setZero(config.paddingWidth || 0);
      setEmpStartNumber(String(config.startingNumber || 1));
      setEmpDigitCount(String(config.numberOfDigits || 4));
      // Auto-select "continue" only when at least one employee has been generated
      setEmpGenerationFlow(config.lastGeneratedId ? "continue" : "new");
    } catch (error: any) {
      console.error("Failed to load employee ID config:", error);
    }
  };

  useEffect(() => {
    loadEmployeeIdConfig();
  }, []);

  useEffect(() => {
    if (employeeIdConfig) {
      setExcelHasEmployeeIdColumn(!employeeIdConfig.configured);
    }
  }, [employeeIdConfig]);

  const generatePreview = async () => {
    showSpinner();
    try {
      const payload: any = {
        formatType: empCodeType.toUpperCase(),
        prefix: empCodeType === "pattern" ? empPrefix : undefined,
        startingNumber:
          empCodeType === "pattern" || empCodeType === "number"
            ? parseInt(empStartNumber)
            : undefined,
        numberOfDigits:
          empCodeType === "alphanumeric" ? parseInt(empDigitCount) : undefined,
        paddingWidth: zero ? zero : undefined
      };
      const res: any = await employeeService.previewEmployeeId(payload);
      const response = res?.data ?? res;
      setNextIdPreview(response.previewId);
    } catch (error: any) {
      setNextIdPreview("Error generating preview");
    } finally {
      hideSpinner();
    }
  };

  // Generate preview whenever relevant fields change
  useEffect(() => {
    if (hasManualEmpId || !employeeDialogOpen) return;
    if (empGenerationFlow === "continue") {
      // "continue" preview is already embedded in employeeIdConfig — no API call needed here
      setNextIdPreview(employeeIdConfig?.nextSequencePreview || "");
      return;
    }
    // const timer = setTimeout(() => {
    //   if (empCodeType === "pattern" && (!empPrefix || !empStartNumber)) return;
    //   generatePreview();
    // }, 300);
    const timer = setTimeout(() => {
      if (empCodeType === "pattern" && (!empPrefix || !empStartNumber || !zero)) return;
      generatePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    empCodeType,
    empPrefix,
    zero,
    empStartNumber,
    empDigitCount,
    empGenerationFlow,
    employeeDialogOpen,
    hasManualEmpId,
    employeeIdConfig,
  ]);

  // const generateRandomAlphaNumeric = (length: number) => {
  //   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  //   let result = "";
  //   let seed = length * 31 + 17;
  //   for (let i = 0; i < length; i++) {
  //     seed = (seed * 9301 + 49297) % 233280;
  //     const index = Math.floor((seed / 233280) * chars.length);
  //     result += chars.charAt(index);
  //   }
  //   return result;
  // };

  // const getNextEmployeeId = () => {
  //   if (employees.length === 0) {
  //     return `${empPrefix}${empStartNumber}`;
  //   }
  //   const employeeIds = employees.map((emp) => emp.employeeId).filter(Boolean);
  //   const lastId = employeeIds[0];
  //   const numericPart = lastId.replace(/\D/g, "");
  //   const nextNumber = String(Number(numericPart) + 1).padStart(numericPart.length, "0");
  //   const prefix = lastId.replace(/[0-9]/g, "");
  //   return `${prefix}${nextNumber}`;
  // };

  const handleApplyFilters = (filters: FilterConfig) => {
    console.log('Applying filters:', filters);
    console.log('Filters rules:', filters.rules);
    console.log('First rule value:', filters.rules[0]?.value);
    setActiveFilters(filters);
    setPage(0);
  };

  // Remove a specific filter
  const removeFilter = (ruleId: string) => {
    if (activeFilters) {
      const newRules = activeFilters.rules.filter((rule) => rule.id !== ruleId);
      if (newRules.length > 0) {
        const newFilters = { ...activeFilters, rules: newRules };
        setActiveFilters(newFilters);
      } else {
        // Clear all filters if no rules left
        clearAllFilters();
      }
      setPage(0);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters(null);
    setPage(0);
  };

  // Get active filter count
  const getActiveFilterCount = (): number => {
    return activeFilters?.rules.length || 0;
  };

  // Toggle sort for a field
  const toggleSort = (field: string) => {
    setSortCriteria(prev => {
      const existingIndex = prev.findIndex(s => s.field === field);
      if (existingIndex >= 0) {
        const currentOrder = prev[existingIndex].order;
        if (currentOrder === 'ASC') {
          const newCriteria = [...prev];
          newCriteria[existingIndex] = { field, order: 'DESC' };
          return newCriteria;
        }
        else if (currentOrder === 'DESC') {
          return prev.filter(s => s.field !== field);
        }
      } else {
        return [...prev, { field, order: 'ASC' }];
      }
      return prev;
    });
    setPage(0);
  };

  // Fetch employees
  const getEmployees = async () => {
    console.log(activeFilters)
    showSpinner();
    try {
      const sortParams = sortCriteria.map(s => `${s.field},${s.order.toLowerCase()}`);

      const params: EmployeeListQuery = {
        page,
        size: limit,
        sort: sortParams,
        ...buildEmployeeServerFilterParams(activeFilters),
      };
      if (searchTerm) params.search = searchTerm;
      if (includeInactive) params.includeInactive = true;
      console.log(params);

      const response = await employeeService.getEmployees(params);
      const employeePage = normalizeEmployeePageResponse(response);
      const employeeData = employeePage.content as Employee[];
      let visibleEmployees = employeeData;

      setTotal(employeePage.totalElements);

      // Operators outside the backend query contract are applied to the current page only.
      if (
        activeFilters &&
        activeFilters.rules.length > 0 &&
        !isEmployeeServerSupportedFilter(activeFilters)
      ) {
        visibleEmployees = applyFiltersToData(
          employeeData,
          activeFilters,
          EMPLOYEE_FIELD_MAP,
        );
      }
      setEmployees(visibleEmployees);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load employees", "error");
    } finally {
      hideSpinner();
    }
  };

  // Fetch departments and designations
  const getMasterData = async () => {
    try {
      const deptRes: any = await departmentService.getActiveDepartments();
      setDepartments(deptRes.data.content || deptRes.data || []);

      const branchRes: any = await branchService.getDropdownBranches();
      setBranches(branchRes.data.content || branchRes.data || []);

      const category: any = await categoryService.getActiveCategoryItem();
      const designationCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('designation')
      );
      if (designationCategory) {
        setDesignations(designationCategory.items);
      }

      const empStatusCategory = category.data.find(
        (element: any) => {
          const categoryName = element.categoryName?.toLowerCase() || '';
          return categoryName.includes('employee status') || categoryName.includes('emp status')
        }
      );
      if (empStatusCategory) {
        setEmpStatus(empStatusCategory.items);
      }
      // const desigRes: any = await categoryService.getCategoryItems(
      //   // "00c4fd3c-4fb6-4d33-932e-80a615a90825",
      //   "fa8c5d40-c0f1-4de2-9543-5069ef0fb8af"
      // );
      // // setDesignations(desigRes.data.content || desigRes.data || []);
      // const stsRes: any = await categoryService.getCategoryItems(
      //   // "db50d81f-9fcd-4afd-a87c-a5591aa7abbb",
      //   "bf747a78-26e2-4e8f-97cb-2486a83cef76"
      // );
      // setEmpStatus(stsRes.data.content || stsRes.data || []);
      // "5504ad78-7089-42ec-8219-2a579d99bb0a"
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  useEffect(() => {
    getEmployees();
    getMasterData();
  }, [
    page,
    limit,
    // sortBy,
    // sortOrder,
    searchTerm,
    activeFilters,
    includeInactive,
    sortCriteria,
  ]);

  // Update filter fields when master data changes
  // useEffect(() => {
  //   // This will update the filter fields options when departments/designations/branches change
  //   filterFields.map(field => {
  //     if (field.id === 'designationId') {
  //       return { ...field, options: designations.map(d => ({ value: d.id, label: d.name })) };
  //     }
  //     if (field.id === 'dept') {
  //       return { ...field, options: departments.map(d => ({ value: d.departmentName, label: d.departmentName })) };
  //     }
  //     if (field.id === 'branch') {
  //       return { ...field, options: branches.map(b => ({ value: b.branchName, label: b.branchName })) };
  //     }
  //     return field;
  //   });
  //   // Update filterFields state if needed
  // }, [departments, designations, branches]);

  // const handleSortChange = (
  //   newSortBy: string,
  //   newSortOrder?: "ASC" | "DESC",
  // ) => {
  //   // setSortBy(newSortBy);
  //   // setSortOrder(newSortOrder || "ASC");
  //   setPage(0);
  //   toggleSort(newSortBy);
  // };

  const getSortIcon = (column: string) => {
    const sortCriterion = sortCriteria.find(s => s.field === column);
    if (!sortCriterion) return null;
    const orderIcon = sortCriterion.order === "ASC" ? (
      <ArrowUpward fontSize="small" className="ml-1" />
    ) : (
      <ArrowDownward fontSize="small" className="ml-1" />
    );
    const orderNumber = sortCriteria.findIndex(s => s.field === column) + 1;

    return (
      <span className="flex items-center">
        {orderIcon}
        <span className="text-[10px] text-gray-400 ml-0.5">({sortCriterion.order})</span>
        {sortCriteria.length > 1 && (
          <span className="text-[10px] text-gray-400 ml-0.5">{orderNumber}</span>
        )}
      </span>
    );
  };

  const generateEmployeeIdPreview = () => {
    if (hasManualEmpId) {
      return manualEmployeeId || "Manual Entry";
    }
    if (empGenerationFlow === "continue" && employeeIdConfig?.configured) {
      return employeeIdConfig.nextSequencePreview;
    }
    return nextIdPreview || "Enter details to preview";
  };

  const getEmployeeIdForCreation = async (): Promise<string> => {
    if (hasManualEmpId) {
      return manualEmployeeId;
    }
    if (empGenerationFlow === "continue" && employeeIdConfig?.configured) {
      return employeeIdConfig.nextSequencePreview;
    }

    const payload: any = { formatType: empCodeType.toUpperCase() };
    if (empCodeType === "pattern") {
      payload.prefix = empPrefix;
      payload.paddingWidth = zero;
      payload.startingNumber = parseInt(empStartNumber);
    }
    if (empCodeType === "number") {
      payload.paddingWidth = zero;
      payload.startingNumber = parseInt(empStartNumber);
    }
    if (empCodeType === "alphanumeric") {
      payload.numberOfDigits = parseInt(empDigitCount);
    }
    // const updateResponse: any = await employeeService.updateEmployeeId(payload);
    // const updatedConfig = updateResponse?.data ?? updateResponse;
    // setEmployeeIdConfig(updatedConfig);
    // const lastGeneratedId = updatedConfig.lastGeneratedId;
    // const nextSequencePreview = updatedConfig.nextSequencePreview;
    // return nextSequencePreview;

    await employeeService.updateEmployeeId(payload);
    const previewRes: any = await employeeService.previewEmployeeId(payload);
    const preview = previewRes?.data ?? previewRes;
    return preview.previewId;
  };

  const validateEmployeeIdConfig = () => {
    if (hasManualEmpId) return true;
    // "continue" uses the saved server config — no form fields to validate
    if (empGenerationFlow === "continue") return true;
    if (empCodeType === "pattern") {
      if (!empPrefix.trim()) {
        showSnackbar("Prefix is required", "error");
        return false;
      }
      if (!empStartNumber) {
        showSnackbar("Starting number is required", "error");
        return false;
      }
    }
    if (empCodeType === "number" && !empStartNumber) {
      showSnackbar("Starting number is required", "error");
      return false;
    }
    if (empCodeType === "alphanumeric" && !empDigitCount) {
      showSnackbar("Number of digits is required", "error");
      return false;
    }
    return true;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      emailAddress: "",
      joiningDate: "",
      employeeId: "",
      departmentId: "",
      designationId: "",
      mobileNumber: "",
      branchId: session?.branchId || "",
    });

    setHasManualEmpId(false);
    setEmpCodeType("pattern");
    setEmpPrefix("EMP");
    setZero(0);
    setEmpStartNumber("1");
    setEmpDigitCount("4");
    setManualEmployeeId("");
    setSelectedEmployee(null);
    setEmpGenerationFlow(employeeIdConfig?.configured ? "continue" : "new");
  };

  // Handle Add Employee
  const handleOpenAddDialog = () => {
    setIsEditing(false);
    resetForm();
    setEmployeeDialogOpen(true);
    loadEmployeeIdConfig();
  };

  // Handle Edit Employee - Open Edit Dialog
  const handleOpenEditDialog = async (employee: Employee) => {
    setIsEditing(true);
    const response: any = await employeeService.getEmployeeById(employee.id);
    setSelectedEmployee(response.data);

    // const resolvedDepartmentId =
    //   employee.departmentId ||
    //   departments.find((d) => d.departmentName === employee.department)?.id;
    // const resolvedDesignationId =
    //   employee.designationId ||
    //   designations.find((d) => d.name === employee.designation)?.id;
    // const resolvedBranchId =
    //   employee.branchId ||
    //   branches.find((b) => b.branchName === employee.branch)?.id;
    // const resolvedEmployeeStatusId =
    //   employee.employeeStatusId ||
    //   empStatus.find((s) => s.name === employee.employeeStatus)?.id;
    const resolvedDepartment = departments.find(
      (d) => d.id === employee.departmentId || d.departmentName === employee.department
    );
    const resolvedDesignation = designations.find(
      (d) => d.id === employee.designationId || d.name === employee.designation
    );
    const resolvedBranchId =
      employee.branchId ||
      branches.find((b) => b.branchName === employee.branch)?.id;
    const resolvedEmployeeStatus = empStatus.find(
      (s) => s.id === employee.employeeStatusId || s.name === employee.employeeStatus
    );

    setFormData({
      name: employee.name,
      emailAddress: employee.emailAddress,
      joiningDate: employee.joiningDate?.split("T")[0] || "",
      branch: employee.branch || "",
      branchId: session?.branchId || resolvedBranchId,
      employeeId: employee.employeeId,
      // departmentId: resolvedDepartment,
      // designationId: resolvedDesignation,
      // department: employee.department,
      // designation: employee.designation,
      mobileNumber: employee.mobileNumber || "",
      // employeeStatus: employee.employeeStatus || "",
      // employeeStatusId: resolvedEmployeeStatus,
      department: resolvedDepartment || null,
      departmentId: resolvedDepartment?.id || employee.departmentId || "",
      designation: resolvedDesignation || null,
      designationId: resolvedDesignation?.id || employee.designationId || "",
      employeeStatus: resolvedEmployeeStatus || null,
      employeeStatusId: resolvedEmployeeStatus?.id || employee.employeeStatusId || "",
    });
    setEmployeeDialogOpen(true);
  };

  // Handle Update Employee
  const handleSaveEmployee = async () => {
    // if (!formData.name || !formData.emailAddress) {
    //   showSnackbar("Please fill all required fields", "error");
    //   return;
    // }
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(formData.emailAddress)) {
    //   showSnackbar("Please enter a valid email address", "error");
    //   return;
    // }
    if (!validateEmployeeIdConfig()) return;
    // setDownloading(true);
    showSpinner();
    try {
      if (isEditing) {
        const empId = selectedEmployee!.id;
        await Promise.all([
          // employeeService.updatePersonalInfo(empId, {
          // firstName: formData.name,
          // emailAddress: formData.emailAddress,
          // mobileNumber: formData.mobileNumber,
          // }),
          employeeService.updateAdminInfo(empId, {
            joiningDate: formData.joiningDate,
            branchId: formData.branchId || selectedEmployee?.branchId,
            departmentId:
              formData.departmentId || selectedEmployee?.departmentId,
            designationId:
              formData.designationId || selectedEmployee?.designationId,
            employeeStatusId:
              formData.employeeStatusId || selectedEmployee?.employeeStatusId,
            gradeId: selectedEmployee?.gradeId,
            empTypeId: selectedEmployee?.empTypeId,
            managerId: selectedEmployee?.managerId,
            bandId: selectedEmployee?.bandId,
            confirmationDate: selectedEmployee?.confirmationDate,
            relievedDate: selectedEmployee?.relievedDate,
            probationPeriod: selectedEmployee?.probationPeriod,
            noticePeriod: selectedEmployee?.noticePeriod,
            // attendanceSchemaId: selectedEmployee?.empTypeId,
            vehicleTypeId: selectedEmployee?.vehicleTypeId,
            hostel: selectedEmployee?.hostel,
            currentCompanyExperience:
              selectedEmployee?.currentCompanyExperience,
            referredBy: selectedEmployee?.referredBy,
            bonusPolicyId: selectedEmployee?.bonusPolicyId,
            otPolicyId: selectedEmployee?.otPolicyId,
            otAmount: selectedEmployee?.otAmount,
            vehicleFacility: selectedEmployee?.vehicleFacility,
            migrant: selectedEmployee?.migrant,
            exService: selectedEmployee?.exService,
            monthly: selectedEmployee?.monthly,
            adminRemarks: selectedEmployee?.adminRemarks,
            idCardNo: selectedEmployee?.idCardNo,
            midNo: selectedEmployee?.midNo,
            oldIdNo: selectedEmployee?.oldIdNo,
            // mobileNumber: formData.mobileNumber || selectedEmployee?.mobileNumber,
          }),
        ]);
        showSnackbar("Employee updated successfully!", "success");
      } else {
        const employeeId = await getEmployeeIdForCreation();
        const payload = {
          firstName: formData.name,
          emailAddress: formData.emailAddress,
          joiningDate: formData.joiningDate,
          employeeId: employeeId,
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          branchId: formData.branchId,
          mobileNumber: formData.mobileNumber,
          employeeStatusId: formData.employeeStatusId,
        };
        //{
        //   "middleName": "string",
        //   "lastName": "string",
        //   "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        //   "aadhaarLockedFields": [
        //     "string"
        //   ]
        // }
        await employeeService.createEmployee(payload);
        showSnackbar(
          `Employee Created! ID: ${employeeId}. Welcome email sent to ${formData.emailAddress}`,
          "success",
        );
        await loadEmployeeIdConfig();
      }
      setEmployeeDialogOpen(false);
      resetForm();
      getEmployees();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      // setDownloading(false);
      hideSpinner();
    }
  };

  const isInactiveEmployee = (employee: Employee): boolean =>
    employee.employeeStatus === "INACTIVE" ||
    employee.isActive === false ||
    !!employee.deactivatedAt;

  // Handle Deactivate Employee
  const handleDeactivateEmployee = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Deactivate Employee",
      message: `Deactivate "${name}"? The employee will be marked inactive. All history (leave, payroll, onboarding) is retained and the employee can be reactivated later.`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deactivateEmployee(id);
          showSnackbar(`"${name}" has been deactivated.`, "success");
          getEmployees();
        } catch (error: any) {
          showSnackbar(
            error.message || "Failed to deactivate employee.",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Handle Reactivate Employee
  const handleReactivateEmployee = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Reactivate Employee",
      message: `Reactivate "${name}"? The employee will be restored to active status.`,
      confirmText: "Reactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const updated: EmployeeSummaryResponse =
            await employeeService.reactivateEmployee(id);
          showSnackbar(
            `"${updated?.name ?? name}" has been reactivated.`,
            "success",
          );
          await employeeService.updateAdminInfo(id, { relievedDate: "" });
          getEmployees();
        } catch (error: any) {
          showSnackbar(
            error.message || "Failed to reactivate employee.",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const BULK_UPLOAD_ACCEPTED = [".csv", ".xlsx"];
  const BULK_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

  const handleCloseBulkUploadDialog = () => {
    setBulkUploadDialogOpen(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadResult(null);
  };

  // Handle Bulk Upload
  const handleBulkUpload = async () => {
    if (!uploadFile) {
      showSnackbar("Please select a file to upload", "error");
      return;
    }
    const ext = uploadFile.name
      .toLowerCase()
      .slice(uploadFile.name.lastIndexOf("."));
    if (!BULK_UPLOAD_ACCEPTED.includes(ext)) {
      showSnackbar(
        "Invalid file type. Please upload a CSV or XLSX file.",
        "error",
      );
      return;
    }
    if (uploadFile.size > BULK_UPLOAD_MAX_BYTES) {
      showSnackbar(
        "File exceeds the 10 MB limit. Please upload a smaller file.",
        "error",
      );
      return;
    }
    setUploadResult(null);
    showSpinner();
    try {
      const response: any = await employeeService.bulkUploadEmployees(
        uploadFile,
        excelHasEmployeeIdColumn,
        (progress) => {
          setUploadProgress(progress);
        },
      );
      const result = normalizeBulkUploadResponse(response);
      setUploadResult(result);
      // const errorCount = result.failureCount ?? result.errors?.length ?? 0;
      // if (errorCount === 0) {
      //   showSnackbar(
      //     `Upload successful! ${result.successCount ?? 0} employees imported.`,
      //     "success",
      //   );
      // } else {
      //   showSnackbar(
      //     `Upload completed with ${errorCount} row error(s). See details below.`,
      //     "warning",
      //   );
      // }
      if (result.failureCount === 0) {
        showSnackbar(
          `${result.successCount} employees imported successfully`,
          "success",
        );
      } else {
        showSnackbar(
          `Upload completed with ${result.failureCount} row error(s). See details below.`,
          "warning",
        );
      }
      getEmployees();
    } catch (error: any) {
      showSnackbar(error.message || "Failed to upload", "error");
    } finally {
      hideSpinner();
    }
  };

  const openExportMenu = (
    event: React.MouseEvent<HTMLElement>,
    employeeId?: string,
  ) => {
    setSelectedEmployeeForExport(employeeId || null);
    setExportAnchorEl(event.currentTarget);
  };

  const closeExportMenu = () => {
    setExportAnchorEl(null);
    setSelectedEmployeeForExport(null);
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      showSpinner();

      if (selectedEmployeeForExport) {
        // Single employee export
        await employeeService.downloadEmployeeByIdExport(
          selectedEmployeeForExport,
          format,
        );

        showSnackbar(`Employee exported as ${format.toUpperCase()}`, "success");
      } else {
        // Export all employees
        const sortParams = sortCriteria.map(s => `${s.field},${s.order.toLowerCase()}`);

        const params: any = {
          search: searchTerm || undefined,
          // sort: `${sortBy},${sortOrder}`,
          sort: sortParams,
          ...buildEmployeeServerFilterParams(activeFilters),
        };

        await employeeService.downloadEmployeeExport(params, format);

        showSnackbar(
          `Employees exported as ${format.toUpperCase()}`,
          "success",
        );
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to export", "error");
    } finally {
      hideSpinner();
      closeExportMenu();
    }
  };

  const updateReleivingDate = async (emp: any, value: any, remarks: any) => {
    showSpinner();
    try {
      await employeeService.updateAdminInfo(emp.id, {
        relievedDate: value,
        joiningDate: formData.joiningDate,
        branchId: formData.branchId || selectedEmployee?.branchId,
        departmentId: formData.departmentId || selectedEmployee?.departmentId,
        designationId:
          formData.designationId || selectedEmployee?.designationId,
        employeeStatusId:
          formData.employeeStatusId || selectedEmployee?.employeeStatusId,
        gradeId: selectedEmployee?.gradeId,
        empTypeId: selectedEmployee?.empTypeId,
        managerId: selectedEmployee?.managerId,
        bandId: selectedEmployee?.bandId,
        confirmationDate: selectedEmployee?.confirmationDate,
        probationPeriod: selectedEmployee?.probationPeriod,
        noticePeriod: selectedEmployee?.noticePeriod,
        vehicleTypeId: selectedEmployee?.vehicleTypeId,
        hostel: selectedEmployee?.hostel,
        currentCompanyExperience: selectedEmployee?.currentCompanyExperience,
        referredBy: selectedEmployee?.referredBy,
        bonusPolicyId: selectedEmployee?.bonusPolicyId,
        otPolicyId: selectedEmployee?.otPolicyId,
        otAmount: selectedEmployee?.otAmount,
        vehicleFacility: selectedEmployee?.vehicleFacility,
        migrant: selectedEmployee?.migrant,
        exService: selectedEmployee?.exService,
        monthly: selectedEmployee?.monthly,
        adminRemarks: remarks || selectedEmployee?.adminRemarks,
        idCardNo: selectedEmployee?.idCardNo,
        midNo: selectedEmployee?.midNo,
        oldIdNo: selectedEmployee?.oldIdNo,
      });
      handleDeactivateEmployee(emp.id, emp.name);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const openActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    employee: Employee,
  ) => {
    setActionMenuEmployee(employee);
    setActionMenuAnchor(event.currentTarget);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuEmployee(null);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-semibold text-gray-800">Employee Management</div>
          <div className="text-gray-500 text-[12px]">
            Manage employees, send welcome emails, and track onboarding
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <FormControlLabel
            control={
              <Switch
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setPage(0);
                }}
                size="small"
              />
            }
            label={
              <span className="text-[12px] text-gray-600">
                Include inactive
              </span>
            }
          />
          <Button
            variant="outlined"
            startIcon={<FileUploadOutlined />}
            onClick={() => setBulkUploadDialogOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            onClick={() => handleOpenAddDialog()}
            className="!bg-primary"
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters && activeFilters.rules.length > 0 && (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 1,
            alignItems: "center",
            p: 1,
            bgcolor: "grey.100",
            borderRadius: 1,
            overflow: "auto",
          }}
        >
          <Typography variant="caption" color="textSecondary">
            Filters ({activeFilters.condition}):
          </Typography>
          {/* {activeFilters.rules.map((rule) => {
            const field = filterFields.find((f) => f.id === rule.field);
            const displayValue =
              field?.type === "select" || field?.type === "multiSelect"
                ? (field.options?.find((o) => o.value === rule.value)?.label ??
                  rule.value)
                : rule.value;
            return (
              <Chip
                key={rule.id}
                label={`${field?.label} ${operatorLabels[rule.operator]} ${displayValue}`}
                onDelete={() => removeFilter(rule.id)}
                size="small"
                color="primary"
                variant="outlined"
              />
            );
          })} */}
          {activeFilters.rules.map((rule) => {
            const field = filterFields.find((f) => f.id === rule.field);

            // Helper to get display value based on field type
            const getDisplayValue = () => {
              if (!field) return rule.value;

              // For select and multiSelect fields, show label instead of value
              if (field.type === 'select' || field.type === 'multiSelect') {
                const option = field.options?.find((o) => o.value === rule.value);
                return option?.label ?? rule.value;
              }

              // For boolean fields
              if (field.type === 'boolean') {
                if (rule.value === true || rule.value === 'true' || rule.value === 'yes') return 'Yes';
                if (rule.value === false || rule.value === 'false' || rule.value === 'no') return 'No';
                return rule.value;
              }

              // For date fields
              if (field.type === 'date' && rule.value) {
                return dayjs(rule.value).format('DD/MM/YYYY');
              }

              // For between operator
              if (rule.operator === 'between' && rule.value2) {
                const val1 = field.type === 'date' ? dayjs(rule.value).format('DD/MM/YYYY') : rule.value;
                const val2 = field.type === 'date' ? dayjs(rule.value2).format('DD/MM/YYYY') : rule.value2;
                return `${val1} - ${val2}`;
              }

              return rule.value;
            };

            const displayValue = getDisplayValue();
            const operatorLabel = operatorLabels[rule.operator] || rule.operator;

            return (
              <Chip
                key={rule.id}
                label={`${field?.label || rule.field} ${operatorLabel} ${displayValue || ''}`}
                onDelete={() => removeFilter(rule.id)}
                size="small"
                color="primary"
                variant="outlined"
              />
            );
          })}
          <Button size="small" onClick={clearAllFilters}>
            Clear All
          </Button>
        </Box>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-[12px]">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500">Total Employees</div>
          <div className="font-bold">{total}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
          <div className="text-gray-500">Pending Onboarding</div>
          <div className="font-bold">
            {employees.filter((e) => e.employeeStatus === "ONBOARDING").length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500">Active Employees</div>
          <div className="font-bold">
            {employees.filter((e) => e.isActive === true).length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500">Onboarding</div>
          <div className="font-bold">
            {employees.filter((e) => e.employeeStatus === "ONBOARDING").length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, firstName, lastName, mobileNumber  or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="outlined"
          startIcon={<FilterAltOutlinedIcon />}
          onClick={() => setFilterOpen(true)}
          sx={{ position: "relative" }}
        >
          <div>Filters</div>
          {getActiveFilterCount() > 0 && (
            // <Chip
            //   label={getActiveFilterCount()}
            //   size="small"
            //   color="warning"
            //   sx={{ ml: 1, p:"5px", }}
            // />
            <div className="bg-blue-700 text-white font-bold ml-3 rounded-full w-[60px] h-5">
              {getActiveFilterCount()}
            </div>
          )}
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={(e) => openExportMenu(e)}
        >
          Export
        </Button>

        {/* Shared Export Menu */}
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={closeExportMenu}
        >
          <MenuItem
            className="!text-[12px]"
            onClick={() => handleExport("csv")}
          >
            Export as CSV
          </MenuItem>
          <MenuItem
            className="!text-[12px]"
            onClick={() => handleExport("xlsx")}
          >
            Export as Excel
          </MenuItem>
          <MenuItem
            className="!text-[12px]"
            onClick={() => handleExport("pdf")}
          >
            Export as PDF
          </MenuItem>
        </Menu>
      </div>

      {/* Employees Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        className={`${activeFilters && activeFilters.rules.length > 0 ? "h-[calc(100vh-392px)]" : "h-[calc(100vh-332px)]"} overflow-auto !bg-white-50`}
      >
        <Table stickyHeader className="border border-gray-200">
          <TableHead>
            <TableRow>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                title="Sort by Created At"
                onClick={() =>
                  toggleSort("createdAt")
                }
                sx={{
                  ...stickyHeaderLeftSx,
                  minWidth: "70px",
                }}
              >
                <div className="flex items-center gap-1">
                  S No
                  {getSortIcon("createdAt")}
                </div>
              </TableCell>
              <TableCell
                className="nth-c !font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  toggleSort("employeeId")
                }
              >
                <div className="flex items-center gap-1">
                  Employee ID
                  {getSortIcon("employeeId")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  toggleSort("name")
                }
              >
                <div className="flex items-center gap-1">
                  Employee Name
                  {getSortIcon("name")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  toggleSort("emailAddress")
                }
              >
                <div className="flex items-center gap-1">
                  Employee Email
                  {getSortIcon("emailAddress")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  toggleSort("mobileNumber")
                }
              >
                <div className="flex items-center gap-1">
                  Mobile Number
                  {getSortIcon("mobileNumber")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
              // onClick={() =>
              //   handleSortChange(
              //     "designation",
              //     sortOrder === "ASC" ? "DESC" : "ASC",
              //   )
              // }
              >
                <div className="flex items-center gap-1">
                  Designation
                  {/* {getSortIcon("designation")} */}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
              // onClick={() =>
              //   handleSortChange(
              //     "department",
              //     sortOrder === "ASC" ? "DESC" : "ASC",
              //   )
              // }
              >
                <div className="flex items-center gap-1">
                  Department
                  {/* {getSortIcon("department")} */}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
              // onClick={() =>
              //   handleSortChange(
              //     "branch",
              //     sortOrder === "ASC" ? "DESC" : "ASC",
              //   )
              // }
              >
                <div className="flex items-center gap-1">
                  Branch
                  {/* {getSortIcon("branch")} */}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  toggleSort("joiningDate")
                }
              >
                <div className="flex items-center gap-1">
                  Joining Date
                  {getSortIcon("joiningDate")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
              // onClick={() =>
              //   handleSortChange(
              //     "employeeStatus",
              //     sortOrder === "ASC" ? "DESC" : "ASC",
              //   )
              // }
              >
                <div className="flex items-center gap-1">
                  Status
                  {/* {getSortIcon("employeeStatus")} */}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 text-center"
                sx={{
                  ...stickyHeaderRightSx,
                  minWidth: "100px",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee, index) => (
              <TableRow
                key={employee.id}
                hover
                sx={getRowColor(index)}
              >
                <TableCell
                  sx={{
                    ...getStickyLeftSx(index),
                    minWidth: "70px",
                  }}
                >
                  {page * limit + index + 1}
                </TableCell>
                <TableCell
                  sx={{
                    ...getStickyLeftSx(index),
                    left: "70px",
                    minWidth: "100px",
                  }}
                  className="hover:!text-blue-500 hover:!underline"
                  onClick={() => { if (employee) navigate(`/employees/${employee.id}`); }}>
                  {employee.employeeId}
                </TableCell>
                <TableCell className="font-medium">
                  {employee.name}
                </TableCell>
                <TableCell>
                  {employee.emailAddress}
                </TableCell>
                <TableCell>
                  {employee.mobileNumber || "-"}
                </TableCell>
                <TableCell>
                  {employee.designation || "-"}
                </TableCell>
                <TableCell>
                  {employee.department || "-"}
                </TableCell>
                <TableCell>
                  {employee.branch || "-"}
                </TableCell>
                <TableCell>
                  {employee.joiningDate
                    ? formatDate(employee.joiningDate)
                    : "-"}
                </TableCell>
                <TableCell>
                  {employee.employeeStatus || "-"}
                </TableCell>
                <TableCell
                  className="text-center"
                  sx={{
                    ...getStickyRightSx(index),
                    minWidth: "50px",
                  }}
                >
                  <div className="flex items-center justify-center">
                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => openActionMenu(e, employee)}
                      >
                        <MoreVertOutlined className="!w-4 text-gray-800" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Employee">
                      <IconButton
                        size="small"
                        onClick={(e) => openExportMenu(e, employee.id)}
                      >
                        <FileDownloadOutlined
                          className="!w-4"
                          color="primary"
                        />
                      </IconButton>
                    </Tooltip>
                    {isInactiveEmployee(employee) ? (
                      <Tooltip title="Reactivate">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleReactivateEmployee(employee.id, employee.name)
                          }
                        >
                          <HowToRegOutlined
                            className="!w-4"
                            sx={{ color: "#16a34a" }}
                          />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRelievingDialogEmployee(employee);
                            setRelievingDate("");
                            setRelievingDialogOpen(true);
                          }}
                        >
                          <NoAccountsOutlined
                            className="!w-4"
                            sx={{ color: "#ef4444" }}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  <DataState
                    compact
                    type="empty"
                    title="No Employee Found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
        {/* {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-200">
            No employees found
          </div>
        )} */}
      </TableContainer>

      {/* Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage - 1)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(0);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={true}
        />
      )}

      {/* Filter Popup */}
      <FilterPopup
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        fields={filterFields}
        initialFilters={activeFilters || undefined}
        title="Filter Employees"
      />

      {/* Add/Edit Employee Dialog */}
      <Dialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        maxWidth="md"
        sx={dialogsx}
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-gray-800 ml-4 text-[12px]">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </div>
          <IconButton
            onClick={() => setEmployeeDialogOpen(false)}
          >
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          {/* {
            downloading && (
              <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={downloading}
              >
                <CircularProgress />
              </Backdrop>
            )} */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2" onKeyDown={handleEnterAsTab}>
            {isEditing && (
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                disabled
              />
            )}
            <TextField
              fullWidth
              label="Employee Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isEditing}
            />
            <TextField
              fullWidth
              label="Email ID"
              type="email"
              value={formData.emailAddress}
              onChange={(e) =>
                setFormData({ ...formData, emailAddress: e.target.value })
              }
              required
              disabled={isEditing}
            />
            {/* <TextField
              fullWidth
              label="Mobile Number"
              type="email"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({ ...formData, mobileNumber: e.target.value })
              }
              required
            /> */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Joining"
                value={
                  formData.joiningDate ? dayjs(formData.joiningDate) : null
                }
                onChange={(newValue) =>
                  setFormData({
                    ...formData,
                    joiningDate: newValue
                      ? dayjs(newValue).format("YYYY-MM-DD")
                      : "",
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                  openPickerButton: {
                    color: "primary",
                    edge: "end",
                  },
                }}
              />
            </LocalizationProvider>
            {/* <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department || ""}
                label="Department"
                className="!text-[12px]"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    department: e.target.value,
                    departmentId: departments.find(
                      (d) => d.departmentName === e.target.value,
                    )?.id,
                  })
                }
              >
                <MenuItem value="" className="!text-[12px]">
                  Select Department
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem
                    key={dept.id}
                    value={dept.departmentName}
                    className="!text-[12px]"
                  >
                    {dept.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {/* <FormControl fullWidth>
              <InputLabel>Designation</InputLabel>
              <Select
                value={formData.designation || ""}
                label="Designation"
                className="!text-[12px]"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    designation: e.target.value,
                    designationId: designations.find(
                      (d) => d.name === e.target.value,
                    )?.id,
                  })
                }
              >
                <MenuItem value="" className="!text-[12px]">
                  Select Designation
                </MenuItem>
                {designations.map((desig) => (
                  <MenuItem
                    key={desig.id}
                    value={desig.name}
                    className="!text-[12px]"
                  >
                    {desig.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {
              !session?.branchId && <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={formData.branch || ""}
                  label="Branch"
                  className="!text-[12px]"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branch: e.target.value,
                      branchId: branches.find(
                        (d) => d.branchName === e.target.value,
                      )?.id,
                    })
                  }
                >
                  <MenuItem value="" className="!text-[12px]">
                    Select Branch
                  </MenuItem>
                  {branches.map((bran) => (
                    <MenuItem
                      key={bran.id}
                      value={bran.branchName}
                      className="!text-[12px]"
                    >
                      {bran.branchName} <span className="text-gray-500 ml-2 !capitalize">({bran.branchCode})</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
            <Autocomplete
              fullWidth
              options={formData.branch ? departments.filter((item) => item.branchName == formData.branch) : departments}
              getOptionLabel={(option) => option.departmentName + ' - ' + (option.branchName) || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.department || null}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  department: newValue,
                  departmentId: newValue?.id || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Department"
                  variant="outlined"
                  className="!text-[12px]"
                />
              )}
              sx={masterSx}
            />
            <Autocomplete
              fullWidth
              options={designations}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.designation || null}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  designation: newValue,
                  designationId: newValue?.id || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Designation"
                  variant="outlined"
                  className="!text-[12px]"
                />
              )}
              sx={masterSx}
            />

            <Autocomplete
              fullWidth
              options={empStatus}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.employeeStatus || ""}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  employeeStatus: newValue,
                  employeeStatusId: newValue?.id || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee Status"
                  variant="outlined"
                  className="!text-[12px]"
                />
              )}
              sx={masterSx}
            />
            {/* <FormControl fullWidth>
              <InputLabel>
                Employee Status
              </InputLabel>
              <Select
                value={formData.employeeStatus || ""}
                label="Employee Status"
                className="!text-[12px]"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employeeStatus: e.target.value,
                    employeeStatusId: empStatus.find(
                      (d) => d.name === e.target.value,
                    )?.id,
                  })
                }
              >
                <MenuItem value="" className="!text-[12px]">
                  Select Employee Status
                </MenuItem>
                {empStatus.map((s) => (
                  <MenuItem
                    key={s.id}
                    value={s.name}
                    className="!text-[12px]"
                  >
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {!isEditing && (
              <TextField
                fullWidth
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({ ...formData, mobileNumber: e.target.value })
                }
              />
            )}
          </div>
          {!isEditing && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasManualEmpId}
                    onChange={(e) => setHasManualEmpId(e.target.checked)}
                    className="text-gray-800"
                  />
                }
                label="Enter Employee ID Manually"
                className="my-2"
              />
              {/* <FormControlLabel
                control={
                  <Switch
                    checked={configured}
                    onChange={(event) => setConfigured(event.target.checked)}
                    color="primary"
                    className="!text-gray-800"
                  />
                }
                label="Configured"
              /> */}

              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">
                    Employee ID Configuration
                  </div>
                  <Button variant="contained" size="small" onClick={getEmployeeIdForCreation}>
                    Configure
                  </Button>
                </div>
                {!hasManualEmpId ? (
                  <>
                    <FormControl fullWidth className="!mt-6">
                      <InputLabel>
                        Generation Flow
                      </InputLabel>
                      <Select
                        value={empGenerationFlow}
                        label="Generation Flow"
                        className="!text-[12px]"
                        onChange={(e) =>
                          setEmpGenerationFlow(
                            e.target.value as "new" | "continue",
                          )
                        }
                      >
                        <MenuItem
                          value="new"
                          className="!text-[12px]"
                        >
                          Generate With New Pattern
                        </MenuItem>
                        <MenuItem
                          value="continue"
                          disabled={!employeeIdConfig?.configured}
                          className="!text-[12px]"
                        >
                          Continue Last Generated ID
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {empGenerationFlow === "new" && (
                      <div className={`grid grid-cols-1 ${empCodeType === "pattern" ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mt-6`}>
                        <FormControl fullWidth>
                          <InputLabel>
                            Format Type
                          </InputLabel>
                          <Select
                            value={empCodeType}
                            label="Format Type"
                            className="!text-[12px]"
                            onChange={(e) => setEmpCodeType(e.target.value)}
                          >
                            <MenuItem
                              value="pattern"
                              className="!text-[12px]"
                            >
                              Pattern
                            </MenuItem>
                            <MenuItem
                              value="alphanumeric"
                              className="!text-[12px]"
                            >
                              Alphanumeric
                            </MenuItem>
                            <MenuItem
                              value="number"
                              className="!text-[12px]"
                            >
                              Number
                            </MenuItem>
                          </Select>
                        </FormControl>
                        {empCodeType === "pattern" && (
                          <>
                            <TextField
                              fullWidth
                              label="Prefix"
                              className="!text-[12px]"
                              value={empPrefix}
                              onChange={(e) => setEmpPrefix(e.target.value)}
                              placeholder="EMP"
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="Zero"
                              className="!text-[12px]"
                              value={zero}
                              onChange={(e) => setZero(Number(e.target.value))}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="Starting Number"
                              className="!text-[12px]"
                              value={empStartNumber}
                              onChange={(e) =>
                                setEmpStartNumber(e.target.value)
                              }
                            />
                          </>
                        )}
                        {empCodeType === "alphanumeric" && (
                          <TextField
                            fullWidth
                            type="number"
                            label="Number Of Digits"
                            className="!text-[12px]"
                            value={empDigitCount}
                            onChange={(e) => setEmpDigitCount(e.target.value)}
                            helperText="Random mixed employee ID"
                          />
                        )}
                        {empCodeType === "number" && (
                          <>
                            <TextField
                              fullWidth
                              type="number"
                              label="Zero"
                              className="!text-[12px]"
                              value={zero}
                              onChange={(e) => setZero(Number(e.target.value))}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="Starting Number"
                              className="!text-[12px]"
                              value={empStartNumber}
                              onChange={(e) => setEmpStartNumber(e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    )}

                    <Alert severity="info" className="mt-4">
                      <div className="flex flex-col gap-1">
                        {empGenerationFlow === "continue" && (
                          <>
                            <div>
                              Last Generated ID:&nbsp;
                              <strong>
                                {employeeIdConfig?.lastGeneratedId ||
                                  "No Employees"}
                              </strong>
                            </div>

                            <div>
                              Next Sequence:&nbsp;
                              <strong>
                                {employeeIdConfig?.nextSequencePreview || "N/A"}
                              </strong>
                            </div>
                          </>
                        )}

                        {empGenerationFlow === "new" && (
                          <div>
                            Generated Preview:&nbsp;
                            <strong>{generateEmployeeIdPreview()}</strong>
                          </div>
                        )}
                      </div>
                    </Alert>
                  </>
                ) : (
                  <div className="mt-4">
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={manualEmployeeId}
                      onChange={(e) => setManualEmployeeId(e.target.value)}
                      placeholder="EMP001"
                      helperText="Enter unique employee ID"
                    />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="text-[12px] text-gray-500 mt-2">
            On saving, onboarding will begin and the employee will receive a
            password setup email.
          </div>
        </DialogContent>
        <DialogActions className="!p-4 border-t !border-gray-300">
          <Button
            onClick={() => setEmployeeDialogOpen(false)}
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveEmployee()}
            variant="contained"
            className="!bg-primary"
          >
            {isEditing ? "Update Employee" : "Add & Send Welcome Email"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Row Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          className="!text-[12px]"
          onClick={() => {
            if (actionMenuEmployee)
              navigate(`/employees/${actionMenuEmployee.id}`);
            closeActionMenu();
          }}
        >
          <VisibilityOutlined
            className="!w-4 mr-2"
            sx={{ color: "var(--color-primary)" }}
          />
          View Details
        </MenuItem>
        <MenuItem
          className="!text-[12px]"
          onClick={() => {
            if (actionMenuEmployee) handleOpenEditDialog(actionMenuEmployee);
            closeActionMenu();
          }}
        >
          <EditOutlined className="!w-4 mr-2" color="info" />
          Edit Employee
        </MenuItem>
      </Menu>

      {/* Relieving Date Dialog */}
      <Dialog
        open={relievingDialogOpen}
        onClose={() => setRelievingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-gray-800 text-[12px] ml-4 font-medium">
            Deactivate Employee
          </div>
          <IconButton
            onClick={() => setRelievingDialogOpen(false)}
          >
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="text-[12px] text-gray-600 mb-5">
            Enter the relieving date for{" "}
            <strong>{relievingDialogEmployee?.name}</strong>
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Relieving Date"
              value={relievingDate ? dayjs(relievingDate) : null}
              onChange={(newValue) =>
                setRelievingDate(
                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                )
              }
            />
          </LocalizationProvider>
          <TextField
            label="Reason for Deactivate"
            value={adminRemarks}
            required
            multiline
            rows={3}
            onChange={(e) => setAdminRemarks(e.target.value)}
            className="!mt-5 !text-[12px]"
          />
        </DialogContent>
        <DialogActions className="!p-4 border-t !border-gray-300">
          <Button
            onClick={() => setRelievingDialogOpen(false)}
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (relievingDialogEmployee) {
                await updateReleivingDate(
                  relievingDialogEmployee,
                  relievingDate, adminRemarks
                );
                setRelievingDialogOpen(false);
                setRelievingDate("");
              }
            }}
            variant="contained"
            disabled={!relievingDate || !adminRemarks}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkUploadDialogOpen}
        onClose={handleCloseBulkUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b !border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">Bulk Upload Employees</div>
          <IconButton onClick={handleCloseBulkUploadDialog}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          {/* {
            downloading && (
              <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={downloading}
              >
                <CircularProgress />
              </Backdrop>
            )} */}
          <Alert severity="info" className="mb-4">
            Download the template, fill in employee details, and upload the
            file. Backend sends invite / welcome emails to newly imported
            employees automatically.
          </Alert>

          <div className="text-center mb-4">
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={async () => {
                showSpinner();
                try {
                  await employeeService.downloadBulkUploadTemplate();
                } catch (error: any) {
                  showSnackbar(
                    error.message || "Failed to download template.",
                    "error",
                  );
                } finally {
                  hideSpinner();
                }
              }}
            >
              Download Template
            </Button>
          </div>
          <div className="flex items-center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={excelHasEmployeeIdColumn}
                  onChange={(e) =>
                    setExcelHasEmployeeIdColumn(e.target.checked)
                  }
                  className={`text-gray-800 ${!excelHasEmployeeIdColumn ? "animate-blink" : ""}`}
                  disabled={!employeeIdConfig?.configured}
                />
              }
              label="Excel already contains Employee ID column"
            />
            {/* <FormControl className="flex items-center gap-4 !flex-row !w-max"
              disabled={!employeeIdConfig?.configured}>
              <div className="text-[12px] text-gray-800">Does the Excel already contain an Employee ID column?</div>
              <RadioGroup
                row
                value={excelHasEmployeeIdColumn ? "yes" : "no"}
                onChange={(e) =>
                  setExcelHasEmployeeIdColumn(e.target.value === "yes")
                }
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio />}
                  label="Yes"
                />
                <FormControlLabel
                  value="no"
                  control={<Radio />}
                  label="No"
                />
              </RadioGroup>
            </FormControl> */}
            <div className="text-[12px] text-red-600">
              [ Note :{" "}
              {!employeeIdConfig?.configured
                ? "Employee ID generation is not configured. Your Excel file must contain an Employee ID column"
                : excelHasEmployeeIdColumn
                  ? "Employee IDs will be read from Excel"
                  : `Employee IDs will be generated automatically starting from ${employeeIdConfig?.nextSequencePreview}`}{" "}
              ]
            </div>
          </div>
          {
            !employeeIdConfig?.configured &&
            <div className="mb-2 text-[12px] text-amber-800">To configure Click "Add Employee" Button to configure the ID generation</div>
          }
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] || null);
                setUploadResult(null);
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <CloudUploadOutlined className="text-6xl text-gray-400 mb-2" />
              <Typography
                variant="body1"
                className="text-gray-600"
              >
                {uploadFile ? uploadFile.name : "Click to select a file"}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-400"
              >
                Accepted formats: CSV, XLSX &nbsp;·&nbsp; Max size: 10 MB
              </Typography>
              <Typography
                variant="body1"
              >
                Required Fields: <span className="text-red-500 font-bold">First Name - Last Name - Email {(!employeeIdConfig?.configured || excelHasEmployeeIdColumn) ? '- EmployeeID' : ''}</span>
              </Typography>
            </label>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box className="mt-4">
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
              />
              <Typography
                variant="caption"
                className="text-gray-500 mt-1"
              >
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* After Upload Shows: */}
          {uploadResult && (
            <div className="mt-4 space-y-4">
              {/* Upload Summary */}
              <div
                className={`border rounded-lg p-4 ${uploadResult?.failureCount && uploadResult?.failureCount > 0
                  ? "border-orange-200 bg-orange-50/40"
                  : "border-green-200 bg-green-50"
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-gray-800 text-base">
                      Upload Result
                    </div>
                    <div className="text-xs text-gray-500">
                      {uploadResult.fileName}
                    </div>
                  </div>

                  <Chip
                    label={uploadResult.status || "COMPLETED"}
                    color={
                      uploadResult?.failureCount &&
                        uploadResult?.failureCount > 0
                        ? "warning"
                        : "success"
                    }
                    size="small"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Total Records</div>
                    <div className="font-bold text-lg">
                      {uploadResult.totalRecords ?? 0}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Imported:</div>
                    <div className="font-bold text-lg text-green-600">
                      {uploadResult.successCount ?? 0}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Failed</div>
                    <div className="font-bold text-lg text-red-600">
                      {uploadResult.failureCount ?? 0}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">
                      Welcome Emails Sent
                    </div>
                    <div className="font-bold text-lg text-blue-600">
                      {uploadResult.welcomeEmailsSent ?? 0}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">
                      Welcome Emails Failed
                    </div>
                    <div className="font-bold text-lg text-orange-600">
                      {uploadResult.welcomeEmailsFailed ?? 0}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Completed At</div>
                    <div className="font-medium text-xs">
                      {uploadResult.completedAt
                        ? new Date(uploadResult.completedAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </div>

                {uploadResult.jobId && (
                  <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                    Job ID:{" "}
                    <span className="font-mono">{uploadResult.jobId}</span>
                  </div>
                )}
              </div>

              {/* Generated Employee IDs */}
              {uploadResult.generatedEmployeeIds &&
                uploadResult.generatedEmployeeIds?.length > 0 && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircleOutlined
                        fontSize="small"
                        color="success"
                      />
                      <div className="font-semibold text-green-700">
                        Generated Employee IDs
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
                      {uploadResult.generatedEmployeeIds.map(
                        (id: string, index: number) => (
                          <Chip
                            key={`${id}-${index}`}
                            label={id}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Welcome Email Failures */}
              {uploadResult.welcomeEmailFailures &&
                uploadResult.welcomeEmailFailures?.length > 0 && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="font-semibold text-orange-700 mb-3">
                      Welcome Email Failures
                    </div>

                    <div className="max-h-40 overflow-auto space-y-2">
                      {uploadResult.welcomeEmailFailures.map(
                        (failure: string, index: number) => (
                          <div
                            key={index}
                            className="text-sm text-orange-700 bg-white border rounded p-2"
                          >
                            {failure}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Row Errors */}
              {uploadResult.errors && uploadResult.errors?.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="font-semibold text-red-700 mb-3">
                    Row Errors
                  </div>

                  <div className="max-h-72 overflow-auto space-y-3">
                    {uploadResult.errors.map((err: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white border border-red-100 rounded-lg p-3"
                      >
                        {(err.row ?? err.rowNumber) !== undefined && (
                          <div className="font-medium text-red-700">
                            Row {err.row ?? err.rowNumber}
                          </div>
                        )}

                        {(err.branchName || err.branchCode) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {err.branchName}
                            {err.branchCode && ` (${err.branchCode})`}
                          </div>
                        )}

                        {err.message && (
                          <div className="text-sm text-red-600 mt-1">
                            {err.message}
                          </div>
                        )}

                        {err.errors && (
                          <ul className="list-disc ml-5 mt-2 text-sm text-red-600">
                            {err.errors.map((message: string, idx: number) => (
                              <li key={idx}>{message}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* {uploadResult?.generatedEmployeeIds && uploadResult.generatedEmployeeIds.length > 0 && (
            <div className="mt-4 border rounded-lg p-4 bg-gray-50">
              <div className="">
                <div className="font-semibold text-green-700 mb-2">
                  Generated Employee IDs
                </div>

                <div className="flex flex-wrap gap-2">
                  {uploadResult.generatedEmployeeIds.map(
                    (id: string, index: number) => (
                      <Chip
                        key={`${id}-${index}`}
                        label={id}
                        color="success"
                        size="small"
                      />
                    )
                  )}
                </div>
              </div>
              {uploadResult?.welcomeEmailFailures && uploadResult.welcomeEmailFailures?.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-orange-700 mb-2">
                    Welcome Email Failures
                  </div>

                  <div className="max-h-32 mb-4 overflow-auto text-xs">
                    {uploadResult.welcomeEmailFailures.map(
                      (failure: string, index: number) => (
                        <div key={index} className="text-orange-600">
                          • {failure}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              <div className="font-semibold text-gray-800 mb-2">Upload Result</div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>Total Records: <strong>{uploadResult?.totalRecords}</strong></div>
                <div className="text-green-700">Success: <strong>{uploadResult?.successCount}</strong></div>
                <div className="text-red-700">Failed: <strong>{uploadResult?.failureCount}</strong></div>
                <div className="text-blue-700">Status: <strong>{uploadResult?.status}</strong></div>
                <div className="text-indigo-700">Welcome Emails Sent:<strong>{uploadResult?.welcomeEmailsSent}</strong></div>
                <div className="text-orange-700">Welcome Emails Failed:<strong>{uploadResult?.welcomeEmailsFailed}</strong></div>
              </div>
            </div>
          )}
          {uploadResult?.errors && uploadResult.errors?.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold text-red-700 mb-2">
                Validation Errors
              </div>
              <div className="max-h-48 overflow-auto space-y-1 text-xs">
                {uploadResult.errors.map((err: any, index: number) => (
                  <div key={index} className="text-red-600">
                    Row {err.row}
                    {err.branchName && ` (${err.branchName})`}
                    : {err.message}
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </DialogContent>
        <DialogActions className="!p-4 border-t !border-gray-300">
          <Button
            onClick={handleCloseBulkUploadDialog}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Close
          </Button>
          <Button
            onClick={handleBulkUpload}
            variant="contained"
            disabled={!uploadFile}
            className={!uploadFile ? "!bg-gray-300" : "!bg-primary"}
          >
            Upload & Send Emails
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
