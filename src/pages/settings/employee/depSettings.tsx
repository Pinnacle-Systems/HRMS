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
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloseOutlined,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { getCurrentRouteLabel } from "../const";
import { departmentService } from "../../../services/modules/department";
import { branchService } from "../../../services/modules/branch";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { GlobalSort } from "../../../components/GlobalSort";
import { getRowColor } from "../../const";
import type { Employee } from "../general/type";
import { employeeService, normalizeEmployeesResponse } from "../../../services/modules/employees";

interface Department {
  id: string;
  departmentName: string;
  departmentCode: string;
  departmentHeadId: string;
  departmentHeadName?: string;
  branchId: string;
  branchName?: string;
  active: boolean;
}

interface Branch {
  id: string;
  branchName: string;
  branchCode: string;
}

// Sort options
const sortOptions = [
  { value: "departmentName", label: "Department Name" },
  { value: "departmentCode", label: "Department Code" },
  { value: "departmentHeadId", label: "Department Head" },
  { value: "branchId", label: "Branch" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
];

export default function DepartmentSettings() {
  // Pagination & Sorting State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("departmentName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [formData, setFormData] = useState<Partial<Department>>({
    departmentName: "",
    departmentCode: "",
    departmentHeadId: "",
    branchId: "",
    active: true,
  });

  // Employee list for branch head dropdown
  const [employees, setEmployees] = useState<Employee[]>([]);
  const selectedEmployee = employees.find(emp => emp.id === formData.departmentHeadId) || null;

  // Fetch active employees for branch head dropdown
  const getActiveEmployees = async () => {
    try {
      const response: any = await employeeService.getEmployees({
        page: 0,
        size: 20,
        sort: "name,ASC",
        includeInactive: false,
      });
      setEmployees(normalizeEmployeesResponse(response) as Employee[]);
    } catch (error: any) {
      showSnackbar(error.message, error);
    }
  };

  // Fetch departments
  const getDepartments = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
        sort: `${sortBy},${sortOrder}`,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response: any = await departmentService.getDepartments(params);
      if (response.success) {
        setDepartments(response.data.content || response.data || []);
        setTotal(response.data.totalElements || response.data.total || 0);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
      console.error("Failed to load departments:", error.message);
    } finally {
      hideSpinner();
    }
  };

  // Fetch branches for dropdown
  const getBranches = async () => {
    try {
      const response: any = await branchService.getBranches({
        page: 0,
        limit: 100,
        sortBy: "branchName,ASC",
      });
      setBranches(response.data.content || response.data || []);
    } catch (error: any) {
      console.error("Failed to load branches:", error.message);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      getDepartments();
      getBranches();
      getActiveEmployees();
    });
  }, [page, limit, sortBy, sortOrder, searchTerm]);


  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder?: "ASC" | "DESC",
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || "ASC");
    setPage(0);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData(department);
    } else {
      setEditingDepartment(null);
      setFormData({
        departmentName: "",
        departmentCode: "",
        departmentHeadId: "",
        branchId: "",
        active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      active: e.target.checked,
    }));
  };

  const handleSave = async () => {
    if (
      !formData.departmentName ||
      !formData.departmentCode ||
      !formData.branchId
    ) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    showSpinner();
    try {
      if (editingDepartment) {
        const updatedValues = {
          departmentName: formData.departmentName,
          departmentHeadId: formData.departmentHeadId,
          branchId: formData.branchId,
          departmentCode: formData.departmentCode,
          active: formData.active,
        };
        const res: any = await departmentService.updateDepartment(
          editingDepartment.id,
          updatedValues,
        );
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      } else {
        const res: any = await departmentService.createDepartment(formData);
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      }
      await getDepartments();
      handleCloseDialog();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (id: string, departmentName: string) => {
    showConfirmDialog({
      title: "Delete Department",
      message: `Are you sure you want to delete "${departmentName}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const res: any = await departmentService.deleteDepartmentById(id);
          if (res.success) {
            showSnackbar(res.message, "success");
          }
          await getDepartments();
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "ASC" ? (
      <ArrowUpward fontSize="small" className="ml-1" />
    ) : (
      <ArrowDownward fontSize="small" className="ml-1" />
    );
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "500px",
    },
  };

  return (
    <>
      <div className="flex justify-between items-center mt-3 mb-3">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {getCurrentRouteLabel()}
          </span>
        </div>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          className="!bg-primary"
        >
          Add New Department
        </Button>
      </div>

      <div className="">
        {/* Search and Sort Bar */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by department name, code or head..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="!flex-1"
          />
          <GlobalSort
            options={sortOptions}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder === "ASC" ? "asc" : "desc"}
            onSortChange={(newSortBy, newSortOrder) => {
              handleSortChange(
                newSortBy,
                newSortOrder === "asc" ? "ASC" : "DESC",
              );
            }}
          />
        </div>

        {/* Departments Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          className="h-[calc(100vh-290px)] overflow-auto bg-white-50"
        >
          <Table stickyHeader className="border">
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell className="!font-semibold text-gray-800">
                  S No
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "departmentCode",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Department Code
                    {getSortIcon("departmentCode")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "departmentName",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Department Name
                    {getSortIcon("departmentName")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchId",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Branch
                    {getSortIcon("branchId")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "departmentHeadId",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Department Head
                    {getSortIcon("departmentHeadId")}
                  </div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200">
                  <div className="flex items-center gap-1">Status</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 text-center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((department, index) => (
                <TableRow key={department.id} hover sx={getRowColor(index)}>
                  <TableCell className="font-medium text-gray-800">
                    {page * limit + index + 1}
                  </TableCell>
                  <TableCell>{department.departmentCode}</TableCell>
                  <TableCell className="font-medium text-gray-800">
                    {department.departmentName}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {department.branchName || department.branchId}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {department.departmentHeadName ||
                      department.departmentHeadId ||
                      "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department.active ? "Active" : "Inactive"}
                      color={department.active ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary" className="!mr-2"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <EditIcon className="!w-4" sx={{ color: "#0087ff" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDelete(department.id, department.departmentName)
                        }
                      >
                        <DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {departments.length === 0 && (
            <div className="bg-white text-gray-800 text-center py-8 text-gray-500">
              No departments found
            </div>
          )}
        </TableContainer>

        {/* Global Pagination */}
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Add/Edit Department Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">
            {editingDepartment ? "Edit Department" : "Add New Department"}
          </div>
          <IconButton onClick={handleCloseDialog}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-5">
            <div>
              <TextField
                fullWidth
                label="Department Name"
                name="departmentName"
                value={formData.departmentName || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Department Code"
                name="departmentCode"
                value={formData.departmentCode || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <FormControl fullWidth required>
                <InputLabel>Select Branch</InputLabel>
                <Select
                  value={formData.branchId || ""}
                  label="Select Branch"
                  onChange={(e) =>
                    handleSelectChange("branchId", e.target.value)
                  }
                >
                  <MenuItem value="">Select Branch</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {/* Department Head Autocomplete */}
            <div>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.name} (${option.employeeId})`;
                }}
                value={selectedEmployee}
                onChange={(_event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    departmentHeadId: newValue ? newValue.id : "",
                  }));
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  return (
                    <li key={key} {...restProps}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{option.name}</span>
                            <span className="text-xs text-gray-400">({option.employeeId})</span>
                          </div>
                          <div className="text-xs text-gray-500">{option.designation || "Employee"}</div>
                        </div>
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Department Head"
                    placeholder="Search employee by name or ID..."
                  />
                )}
                loading={employees.length === 0}
                loadingText="Loading employees..."
                noOptionsText="No employees found"
                filterOptions={(options, state) => {
                  const searchLower = state.inputValue.toLowerCase();
                  return options.filter(option =>
                    option.name?.toLowerCase().includes(searchLower) ||
                    option.employeeId?.toLowerCase().includes(searchLower) ||
                    option.emailAddress?.toLowerCase().includes(searchLower) ||
                    option.designation?.toLowerCase().includes(searchLower)
                  );
                }}
              />
            </div>

            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Active"
                className="text-gray-800"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className="!bg-primary"
          >
            {editingDepartment ? "Update" : "Save"} Department
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
