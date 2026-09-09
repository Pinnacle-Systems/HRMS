import { Fragment, useState, useEffect, useMemo } from "react";
import {
  employeeService,
  normalizeEmployeePageResponse,
  normalizeBulkUploadResponse,
  type EmployeeListQuery,
  type BulkUploadResponse,
  type EmployeeSummaryResponse,
  type EmployeeStatsSummary,
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
import "dayjs/locale/en-gb";
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
import {
  ArrowDownward,
  ArrowUpward,
  CheckCircleOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EditOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
  HowToRegOutlined,
  MoreVertOutlined,
  NoAccountsOutlined,
  VisibilityOutlined
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { useAuth } from "../../auth/authContext.ts";
import { masterSx, resignationTypes } from "./const.ts";
import DataState from "../../components/DataState.tsx";
import { dialogsx } from "../../const.ts";

// Helper function to check if an employee is inactive
const isEmployeeInactive = (employee: Employee): boolean => {
  return employee.isActive === false ||
    employee.employeeStatus === "INACTIVE" ||
    employee.employeeStatus === "RESIGNED" ||
    employee.employeeStatus === "TERMINATED" ||
    employee.employeeStatus === "INACTIVE" ||
    !!employee.deactivatedAt;
};

export default function EmployeeManagement() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();
  const { session } = useAuth();
  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStatsSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState<Array<{ field: string, order: 'ASC' | 'DESC' }>>([
    { field: 'employeeId', order: 'ASC' }
  ]);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterConfig | null>(null);
  const [employeeView, setEmployeeView] = useState<"active" | "inactive" | "all">("active");

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
  const [employeeTypes, setEmployeeTypes] = useState<Category[]>([]);
  const [filterEmployees, setFilterEmployees] = useState<EmployeeSummaryResponse[]>([]);
  const [employeeGroups, setEmployeeGroups] = useState<Category[]>([]);
  const [shiftCommonTemplates, setShiftCommonTemplates] = useState<Category[]>([]);

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
  const [proposedRelievedDate, setProposedRelievedDate] = useState("");
  const [systemGeneratedRelievedDate, setSystemGeneratedRelievedDate] = useState("");
  const [resignationType, setResignationType] = useState("");
  const [excelHasEmployeeIdColumn, setExcelHasEmployeeIdColumn] =
    useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [eligibleForRehire, setEligibleForRehire] = useState(true);
  const [resignedDialogOpen, setResignedDialogOpen] = useState(false);
  const [resignedEmployees, _setResignedEmployees] = useState<Employee[]>([]);
  const [resignedSearch, setResignedSearch] = useState("");
  const [expandedResignedEmployeeId, setExpandedResignedEmployeeId] = useState<string | null>(null);
  const [resignedEmployeeDetails, setResignedEmployeeDetails] = useState<Record<string, any>>({});
  const [resignedDetailsLoading, setResignedDetailsLoading] = useState<string | null>(null);

  const filterFields = useMemo(
    () =>
      getEmployeeFilterFields(
        departments,
        designations,
        branches,
        empStatus,
        employeeTypes,
        filterEmployees,
      ),
    [departments, designations, branches, empStatus, employeeTypes, filterEmployees],
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
      setEmpCodeType(config.formatType.toLowerCase());
      setEmpPrefix(config.prefix || "EMP");
      setZero(config.paddingWidth || 0);
      setEmpStartNumber(String(config.startingNumber || 1));
      setEmpDigitCount(String(config.numberOfDigits || 4));
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
    } catch {
      setNextIdPreview("Error generating preview");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (hasManualEmpId || !employeeDialogOpen) return;
    if (empGenerationFlow === "continue") {
      setNextIdPreview(employeeIdConfig?.nextSequencePreview || "");
      return;
    }
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

  const handleApplyFilters = (filters: FilterConfig) => {
    setActiveFilters(filters);
    setPage(0);
  };

  const removeFilter = (ruleId: string) => {
    if (activeFilters) {
      const newRules = activeFilters.rules.filter((rule) => rule.id !== ruleId);
      if (newRules.length > 0) {
        const newFilters = { ...activeFilters, rules: newRules };
        setActiveFilters(newFilters);
      } else {
        clearAllFilters();
      }
      setPage(0);
    }
  };

  const clearAllFilters = () => {
    setActiveFilters(null);
    setPage(0);
  };

  const getActiveFilterCount = (): number => {
    return activeFilters?.rules.length || 0;
  };

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
        return [{ field, order: 'ASC' }];
      }
      return prev;
    });
    setPage(0);
  };

  const getEmployees = async () => {
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
      if (employeeView === "active") {
        params.includeInactive = false;
      } else if (employeeView === "inactive") {
        params.includeInactive = true;
        params.size = 100
      } else {
        params.includeInactive = true;
      }

      const response = await employeeService.getEmployees(params);
      const employeePage = normalizeEmployeePageResponse(response);
      const employeeData = employeePage.content as Employee[];

      let visibleEmployees = employeeData;

      if (employeeView === "inactive") {
        visibleEmployees = employeeData.filter((employee) =>
          isEmployeeInactive(employee)
        );
      } else if (employeeView === "active") {
        visibleEmployees = employeeData.filter((employee) =>
          !isEmployeeInactive(employee)
        );
      }

      setTotal(employeePage.totalElements);

      // Apply client-side filters for unsupported filters
      if (
        activeFilters &&
        activeFilters.rules.length > 0 &&
        !isEmployeeServerSupportedFilter(activeFilters)
      ) {
        visibleEmployees = applyFiltersToData(
          visibleEmployees,
          activeFilters,
          EMPLOYEE_FIELD_MAP,
        );
      }

      setEmployees(visibleEmployees);

      try {
        const summaryResponse = await employeeService.getSummary();
        setEmployeeStats(summaryResponse.data);
      } catch (error) {
        console.error("Failed to load employee statistics:", error);
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load employees", "error");
    } finally {
      hideSpinner();
    }
  };

  const getMasterData = async () => {
    try {
      const deptRes: any = await departmentService.getActiveDepartments();
      setDepartments(deptRes.data.content || deptRes.data || []);

      const branchRes: any = await branchService.getDropdownBranches();
      setBranches(branchRes.data.content || branchRes.data || []);

      const category: any = await categoryService.getActiveCategoryItem();

      // Designation
      const designationCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('designation')
      );
      if (designationCategory) {
        setDesignations(designationCategory.items);
      }

      // Employee Status
      const empStatusCategory = category.data.find(
        (element: any) => {
          const categoryName = element.categoryName?.toLowerCase() || '';
          return categoryName.includes('employee status') || categoryName.includes('emp status')
        }
      );
      if (empStatusCategory) {
        setEmpStatus(empStatusCategory.items);
      }

      // Employee Group
      const employeeGroupCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('employee group')
      );
      if (employeeGroupCategory) {
        setEmployeeGroups(employeeGroupCategory.items);
      }

      const employeeTypeCategory = category.data.find(
        (element: any) => {
          const categoryName = element.categoryName?.toLowerCase() || '';
          return categoryName.includes('employee type') || categoryName.includes('employment type');
        }
      );
      if (employeeTypeCategory) {
        setEmployeeTypes(employeeTypeCategory.items);
      }

      const employeeOptionsResponse = await employeeService.getEmployees({
        page: 0,
        size: 1000,
        sort: 'name,asc',
        includeInactive: true,
      });
      setFilterEmployees(normalizeEmployeePageResponse(employeeOptionsResponse).content);

      // Shift Common Template
      const shiftCommonTemplateCategory = category.data.find(
        (element: any) => element.categoryName === 'Shift Common Template'
      );
      if (shiftCommonTemplateCategory) {
        setShiftCommonTemplates(shiftCommonTemplateCategory.items);
      }

    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  useEffect(() => {
    getEmployees();
  }, [
    page,
    limit,
    searchTerm,
    activeFilters,
    employeeView,
    sortCriteria,
  ]);

  useEffect(() => {
    getMasterData();
  }, []);

  const getSortIcon = (column: string) => {
    const sortCriterion = sortCriteria.find(s => s.field === column);
    if (!sortCriterion) return null;
    const orderIcon = sortCriterion.order === "ASC" ? (
      <ArrowUpward fontSize="small" className="ml-1 !w-3" />
    ) : (
      <ArrowDownward fontSize="small" className="ml-1 !w-3" />
    );

    return (
      <span className="flex items-center">
        {orderIcon}
        {/* <span className="text-[10px] text-gray-400 ml-0.5">({sortCriterion.order})</span> */}
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

    await employeeService.updateEmployeeId(payload);
    const previewRes: any = await employeeService.previewEmployeeId(payload);
    const preview = previewRes?.data ?? previewRes;
    return preview.previewId;
  };

  const validateEmployeeIdConfig = () => {
    if (hasManualEmpId) return true;
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
      employeeGroupId: "",
      template: "",
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

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    resetForm();
    setEmployeeDialogOpen(true);
    loadEmployeeIdConfig();
  };

  const handleOpenEditDialog = async (employee: Employee) => {
    setIsEditing(true);
    const response: any = await employeeService.getEmployeeById(employee.id);
    setSelectedEmployee(response.data);

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
    const resolvedEmployeeGroup = employeeGroups.find(
      (s) => s.id === employee.employeeGroupId || s.name === employee.employeeGroup
    );
    const resolvedTemplate = shiftCommonTemplates.find(
      (s) => s.id === employee.templateId || s.name === employee.template
    );

    setFormData({
      name: employee.name,
      emailAddress: employee.emailAddress,
      joiningDate: employee.joiningDate?.split("T")[0] || "",
      branch: employee.branch || "",
      branchId: session?.branchId || resolvedBranchId,
      employeeId: employee.employeeId,
      mobileNumber: employee.mobileNumber || "",
      department: resolvedDepartment || null,
      departmentId: resolvedDepartment?.id || employee.departmentId || "",
      designation: resolvedDesignation || null,
      designationId: resolvedDesignation?.id || employee.designationId || "",
      employeeStatus: resolvedEmployeeStatus || null,
      employeeStatusId: resolvedEmployeeStatus?.id || employee.employeeStatusId || "",
      employeeGroup: resolvedEmployeeGroup || null,
      employeeGroupId: resolvedEmployeeGroup?.id || employee.employeeGroupId || "",
      template: resolvedTemplate || null,
      templateId: resolvedTemplate?.id || employee.templateId || "",
    });
    setEmployeeDialogOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!validateEmployeeIdConfig()) return;
    showSpinner();
    try {
      if (isEditing) {
        const empId = selectedEmployee!.id;
        await employeeService.updateAdminInfo(empId, {
          joiningDate: formData.joiningDate,
          branchId: formData.branchId || selectedEmployee?.branchId,
          departmentId: formData.departmentId || selectedEmployee?.departmentId,
          designationId: formData.designationId || selectedEmployee?.designationId,
          employeeStatusId: formData.employeeStatusId || selectedEmployee?.employeeStatusId,
          employeeGroupId: formData.employeeGroupId || selectedEmployee?.employeeGroupId,
          templateId: formData.templateId || selectedEmployee?.templateId,
          gradeId: selectedEmployee?.gradeId,
          empTypeId: selectedEmployee?.empTypeId,
          managerId: selectedEmployee?.managerId,
          bandId: selectedEmployee?.bandId,
          confirmationDate: selectedEmployee?.confirmationDate,
          relievedDate: selectedEmployee?.relievedDate,
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
          adminRemarks: selectedEmployee?.adminRemarks,
          idCardNo: selectedEmployee?.idCardNo,
          midNo: selectedEmployee?.midNo,
          oldIdNo: selectedEmployee?.oldIdNo,
        });
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
          employeeGroupId: formData.employeeGroupId,
          template: formData.template,
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

  const getResignedField = (employee: Employee, ...fields: string[]): any => {
    for (const field of fields) {
      const value = (employee as unknown as Record<string, unknown>)[field];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "-";
  };

  const toggleResignedEmployeeDetails = async (employee: Employee) => {
    const employeeId = employee.id;
    if (expandedResignedEmployeeId === employeeId) {
      setExpandedResignedEmployeeId(null);
      return;
    }

    setExpandedResignedEmployeeId(employeeId);
    if (resignedEmployeeDetails[employeeId]) return;

    setResignedDetailsLoading(employeeId);
    try {
      const response: any = await employeeService.getEmployeeById(employeeId);
      setResignedEmployeeDetails((current) => ({
        ...current,
        [employeeId]: response?.data ?? response,
      }));
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load employee details", "error");
    } finally {
      setResignedDetailsLoading(null);
    }
  };

  const filteredResignedEmployees = resignedEmployees.filter((employee) => {
    const query = resignedSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      getResignedField(employee, "employeeId", "employeeCode", "code"),
      getResignedField(employee, "panNumber", "panNo", "pan"),
      getResignedField(employee, "universalAccountNumber", "uanNo", "uanNumber", "uan"),
      getResignedField(employee, "aadhaarNumber", "aadharNumber", "aadhaarNo", "aadharNo"),
      getResignedField(employee, "pfNumber"),
    ].some((value) => String(value).toLowerCase().includes(query));
  });

  const handleDeactivateEmployee = async (
    id: string,
    name: string,
    remarks: string,
    eligibleForRehire: boolean,
    details: Record<string, string | boolean | undefined> = {},
  ) => {
    showConfirmDialog({
      title: "Deactivate Employee",
      message: `Deactivate "${name}"? The employee will be marked inactive. All history (leave, payroll, onboarding) is retained and the employee can be reactivated later.`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        const payload = {
          remarks,
          eligibleForRehire: Boolean(eligibleForRehire),
          rehireRefferedBy: session?.user.email || "System",
          rehireRefferedDateTime: new Date().toISOString(),
          ...details,
        }
        try {
          await employeeService.deactivateEmployee(id, payload);
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
        await employeeService.downloadEmployeeByIdExport(
          selectedEmployeeForExport,
          format,
        );
        showSnackbar(`Employee exported as ${format.toUpperCase()}`, "success");
      } else {
        const sortParams = sortCriteria.map(s => `${s.field},${s.order.toLowerCase()}`);

        const params: any = {
          search: searchTerm || undefined,
          sort: sortParams,
          includeInactive: employeeView !== "active" ? true : undefined,
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
        proposedRelievedDate,
        systemGeneratedRelievedDate,
        resignationType,
        eligibleForRehire,
        joiningDate: formData.joiningDate,
        branchId: formData.branchId || selectedEmployee?.branchId || session?.branchId,
        departmentId: formData.departmentId || selectedEmployee?.departmentId,
        designationId: formData.designationId || selectedEmployee?.designationId,
        employeeStatusId: formData.employeeStatusId || selectedEmployee?.employeeStatusId,
        employeeGroupId: formData.employeeGroupId || selectedEmployee?.employeeGroupId,
        template: formData.template || selectedEmployee?.template,
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
      handleDeactivateEmployee(
        emp.id,
        emp.name,
        remarks,
        eligibleForRehire,
        {
          resignationType,
          proposedRelievedDate,
          systemGeneratedRelievedDate,
          relievedDate: value,
        },
      );
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
            mb: 1,
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
          {activeFilters.rules.map((rule) => {
            const field = filterFields.find((f) => f.id === rule.field);

            const getDisplayValue = () => {
              if (!field) return rule.value;
              if (field.type === 'select' || field.type === 'multiSelect') {
                const option = field.options?.find((o) => o.value === rule.value);
                return option?.label ?? rule.value;
              }
              if (field.type === 'boolean') {
                if (rule.value === true || rule.value === 'true' || rule.value === 'yes') return 'Yes';
                if (rule.value === false || rule.value === 'false' || rule.value === 'no') return 'No';
                return rule.value;
              }
              if (field.type === 'date' && rule.value) {
                return dayjs(rule.value).format('DD/MM/YYYY');
              }
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

      {/* Workforce Summary */}
      {(() => {
        const activeCount = employeeStats?.totalActiveEmployees ?? employees.filter((employee) => !isEmployeeInactive(employee)).length;
        const inactiveCount = employeeStats?.totalInactiveEmployees ?? employees.filter(isEmployeeInactive).length;
        const activeRate = employeeStats?.totalEmployees
          ? Math.round((activeCount / employeeStats.totalEmployees) * 100)
          : total ? Math.round((activeCount / total) * 100) : 0;
        const totalEmployees = employeeStats?.totalEmployees ?? total;
        // const onboardingQueue = employeeStats?.onboardingQueue ?? employees.filter(
        //   (employee) => employee.employeeStatus === "ONBOARDING",
        // ).length;
        const onboardingInProgress = employeeStats?.onboardingInProgress ?? employees.filter(
          (employee) => employee.employeeStatus === "ONBOARDING_IN_PROGRESS",
        ).length;
        const onboardingCompleted = employeeStats?.onboardingCompleted ?? employees.filter(
          (employee) => employee.employeeStatus === "ONBOARDING_COMPLETED",
        ).length;

        const summaryCards = [
          {
            label: "Total Workforce",
            value: totalEmployees,
            detail: `${employees.length} shown on this page`,
            icon: <CheckCircleOutlined />,
            tone: "text-blue-700 bg-blue-50",
            bar: "bg-blue-600",
            onClick: () => {
              setEmployeeView("all");
              setPage(0);
            },
          },
          {
            label: "Active Employees",
            value: activeCount,
            detail: `${activeRate}% of total workforce`,
            icon: <HowToRegOutlined />,
            tone: "text-emerald-700 bg-emerald-50",
            bar: "bg-emerald-500",
            onClick: () => {
              setEmployeeView("active");
              setPage(0);
            },
          },
          {
            label: "Inactive Employees",
            value: inactiveCount,
            detail: employeeView !== "active" ? "Included in this view" : "Select Inactive to view",
            icon: <NoAccountsOutlined />,
            tone: "text-rose-700 bg-rose-50",
            bar: "bg-rose-500",
            onClick: () => {
              setEmployeeView("inactive");
              setPage(0);
            },
          },
          // {
          //   label: "Onboarding Queue",
          //   value: onboardingQueue,
          //   detail: "Awaiting onboarding start",
          //   icon: <ArrowUpward />,
          //   tone: "text-amber-700 bg-amber-50",
          //   bar: "bg-amber-500",
          // },
          {
            label: "Onboarding InProgress",
            value: onboardingInProgress,
            detail: "Currently in onboarding process",
            icon: <ArrowUpward />,
            tone: "text-indigo-700 bg-indigo-50",
            bar: "bg-indigo-500",
            onClick: () => {
              navigate("/settings/employee/onboarding-process?tab=assign&status=inprogress");
            },
          },
          {
            label: "Onboarding Completed",
            value: onboardingCompleted,
            detail: "Successfully onboarded",
            icon: <ArrowUpward />,
            tone: "text-teal-700 bg-teal-50",
            bar: "bg-teal-500",
            onClick: () => {
              navigate("/settings/employee/onboarding-process?tab=assign&status=completed");
            },
          },
        ];

        return (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3 text-[12px]">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-xl border px-4 py-2 shadow-sm transition-shadow cursor-pointer"
                onClick={card.onClick}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-500 whitespace-nowrap">{card.label}</div>
                    <div className="text-xl font-semibold tracking-tight text-gray-900">
                      {card.value}
                    </div>
                  </div>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                    {card.icon}
                  </div>
                </div>
                <div className="text-[10px] truncate text-gray-500" title={card.detail}>
                  {card.detail}
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">
                  <div
                    className={`h-full ${card.bar}`}
                    style={{ width: `${total ? Math.min((card.value / total) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TextField
          variant="outlined"
          placeholder="Search by name, email, firstName, lastName, mobileNumber or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-[240px] flex-1"
          sx={{ minWidth: 240 }}
        />
        <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-gray-300">
          {(["active", "inactive", "all"] as const).map((view) => (
            <Button
              key={view}
              variant={employeeView === view ? "contained" : "text"}
              onClick={() => {
                setEmployeeView(view);
                setPage(0);
              }}
              className={employeeView === view ? "!bg-primary !text-white" : "!text-gray-600"}
              sx={{ borderRadius: 0, minWidth: 68, textTransform: "capitalize", whiteSpace: "nowrap" }}
            >
              {view === "active" ? "Active" : view === "inactive" ? "Inactive" : "All"}
            </Button>
          ))}
        </div>
        <Button
          variant="outlined"
          startIcon={<FilterAltOutlinedIcon />}
          onClick={() => setFilterOpen(true)}
          sx={{ position: "relative", flexShrink: 0 }}
        >
          <div>Filters</div>
          {getActiveFilterCount() > 0 && (
            <div className="bg-blue-700 text-white font-bold ml-3 rounded-full w-[60px] h-5">
              {getActiveFilterCount()}
            </div>
          )}
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={(e) => openExportMenu(e)}
          sx={{ flexShrink: 0 }}
        >
          Export
        </Button>

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
        className={`${activeFilters && activeFilters.rules.length > 0 ? "h-[calc(100vh-385px)]" : "h-[calc(100vh-330px)]"} overflow-auto border border-gray-200 !bg-white-50`}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                sx={{
                  ...stickyHeaderLeftSx,
                  minWidth: "70px",
                }}
              >
                <div className="flex items-center gap-1">
                  S No
                </div>
              </TableCell>
              <TableCell
                className="nth-c !font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("employeeId")}
              >
                <div className="flex items-center gap-1">
                  Employee ID
                  {getSortIcon("employeeId")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("employeeGroup")}
              >
                <div className="flex items-center gap-1">
                  Employee Group
                  {getSortIcon("employeeGroup")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("template")}
              >
                <div className="flex items-center gap-1">
                  Common Template
                  {getSortIcon("template")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Employee Name
                  {getSortIcon("name")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("emailAddress")}
              >
                <div className="flex items-center gap-1">
                  Employee Email
                  {getSortIcon("emailAddress")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("mobileNumber")}
              >
                <div className="flex items-center gap-1">
                  Mobile Number
                  {getSortIcon("mobileNumber")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("branch")}
              >
                <div className="flex items-center gap-1">
                  Branch
                  {getSortIcon("branch")}

                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("department")}
              >
                <div className="flex items-center gap-1">
                  Department
                  {getSortIcon("department")}

                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("designation")}
              >
                <div className="flex items-center gap-1">
                  Designation
                  {getSortIcon("designation")}

                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("joiningDate")}
              >
                <div className="flex items-center gap-1">
                  Joining Date
                  {getSortIcon("joiningDate")}
                </div>
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() => toggleSort("employeeStatus")}
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon("employeeStatus")}
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
                  {employee.employeeGroup}
                </TableCell>
                <TableCell className="font-medium">
                  {employee.template}
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
                  {employee.branch || "-"}
                </TableCell>
                <TableCell>
                  {employee.department || "-"}
                </TableCell>
                <TableCell>
                  {employee.designation || "-"}
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
                    {isEmployeeInactive(employee) ? (
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
                            const proposed = dayjs().format("YYYY-MM-DD");
                            const generated = dayjs(proposed)
                              .add(Number(employee.noticePeriod || 0), "day")
                              .format("YYYY-MM-DD");
                            setRelievingDate(generated);
                            setProposedRelievedDate(proposed);
                            setSystemGeneratedRelievedDate(generated);
                            setResignationType("");
                            setAdminRemarks("");
                            setEligibleForRehire(true);
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
                <TableCell colSpan={13} className="text-center py-8 text-gray-500">
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
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DatePicker
                label="Date of Joining"
                format="DD/MM/YYYY"
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
                    required: true
                  },
                  openPickerButton: {
                    color: "primary",
                    edge: "end",
                  },
                }}
              />
            </LocalizationProvider>
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
              disabled={!formData.joiningDate}
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

            {!isEditing && (
              <>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileNumber: e.target.value })
                  }
                />

              </>
            )}
            <Autocomplete
              fullWidth
              options={employeeGroups}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.employeeGroup || ""}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  employeeGroup: newValue,
                  employeeGroupId: newValue?.id || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Employee Group"
                  variant="outlined"
                  className="!text-[12px]"
                  required={true}
                />
              )}
              sx={masterSx}
            />
            <Autocomplete
              fullWidth
              options={shiftCommonTemplates}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.template || ""}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  template: newValue,
                  templateId: newValue?.id || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Shift Common Template"
                  variant="outlined"
                  className="!text-[12px]"
                  required={true}
                />
              )}
              sx={masterSx}
            />
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
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              label="Proposed Relieving Date"
              format="DD/MM/YYYY"
              value={proposedRelievedDate ? dayjs(proposedRelievedDate) : null}
              onChange={(newValue) =>
                (() => {
                  const proposed = newValue ? dayjs(newValue).format("YYYY-MM-DD") : "";
                  const generated = proposed
                    ? dayjs(proposed).add(Number(relievingDialogEmployee?.noticePeriod || 0), "day").format("YYYY-MM-DD")
                    : "";
                  setProposedRelievedDate(proposed);
                  setSystemGeneratedRelievedDate(generated);
                  setRelievingDate(generated);
                })()
              }
            />
            <TextField
              label="Notice Period (days)"
              value={relievingDialogEmployee?.noticePeriod ?? 0}
              disabled
              className="!mt-4"
            />
            <TextField
              label="System Generated Relieving Date"
              value={systemGeneratedRelievedDate}
              disabled
              className="!mt-4"
            />
            <DatePicker
              label="Relieved Date"
              format="DD/MM/YYYY"
              value={relievingDate ? dayjs(relievingDate) : null}
              onChange={(newValue) => setRelievingDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
              slotProps={{ textField: { className: "!mt-4" } }}
            />
          </LocalizationProvider>
          <FormControl fullWidth className="!mt-4">
            <InputLabel>Resignation Type</InputLabel>
            <Select value={resignationType} label="Resignation Type" onChange={(event) => setResignationType(event.target.value)}>
              {resignationTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Reason for Deactivate"
            value={adminRemarks}
            required
            multiline
            rows={3}
            onChange={(e) => setAdminRemarks(e.target.value)}
            className="!mt-5 !text-[12px]"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={eligibleForRehire}
                onChange={(e) => setEligibleForRehire(e.target.checked)}
              />
            }
            label="Eligible for rehire"
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
                setProposedRelievedDate("");
                setSystemGeneratedRelievedDate("");
                setResignationType("");
                setAdminRemarks("");
                setEligibleForRehire(true);
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

      <Dialog
        open={resignedDialogOpen}
        onClose={() => setResignedDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-gray-800 ml-4 text-[12px] font-medium">
            Resigned Employees
          </div>
          <IconButton onClick={() => setResignedDialogOpen(false)}>
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <TextField
            fullWidth
            label="Search resigned employees"
            placeholder="Search by PAN, Aadhaar or Employee ID"
            value={resignedSearch}
            onChange={(event) => setResignedSearch(event.target.value)}
            className="!mb-4"
          />
          <TableContainer className="border border-gray-200 bg-white-50 rounded-md">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>S No</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Deactivate Reason</TableCell>
                  <TableCell>Admin Remarks</TableCell>
                  <TableCell>Relieved Date</TableCell>
                  <TableCell>Eligible to Rehire</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResignedEmployees.map((employee, index) => (
                  <Fragment key={employee.id || employee.employeeId}>
                    <TableRow sx={getRowColor(index)}>
                      <TableCell>
                        <IconButton
                          size="small"
                          aria-label={expandedResignedEmployeeId === employee.id ? "Collapse employee details" : "Expand employee details"}
                          onClick={() => toggleResignedEmployeeDetails(employee)}
                        >
                          {expandedResignedEmployeeId === employee.id ? <ExpandLessOutlined className="!text-gray-800" /> : <ExpandMoreOutlined className="!text-gray-800" />}
                        </IconButton>
                        {index + 1}
                      </TableCell>
                      <TableCell><div className="py-2">{employee.name || "-"}</div></TableCell>
                      <TableCell>
                        {getResignedField(employee, "deactivationReason", "deactivatedReason", "reason", "remarks")}
                      </TableCell>
                      <TableCell>{getResignedField(employee, "adminRemarks", "remarks")}</TableCell>
                      <TableCell>
                        {getResignedField(employee, "relievedDate", "relievingDate", "deactivatedAt") !== "-"
                          ? formatDate(getResignedField(employee, "relievedDate", "relievingDate", "deactivatedAt"))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {getResignedField(employee, "eligibleForRehire", "eligibleToRehire") === "-"
                          ? "-"
                          : getResignedField(employee, "eligibleForRehire", "eligibleToRehire")
                            ? "Yes"
                            : "No"}
                      </TableCell>
                    </TableRow>
                    {expandedResignedEmployeeId === employee.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="!bg-primary-50 border border-gray-200">
                          {resignedDetailsLoading === employee.id ? (
                            <div className="py-4 text-center text-gray-500">Loading employee details...</div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 p-3 text-[12px] md:grid-cols-3">
                              {[
                                ["Employee ID", "employeeId"],
                                ["Email", "emailAddress"],
                                ["Mobile", "mobileNumber"],
                                ["Branch", "branch"],
                                ["Department", "department"],
                                ["Designation", "designation"],
                                ["Date of Birth", "dateOfBirth"],
                                ["Joining Date", "joiningDate"],
                                ["Relieved Date", "relievedDate"],
                                ["PAN", "panNumber"],
                                ["Aadhaar", "aadhaarNumber"],
                                ["UAN", "universalAccountNumber"],
                                ["PF Number", "pfNumber"],
                                ["Deactivated At", "deactivatedAt"],
                                ["Deactivation Remarks", "deactivationRemarks"],
                                ["Eligible to Rehire", "eligibleForRehire"],
                              ].map(([label, field]) => {
                                const value = getResignedField(resignedEmployeeDetails[employee.id] || employee, field);
                                return (
                                  <div key={field}>
                                    <div className="font-medium text-gray-500">{label}</div>
                                    <div className="mt-1 text-gray-800">
                                      {field.toLowerCase().includes("date") || field === "deactivatedAt"
                                        ? value === "-" ? "-" : formatDate(value)
                                        : field === "eligibleForRehire"
                                          ? value === "-" ? "-" : value ? "Yes" : "No"
                                          : value}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
                {filteredResignedEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <div className="py-6 text-gray-800">No resigned employees found.</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
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

          {uploadResult && (
            <div className="mt-4 space-y-4">
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