import { useState, useEffect } from "react";
import MaterialModule from "../../materialModule";
import { employeeService } from "../../services/modules/employees";
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
import { getRowColor, getStickyLeftSx, getStickyRightSx } from "../const";
import { useNavigate } from "react-router-dom";
import { branchService } from "../../services/modules/branch";
import { logger } from "../../utils/logger";
import { formatDate } from "../../utils/dateFormatter";
import { stickyHeaderLeftSx, stickyHeaderRightSx} from "./const";
import type { FilterConfig, FilterField } from "../../types/filter.ts";
import { operatorLabels } from "../../types/filterOperators";

export default function EmployeeManagement() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();

  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [originalEmployees, setOriginalEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterConfig | null>(null);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // ID Generation
  // const [idGenerationMethod, setIdGenerationMethod] = useState<"auto" | "manual">("auto");
  // const [employeeIdPattern, setEmployeeIdPattern] = useState("EMP");
  // const [employeeIdSequence, setEmployeeIdSequence] = useState(1001);
  // const [manualEmployeeId, setManualEmployeeId] = useState("");

  // Form data
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Bulk upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);

  // Code Generation
  const [hasManualEmpId, setHasManualEmpId] = useState(false);
  const [empCodeMode, setEmpCodeMode] = useState("auto");
  const [empCodeType, setEmpCodeType] = useState("pattern");
  const [empGenerationFlow, setEmpGenerationFlow] = useState<"new" | "continue">("new");
  const [empPrefix, setEmpPrefix] = useState("EMP");
  const [empStartNumber, setEmpStartNumber] = useState("001");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [hasEmpIdColumn, setHasEmpIdColumn] = useState(true);
  const [empDigitCount, setEmpDigitCount] = useState("4");

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
      id: 'designation',
      label: 'Designation',
      type: 'select',
      options: designations.map(d => ({ value: d.name, label: d.name })),
    },
    {
      id: 'department',
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
      id: 'joiningDate',
      label: 'Joining Date',
      type: 'date',
    },
    {
      id: 'employeeStatus',
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

  useEffect(() => {
    if (hasEmpIdColumn) {
      setEmpCodeMode("auto");
    }
  }, [hasEmpIdColumn]);

  const generateRandomAlphaNumeric = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    let seed = length * 31 + 17;
    for (let i = 0; i < length; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const index = Math.floor((seed / 233280) * chars.length);
      result += chars.charAt(index);
    }
    return result;
  };

  const getNextEmployeeId = () => {
    if (employees.length === 0) {
      return `${empPrefix}${empStartNumber}`;
    }
    const employeeIds = employees.map((emp) => emp.employeeId).filter(Boolean);
    const lastId = employeeIds[0];
    const numericPart = lastId.replace(/\D/g, "");
    const nextNumber = String(Number(numericPart) + 1).padStart(numericPart.length, "0");
    const prefix = lastId.replace(/[0-9]/g, "");
    return `${prefix}${nextNumber}`;
  };

  // Evaluate a single filter rule
  const evaluateRule = (item: any, rule: any): boolean => {
    const fieldValue = item[rule.field];
    const ruleValue = rule.value;
    
    switch (rule.operator) {
      case 'equals':
        return String(fieldValue).toLowerCase() === String(ruleValue).toLowerCase();
      case 'notEquals':
        return String(fieldValue).toLowerCase() !== String(ruleValue).toLowerCase();
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      case 'notContains':
        return !String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(ruleValue).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(ruleValue).toLowerCase());
      case 'greaterThan':
        return new Date(fieldValue) > new Date(ruleValue);
      case 'greaterThanOrEqual':
        return new Date(fieldValue) >= new Date(ruleValue);
      case 'lessThan':
        return new Date(fieldValue) < new Date(ruleValue);
      case 'lessThanOrEqual':
        return new Date(fieldValue) <= new Date(ruleValue);
      case 'between':
        return new Date(fieldValue) >= new Date(ruleValue) && new Date(fieldValue) <= new Date(rule.value2);
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      case 'notIn':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      case 'isEmpty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'isNotEmpty':
        return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
      default:
        return true;
    }
  };

  // Apply filters to data
  const applyFiltersToData = (data: Employee[], filters: FilterConfig): Employee[] => {
    if (!filters || filters.rules.length === 0) return data;
    
    return data.filter(item => {
      const ruleResults = filters.rules.map(rule => evaluateRule(item, rule));
      
      if (filters.condition === 'AND') {
        return ruleResults.every(result => result === true);
      } else {
        return ruleResults.some(result => result === true);
      }
    });
  };

  // Handle filter application
  const handleApplyFilters = (filters: FilterConfig) => {
    setActiveFilters(filters);
    const filtered = applyFiltersToData(originalEmployees, filters);
    setFilteredEmployees(filtered);
    setEmployees(filtered);
    setTotal(filtered.length);
    setPage(0); // Reset to first page
  };

  // Remove a specific filter
  const removeFilter = (ruleId: string) => {
    if (activeFilters) {
      const newRules = activeFilters.rules.filter(rule => rule.id !== ruleId);
      if (newRules.length > 0) {
        const newFilters = { ...activeFilters, rules: newRules };
        setActiveFilters(newFilters);
        const filtered = applyFiltersToData(originalEmployees, newFilters);
        setFilteredEmployees(filtered);
        setEmployees(filtered);
        setTotal(filtered.length);
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
    setFilteredEmployees(originalEmployees);
    setEmployees(originalEmployees);
    setTotal(originalEmployees.length);
    setPage(0);
  };

  // Get active filter count
  const getActiveFilterCount = (): number => {
    return activeFilters?.rules.length || 0;
  };

  // Fetch employees
  const getEmployees = async () => {
    showSpinner();
    try {
      const params: any = { page, size: limit, sort: `${sortBy},${sortOrder}` };
      if (searchTerm) params.search = searchTerm;
      const response: any = await employeeService.getEmployees(params);
      const employeeData = response.data.content || response.data || [];
      setEmployees(employeeData);
      setOriginalEmployees(employeeData);
      setFilteredEmployees(employeeData);
      setTotal(response.data.totalElements || response.data.total ||  response.data.length || 0);
      
      // Re-apply filters if any exist
      if (activeFilters && activeFilters.rules.length > 0) {
        const filtered = applyFiltersToData(employeeData, activeFilters);
        setEmployees(filtered);
        setTotal(filtered.length);
      }
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
      const branchRes: any = await branchService.getBranches();
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
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  // Update filter fields when master data changes
  useEffect(() => {
    // This will update the filter fields options when departments/designations/branches change
    filterFields.map(field => {
      if (field.id === 'designation') {
        return { ...field, options: designations.map(d => ({ value: d.name, label: d.name })) };
      }
      if (field.id === 'department') {
        return { ...field, options: departments.map(d => ({ value: d.departmentName, label: d.departmentName })) };
      }
      if (field.id === 'branch') {
        return { ...field, options: branches.map(b => ({ value: b.branchName, label: b.branchName })) };
      }
      return field;
    });
    // Update filterFields state if needed
  }, [departments, designations, branches]);

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
    if (empGenerationFlow === "continue") {
      return getNextEmployeeId();
    }
    if (empCodeType === "pattern") {
      return `${empPrefix}${empStartNumber}`;
    }
    if (empCodeType === "alphanumeric") {
      return generateRandomAlphaNumeric(Number(empDigitCount));
    }
    return empStartNumber;
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
  };

  // Handle Add Employee
  const handleOpenAddDialog = () => {
    setIsEditing(false);
    resetForm();
    setEmployeeDialogOpen(true);
  };

  // Handle Edit Employee - Open Edit Dialog
  // const handleOpenEditDialog = (employee: Employee) => {
  //   setIsEditing(true);
  //   setSelectedEmployee(employee);
  //   console.log(employee);

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
        const employeeId = hasManualEmpId
          ? manualEmployeeId
          : generateEmployeeIdPreview();
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

  // Handle Delete Employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Delete Employee",
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteEmployee(id);
          showSnackbar("Employee deleted successfully!", "success");
          getEmployees();
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Handle Bulk Upload
  const handleBulkUpload = async () => {
    if (!uploadFile) {
      showSnackbar("Please select a file to upload", "error");
      return;
    }
    showSpinner();
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("hasEmpIdColumn", String(hasEmpIdColumn));
      if (!hasEmpIdColumn) {
        formData.append("empCodeMode", empCodeMode);
        formData.append("empCodeType", empCodeType);
        if (empCodeType === 'pattern') {
          formData.append("empPrefix", empPrefix);
        }
        if (empCodeType === 'pattern' || empCodeType === 'number') {
          formData.append("empStartNumber", empStartNumber);
        }
        if (empCodeType === 'alphanumeric') {
          formData.append("empDigitCount", empDigitCount);
        }
      }
      const response: any = await employeeService.bulkUploadEmployees(
        formData, (progress) => { setUploadProgress(progress); });
      if (response.success && response.data.errors.length == 0) {
        showSnackbar("Upload successful!", "success");
        setBulkUploadDialogOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
        getEmployees();
      } else if (response.data.errors.length > 0) {
        logger.info("Bulk upload Error", response.data.errors);
        showSnackbar(response.data.status + " Check the error in console", "error");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to upload", "error");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="font-semibold text-gray-800">
            Employee Management
          </div>
          <div className="text-gray-500 text-[12px]">
            Manage employees, send welcome emails, and track onboarding
          </div>
        </div>
        <div className="flex gap-3">
          <MaterialModule.Button
            variant="outlined"
            // startIcon={<MaterialModule.FilterListIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{ position: 'relative' }}
          >
            Filters
            {getActiveFilterCount() > 0 && (
              <MaterialModule.Chip
                label={getActiveFilterCount()}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </MaterialModule.Button>
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
        <MaterialModule.Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <MaterialModule.Typography variant="caption" color="textSecondary">
            Active filters ({activeFilters.condition}):
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
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500">Active Employees</div>
          <div className="font-bold">
            {employees.filter(e => e.employeeStatus === 'Active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500">Onboarding</div>
          <div className="font-bold">
            {employees.filter(e => e.employeeStatus === 'ONBOARDING').length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <MaterialModule.TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Employees Table */}
      <MaterialModule.TableContainer
        component={MaterialModule.Paper}
        elevation={0}
        className={`${activeFilters && activeFilters.rules.length > 0 ? 'h-[calc(100vh-400px)]' : 'h-[calc(100vh-340px)]'} overflow-auto !bg-white-50`}
      >
        <MaterialModule.Table stickyHeader className="border">
          <MaterialModule.TableHead>
            <MaterialModule.TableRow>
              <MaterialModule.TableCell className="!font-semibold text-gray-800 " sx={{
                ...stickyHeaderLeftSx,
                minWidth: "70px",
              }}>
                S No
              </MaterialModule.TableCell>
              <MaterialModule.TableCell sx={{
                position: "sticky",
                left: "70px",
                zIndex: 5,
                backgroundColor: "white",
                minWidth: "100px",
              }}
                className="!font-semibold text-gray-800 cursor-pointer"
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
                onClick={() =>
                  handleSortChange(
                    "designation",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Designation
                  {getSortIcon("designation")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "department",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Department
                  {getSortIcon("department")}
                </div>
              </MaterialModule.TableCell>
              <MaterialModule.TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange(
                    "branch",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }
              >
                <div className="flex items-center gap-1">
                  Branch
                  {getSortIcon("branch")}
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
                onClick={() =>
                  handleSortChange(
                    "employeeStatus",
                    sortOrder === "ASC" ? "DESC" : "ASC",
                  )
                }>
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon("employeeStatus")}
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
            {filteredEmployees.map((employee, index) => (
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
                 
                  {/* <MaterialModule.Chip
                    label={employee.employeeStatus || "-"}
                    color={
                      employee.employeeStatus === 'Active' ? 'success' : 'deafult'
                      // employee.employeeStatus === 'INACTIVE' ? 'default' :
                      // employee.employeeStatus === 'ONBOARDING' ? 'warning' : 'error'
                    }
                    size="small"
                  /> */}
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
                    {/* <MaterialModule.Tooltip title="Edit">
                      <MaterialModule.IconButton
                        size="small"
                        className="!mr-1"
                        onClick={() => handleOpenEditDialog(employee)}
                      >
                        <MaterialModule.EditIcon className="!w-4" sx={{ color: "#0087ff" }} />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip> */}
                    <MaterialModule.Tooltip title="Delete">
                      <MaterialModule.IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteEmployee(employee.id, employee.name)
                        }
                      >
                        <MaterialModule.DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip>
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
        {/* ... (keep your existing dialog code) ... */}
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-primary ml-4">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </div>
          <MaterialModule.IconButton onClick={() => setEmployeeDialogOpen(false)}>
            <MaterialModule.CloseOutlined />
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
                    joiningDate: newValue ? newValue.format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
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
                        <MaterialModule.MenuItem value="continue" className="!text-[12px]">Continue Last Generated ID</MaterialModule.MenuItem>
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
                                {employees?.[0]?.employeeId || "No Employees"}
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
        onClose={() => setBulkUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {/* ... (keep your existing bulk upload dialog code) ... */}
        <div className="flex items-center justify-between p-2 border-b !border-gray-300">
          <div className="text-primary ml-4">Bulk Upload Employees</div>
          <MaterialModule.IconButton onClick={() => setBulkUploadDialogOpen(false)}>
            <MaterialModule.CloseOutlined />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <MaterialModule.Alert severity="info" className="mb-4">
            Download the sample template, fill in employee details, and upload.
            Welcome emails will be sent automatically.
          </MaterialModule.Alert>
          <div className="text-center">
            <MaterialModule.Button
              variant="outlined"
              startIcon={<MaterialModule.DownloadIcon />}
            // onClick={downloadSampleTemplate}
            >
              Download Sample Template
            </MaterialModule.Button>
          </div>

          <MaterialModule.FormControlLabel
            control={
              <MaterialModule.Checkbox
                checked={hasEmpIdColumn}
                onChange={(e) =>
                  setHasEmpIdColumn(e.target.checked)
                }
                sx={{
                  "& .MuiSvgIcon-root": {
                    color: "red !important",
                  },
                }}
              />
            }
            className="text-red-500 mb-2"
            label="Excel already contains Employee ID column"
          />
          {hasEmpIdColumn && (
            <MaterialModule.Alert
              severity="info"
              className="mb-3"
            >
              Employee IDs will be
              validated from uploaded
              Excel.
            </MaterialModule.Alert>
          )}
          {!hasEmpIdColumn && (
            <div className="border rounded-lg p-4 !mb-4">
              <div className="font-semibold text-gray-800">Employee ID Generation</div>
              <div className="!mt-6">
                <MaterialModule.FormControl fullWidth className="">
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
                    <MaterialModule.MenuItem value="continue" className="!text-[12px]">Continue Last Generated ID</MaterialModule.MenuItem>
                  </MaterialModule.Select>
                </MaterialModule.FormControl>
                {empGenerationFlow == 'new' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <MaterialModule.FormControl style={{ minWidth: 200 }}>
                      <MaterialModule.InputLabel>Format Type</MaterialModule.InputLabel>
                      <MaterialModule.Select
                        value={empCodeType}
                        label="Format Type"
                        className="!text-[12px] !text-gray-800"
                        onChange={(e) =>
                          setEmpCodeType(e.target.value)
                        }
                      >
                        <MaterialModule.MenuItem value="pattern" className="!text-[12px]">Pattern</MaterialModule.MenuItem>
                        <MaterialModule.MenuItem value="alphanumeric" className="!text-[12px]">Alphanumeric</MaterialModule.MenuItem>
                        <MaterialModule.MenuItem value="number" className="!text-[12px]">Number</MaterialModule.MenuItem>
                      </MaterialModule.Select>
                    </MaterialModule.FormControl>
                    {empCodeType === "pattern" && (
                      <>
                        <MaterialModule.TextField
                          label="Prefix"
                          value={empPrefix}
                          required
                          className="!text-[12px]"
                          onChange={(e) =>
                            setEmpPrefix(e.target.value)
                          }
                        />
                        <MaterialModule.TextField
                          label="Starting Number"
                          className="!text-[12px]"
                          value={empStartNumber}
                          required
                          onChange={(e) =>
                            setEmpStartNumber(e.target.value)
                          }
                        />
                      </>
                    )}
                    {empCodeType === "alphanumeric" && (
                      <MaterialModule.TextField
                        type="number"
                        label="Number Of Digits"
                        className="!text-[12px]"
                        required
                        value={empDigitCount}
                        onChange={(e) =>
                          setEmpDigitCount(e.target.value)
                        }
                      />
                    )}
                    {empCodeType === "number" && (
                      <MaterialModule.TextField
                        type="number"
                        label="Starting Number"
                        className="!text-[12px]"
                        value={empStartNumber}
                        required
                        onChange={(e) =>
                          setEmpStartNumber(e.target.value)
                        }
                      />
                    )}
                  </div>
                )}
                <MaterialModule.Alert severity="info" className="mt-4">
                  <div className="flex flex-col gap-1">
                    {empGenerationFlow === "continue" && (
                      <>
                        <div>
                          Last Generated ID:&nbsp;
                          <strong>
                            {employees?.[0]?.employeeId || "No Employees"}
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
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <MaterialModule.CloudUploadIcon className="text-6xl text-gray-400 mb-2" />
              <MaterialModule.Typography variant="body1" className="text-gray-600">
                {uploadFile ? uploadFile.name : "Click or drag file to upload"}
              </MaterialModule.Typography>
              <MaterialModule.Typography variant="caption" className="text-gray-400">
                Supported formats: .xlsx, .xls, .csv
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
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!p-4 border-t !border-gray-300">
          <MaterialModule.Button
            onClick={() => setBulkUploadDialogOpen(false)}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
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