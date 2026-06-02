import { useState, useEffect } from "react";
import MaterialModule from "../../materialModule";
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
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from "../const";
import { useNavigate } from "react-router-dom";
import { branchService } from "../../services/modules/branch";
import { formatDate } from "../../utils/dateFormatter";
import type { FilterConfig, FilterField } from "../../types/filter.ts";
import { operatorLabels } from "../../types/filterOperators";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

export default function EmployeeManagement() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();

  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterConfig | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<Employee>>({});

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);

  // Code Generation (used by Add Employee dialog)
  const [hasManualEmpId, setHasManualEmpId] = useState(false);
  const [empCodeType, setEmpCodeType] = useState("pattern");
  const [empGenerationFlow, setEmpGenerationFlow] = useState<"new" | "continue">("new");
  const [empPrefix, setEmpPrefix] = useState("EMP");
  const [empStartNumber, setEmpStartNumber] = useState("001");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [empDigitCount, setEmpDigitCount] = useState("4");
  const [employeeIdConfig, setEmployeeIdConfig] = useState<any>(null);
  const [nextIdPreview, setNextIdPreview] = useState<string>("");

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmployeeForExport, setSelectedEmployeeForExport] = useState<string | null>(null);

  const [isDeactivate, setIsDeactivate] = useState(false);
  const [deactivateEmployeeId, setDeactivateEmployeeId] = useState("");
  const [excelHasEmployeeIdColumn, setExcelHasEmployeeIdColumn] = useState(false);

  // Define filter fields for employee management
  const filterFields: FilterField[] = [
    {
      id: 'employeeId',
      label: 'Employee ID',
      type: 'text',
      placeholder: 'Enter employee ID',
    },
    {
      id: 'name',
      label: 'Employee Name',
      type: 'text',
      placeholder: 'Enter employee name',
    },
    {
      id: 'emailAddress',
      label: 'Email Address',
      type: 'text',
      placeholder: 'Enter email address',
    },
    {
      id: 'mobileNumber',
      label: 'Mobile Number',
      type: 'text',
      placeholder: 'Enter mobile number',
    },
    {
      id: 'designationId',
      label: 'Designation',
      type: 'select',
      options: designations.map(d => ({ value: d.id, label: d.name })),
    },
    {
      id: 'dept',
      label: 'Department',
      type: 'select',
      options: departments.map(d => ({ value: d.departmentName, label: d.departmentName })),
    },
    {
      id: 'branch',
      label: 'Branch',
      type: 'select',
      options: branches.map(b => ({ value: b.branchName, label: b.branchName })),
    },
    {
      id: 'joinedFrom',
      label: 'Joining Date',
      type: 'date',
    },
    {
      id: 'employeeStatusId',
      label: 'Employee Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'ONBOARDING', label: 'Onboarding' },
        { value: 'TERMINATED', label: 'Terminated' },
      ],
    },
  ];

  const loadEmployeeIdConfig = async () => {
    try {
      const config: any = await employeeService.getEmployeeId();
      setEmployeeIdConfig(config);
      console.log(config);
      // if (config.configured) {
      //   setEmpCodeType(config.formatType.toLowerCase());
      //   if (config.prefix) setEmpPrefix(config.prefix);
      //   if (config.startingNumber) setEmpStartNumber(String(config.startingNumber));
      //   if (config.numberOfDigits) setEmpDigitCount(String(config.numberOfDigits));
      //   if (config.lastGeneratedId) {
      //     setEmpGenerationFlow("continue");
      //   }
      // }
      if (!config.configured) {
        setEmployeeIdConfig(config);
        setEmpGenerationFlow("new");
        setExcelHasEmployeeIdColumn(true);
        return;
      }

      setEmpCodeType(config.formatType.toLowerCase());
      setEmpPrefix(config.prefix || "EMP");
      setEmpStartNumber(String(config.startingNumber || 1));
      setEmpDigitCount(String(config.numberOfDigits || 4));

      if (config.lastGeneratedId) {
        setEmpGenerationFlow("continue");
      }
    } catch (error: any) {
      console.error("Failed to load employee ID config:", error);
      // Don't show error to user as this is not critical
    }
  };

  useEffect(() => {
    loadEmployeeIdConfig();
  }, []);

  useEffect(() => {
    if (employeeIdConfig) {
      setExcelHasEmployeeIdColumn(
        !employeeIdConfig.configured
      );
    }
  }, [employeeIdConfig]);

  const generatePreview = async () => {
    showSpinner();
    try {
      let payload: any = {};

      if (empGenerationFlow === "continue" && employeeIdConfig?.configured) {
        payload = {
          formatType: employeeIdConfig.formatType,
          prefix: employeeIdConfig.prefix,
          startingNumber: employeeIdConfig.startingNumber,
          numberOfDigits: employeeIdConfig.numberOfDigits,
        };
      } else {
        // Use current form values
        payload = {
          formatType: empCodeType.toUpperCase(),
          prefix: empCodeType === "pattern" ? empPrefix : undefined,
          startingNumber: (empCodeType === "pattern" || empCodeType === "number")
            ? parseInt(empStartNumber)
            : undefined,
          numberOfDigits: empCodeType === "alphanumeric"
            ? parseInt(empDigitCount)
            : undefined,
        };
      }

      const response: any = await employeeService.previewEmployeeId(payload);
      setNextIdPreview(response.previewId);
    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      setNextIdPreview("Error generating preview");
    } finally {
      hideSpinner();
    }
  };

  // Generate preview whenever relevant fields change
  useEffect(() => {
    if (!hasManualEmpId && employeeDialogOpen && empGenerationFlow === "new") {
      const timer = setTimeout(() => {
        if (empCodeType === "pattern" && (!empPrefix || !empStartNumber)) {
          return;
        }
        generatePreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [empCodeType, empPrefix, empStartNumber, empDigitCount, empGenerationFlow, employeeDialogOpen, hasManualEmpId, employeeIdConfig]);

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

  // Evaluate a single filter rule
  const evaluateRule = (item: any, rule: any): boolean => {
    const localFieldMap: Record<string, string> = {
      dept: "department",
      joinedFrom: "joiningDate",
    };
    const fieldValue = item[localFieldMap[rule.field] || rule.field];
    const ruleValue = rule.value;
    const safeFieldValue = fieldValue ?? "";
    const safeRuleValue = ruleValue ?? "";

    switch (rule.operator) {
      case 'equals':
        return String(safeFieldValue).toLowerCase() === String(safeRuleValue).toLowerCase();
      case 'notEquals':
        return String(safeFieldValue).toLowerCase() !== String(safeRuleValue).toLowerCase();
      case 'contains':
        return String(safeFieldValue).toLowerCase().includes(String(safeRuleValue).toLowerCase());
      case 'notContains':
        return !String(safeFieldValue).toLowerCase().includes(String(safeRuleValue).toLowerCase());
      case 'startsWith':
        return String(safeFieldValue).toLowerCase().startsWith(String(safeRuleValue).toLowerCase());
      case 'endsWith':
        return String(safeFieldValue).toLowerCase().endsWith(String(safeRuleValue).toLowerCase());
      case 'greaterThan':
        return new Date(safeFieldValue) > new Date(safeRuleValue);
      case 'greaterThanOrEqual':
        return new Date(safeFieldValue) >= new Date(safeRuleValue);
      case 'lessThan':
        return new Date(safeFieldValue) < new Date(safeRuleValue);
      case 'lessThanOrEqual':
        return new Date(safeFieldValue) <= new Date(safeRuleValue);
      case 'between':
        return new Date(safeFieldValue) >= new Date(safeRuleValue) && new Date(safeFieldValue) <= new Date(rule.value2);
      case 'in':
        return Array.isArray(safeRuleValue) && safeRuleValue.includes(safeFieldValue);
      case 'notIn':
        return Array.isArray(safeRuleValue) && !safeRuleValue.includes(safeFieldValue);
      case 'isEmpty':
        return !safeFieldValue || safeFieldValue === '' || (Array.isArray(safeFieldValue) && safeFieldValue.length === 0);
      case 'isNotEmpty':
        return safeFieldValue && safeFieldValue !== '' && (!Array.isArray(safeFieldValue) || safeFieldValue.length > 0);
      default:
        return true;
    }
  };

  // Apply filters to data
  const applyFiltersToData = (
    data: Employee[],
    filters: FilterConfig
  ): Employee[] => {
    if (!filters || filters.rules.length === 0) return data;
    return data.filter((item) => {
      const results = filters.rules.map(rule =>
        evaluateRule(item, rule)
      );
      if (filters.condition === "AND") {
        return results.every(Boolean);
      }
      return results.some(Boolean);
    });
  };

  const handleApplyFilters = (filters: FilterConfig) => {
    setActiveFilters(filters);
    setPage(0);
  };

  // Remove a specific filter
  const removeFilter = (ruleId: string) => {
    if (activeFilters) {
      const newRules = activeFilters.rules.filter(rule => rule.id !== ruleId);
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

  const buildServerFilterParams = (filters: FilterConfig | null): EmployeeListQuery => {
    if (!filters?.rules.length || filters.condition !== "AND") return {};

    return filters.rules.reduce<EmployeeListQuery>((params, rule) => {
      if (rule.operator !== "equals" && rule.operator !== "between") return params;

      switch (rule.field) {
        case "dept":
          params.dept = String(rule.value);
          break;
        case "branch":
          params.branch = String(rule.value);
          break;
        case "designationId":
          params.designationId = String(rule.value);
          break;
        case "employeeStatusId":
          params.employeeStatusId = String(rule.value);
          break;
        case "managerId":
          params.managerId = String(rule.value);
          break;
        case "joinedFrom":
          if (rule.operator === "between") {
            params.joinedFrom = String(rule.value);
            params.joinedTo = String(rule.value2);
          } else {
            params.joinedFrom = String(rule.value);
          }
          break;
        case "employeeId":
        case "name":
        case "emailAddress":
        case "mobileNumber":
          if (!params.search) params.search = String(rule.value);
          break;
        default:
          break;
      }

      return params;
    }, {});
  };

  const isServerSupportedFilter = (filters: FilterConfig | null): boolean => {
    if (!filters?.rules.length) return true;
    if (filters.condition !== "AND") return false;

    return filters.rules.every((rule) => {
      const simpleFields = [
        "dept",
        "branch",
        "designationId",
        "employeeStatusId",
        "managerId",
        "employeeId",
        "name",
        "emailAddress",
        "mobileNumber",
      ];

      return (
        (simpleFields.includes(rule.field) && rule.operator === "equals") ||
        (rule.field === "joinedFrom" && (rule.operator === "equals" || rule.operator === "between"))
      );
    });
  };

  // Fetch employees
  const getEmployees = async () => {
    showSpinner();
    try {
      const params: EmployeeListQuery = {
        page,
        size: limit,
        sort: `${sortBy},${sortOrder}`,
        ...buildServerFilterParams(activeFilters),
      };
      if (searchTerm) params.search = searchTerm;
      if (includeInactive) params.includeInactive = true;
      const response = await employeeService.getEmployees(params);
      const employeePage = normalizeEmployeePageResponse(response);
      const employeeData = employeePage.content as Employee[];
      let visibleEmployees = employeeData;

      setTotal(employeePage.totalElements);

      // Operators outside the backend query contract are applied to the current page only.
      if (activeFilters && activeFilters.rules.length > 0 && !isServerSupportedFilter(activeFilters)) {
        visibleEmployees = applyFiltersToData(employeeData, activeFilters);
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
      const deptRes: any = await departmentService.getDepartments();
      setDepartments(deptRes.data.content || deptRes.data || []);
      const branchRes: any = await branchService.getDropdownBranches();
      setBranches(branchRes.data.content || branchRes.data || []);
      const desigRes: any = await categoryService.getCategoryItems("00c4fd3c-4fb6-4d33-932e-80a615a90825");
      setDesignations(desigRes.data.content || desigRes.data || []);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  useEffect(() => {
    getEmployees();
    getMasterData();
  }, [page, limit, sortBy, sortOrder, searchTerm, activeFilters, includeInactive]);

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

  const handleSortChange = (newSortBy: string, newSortOrder?: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || "ASC");
    setPage(0);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "ASC" ? (
      <MaterialModule.ArrowUpward fontSize="small" className="ml-1" />
    ) : (
      <MaterialModule.ArrowDownward fontSize="small" className="ml-1" />
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
    let payload: any = {};
    if (empGenerationFlow === "continue" && employeeIdConfig?.configured) {
      payload = {
        formatType: employeeIdConfig.formatType,
        prefix: employeeIdConfig.prefix,
        startingNumber: employeeIdConfig.startingNumber,
        numberOfDigits: employeeIdConfig.numberOfDigits,
      };
    } else {
      payload = {
        formatType: empCodeType.toUpperCase(),
      };
      if (empCodeType === "pattern") {
        payload.prefix = empPrefix;
        payload.startingNumber = parseInt(empStartNumber);
      }
      if (empCodeType === "number") {
        payload.startingNumber = parseInt(empStartNumber);
      }
      if (empCodeType === "alphanumeric") {
        payload.numberOfDigits = parseInt(empDigitCount);
      }
      await employeeService.updateEmployeeId(payload);
    }
    const preview: any = await employeeService.previewEmployeeId(payload);
    return preview.previewId;
  };

  const validateEmployeeIdConfig = () => {
    if (hasManualEmpId) return true;

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
      branchId: "",
    });

    setHasManualEmpId(false);
    setEmpCodeType("pattern");
    setEmpPrefix("EMP");
    setEmpStartNumber("001");
    setEmpDigitCount("4");
    setManualEmployeeId("");
    setSelectedEmployee(null);
    setEmpGenerationFlow(
      employeeIdConfig?.configured ? "continue" : "new"
    );
  };

  // Handle Add Employee
  const handleOpenAddDialog = () => {
    setIsEditing(false);
    resetForm();
    setEmployeeDialogOpen(true);
    loadEmployeeIdConfig();
  };

  // Handle Edit Employee - Open Edit Dialog
  // const handleOpenEditDialog = (employee: Employee) => {
  //   setIsEditing(true);
  //   setSelectedEmployee(employee);
  //   setFormData({
  //     name: employee.name,
  //     emailAddress: employee.emailAddress,
  //     joiningDate: employee.joiningDate?.split("T")[0] || "",
  //     branch: employee.branch || "",
  //     branchId: employee.branchId,
  //     employeeId: employee.employeeId,
  //     departmentId: employee.departmentId,
  //     designationId: employee.designationId,
  //     department: employee.department,
  //     designation: employee.designation,
  //     mobileNumber: employee.mobileNumber || "",
  //   });
  //   setEmployeeDialogOpen(true);
  // };

  // Handle Update Employee
  const handleSaveEmployee = async () => {
    if (!formData.name || !formData.emailAddress) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
      showSnackbar("Please enter a valid email address", "error");
      return;
    }
    if (!validateEmployeeIdConfig()) return;
    showSpinner();
    try {
      if (isEditing) {
        const payload: any = {
          firstName: formData.name,
          emailAddress: formData.emailAddress,
          joiningDate: formData.joiningDate,
          branchId: formData.branchId || selectedEmployee?.branchId,
          departmentId: formData.departmentId || selectedEmployee?.departmentId,
          designationId: formData.designationId || selectedEmployee?.designationId,
          mobileNumber: formData.mobileNumber,
        };
        await employeeService.updateEmployee(selectedEmployee!.id, payload);
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
          mobileNumber: formData.mobileNumber,
        };
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
          showSnackbar(error.message || "Failed to deactivate employee.", "error");
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
          const updated: EmployeeSummaryResponse = await employeeService.reactivateEmployee(id);
          showSnackbar(
            `"${updated?.name ?? name}" has been reactivated.`,
            "success",
          );
          await employeeService.updateAdminInfo(id, { relievedDate: "" })
          getEmployees();
        } catch (error: any) {
          showSnackbar(error.message || "Failed to reactivate employee.", "error");
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
    const ext = uploadFile.name.toLowerCase().slice(uploadFile.name.lastIndexOf("."));
    if (!BULK_UPLOAD_ACCEPTED.includes(ext)) {
      showSnackbar("Invalid file type. Please upload a CSV or XLSX file.", "error");
      return;
    }
    if (uploadFile.size > BULK_UPLOAD_MAX_BYTES) {
      showSnackbar("File exceeds the 10 MB limit. Please upload a smaller file.", "error");
      return;
    }
    setUploadResult(null);
    showSpinner();
    try {
      const response: any = await employeeService.bulkUploadEmployees(
        uploadFile,
        excelHasEmployeeIdColumn,
        (progress) => { setUploadProgress(progress); },
      );
      const result = normalizeBulkUploadResponse(response);
      console.log(result);
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
          `Successfully imported ${result.successCount} employees. Welcome emails sent: ${result.welcomeEmailsSent}`,
          "success"
        );
      } else {
        showSnackbar(
          `Upload completed with ${result.failureCount} validation errors.`,
          "warning"
        );
      }
      getEmployees();
    } catch (error: any) {
      showSnackbar(error.message || "Failed to upload", "error");
    } finally {
      hideSpinner();
    }
  };

  const openExportMenu = (event: React.MouseEvent<HTMLElement>, employeeId?: string) => {
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
          format
        );

        showSnackbar(
          `Employee exported as ${format.toUpperCase()}`,
          "success"
        );
      } else {
        // Export all employees
        const params: any = {
          search: searchTerm || undefined,
          sort: `${sortBy},${sortOrder}`,
          ...buildServerFilterParams(activeFilters),
        };

        await employeeService.downloadEmployeeExport(
          params,
          format
        );

        showSnackbar(
          `Employees exported as ${format.toUpperCase()}`,
          "success"
        );
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to export", "error");
    } finally {
      hideSpinner();
      closeExportMenu();
    }
  };

  const updateReleivingDate = async (emp: any, value: any) => {
    showSpinner();
    try {
      await employeeService.updateAdminInfo(emp.id, { relievedDate: value })
      handleDeactivateEmployee(emp.id, emp.name);
      setIsDeactivate(false);
    } catch (error: any) {
      showSnackbar(error.message, 'error')
    } finally {
      hideSpinner();
    }
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-semibold text-gray-800">
            Employee Management
          </div>
          <div className="text-gray-500 text-[12px]">
            Manage employees, send welcome emails, and track onboarding
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <MaterialModule.FormControlLabel
            control={
              <MaterialModule.Switch
                checked={includeInactive}
                onChange={(e) => { setIncludeInactive(e.target.checked); setPage(0); }}
                size="small"
              />
            }
            label={<span className="text-[12px] text-gray-600">Include inactive</span>}
          />
          <MaterialModule.Button
            variant="outlined"
            startIcon={<MaterialModule.FileUploadIcon />}
            onClick={() => setBulkUploadDialogOpen(true)}
          >
            Bulk Upload
          </MaterialModule.Button>
          <MaterialModule.Button
            variant="contained"
            onClick={() => handleOpenAddDialog()}
            className="!bg-primary"
          >
            Add Employee
          </MaterialModule.Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters && activeFilters.rules.length > 0 && (
        <MaterialModule.Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
          <MaterialModule.Typography variant="caption" color="textSecondary">
            Filters ({activeFilters.condition}):
          </MaterialModule.Typography>
          {activeFilters.rules.map((rule) => {
            const field = filterFields.find(f => f.id === rule.field);
            return (
              <MaterialModule.Chip
                key={rule.id}
                label={`${field?.label} ${operatorLabels[rule.operator]} ${rule.value}`}
                onDelete={() => removeFilter(rule.id)}
                size="small"
                color="primary"
                variant="outlined"
              />
            );
          })}
          <MaterialModule.Button size="small" onClick={clearAllFilters}>
            Clear All
          </MaterialModule.Button>
        </MaterialModule.Box>
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
            {employees.filter(e => e.employeeStatus === 'ONBOARDING').length}
          </div>
        </div>
        {/* <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500">Active Employees</div>
          <div className="font-bold">
            {employees.filter(e => e.isActive === true).length}
          </div>
        </div> */}
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500">Onboarding</div>
          <div className="font-bold">
            {employees.filter(e => e.employeeStatus === 'ONBOARDING').length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <MaterialModule.TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, firstName, lastName, mobileNumber  or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <MaterialModule.Button
          variant="outlined"
          startIcon={<FilterAltOutlinedIcon />}
          onClick={() => setFilterOpen(true)}
          sx={{ position: 'relative' }}
        >
          <div>Filters</div>
          {getActiveFilterCount() > 0 && (
            // <MaterialModule.Chip
            //   label={getActiveFilterCount()}
            //   size="small"
            //   color="warning"
            //   sx={{ ml: 1, p:"5px", }}
            // />
            <div className="h-[18px] w-[30px] text-[10px] ml-2 bg-blue-700 text-white font-bold rounded-[50%]">{getActiveFilterCount()}</div>
          )}
        </MaterialModule.Button>

        <MaterialModule.Button
          variant="outlined"
          startIcon={<MaterialModule.DownloadIcon />}
          onClick={(e) => openExportMenu(e)}
        >
          Export
        </MaterialModule.Button>

        {/* Shared Export Menu */}
        <MaterialModule.Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={closeExportMenu}
        >
          <MaterialModule.MenuItem className="!text-[12px]" onClick={() => handleExport("csv")}>
            Export as CSV
          </MaterialModule.MenuItem>
          <MaterialModule.MenuItem className="!text-[12px]" onClick={() => handleExport("xlsx")}>
            Export as Excel
          </MaterialModule.MenuItem>
          <MaterialModule.MenuItem className="!text-[12px]" onClick={() => handleExport("pdf")}>
            Export as PDF
          </MaterialModule.MenuItem>
        </MaterialModule.Menu>
      </div>

      {/* Employees Table */}
      <MaterialModule.TableContainer
        component={MaterialModule.Paper}
        elevation={0}
        className={`${activeFilters && activeFilters.rules.length > 0 ? 'h-[calc(100vh-392px)]' : 'h-[calc(100vh-332px)]'} overflow-auto !bg-white-50`}
      >
        <MaterialModule.Table stickyHeader className="border border-gray-200">
          <MaterialModule.TableHead>
            <MaterialModule.TableRow>
              <MaterialModule.TableCell className="!font-semibold text-gray-800 " sx={{
                ...stickyHeaderLeftSx,
                minWidth: "70px",
              }}>
                S No
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="nth-c !font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "employeeId",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Employee ID
                  {getSortIcon("employeeId")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange("name", sortOrder === "ASC" ? "DESC" : "ASC")
                }
              >
                <div className="flex items-center gap-1">
                  Employee Name
                  {getSortIcon("name")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "emailAddress",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Employee Email
                  {getSortIcon("emailAddress")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "mobileNumber",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Mobile Number
                  {getSortIcon("mobileNumber")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
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
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
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
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
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
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "joiningDate",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Joining Date
                  {getSortIcon("joiningDate")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell className="!font-semibold text-gray-800 cursor-pointer"
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
              </MaterialModule.TableCell>
              <MaterialModule.TableCell className="!font-semibold text-gray-800 text-center" sx={{
                ...stickyHeaderRightSx,
                minWidth: "100px",
              }}>
                Actions
              </MaterialModule.TableCell>
            </MaterialModule.TableRow>
          </MaterialModule.TableHead>
          <MaterialModule.TableBody>
            {employees.map((employee, index) => (
              <MaterialModule.TableRow key={employee.id} hover sx={getRowColor(index)}>
                <MaterialModule.TableCell sx={{
                  ...getStickyLeftSx(index),
                  minWidth: "70px",
                }}>{page * limit + index + 1}</MaterialModule.TableCell>
                <MaterialModule.TableCell sx={{
                  ...getStickyLeftSx(index),
                  left: "70px",
                  minWidth: "100px",
                }}>{employee.employeeId}</MaterialModule.TableCell>
                <MaterialModule.TableCell className="font-medium">{employee.name}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.emailAddress}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.mobileNumber || "-"}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.designation || "-"}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.department || "-"}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.branch || "-"}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.joiningDate ? formatDate(employee.joiningDate) : "-"}</MaterialModule.TableCell>
                <MaterialModule.TableCell>{employee.employeeStatus || "-"}
                </MaterialModule.TableCell>
                <MaterialModule.TableCell className="text-center" sx={{
                  ...getStickyRightSx(index),
                  minWidth: "50px",
                }}>
                  <div className="flex">
                    <MaterialModule.Tooltip title="View Details">
                      <MaterialModule.IconButton
                        size="small"
                        className="!mr-1"
                        onClick={() => navigate(`/employees/${employee.id}`)}
                      >
                        <MaterialModule.VisibilityOutlined
                          className="!w-4"
                          sx={{ color: "var(--color-primary)" }}
                        />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip>
                    <MaterialModule.Tooltip title="Export Employee">
                      <MaterialModule.IconButton
                        size="small"
                        onClick={(e) => openExportMenu(e, employee.id)}
                      >
                        <MaterialModule.DownloadIcon className="!w-4" color="primary" />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip>
                    {isInactiveEmployee(employee) ? (
                      <MaterialModule.Tooltip title="Reactivate">
                        <MaterialModule.IconButton
                          size="small"
                          onClick={() =>
                            handleReactivateEmployee(employee.id, employee.name)
                          }
                        >
                          <MaterialModule.HowToRegIcon className="!w-4" sx={{ color: "#16a34a" }} />
                        </MaterialModule.IconButton>
                      </MaterialModule.Tooltip>
                    ) : (
                      <>
                        <MaterialModule.Tooltip title="Deactivate">
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => {
                              setIsDeactivate(true); setDeactivateEmployeeId(employee.id)
                            }
                              // handleDeactivateEmployee(employee.id, employee.name)
                            }
                          >
                            <MaterialModule.NoAccountsIcon className="!w-4" sx={{ color: "#ef4444" }} />
                          </MaterialModule.IconButton>
                        </MaterialModule.Tooltip>
                        {
                          isDeactivate && employee.id === deactivateEmployeeId &&
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              label="Relieving Date"
                              className="!bg-white"
                              value={employee.relievedDate ? dayjs(employee.relievedDate) : null}
                              onChange={(newValue) =>
                                updateReleivingDate(employee,
                                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                                )
                              }
                              slotProps={{
                                textField: {
                                  className: "!w-[150px]",
                                },
                              }}
                              sx={{
                                "& .MuiIconButton-root": {
                                  color: "dodgerblue",
                                },
                              }}
                            />
                          </LocalizationProvider>
                        }

                      </>
                    )}
                  </div>
                </MaterialModule.TableCell>
              </MaterialModule.TableRow>
            ))}
          </MaterialModule.TableBody>
        </MaterialModule.Table>
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-200">
            No employees found
          </div>
        )}
      </MaterialModule.TableContainer>

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
      <MaterialModule.Dialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-primary ml-4">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </div>
          <MaterialModule.IconButton onClick={() => setEmployeeDialogOpen(false)}>
            <MaterialModule.CloseOutlined className="!text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <MaterialModule.TextField
              fullWidth
              label="Employee Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isEditing}
            />
            <MaterialModule.TextField
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
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Joining"
                value={
                  formData.joiningDate ? dayjs(formData.joiningDate) : null
                }
                onChange={(newValue) =>
                  setFormData({
                    ...formData,
                    joiningDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
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
            <MaterialModule.FormControl fullWidth>
              <MaterialModule.InputLabel>Department</MaterialModule.InputLabel>
              <MaterialModule.Select
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
                <MaterialModule.MenuItem value="" className="!text-[12px]">
                  Select Department
                </MaterialModule.MenuItem>
                {departments.map((dept) => (
                  <MaterialModule.MenuItem
                    key={dept.id}
                    value={dept.departmentName}
                    className="!text-[12px]"
                  >
                    {dept.departmentName}
                  </MaterialModule.MenuItem>
                ))}
              </MaterialModule.Select>
            </MaterialModule.FormControl>
            <MaterialModule.FormControl fullWidth>
              <MaterialModule.InputLabel>Designation</MaterialModule.InputLabel>
              <MaterialModule.Select
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
                <MaterialModule.MenuItem value="" className="!text-[12px]">
                  Select Designation
                </MaterialModule.MenuItem>
                {designations.map((desig) => (
                  <MaterialModule.MenuItem
                    key={desig.id}
                    value={desig.name}
                    className="!text-[12px]"
                  >
                    {desig.name}
                  </MaterialModule.MenuItem>
                ))}
              </MaterialModule.Select>
            </MaterialModule.FormControl>
            <MaterialModule.TextField
              fullWidth
              label="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({ ...formData, mobileNumber: e.target.value })
              }
            />
            {isEditing && (
              <MaterialModule.TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                disabled
              />
            )}
          </div>
          {!isEditing && (
            <>
              <MaterialModule.FormControlLabel
                control={
                  <MaterialModule.Checkbox
                    checked={hasManualEmpId}
                    onChange={(e) => setHasManualEmpId(e.target.checked)}
                  />
                }
                label="Enter Employee ID Manually"
                className="my-2"
              />

              <div className="md:col-span-2 border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold text-gray-800">
                  Employee ID Configuration
                </div>
                {!hasManualEmpId ? (
                  <>
                    <MaterialModule.FormControl fullWidth className="!mt-6">
                      <MaterialModule.InputLabel>Generation Flow</MaterialModule.InputLabel>
                      <MaterialModule.Select
                        value={empGenerationFlow}
                        label="Generation Flow"
                        className="!text-[12px]"
                        onChange={(e) =>
                          setEmpGenerationFlow(
                            e.target.value as "new" | "continue"
                          )
                        }
                      >
                        <MaterialModule.MenuItem value="new" className="!text-[12px]">Generate With New Pattern</MaterialModule.MenuItem>
                        <MaterialModule.MenuItem value="continue" disabled={!employeeIdConfig?.configured} className="!text-[12px]">Continue Last Generated ID</MaterialModule.MenuItem>
                      </MaterialModule.Select>
                    </MaterialModule.FormControl>

                    {empGenerationFlow === "new" &&
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <MaterialModule.FormControl fullWidth>
                          <MaterialModule.InputLabel>Format Type</MaterialModule.InputLabel>
                          <MaterialModule.Select
                            value={empCodeType}
                            label="Format Type"
                            className="!text-[12px]"
                            onChange={(e) => setEmpCodeType(e.target.value)}
                          >
                            <MaterialModule.MenuItem value="pattern" className="!text-[12px]">Pattern</MaterialModule.MenuItem>
                            <MaterialModule.MenuItem value="alphanumeric" className="!text-[12px]">Alphanumeric</MaterialModule.MenuItem>
                            <MaterialModule.MenuItem value="number" className="!text-[12px]">Number</MaterialModule.MenuItem>
                          </MaterialModule.Select>
                        </MaterialModule.FormControl>
                        {empCodeType === "pattern" && (
                          <>
                            <MaterialModule.TextField
                              fullWidth
                              label="Prefix"
                              className="!text-[12px]"
                              value={empPrefix}
                              onChange={(e) =>
                                setEmpPrefix(e.target.value)
                              }
                              placeholder="EMP"
                            />
                            <MaterialModule.TextField
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
                          <MaterialModule.TextField
                            fullWidth
                            type="number"
                            label="Number Of Digits"
                            className="!text-[12px]"
                            value={empDigitCount}
                            onChange={(e) =>
                              setEmpDigitCount(e.target.value)
                            }
                            helperText="Random mixed employee ID"
                          />
                        )}
                        {empCodeType === "number" && (
                          <MaterialModule.TextField
                            fullWidth
                            type="number"
                            label="Starting Number"
                            className="!text-[12px]"
                            value={empStartNumber}
                            onChange={(e) =>
                              setEmpStartNumber(e.target.value)
                            }
                          />
                        )}
                      </div>
                    }

                    <MaterialModule.Alert severity="info" className="mt-4">
                      <div className="flex flex-col gap-1">
                        {empGenerationFlow === "continue" && (
                          <>
                            <div>
                              Last Generated ID:&nbsp;
                              <strong>
                                {employeeIdConfig?.lastGeneratedId || "No Employees"}
                              </strong>
                            </div>

                            <div>
                              Next Sequence:&nbsp;
                              <strong>
                                {generateEmployeeIdPreview()}
                              </strong>
                            </div>
                          </>
                        )}

                        {empGenerationFlow === "new" && (
                          <div>
                            Generated Preview:&nbsp;
                            <strong>
                              {generateEmployeeIdPreview()}
                            </strong>
                          </div>
                        )}
                      </div>
                    </MaterialModule.Alert>
                  </>
                ) : (
                  <div className="mt-4">
                    <MaterialModule.TextField
                      fullWidth
                      label="Employee ID"
                      value={manualEmployeeId}
                      onChange={(e) =>
                        setManualEmployeeId(e.target.value)
                      }
                      placeholder="EMP001"
                      helperText="Enter unique employee ID"
                    />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="text-[12px] text-gray-500 mt-2">On saving, onboarding will begin and the employee will receive a password setup email.</div>
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!p-4 border-t !border-gray-300">
          <MaterialModule.Button
            onClick={() => setEmployeeDialogOpen(false)}
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
          >
            Cancel
          </MaterialModule.Button>
          <MaterialModule.Button
            onClick={() => handleSaveEmployee()}
            variant="contained"
            className="!bg-primary"
          >
            {isEditing ? "Update Employee" : "Add & Send Welcome Email"}
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>

      {/* Bulk Upload Dialog */}
      <MaterialModule.Dialog
        open={bulkUploadDialogOpen}
        onClose={handleCloseBulkUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b !border-gray-300">
          <div className="text-primary ml-4">Bulk Upload Employees</div>
          <MaterialModule.IconButton onClick={handleCloseBulkUploadDialog}>
            <MaterialModule.CloseOutlined />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <MaterialModule.Alert severity="info" className="mb-4">
            Download the template, fill in employee details, and upload the file.
            Backend sends invite / welcome emails to newly imported employees automatically.
          </MaterialModule.Alert>

          <div className="text-center mb-4">
            <MaterialModule.Button
              variant="outlined"
              startIcon={<MaterialModule.DownloadIcon />}
              onClick={async () => {
                try {
                  await employeeService.downloadBulkUploadTemplate();
                } catch (error: any) {
                  showSnackbar(error.message || "Failed to download template.", "error");
                }
              }}
            >
              Download Template
            </MaterialModule.Button>
          </div>
          <div className="flex gap-2 items-center mb-4">
            <MaterialModule.FormControlLabel
              control={
                <MaterialModule.Checkbox
                  checked={excelHasEmployeeIdColumn}
                  onChange={(e) =>
                    setExcelHasEmployeeIdColumn(e.target.checked)
                  }
                  disabled={!employeeIdConfig?.configured}
                />
              }
              label="Excel already contains Employee ID column"
            />
            <div className="text-[12px] text-yellow-800">
              [ Note : {!employeeIdConfig?.configured
                ? "Employee ID generation is not configured. Your Excel file must contain an Employee ID column"
                : excelHasEmployeeIdColumn
                  ? "Employee IDs will be read from Excel"
                  : `Employee IDs will be generated automatically starting from ${employeeIdConfig?.nextSequencePreview}`} ]
            </div>
          </div>
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
              <MaterialModule.CloudUploadIcon className="text-6xl text-gray-400 mb-2" />
              <MaterialModule.Typography variant="body1" className="text-gray-600">
                {uploadFile ? uploadFile.name : "Click to select a file"}
              </MaterialModule.Typography>
              <MaterialModule.Typography variant="caption" className="text-gray-400">
                Accepted formats: CSV, XLSX &nbsp;·&nbsp; Max size: 10 MB
              </MaterialModule.Typography>
            </label>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <MaterialModule.Box className="mt-4">
              <MaterialModule.LinearProgress variant="determinate" value={uploadProgress} />
              <MaterialModule.Typography variant="caption" className="text-gray-500 mt-1">
                Uploading: {uploadProgress}%
              </MaterialModule.Typography>
            </MaterialModule.Box>
          )}

          {/* After Upload Shows: */}
          {uploadResult && (
            <div className="mt-4 space-y-4">
              {/* Upload Summary */}
              <div
                className={`border rounded-lg p-4 ${uploadResult?.failureCount && uploadResult?.failureCount > 0
                    ? "border-orange-200 bg-orange-50"
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

                  <MaterialModule.Chip
                    label={uploadResult.status || "COMPLETED"}
                    color={
                      uploadResult?.failureCount && uploadResult?.failureCount > 0 ? "warning" : "success"
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
                    <div className="text-xs text-gray-500">Success</div>
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
                    Job ID: <span className="font-mono">{uploadResult.jobId}</span>
                  </div>
                )}
              </div>

              {/* Generated Employee IDs */}
              {uploadResult.generatedEmployeeIds && uploadResult.generatedEmployeeIds?.length > 0 && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <MaterialModule.CheckCircleOutlineIcon
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
                        <MaterialModule.Chip
                          key={`${id}-${index}`}
                          label={id}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Welcome Email Failures */}
              {uploadResult.welcomeEmailFailures && uploadResult.welcomeEmailFailures?.length > 0 && (
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
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {uploadResult.errors && uploadResult.errors?.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="font-semibold text-red-700 mb-3">
                    Validation Errors
                  </div>

                  <div className="max-h-72 overflow-auto space-y-3">
                    {uploadResult.errors.map(
                      (err: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white border border-red-100 rounded-lg p-3"
                        >
                          <div className="font-medium text-red-700">
                            Row {err.rowNumber}
                          </div>

                          {(err.branchName || err.branchCode) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {err.branchName}
                              {err.branchCode &&
                                ` (${err.branchCode})`}
                            </div>
                          )}

                          <ul className="list-disc ml-5 mt-2 text-sm text-red-600">
                            {err.errors?.map(
                              (message: string, idx: number) => (
                                <li key={idx}>{message}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )
                    )}
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
                      <MaterialModule.Chip
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
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!p-4 border-t !border-gray-300">
          <MaterialModule.Button
            onClick={handleCloseBulkUploadDialog}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Close
          </MaterialModule.Button>
          <MaterialModule.Button
            onClick={handleBulkUpload}
            variant="contained"
            disabled={!uploadFile}
            className={!uploadFile ? "!bg-gray-300" : "!bg-primary"}
          >
            Upload & Send Emails
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
}
