import { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Checkbox,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloseOutlined,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  ArrowUpward,
  ArrowDownward,
  VisibilityOutlined,
} from "@mui/icons-material";
import { employeeService } from "../../services/modules/employees";
import { departmentService } from "../../services/modules/department";
import { categoryService } from "../../services/modules/category";
import { useUI } from "../../context/Snackbar";
import { GlobalPagination } from "../../components/GlobalPagination";
import {
  // employeeStatusColors,
  // employeeStatusLabels,
  type Branches,
  type Department,
  type Designation,
  type Employee,
} from "./type";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { getRowColor } from "../const";
import { useNavigate } from "react-router-dom";
import { branchService } from "../../services/modules/branch";
import { logger } from "../../utils/logger";

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

  useEffect(() => {
    if (hasEmpIdColumn) {
      setEmpCodeMode("auto");
    }
  }, [hasEmpIdColumn]);

  const generateRandomAlphaNumeric = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
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
    const nextNumber = String(Number(numericPart) + 1).padStart(
      numericPart.length,
      "0"
    );
    const prefix = lastId.replace(/[0-9]/g, "");
    return `${prefix}${nextNumber}`;
  };

  // Fetch employees
  const getEmployees = async () => {
    showSpinner();
    try {
      const params: any = { page, size: limit, sort: `${sortBy},${sortOrder}` };
      if (searchTerm) params.search = searchTerm;
      const response: any = await employeeService.getEmployees(params);
      setEmployees(response.data.content || response.data || []);
      setTotal(response.data.totalElements || response.data.total || 0);
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

  const handleSortChange = (
    newSortBy: string,
    newSortOrder?: "ASC" | "DESC",
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || "ASC");
    setPage(0);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "ASC" ? (
      <ArrowUpward fontSize="small" className="ml-1" />
    ) : (
      <ArrowDownward fontSize="small" className="ml-1" />
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
  const handleOpenEditDialog = (employee: Employee) => {
    setIsEditing(true);    
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      emailAddress: employee.emailAddress,
      joiningDate: employee.joiningDate?.split("T")[0] || "",
      branch: employee.branch || "",
      branchId: employee.branchId,
      employeeId: employee.employeeId,
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      department: employee.department,
      designation: employee.designation,
      mobileNumber: employee.mobileNumber || "",
    });
    setEmployeeDialogOpen(true);
  };

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
        const payload = {
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
          branch: formData.branch,
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
        empCodeType == 'pattern' ? formData.append("empPrefix", empPrefix) : '';
        (empCodeType == 'pattern' || empCodeType == 'number') ? formData.append("empStartNumber", empStartNumber) : '';
        empCodeType == 'alphanumeric' ? formData.append("empDigitCount", empDigitCount) : '';
      }
      const response: any = await employeeService.bulkUploadEmployees(
        formData, (progress) => { setUploadProgress(progress); },);
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

  // Resend Welcome Email
  // const handleResendWelcomeEmail = async (employeeId: string, email: string) => {
  //   showConfirmDialog({
  //     title: "Resend Welcome Email",
  //     message: `Are you sure you want to resend the welcome email to ${email}?`,
  //     confirmText: "Resend",
  //     cancelText: "Cancel",
  //     onConfirm: async () => {
  //       showSpinner();
  //       try {
  //         await employeeService.resendWelcomeEmail(employeeId);
  //         showSnackbar("Welcome email resent successfully!", "success");
  //         getEmployees();
  //       } catch (error: any) {
  //         showSnackbar(error.message || "Failed to resend email", "error");
  //       } finally {
  //         hideSpinner();
  //       }
  //     },
  //   });
  // };

  // Download Sample Template
  // const downloadSampleTemplate = () => {
  //   employeeService.downloadSampleTemplate();
  // };

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
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-[12px]">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500">Total Employees</div>
          <div className="font-bold">{total}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
          <div className="text-gray-500">Pending Onboarding</div>
          <div className="font-bold">0</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500">Active Employees</div>
          <div className="font-bold">0</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <div className="text-gray-500">Onboarding</div>
          <div className="font-bold">0</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Employees Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        className="h-[calc(100vh-340px)] overflow-auto !bg-white-50"
      >
        <Table stickyHeader className="border">
          <TableHead>
            <TableRow>
              <TableCell className="!font-semibold text-gray-800 ">
                S No
              </TableCell>
              <TableCell
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
              </TableCell>
              <TableCell
                className="!font-semibold text-gray-800 cursor-pointer"
                onClick={() =>
                  handleSortChange("name", sortOrder === "ASC" ? "DESC" : "ASC")
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
              </TableCell>
              <TableCell
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
              </TableCell>
              <TableCell
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
              </TableCell>
              <TableCell
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
              </TableCell>
              <TableCell
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
              </TableCell>
              <TableCell
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
              </TableCell>
              {/* <TableCell className="!font-semibold text-gray-800 ">
                Status
              </TableCell> */}
              <TableCell className="!font-semibold text-gray-800 text-center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee, index) => (
              <TableRow key={employee.id} hover sx={getRowColor(index)}>
                <TableCell>{page * limit + index + 1}</TableCell>
                <TableCell>{employee.employeeId}</TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.emailAddress}</TableCell>
                <TableCell>{employee.mobileNumber || "-"}</TableCell>
                <TableCell>{employee.designation || "-"}</TableCell>
                <TableCell>{employee.department || "-"}</TableCell>
                <TableCell>{employee.branch || "-"}</TableCell>
                <TableCell>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "-"}</TableCell>
                {/* <TableCell>
                  <Chip
                    label={employee.status === "ACTIVE" ? "Active" : "Inactive"}
                    color={employee.status === "ACTIVE" ? "success" : "default"}
                    size="small"
                  />
                </TableCell> */}
                <TableCell className="text-center">
                  <div className="flex">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        className="!mr-1"
                        onClick={() => navigate(`/employees/${employee.id}`)}
                      >
                        <VisibilityOutlined
                          className="!w-4"
                          sx={{ color: "var(--color-primary)" }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        className="!mr-1"
                        onClick={() => handleOpenEditDialog(employee)}
                      >
                        <EditIcon className="!w-4" sx={{ color: "#0087ff" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteEmployee(employee.id, employee.name)
                        }
                      >
                        <DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                  {/* {!employee.isWelcomeEmailSent && (
                    <Tooltip title="Resend Welcome Email">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleResendWelcomeEmail(
                            employee.id,
                            employee.emailAddress,
                          )
                        }
                      >
                        <EmailIcon className="!w-4" sx={{ color: "#f59e0b" }} />
                      </IconButton>
                    </Tooltip>
                  )} */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-200">
            No employees found
          </div>
        )}
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

      {/* Add/Edit Employee Dialog */}
      <Dialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-primary ml-4">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </div>
          <IconButton onClick={() => setEmployeeDialogOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
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
                    // required: required,
                  },
                }}
              />
            </LocalizationProvider>
            <FormControl fullWidth>
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
            </FormControl>
            <FormControl fullWidth>
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
            </FormControl>
            <FormControl fullWidth>
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
                {branches.map((br) => (
                  <MenuItem
                    key={br.id}
                    value={br.branchName}
                    className="!text-[12px]"
                  >
                    {br.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({ ...formData, mobileNumber: e.target.value })
              }
            />
            {isEditing && (
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                disabled
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
                  />
                }
                label="Enter Employee ID Manually"
                className="my-2"
              />

              <div className="md:col-span-2 border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold text-gray-800">
                  Employee ID Configuration
                </div>
                {/* AUTO GENERATION */}
                {!hasManualEmpId ? (
                  <>
                    <FormControl fullWidth className="!mt-6">
                      <InputLabel>Generation Flow</InputLabel>
                      <Select
                        value={empGenerationFlow}
                        label="Generation Flow"
                        className="!text-[12px]"
                        onChange={(e) =>
                          setEmpGenerationFlow(
                            e.target.value as "new" | "continue"
                          )
                        }
                      >
                        <MenuItem value="new" className="!text-[12px]">Generate With New Pattern</MenuItem>
                        <MenuItem value="continue" className="!text-[12px]">Continue Last Generated ID</MenuItem>
                      </Select>
                    </FormControl>

                    {empGenerationFlow === "new" &&
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <FormControl fullWidth>
                          <InputLabel>Format Type</InputLabel>
                          <Select
                            value={empCodeType}
                            label="Format Type"
                            className="!text-[12px]"
                            onChange={(e) => setEmpCodeType(e.target.value)}
                          >
                            <MenuItem value="pattern" className="!text-[12px]">Pattern</MenuItem>
                            <MenuItem value="alphanumeric" className="!text-[12px]">Alphanumeric</MenuItem>
                            <MenuItem value="number" className="!text-[12px]">Number</MenuItem>
                          </Select>
                        </FormControl>
                        {empCodeType === "pattern" && (
                          <>
                            <TextField
                              fullWidth
                              label="Prefix"
                              className="!text-[12px]"
                              value={empPrefix}
                              onChange={(e) =>
                                setEmpPrefix(e.target.value)
                              }
                              placeholder="EMP"
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
                            onChange={(e) =>
                              setEmpDigitCount(e.target.value)
                            }
                            helperText="Random mixed employee ID"
                          />
                        )}
                        {empCodeType === "number" && (
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
                        )}
                      </div>
                    }

                    <Alert severity="info" className="mt-4">
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
                    </Alert>
                  </>
                ) : (
                  <div className="mt-4">
                    <TextField
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

      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkUploadDialogOpen}
        onClose={() => setBulkUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b !border-gray-300">
          <div className="text-primary ml-4">Bulk Upload Employees</div>
          <IconButton onClick={() => setBulkUploadDialogOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <Alert severity="info" className="mb-4">
            Download the sample template, fill in employee details, and upload.
            Welcome emails will be sent automatically.
          </Alert>
          <div className="text-center">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            // onClick={downloadSampleTemplate}
            >
              Download Sample Template
            </Button>
          </div>

          {/* CHECKBOX */}
          <FormControlLabel
            control={
              <Checkbox
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
            <Alert
              severity="info"
              className="mb-3"
            >
              Employee IDs will be
              validated from uploaded
              Excel.
            </Alert>
          )}
          {!hasEmpIdColumn && (
            <div className="border rounded-lg p-4 !mb-4">
              <div className="font-semibold text-gray-800">Employee ID Generation</div>
              <div className="!mt-6">
                <FormControl fullWidth className="">
                  <InputLabel>Generation Flow</InputLabel>
                  <Select
                    value={empGenerationFlow}
                    label="Generation Flow"
                    className="!text-[12px]"
                    onChange={(e) =>
                      setEmpGenerationFlow(
                        e.target.value as "new" | "continue"
                      )
                    }
                  >
                    <MenuItem value="new" className="!text-[12px]">Generate With New Pattern</MenuItem>
                    <MenuItem value="continue" className="!text-[12px]">Continue Last Generated ID</MenuItem>
                  </Select>
                </FormControl>
                {/* AUTO GENERATE DEFAULT */}
                {empGenerationFlow == 'new' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {/* <FormControl
                      fullWidth
                      className="!mb-6"
                    >
                      <InputLabel>Generation Type</InputLabel>
                      <Select
                        value={empCodeMode}
                        label="Generation Type"
                        className="!text-[12px]"
                        disabled={!hasEmpIdColumn}
                        onChange={(e) =>
                          setEmpCodeMode(
                            e.target.value
                          )
                        }
                      >
                        <MenuItem value="auto">Auto Generate</MenuItem>
                        <MenuItem value="manual">Manual Type</MenuItem>
                      </Select>
                    </FormControl> */}
                    <FormControl
                      style={{ minWidth: 200 }}>
                      <InputLabel>Format Type</InputLabel>
                      <Select
                        value={empCodeType}
                        label="Format Type"
                        className="!text-[12px] !text-gray-800"
                        onChange={(e) =>
                          setEmpCodeType(
                            e.target.value
                          )
                        }
                      >
                        <MenuItem value="pattern" className="!text-[12px]">Pattern</MenuItem>
                        <MenuItem value="alphanumeric" className="!text-[12px]">Alphanumeric</MenuItem>
                        <MenuItem value="number" className="!text-[12px]">Number</MenuItem>
                      </Select>
                    </FormControl>
                    {empCodeType === "pattern" && (
                      <>
                        <TextField
                          label="Prefix"
                          value={empPrefix}
                          required
                          className="!text-[12px]"
                          onChange={(e) =>
                            setEmpPrefix(
                              e.target.value
                            )
                          }
                        />
                        <TextField
                          label="Starting Number"
                          className="!text-[12px]"
                          value={empStartNumber}
                          required
                          onChange={(e) =>
                            setEmpStartNumber(
                              e.target.value
                            )
                          }
                        />
                      </>
                    )}
                    {empCodeType === "alphanumeric" && (
                      <TextField
                        type="number"
                        label="Number Of Digits"
                        className="!text-[12px]"
                        required
                        value={empDigitCount}
                        onChange={(e) =>
                          setEmpDigitCount(
                            e.target.value
                          )
                        }
                      />
                    )}
                    {empCodeType === "number" && (
                      <TextField
                        type="number"
                        label="Starting Number"
                        className="!text-[12px]"
                        value={empStartNumber}
                        required
                        onChange={(e) =>
                          setEmpStartNumber(
                            e.target.value
                          )
                        }
                      />
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
                </Alert>
                {/* <div className="text-[12px] text-gray-600">
                  Preview:&nbsp;
                  {empCodeType === "pattern" ? `${empPrefix}${empStartNumber}` :
                    empCodeType === "alphanumeric" ? `Cj6k${"0".repeat(Number(empDigitCount))}` : empStartNumber}
                </div> */}
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
              <CloudUploadIcon className="text-6xl text-gray-400 mb-2" />
              <Typography variant="body1" className="text-gray-600">
                {uploadFile ? uploadFile.name : "Click or drag file to upload"}
              </Typography>
              <Typography variant="caption" className="text-gray-400">
                Supported formats: .xlsx, .xls, .csv
              </Typography>
            </label>
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box className="mt-4">
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" className="text-gray-500 mt-1">
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="!p-4 border-t !border-gray-300">
          <Button
            onClick={() => setBulkUploadDialogOpen(false)}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
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
