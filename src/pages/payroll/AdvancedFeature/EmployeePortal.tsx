import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as FileIcon,
  Settings as SettingsIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../auth/authContext";
import { employeePortalService, type PortalEmployee } from "../../../services/modules/payrollServices/employeePortal";
import { useUI } from "../../../context/Snackbar";
import { formatCurrency, type EmployeePayslipsData } from "../const";
import { departmentService } from "../../../services/modules/department";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { salaryViewService } from "../../../services/modules/payrollServices/salaryView";
import { apiService } from "../../../services";
import { useNavigate } from "react-router-dom";
import type { Department } from "../../employees/type";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EmployeePortal() {
  const theme = useTheme();
  const { session } = useAuth();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const navigate = useNavigate();

  // User role checks
  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('HR');

  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"payslip" | "bank" | "profile" | "loan">("bank");

  // Portal data
  // const [portalData, setPortalData] = useState<any>(null);
  const [employees, setEmployees] = useState<PortalEmployee[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [payslipData, setPayslipData] = useState<EmployeePayslipsData | null>(null);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [selfData, setSelfData] = useState<any>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Bank form
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branch: "",
  });

  // Load data function with useCallback to prevent recreation
  const loadData = useCallback(async () => {
    showSpinner();
    try {
      if (isAdmin) {
        // Admin/HR view - get all employees and features
        const promises: any[] = [
          employeePortalService.getPortalEmployees({
            page: page - 1,
            size: limit,
            search: searchQuery || undefined,
            departmentId: departmentFilter !== "all" ? departmentFilter : undefined
          }),
          employeePortalService.getPortalFeatures(),
        ];

        // Load departments
        try {
          const depRes: any = await departmentService.getActiveDepartments();
          if (depRes.data?.content) {
            setDepartments(depRes.data.content);
          }
        } catch (error) {
          showSnackbar("Failed to load departments", 'error');
        }

        const results = await Promise.allSettled(promises);
        const [employeesResult, featuresResult] = results;

        if (employeesResult.status === 'fulfilled') {
          const data = employeesResult.value.data;
          const content = data?.content || data?.items || data?.records || [];
          const total = data?.totalElements || data?.total || data?.totalCount || content.length || 0;
          
          setEmployees(content);
          setTotalElements(total);

          // Auto-select first employee if available and no employee selected
          if (content.length > 0 && !selectedEmployee && !selectedEmployeeId) {
            const firstEmp = content[0];
            setSelectedEmployee(firstEmp);
            setSelectedEmployeeId(firstEmp.employeeId);
          }
        }

        if (featuresResult.status === 'fulfilled') {
          setFeatures(featuresResult.value.data || []);
        }
      } else {
        // ESS view - single API call is enough
        const response: any = await employeePortalService.getSelfView();
        
        // Extract data from response
        const data = response?.data?.data || response?.data || response || {};
        
        // Set employee data
        setSelfData(data.employee || {});
        
        // Set summary data
        if (data.summary) {
          setPayslipData({
            currentMonthGross: data.summary.currentMonthGross || 0,
            currentMonthNet: data.summary.currentMonthNet || 0,
            ytdEarnings: data.summary.ytdEarnings || 0,
            payslips: data.recentPayslips?.map((p: any, index: number) => ({
              runItemId: `${p.period}-${index}`,
              periodLabel: p.period || "N/A",
              gross: p.gross || 0,
              net: p.net || 0,
              generatedOn: p.generatedOn || new Date().toISOString(),
            })) || []
          });
        }
        
        // Set features
        if (data.features) {
          setFeatures(data.features);
        }
        
        // Set portal data
        // setPortalData(data);
      }
    } catch (error) {
      showSnackbar("Failed to load portal data", "error");
    } finally {
      hideSpinner();
    }
  }, [isAdmin, page, limit, searchQuery, departmentFilter, selectedEmployee, selectedEmployeeId]);

  // Load employee-specific data when employee is selected (Admin only)
  const loadEmployeeData = useCallback(async (employeeId: string) => {
    if (!employeeId || !isAdmin) return;
    showSpinner();
    try {
      const fullData = await employeePortalService.getEmployeeFullPortalData(employeeId);
      setTaxSummary(fullData.taxSummary);
      setPayslipData(fullData.payslips);
      // setPortalData(fullData.portalData);
    } catch (error) {
      showSnackbar("Failed to load employee data", "error");
    } finally {
      hideSpinner();
    }
  }, [isAdmin]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []); // Only run once on mount

  // Reload when pagination or filters change (admin only)
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [page, limit, searchQuery, departmentFilter, isAdmin]);

  // Load employee data when selected employee changes (admin only)
  useEffect(() => {
    if (selectedEmployeeId && isAdmin) {
      loadEmployeeData(selectedEmployeeId);
    }
  }, [selectedEmployeeId, isAdmin, loadEmployeeData]);

  const handleUpdateBank = async () => {
    if (!bankForm.accountNumber || !bankForm.bankName || !bankForm.ifscCode) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    showSpinner();
    try {
      await employeePortalService.updateBankDetails(bankForm);
      showSnackbar("Bank details updated successfully!", "success");
      setOpenDialog(false);
      setBankForm({ accountNumber: "", bankName: "", ifscCode: "", branch: "" });
      await loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to update bank details", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewPayslip = (runItemId: string) => {
    navigate(`/payroll/payslips/${runItemId}`);
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.employeeId);
  };

  const handleRefresh = async () => {
    await loadData();
    showSnackbar("Data refreshed!", "success");
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleDownloadPayslip = async (periodLabel?: string) => {
    if (!selectedEmployee) return;
    showSpinner();
    try {
      const response: any = await salaryViewService.downloadEmployeePayslip(selectedEmployee.employeeId);
      const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;
      if (fileUrl) {
        await apiService.downloadFromPath(fileUrl, `payslip_${selectedEmployee.employeeId}_${periodLabel}.pdf`);
        showSnackbar("Payslip downloaded successfully!", "success");
      } else {
        showSnackbar("No payslip available for download", "warning");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to download payslip", "error");
    } finally {
      hideSpinner();
    }
  };

  // ESS View - Employee Self Service
  if (!isAdmin) {
    return (
      <div className="bg-white-50">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              My Payroll Portal
            </Typography>
            <Typography className="text-gray-500 !mt-1">
              View your payroll information and self-service features
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {/* Employee Profile Card */}
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "1.5rem" }}>
                {selfData?.name?.charAt(0) || "U"}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography className="text-gray-800" sx={{ fontWeight: 600 }}>
                  {selfData?.name || "Employee"}
                </Typography>
                <Typography className="text-gray-500">
                  {selfData?.designation} · {selfData?.department}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {selfData?.id}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" className="text-gray-500">
                  Email
                </Typography>
                <Typography sx={{ fontWeight: 500 }} className="text-gray-800">
                  {selfData?.email || "-"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { label: "Current Month Gross", value: formatCurrency(payslipData?.currentMonthGross || 0), color: "#3b82f6" },
            { label: "Current Month Net", value: formatCurrency(payslipData?.currentMonthNet || 0), color: "#10b981" },
            { label: "YTD Earnings", value: formatCurrency(payslipData?.ytdEarnings || 0), color: "#f59e0b" },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
              <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Typography variant="caption" className="text-gray-500">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Payslips History */}
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
              My Payslips
            </Typography>
            <TableContainer>
              <Table className="border border-gray-200 rounded-sm">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>S No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Gross</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payslipData?.payslips?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No payslips found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payslipData?.payslips?.map((payslip, index) => (
                      <TableRow key={`${payslip.periodLabel}-${index}`} sx={getRowColor(index)}>
                        <TableCell>{index+1}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500 }}>
                            {payslip.periodLabel}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{formatCurrency(payslip.gross)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: "success.main" }}>
                            {formatCurrency(payslip.net)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography className="text-gray-500">
                            {formatDate(payslip.generatedOn)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewPayslip(payslip.runItemId)}>
                                <ViewIcon fontSize="small" className="!w-4 !text-primary"/>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small">
                                <DownloadIcon fontSize="small" className="!w-4 !text-blue-500"/>
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Self-Service Features */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>
          Self-Service Features
        </Typography>
        <Grid container spacing={3} className="!mb-4">
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.id}>
              <Card
                className="!bg-head"
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: feature.enabled ? "pointer" : "default",
                  opacity: feature.enabled ? 1 : 0.6,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: feature.enabled ? 2 : "0 1px 3px rgba(0,0,0,0.06)",
                    transform: feature.enabled ? "translateY(-2px)" : "none",
                  },
                }}
                onClick={() => {
                  if (feature.enabled && feature.id === "update_bank") {
                    setDialogType("bank");
                    setOpenDialog(true);
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 2, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: "primary.main", 
                    mx: "auto", 
                    mb: 1.5 
                  }}>
                    {feature.id === "view_payslips" && <ReceiptIcon />}
                    {feature.id === "update_bank" && <BankIcon />}
                    {feature.id === "view_tax" && <FileIcon />}
                    {feature.id === "loan_request" && <PersonIcon />}
                    {feature.id === "profile_settings" && <SettingsIcon />}
                    {!feature.id && <PersonIcon />}
                  </Box>
                  <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                    {feature.label}
                  </Typography>
                  <Chip
                    label={feature.enabled ? "Available" : "Coming Soon"}
                    size="small"
                    color={feature.enabled ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>
    );
  }

  // Admin/HR View - Full Portal Management
  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Portal
          </Typography>
          <Typography className="text-gray-500 !mt-1">
            Self-service payroll access for employees
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box className="bg-white border-b border-gray-200">
        <Tabs value={tabValue} onChange={handleTabChange} sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--color-primary)",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}>
          <Tab label="Employee List" className="!text-gray-800" />
          <Tab label="Self-Service Features" className="!text-gray-800" />
          <Tab label="Employee Payslips" className="!text-gray-800" />
          <Tab label="Tax Summary" className="!text-gray-800" />
        </Tabs>
      </Box>

      {/* Tab 0: Employee List */}
      {tabValue === 0 && (
        <div className="bg-white !p-2 !pb-0">
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1}}>
            <TextField
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" className="bg-white-50" sx={{ minWidth: 200 }}>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.departmentName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer className="border border-gray-200 mt-1 rounded-md h-[calc(100vh-285px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold">S No</TableCell>
                  <TableCell className="!font-bold">Employee</TableCell>
                  <TableCell className="!font-bold">Designation</TableCell>
                  <TableCell className="!font-bold">Department</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell align="center" className="!font-bold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <div className="py-6 text-gray-500">No employees found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp, i) => (
                    <TableRow
                      key={emp.employeeId}
                      selected={selectedEmployeeId === emp.employeeId}
                      onClick={() => handleEmployeeSelect(emp)}
                      sx={getRowColor(i)}
                      className="hover:cursor-pointer"
                    >
                      <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                            {emp.employeeName?.charAt(0) || "E"}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>
                              {emp.employeeName}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                              {emp.employeeCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography>{emp.designation || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography className="text-gray-500">
                          {emp.department || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.status || "Active"}
                          size="small"
                          color={emp.status === "Active" ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Payslips">
                          <IconButton
                            size="small"
                            className="!mr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployeeId(emp.employeeId);
                              setSelectedEmployee(emp);
                              setDialogType("payslip");
                              setOpenDialog(true);
                            }}
                          >
                            <ReceiptIcon fontSize="small" className="text-blue-600 !w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Bank Details">
                          <IconButton
                            size="small"
                            className="!mr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployeeId(emp.employeeId);
                              setSelectedEmployee(emp);
                              setDialogType("bank");
                              setOpenDialog(true);
                            }}
                          >
                            <BankIcon fontSize="small" className="text-amber-500 !w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Payslip">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployeeId(emp.employeeId);
                              setSelectedEmployee(emp);
                              if (payslipData?.payslips?.length) {
                                handleDownloadPayslip(payslipData.payslips[0].periodLabel);
                              } else {
                                showSnackbar("No payslip available", "warning");
                              }
                            }}
                          >
                            <FileDownloadIcon fontSize="small" className="text-green-700 !w-4" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalElements > 0 && (
            <GlobalPagination
              total={totalElements}
              page={page}
              limit={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              pageSizeOptions={[10, 20, 50, 100]}
              showTotal={true}
            />
          )}
        </div>
      )}

      {/* Tab 1: Self-Service Features */}
      {tabValue === 1 && (
        <Grid container spacing={3} className="my-4">
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.id}>
              <Card
                className="bg-white"
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: feature.enabled ? "pointer" : "default",
                  transition: "all 0.2s",
                  opacity: feature.enabled ? 1 : 0.6,
                }}
                onClick={() => {
                  if (feature.enabled && feature.id === "update_bank") {
                    setDialogType("bank");
                    setOpenDialog(true);
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2, display: "flex", alignItems: "center",
                    justifyContent: "center", bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main", mx: "auto", mb: 1.5
                  }}>
                    {feature.id === "view_payslips" && <ReceiptIcon />}
                    {feature.id === "update_bank" && <BankIcon />}
                    {feature.id === "view_tax" && <FileIcon />}
                    {feature.id === "loan_request" && <PersonIcon />}
                    {feature.id === "profile_settings" && <SettingsIcon />}
                  </Box>
                  <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                    {feature.label}
                  </Typography>
                  <Chip 
                    label={feature.enabled ? "Available" : "Coming Soon"} 
                    size="small" 
                    color={feature.enabled ? "success" : "default"} 
                    sx={{ mt: 1 }} 
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 2: Employee Payslips */}
      {tabValue === 2 && (
        <Card className="bg-white" sx={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
              Employee Payslips {selectedEmployee?.employeeName ? `- ${selectedEmployee.employeeName}` : ""}
            </Typography>

            {!selectedEmployee && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography className="text-gray-500">
                  Select an employee from the Employee List tab to view payslips
                </Typography>
              </Box>
            )}

            {selectedEmployee && payslipData && (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {[
                    { label: "Current Month Gross", value: formatCurrency(payslipData.currentMonthGross || 0), color: "#3b82f6" },
                    { label: "Current Month Net", value: formatCurrency(payslipData.currentMonthNet || 0), color: "#10b981" },
                    { label: "YTD Earnings", value: formatCurrency(payslipData.ytdEarnings || 0), color: "#f59e0b" },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
                      <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(item.color, 0.08), textAlign: "center" }}>
                        <Typography variant="caption" className="text-gray-500">
                          {item.label}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <TableContainer className="border border-gray-200 rounded-md">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>S No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Gross</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payslipData.payslips?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <div className="text-gray-500 py-6">No payslips found for this employee</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payslipData.payslips?.map((payslip, i) => (
                          <TableRow key={`${payslip.periodLabel}-${i}`} sx={getRowColor(i)}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {payslip.periodLabel}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography>{formatCurrency(payslip.gross)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: "success.main" }}>
                                {formatCurrency(payslip.net)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography className="text-gray-500">
                                {formatDate(payslip.generatedOn)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View">
                                <IconButton size="small" onClick={() => handleViewPayslip(payslip.runItemId)}>
                                  <ViewIcon fontSize="small" className="text-primary !w-4" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton size="small" onClick={() => handleDownloadPayslip(payslip.periodLabel)}>
                                  <DownloadIcon fontSize="small" className="text-blue-500 !w-4" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Tax Summary */}
      {tabValue === 3 && (
        <Card className="bg-white" sx={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="text-gray-800">
              Tax Summary {selectedEmployee?.employeeName ? `- ${selectedEmployee.employeeName}` : ""}
            </Typography>

            {!selectedEmployee && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography className="text-gray-500">
                  Select an employee from the Employee List tab to view tax summary
                </Typography>
              </Box>
            )}

            {selectedEmployee && taxSummary && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <Typography variant="caption" className="text-gray-500">
                      Financial Year
                    </Typography>
                    <Typography variant="h6" className="text-gray-800">{taxSummary.financialYear || "N/A"}</Typography>
                  </Box>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.04) }}>
                      <Typography className="text-gray-500">Gross Annual Income</Typography>
                      <Typography className="text-gray-800" sx={{ fontWeight: 600 }}>{formatCurrency(taxSummary.grossAnnualIncome || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                      <Typography className="text-gray-500">Exemptions & Deductions</Typography>
                      <Typography sx={{ color: "success.main", fontWeight: 600 }}>- {formatCurrency(taxSummary.exemptionsDeductions || 0)}</Typography>
                    </Box>
                    <Divider className="border border-gray-200" />
                    <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                      <Typography sx={{ fontWeight: 600, color: "primary.main" }}>Net Taxable Income</Typography>
                      <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{formatCurrency(taxSummary.netTaxableIncome || 0)}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                      <Typography className="text-gray-500">Tax Computed</Typography>
                      <Typography sx={{ fontWeight: 600, color: "warning.main" }}>{formatCurrency(taxSummary.taxComputed || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                      <Typography className="text-gray-500">TDS Deducted</Typography>
                      <Typography sx={{ color: "success.main", fontWeight: 600 }}>- {formatCurrency(taxSummary.tdsDeducted || 0)}</Typography>
                    </Box>
                    <Divider className="border border-gray-200" />
                    <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                      <Typography sx={{ fontWeight: 600, color: "error.main" }}>Balance Tax Payable</Typography>
                      <Typography sx={{ fontWeight: 700, color: "error.main" }}>{formatCurrency(taxSummary.balanceTaxPayable || 0)}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b border-gray-200">
          <Typography variant="h6">
            {dialogType === "payslip" && "Employee Payslips"}
            {dialogType === "bank" && "Update Bank Details"}
          </Typography>
        </DialogTitle>
        <DialogContent className="!p-4">
          {dialogType === "bank" && (
            <Stack spacing={2}>
              <TextField
                label="Account Number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Bank Name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="IFSC Code"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                fullWidth
                required
                helperText="Format: 4 letters followed by 7 characters (e.g., SBIN0012345)"
              />
              <TextField
                label="Branch"
                value={bankForm.branch}
                onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                fullWidth
              />
            </Stack>
          )}
          {dialogType === "payslip" && selectedEmployee && (
            <Box>
              <Typography className="text-gray-800 !mb-2">
                Viewing payslips for <strong>{selectedEmployee.employeeName}</strong>
              </Typography>
              {payslipData?.payslips?.length ? (
                payslipData.payslips.map((p) => (
                  <Button
                    key={p.runItemId}
                    variant="outlined"
                    fullWidth
                    sx={{
                      justifyContent: "space-between",
                      mb: 1,
                      textTransform: "none",
                      p: 1.5
                    }}
                    onClick={() => handleViewPayslip(p.runItemId)}
                  >
                    <span>{p.periodLabel}</span>
                    <span style={{ fontWeight: 600, color: theme.palette.success.main }}>
                      {formatCurrency(p.net)}
                    </span>
                  </Button>
                ))
              ) : (
                <Typography sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                  No payslips available for this employee
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200" sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" className="!text-gray-800 !border-gray-200">
            {dialogType === "payslip" ? "Close" : "Cancel"}
          </Button>
          {dialogType === "bank" && (
            <Button onClick={handleUpdateBank} variant="contained" className="!bg-primary">
              Save Bank Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}