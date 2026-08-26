import { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Fade,
  Slide,
  Grow,
} from "@mui/material";
import {
  AttachMoney as DollarSignIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  AssessmentOutlined,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  AddCircle,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { assignmentService } from "../../../services/modules/payrollServices/salaryAssignments";
import { salaryStructureService } from "../../../services/modules/payrollServices/salarystructure";
import { employeeService } from "../../../services/modules/employees";
import { useUI } from "../../../context/Snackbar";
import { dialogsx, selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { useNavigate } from "react-router-dom";
// import { Cell, Pie, PieChart, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Legend } from "recharts";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "#10b981", bgColor: "#d1fae5" },
  inactive: { label: "Inactive", color: "#6b7280", bgColor: "#f3f4f6" },
  pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
  expired: { label: "Expired", color: "#ef4444", bgColor: "#fee2e2" },
};

// Helper to get value display based on calculation type
const getValueDisplay = (calculationType: string, value: number) => {
  switch (calculationType) {
    case "FIXED_AMOUNT":
      return formatCurrency(value);
    case "PERCENT_OF_BASIC":
      return `${value}% of Basic`;
    case "PERCENT_OF_CTC":
      return `${value}% of CTC`;
    case "PERCENTAGE":
      return `${value}%`;
    case "SLAB_BASED":
      return value > 0 ? `₹${value}/month` : "Slab Based";
    case "FORMULA":
      return "Formula";
    default:
      return `${value}%`;
  }
};

// const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export default function AssignSalaryStructure() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const navigate = useNavigate();

  // State for assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tabValue, setTabValue] = useState(0);
  // const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [activeStep, setActiveStep] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Dialog states
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ctcAmount, setCtcAmount] = useState<number>(0);
  const [ctcMode, setCtcMode] = useState<"annual" | "monthly">("annual");
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branch: "",
  });
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [page, limit, statusFilter, searchTerm]);

  // Auto-navigate to breakdown tab when all required fields are filled
  // useEffect(() => {
  //   if (selectedEmployees.length > 0 && selectedTemplate && ctcAmount > 0 && selectedTemplateDetails) {
  //     setShowBreakdown(true);
  //     setActiveStep(1);
  //   }
  // }, [selectedEmployees, selectedTemplate, ctcAmount, selectedTemplateDetails]);

  const loadData = async () => {
    showSpinner();
    try {
      const [employeesRes, structuresRes]: any = await Promise.all([
        employeeService.getEmployees({ size: 1000, includeInactive: false }),
        salaryStructureService.getSalaryStructures({ status: "PUBLISHED", size: 100 }),
      ]);
      setEmployees(employeesRes.data?.content || []);
      setStructures(structuresRes.data?.content || []);
    } catch (error) {
      showSnackbar("Failed to load data", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadAssignments = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
        sort: "createdAt,desc",
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter.toUpperCase();

      const res: any = await assignmentService.getAssignments(params);
      setAssignments(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalCount(res.data?.totalElements || 0);
    } catch (error) {
      showSnackbar("Failed to load assignments", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadAssignmentHistory = async (employeeId: string) => {
    showSpinner();
    try {
      const res: any = await assignmentService.getEmployeeAssignmentHistory(employeeId);
      setAssignmentHistory(res.data || []);
    } catch (error) {
      showSnackbar("Failed to load assignment history", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleViewAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  const handleViewHistory = async (employeeId: string) => {
    await loadAssignmentHistory(employeeId);
    setOpenHistoryDialog(true);
  };

  const departments = ["all", ...Array.from(new Set(employees.map((e) => e.department)))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e.id));
    }
  };

  const fetchTemplateDetails = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateDetails(null);
      return;
    }

    showSpinner();
    try {
      const res: any = await salaryStructureService.getSalaryStructureById(templateId);
      setSelectedTemplateDetails(res.data);
    } catch (error) {
      showSnackbar("Failed to load template details", "error");
      setSelectedTemplateDetails(null);
    } finally {
      hideSpinner();
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      fetchTemplateDetails(templateId);
      setCtcAmount(0);
    } else {
      setSelectedTemplateDetails(null);
      setCtcAmount(0);
    }
  };

  /**
   * Calculate breakdown based on user-entered CTC
   */
  const calculateBreakdown = () => {
    if (!selectedTemplateDetails || !selectedTemplate || ctcAmount === 0) return null;

    const userMonthlyCtc = ctcMode === "monthly" ? ctcAmount : ctcAmount / 12;
    const templateEarnings = selectedTemplateDetails.earnings || [];
    const templateDeductions = selectedTemplateDetails.deductions || [];

    // Find Basic component
    const basicComponent = templateEarnings.find(
      (e: any) =>
        e.componentCode === "BS001" ||
        e.componentCode === "BASIC" ||
        e.componentName?.toLowerCase() === "basic"
    );

    // Calculate Basic amount
    let basicAmount = 0;
    if (basicComponent) {
      if (basicComponent.calculationType === "PERCENT_OF_CTC" || basicComponent.calculationType === "PERCENTAGE") {
        basicAmount = (basicComponent.value / 100) * userMonthlyCtc;
      } else if (basicComponent.calculationType === "FIXED_AMOUNT") {
        basicAmount = basicComponent.value || 0;
      }
    }

    // First pass: Calculate all earnings except Special Allowance
    const calculatedEarnings = templateEarnings
      .filter((e: any) => !isSpecialAllowance(e.componentName))
      .map((earning: any) => {
        let monthlyValue = 0;
        let percentageOfCTC = 0;

        switch (earning.calculationType) {
          case "PERCENT_OF_CTC":
            monthlyValue = (earning.value / 100) * userMonthlyCtc;
            percentageOfCTC = earning.value; // e.g., 30%
            break;
          case "PERCENT_OF_BASIC":
            monthlyValue = (earning.value / 100) * basicAmount;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
            break;
          case "FIXED_AMOUNT":
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
            break;
          case "PERCENTAGE":
            monthlyValue = (earning.value / 100) * userMonthlyCtc;
            percentageOfCTC = earning.value;
            break;
          case "SLAB_BASED":
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
            break;
          case "FORMULA":
            monthlyValue = earning.computedMonthlyAmount || earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
            break;
          default:
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
        }

        return {
          id: earning.id,
          componentId: earning.componentId,
          componentCode: earning.componentCode,
          componentName: earning.componentName,
          calculationType: earning.calculationType,
          value: earning.value,
          monthlyValue: monthlyValue,
          annualValue: monthlyValue * 12,
          percentageOfCTC: percentageOfCTC,
        };
      });

    // Calculate total percentage used by all other earnings
    const totalPercentageUsed = calculatedEarnings.reduce(
      (sum: number, e: any) => sum + e.percentageOfCTC, 0
    );

    // Calculate Special Allowance balance percentage
    const specialAllowancePercentage = 100 - totalPercentageUsed;
    const specialAllowanceAmount = userMonthlyCtc * (specialAllowancePercentage / 100);

    // Find Special Allowance component
    const specialAllowanceComponent = templateEarnings.find(
      (e: any) => isSpecialAllowance(e.componentName)
    );

    // Build final earnings array with Special Allowance
    let allEarnings = [...calculatedEarnings];

    if (specialAllowanceComponent) {
      allEarnings.push({
        id: specialAllowanceComponent.id,
        componentId: specialAllowanceComponent.componentId,
        componentCode: specialAllowanceComponent.componentCode || "SPL",
        componentName: specialAllowanceComponent.componentName || "Special Allowance",
        calculationType: "PERCENT_OF_CTC",
        value: specialAllowancePercentage, // Store the percentage
        monthlyValue: specialAllowanceAmount,
        annualValue: specialAllowanceAmount * 12,
        percentageOfCTC: specialAllowancePercentage,
        isSpecialAllowance: true,
      });
    } else {
      // If no Special Allowance component exists, check if we need to add one
      // This handles the case where the template doesn't have a Special Allowance component
      if (Math.abs(specialAllowanceAmount) > 0.01) {
        allEarnings.push({
          id: "SPL",
          componentId: "SPL",
          componentCode: "SPL",
          componentName: "Special Allowance",
          calculationType: "PERCENT_OF_CTC",
          value: specialAllowancePercentage,
          monthlyValue: specialAllowanceAmount,
          annualValue: specialAllowanceAmount * 12,
          percentageOfCTC: specialAllowancePercentage,
          isSpecialAllowance: true,
        });
      }
    }

    // Now calculate deductions
    const scaledDeductions = templateDeductions.map((deduction: any) => {
      let monthlyValue = 0;
      let percentageOfCTC = 0;

      switch (deduction.calculationType) {
        case "PERCENT_OF_BASIC":
          monthlyValue = (deduction.value / 100) * basicAmount;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
          break;
        case "PERCENT_OF_CTC":
          monthlyValue = (deduction.value / 100) * userMonthlyCtc;
          percentageOfCTC = deduction.value;
          break;
        case "FIXED_AMOUNT":
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
          break;
        case "PERCENTAGE":
          monthlyValue = (deduction.value / 100) * userMonthlyCtc;
          percentageOfCTC = deduction.value;
          break;
        case "SLAB_BASED":
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
          break;
        default:
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
      }

      return {
        id: deduction.id,
        componentId: deduction.componentId,
        componentCode: deduction.componentCode,
        componentName: deduction.componentName,
        calculationType: deduction.calculationType,
        value: deduction.value,
        monthlyValue: monthlyValue,
        annualValue: monthlyValue * 12,
        percentageOfCTC: percentageOfCTC,
      };
    });

    // Calculate totals
    const totalEarningsMonthly = allEarnings.reduce((sum: number, e: any) => sum + e.monthlyValue, 0);
    const totalDeductionsMonthly = scaledDeductions.reduce((sum: number, d: any) => sum + d.monthlyValue, 0);
    const netMonthly = totalEarningsMonthly - totalDeductionsMonthly;

    return {
      earnings: allEarnings,
      deductions: scaledDeductions,
      totalEarningsMonthly,
      totalDeductionsMonthly,
      netMonthly,
      grossMonthly: totalEarningsMonthly,
      annualCtc: userMonthlyCtc * 12,
      basicAmount,
      userMonthlyCtc,
      templateName: selectedTemplateDetails.name,
      templateCode: selectedTemplateDetails.code,
      // Special Allowance specific info
      specialAllowance: {
        percentage: specialAllowancePercentage,
        amount: specialAllowanceAmount,
      },
      totalPercentageUsed,
    };
  };

  // Helper function to check if component is Special Allowance
  const isSpecialAllowance = (componentName: string) => {
    return componentName?.toLowerCase().includes('special') ||
      componentName?.toLowerCase().includes('spl');
  };

  const breakdown = calculateBreakdown();

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      showSnackbar("Please select at least one employee", "warning");
      return;
    }
    if (!selectedTemplate) {
      showSnackbar("Please select a salary template", "warning");
      return;
    }
    if (ctcAmount <= 0) {
      showSnackbar("Please enter a valid CTC amount", "warning");
      return;
    }

    showSpinner();
    try {
      const annualCtc = ctcMode === "monthly" ? ctcAmount * 12 : ctcAmount;

      const payload = {
        employeeIds: selectedEmployees,
        structureId: selectedTemplate,
        ctcAmount: annualCtc,
        ctcPeriod: "ANNUAL",
        effectiveFrom: new Date().toISOString().split('T')[0],
        ...(bankDetails.accountNumber && {
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            bankName: bankDetails.bankName,
            ifscCode: bankDetails.ifscCode,
            branch: bankDetails.branch,
          }
        }),
      };

      const res: any = await assignmentService.createBulkAssignment(payload);
      showSnackbar(`Salary structure assigned to ${res.data?.assigned || selectedEmployees.length} employee(s)!`, "success");

      setSelectedEmployees([]);
      setSelectedTemplate("");
      setSelectedTemplateDetails(null);
      setCtcAmount(0);
      setBankDetails({
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        branch: "",
      });
      setShowBreakdown(false);
      setActiveStep(0);

      loadAssignments();
    } catch (error: any) {
      console.error("Failed to assign", error);
      showSnackbar(error?.message || "Failed to assign salary structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  // Custom tooltip formatter for Recharts
  // const tooltipFormatter = (value: any) => {
  //   if (typeof value === 'number') {
  //     return [formatCurrency(value), "Amount"];
  //   }
  //   return [String(value || 0), "Amount"];
  // };

  // Render Salary Breakdown with Charts
  const renderSalaryBreakdownWithCharts = () => {
    if (!breakdown) return null;

    const isMonthly = viewMode === "monthly";
    const totalEarnings = isMonthly ? breakdown.totalEarningsMonthly : breakdown.totalEarningsMonthly * 12;
    const totalDeductions = isMonthly ? breakdown.totalDeductionsMonthly : breakdown.totalDeductionsMonthly * 12;
    const netPay = isMonthly ? breakdown.netMonthly : breakdown.netMonthly * 12;
    const ctcDisplay = isMonthly ? breakdown.userMonthlyCtc : breakdown.annualCtc;

    // Prepare data for pie chart
    // const pieData = [
    //   ...breakdown.earnings.map((e: any) => ({
    //     name: e.componentName,
    //     value: isMonthly ? e.monthlyValue : e.annualValue,
    //     type: 'earning'
    //   })),
    //   ...breakdown.deductions.map((d: any) => ({
    //     name: d.componentName,
    //     value: isMonthly ? d.monthlyValue : d.annualValue,
    //     type: 'deduction'
    //   }))
    // ];

    // Prepare data for bar chart
    // const barData = [
    //   ...breakdown.earnings.map((e: any) => ({
    //     name: e.componentName,
    //     Earnings: isMonthly ? e.monthlyValue : e.annualValue,
    //     type: 'earning'
    //   })),
    //   ...breakdown.deductions.map((d: any) => ({
    //     name: d.componentName,
    //     Deductions: isMonthly ? d.monthlyValue : d.annualValue,
    //     type: 'deduction'
    //   }))
    // ];

    // const formatCurrencyForChart = (value: any) => {
    //   if (typeof value === 'number') {
    //     return formatCurrency(value);
    //   }
    //   return String(value || 0);
    // };

    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <CardContent className="!p-0">
            {/* Header */}
            <Box
              className="p-4"
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${theme.palette.divider}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieChartIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, }} className="text-gray-800">
                    Salary Breakdown
                  </Typography>
                  <Typography variant="caption" className="text-gray-800">
                    {breakdown.templateName} ({breakdown.templateCode})
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant={viewMode === "monthly" ? "contained" : "outlined"}
                  onClick={() => setViewMode("monthly")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}
                >
                  Monthly
                </Button>
                <Button
                  size="small"
                  variant={viewMode === "annual" ? "contained" : "outlined"}
                  onClick={() => setViewMode("annual")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}
                >
                  Annual
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setShowBreakdown(false);
                    setActiveStep(0);
                  }}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}
                >
                  Edit
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Summary Cards */}
              <Fade in timeout={500}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Grow in timeout={600}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                          Gross {isMonthly ? 'Monthly' : 'Annual'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                          {formatCurrency(totalEarnings)}
                        </Typography>
                      </Box>
                    </Grow>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Grow in timeout={700}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.08), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                        <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
                          Total Deductions
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
                          {formatCurrency(totalDeductions)}
                        </Typography>
                      </Box>
                    </Grow>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Grow in timeout={800}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                          Net {isMonthly ? 'Monthly' : 'Annual'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatCurrency(netPay)}
                        </Typography>
                      </Box>
                    </Grow>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Grow in timeout={900}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                        <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 600 }}>
                          Employees
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "warning.main" }}>
                          {selectedEmployees.length}
                        </Typography>
                      </Box>
                    </Grow>
                  </Grid>
                </Grid>
              </Fade>

              {/* Grid: Chart + Earnings + Deductions */}
              <Grid container spacing={3}>
                {/* Chart Column */}
                {/* <Grid size={{ xs: 12, md: 4 }}>
                  <Fade in timeout={1000}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}>
                        <PieChartIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.type === 'earning' ? PIE_COLORS[index % PIE_COLORS.length] : '#ef4444'}
                              />
                            ))}
                          </Pie>
                          <ReTooltip formatter={tooltipFormatter} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Fade>
                </Grid> */}

                {/* Earnings Table */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Fade in timeout={1100}>
                    <Paper className="bg-white-50 border border-gray-200" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.06), display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "success.main" }}>
                          Earnings ({breakdown.earnings.length})
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(totalEarnings)}
                        </Typography>
                      </Box>
                      <TableContainer sx={{ maxHeight: 280 }}>
                        <Table size="small" stickyHeader>
                          <TableBody>
                            {breakdown.earnings.map((item: any, i: number) => {
                              const isSpecial = item.isSpecialAllowance || isSpecialAllowance(item.componentName);

                              return (
                                <TableRow key={i} sx={getRowColor(i)}>
                                  <TableCell sx={{ py: 1 }}>
                                    <Typography  className="text-gray-800" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                                      {item.componentName}
                                      {isSpecial && (
                                        <Chip
                                          label="Balancing"
                                          size="small"
                                          color="primary"
                                          sx={{ ml: 1, height: 16, fontSize: '0.55rem' }}
                                        />
                                      )}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-500" sx={{ fontSize: "0.6rem", display: 'block' }}>
                                      {isSpecial
                                        ? `${item.percentageOfCTC.toFixed(2)}% of CTC (Balancing)`
                                        : getValueDisplay(item.calculationType, item.value)
                                      }
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1 }}>
                                    <Typography  sx={{ fontWeight: 600, color: isSpecial ? 'primary.main' : 'success.main', fontSize: "0.8rem" }}>
                                      {formatCurrency(isMonthly ? item.monthlyValue : item.annualValue)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Fade>
                </Grid>

                {/* Deductions Table */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Fade in timeout={1200}>
                    <Paper className="bg-white-50 border border-gray-200" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, overflow: 'hidden', height: '100%' }}>
                      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.06), display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                        <TrendingDown sx={{ fontSize: 18, color: 'error.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "error.main" }}>
                          Deductions ({breakdown.deductions.length})
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main" }}>
                          -{formatCurrency(totalDeductions)}
                        </Typography>
                      </Box>
                      <TableContainer sx={{ maxHeight: 280 }}>
                        <Table size="small" stickyHeader>
                          <TableBody>
                            {breakdown.deductions.map((item: any, i: number) => (
                              <TableRow key={i} sx={getRowColor(i)}>
                                <TableCell sx={{ py: 1 }}>
                                  <Typography className="text-gray-800" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                                    {item.componentName}
                                  </Typography>
                                  <Typography variant="caption" className="text-gray-500" sx={{ fontSize: "0.6rem", display: 'block' }}>
                                    {getValueDisplay(item.calculationType, item.value)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>
                                  <Typography  sx={{ fontWeight: 600, color: 'error.main', fontSize: "0.8rem" }}>
                                    -{formatCurrency(isMonthly ? item.monthlyValue : item.annualValue)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Fade>
                </Grid>
              </Grid>

              {breakdown && (
                <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.06), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Total Components
                      </Typography>
                      <Typography  className="text-gray-500">
                        {breakdown.earnings.filter(e => !e.isSpecialAllowance).length}
                        {breakdown.earnings.some(e => e.isSpecialAllowance) && ` (+ 1 Balancing)`}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Used Percentage
                      </Typography>
                      <Typography  className="text-gray-500">
                        {breakdown.totalPercentageUsed.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Special Allowance
                      </Typography>
                      <Typography  sx={{ fontWeight: 700, color: "primary.main" }}>
                        {breakdown.specialAllowance.percentage.toFixed(2)}%
                        <Typography variant="caption" className="text-gray-500" sx={{ display: 'block', fontSize: "0.65rem" }}>
                          {formatCurrency(breakdown.specialAllowance.amount)}/{isMonthly ? 'mo' : 'yr'}
                        </Typography>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Footer Summary */}
              <Fade in timeout={1400}>
                <Box sx={{ mt: 3, pt: 2, borderTop: `2px solid ${theme.palette.divider}` }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Basic Amount
                      </Typography>
                      <Typography  className="text-gray-500">
                        {formatCurrency(breakdown.basicAmount)}/{isMonthly ? 'mo' : 'yr'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        CTC ({isMonthly ? 'Monthly' : 'Annual'})
                      </Typography>
                      <Typography className="text-gray-800" sx={{ fontWeight: 700 }}>
                        {formatCurrency(ctcDisplay)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Net Pay
                      </Typography>
                      <Typography  sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(netPay)}/{isMonthly ? 'mo' : 'yr'}
                      </Typography>
                    </Grid>
                  </Grid>
                  {breakdown.basicAmount > 0 && (
                    <Typography variant="caption" className="text-error" sx={{ fontSize: "0.65rem", mt: 1, display: 'block' }}>
                      * Basic is the base for all percentage-based calculations
                    </Typography>
                  )}
                </Box>
              </Fade>
            </Box>
          </CardContent>
        </Card>
      </Slide>

    );
  };

  return (
    <div className="bg-white-50">
      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }} className="border-b border-gray-200">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Assign Salary" className="!text-gray-800" />
          <Tab label={`Assignments (${totalCount})`} className="!text-gray-800" />
        </Tabs>
      </Box>

      {/* Tab 0: Assign Salary */}
      {tabValue === 0 && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AssessmentOutlined sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              <div className="text-gray-800 text-[12px] font-bold">
                Assign Salary Structure
              </div>
              <div className="text-gray-500 text-[12px]">
                {!showBreakdown
                  ? "Select employees, template, and enter CTC to preview salary breakdown"
                  : "Review salary breakdown before assigning"
                }
              </div>
            </Box>
          </div>

          {/* Step Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: activeStep === 0 ? 'primary.main' : 'success.main',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}>
                {activeStep === 0 ? '1' : '✓'}
              </Box>
              <Typography  sx={{ fontWeight: activeStep === 0 ? 600 : 400 }}>
                Select & Configure
              </Typography>
            </Box>
            <Box sx={{ flex: 1, height: 2, bgcolor: activeStep === 1 ? 'success.main' : 'divider' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: activeStep === 1 ? 'primary.main' : 'grey.300',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}>
                2
              </Box>
              <Typography className="!text-gray-800" sx={{ fontWeight: activeStep === 1 ? 600 : 400 }}>
                Salary Breakdown
              </Typography>
            </Box>
          </Box>

          {!showBreakdown ? (
            <Grid container spacing={2}>
              {/* Left: Employee selection */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="!p-4">
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography className="text-gray-800" sx={{ fontWeight: 600 }}>
                        {/* <PersonAdd fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> */}
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

                    <Stack spacing={1}>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                          placeholder="Search by name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <Select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            displayEmpty
                            sx={selectSx}
                          >
                            <MenuItem value="all">All Departments</MenuItem>
                            {departments.filter((d) => d !== "all").map((dept) => (
                              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-350px)] overflow-auto">
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                  indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                                  onChange={toggleAllEmployees}
                                  className="text-gray-800"
                                />
                              </TableCell>
                              <TableCell className="!font-bold">Employee</TableCell>
                              <TableCell className="!font-bold">Department</TableCell>
                              <TableCell className="!font-bold">Designation</TableCell>
                              <TableCell className="!font-bold">Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                  <Typography  className="text-gray-500">
                                    No employees found matching your criteria
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredEmployees.map((employee, i) => (
                                <TableRow
                                  key={employee.id}
                                  sx={{
                                    ...getRowColor(i),
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
                                      className="text-gray-800"
                                    />{i + 1}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "0.75rem", fontWeight: 600 }}>
                                        {employee.name?.charAt(0) || "?"}
                                      </Avatar>
                                      <Box>
                                        <Typography  sx={{ fontWeight: 500 }}>
                                          {employee.name || "Unknown"}
                                        </Typography>
                                        <div className="text-primary text-[10px]">
                                          {employee.employeeId || employee.id}
                                        </div>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography >{employee.department || '-'}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography >{employee.designation || '-'}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={employee.grade || "N/A"} size="small" variant="outlined" className="text-gray-800" />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Assignment details */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="!p-0">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="sticky top-0 z-30 p-4 bg-gray-200 text-gray-800 border-b border-gray-200">
                      {/* <FileCopy fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} /> */}
                      Assignment Details
                    </Typography>

                    <Stack spacing={2} className="p-4">
                      <div className="p-3 rounded-sm bg-head flex items-center justify-between">
                        <Typography  className="text-gray-800">
                          Selected Employees
                        </Typography>
                        <Typography  sx={{ fontWeight: 600 }} className="text-gray-800">
                          {selectedEmployees.length}
                        </Typography>
                      </div>

                      <FormControl fullWidth>
                        <InputLabel>Salary Template <span className="text-error">*</span></InputLabel>
                        <Select
                          value={selectedTemplate}
                          onChange={(e) => handleTemplateChange(e.target.value)}
                          label="Salary Template *"
                          required
                        >
                          {structures.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} ({t.code})
                            </MenuItem>
                          ))}
                          <MenuItem className="!text-primary" onClick={() => navigate("/payroll/structures")}>
                            <AddCircle className="mr-2" /> Add Salary Template
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography  sx={{ fontWeight: 500, mb: 0.5 }} className="text-gray-800">
                          CTC Amount <span className="text-error">*</span>
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            type="number"
                            value={ctcAmount || ""}
                            onChange={(e) => setCtcAmount(Number(e.target.value))}
                            placeholder="Enter amount"
                            fullWidth
                            size="small"
                          />
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={ctcMode}
                              onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly")}
                              sx={selectSx}
                            >
                              <MenuItem value="annual">Annual</MenuItem>
                              <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <Accordion
                        className="bg-white-50"
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon className="text-gray-800" />}>
                          <Typography  sx={{ fontWeight: 500 }} className="text-gray-800">
                            Bank Details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Account Number"
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                              fullWidth
                              size="small"
                            />
                            <TextField
                              label="Bank Name"
                              value={bankDetails.bankName}
                              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                              fullWidth
                              size="small"
                            />
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 6 }}>
                                <TextField
                                  label="IFSC Code"
                                  value={bankDetails.ifscCode}
                                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                  fullWidth
                                  size="small"
                                />
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <TextField
                                  label="Branch"
                                  value={bankDetails.branch}
                                  onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                                  fullWidth
                                  size="small"
                                />
                              </Grid>
                            </Grid>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>

                      <Button
                        variant="contained"
                        fullWidth
                        className="!bg-primary"
                        sx={{ textTransform: "none" }}
                        disabled={selectedEmployees.length === 0 || !selectedTemplate || ctcAmount <= 0}
                        onClick={() => {
                          if (selectedEmployees.length > 0 && selectedTemplate && ctcAmount > 0) {
                            setShowBreakdown(true);
                            setActiveStep(1);
                          }
                        }}
                      >
                        Preview Salary Breakdown
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            // Show Salary Breakdown with Charts
            <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
              {renderSalaryBreakdownWithCharts()}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, my: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowBreakdown(false);
                    setActiveStep(0);
                  }}
                  className="!text-gray-800 !border-gray-200"
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  className="!bg-primary"
                  startIcon={<DollarSignIcon />}
                  onClick={handleAssign}
                  sx={{ textTransform: "none" }}
                >
                  Assign to {selectedEmployees.length} Employee{selectedEmployees.length > 1 ? 's' : ''}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Tab 1: Assignments List */}
      {tabValue === 1 && (
        <Box>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <div className="text-gray-800 text-[12px] font-bold">
                Salary Assignments
              </div>
              <div className="text-gray-500 text-[12px] mt-1">
                View and manage all salary assignments
              </div>
            </Box>
           <div className="flex items-center gap-3">
             <Button
              variant="contained"
              onClick={() => navigate("/payroll/generate")}
              sx={{ textTransform: "none" }}
            >
              Generate Payroll
            </Button>
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => setTabValue(0)}
              startIcon={<AssessmentOutlined />}
              sx={{ textTransform: "none" }}
            >
              New Assignment
            </Button>
           </div>
          </Box>

          {/* Filters */}
          <div className="flex items-center gap-4 justify-between mb-4">
            <TextField
              placeholder="Search by employee or structure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
            />
            <div className="flex items-center gap-2">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={selectSx}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={loadAssignments} className="!border !border-gray-200 !rounded">
                <RefreshIcon className="!text-gray-800 !w-4" />
              </IconButton>
            </div>
          </div>

          {/* Assignments Table */}
          <TableContainer className="border border-gray-200 rounded-sm max-h-[calc(100vh-310px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold sticky left-0 !z-20 bg-white">#</TableCell>
                  <TableCell className="!font-bold sticky left-[50px] !z-20 bg-white">Employee</TableCell>
                  <TableCell className="!font-bold">Structure</TableCell>
                  <TableCell className="!font-bold" align="right">Annual CTC</TableCell>
                  <TableCell className="!font-bold" align="right">Monthly CTC</TableCell>
                  <TableCell className="!font-bold">Effective From</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell className="!font-bold sticky right-0 !z-20 bg-white" align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <div className="text-gray-500">No assignments found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment, i) => {
                    const status = statusConfig[assignment.status?.toLowerCase()] || statusConfig.active;
                    return (
                      <TableRow key={assignment.id} sx={getRowColor(i)}>
                        <TableCell className="sticky left-0 bg-inherit !z-10">{i + 1}</TableCell>
                        <TableCell className="sticky left-[50px] bg-inherit !z-10">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "0.7rem", fontWeight: 600 }}>
                              {assignment.employeeName?.charAt(0) || "?"}
                            </Avatar>
                            <Box>
                              <Typography  sx={{ fontWeight: 500 }}>
                                {assignment.employeeName || "Unknown"}
                              </Typography>
                              <Typography variant="caption" className="text-primary !text-[10px]">
                                {assignment.employeeCode || assignment.employeeId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography >
                            {assignment.structureName || "N/A"}
                          </Typography>
                          <Typography variant="caption" className="text-blue-500 !text-[10px]">
                            {assignment.structureCode}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography  sx={{ fontWeight: 600 }}>
                            {formatCurrency(assignment.annualCtc || assignment.ctcAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography >
                            {formatCurrency(assignment.monthlyCtc || (assignment.ctcAmount / 12) || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography >
                            {formatDate(assignment.effectiveFrom)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center" className="sticky right-0 bg-inherit !z-10">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewAssignment(assignment)}
                              >
                                <ViewIcon fontSize="small" className="!w-4 text-blue-500" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton
                                size="small"
                                onClick={() => handleViewHistory(assignment.employeeId)}
                              >
                                <HistoryIcon fontSize="small" className="!w-4 text-amber-500" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 0 && (
            <GlobalPagination
              total={totalCount}
              page={page + 1}
              limit={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              pageSizeOptions={[10, 20, 50, 100]}
              showTotal={true}
            />
          )}
        </Box>
      )}

      {/* View Assignment Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" sx={dialogsx}>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
          <Typography variant="h6" className="!ml-4">Assignment Details</Typography>
          <IconButton onClick={() => setOpenViewDialog(false)} size="small">
            <CloseIcon className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-6">
          {selectedAssignment && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Employee</Typography>
                <Typography  sx={{ fontWeight: 500 }}>
                  {selectedAssignment.employeeName} ({selectedAssignment.employeeCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Structure</Typography>
                <Typography  sx={{ fontWeight: 500 }}>
                  {selectedAssignment.structureName} ({selectedAssignment.structureCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Annual CTC</Typography>
                <Typography  sx={{ fontWeight: 600, color: "success.main" }}>
                  {formatCurrency(selectedAssignment.annualCtc || selectedAssignment.ctcAmount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Monthly CTC</Typography>
                <Typography  sx={{ fontWeight: 600 }}>
                  {formatCurrency(selectedAssignment.monthlyCtc || (selectedAssignment.ctcAmount / 12))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Effective From</Typography>
                <Typography >{formatDate(selectedAssignment.effectiveFrom)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Status</Typography>
                <Chip
                  label={statusConfig[selectedAssignment.status?.toLowerCase()]?.label || selectedAssignment.status}
                  size="small"
                  sx={{
                    bgcolor: statusConfig[selectedAssignment.status?.toLowerCase()]?.bgColor || "#f3f4f6",
                    color: statusConfig[selectedAssignment.status?.toLowerCase()]?.color || "#6b7280",
                  }}
                />
              </Grid>
              {selectedAssignment.bankAccountNumber && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="text-blue-500 !font-bold">Bank Details</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Account Number</Typography>
                    <Typography >{selectedAssignment.bankAccountNumber}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Bank Name</Typography>
                    <Typography >{selectedAssignment.bankName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">IFSC Code</Typography>
                    <Typography >{selectedAssignment.bankIfsc}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Branch</Typography>
                    <Typography >{selectedAssignment.bankBranch}</Typography>
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Created At</Typography>
                <Typography >{formatDate(selectedAssignment.createdAt)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
          <Typography variant="h6" className="!ml-4">Assignment History</Typography>
          <IconButton onClick={() => setOpenHistoryDialog(false)} size="small">
            <CloseIcon className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!py-4">
          {assignmentHistory.length === 0 ? (
            <div className="text-center text-[12px] text-gray-500 py-8">
              No history found for this employee
            </div>
          ) : (
            <TableContainer className="border border-gray-200 rounded-md max-h-[500px]">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold">Structure</TableCell>
                    <TableCell className="!font-bold" align="right">CTC</TableCell>
                    <TableCell className="!font-bold">Effective From</TableCell>
                    <TableCell className="!font-bold">Status</TableCell>
                    <TableCell className="!font-bold">Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentHistory.map((history, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography  sx={{ fontWeight: 500 }}>
                          {history.structureName}
                        </Typography>
                        <Typography variant="caption" className="text-primary !text-[10px]">
                          {history.structureCode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography  sx={{ fontWeight: 600 }}>
                          {formatCurrency(history.ctcAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography >
                          {formatDate(history.effectiveFrom)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={history.status}
                          size="small"
                          sx={{
                            bgcolor: statusConfig[history.status?.toLowerCase()]?.bgColor || "#f3f4f6",
                            color: statusConfig[history.status?.toLowerCase()]?.color || "#6b7280",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography >
                          {formatDate(history.updatedAt || history.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setOpenHistoryDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}