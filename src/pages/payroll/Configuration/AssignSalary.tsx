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
  AssessmentOutlined,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  AddCircle,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  PieChartOutlined,
} from "@mui/icons-material";
import { formatCurrency, PROFESSIONAL_PALETTE } from "../const";
import { assignmentService } from "../../../services/modules/payrollServices/salaryAssignments";
import { salaryStructureService } from "../../../services/modules/payrollServices/salarystructure";
import { employeeService } from "../../../services/modules/employees";
import { useUI } from "../../../context/Snackbar";
import { dialogsx, selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { useNavigate } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Tooltip as ReTooltip } from "recharts";

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

const generateColorPalette = (count: number): string[] => {
  const offset = Math.floor(Math.random() * PROFESSIONAL_PALETTE.length);
  const rotated = [
    ...PROFESSIONAL_PALETTE.slice(offset),
    ...PROFESSIONAL_PALETTE.slice(0, offset),
  ];
  return Array.from({ length: count }, (_, i) => rotated[i % rotated.length]);
};

// Helper function to check if component is Special Allowance
const isSpecialAllowance = (componentName: string) => {
  return componentName?.toLowerCase().includes('special') ||
    componentName?.toLowerCase().includes('spl');
};

// Compact select style for the redesigned filter bar
const compactSelectSx = {
  height: 34,
  fontSize: "0.78rem",
  borderRadius: 1.5,
  bgcolor: "#fff",
  "& .MuiSelect-select": {
    py: 0.6,
    px: 1.2,
  },
  "& fieldset": {
    borderColor: "#e5e7eb",
  },
  "&:hover fieldset": {
    borderColor: "#9ca3af !important",
  },
};

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
  // const [selectedDesignation, setSelectedDesignation] = useState("all");
  const [selectedEmployeeGroup, setSelectedEmployeeGroup] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ctcAmount, setCtcAmount] = useState<number>(0);
  const [ctcMode, setCtcMode] = useState<"annual" | "monthly" | "perday">("monthly");
  const [workingDays, setWorkingDays] = useState<number>(31);
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

  // Auto-set CTC mode based on selected employee's employee group
  useEffect(() => {
    if (selectedEmployees.length === 0) return;

    const firstEmployeeId = selectedEmployees[0];
    const employee = employees.find((e) => e.id === firstEmployeeId);
    if (!employee) return;

    const group = (employee.employeeGroup || "").toLowerCase();

    if (group.includes("staff")) {
      setCtcMode("monthly");
      setWorkingDays(31);
    } else if (group.includes("labour") || group.includes("labor")) {
      setCtcMode("perday");
      setWorkingDays((prev) => prev || 31);
    }
  }, [selectedEmployees, employees]);

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

  const departments = ["all", ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];
  // const designation = ["all", ...Array.from(new Set(employees.map((e) => e.designation).filter(Boolean)))];
  const employeeGroups = ["all", ...Array.from(new Set(employees.map((e) => e.employeeGroup).filter(Boolean)))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    // const matchesDesg = selectedDesignation === "all" || emp.designation === selectedDesignation;
    const matchesGroup = selectedEmployeeGroup === "all" || emp.employeeGroup === selectedEmployeeGroup;
    return matchesSearch && matchesDept && matchesGroup;
  });

  // Check if any employee filter is active
  // const hasActiveFilters =
  //   searchQuery !== "" ||
  //   selectedDept !== "all" ||
  //   selectedDesignation !== "all" ||
  //   selectedEmployeeGroup !== "all";

  // const clearAllFilters = () => {
  //   setSearchQuery("");
  //   setSelectedDept("all");
  //   setSelectedDesignation("all");
  //   setSelectedEmployeeGroup("all");
  // };

  const fetchEmployeeBankDetails = async (employeeId: string) => {
    try {
      const res: any = await employeeService.getEmployeeById(employeeId);
      const emp = res.data;
      if (emp) {
        setBankDetails({
          accountNumber: emp.bankAccountNumber || emp.accountNumber || "",
          bankName: emp.bankName || "",
          ifscCode: emp.bankIfsc || emp.ifscCode || "",
          branch: emp.bankBranch || "",
        });
      }
    } catch (error) {
      console.warn("Failed to fetch employee bank details", error);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees((prev) => {
      const isRemoving = prev.includes(empId);
      const next = isRemoving ? prev.filter((id) => id !== empId) : [...prev, empId];

      if (!isRemoving && next.length === 1) {
        fetchEmployeeBankDetails(empId);
      }

      if (next.length === 0) {
        setBankDetails({
          accountNumber: "",
          bankName: "",
          ifscCode: "",
          branch: "",
        });
      }

      return next;
    });
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

    let userMonthlyCtc = ctcAmount;
    if (ctcMode === "annual") {
      userMonthlyCtc = ctcAmount / 12;
    } else if (ctcMode === "monthly") {
      userMonthlyCtc = ctcAmount;
    } else if (ctcMode === "perday") {
      userMonthlyCtc = ctcAmount * (workingDays || 31);
    }
    const templateEarnings = selectedTemplateDetails.earnings || [];
    const templateDeductions = selectedTemplateDetails.deductions || [];

    const basicComponent = templateEarnings.find(
      (e: any) =>
        e.componentCode === "BS001" ||
        e.componentCode === "BASIC" ||
        e.componentName?.toLowerCase() === "basic"
    );

    let basicAmount = 0;
    if (basicComponent) {
      if (basicComponent.calculationType === "PERCENT_OF_CTC" || basicComponent.calculationType === "PERCENTAGE") {
        basicAmount = (basicComponent.value / 100) * userMonthlyCtc;
      } else if (basicComponent.calculationType === "FIXED_AMOUNT") {
        basicAmount = basicComponent.value || 0;
      }
    }

    const calculatedEarnings = templateEarnings
      .filter((e: any) => !isSpecialAllowance(e.componentName))
      .map((earning: any) => {
        let monthlyValue = 0;
        let percentageOfCTC = 0;

        switch (earning.calculationType) {
          case "PERCENT_OF_CTC":
            monthlyValue = (earning.value / 100) * userMonthlyCtc;
            percentageOfCTC = earning.value;
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

    const totalPercentageUsed = calculatedEarnings.reduce(
      (sum: number, e: any) => sum + e.percentageOfCTC, 0
    );

    const specialAllowancePercentage = 100 - totalPercentageUsed;
    const specialAllowanceAmount = userMonthlyCtc * (specialAllowancePercentage / 100);

    const specialAllowanceComponent = templateEarnings.find(
      (e: any) => isSpecialAllowance(e.componentName)
    );

    let allEarnings = [...calculatedEarnings];

    if (specialAllowanceComponent) {
      allEarnings.push({
        id: specialAllowanceComponent.id,
        componentId: specialAllowanceComponent.componentId,
        componentCode: specialAllowanceComponent.componentCode || "SPL",
        componentName: specialAllowanceComponent.componentName || "Special Allowance",
        calculationType: "PERCENT_OF_CTC",
        value: specialAllowancePercentage,
        monthlyValue: specialAllowanceAmount,
        annualValue: specialAllowanceAmount * 12,
        percentageOfCTC: specialAllowancePercentage,
        isSpecialAllowance: true,
      });
    } else {
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
      specialAllowance: {
        percentage: specialAllowancePercentage,
        amount: specialAllowanceAmount,
      },
      totalPercentageUsed,
    };
  };

  const breakdown = calculateBreakdown();
  const hasBankDetails =
    Boolean(bankDetails.accountNumber) ||
    Boolean(bankDetails.bankName) ||
    Boolean(bankDetails.ifscCode) ||
    Boolean(bankDetails.branch);

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
    if (ctcMode === "perday" && workingDays <= 0) {
      showSnackbar("Please enter valid working days", "warning");
      return;
    }

    showSpinner();
    try {
      let annualCtc = ctcAmount;
      if (ctcMode === "monthly") {
        annualCtc = ctcAmount * 12;
      } else if (ctcMode === "perday") {
        annualCtc = ctcAmount * (workingDays || 31) * 12;
      }

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
      setWorkingDays(31);
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

  const isPreviewDisabled =
    selectedEmployees.length === 0 ||
    !selectedTemplate ||
    ctcAmount <= 0 ||
    (ctcMode === "perday" && workingDays <= 0);

  const renderSalaryBreakdownWithCharts = () => {
    if (!breakdown) return null;

    const isMonthly = viewMode === "monthly";
    const totalEarnings = isMonthly ? breakdown.totalEarningsMonthly : breakdown.totalEarningsMonthly * 12;
    const totalDeductions = isMonthly ? breakdown.totalDeductionsMonthly : breakdown.totalDeductionsMonthly * 12;
    const netPay = isMonthly ? breakdown.netMonthly : breakdown.netMonthly * 12;

    const pieData = [
      ...breakdown.earnings.map((e: any) => ({
        name: e.componentName,
        value: isMonthly ? e.monthlyValue : e.annualValue,
        type: 'earning'
      })),
      ...breakdown.deductions.map((d: any) => ({
        name: d.componentName,
        value: isMonthly ? d.monthlyValue : d.annualValue,
        type: 'deduction'
      }))
    ];

    const dynamicColors = generateColorPalette(pieData.length);

    const tooltipFormatter = (value: any, _name: any, props: any) => {
      const componentName = props?.payload?.name || "Amount";
      if (typeof value === "number") {
        return [formatCurrency(value), componentName];
      }
      return [String(value || 0), componentName];
    };

    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <CardContent className="!p-0">
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
                  <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gray-800">
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
                  className={`${viewMode === "monthly" ? "!bg-primary" : "!text-primary !border-primary"}`}
                  variant={viewMode === "monthly" ? "contained" : "outlined"}
                  onClick={() => setViewMode("monthly")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}
                >
                  Monthly
                </Button>
                <Button
                  size="small"
                  className={`${viewMode === "annual" ? "!bg-primary" : "!text-primary !border-primary"}`}
                  variant={viewMode === "annual" ? "contained" : "outlined"}
                  onClick={() => setViewMode("annual")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}
                >
                  Annual
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className="!text-primary !border-primary"
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
              {ctcMode === "perday" && (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.06),
                    border: `1px dashed ${alpha(theme.palette.info.main, 0.4)}`,
                  }}
                >
                  <Typography variant="caption" className="text-gray-800" sx={{ fontWeight: 600 }}>
                    Per Day Calculation
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {formatCurrency(ctcAmount)}/day × {workingDays} working days ={" "}
                    <strong>{formatCurrency(breakdown.userMonthlyCtc)}/month</strong>
                    {" "}({formatCurrency(breakdown.annualCtc)}/year)
                  </Typography>
                </Box>
              )}

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
                </Grid>
              </Fade>

              <Grid container spacing={3}>
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
                                    <Typography className="text-gray-800" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
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
                                    <Typography sx={{ fontWeight: 600, color: isSpecial ? 'primary.main' : 'success.main', fontSize: "0.8rem" }}>
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
                                  <Typography sx={{ fontWeight: 600, color: 'error.main', fontSize: "0.8rem" }}>
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

                <Grid size={{ xs: 12, md: 4 }}>
                  <Fade in timeout={1000}>
                    <Paper className="bg-white-50 border border-blue-200" sx={{ borderRadius: 2, height: '100%' }}>
                      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06), display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                        <PieChartOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "primary.main" }}>
                          CTC Distribution
                        </Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1200}
                          >
                            {pieData.map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={dynamicColors[index]}
                              />
                            ))}
                          </Pie>
                          <ReTooltip formatter={tooltipFormatter} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.7rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Fade>
                </Grid>
              </Grid>

              {breakdown && (
                <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.06), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Total Components
                      </Typography>
                      <Typography className="text-gray-500">
                        {breakdown.earnings.filter(e => !e.isSpecialAllowance).length}
                        {breakdown.earnings.some(e => e.isSpecialAllowance) && ` (+ 1 Balancing)`}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Used Percentage
                      </Typography>
                      <Typography className="text-gray-500">
                        {breakdown.totalPercentageUsed.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Special Allowance
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: "primary.main" }}>
                        {breakdown.specialAllowance.percentage.toFixed(2)}%
                        <Typography variant="caption" className="text-gray-500" sx={{ display: 'block', fontSize: "0.65rem" }}>
                          {formatCurrency(breakdown.specialAllowance.amount)}/{isMonthly ? 'mo' : 'yr'}
                        </Typography>
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="caption" className="text-gray-800">
                        Net Pay
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(netPay)}/{isMonthly ? 'mo' : 'yr'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Slide>
    );
  };

  return (
    <div className="bg-white-50">
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

      {tabValue === 0 && (
        <>
          <div className="flex items-center gap-4 mb-4">
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: activeStep === 0 ? 'var(--color-primary)' : 'success.main',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}>
                {activeStep === 0 ? '1' : '✓'}
              </Box>
              <Typography sx={{ fontWeight: activeStep === 0 ? 600 : 400 }}>
                Select & Configure
              </Typography>
            </Box>
            <Box className="border border-gray-200" sx={{ flex: 1, height: 2, bgcolor: activeStep === 1 ? 'success.main' : 'divider' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: activeStep === 1 ? 'var(--color-primary)' : 'grey.300',
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
              <Grid size={{ xs: 12, md: 8 }}>
                <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="!p-4">
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <div className="text-gray-800 text-[12px] font-bold">
                        Select Employees
                      </div>
                      {selectedEmployees.length > 0 && (
                        <Chip
                          icon={<CheckCircleIcon fontSize="small" />}
                          label={`${selectedEmployees.length} selected`}
                          color="primary"
                          size="small"
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>

                    <Stack spacing={1.2}>
                      {/* ===== Redesigned Compact Filter Bar ===== */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        {/* Search field */}
                        <TextField
                          placeholder="Search name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          size="small"
                          sx={{
                            flex: "1 1 180px",
                            minWidth: 160,
                            "& .MuiOutlinedInput-root": {
                              height: 34,
                              fontSize: "0.78rem",
                              borderRadius: 1.5,
                              bgcolor: "#fff",
                            },
                          }}

                        />

                        {/* Employee Group */}
                        <FormControl size="small" sx={{ minWidth: 130, flex: "0 1 auto" }}>
                          <Select
                            value={selectedEmployeeGroup}
                            onChange={(e) => setSelectedEmployeeGroup(e.target.value)}
                            displayEmpty
                            sx={compactSelectSx}
                            renderValue={(val) => (val === "all" ? "All Groups" : val)}
                          >
                            <MenuItem value="all">All Groups</MenuItem>
                            {employeeGroups.filter((g) => g !== "all").map((grp) => (
                              <MenuItem key={grp} value={grp}>{grp}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Department */}
                        <FormControl size="small" sx={{ minWidth: 130, flex: "0 1 auto" }}>
                          <Select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            displayEmpty
                            sx={compactSelectSx}
                            renderValue={(val) => (val === "all" ? "All Departments" : val)}
                          >
                            <MenuItem value="all">All Departments</MenuItem>
                            {departments.filter((d) => d !== "all").map((dept) => (
                              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Designation */}
                        {/* <FormControl size="small" sx={{ minWidth: 130, flex: "0 1 auto" }}>
                          <Select
                            value={selectedDesignation}
                            onChange={(e) => setSelectedDesignation(e.target.value)}
                            displayEmpty
                            sx={compactSelectSx}
                            renderValue={(val) =>
                              val === "all" ? (
                                <span style={{ color: "#9ca3af" }}>Designation</span>
                              ) : (
                                val
                              )
                            }
                          >
                            <MenuItem value="all">All Designations</MenuItem>
                            {designation.filter((d) => d !== "all").map((desg) => (
                              <MenuItem key={desg} value={desg}>{desg}</MenuItem>
                            ))}
                          </Select>
                        </FormControl> */}




                      </div>
                      {/* ===== End Redesigned Filter Bar ===== */}

                      <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-250px)] overflow-auto">
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
                              <TableCell className="!font-bold">Employee Group</TableCell>
                              <TableCell className="!font-bold">Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredEmployees.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Typography className="text-gray-500 p-6">
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
                                      {/* <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "0.75rem", fontWeight: 600 }}>
                                        {employee.name?.charAt(0) || "?"}
                                      </Avatar> */}
                                      <Box>
                                        <Typography sx={{ fontWeight: 500 }}>
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
                                    <Typography >{employee.employeeGroup || '-'}</Typography>
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="!p-0">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="sticky top-0 z-30 p-4 bg-gray-200 text-gray-800 border-b border-gray-200">
                      Assignment Details
                    </Typography>

                    <Stack spacing={2} className="p-4">
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
                        <Typography sx={{ fontWeight: 500, mb: 0.5, ml: 0.5 }} className="text-gray-800">
                          CTC Amount <span className="text-error">*</span>
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            type="number"
                            value={ctcMode == "perday" ? ctcAmount * workingDays :  ctcAmount}
                            onChange={(e) => setCtcAmount(Number(e.target.value))}
                            placeholder={
                              ctcMode === "annual"
                                ? "Enter annual amount"
                                : ctcMode === "monthly"
                                  ? "Enter monthly amount"
                                  : "Enter per day amount"
                            }
                            fullWidth
                            size="small"
                            disabled={ctcMode === "perday"}
                          />
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={ctcMode}
                              onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly" | "perday")}
                              sx={selectSx}
                            >
                              <MenuItem value="annual">Annual</MenuItem>
                              <MenuItem value="monthly">Monthly</MenuItem>
                              <MenuItem value="perday">Per Day</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        
                        {ctcMode === "perday" && (
                          <>
                           <TextField
                            type="number"
                            value={ctcAmount || ""}
                            onChange={(e) => setCtcAmount(Number(e.target.value))}
                            placeholder="Enter per day amount"
                            fullWidth
                            size="small"
                            className="!mt-3"
                          />

                          <Box sx={{ mt: 1.5 }}>
                            <Typography sx={{ fontWeight: 500, mb: 0.5, ml: 0.5 }} className="text-gray-800">
                              Working Days <span className="text-error">*</span>
                            </Typography>
                            <TextField
                              type="number"
                              value={workingDays || ""}
                              onChange={(e) => setWorkingDays(Number(e.target.value))}
                              placeholder="Enter working days (e.g., 30)"
                              fullWidth
                              size="small"
                              slotProps={{ htmlInput: { min: 1, max: 31 } }}
                            />
                            {ctcAmount > 0 && workingDays > 0 && (
                              <Typography
                                variant="caption"
                                className="text-gray-500"
                                sx={{ ml: 0.5, mt: 0.5, display: 'block' }}
                              >
                                Monthly CTC = {formatCurrency(ctcAmount)} × {workingDays} days ={" "}
                                <strong>{formatCurrency(ctcAmount * workingDays)}</strong>
                                {" "}| Annual ={" "}
                                <strong>{formatCurrency(ctcAmount * workingDays * 12)}</strong>
                              </Typography>
                            )}
                          </Box>
                          </>
                        )}
                      </Box>

                      <Box
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "#fff",
                        }}
                      >
                        <div className="p-3 border-b border-gray-200">
                          <Typography sx={{ fontWeight: 600 }} className="text-gray-800">
                            Bank Details
                          </Typography>
                        </div>

                        <Box sx={{ p: 2 }}>
                          {hasBankDetails ? (
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" className="text-gray-500">
                                  Account Number
                                </Typography>
                                <Typography className="text-gray-800">
                                  {bankDetails.accountNumber || "-"}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" className="text-gray-500">
                                  Bank Name
                                </Typography>
                                <Typography className="text-gray-800">
                                  {bankDetails.bankName || "-"}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" className="text-gray-500">
                                  IFSC Code
                                </Typography>
                                <Typography className="text-gray-800">
                                  {bankDetails.ifscCode || "-"}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" className="text-gray-500">
                                  Branch
                                </Typography>
                                <Typography className="text-gray-800">
                                  {bankDetails.branch || "-"}
                                </Typography>
                              </Grid>
                            </Grid>
                          ) : (
                            <div className="flex items-center justify-center flex-col py-3 gap-1">
                              <Typography className="text-gray-500">
                                No Bank Details Available
                              </Typography>
                            </div>
                          )}
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        className="!bg-primary"
                        sx={{ textTransform: "none" }}
                        disabled={isPreviewDisabled}
                        onClick={() => {
                          if (!isPreviewDisabled) {
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
            <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
              {renderSalaryBreakdownWithCharts()}

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

      {tabValue === 1 && (
        <Box>
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
                    <TableCell colSpan={8} align="center">
                      <div className="text-gray-500 py-6">No assignments found</div>
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
                              <Typography sx={{ fontWeight: 500 }}>
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
                          <Typography sx={{ fontWeight: 600 }}>
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
                <Typography sx={{ fontWeight: 500 }}>
                  {selectedAssignment.employeeName} ({selectedAssignment.employeeCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Structure</Typography>
                <Typography sx={{ fontWeight: 500 }}>
                  {selectedAssignment.structureName} ({selectedAssignment.structureCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Annual CTC</Typography>
                <Typography sx={{ fontWeight: 600, color: "success.main" }}>
                  {formatCurrency(selectedAssignment.annualCtc || selectedAssignment.ctcAmount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Monthly CTC</Typography>
                <Typography sx={{ fontWeight: 600 }}>
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
                        <Typography sx={{ fontWeight: 500 }}>
                          {history.structureName}
                        </Typography>
                        <Typography variant="caption" className="text-primary !text-[10px]">
                          {history.structureCode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600 }}>
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