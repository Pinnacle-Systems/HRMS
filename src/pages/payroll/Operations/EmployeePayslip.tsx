import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowLeftIcon,
  Download as DownloadIcon,
  Print as PrinterIcon,
  Business as Building2Icon,
  Phone as PhoneIcon,
  Email as MailIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", designation: "Senior Developer", department: "Engineering", ctc: 2400000, joiningDate: "15 Jan 2020", employmentType: "Permanent" },
  { id: "EMP002", name: "Priya Sharma", designation: "Sales Manager", department: "Sales", ctc: 1800000, joiningDate: "01 Jun 2021", employmentType: "Permanent" },
];

const mockPayslips = [
  {
    id: "PS001",
    employeeId: "EMP001",
    period: "May 2026",
    grossSalary: 200000,
    netSalary: 140000,
    earnings: [{ name: "Basic Salary", amount: 80000 }],
    deductions: [{ name: "PF", amount: 9600 }],
  },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function EmployeePayslip() {
  const { empId, period } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const employee = mockEmployees.find((e) => e.id === empId) ?? mockEmployees[0];
  const payslip = mockPayslips[0];

  const decodedPeriod = period ? decodeURIComponent(period) : "May 2026";

  const basic = Math.round(employee.ctc * 0.4 / 12);
  const hra = Math.round(basic * 0.5);
  const conv = 1600;
  const special = Math.round(employee.ctc / 12) - basic - hra - conv;
  const gross = basic + hra + conv + Math.max(0, special);
  const pf = Math.round(basic * 0.12);
  const pt = 200;
  const loan = empId === "EMP001" ? 1170 : 0;
  const totalDeductions = pf + pt + loan;
  const net = gross - totalDeductions;

  const earnings = [
    { name: "Basic Salary", amount: basic },
    { name: "House Rent Allowance", amount: hra },
    { name: "Conveyance Allowance", amount: conv },
    { name: "Special Allowance", amount: Math.max(0, special) },
  ];

  const deductions = [
    { name: "Provident Fund (Employee)", amount: pf },
    { name: "Professional Tax", amount: pt },
    ...(loan > 0 ? [{ name: "Loan EMI Recovery", amount: loan }] : []),
  ];

  const employeeInfo = [
    ["Employee ID", employee.id],
    ["Employee Name", employee.name],
    ["Designation", employee.designation],
    ["Department", employee.department],
    ["Date of Joining", employee.joiningDate],
    ["Employment Type", employee.employmentType],
    ["UAN Number", "101523456789"],
    ["PAN Number", "ABCDE1234F"],
    ["PF Account No.", "TN/CHN/12345/01"],
    ["Pay Days", "30"],
    ["LOP Days", "0"],
    ["Pay Date", "05/06/2026"],
  ];

  const taxDetails = [
    ["Annual CTC", formatCurrency(employee.ctc)],
    ["Taxable Income (Est.)", formatCurrency(Math.round(employee.ctc * 0.6))],
    ["TDS This Month", "₹0"],
    ["PF (Employer Share)", formatCurrency(pf)],
    ["ESI Applicable", "No"],
    ["Tax Regime", "New Regime"],
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeftIcon fontSize="small" />}
          onClick={() => navigate("/payroll/payslips")}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrinterIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Payslip Document */}
      <Paper
        sx={{
          maxWidth: 900,
          mx: "auto",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Company Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            bgcolor: "primary.main",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.common.white, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2Icon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
                SRG Engineering Works
              </Typography>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                Industrial Component Manufacturing
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", color: alpha(theme.palette.common.white, 0.8) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
              <MailIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption">hr@srgengineering.com</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
              <PhoneIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption">+91 44 2345 6789</Typography>
            </Box>
          </Box>
        </Box>

        {/* Pay Slip Title Bar */}
        <Box
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "primary.main" }}
          >
            Pay Slip
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            For the Month of <strong>{decodedPeriod}</strong>
          </Typography>
        </Box>

        {/* Employee Info Grid */}
        <Box sx={{ px: 4, py: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2}>
            {employeeInfo.map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Earnings & Deductions */}
        <Box sx={{ px: 4, py: 3 }}>
          <Grid container spacing={4}>
            {/* Earnings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Earnings
              </Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: "success.main" }}>
                      Component
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.7rem", color: "success.main" }}>
                      Amount (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings.map((e, i) => (
                    <TableRow key={e.name} sx={{ bgcolor: i % 2 === 0 ? alpha(theme.palette.grey[500], 0.04) : "transparent" }}>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{e.name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
                        {formatCurrency(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: `2px solid ${theme.palette.success.main}`, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700, color: "success.main" }}>Gross Salary</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(gross)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>

            {/* Deductions */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" sx={{ color: "error.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Deductions
              </Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: "error.main" }}>
                      Component
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.7rem", color: "error.main" }}>
                      Amount (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductions.map((d, i) => (
                    <TableRow key={d.name} sx={{ bgcolor: i % 2 === 0 ? alpha(theme.palette.grey[500], 0.04) : "transparent" }}>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{d.name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 500, color: "error.main" }}>
                        {formatCurrency(d.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: `2px solid ${theme.palette.error.main}`, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700, color: "error.main" }}>Total Deductions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>
                      {formatCurrency(totalDeductions)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </Box>

        {/* Tax Details */}
        <Box sx={{ px: 4, pb: 2 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tax Details
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 1,
            }}
          >
            <Grid container spacing={1.5}>
              {taxDetails.map(([label, value]) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Net Pay Banner */}
        <Box
          sx={{
            mx: 4,
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: theme.palette.success.main,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.8), fontWeight: 500, textTransform: "uppercase" }}>
              Net Pay (Take Home)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "white", mt: 0.5 }}>
              {formatCurrency(net)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", color: alpha(theme.palette.common.white, 0.8) }}>
            <Typography>Gross: {formatCurrency(gross)}</Typography>
            <Typography>Deductions: {formatCurrency(totalDeductions)}</Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 4,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            This is a system-generated payslip and does not require a signature.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}