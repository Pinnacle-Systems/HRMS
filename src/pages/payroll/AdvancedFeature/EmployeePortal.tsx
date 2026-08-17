import { useState, useEffect } from "react";
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
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as FileIcon,
  Settings as SettingsIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../auth/authContext";
import { employeePortalService, type Feature, type PortalEmployee } from "../../../services/modules/payrollServices/employeePortal";
import { useUI } from "../../../context/Snackbar";
import { formatCurrency, type EmployeePayslipsData } from "../const";
import { departmentService } from "../../../services/modules/department";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { salaryViewService } from "../../../services/modules/payrollServices/salaryView";
import { apiService } from "../../../services";

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

  // User role checks
  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('HR');

  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"payslip" | "bank" | "profile" | "loan">("bank");
  const [loading, setLoading] = useState(false);

  // Portal data
  const [portalData, setPortalData] = useState<any>(null);
  const [employees, setEmployees] = useState<PortalEmployee[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [payslipData, setPayslipData] = useState<EmployeePayslipsData | null>(null);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [selfData, setSelfData] = useState<any>(null);
  const [employeePortalData, setEmployeePortalData] = useState<any>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Pagination
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  // Bank form
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branch: "",
  });

  // Load data based on role
  useEffect(() => {
    loadData();
  }, []);

  // Load employee-specific data when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && isAdmin) {
      loadEmployeeData(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  const loadData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const promises: any[] = [];

      if (isAdmin) {
        // Admin/HR view - get all employees, summary, and features
        promises.push(
          employeePortalService.getPortalSummary(),
          employeePortalService.getPortalEmployees({
            page,
            size: limit,
            search: searchQuery || undefined,
            departmentId: departmentFilter !== "all" ? departmentFilter : undefined
          }),
          employeePortalService.getPortalFeatures(),
          employeePortalService.getEmployeePortalData()
        );

        // Get departments
        try {
          const depRes: any = await departmentService.getActiveDepartments();
          if (depRes.data?.content) {
            setDepartments(depRes.data.content);
          }
        } catch (error) {
          console.error("Failed to load departments", error);
        }
      } else {
        // ESS view - get self data
        promises.push(
          employeePortalService.getSelfView(),
          employeePortalService.getSelfFullPortalData(),
          employeePortalService.getPortalFeatures()
        );
      }

      const results = await Promise.allSettled(promises);

      if (isAdmin) {
        const [summaryResult, employeesResult, featuresResult, portalResult] = results;

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value.data);
        }

        if (employeesResult.status === 'fulfilled') {
          const data = employeesResult.value.data;
          setEmployees(data?.content || []);
          setTotalElements(data?.totalElements || 0);
        }

        if (featuresResult.status === 'fulfilled') {
          setFeatures(featuresResult.value.data || []);
        }

        if (portalResult.status === 'fulfilled') {
          setEmployeePortalData(portalResult.value.data);
          setPortalData(portalResult.value.data);
        }

        // Auto-select first employee if available
        if (employeesResult.status === 'fulfilled' && employeesResult.value.data?.content?.length > 0 && !selectedEmployee) {
          const firstEmp = employeesResult.value.data.content[0];
          setSelectedEmployee(firstEmp);
          setSelectedEmployeeId(firstEmp.employeeId);
        }
      } else {
        const [selfResult, fullDataResult, featuresResult] = results;

        if (selfResult.status === 'fulfilled') {
          setSelfData(selfResult.value.data);
        }

        if (fullDataResult.status === 'fulfilled') {
          const data = fullDataResult.value;
          setPayslipData(data.payslips);
          setTaxSummary(data.taxSummary);
          setSelfData(data.selfView);
        }

        if (featuresResult.status === 'fulfilled') {
          setFeatures(featuresResult.value.data || []);
        }
      }

    } catch (error) {
      console.error("Failed to load portal data", error);
      showSnackbar("Failed to load portal data", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadEmployeeData = async (employeeId: string) => {
    if (!employeeId) return;
    showSpinner();
    try {
      const fullData = await employeePortalService.getEmployeeFullPortalData(employeeId);
      setTaxSummary(fullData.taxSummary);
      setPayslipData(fullData.payslips);
      setPortalData(fullData.portalData);
    } catch (error) {
      console.error("Failed to load employee data", error);
      showSnackbar("Failed to load employee data", "error");
    } finally {
      hideSpinner();
    }
  };

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
    window.open(`/payroll/payslips/${runItemId}`, "_blank");
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.employeeId);
  };

  const handleRefresh = async () => {
    await loadData();
    showSnackbar("Data refreshed!", "success");
  };

  // Handle search with debounce
  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        loadData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, departmentFilter, page, limit]);

  // Filter employees (already filtered via API, but keep for client-side fallback)
  const filteredEmployees = employees;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

   const handleDownloadPayslip = async (periodLabel?: string) => {  
      
      if (!selectedEmployee) return;
      showSpinner();
      try {
        const response: any = await salaryViewService.downloadEmployeePayslip(selectedEmployee.employeeId);
        const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;
        if (fileUrl) {
          await apiService.downloadFromPath(fileUrl, `payslip_${selectedEmployee.employeeId}_${periodLabel}.pdf`);
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
      <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              My Payroll Portal
            </Typography>
            <Typography variant="body2" className="text-gray-500 !mt-1">
              View your payroll information and self-service features
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={handleRefresh}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        </Box>

        {/* Employee Profile Card */}
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "1.5rem" }}>
                {selfData?.employeeName?.charAt(0) || "U"}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selfData?.employeeName || "Employee"}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {selfData?.designation} · {selfData?.department}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {selfData?.employeeCode}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" className="text-gray-500">
                  Last Login
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(selfData?.lastLogin)}
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
              <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              My Payslips
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Gross</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Net</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
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
                    payslipData?.payslips?.map((payslip) => (
                      <TableRow key={payslip.runItemId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {payslip.periodLabel}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatCurrency(payslip.gross)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                            {formatCurrency(payslip.net)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-gray-500">
                            {formatDate(payslip.generatedOn)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewPayslip(payslip.runItemId)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small">
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.key}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: feature.available ? "pointer" : "default",
                  opacity: feature.available ? 1 : 0.6,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: feature.available ? 2 : "0 1px 3px rgba(0,0,0,0.06)",
                    transform: feature.available ? "translateY(-2px)" : "none",
                  },
                }}
                onClick={() => {
                  if (feature.available && feature.key === "bank-details") {
                    setDialogType("bank");
                    setOpenDialog(true);
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", mx: "auto", mb: 1.5 }}>
                    {feature.key === "payslips" && <ReceiptIcon />}
                    {feature.key === "bank-details" && <BankIcon />}
                    {feature.key === "tax-summary" && <FileIcon />}
                    {feature.key === "profile" && <SettingsIcon />}
                    {!feature.key && <PersonIcon />}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {feature.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {feature.description}
                  </Typography>
                  <Chip
                    label={feature.available ? "Available" : "Coming Soon"}
                    size="small"
                    color={feature.available ? "success" : "default"}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
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
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Self-service payroll access for employees
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={handleRefresh}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 1 }}>
        {[
          { label: "Total Employees", value: summary?.total || employees.length || 0, color: "#3b82f6", icon: <PersonIcon /> },
          { label: "Compliant", value: summary?.compliant || 0, color: "#10b981", icon: <CheckCircleIcon /> },
          { label: "Pending", value: summary?.pending || 0, color: "#f59e0b", icon: <TimeIcon /> },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(item.color, 0.1), color: item.color }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="h5" className="text-gray-800" sx={{ fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {item.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
            <FormControl size="small" className="bg-white-50" sx={{ minWidth: 200 }}>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Department"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer className="border border-gray-200 mt-1 rounded-md h-[calc(100vh-370px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold">Employee</TableCell>
                  <TableCell className="!font-bold">Designation</TableCell>
                  <TableCell className="!font-bold">Department</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell align="center" className="!font-bold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <div className="py-6 text-gray-500">No employees found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp, i) => (
                    <TableRow
                      key={emp.employeeId}
                      selected={selectedEmployeeId === emp.employeeId}
                      onClick={() => handleEmployeeSelect(emp)}
                      sx={getRowColor(i)}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                            {emp.employeeName?.charAt(0) || "E"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {emp.employeeName}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                              {emp.employeeCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.designation || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-gray-500">
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
                            <ReceiptIcon fontSize="small" className="text-blue-600 !w-4"/>
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
                            <BankIcon fontSize="small" className="text-amber-500 !w-4"/>
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
                            <FileDownloadIcon fontSize="small" className="text-green-700 !w-4"/>
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
              page={page + 1}
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.key}>
              <Card
                className="bg-white"
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: "default",
                  transition: "all 0.2s",
                  opacity: feature.available ? 1 : 0.6,
                }}
              >
                <CardContent className="grid items-center justify-center" sx={{ p: 2.5, textAlign: "center" }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: "flex", alignItems: "center", 
                    justifyContent: "center", bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main", mx: "auto", mb: 1.5 }}>
                    {feature.key === "VIEW_PAYSLIPS" && <ReceiptIcon/>}
                    {feature.key === "UPDATE_BANK" && <BankIcon />}
                    {feature.key === "VIEW_TAX" && <FileIcon />}
                    {feature.key === "PROFILE_SETTINGS" && <SettingsIcon />}
                    {feature.key === "LOAN_REQUEST" && <PersonIcon />}
                  </Box>
                  <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                    {feature.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {feature.description}
                  </Typography>
                  <Chip label={feature.available ? "Available" : "Coming Soon"} size="small" color={feature.available ? "success" : "default"} sx={{ mt: 1 }} />
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
                <Typography variant="body2" className="text-gray-500">
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
                          <TableCell colSpan={5} align="center">
                            <div className="text-gray-500 py-6">No payslips found for this employee</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payslipData.payslips?.map((payslip, i) => (
                          <TableRow key={payslip.runItemId} sx={getRowColor(i)}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {payslip.periodLabel}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{formatCurrency(payslip.gross)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                                {formatCurrency(payslip.net)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" className="text-gray-500">
                                {formatDate(payslip.generatedOn)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Tooltip title="View">
                                  <IconButton size="small" onClick={() => handleViewPayslip(payslip.runItemId)}>
                                    <ViewIcon fontSize="small" className="text-primary"/>
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton size="small">
                                    <DownloadIcon fontSize="small" className="text-blue-500"/>
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
                <Typography variant="body2" className="text-gray-500">
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
                      <Typography variant="body2" className="text-gray-500">Gross Annual Income</Typography>
                      <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 600 }}>{formatCurrency(taxSummary.grossAnnualIncome || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                      <Typography variant="body2" className="text-gray-500">Exemptions & Deductions</Typography>
                      <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>- {formatCurrency(taxSummary.exemptionsDeductions || 0)}</Typography>
                    </Box>
                    <Divider className="border border-gray-200"/>
                    <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>Net Taxable Income</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>{formatCurrency(taxSummary.netTaxableIncome || 0)}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                      <Typography variant="body2" className="text-gray-500">Tax Computed</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>{formatCurrency(taxSummary.taxComputed || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                      <Typography variant="body2" className="text-gray-500">TDS Deducted</Typography>
                      <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>- {formatCurrency(taxSummary.tdsDeducted || 0)}</Typography>
                    </Box>
                    <Divider className="border border-gray-200"/>
                    <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>Balance Tax Payable</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>{formatCurrency(taxSummary.balanceTaxPayable || 0)}</Typography>
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
              <Typography variant="body2" className="text-gray-800 !mb-2">
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
                <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
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