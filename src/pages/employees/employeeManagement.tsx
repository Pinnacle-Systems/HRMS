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
  RadioGroup,
  Radio,
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

  // Dialog states
  // const [addDialogOpen, setAddDialogOpen] = useState(false);
  // const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // ID Generation
  const [idGenerationMethod, setIdGenerationMethod] = useState<
    "auto" | "manual"
  >("auto");
  const [employeeIdPattern, setEmployeeIdPattern] = useState("EMP");
  const [employeeIdSequence, setEmployeeIdSequence] = useState(1001);
  const [manualEmployeeId, setManualEmployeeId] = useState("");

  // Form data
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Bulk upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [branches, setBranches] = useState<Branches[]>([]);

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

  // Generate auto employee ID
  const generateEmployeeId = () => {
    const sequence = employeeIdSequence.toString().padStart(4, "0");
    return `${employeeIdPattern}${sequence}`;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      emailAddress: "",
      joiningDate: "",
      // location: "",
      employeeId: "",
      departmentId: "",
      designationId: "",
      mobileNumber: "",
    });
    setIdGenerationMethod("auto");
    setManualEmployeeId("");
    setSelectedEmployee(null);
    setEmployeeIdPattern("EMP");
    setEmployeeIdSequence(1001);
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
          branchId: formData.branchId,
          departmentId: formData.departmentId,
          designationId: formData.designationId,
          mobileNumber: formData.mobileNumber,
        };
        await employeeService.updateEmployee(selectedEmployee!.id, payload);
        showSnackbar("Employee updated successfully!", "success");
      } else {
        let employeeId = "";
        if (idGenerationMethod === "auto") {
          employeeId = generateEmployeeId();
          setEmployeeIdSequence((prev) => prev + 1);
        } else {
          employeeId = manualEmployeeId;
        }
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
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      const response: any = await employeeService.bulkUploadEmployees(
        formData,
        (progress) => {
          setUploadProgress(progress);
        },
      );
      if (response.success) {
        showSnackbar("Upload successful!", "success");
        setBulkUploadDialogOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
        getEmployees();
      }
    } catch (error: any) {
      showSnackbar(
        error.response?.data?.message || error.message || "Failed to upload",
        "error",
      );
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
      {/* Header */}
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
                <TableCell>

                  {employee.employeeId}

                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.emailAddress}</TableCell>
                <TableCell>{employee.mobileNumber || "-"}</TableCell>
                <TableCell>{employee.designation || "-"}</TableCell>
                <TableCell>{employee.department || "-"}</TableCell>
                <TableCell>{employee.branch || "-"}</TableCell>
                <TableCell>
                  {employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleDateString()
                    : "-"}
                </TableCell>
                {/* <TableCell>
                  <Chip
                    label={employee.status === "ACTIVE" ? "Active" : "Inactive"}
                    color={employee.status === "ACTIVE" ? "success" : "default"}
                    size="small"
                  />
                </TableCell> */}
                <TableCell className="text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
            {/* <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            /> */}
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

            {!isEditing && (
              <>
                <div className="md:col-span-2">
                  <FormControl component="fieldset">
                    <div className="mb-1 font-medium text-gray-700">
                      Employee ID Generation
                    </div>
                    <RadioGroup
                      row
                      value={idGenerationMethod}
                      onChange={(e) =>
                        setIdGenerationMethod(
                          e.target.value as "auto" | "manual",
                        )
                      }
                    >
                      <FormControlLabel
                        value="auto"
                        control={<Radio />}
                        className="!text-gray-800"
                        label="Auto Generate"
                      />
                      <FormControlLabel
                        value="manual"
                        control={<Radio />}
                        className="!text-gray-800"
                        label="Manual Entry"
                      />
                    </RadioGroup>
                  </FormControl>
                </div>
                {idGenerationMethod === "auto" ? (
                  <div className="md:col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <TextField
                        fullWidth
                        label="ID Pattern"
                        value={employeeIdPattern}
                        onChange={(e) => setEmployeeIdPattern(e.target.value)}
                        placeholder="e.g., EMP, E, COMP, STAFF"
                        helperText="Prefix for employee ID"
                      />

                      <TextField
                        fullWidth
                        label="Next Sequence"
                        type="number"
                        value={employeeIdSequence}
                        onChange={(e) =>
                          setEmployeeIdSequence(parseInt(e.target.value) || 1)
                        }
                        placeholder="e.g., 1001"
                        helperText="Starting number (auto-increments after use)"
                      />
                    </div>

                    <Alert severity="info">
                      Auto-generated ID preview:{" "}
                      <strong>{generateEmployeeId()}</strong>
                    </Alert>
                  </div>
                ) : (
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={manualEmployeeId}
                    onChange={(e) => setManualEmployeeId(e.target.value)}
                    placeholder="e.g., EMP001"
                  />
                )}
              </>
            )}

            {isEditing && (
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                disabled
              />
            )}
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
            onClick={handleSaveEmployee}
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
          <div className="text-center mb-4">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            // onClick={downloadSampleTemplate}
            >
              Download Sample Template
            </Button>
          </div>
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
