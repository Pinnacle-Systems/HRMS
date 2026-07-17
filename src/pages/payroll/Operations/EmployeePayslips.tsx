import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Grid,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as EyeIcon,
  Receipt as ReceiptIcon,
  People as UsersIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", department: "Engineering", designation: "Senior Developer", ctc: 2400000 },
  { id: "EMP002", name: "Priya Sharma", department: "Sales", designation: "Sales Manager", ctc: 1800000 },
  { id: "EMP003", name: "Amit Patel", department: "HR", designation: "HR Executive", ctc: 1200000 },
  { id: "EMP004", name: "Sneha Reddy", department: "Finance", designation: "Finance Analyst", ctc: 1500000 },
  { id: "EMP005", name: "Vikram Singh", department: "Engineering", designation: "Team Lead", ctc: 3000000 },
  { id: "EMP006", name: "Ananya Gupta", department: "Marketing", designation: "Marketing Specialist", ctc: 1400000 },
  { id: "EMP007", name: "Deepak Jain", department: "Operations", designation: "Operations Manager", ctc: 2000000 },
  { id: "EMP008", name: "Kavya Nair", department: "Sales", designation: "Sales Executive", ctc: 1100000 },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const periods = ["May 2026", "Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026"];

const payslipData = mockEmployees.map((emp) => {
  const gross = Math.round(emp.ctc / 12);
  const pf = Math.round(emp.ctc * 0.4 / 12 * 0.12);
  const pt = 200;
  const net = gross - pf - pt;
  return { ...emp, gross, pf, pt, net, payDays: 30 };
});

export default function EmployeePayslips() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [period, setPeriod] = useState("May 2026");

  const departments = ["all", ...Array.from(new Set(mockEmployees.map((e) => e.department)))];

  const filtered = payslipData.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "all" || e.department === dept;
    return matchSearch && matchDept;
  });

  const totalGross = payslipData.reduce((s, e) => s + e.gross, 0);
  const totalNet = payslipData.reduce((s, e) => s + e.net, 0);

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Payslips
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            View and download payslips for all employees
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
        >
          Bulk Download
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { 
            label: "Total Employees", 
            value: payslipData.length.toString(),
            icon: <UsersIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.primary.main,
          },
          { 
            label: "Total Gross (Month)", 
            value: formatCurrency(totalGross),
            icon: <DollarSignIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.success.main,
          },
          { 
            label: "Total Net (Month)", 
            value: formatCurrency(totalNet),
            icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.primary.main,
          },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={s.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {s.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                      {period}
                    </Typography>
                  </Box>
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
                    {s.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search by name, ID, designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            displayEmpty
          >
            {periods.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            displayEmpty
            startAdornment={
              <FilterIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />
            }
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.filter(d => d !== "all").map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Employee
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Department
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Designation
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Pay Days
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Gross Salary
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Deductions
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Net Salary
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "text.secondary",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No employees match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{
                      transition: "background-color 0.2s",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
                      <Typography variant="body2">{emp.payDays}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(emp.gross)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "error.main" }}>
                        {formatCurrency(emp.pf + emp.pt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                        {formatCurrency(emp.net)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" >
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<EyeIcon fontSize="small" />}
                          onClick={() => navigate(`/payroll/payslips/${emp.id}/${encodeURIComponent(period)}`) }
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            color: "text.secondary",
                            "&:hover": {
                              color: "primary.main",
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          View
                        </Button>
                        <IconButton
                          size="small"
                          sx={{
                            color: "text.secondary",
                            "&:hover": {
                              color: "primary.main",
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}