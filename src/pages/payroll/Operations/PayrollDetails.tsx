import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
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
  Tab,
  Tabs,
  Avatar,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowLeftIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  People as UsersIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Description as FileTextIcon,
  BarChart as BarChart3Icon,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockPayrollRuns = [
  {
    id: "PR-2026-001",
    period: "June 2026",
    startDate: "01/06/2026",
    endDate: "30/06/2026",
    employeeCount: 248,
    grossSalary: 2850000,
    deductions: 450000,
    netSalary: 2400000,
    status: "processed",
    createdBy: "HR Admin",
    createdOn: "25 Jun 2026",
  },
];

const mockPayrollEmployeeBreakdown = [
  { employeeId: "EMP001", employeeName: "Rajesh Kumar", department: "Engineering", designation: "Senior Developer", grossSalary: 200000, deductions: 30000, netSalary: 170000 },
  { employeeId: "EMP002", employeeName: "Priya Sharma", department: "Sales", designation: "Sales Manager", grossSalary: 150000, deductions: 25000, netSalary: 125000 },
  { employeeId: "EMP003", employeeName: "Amit Patel", department: "HR", designation: "HR Executive", grossSalary: 100000, deductions: 15000, netSalary: 85000 },
  { employeeId: "EMP004", employeeName: "Sneha Reddy", department: "Finance", designation: "Finance Analyst", grossSalary: 125000, deductions: 20000, netSalary: 105000 },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const TABS = [
  { id: "breakdown", label: "Employee Breakdown", icon: UsersIcon },
  { id: "earnings", label: "Earnings", icon: TrendingUpIcon },
  { id: "deductions", label: "Deductions", icon: TrendingDownIcon },
  { id: "taxes", label: "Taxes", icon: BarChart3Icon },
  { id: "summary", label: "Summary", icon: FileTextIcon },
  { id: "history", label: "Approval History", icon: HistoryIcon },
];

const earningRows = [
  { name: "Basic Salary", total: 2520000, employees: 352 },
  { name: "House Rent Allowance", total: 1260000, employees: 352 },
  { name: "Conveyance Allowance", total: 563200, employees: 352 },
  { name: "Special Allowance", total: 985600, employees: 248 },
  { name: "Medical Allowance", total: 283200, employees: 227 },
];

const deductionRows = [
  { name: "Provident Fund (Employee)", total: 302400, employees: 352, rate: "12% of Basic" },
  { name: "Provident Fund (Employer)", total: 302400, employees: 352, rate: "12% of Basic" },
  { name: "Professional Tax", total: 70400, employees: 352, rate: "Slab" },
  { name: "Loan EMI", total: 245000, employees: 43, rate: "Fixed" },
  { name: "Advance Recovery", total: 118950, employees: 27, rate: "Fixed" },
];

const approvalHistory = [
  { step: "Payroll Generated", by: "Saravana Kumar", on: "06/05/2026 09:12 AM", status: "done" },
  { step: "Finance Review", by: "Murugan R", on: "06/05/2026 11:30 AM", status: "done" },
  { step: "Manager Approval", by: "Rajesh V", on: "06/05/2026 02:15 PM", status: "done" },
  { step: "Bank Transfer Initiated", by: "System", on: "07/05/2026 08:00 AM", status: "done" },
];

export default function PayrollDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("breakdown");

  const run = mockPayrollRuns.find((r) => r.id === id) ?? mockPayrollRuns[0];
  const isProcessed = run.status === "processed" || run.status === "approved";
  const [period, setPeriod] = useState("May 2026");

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <IconButton
            onClick={() => navigate("/payroll/runs")}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            <ArrowLeftIcon fontSize="small" />
          </IconButton>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {run.id}
              </Typography>
              <Chip
                icon={<CheckCircleIcon fontSize="small" />}
                label={run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                sx={{
                  bgcolor: isProcessed ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                  color: isProcessed ? theme.palette.success.main : theme.palette.warning.main,
                  fontWeight: 500,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Payroll Period: {run.period} &nbsp;|&nbsp; {run.startDate} – {run.endDate} &nbsp;|&nbsp; Created by {run.createdBy}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Download Report
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Approve Payroll
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Employees Processed", value: run.employeeCount.toLocaleString(), icon: UsersIcon, color: theme.palette.primary.main },
          { label: "Gross Salary", value: formatCurrency(run.grossSalary), icon: TrendingUpIcon, color: theme.palette.success.main },
          { label: "Total Deductions", value: formatCurrency(run.deductions), icon: TrendingDownIcon, color: theme.palette.error.main },
          { label: "Net Payable", value: formatCurrency(run.netSalary), icon: CheckCircleIcon, color: theme.palette.primary.main },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={s.label}>
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
                    bgcolor: alpha(s.color, 0.1),
                    color: s.color,
                  }}
                >
                  <s.icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {s.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 48,
              px: 2,
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon fontSize="small" />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === "breakdown" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Employee Salary Breakdown
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon fontSize="small" />}
                sx={{ textTransform: "none" }}
              >
                Export All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Employee ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Department
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Designation
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Gross
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Deductions
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Net
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Payslip
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPayrollEmployeeBreakdown.map((emp) => (
                    <TableRow key={emp.employeeId} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.main" }}>
                          {emp.employeeId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: "primary.main",
                              fontSize: "0.65rem",
                              fontWeight: 600,
                            }}
                          >
                            {emp.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {emp.employeeName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {emp.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {emp.designation}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(emp.grossSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: "error.main" }}>
                          {formatCurrency(emp.deductions)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(emp.netSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<FileTextIcon fontSize="small" />}
                        //   onClick={() => navigate(`payroll/payslips/${emp.employeeId}/May 2026`)}
                          onClick={() => navigate(`/payroll/payslips/${emp.employeeId}/${encodeURIComponent(period)}`) }
                          sx={{ textTransform: "none", fontSize: "0.7rem" }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "earnings" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Earnings Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Component
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Employees
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Total Amount
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Avg per Employee
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningRows.map((r) => (
                    <TableRow key={r.name} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{r.employees}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(r.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {formatCurrency(Math.round(r.total / r.employees))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Earnings
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        352
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(earningRows.reduce((s, r) => s + r.total, 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {formatCurrency(Math.round(earningRows.reduce((s, r) => s + r.total, 0) / 352))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "deductions" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Deductions Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Component
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Rate / Rule
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Employees
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                      Total Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductionRows.map((r) => (
                    <TableRow key={r.name} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {r.rate}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{r.employees}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                          {formatCurrency(r.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Deductions
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                        {formatCurrency(deductionRows.reduce((s, r) => s + r.total, 0))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "taxes" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { label: "Income Tax (TDS)", value: formatCurrency(85000) },
                { label: "Professional Tax", value: formatCurrency(70400) },
                { label: "PF (Employer Share)", value: formatCurrency(302400) },
              ].map((t) => (
                <Grid size={{ xs: 12, sm: 4 }} key={t.label}>
                  <Paper
                    sx={{
                      p: 2.5,
                      textAlign: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {t.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Detailed tax computation per employee is available in the Employee Breakdown tab. 
              Tax summary is based on declared investments as of the payroll date.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === "summary" && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Payroll Summary
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: "Period", value: run.period },
                    { label: "Total Employees", value: run.employeeCount.toString() },
                    { label: "Gross Payable", value: formatCurrency(run.grossSalary) },
                    { label: "Total Deductions", value: formatCurrency(run.deductions) },
                    { label: "Net Payable", value: formatCurrency(run.netSalary) },
                    { label: "Payment Date", value: run.endDate },
                    { label: "Status", value: run.status.toUpperCase() },
                  ].map((r) => (
                    <Box
                      key={r.label}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {r.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {r.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Department Distribution
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { dept: "Production", count: 142, net: 1520000 },
                    { dept: "Maintenance", count: 89, net: 830000 },
                    { dept: "QA / QC", count: 68, net: 620000 },
                    { dept: "HR & Admin", count: 24, net: 380000 },
                    { dept: "Sales & Mktg", count: 21, net: 290000 },
                    { dept: "Others", count: 8, net: 175000 },
                  ].map((d) => (
                    <Box
                      key={d.dept}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {d.dept}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          ({d.count} emp)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                        {formatCurrency(d.net)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === "history" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={0}>
              {approvalHistory.map((h, i) => (
                <Box key={h.step} sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        border: `2px solid ${theme.palette.success.main}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                    </Box>
                    {i < approvalHistory.length - 1 && (
                      <Box sx={{ width: 2, height: 40, bgcolor: alpha(theme.palette.success.main, 0.3) }} />
                    )}
                  </Box>
                  <Box sx={{ pb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {h.step}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                      By <strong>{h.by}</strong> — {h.on}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}