import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Chip, Stack, useTheme, alpha, Grid, Checkbox, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
  Tabs, Tab, Paper, Fade, Slide, InputLabel, Menu, ListItemIcon,
} from "@mui/material";
import {
  AttachMoney as DollarSignIcon,
  CheckCircle as CheckCircleIcon,
  AssessmentOutlined,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  AddCircle,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  PieChartOutlined,
  PersonAdd as AssignIcon,
  Warning as WarningIcon,
  VisibilityOutlined,
  Edit,
  Download as DownloadIcon,
  DescriptionOutlined as CsvIcon,
  GridOnOutlined as ExcelIcon,
  PictureAsPdfOutlined as PdfIcon,
} from "@mui/icons-material";
import { formatCurrency, getApiStatus, PROFESSIONAL_PALETTE, shortenHeader } from "../const";
import { assignmentService } from "../../../services/modules/payrollServices/salaryAssignments";
import { salaryStructureService } from "../../../services/modules/payrollServices/salarystructure";
import { useUI } from "../../../context/Snackbar";
import { dialogSx, dialogsx, formatName, selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { apiService } from "../../../services";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import { categoryService } from "../../../services/modules/category";

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "#10b981", bgColor: "#d1fae5" },
  inactive: { label: "Inactive", color: "#6b7280", bgColor: "#f3f4f6" },
  pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
  expired: { label: "Expired", color: "#ef4444", bgColor: "#fee2e2" },
  unassigned: { label: "Unassigned", color: "#ef4444", bgColor: "#fee2e2" },
  assigned: { label: "Assigned", color: "#10b981", bgColor: "#d1fae5" },
};

const getValueDisplay = (calculationType: string, value: number) => {
  switch (calculationType) {
    case "FIXED_AMOUNT": return formatCurrency(value);
    case "PERCENT_OF_BASIC": return `${value}% of Basic`;
    case "PERCENT_OF_CTC": return `${value}% of CTC`;
    case "PERCENTAGE": return `${value}%`;
    case "SLAB_BASED": return value > 0 ? `₹${value}/month` : "Slab Based";
    case "FORMULA": return "Formula";
    default: return `${value}%`;
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

const isSpecialAllowance = (componentName: string) =>
  componentName?.toLowerCase().includes("special") ||
  componentName?.toLowerCase().includes("spl");

const compactSelectSx = {
  height: 34,
  fontSize: "0.78rem",
  borderRadius: 1.5,
  "& .MuiSelect-select": { py: 0.6, px: 1.2 },
  "& fieldset": { borderColor: "#e5e7eb" },
  "&:hover fieldset": { borderColor: "#9ca3af !important" },
};

// ─── Export helpers ───────────────────────────────────────────────────────────
type ExportFormat = "csv" | "excel" | "pdf";

const EXPORT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: "csv", label: "CSV", icon: <CsvIcon fontSize="small" className="!w-4 text-blue-500" /> },
  { value: "excel", label: "Excel", icon: <ExcelIcon fontSize="small" className="!w-4 text-green-500" /> },
  { value: "pdf", label: "PDF", icon: <PdfIcon fontSize="small" className="!w-4 text-red-500" /> },
];

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  busyFormat?: ExportFormat | null;
  label?: string;
}

function ExportMenu({ onExport, disabled, busyFormat, label = "Export All" }: ExportMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (format: ExportFormat) => {
    handleClose();
    await onExport(format);
  };

  return (
    <>
      <Button
        size="small"
        variant={label === 'Export All' ? 'contained' : 'outlined'}
        disabled={disabled || !!busyFormat}
        onClick={handleOpen}
        startIcon={<DownloadIcon className={`!w-4 ${label === 'Export All' ? '' : 'text-primary'} `} />}
        className={`!border !border-gray-200 ${label === 'Export All' ? '!bg-primary' : '!text-gray-800 '} `}
      >
        {busyFormat ? `Exporting ${busyFormat.toUpperCase()}...` : label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 170, mt: 0.5 } } }}
      >
        {EXPORT_OPTIONS.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
          >
            <ListItemIcon sx={{ minWidth: "24px !important" }}>{opt.icon}</ListItemIcon>
            Export as {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AssignSalaryStructure() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const navigate = useNavigate();
  const { tab: activeTabPath } = useParams<{ tab?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenHandledRef = useRef(false);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeGroups, setEmployeeGroups] = useState<{ id: string; name: string }[]>([]);

  // ── Pagination (server-side, on assignments) ────────────────────────────────
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sort] = useState("employeeCode,asc");
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ── UI state ────────────────────────────────────────────────────────────────
  const tabValue = activeTabPath === "breakdown" ? 1 : 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmployeeGroup, setSelectedEmployeeGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState("assigned");
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // ── Export state ────────────────────────────────────────────────────────────
  const [exportingList, setExportingList] = useState<ExportFormat | null>(null);
  const [exportingEmployeeId, setExportingEmployeeId] = useState<string | null>(null);

  // ── Multi-select state ──────────────────────────────────────────────────────
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // ── Assignment form state ───────────────────────────────────────────────────
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningEmployee, setAssigningEmployee] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ctcAmount, setCtcAmount] = useState<number>(0);
  const [ctcMode, setCtcMode] = useState<"annual" | "monthly" | "perday">("monthly");
  const [workingDays, setWorkingDays] = useState<number>(31);
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "", bankName: "", ifscCode: "", branch: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // ── Initial load (once): structures ─────────────────────────────────────────
  useEffect(() => {
    loadStructures();
    loadDepartments();
    loadEmployeeGroups();
  }, []);

  // ── Whenever pagination changes, re-fetch assignments from the server ───────
  useEffect(() => {
    loadAssignmentsPage();
  }, [page, limit, sort, statusFilter, searchQuery, selectedDept, selectedEmployeeGroup]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0);
      clearSelection();
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadDepartments = async () => {
    try {
      const res: any = await departmentService.getActiveDepartments();
      setDepartments(res.data.content || []);
    } catch (error: any) {
      showSnackbar(error.message, "error")
    }
  }

  const loadEmployeeGroups = async () => {
    try {
      const category: any = await categoryService.getActiveCategoryItem();
      const templateCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('employee group')
      );
      if (templateCategory) {
        setEmployeeGroups(templateCategory.items || []);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const loadStructures = async () => {
    try {
      const structuresRes: any = await salaryStructureService.getSalaryStructures({
        status: "PUBLISHED",
        size: 100,
      });
      setStructures(structuresRes.data?.content || []);
    } catch (error) {
      showSnackbar("Failed to load salary structures", "error");
    }
  };

  const loadAssignmentsPage = async () => {
    showSpinner();
    try {
      const params: any = {
        page,
        size: limit,
        sort: [sort],
        status: getApiStatus(statusFilter),
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedDept !== "all") params.departmentId = selectedDept;
      if (selectedEmployeeGroup !== "all") params.employeeGroupId = selectedEmployeeGroup;

      const res: any = await assignmentService.getAssignments(params);
      const data = res.data || {};
      setAssignments(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.totalElements || 0);
    } catch (error) {
      showSnackbar("Failed to load assignments", "error");
    } finally {
      hideSpinner();
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadStructures(), loadAssignmentsPage()]);
  };

  const employeesWithAssignment = useMemo(() => {
    return assignments.map((a) => {
      const status = (a.status || "UNASSIGNED").toUpperCase();
      const isAssigned = status !== "UNASSIGNED";
      return {
        id: a.id || a.employeeId,
        assignmentId: a.id,
        employeeId: a.employeeId,
        employeeCode: a.employeeCode,
        name: a.employeeName,
        department: a.department,
        designation: a.designation,
        employeeGroup: a.employeeGroup,
        assignment: isAssigned ? a : null,
        isAssigned,
        assignmentStatus: status.toLowerCase(),
      };
    });
  }, [assignments]);

  const paginatedEmployees = useMemo(() => {
    return employeesWithAssignment.filter((emp) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "assigned" && emp.isAssigned) ||
        (statusFilter === "unassigned" && !emp.isAssigned) ||
        emp.assignmentStatus === statusFilter;

      return matchesStatus;
    });
  }, [employeesWithAssignment, statusFilter]);

  // ── Selectable on page (only unassigned) ────────────────────────────────────
  const selectableOnPage = useMemo(
    () => paginatedEmployees.filter((e) => !e.isAssigned).map((e) => e.id),
    [paginatedEmployees]
  );

  const allOnPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((id) => selectedEmployees.includes(id));
  const someOnPageSelected = selectedEmployees.length > 0 && !allOnPageSelected;

  // ── Multi-select handlers ───────────────────────────────────────────────────
  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedEmployees((prev) => prev.filter((id) => !selectableOnPage.includes(id)));
    } else {
      setSelectedEmployees((prev) => [...new Set([...prev, ...selectableOnPage])]);
    }
  };

  const clearSelection = () => setSelectedEmployees([]);

  // ── Assignment dialog handlers ──────────────────────────────────────────────
  const openAssignDialog = (employee: any) => {
    setBulkAssignMode(false);
    setSelectedEmployees([]);
    setAssigningEmployee(employee);
    setSelectedTemplate("");
    setSelectedTemplateDetails(null);
    setCtcMode("monthly");
    setWorkingDays(31);
    setBankDetails({ accountNumber: "", bankName: "", ifscCode: "", branch: "" });
    setShowBreakdown(false);
    setActiveStep(0);

    // Pre-fill CTC if employee already has an assignment (edit mode)
    if (employee.isAssigned && employee.assignment) {
      const existing = employee.assignment;
      const monthlyCtc =
        existing.monthlyCtc ||
        (existing.annualCtc ? existing.annualCtc / 12 : 0) ||
        (existing.ctcAmount ? existing.ctcAmount / 12 : 0);

      setCtcAmount(monthlyCtc);
      setCtcMode("monthly");

      // Pre-select the existing template
      if (existing.structureId) {
        setSelectedTemplate(existing.structureId);
        fetchTemplateDetails(existing.structureId);
      }
    } else {
      setCtcAmount(0);
      setSelectedTemplate("");
    }

    setAssignDialogOpen(true);

    const group = (employee.employeeGroup || "").toLowerCase();
    if (group.includes("staff")) {
      setCtcMode("monthly");
      setWorkingDays(31);
    } else if (group.includes("labour") || group.includes("labor")) {
      setCtcMode("perday");
      setWorkingDays(31);
      // If labour has existing assignment, set per-day amount
      if (employee.isAssigned && employee.assignment) {
        const monthlyCtc =
          employee.assignment.monthlyCtc ||
          (employee.assignment.annualCtc ? employee.assignment.annualCtc / 12 : 0);
        setCtcAmount(workingDays > 0 ? monthlyCtc / workingDays : 0);
      }
    }
  };

  const openBulkAssignDialog = () => {
    if (selectedEmployees.length === 0) {
      showSnackbar("Please select at least one employee", "warning");
      return;
    }
    const firstEmp = employeesWithAssignment.find((e) => e.id === selectedEmployees[0]);
    setBulkAssignMode(true);
    setAssigningEmployee(firstEmp);
    setSelectedTemplate("");
    setSelectedTemplateDetails(null);
    setCtcAmount(0);   // bulk → keep 0 (user enters new CTC for all)
    setCtcMode("monthly");
    setWorkingDays(31);
    setBankDetails({ accountNumber: "", bankName: "", ifscCode: "", branch: "" });
    setShowBreakdown(false);
    setActiveStep(0);
    setAssignDialogOpen(true);

    const group = (firstEmp?.employeeGroup || "").toLowerCase();
    if (group.includes("staff")) {
      setCtcMode("monthly");
      setWorkingDays(31);
    } else if (group.includes("labour") || group.includes("labor")) {
      setCtcMode("perday");
      setWorkingDays(31);
    }
  };

  const fetchTemplateDetails = async (templateId: string) => {
    if (!templateId) { setSelectedTemplateDetails(null); return; }
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

  // ── Breakdown calculation ───────────────────────────────────────────────────
  const calculateBreakdown = () => {
    if (!selectedTemplateDetails || !selectedTemplate || ctcAmount === 0) return null;

    let userMonthlyCtc = ctcAmount;
    if (ctcMode === "annual") userMonthlyCtc = ctcAmount / 12;
    else if (ctcMode === "monthly") userMonthlyCtc = ctcAmount;
    else if (ctcMode === "perday") userMonthlyCtc = ctcAmount * (workingDays || 31);

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
      if (basicComponent.calculationType === "PERCENT_OF_CTC" ||
        basicComponent.calculationType === "PERCENTAGE") {
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
            percentageOfCTC = earning.value; break;
          case "PERCENT_OF_BASIC":
            monthlyValue = (earning.value / 100) * basicAmount;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
          case "FIXED_AMOUNT":
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
          case "PERCENTAGE":
            monthlyValue = (earning.value / 100) * userMonthlyCtc;
            percentageOfCTC = earning.value; break;
          case "SLAB_BASED":
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
          case "FORMULA":
            monthlyValue = earning.computedMonthlyAmount || earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
          default:
            monthlyValue = earning.value || 0;
            percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
        }
        return {
          id: earning.id, componentId: earning.componentId,
          componentCode: earning.componentCode, componentName: earning.componentName,
          calculationType: earning.calculationType, value: earning.value,
          monthlyValue, annualValue: monthlyValue * 12, percentageOfCTC,
        };
      });

    const totalPercentageUsed = calculatedEarnings.reduce(
      (sum: number, e: any) => sum + e.percentageOfCTC, 0
    );

    const specialAllowancePercentage = 100 - totalPercentageUsed;
    const specialAllowanceAmount = userMonthlyCtc * (specialAllowancePercentage / 100);
    const specialAllowanceComponent = templateEarnings.find((e: any) =>
      isSpecialAllowance(e.componentName)
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
    } else if (Math.abs(specialAllowanceAmount) > 0.01) {
      allEarnings.push({
        id: "SPL", componentId: "SPL", componentCode: "SPL",
        componentName: "Special Allowance",
        calculationType: "PERCENT_OF_CTC",
        value: specialAllowancePercentage,
        monthlyValue: specialAllowanceAmount,
        annualValue: specialAllowanceAmount * 12,
        percentageOfCTC: specialAllowancePercentage,
        isSpecialAllowance: true,
      });
    }

    const scaledDeductions = templateDeductions.map((deduction: any) => {
      let monthlyValue = 0;
      let percentageOfCTC = 0;
      switch (deduction.calculationType) {
        case "PERCENT_OF_BASIC":
          monthlyValue = (deduction.value / 100) * basicAmount;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
        case "PERCENT_OF_CTC":
          monthlyValue = (deduction.value / 100) * userMonthlyCtc;
          percentageOfCTC = deduction.value; break;
        case "FIXED_AMOUNT":
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
        case "PERCENTAGE":
          monthlyValue = (deduction.value / 100) * userMonthlyCtc;
          percentageOfCTC = deduction.value; break;
        case "SLAB_BASED":
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100; break;
        default:
          monthlyValue = deduction.value || 0;
          percentageOfCTC = (monthlyValue / userMonthlyCtc) * 100;
      }
      return {
        id: deduction.id, componentId: deduction.componentId,
        componentCode: deduction.componentCode, componentName: deduction.componentName,
        calculationType: deduction.calculationType, value: deduction.value,
        monthlyValue, annualValue: monthlyValue * 12, percentageOfCTC,
      };
    });

    const totalEarningsMonthly = allEarnings.reduce((s: number, e: any) => s + e.monthlyValue, 0);
    const totalDeductionsMonthly = scaledDeductions.reduce((s: number, d: any) => s + d.monthlyValue, 0);
    const netMonthly = totalEarningsMonthly - totalDeductionsMonthly;

    return {
      earnings: allEarnings, deductions: scaledDeductions,
      totalEarningsMonthly, totalDeductionsMonthly, netMonthly,
      grossMonthly: totalEarningsMonthly,
      annualCtc: userMonthlyCtc * 12,
      basicAmount, userMonthlyCtc,
      templateName: selectedTemplateDetails.name,
      templateCode: selectedTemplateDetails.code,
      specialAllowance: { percentage: specialAllowancePercentage, amount: specialAllowanceAmount },
      totalPercentageUsed,
    };
  };

  const breakdown = calculateBreakdown();

  // ── Submit assignment ───────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedTemplate) { showSnackbar("Please select a salary template", "warning"); return; }
    if (ctcAmount <= 0) { showSnackbar("Please enter a valid CTC amount", "warning"); return; }
    if (ctcMode === "perday" && workingDays <= 0) {
      showSnackbar("Please enter valid working days", "warning"); return;
    }
    const employeeIds = bulkAssignMode
      ? selectedEmployees
        .map((id) => employeesWithAssignment.find((e) => e.id === id)?.employeeId)
        .filter(Boolean)
      : [assigningEmployee.employeeId];

    if (employeeIds.length === 0) { showSnackbar("No employees selected", "warning"); return; }

    showSpinner();
    try {
      let annualCtc = ctcAmount;
      if (ctcMode === "monthly") annualCtc = ctcAmount * 12;
      else if (ctcMode === "perday") annualCtc = ctcAmount * (workingDays || 31) * 12;

      const payload: any = {
        employeeIds, structureId: selectedTemplate, ctcAmount: annualCtc,
        ctcPeriod: "ANNUAL",
        effectiveFrom: new Date().toISOString().split("T")[0],
      };

      if (!bulkAssignMode && bankDetails.accountNumber) {
        payload.bankDetails = {
          accountNumber: bankDetails.accountNumber, bankName: bankDetails.bankName,
          ifscCode: bankDetails.ifscCode, branch: bankDetails.branch,
        };
      }

      const res: any = await assignmentService.createBulkAssignment(payload);
      const count = res?.data?.assigned || employeeIds.length;

      showSnackbar(
        bulkAssignMode
          ? `Salary structure assigned to ${count} employee(s) successfully!`
          : `Salary structure assigned to ${assigningEmployee?.name} successfully!`,
        "success"
      );

      setAssignDialogOpen(false);
      setAssigningEmployee(null);
      setSelectedEmployees([]);
      setBulkAssignMode(false);
      navigate("/employees", { state: { removePageHistoryPath: "/payroll/assign" } });
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to assign salary structure", "error");
    } finally {
      hideSpinner();
    }
  };

  // ── History ─────────────────────────────────────────────────────────────────
  const handleViewHistory = async (employeeId: string) => {
    showSpinner();
    try {
      const res: any = await assignmentService.getEmployeeAssignmentHistory(employeeId);
      const revisions = (res.data || []).sort(
        (a: any, b: any) =>
          new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
      );
      setAssignmentHistory(revisions);
      setOpenHistoryDialog(true);
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

  // ── Export handlers ─────────────────────────────────────────────────────────
  const handleExportList = async (format: ExportFormat) => {
    setExportingList(format);
    showSpinner();
    try {
      const params: any = {
        sort: [sort],
        status: getApiStatus(statusFilter),
        exportFormat: format,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedDept !== "all") params.departmentId = selectedDept;
      if (selectedEmployeeGroup !== "all") params.employeeGroupId = selectedEmployeeGroup;

      const res: any = await assignmentService.getAssignments(params);
      const fileUrl: string | undefined = res?.data?.fileUrl;
      if (!fileUrl) throw new Error(res?.message || "No file URL returned from server");

      const ext = format === "excel" ? "xlsx" : format;
      await apiService.downloadFromPath(fileUrl, `salary-assignments.${ext}`);
      showSnackbar(`Exported as ${format.toUpperCase()}`, "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Export failed", "error");
    } finally {
      setExportingList(null);
      hideSpinner();
    }
  };

  const handleExportEmployee = async (employeeId: string, format: ExportFormat) => {
    setExportingEmployeeId(employeeId);
    showSpinner();
    try {
      const res: any = await assignmentService.getAssignmentByEmployee(employeeId, format);
      const fileUrl: string | undefined = res?.data?.fileUrl;
      if (!fileUrl) {
        throw new Error(res?.message || "No file URL returned from server");
      }
      const ext = format === "excel" ? "xlsx" : format;
      await apiService.downloadFromPath(fileUrl, `Salary Assignment-${employeeId}.${ext}`);
      showSnackbar(`Exported as ${format.toUpperCase()}`, "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Export failed", "error");
    } finally {
      setExportingEmployeeId(null);
      hideSpinner();
    }
  };

  // ── Pagination handlers (server-side) ───────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
    setSelectedEmployees([]);
  };
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
    setSelectedEmployees([]);
  };

  // ── Filter change handlers ──────────────────────────────────────────────────
  const handleDeptChange = (v: string) => {
    setSelectedDept(v);
    setPage(0);
    clearSelection();
  };
  const handleGroupChange = (v: string) => {
    setSelectedEmployeeGroup(v);
    setPage(0);
    clearSelection();
  };
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(0);
    clearSelection();
  };

  const handleTabChange = (_e: React.SyntheticEvent, newValue: number) => {
    const search = searchParams.toString();
    navigate(`/payroll/assign/${newValue === 1 ? "breakdown" : "list"}${search ? `?${search}` : ""}`);
  };

  const isPreviewDisabled =
    !selectedTemplate || ctcAmount <= 0 || (ctcMode === "perday" && workingDays <= 0);

  // ── Assigned employees WITH components (Detailed Breakdown tab) ─────────────
  const assignedEmployees = useMemo(
    () =>
      employeesWithAssignment.filter(
        (e) => e.isAssigned && (e.assignment?.components?.length ?? 0) > 0
      ),
    [employeesWithAssignment]
  );

  // ── Auto-open assign dialog when ?employeeId= is present in URL ─────────────
  useEffect(() => {
    const targetId = searchParams.get("employeeId");
    if (!targetId) return;
    if (autoOpenHandledRef.current) return;
    if (employeesWithAssignment.length === 0) return;

    const target =
      employeesWithAssignment.find(
        (e) =>
          e.id === targetId ||
          e.employeeId === targetId ||
          e.employeeCode === targetId
      ) ||
      ({
        id: targetId,
        assignmentId: undefined,
        employeeId: targetId,
        employeeCode: targetId,
        name: "Selected Employee",
        department: "-",
        designation: "-",
        employeeGroup: "",
        assignment: null,
        isAssigned: false,
        assignmentStatus: "unassigned",
      } as any);

    autoOpenHandledRef.current = true;
    openAssignDialog(target);

    const next = new URLSearchParams(searchParams);
    next.delete("employeeId");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, employeesWithAssignment]);

  // ─── Render: Salary breakdown with charts ───────────────────────────────────
  const renderSalaryBreakdownWithCharts = () => {
    if (!breakdown) return null;
    const isMonthly = viewMode === "monthly";
    const totalEarnings = isMonthly ? breakdown.totalEarningsMonthly : breakdown.totalEarningsMonthly * 12;
    const totalDeductions = isMonthly ? breakdown.totalDeductionsMonthly : breakdown.totalDeductionsMonthly * 12;
    const netPay = isMonthly ? breakdown.netMonthly : breakdown.netMonthly * 12;

    const pieData = [
      ...breakdown.earnings.map((e: any) => ({
        name: e.componentName, value: isMonthly ? e.monthlyValue : e.annualValue, type: "earning",
      })),
      ...breakdown.deductions.map((d: any) => ({
        name: d.componentName, value: isMonthly ? d.monthlyValue : d.annualValue, type: "deduction",
      })),
    ];
    const dynamicColors = generateColorPalette(pieData.length);
    const tooltipFormatter = (value: any, _name: any, props: any) => {
      const componentName = props?.payload?.name || "Amount";
      if (typeof value === "number") return [formatCurrency(value), componentName];
      return [String(value || 0), componentName];
    };

    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <div className="bg-white-50 border border-gray-200">
          <CardContent className="!p-0">
            <Box className="p-4" sx={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PieChartIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gray-800">Salary Breakdown</Typography>
                  <Typography variant="caption" className="text-gray-800">
                    {breakdown.templateName} ({breakdown.templateCode})
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button size="small"
                  className={`${viewMode === "monthly" ? "!bg-primary" : "!text-primary !border-primary"}`}
                  variant={viewMode === "monthly" ? "contained" : "outlined"}
                  onClick={() => setViewMode("monthly")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}>Monthly</Button>
                <Button size="small"
                  className={`${viewMode === "annual" ? "!bg-primary" : "!text-primary !border-primary"}`}
                  variant={viewMode === "annual" ? "contained" : "outlined"}
                  onClick={() => setViewMode("annual")}
                  sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 2 }}>Annual</Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                    <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
                      Gross {isMonthly ? "Monthly" : "Annual"}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(totalEarnings)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                      Net {isMonthly ? "Monthly" : "Annual"}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(netPay)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.08), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                    <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>Total Deductions</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
                      {formatCurrency(totalDeductions)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper className="bg-white-50 border border-gray-200" sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.06), display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <TrendingUp sx={{ fontSize: 18, color: "success.main" }} />
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
                                    {isSpecial && <Chip label="Balancing" size="small" color="primary" sx={{ ml: 1, height: 16, fontSize: "0.55rem" }} />}
                                  </Typography>
                                  <Typography variant="caption" className="text-gray-500" sx={{ fontSize: "0.6rem", display: "block" }}>
                                    {isSpecial ? `${item.percentageOfCTC.toFixed(2)}% of CTC (Balancing)` : getValueDisplay(item.calculationType, item.value)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>
                                  <Typography sx={{ fontWeight: 600, color: isSpecial ? "primary.main" : "success.main", fontSize: "0.8rem" }}>
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
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper className="bg-white-50 border border-gray-200" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, overflow: "hidden", height: "100%" }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.06), display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                      <TrendingDown sx={{ fontSize: 18, color: "error.main" }} />
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
                                <Typography variant="caption" className="text-gray-500" sx={{ fontSize: "0.6rem", display: "block" }}>
                                  {getValueDisplay(item.calculationType, item.value)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1 }}>
                                <Typography sx={{ fontWeight: 600, color: "error.main", fontSize: "0.8rem" }}>
                                  -{formatCurrency(isMonthly ? item.monthlyValue : item.annualValue)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper className="bg-white-50 border border-blue-200" sx={{ borderRadius: 2, height: "100%" }}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06), display: "flex", alignItems: "center", gap: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                      <PieChartOutlined sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "primary.main" }}>
                        CTC Distribution
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={1200}>
                          {pieData.map((_e, index) => (
                            <Cell key={`cell-${index}`} fill={dynamicColors[index]} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={tooltipFormatter} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "0.7rem" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </div>
      </Slide>
    );
  };

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-white-50">
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }} className="border-b border-gray-200">
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
          sx={{ "& .MuiTabs-indicator": { backgroundColor: "var(--color-primary)", height: 3, borderRadius: "3px 3px 0 0" } }}>
          <Tab label="Assign Salary" className="!text-gray-800" />
          <Tab label="Detailed Breakdown" className="!text-gray-800" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AssessmentOutlined sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              <div className="text-gray-800 text-[12px] font-bold">Assign Salary</div>
              <div className="text-gray-500 text-[12px]">
                Select one or more employees, then assign a salary structure.
              </div>
            </Box>
          </div>
          {/* Filter bar */}
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-gray-50 border border-gray-200">
            <TextField
              placeholder="Search name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              sx={{
                flex: "1 1 200px", minWidth: 180,
                "& .MuiOutlinedInput-root": { height: 34, fontSize: "0.78rem", borderRadius: 1.5 }
              }}
            />

            <FormControl size="small" sx={{ width: 150, flex: "0 0 auto" }}>
              <Select
                value={selectedEmployeeGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                displayEmpty
                sx={compactSelectSx}
                renderValue={(val) => {
                  if (val === "all") return "All Groups";
                  const g = employeeGroups.find((x) => x.id === val);
                  return g?.name ?? "All Groups";
                }}
              >
                <MenuItem value="all">All Groups</MenuItem>
                {employeeGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150, flex: "0 0 auto" }}>
              <Select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                displayEmpty
                sx={compactSelectSx}
                renderValue={(val) => {
                  if (val === "all") return "All Departments";
                  const d = departments.find((x) => x.id === val);
                  return d?.departmentName ?? "All Departments";
                }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status pills — server-side */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              {[
                { value: "all", label: "All" },
                { value: "assigned", label: "Assigned" },
                { value: "unassigned", label: "Unassigned" },
              ].map((opt) => {
                const isActive = statusFilter === opt.value;
                return (
                  <Button
                    key={opt.value}
                    size="small"
                    disableElevation
                    onClick={() => handleStatusChange(opt.value)}
                    sx={{
                      fontWeight: isActive ? 600 : 500,
                      px: 1.5,
                      height: "100%",
                      borderRadius: 0,
                      color: isActive ? "#fff" : "var(--text-primary)",
                      bgcolor: isActive ? "var(--color-primary)" : "transparent",
                      "&:hover": {
                        bgcolor: isActive ? "var(--color-primary)" : "rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>

            <IconButton onClick={refreshAll} className="!border !border-gray-200 !rounded" size="small">
              <RefreshIcon className="!text-gray-800 !w-4" />
            </IconButton>
          </div>

          {/* Bulk action bar */}
          {selectedEmployees.length > 0 && (
            <Fade in>
              <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                p: 1, mb: 2, borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CheckCircleIcon className="text-primary" />
                  <Typography>
                    {selectedEmployees.length} employee{selectedEmployees.length > 1 ? "s" : ""} selected
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={clearSelection}
                  >Clear</Button>
                  <Button size="small" variant="contained" className="!bg-primary"
                    startIcon={<AssignIcon className="!w-4" />}
                    onClick={openBulkAssignDialog}
                  >
                    Assign to {selectedEmployees.length} Selected
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Employee table */}
          <TableContainer className={`border border-gray-200 rounded-md ${selectedEmployees.length === 0 ? 'max-h-[calc(100vh-330px)]' : 'max-h-[calc(100vh-400px)]'} overflow-auto`}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" className="!font-bold sticky left-0 !z-20 bg-white" style={{ width: 70 }}>
                    <Checkbox checked={allOnPageSelected} indeterminate={someOnPageSelected}
                      onChange={toggleAllOnPage} disabled={selectableOnPage.length === 0}
                      size="small" className="text-gray-800 !p-0" />
                  </TableCell>
                  <TableCell className="!font-bold sticky left-[70px] !z-20 bg-white">Employee</TableCell>
                  <TableCell className="!font-bold">Department</TableCell>
                  <TableCell className="!font-bold">Structure</TableCell>
                  <TableCell className="!font-bold">Annual CTC</TableCell>
                  <TableCell className="!font-bold">Monthly CTC</TableCell>
                  <TableCell className="!font-bold">Salary Status</TableCell>
                  <TableCell className="!font-bold sticky right-0 !z-20 bg-white" align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography className="text-gray-500 p-6">No employees found matching your criteria</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee, i) => {
                    const globalIndex = page * limit + i + 1;
                    const assignment = employee.assignment;
                    const status = employee.isAssigned
                      ? statusConfig[assignment?.status?.toLowerCase()] || statusConfig.active
                      : statusConfig.unassigned;

                    return (
                      <TableRow key={employee.id || i} sx={getRowColor(i)}>
                        <TableCell padding="checkbox" className="sticky left-0 bg-inherit !z-10"
                          onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Checkbox checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                              size="small" className="text-gray-800 !p-0" disabled={employee.isAssigned} />

                            <Typography sx={{ fontSize: "0.72rem", color: "#6b7280", minWidth: 16 }}>
                              {globalIndex}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell className="sticky left-[70px] bg-inherit !z-10">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 500 }}>{employee.name || "Unknown"}</Typography>
                              <Typography variant="caption" className="text-primary !text-[10px]">
                                {employee.employeeCode || employee.employeeId}
                                <span className="text-blue-500 ml-1">({employee.employeeGroup || "STAFF"})</span>
                              </Typography>

                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <div>{employee.department || "REACT"}</div>
                          <div className="text-primary text-[10px]">({employee.designation || "developer"})</div>
                        </TableCell>

                        <TableCell>
                          {employee.isAssigned ? (
                            <>
                              <Typography>{assignment.structureName || "N/A"}</Typography>
                              <Typography variant="caption" className="text-blue-500 !text-[10px]">
                                {assignment.structureCode}
                              </Typography>
                            </>
                          ) : (
                            <Typography className="text-gray-400">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.isAssigned ? (
                            <Typography sx={{ fontWeight: 600 }}>
                              {formatCurrency(assignment.annualCtc || assignment.ctcAmount || 0)}
                            </Typography>
                          ) : <Typography className="text-gray-400">-</Typography>}
                        </TableCell>
                        <TableCell>
                          {employee.isAssigned ? (
                            <Typography>
                              {formatCurrency(assignment.monthlyCtc || (assignment.ctcAmount / 12) || 0)}
                            </Typography>
                          ) : <Typography className="text-gray-400">-</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small"
                            sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }} />
                        </TableCell>
                        <TableCell align="center" className="sticky right-0 bg-inherit !z-10">
                          <div className="flex items-center justify-center gap-1">
                            {employee.isAssigned ? (
                              <>
                                <Tooltip title="View Details">
                                  <IconButton size="small" onClick={() => handleViewAssignment(assignment)}>
                                    <VisibilityOutlined fontSize="small" className="!w-4 text-primary" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View History">
                                  <IconButton size="small"
                                    onClick={() => handleViewHistory(assignment.employeeId || employee.employeeId)}>
                                    <HistoryIcon fontSize="small" className="!w-4 text-amber-500" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Re-assign Salary">
                                  <IconButton size="small" onClick={() => openAssignDialog(employee)}>
                                    <Edit fontSize="small" className="!w-3.5 text-blue-600" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Button size="small" variant="contained" className="!bg-primary"
                                startIcon={<AssignIcon className="!w-3.5" />}
                                onClick={() => openAssignDialog(employee)}
                                sx={{ textTransform: "none", fontSize: "0.7rem", borderRadius: 1.5, py: 0.3, px: 1.2 }}>
                                Assign
                              </Button>
                            )}
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
        </>
      )}

      {tabValue === 1 && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PieChartIcon sx={{ color: "primary.main" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <div className="text-gray-800 text-[12px] font-bold">Detailed Salary Breakdown</div>
              <div className="text-gray-500 text-[12px]">Component-level earnings and deductions for each assigned employee</div>
            </Box>

            {/* List-level export */}
            <ExportMenu
              onExport={(format) => handleExportList(format)}
              disabled={assignedEmployees.length === 0}
              busyFormat={exportingList}
            />
          </div>

          {(() => {
            // Build the dynamic component list from ALL assigned employees
            const componentMap = new Map<string, { name: string; type: string }>();
            assignedEmployees.forEach((emp) => {
              (emp.assignment?.components || []).forEach((c: any) => {
                const key = c.componentCode || c.componentName;
                if (key && !componentMap.has(key)) {
                  componentMap.set(key, {
                    name: c.componentName || key,
                    type: c.componentType || "EARNING",
                  });
                }
              });
            });

            // Sort: earnings first, deductions second; alpha within each
            const dynamicComponents = Array.from(componentMap.entries())
              .map(([code, meta]) => ({ code, ...meta }))
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === "EARNING" ? -1 : 1;
                return a.name.localeCompare(b.name);
              });

            if (assignedEmployees.length === 0) {
              return (
                <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-300px)] overflow-auto">
                  <Table stickyHeader size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell align="center">
                          <div className="text-gray-500 py-8 flex flex-col items-center gap-2">
                            <WarningIcon className="text-amber-500" />
                            <Typography>No assigned employees with component breakdown on this page</Typography>
                            <Typography variant="caption" className="text-gray-400">
                              Navigate to a page with assigned employees
                            </Typography>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            }

            return (
              <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-250px)] overflow-auto">
                <Table stickyHeader size="small" sx={{ tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow>
                      {/* # — sticky left, fixed 50px (needed for sticky offset) */}
                      <TableCell
                        className="!font-bold sticky left-0 !z-30 bg-inherit"
                        sx={{ width: 50, minWidth: 50, maxWidth: 50, p: "6px 8px" }}
                      >
                        #
                      </TableCell>

                      {/* Employee — sticky at left:50, fixed 150px for stable offset */}
                      <TableCell
                        className="!font-bold sticky !z-30 bg-inherit"
                        sx={{
                          left: 50,
                          width: 150,
                          minWidth: 150,
                          maxWidth: 150,
                          p: "6px 8px",
                        }}
                      >
                        Employee
                      </TableCell>

                      {/* Dynamic component columns — short label, value drives width */}
                      {dynamicComponents.map((comp) => (
                        <TableCell
                          key={comp.code}
                          className="!font-bold"
                          align="right"
                          sx={{ p: "6px 8px", maxWidth: 90 }}
                        >
                          <div
                            className="font-bold text-[12px] !capitalize"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={formatName(comp.name)}   // full name on hover
                          >
                            {shortenHeader(formatName(comp.name))}
                          </div>
                        </TableCell>
                      ))}

                      {/* Gross Monthly */}
                      <TableCell
                        className="!font-bold"
                        align="right"
                        sx={{ p: "6px 8px", maxWidth: 100 }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title="Gross Monthly"
                        >
                          {shortenHeader("Gross")}
                        </div>
                      </TableCell>

                      {/* Deductions */}
                      <TableCell
                        className="!font-bold"
                        align="right"
                        sx={{ p: "6px 8px", maxWidth: 100 }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title="Deductions"
                        >
                          {("Deductions")}
                        </div>
                      </TableCell>

                      {/* Net Monthly */}
                      <TableCell
                        className="!font-bold"
                        align="right"
                        sx={{ p: "6px 8px", maxWidth: 90 }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title="Net Monthly"
                        >
                          {shortenHeader("Net Amt")}
                        </div>
                      </TableCell>

                      {/* Annual CTC */}
                      <TableCell
                        className="!font-bold"
                        align="right"
                        sx={{ p: "6px 8px", maxWidth: 90 }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title="Annual CTC"
                        >
                          {shortenHeader("CTC")}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell
                        className="!font-bold"
                        align="center"
                        sx={{ p: "6px 8px", maxWidth: 90 }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title="Status"
                        >
                          Status
                        </div>
                      </TableCell>

                      {/* Export — sticky right, fixed 90px */}
                      <TableCell
                        className="!font-bold sticky right-0 !z-30 bg-white"
                        align="center"
                        sx={{ width: 90, minWidth: 90, maxWidth: 90, p: "6px 8px" }}
                      >
                        Export
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {assignedEmployees.map((employee, empIdx) => {
                      const assignment = employee.assignment;
                      const annualCtc = assignment.annualCtc || assignment.ctcAmount || 0;

                      const allComponents: any[] = assignment.components || [];
                      const earnings = allComponents.filter((c: any) => c.componentType === "EARNING");
                      const deductions = allComponents.filter((c: any) => c.componentType === "DEDUCTION");

                      const grossMonthly = earnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);
                      const totalDeductions = deductions.reduce((s: number, d: any) => s + (d.amount || 0), 0);
                      const netMonthly = grossMonthly - totalDeductions;

                      const compLookup = new Map<string, number>();
                      allComponents.forEach((c: any) => {
                        const key = c.componentCode || c.componentName;
                        compLookup.set(key, c.amount || 0);
                      });

                      return (
                        <TableRow key={employee.id} sx={getRowColor(empIdx)}>
                          {/* # sticky left */}
                          <TableCell
                            className="sticky left-0 !z-20 bg-inherit"
                            sx={{ width: 50, minWidth: 50, maxWidth: 50, p: "6px 8px" }}
                          >
                            <Typography>{empIdx + 1}</Typography>
                          </TableCell>

                          {/* Employee sticky at left:50 */}
                          <TableCell
                            className="sticky !z-20 bg-inherit"
                            sx={{
                              left: 50,
                              width: 150,
                              minWidth: 150,
                              maxWidth: 150,
                              p: "6px 8px",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <div
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {employee.name || "Unknown"}{" "}
                                <span className="text-primary text-[10px]">({employee.employeeCode})</span>
                              </div>
                            </Box>
                          </TableCell>

                          {/* Dynamic component amount cells — value drives width */}
                          {dynamicComponents.map((comp) => {
                            const amount = compLookup.get(comp.code);
                            const hasValue = amount !== undefined && amount !== null && amount !== 0;
                            const isEarning = comp.type === "EARNING";

                            return (
                              <TableCell
                                key={comp.code}
                                align="right"
                                sx={{ whiteSpace: "nowrap", p: "6px 8px" }}
                              >
                                {hasValue ? (
                                  <Typography>
                                    {isEarning ? "" : "-"}
                                    {formatCurrency(amount)}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ color: "#d1d5db" }}>0</Typography>
                                )}
                              </TableCell>
                            );
                          })}

                          {/* Gross Monthly */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", p: "6px 8px" }}>
                            <Typography className="text-green-600" sx={{ fontWeight: 600 }}>
                              {formatCurrency(grossMonthly)}
                            </Typography>
                          </TableCell>

                          {/* Deductions */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", p: "6px 8px" }}>
                            <Typography className="text-red-600" sx={{ fontWeight: 600 }}>
                              -{formatCurrency(totalDeductions)}
                            </Typography>
                          </TableCell>

                          {/* Net Monthly */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", p: "6px 8px" }}>
                            <Typography className="text-blue-700" sx={{ fontWeight: 700 }}>
                              {formatCurrency(netMonthly)}
                            </Typography>
                          </TableCell>

                          {/* Annual CTC */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap", p: "6px 8px" }}>
                            <Typography sx={{ fontWeight: 600 }}>{formatCurrency(annualCtc)}</Typography>
                          </TableCell>

                          {/* Status */}
                          <TableCell align="center" sx={{ whiteSpace: "nowrap", p: "6px 8px" }}>
                            <Chip
                              label={
                                statusConfig[assignment?.status?.toLowerCase()]?.label ||
                                assignment?.status ||
                                "Active"
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  statusConfig[assignment?.status?.toLowerCase()]?.bgColor || "#d1fae5",
                                color:
                                  statusConfig[assignment?.status?.toLowerCase()]?.color || "#10b981",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>

                          {/* Export — sticky right */}
                          <TableCell
                            className="sticky right-0 !z-20 bg-inherit"
                            align="center"
                            sx={{ width: 90, minWidth: 90, maxWidth: 90, p: "6px 8px" }}
                          >
                            <ExportMenu
                              label="Export"
                              onExport={(format) =>
                                handleExportEmployee(
                                  assignment.employeeId || employee.employeeId,
                                  format
                                )
                              }
                              busyFormat={
                                exportingEmployeeId === (assignment.employeeId || employee.employeeId)
                                  ? exportingList
                                  : null
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </>
      )}

      {/* ASSIGN SALARY DIALOG */}
      <Dialog open={assignDialogOpen} onClose={() => { setAssignDialogOpen(false); setBulkAssignMode(false); }}
        fullWidth sx={dialogSx}>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
            <Avatar sx={{
              width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main", fontSize: "0.8rem", fontWeight: 600
            }}>
              {bulkAssignMode ? selectedEmployees.length : (assigningEmployee?.name?.charAt(0) || "?")}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {bulkAssignMode ? `Assign Salary — ${selectedEmployees.length} Employees` : `Assign Salary — ${assigningEmployee?.name}`}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {bulkAssignMode ? `Bulk assignment for ${selectedEmployees.length} selected employee(s)`
                  : `${assigningEmployee?.employeeCode || assigningEmployee?.employeeId} · ${assigningEmployee?.department || "-"} · ${assigningEmployee?.designation || "-"}`}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setAssignDialogOpen(false); setBulkAssignMode(false); }} size="small">
            <CloseIcon className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-0">
          <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-white">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", bgcolor: activeStep === 0 ? "var(--color-primary)" : "success.main",
                color: "white", fontWeight: 600, fontSize: "0.75rem"
              }}>
                {activeStep === 0 ? "1" : "✓"}
              </Box>
              <Typography sx={{ fontWeight: activeStep === 0 ? 600 : 400 }}>Select & Configure</Typography>
            </Box>
            <Box sx={{ flex: 1, height: 2, bgcolor: activeStep === 1 ? "success.main" : "#e5e7eb" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", bgcolor: activeStep === 1 ? "var(--color-primary)" : "#d1d5db",
                color: "white", fontWeight: 600, fontSize: "0.75rem"
              }}>2</Box>
              <Typography sx={{ fontWeight: activeStep === 1 ? 600 : 400 }}>Salary Breakdown</Typography>
            </Box>
          </div>

          {!showBreakdown ? (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={2.5}>
                    <FormControl fullWidth>
                      <InputLabel>Select Salary Structure <span className="text-error">*</span></InputLabel>
                      <Select value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}
                        label="Select Salary Structure *" required>
                        {structures.map((t) => (
                          <MenuItem key={t.id} value={t.id}>{t.name} ({t.code})</MenuItem>
                        ))}
                        <MenuItem className="!text-primary" onClick={() => navigate("/payroll/structures")}>
                          <AddCircle className="mr-2" /> Add Salary Structure
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography sx={{ fontWeight: 500, mb: 0.5, ml: 0.5 }} className="text-gray-800">
                        {ctcMode === "perday" ? "Per Day" : ctcMode === "monthly" ? "Monthly" : "CTC"} Amount <span className="text-error">*</span>
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select value={ctcMode}
                            onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly" | "perday")}
                            sx={selectSx}>
                            <MenuItem value="annual">Annual</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="perday">Per Day</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField type="number"
                          value={ctcMode === "perday" ? ctcAmount * workingDays : ctcAmount}
                          onChange={(e) => setCtcAmount(Number(e.target.value))}
                          placeholder={ctcMode === "annual" ? "Enter annual amount"
                            : ctcMode === "monthly" ? "Enter monthly amount" : "Enter per day amount"}
                          fullWidth size="small" disabled={ctcMode === "perday"} />
                        {ctcMode === "perday" && (
                          <TextField type="number" value={ctcAmount || ""}
                            onChange={(e) => setCtcAmount(Number(e.target.value))}
                            placeholder="Enter per day amount" fullWidth size="small" />
                        )}
                      </Box>

                      {ctcMode === "perday" && (
                        <>
                          <Box sx={{ mt: 1.5 }}>
                            <Typography sx={{ fontWeight: 500, mb: 0.5, ml: 0.5 }} className="text-gray-800">
                              Working Days <span className="text-error">*</span>
                            </Typography>
                            <TextField type="number" value={workingDays || ""}
                              onChange={(e) => setWorkingDays(Number(e.target.value))}
                              placeholder="Enter working days (e.g., 30)" fullWidth size="small"
                              slotProps={{ htmlInput: { min: 1, max: 31 } }} />
                            {ctcAmount > 0 && workingDays > 0 && (
                              <Typography variant="caption" className="text-gray-500"
                                sx={{ ml: 0.5, mt: 0.5, display: "block" }}>
                                Monthly CTC = {formatCurrency(ctcAmount)} × {workingDays} days ={" "}
                                <strong>{formatCurrency(ctcAmount * workingDays)}</strong> | Annual ={" "}
                                <strong>{formatCurrency(ctcAmount * workingDays * 12)}</strong>
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>{renderSalaryBreakdownWithCharts()}</Box>
          )}
        </DialogContent>

        <DialogActions className="border-t border-gray-200 !p-4 !px-6">
          {!showBreakdown ? (
            <>
              <Button onClick={() => { setAssignDialogOpen(false); setBulkAssignMode(false); }}
                variant="outlined" className="!border-gray-200 !text-gray-800">Cancel</Button>
              <Button variant="contained" className="!bg-primary" disabled={isPreviewDisabled}
                onClick={() => { if (!isPreviewDisabled) { setShowBreakdown(true); setActiveStep(1); } }}
                sx={{ textTransform: "none" }}>Preview Salary Breakdown</Button>
            </>
          ) : (
            <>
              <Button variant="outlined"
                onClick={() => { setShowBreakdown(false); setActiveStep(0); }}
                className="!text-gray-800 !border-gray-200">Back</Button>
              <Button variant="contained" className="!bg-primary"
                startIcon={<DollarSignIcon />} onClick={handleAssign}
                sx={{ textTransform: "none" }}>
                {bulkAssignMode
                  ? `Assign Salary to ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? "s" : ""}`
                  : `Assign Salary to ${assigningEmployee?.name}`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* VIEW ASSIGNMENT DIALOG */}
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
                <Typography>{formatDate(selectedAssignment.effectiveFrom)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Status</Typography>
                <Chip
                  label={statusConfig[selectedAssignment.status?.toLowerCase()]?.label || selectedAssignment.status}
                  size="small"
                  sx={{
                    bgcolor: statusConfig[selectedAssignment.status?.toLowerCase()]?.bgColor || "#f3f4f6",
                    color: statusConfig[selectedAssignment.status?.toLowerCase()]?.color || "#6b7280",
                  }} />
              </Grid>

              {/* Components */}
              {(selectedAssignment.components?.length ?? 0) > 0 && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="text-primary !font-bold">Salary Breakdown</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Table size="small" className="border border-gray-200 rounded-lg">
                      <TableHead>
                        <TableRow>
                          <TableCell className="!font-bold">Component</TableCell>
                          <TableCell className="!font-bold">Type</TableCell>
                          <TableCell className="!font-bold" align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAssignment.components.map((c: any, idx: number) => (
                          <TableRow key={idx} sx={getRowColor(idx)}>
                            <TableCell>{c.componentName}</TableCell>
                            <TableCell>
                              <Chip
                                label={c.componentType}
                                size="small"
                                sx={{
                                  bgcolor: c.componentType === "EARNING" ? "#d1fae5" : "#fee2e2",
                                  color: c.componentType === "EARNING" ? "#059669" : "#dc2626",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                  height: 20,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(c.amount || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Created At</Typography>
                <Typography>{formatDate(selectedAssignment.createdAt)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined"
            className="!border-gray-200 !text-gray-800">Close</Button>
        </DialogActions>
      </Dialog>

      {/* HISTORY DIALOG */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        fullWidth
        maxWidth="xl"
        sx={dialogSx}
      >
        <DialogTitle className="flex items-center justify-between !p-3 border-b border-gray-200">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 1 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <HistoryIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Salary Revision History
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {assignmentHistory.length} revision
                {assignmentHistory.length !== 1 ? "s" : ""} found
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenHistoryDialog(false)} size="small">
            <CloseIcon className="text-gray-800" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="!p-3">
          {assignmentHistory.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <HistoryIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
              <Typography className="text-gray-500">
                No revision history found for this employee
              </Typography>
            </Box>
          ) : (
            (() => {
              const componentNames: string[] = [];
              assignmentHistory.forEach((rev: any) => {
                (rev.components || []).forEach((c: any) => {
                  const name = c.componentName || c.name;
                  if (name && !componentNames.includes(name)) {
                    componentNames.push(name);
                  }
                });
              });

              const preferredOrder = [
                "BASIC",
                "DA",
                "HRA",
                "MEDICAL ALLOWANCE",
                "SPECIAL ALLOWANCE",
              ];
              componentNames.sort((a, b) => {
                const ai = preferredOrder.findIndex((p) =>
                  a.toUpperCase().includes(p)
                );
                const bi = preferredOrder.findIndex((p) =>
                  b.toUpperCase().includes(p)
                );
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.localeCompare(b);
              });

              const getComponent = (rev: any, name: string) =>
                (rev.components || []).find(
                  (c: any) =>
                    (c.componentName || c.name)?.toLowerCase() ===
                    name.toLowerCase()
                );

              const renderComp = (comp: any, emphasisColor = "success.main") => {
                if (!comp) {
                  return (
                    <div className="text-gray-800">—</div>
                  );
                }
                const delta = comp.delta ?? 0;
                const positive = delta > 0;
                const negative = delta < 0;
                return (
                  <Box sx={{ textAlign: "right" }}>
                    <div className="text-gray-800 !font-bold">
                      {formatCurrency(comp.newValue || 0)}
                    </div>
                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        fontWeight: 600,
                        color: positive
                          ? emphasisColor
                          : negative
                            ? "error.main"
                            : "#9ca3af",
                      }}
                    >
                      {positive ? "+" : ""}
                      {formatCurrency(delta)}
                      {comp.deltaPercent != null
                        ? ` (${positive ? "+" : ""}${comp.deltaPercent.toFixed(2)}%)`
                        : ""}
                    </Typography>
                  </Box>
                );
              };

              return (
                <TableContainer sx={{ maxHeight: "72vh" }}>
                  <Table
                    stickyHeader
                    size="small"
                    className="border border-gray-200"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell className="!font-bold !sticky !left-0 bg-inherit !z-40">
                          Effective From
                        </TableCell>
                        <TableCell className="!font-bold !sticky !left-[110px] !z-40">Reason</TableCell>
                        <TableCell className="!font-bold" align="right">
                          Old CTC
                        </TableCell>
                        <TableCell className="!font-bold" align="right">
                          New CTC
                        </TableCell>
                        <TableCell className="!font-bold" align="right">
                          Increment
                        </TableCell>

                        {componentNames.map((name) => (
                          <TableCell
                            key={name}
                            className="!font-bold"
                            align="right"
                          >
                            {formatName(name)}
                          </TableCell>
                        ))}

                        <TableCell className="!font-bold">
                          Approved By
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {assignmentHistory.map((rev: any, i: number) => {
                        const isIncrement = (rev.incrementAmount ?? 0) > 0;
                        const isDecrement = (rev.incrementAmount ?? 0) < 0;

                        const reasonColors: Record<
                          string,
                          { bg: string; color: string }
                        > = {
                          PROMOTION: { bg: "#dbeafe", color: "#1d4ed8" },
                          PERFORMANCE: { bg: "#d1fae5", color: "#059669" },
                          APPRAISAL: { bg: "#fef3c7", color: "#d97706" },
                          CORRECTION: { bg: "#f3e8ff", color: "#7c3aed" },
                          MARKET_ADJUSTMENT: {
                            bg: "#e0f2fe",
                            color: "#0369a1",
                          },
                        };
                        const reasonStyle = reasonColors[rev.reason] || {
                          bg: "#f3f4f6",
                          color: "#6b7280",
                        };

                        return (
                          <TableRow key={rev.id || i} sx={getRowColor(i)}>
                            <TableCell className="!sticky !left-0 bg-inherit">
                              <Typography>
                                {formatDate(rev.effectiveFrom)}
                              </Typography>
                            </TableCell>

                            <TableCell className="!sticky !left-[110px] bg-inherit">
                              <Chip
                                label={rev.reason?.replace(/_/g, " ") || "—"}
                                size="small"
                                sx={{
                                  bgcolor: reasonStyle.bg,
                                  color: reasonStyle.color,
                                  fontWeight: 600,
                                  fontSize: "0.62rem",
                                  height: 20,
                                }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Typography>
                                {formatCurrency(rev.oldCtc ?? 0)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <div className="text-blue-700 !font-bold">
                                {formatCurrency(rev.newCtc ?? 0)}
                              </div>
                            </TableCell>

                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.4,
                                  px: 0.8,
                                  py: 0.2,
                                  borderRadius: 1,
                                  bgcolor: isIncrement
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : isDecrement
                                      ? alpha(theme.palette.error.main, 0.1)
                                      : alpha(theme.palette.grey[500], 0.1),
                                }}
                              >
                                {isIncrement ? (
                                  <TrendingUp
                                    sx={{ fontSize: 13, color: "success.main" }}
                                  />
                                ) : isDecrement ? (
                                  <TrendingDown
                                    sx={{ fontSize: 13, color: "error.main" }}
                                  />
                                ) : null}
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    color: isIncrement
                                      ? "success.main"
                                      : isDecrement
                                        ? "error.main"
                                        : "text.secondary",
                                  }}
                                >
                                  {isIncrement ? "+" : ""}
                                  {formatCurrency(rev.incrementAmount ?? 0)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "0.62rem",
                                    color: isIncrement
                                      ? "success.main"
                                      : isDecrement
                                        ? "error.main"
                                        : "text.secondary",
                                  }}
                                >
                                  ({isIncrement ? "+" : ""}
                                  {(rev.incrementPercent ?? 0).toFixed(2)}%)
                                </Typography>
                              </Box>
                            </TableCell>

                            {componentNames.map((name) => (
                              <TableCell key={name} align="right">
                                {renderComp(getComponent(rev, name))}
                              </TableCell>
                            ))}

                            <TableCell>
                              <Typography>
                                {rev.approvedBy?.split("@")[0] || "—"}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500"
                                sx={{ fontSize: "0.6rem" }}
                              >
                                {rev.createdAt ? formatDate(rev.createdAt) : ""}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()
          )}
        </DialogContent>

        <DialogActions className="border-t border-gray-200 !p-3 !px-5">
          <Button
            onClick={() => setOpenHistoryDialog(false)}
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}