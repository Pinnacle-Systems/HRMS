import { useState } from "react";
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
  Paper,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Avatar,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Description as FileIcon,
  AttachMoney as DollarSignIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

// Mock data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", designation: "Senior Developer", department: "Engineering", lastLogin: "2026-07-17T14:28:00Z", profilePic: "", hasViewedPayslip: true, hasUpdatedBank: true, pendingActions: 0 },
  { id: "EMP002", name: "Priya Sharma", designation: "Sales Manager", department: "Sales", lastLogin: "2026-07-17T13:15:00Z", profilePic: "", hasViewedPayslip: true, hasUpdatedBank: false, pendingActions: 1 },
  { id: "EMP003", name: "Amit Patel", designation: "HR Executive", department: "HR", lastLogin: "2026-07-15T10:30:00Z", profilePic: "", hasViewedPayslip: false, hasUpdatedBank: true, pendingActions: 2 },
];

const mockPayslips = [
  { period: "June 2026", gross: 200000, net: 170000, generatedOn: "2026-06-05" },
  { period: "May 2026", gross: 200000, net: 170000, generatedOn: "2026-05-05" },
  { period: "April 2026", gross: 190000, net: 160000, generatedOn: "2026-04-05" },
];

const mockTaxSummary = {
  financialYear: "2025-26",
  grossAnnualIncome: 2400000,
  exemptionsAndDeductions: 200000,
  netTaxableIncome: 2200000,
  taxComputed: 180000,
  tdsDeducted: 150000,
  balanceTax: 30000,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
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
  const [tabValue, setTabValue] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState("EMP001");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"payslip" | "bank" | "profile" | "loan">("payslip");

  const employee = mockEmployees.find((e) => e.id === selectedEmployee);
  const employeePayslips = mockPayslips;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredEmployees = mockEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Portal
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Self-service payroll access for employees
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Employees", value: "248", color: "#3b82f6", icon: <PersonIcon /> },
          { label: "Active Employees", value: "235", color: "#10b981", icon: <CheckCircleIcon /> },
          { label: "Viewing Their Data", value: "100%", color: "#f59e0b", icon: <TimeIcon /> },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(item.color, 0.1),
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {item.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Employee List" />
          <Tab label="Self-Service Features" />
          <Tab label="Payslips" />
          <Tab label="Tax Summary" />
        </Tabs>
      </Box>

      {/* Tab 1: Employee List */}
      {tabValue === 0 && (
        <Stack spacing={3}>
          {/* Search & Filter */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select value="" label="Department">
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<FilterIcon fontSize="small" />} sx={{ textTransform: "none" }}>
              Filter
            </Button>
          </Box>

          {/* Employee Table */}
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Last Login</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                            {emp.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {emp.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {emp.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.designation}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {emp.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {formatDate(emp.lastLogin)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {emp.hasViewedPayslip && (
                            <Chip label="Viewed" size="small" color="success" sx={{ fontSize: "0.6rem" }} />
                          )}
                          {emp.pendingActions > 0 && (
                            <Chip label={`${emp.pendingActions} pending`} size="small" color="warning" sx={{ fontSize: "0.6rem" }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row">
                          <IconButton
                            size="small"
                            sx={{ "&:hover": { color: "primary.main" } }}
                            onClick={() => { setSelectedEmployee(emp.id); setDialogType("payslip"); setOpenDialog(true); }}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ "&:hover": { color: "primary.main" } }}
                            onClick={() => { setSelectedEmployee(emp.id); setDialogType("bank"); setOpenDialog(true); }}
                          >
                            <BankIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ "&:hover": { color: "primary.main" } }}
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}

      {/* Tab 2: Self-Service Features */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {[
            { id: "payslips", label: "View Payslips", icon: <ReceiptIcon />, color: "#3b82f6", enabled: true, desc: "View and download your payslips" },
            { id: "bank", label: "Update Bank Details", icon: <BankIcon />, color: "#10b981", enabled: true, desc: "Update your bank account information" },
            { id: "tax", label: "View Tax Summary", icon: <FileIcon />, color: "#f59e0b", enabled: true, desc: "View your annual tax summary" },
            { id: "loan", label: "Loan Request", icon: <DollarSignIcon />, color: "#8b5cf6", enabled: true, desc: "Apply for loan or advance" },
            { id: "profile", label: "Profile Settings", icon: <SettingsIcon />, color: "#ec4899", enabled: true, desc: "Update your profile information" },
          ].map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 2,
                    borderColor: theme.palette.primary.main,
                    transform: "translateY(-2px)",
                  },
                  border: `1px solid ${alpha(feature.color, 0.2)}`,
                }}
                onClick={() => { setDialogType(feature.id as any); setOpenDialog(true); }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(feature.color, 0.1),
                      color: feature.color,
                      mx: "auto",
                      mb: 1.5,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {feature.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {feature.desc}
                  </Typography>
                  {feature.enabled && (
                    <Chip
                      label="Available"
                      size="small"
                      color="success"
                      sx={{ mt: 1, fontSize: "0.6rem" }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 3: Payslips */}
      {tabValue === 2 && (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                My Payslips
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: "Current Month Gross", value: formatCurrency(200000), color: theme.palette.success.main },
                  { label: "Current Month Net", value: formatCurrency(170000), color: theme.palette.primary.main },
                  { label: "YTD Earnings", value: formatCurrency(1200000), color: theme.palette.info.main },
                ].map((item) => (
                  <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
                    <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(item.color, 0.08), textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Gross Salary</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Net Salary</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Generated On</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeePayslips.map((payslip) => (
                      <TableRow key={payslip.period} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {payslip.period}
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
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {payslip.generatedOn}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row">
                            <IconButton size="small" sx={{ "&:hover": { color: "primary.main" } }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ "&:hover": { color: "primary.main" } }}>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ "&:hover": { color: "primary.main" } }}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Tab 4: Tax Summary */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Tax Summary — FY {mockTaxSummary.financialYear}
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Gross Annual Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(mockTaxSummary.grossAnnualIncome)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Exemptions & Deductions
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                      - {formatCurrency(mockTaxSummary.exemptionsAndDeductions)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      Net Taxable Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(mockTaxSummary.netTaxableIncome)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Tax Computation
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Tax Computed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(mockTaxSummary.taxComputed)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      TDS Deducted
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                      - {formatCurrency(mockTaxSummary.tdsDeducted)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                      Balance Tax Payable
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
                      {formatCurrency(mockTaxSummary.balanceTax)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            {dialogType === "payslip" && "Employee Payslip"}
            {dialogType === "bank" && "Update Bank Details"}
            {dialogType === "profile" && "Profile Settings"}
            {dialogType === "loan" && "Loan/Advance Request"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === "payslip" && employee && (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                  {employee.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {employee.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {employee.designation} · {employee.department}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="body2">Select period to view payslip:</Typography>
              {mockPayslips.map((p) => (
                <Button
                  key={p.period}
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: "space-between", textTransform: "none" }}
                >
                  <span>{p.period}</span>
                  <span>{formatCurrency(p.net)}</span>
                </Button>
              ))}
            </Stack>
          )}

          {dialogType === "bank" && (
            <Stack spacing={2}>
              <TextField
                label="Account Holder Name"
                placeholder="Enter account holder name"
                fullWidth
                size="small"
              />
              <TextField
                label="Account Number"
                placeholder="Enter account number"
                fullWidth
                size="small"
              />
              <TextField
                label="Bank Name"
                placeholder="Enter bank name"
                fullWidth
                size="small"
              />
              <TextField
                label="IFSC Code"
                placeholder="Enter IFSC code"
                fullWidth
                size="small"
              />
              <TextField
                label="Branch"
                placeholder="Enter branch name"
                fullWidth
                size="small"
              />
            </Stack>
          )}

          {dialogType === "loan" && (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Request Type</InputLabel>
                <Select value="loan" label="Request Type">
                  <MenuItem value="loan">Loan</MenuItem>
                  <MenuItem value="advance">Advance</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                fullWidth
                size="small"
              />
              <TextField
                label="Purpose"
                placeholder="Enter purpose"
                fullWidth
                size="small"
              />
              <TextField
                label="Tenure (Months)"
                type="number"
                placeholder="Enter tenure"
                fullWidth
                size="small"
              />
            </Stack>
          )}

          {dialogType === "profile" && (
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                placeholder="Enter full name"
                fullWidth
                size="small"
              />
              <TextField
                label="Email"
                placeholder="Enter email"
                fullWidth
                size="small"
              />
              <TextField
                label="Phone"
                placeholder="Enter phone number"
                fullWidth
                size="small"
              />
              <TextField
                label="Address"
                placeholder="Enter address"
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ textTransform: "none" }}>
            {dialogType === "payslip" ? "View" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}