import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  LinearProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Add as PlusIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as DollarSignIcon,
  Warning as AlertTriangleIcon,
  Person as UserIcon,
  Edit as EditIcon,
  Block as BanIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";

const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

// Mock data - replace with your actual API data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", designation: "Senior Developer", department: "Engineering", ctc: 2400000 },
  { id: "EMP002", name: "Priya Sharma", designation: "Sales Manager", department: "Sales", ctc: 1800000 },
  { id: "EMP003", name: "Amit Patel", designation: "HR Executive", department: "HR", ctc: 1200000 },
];

const mockDeductions = [
  { id: "DED001", employeeId: "EMP001", type: "loan", name: "Home Loan EMI", amount: 15000, installments: 60, startDate: new Date("2024-01-15"), status: "active" },
  { id: "DED002", employeeId: "EMP001", type: "advance", name: "Festival Advance", amount: 5000, installments: 6, startDate: new Date("2025-05-01"), status: "active" },
  { id: "DED003", employeeId: "EMP002", type: "loan", name: "Car Loan EMI", amount: 10000, installments: 36, startDate: new Date("2024-06-10"), status: "active" },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const typeLabels: Record<string, string> = {
  loan: "Loan EMI",
  advance: "Advance",
  canteen: "Canteen",
  other: "Other",
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "#10b981", bgColor: "#d1fae5" },
  completed: { label: "Completed", color: "#6b7280", bgColor: "#f3f4f6" },
  stopped: { label: "Stopped", color: "#ef4444", bgColor: "#fee2e2" },
};

const deductionPieData = [
  { name: "Loans", value: 25000 },
  { name: "Advances", value: 5000 },
  { name: "Canteen", value: 3000 },
];

export default function DeductionConfiguration() {
  const theme = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState(mockEmployees[0].id);
  const [deductions, setDeductions] = useState(mockDeductions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    type: "loan",
    name: "",
    amount: 0,
    installments: 0,
    interestRate: 0,
    status: "active",
    frequency: "monthly",
  });

  const employee = mockEmployees.find((e) => e.id === selectedEmployee);
  const employeeDeductions = deductions.filter((d) => d.employeeId === selectedEmployee);
  const totalMonthlyDeduction = employeeDeductions.reduce((sum, d) => sum + d.amount, 0);

  const currencyFormatter = (value: any): [string, string] => {
    if (typeof value === 'number') {
      return [formatCurrency(value), "Amount"];
    }
    return [String(value || 0), "Amount"];
  };

  const handleAddDeduction = () => {
    if (!formData.name || !formData.amount) {
      return;
    }
    const newDeduction = {
      ...formData,
      id: `D${Date.now()}`,
      employeeId: selectedEmployee,
      startDate: new Date(),
    };
    setDeductions([...deductions, newDeduction]);
    setIsDialogOpen(false);
    setFormData({ type: "loan", name: "", amount: 0, installments: 0, interestRate: 0, status: "active", frequency: "monthly" });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({ type: "loan", name: "", amount: 0, installments: 0, interestRate: 0, status: "active", frequency: "monthly" });
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Deduction Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Manage employee loans, advances, and recurring deductions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon fontSize="small" />}
          onClick={() => setIsDialogOpen(true)}
          sx={{ textTransform: "none" }}
        >
          Add Deduction
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Employee Selector */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 0 }}>
                    Select Employee:
                  </Typography>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      {mockEmployees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.name} — {emp.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>

            {/* Employee Context Card */}
            {employee && (
              <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        fontSize: "1rem",
                        fontWeight: 700,
                      }}
                    >
                      {employee.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {employee.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {employee.designation} · {employee.department}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Annual CTC
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {formatCurrency(employee.ctc)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Deductions Table */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Active Deductions
                </Typography>
                <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Type
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Name
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">
                          Monthly Amount
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Progress
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Started
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeDeductions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <TrendingDownIcon sx={{ fontSize: 32, color: "text.secondary", mb: 1, opacity: 0.3 }} />
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              No deductions configured for this employee
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeeDeductions.map((d) => {
                          const status = statusConfig[d.status] || statusConfig.active;
                          return (
                            <TableRow key={d.id} hover>
                              <TableCell>
                                <Chip
                                  label={typeLabels[d.type] || d.type}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {d.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(d.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ minWidth: 120 }}>
                                {d.installments ? (
                                  <Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={(5 / d.installments) * 100}
                                      sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                    />
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                      5 of {d.installments} paid
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Recurring
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                  {formatDate(d.startDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={status.label}
                                  size="small"
                                  sx={{
                                    bgcolor: status.bgColor,
                                    color: status.color,
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
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
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: "text.secondary",
                                      "&:hover": {
                                        color: "error.main",
                                        bgcolor: alpha(theme.palette.error.main, 0.08),
                                      },
                                    }}
                                  >
                                    <BanIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DollarSignIcon sx={{ color: "primary.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Deduction Summary
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "error.main" }}>
                      Total Monthly Deduction
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
                      {formatCurrency(totalMonthlyDeduction)}
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          textAlign: "center",
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Active
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {employeeDeductions.filter(d => d.status === "active").length}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          textAlign: "center",
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {employeeDeductions.length}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingDownIcon sx={{ color: "primary.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Distribution
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={deductionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deductionPieData.map((_e, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={currencyFormatter} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {deductionPieData.map((item, i) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.value)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Alert
              severity="warning"
              icon={<AlertTriangleIcon />}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              }}
            >
              <AlertTitle sx={{ fontWeight: 600 }}>Important Note</AlertTitle>
              Deductions are automatically processed during payroll. Verify all amounts before saving.
            </Alert>
          </Stack>
        </Grid>
      </Grid>

      {/* Add Deduction Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Add New Deduction
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Configure a deduction for {employee?.name}
          </Typography>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Deduction Type *</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Deduction Type *"
                  >
                    <MenuItem value="loan">Loan EMI</MenuItem>
                    <MenuItem value="advance">Salary Advance</MenuItem>
                    <MenuItem value="canteen">Canteen</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Deduction Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Home Loan EMI"
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            {formData.type === "loan" && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Principal Amount"
                    type="number"
                    placeholder="500000"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Interest Rate (%)"
                    type="number"
                    value={formData.interestRate || ""}
                    onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                    placeholder="8.5"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Tenure (months)"
                    type="number"
                    value={formData.installments || ""}
                    onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
                    placeholder="60"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="EMI Amount *"
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="10000"
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            )}

            {formData.type === "advance" && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Advance Amount *"
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="50000"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Repayment Installments"
                    type="number"
                    value={formData.installments || ""}
                    onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
                    placeholder="10"
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            )}

            {(formData.type === "canteen" || formData.type === "other") && (
              <TextField
                label="Monthly Amount *"
                type="number"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="3000"
                fullWidth
                size="small"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleAddDeduction} variant="contained" sx={{ textTransform: "none" }}>
            Add Deduction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}