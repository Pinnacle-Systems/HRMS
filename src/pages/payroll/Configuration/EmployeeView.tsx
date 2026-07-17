import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
  Avatar,
  Badge,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Grid,
  useTheme,
  alpha,
  Stack,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarSignIcon,
  Description as FileTextIcon,
  CreditCard as CreditCardIcon,
  Lightbulb as LightbulbIcon,
  Favorite as HeartIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock data - replace with your actual API data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", designation: "Senior Developer", department: "Engineering", ctc: 2400000, grade: "A", employmentType: "Permanent" },
  { id: "EMP002", name: "Priya Sharma", designation: "Sales Manager", department: "Sales", ctc: 1800000, grade: "B", employmentType: "Permanent" },
  { id: "EMP003", name: "Amit Patel", designation: "HR Executive", department: "HR", ctc: 1200000, grade: "C", employmentType: "Permanent" },
];

const payslip = {
  grossSalary: 200000,
  netSalary: 140000,
  ytdEarnings: 1200000,
  ytdDeductions: 360000,
  earnings: [
    { name: "Basic Salary", amount: 80000 },
    { name: "HRA", amount: 40000 },
    { name: "Conveyance", amount: 1600 },
    { name: "Special Allowance", amount: 78400 },
  ],
  deductions: [
    { name: "PF", amount: 9600 },
    { name: "Professional Tax", amount: 200 },
    { name: "Income Tax", amount: 50000 },
  ],
};

const mockTaxDeclarations = [
  { financialYear: "2025-26", totalDeductions: 200000, section80C: 150000, section80D: 25000, hra: 120000, homeLoanInterest: 100000 },
];

const mockDeductions = [
  { id: "DED001", employeeId: "EMP001", type: "loan", name: "Car Loan", amount: 10000, installments: 12 },
  { id: "DED002", employeeId: "EMP001", type: "advance", name: "Festival Advance", amount: 5000, installments: 6 },
  { id: "DED003", employeeId: "EMP002", type: "loan", name: "Home Loan", amount: 15000, installments: 24 },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const months = ["June 2026", "May 2026", "April 2026", "March 2026", "February 2026", "January 2026"];

const monthlyTrend = [
  { month: "Jan", earnings: 76600, deductions: 30000, net: 46600 },
  { month: "Feb", earnings: 76600, deductions: 30000, net: 46600 },
  { month: "Mar", earnings: 76600, deductions: 30000, net: 46600 },
  { month: "Apr", earnings: 76600, deductions: 30000, net: 46600 },
  { month: "May", earnings: 76600, deductions: 30000, net: 46600 },
  { month: "Jun", earnings: 76600, deductions: 30000, net: 46600 },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`salary-tabpanel-${index}`}
      aria-labelledby={`salary-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeSalaryView() {
  const theme = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState(mockEmployees[0].id);
  const [tabValue, setTabValue] = useState(0);
  
  const employee = mockEmployees.find((e) => e.id === selectedEmployee);
  const taxDeclaration = mockTaxDeclarations[0];
  const employeeDeductions = mockDeductions.filter((d) => d.employeeId === selectedEmployee);

  if (!employee) return null;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const currencyFormatter = (value: any): [string, string] => {
  if (typeof value === 'number') {
    return [formatCurrency(value), "Amount"];
  }
  return [String(value || 0), "Amount"];
};

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Salary View
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Salary structure, payroll history, loans, and tax summary
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              displayEmpty
            >
              {mockEmployees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Download Payslip
          </Button>
        </Box>
      </Box>

      {/* Employee Profile Card */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            >
              {employee.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {employee.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {employee.designation} · {employee.department}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Chip label={employee.id} size="small" variant="outlined" />
                <Chip label={`Grade ${employee.grade}`} size="small" variant="outlined" />
                <Chip label={employee.employmentType} size="small" variant="outlined" />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 4, textAlign: "right", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Annual CTC
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(employee.ctc)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Monthly Gross
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                  {formatCurrency(payslip.grossSalary)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Monthly Net
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatCurrency(payslip.netSalary)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="salary tabs">
          <Tab label="Current Structure" />
          <Tab label="Payroll History" />
          <Tab label="Loans & Advances" />
          <Tab label="Tax Summary" />
        </Tabs>
      </Box>

      {/* Tab 1: Structure */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: "success.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Earnings
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {payslip.earnings.map((earning, index) => (
                    <Box key={index}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.04) } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Tooltip title="Taxable component · Monthly">
                            <InfoIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          </Tooltip>
                          <Typography variant="body2">{earning.name}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(earning.amount)}
                        </Typography>
                      </Box>
                      {index < payslip.earnings.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      mt: 1,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      fontWeight: 600,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Gross Salary
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(payslip.grossSalary)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DollarSignIcon sx={{ color: "error.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Deductions
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {payslip.deductions.map((deduction, index) => (
                    <Box key={index}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.04) } }}>
                        <Typography variant="body2">{deduction.name}</Typography>
                        <Typography variant="body2" sx={{ color: "error.main" }}>
                          - {formatCurrency(deduction.amount)}
                        </Typography>
                      </Box>
                      {index < payslip.deductions.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      mt: 1,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      fontWeight: 600,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Total Deductions
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                      - {formatCurrency(payslip.deductions.reduce((s, d) => s + d.amount, 0))}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Net Take-Home Salary
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  After all deductions · Credited on 5th every month
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                {formatCurrency(payslip.netSalary)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 2: History */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {[
            { label: "YTD Earnings", value: payslip.ytdEarnings, color: "success.main", bgColor: alpha(theme.palette.success.main, 0.08) },
            { label: "YTD Deductions", value: payslip.ytdDeductions, color: "error.main", bgColor: alpha(theme.palette.error.main, 0.08) },
            { label: "YTD Net Pay", value: payslip.ytdEarnings - payslip.ytdDeductions, color: "primary.main", bgColor: alpha(theme.palette.primary.main, 0.08) },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
              <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", bgcolor: item.bgColor }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                    {formatCurrency(item.value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Monthly Trend (Jan – Jun 2026)
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <ReTooltip  formatter={currencyFormatter}  />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="earnings" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} name="Earnings" />
                <Line type="monotone" dataKey="deductions" stroke={theme.palette.error.main} strokeWidth={2} dot={{ r: 3 }} name="Deductions" />
                <Line type="monotone" dataKey="net" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 3 }} name="Net Pay" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Monthly Payslips
            </Typography>
            <Stack spacing={1}>
              {months.map((month) => (
                <Box
                  key={month}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    borderRadius: 1,
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    transition: "background-color 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: theme.palette.grey[100],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileTextIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {month}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Net: {formatCurrency(payslip.netSalary)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<DownloadIcon fontSize="small" />}
                    sx={{ textTransform: "none", fontSize: "0.75rem" }}
                  >
                    PDF
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Loans */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Active Loans & Advances
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">EMI / Month</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Remaining</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeDeductions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No loans or advances
                      </TableCell>
                    </TableRow>
                  ) : employeeDeductions.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Chip label={d.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {d.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(d.amount * (d.installments || 1))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(d.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {d.installments ? `${d.installments - 5} months` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        {d.installments ? (
                          <Box>
                            <LinearProgress
                              variant="determinate"
                              value={(5 / d.installments) * 100}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {Math.round((5 / d.installments) * 100)}% repaid
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              EMI Payment History
            </Typography>
            <Stack spacing={1}>
              {["June 2026", "May 2026", "April 2026", "March 2026"].map((month) => (
                <Box
                  key={month}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    borderRadius: 1,
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CreditCardIcon sx={{ fontSize: 14, color: "success.main" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {month}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        All EMIs processed
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Paid" size="small" color="success" sx={{ fontSize: "0.7rem" }} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Tax */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Tax Computation — FY {taxDeclaration.financialYear}
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Gross Annual Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(employee.ctc)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Total Exemptions & Deductions
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                      - {formatCurrency(taxDeclaration.totalDeductions)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      fontWeight: 600,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      Net Taxable Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(employee.ctc - taxDeclaration.totalDeductions)}
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
                  Tax-saving Investments
                </Typography>
                <Stack spacing={2}>
                  {[
                    { label: "Section 80C", value: taxDeclaration.section80C, max: 150000 },
                    { label: "Section 80D", value: taxDeclaration.section80D, max: 25000 },
                    { label: "HRA Exemption", value: taxDeclaration.hra, max: null },
                    { label: "Home Loan Interest", value: taxDeclaration.homeLoanInterest, max: 200000 },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(item.value)}
                        </Typography>
                      </Box>
                      {item.max && (
                        <LinearProgress
                          variant="determinate"
                          value={(item.value / item.max) * 100}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Tax-saving Suggestions
            </Typography>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 2,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LightbulbIcon sx={{ fontSize: 16, color: "info.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "info.main" }}>
                    Maximize Section 80C
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    You can invest an additional {formatCurrency(150000 - taxDeclaration.section80C)} in ELSS, PPF, or NPS to reach the ₹1.5L limit.
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 2,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <HeartIcon sx={{ fontSize: 16, color: "success.main" }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                    Health Insurance (80D)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Consider increasing health insurance coverage for additional 80D deduction up to ₹25,000.
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}