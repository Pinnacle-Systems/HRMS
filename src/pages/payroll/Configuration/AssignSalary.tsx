import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  Stack,
  useTheme,
  alpha,
  Grid,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Upload as UploadIcon,
  Business as Building2Icon,
  Work as BriefcaseIcon,
  AttachMoney as DollarSignIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";

const PIE_COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#ec4899"];

// Mock data - replace with your actual API data
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", department: "Engineering", designation: "Senior Developer", grade: "L3" },
  { id: "EMP002", name: "Priya Sharma", department: "Sales", designation: "Sales Manager", grade: "L4" },
  { id: "EMP003", name: "Amit Patel", department: "HR", designation: "HR Executive", grade: "L2" },
  { id: "EMP004", name: "Sneha Reddy", department: "Finance", designation: "Finance Analyst", grade: "L3" },
  { id: "EMP005", name: "Vikram Singh", department: "Engineering", designation: "Team Lead", grade: "L4" },
  { id: "EMP006", name: "Ananya Gupta", department: "Marketing", designation: "Marketing Specialist", grade: "L2" },
  { id: "EMP007", name: "Deepak Jain", department: "Operations", designation: "Operations Manager", grade: "L4" },
  { id: "EMP008", name: "Kavya Nair", department: "Sales", designation: "Sales Executive", grade: "L1" },
];

const mockSalaryStructures = [
  { id: "1", name: "Standard L1 Structure" },
  { id: "2", name: "Standard L2 Structure" },
  { id: "3", name: "Executive L3 Structure" },
  { id: "4", name: "Leadership L4 Structure" },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AssignSalaryStructure() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ctcAmount, setCtcAmount] = useState<number>(0);
  const [ctcMode, setCtcMode] = useState<"annual" | "monthly">("annual");

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(mockEmployees.map((e) => e.department)));

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleAllEmployees = () => {
    setSelectedEmployees(
      selectedEmployees.length === filteredEmployees.length
        ? []
        : filteredEmployees.map((e) => e.id)
    );
  };

  const calculateBreakdown = () => {
    if (!selectedTemplate || ctcAmount === 0) return null;
    const annual = ctcMode === "monthly" ? ctcAmount * 12 : ctcAmount;
    const totalEarnings = annual * 0.9;
    const totalDeductions = annual * 0.1;
    return {
      earnings: [
        { name: "Basic", value: totalEarnings * 0.4 },
        { name: "HRA", value: totalEarnings * 0.25 },
        { name: "Special", value: totalEarnings * 0.25 },
        { name: "Transport", value: totalEarnings * 0.1 },
      ],
      deductions: [
        { name: "Provident Fund", value: totalDeductions * 0.6 },
        { name: "Professional Tax", value: totalDeductions * 0.4 },
      ],
      netMonthly: (totalEarnings - totalDeductions) / 12,
      grossMonthly: annual / 12,
    };
  };

  const breakdown = calculateBreakdown();
  const allData = breakdown ? [...breakdown.earnings, ...breakdown.deductions] : [];

  const currencyFormatter = (value: any): [string, string] => {
    if (typeof value === 'number') {
      return [formatCurrency(value), "Amount"];
    }
    return [String(value || 0), "Amount"];
  };

  const handleAssign = () => {
    if (selectedEmployees.length === 0) {
      return;
    }
    if (!selectedTemplate) {
      return;
    }
    if (ctcAmount === 0) {
      return;
    }
    // Toast notification would go here
    console.log(`Salary structure assigned to ${selectedEmployees.length} employee(s).`);
    setSelectedEmployees([]);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
          Assign Salary Structure
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Assign salary structures to employees individually or in bulk
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Employee selection */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Select Employees
                </Typography>
                {selectedEmployees.length > 0 && (
                  <Chip
                    icon={<CheckCircleIcon fontSize="small" />}
                    label={`${selectedEmployees.length} selected`}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>

              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
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
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="all">All Departments</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                            indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                            onChange={toggleAllEmployees}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Employee
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Department
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Designation
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Grade
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          hover
                          sx={{
                            cursor: "pointer",
                            bgcolor: selectedEmployees.includes(employee.id)
                              ? alpha(theme.palette.primary.main, 0.04)
                              : "transparent",
                            "&:hover": {
                              bgcolor: selectedEmployees.includes(employee.id)
                                ? alpha(theme.palette.primary.main, 0.08)
                                : alpha(theme.palette.primary.main, 0.02),
                            },
                          }}
                          onClick={() => toggleEmployeeSelection(employee.id)}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                                {employee.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {employee.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  {employee.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Building2Icon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2">{employee.department}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <BriefcaseIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2">{employee.designation}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={employee.grade} size="small" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button
                  variant="outlined"
                  startIcon={<UploadIcon fontSize="small" />}
                  sx={{ borderStyle: "dashed", textTransform: "none" }}
                  fullWidth
                >
                  Bulk Upload via CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Assignment details + breakdown */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Assignment Details
                </Typography>

                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Selected Employees
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedEmployees.length}
                    </Typography>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Salary Template *</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      label="Salary Template *"
                    >
                      {mockSalaryStructures.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      CTC Amount *
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        type="number"
                        value={ctcAmount || ""}
                        onChange={(e) => setCtcAmount(Number(e.target.value))}
                        placeholder="0"
                        size="small"
                        fullWidth
                      />
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={ctcMode}
                          onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly")}
                        >
                          <MenuItem value="annual">Annual</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  <Accordion
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Bank Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <TextField
                          label="Account Number"
                          placeholder="1234567890"
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Bank Name"
                          placeholder="HDFC Bank"
                          size="small"
                          fullWidth
                        />
                        <Grid container spacing={1}>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="IFSC Code"
                              placeholder="HDFC0001234"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <TextField
                              label="Branch"
                              placeholder="Mumbai"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Button
                    variant="contained"
                    startIcon={<DollarSignIcon fontSize="small" />}
                    onClick={handleAssign}
                    fullWidth
                    sx={{ textTransform: "none" }}
                  >
                    Assign Salary Structure
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {breakdown && (
              <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Salary Breakdown Preview
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Monthly estimates
                    </Typography>
                  </Box>

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          textAlign: "center",
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "success.main" }}>
                          Gross Monthly
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "success.main" }}>
                          {formatCurrency(breakdown.grossMonthly)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          textAlign: "center",
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "primary.main" }}>
                          Net Monthly
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatCurrency(breakdown.netMonthly)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={allData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allData.map((_entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={currencyFormatter} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>

                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {allData.map((item, i) => (
                      <Box
                        key={item.name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {item.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatCurrency(item.value / 12)}/mo
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}