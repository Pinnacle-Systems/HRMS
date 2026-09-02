import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  CircularProgress,
  Tooltip,
  Tab,
  Tabs,
  ListItemIcon,
  ListItemText,
  Menu, // Import Menu from @mui/material, not @mui/icons-material
} from "@mui/material";
import {
  Add as PlusIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as DollarSignIcon,
  Warning as AlertTriangleIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  LocalAtm as LoanIcon,
  PlayArrow as PlayArrowIcon,
  MoreVert as MoreVertIcon, // Use MoreVert from @mui/icons-material
} from "@mui/icons-material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { formatCurrency } from "../const";
import {
  employeeDeductionsService,
  type EmployeeDeduction,
  type EmployeeDeductionOverview,
  type EmployeeDeductionQuery,
} from "../../../services/modules/payrollServices/deductions";
import { useUI } from "../../../context/Snackbar";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { dialogsx } from "../../../const";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { Employee as EmployeeType } from "../../../types";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";

// Constants
const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

const DEDUCTION_TYPES = [
  { value: "LOAN_EMI", label: "Loan EMI" },
  { value: "ADVANCE", label: "Salary Advance" },
  { value: "CANTEEN", label: "Canteen" },
  { value: "OTHER", label: "Other" },
] as const;

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
  PAUSED: { label: "Paused", color: "#f59e0b", bgColor: "#fef3c7", icon: PauseIcon },
  COMPLETED: { label: "Completed", color: "#6b7280", bgColor: "#f3f4f6", icon: CheckCircleIcon },
  CANCELLED: { label: "Cancelled", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
} as const;

// Updated STATUS_ACTIONS with all possible transitions
const STATUS_ACTIONS: Record<string, Array<{ label: string; value: string; icon: any; color: string }>> = {
  ACTIVE: [
    { label: "Pause", value: "PAUSED", icon: PauseIcon, color: "#f59e0b" },
    { label: "Cancel", value: "CANCELLED", icon: CancelIcon, color: "#ef4444" },
    { label: "Complete", value: "COMPLETED", icon: CheckCircleIcon, color: "#10b981" },
  ],
  PAUSED: [
    { label: "Activate", value: "ACTIVE", icon: PlayArrowIcon, color: "#10b981" },
    { label: "Cancel", value: "CANCELLED", icon: CancelIcon, color: "#ef4444" },
    { label: "Complete", value: "COMPLETED", icon: CheckCircleIcon, color: "#10b981" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const INITIAL_FORM_STATE = {
  employeeId: "",
  type: "LOAN_EMI" as const,
  name: "",
  monthlyAmount: 0,
  totalInstallments: 0,
  totalAmount: 0,
  startedOn: new Date().toISOString().split("T")[0],
};

// Interface for employee data from API
interface EmployeeData {
  id: string;
  name: string;
  code: string;
  designationId: string;
  departmentId: string;
  annualCtc: number;
  designation?: string;
  department?: string;
}

// Deduction Row Component
const DeductionRow = ({
  deduction,
  index,
  // onView,
  onEdit,
  onStatusUpdate,
  // onDelete
}: {
  deduction: EmployeeDeduction;
  index: number;
  onView: (id: string) => void;
  onEdit: (deduction: EmployeeDeduction) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusAction = (action: { value: string; label: string }) => {
    handleMenuClose();
    onStatusUpdate(deduction.id, action.value);
  };

  const status = STATUS_CONFIG[deduction.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;
  // const StatusIcon = status.icon;
  const progress = deduction.totalInstallments > 0
    ? Math.round(((deduction.paidInstallments || 0) / deduction.totalInstallments) * 100)
    : 0;
  const statusActions = STATUS_ACTIONS[deduction.status as keyof typeof STATUS_ACTIONS] || [];

  return (
    <TableRow key={deduction.id} sx={getRowColor(index)}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <Chip
          label={deduction.typeLabel || deduction.type}
          size="small"
          className="text-gray-800"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {deduction.name}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(deduction.monthlyAmount)}
        </Typography>
      </TableCell>
       <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(deduction.totalAmount)}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 120 }}>
        {deduction.totalInstallments > 0 ? (
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
            />
            <Typography variant="caption" className="text-gray-500">
              {deduction.progressLabel || `${deduction.paidInstallments || 0} of ${deduction.totalInstallments} paid`}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" className="text-gray-500">
            Recurring
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2" className="text-gray-500">
          {formatDate(deduction.startedOn)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={status.label}
          size="small"
          // icon={<StatusIcon fontSize="small" sx={{ color: status.color }} />}
          sx={{ bgcolor: status.bgColor, color: status.color, fontSize: "0.7rem", fontWeight: 500 }}
        />
      </TableCell>
      <TableCell align="center">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
          {/* <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onView(deduction.id)}>
              <Typography variant="caption" sx={{ fontSize: '16px' }}>📄</Typography>
            </IconButton>
          </Tooltip> */}

          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(deduction)}>
              <EditIcon fontSize="small" className="!w-4" sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Tooltip>

          {/* More Vert Menu Button */}
          {statusActions.length > 0 && (
            <>
              <Tooltip title="More Actions">
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" className="!w-4 text-gray-800"/>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={menuAnchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}

              >
                {statusActions.map((action) => (
                  <MenuItem
                    key={action.value}
                    onClick={() => handleStatusAction(action)}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(action.color, 0.08),
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <action.icon fontSize="small" sx={{ color: action.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={action.label}

                    />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {!statusActions.length && (
            <Typography variant="caption" className="text-gray-400" sx={{ px: 1 }}>
              —
            </Typography>
          )}

          {/* <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(deduction.id)}
              sx={{ color: theme.palette.error.main }}
            >
              <BanIcon fontSize="small" />
            </IconButton>
          </Tooltip> */}
        </Box>
      </TableCell>
    </TableRow>
  );
};

// All Deductions Row Component
const AllDeductionRow = ({
  deduction,
  index,
  // onView,
  onEdit,
  onStatusUpdate,
  // onDelete
}: {
  deduction: EmployeeDeduction;
  index: number;
  onView: (id: string) => void;
  onEdit: (deduction: EmployeeDeduction) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
 const progress = deduction.totalInstallments > 0
    ? Math.round(((deduction.paidInstallments || 0) / deduction.totalInstallments) * 100)
    : 0;
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusAction = (action: { value: string; label: string }) => {
    handleMenuClose();
    onStatusUpdate(deduction.id, action.value);
  };

  const status = STATUS_CONFIG[deduction.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;
  const statusActions = STATUS_ACTIONS[deduction.status as keyof typeof STATUS_ACTIONS] || [];

  return (
    <TableRow key={deduction.id} sx={getRowColor(index)}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <div>{deduction.employeeName}</div>
        <div className="text-primary text-[12px]">{deduction.employeeCode}</div>
      </TableCell>
      <TableCell>
        <Chip
          label={deduction.typeLabel || deduction.type}
          size="small"
          className="text-gray-800"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{deduction.name}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(deduction.monthlyAmount)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(deduction.totalAmount)}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 120 }}>
        {deduction.totalInstallments > 0 ? (
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
            />
            <Typography variant="caption" className="text-gray-500">
              {deduction.progressLabel || `${deduction.paidInstallments || 0} of ${deduction.totalInstallments} paid`}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" className="text-gray-500">
            Recurring
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={status.label}
          size="small"
          // icon={<status.icon fontSize="small" sx={{ color: status.color }} />}
          sx={{ bgcolor: status.bgColor, color: status.color }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" className="text-gray-500">
          {formatDate(deduction.createdAt)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <div className="flex items-center justify-center">
          {/* <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onView(deduction.id)}>
              <Typography variant="caption" sx={{ fontSize: '16px' }}>📄</Typography>
            </IconButton>
          </Tooltip> */}

          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(deduction)}>
              <EditIcon fontSize="small" className="!w-4" sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Tooltip>

          {/* More Vert Menu Button */}
          {statusActions.length > 0 && (
            <>
              <Tooltip title="More Actions">
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" className="!w-4 !text-gray-800" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={menuAnchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}

              >
                {statusActions.map((action) => (
                  <MenuItem
                    key={action.value}
                    onClick={() => handleStatusAction(action)}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(action.color, 0.08),
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <action.icon fontSize="small" sx={{ color: action.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={action.label}

                    />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Delete button */}
          {/* <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(deduction.id)}
              sx={{ color: theme.palette.error.main }}
            >
              <BanIcon fontSize="small" />
            </IconButton>
          </Tooltip> */}
        </div>
      </TableCell>
    </TableRow>
  );
};

// Custom Hook for Deduction Management
const useDeductionManagement = () => {
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [allDeductions, setAllDeductions] = useState<EmployeeDeduction[]>([]);
  const [overviewData, setOverviewData] = useState<EmployeeDeductionOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const loadedEmployeeIdRef = useRef<string | null>(null);
  const { showSnackbar } = useUI();

  // 1. GET: Load all deductions (with optional filters)
  const loadAllDeductions = useCallback(async (params?: EmployeeDeductionQuery) => {
    setLoading(true);
    try {
      const response: any = await employeeDeductionsService.getEmployeeDeductions(params);
      const data = response.data;
      setAllDeductions(data || []);
      return data;
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load all deductions", "error");
      setAllDeductions([]);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // 2. GET: Load employee overview
  const loadEmployeeOverview = useCallback(async (employeeId: string) => {
    if (loadedEmployeeIdRef.current === employeeId) {
      return;
    }

    setLoading(true);
    try {
      const response: any = await employeeDeductionsService.getEmployeeDeductionOverview(employeeId);
      const data = response.data;
      setOverviewData(data);
      setDeductions(data?.activeDeductions || []);
      loadedEmployeeIdRef.current = employeeId;

      if (data?.employee) {
        setEmployeeDetails({
          id: data.employee.id,
          name: data.employee.name,
          code: data.employee.code,
          designationId: data.employee.designationId,
          departmentId: data.employee.departmentId,
          annualCtc: data.employee.annualCtc,
          designation: data.employee.designation,
          department: data.employee.department,
        });
      }

      return data;
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load employee deductions", "error");
      setDeductions([]);
      setOverviewData(null);
      setEmployeeDetails(null);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // 3. GET: Load single deduction by ID
  const loadDeductionById = useCallback(async (deductionId: string) => {
    setLoading(true);
    try {
      const response: any = await employeeDeductionsService.getEmployeeDeductionById(deductionId);
      return response.data;
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load deduction", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // 4. POST: Create deduction from loan
  const createDeductionFromLoan = useCallback(async (loanRequestId: string) => {
    setLoading(true);
    try {
      const response: any = await employeeDeductionsService.createDeductionFromLoan(loanRequestId);
      showSnackbar("Deduction created from loan successfully!", "success");
      if (selectedEmployeeId) {
        loadedEmployeeIdRef.current = null;
        await loadEmployeeOverview(selectedEmployeeId);
      }
      await loadAllDeductions({ status: filterStatus });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        showSnackbar("Deduction already exists for this loan", "warning");
      } else {
        showSnackbar(error?.message || "Failed to create deduction from loan", "error");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, filterStatus, loadEmployeeOverview, loadAllDeductions, showSnackbar]);

  const refreshOverview = useCallback(async () => {
    if (selectedEmployeeId) {
      loadedEmployeeIdRef.current = null;
      await loadEmployeeOverview(selectedEmployeeId);
    }
    await loadAllDeductions({ status: filterStatus });
  }, [selectedEmployeeId, filterStatus, loadEmployeeOverview, loadAllDeductions]);

  const handleEmployeeChange = useCallback((employee: EmployeeType | EmployeeType[] | null) => {
    if (Array.isArray(employee)) {
      setSelectedEmployeeId(employee.length > 0 ? employee[0]?.id || null : null);
    } else {
      setSelectedEmployeeId(employee?.id || null);
    }
    loadedEmployeeIdRef.current = null;
  }, []);

  // Load overview when employee ID changes
  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeOverview(selectedEmployeeId);
    } else {
      setDeductions([]);
      setOverviewData(null);
      setEmployeeDetails(null);
      loadedEmployeeIdRef.current = null;
    }
  }, [selectedEmployeeId, loadEmployeeOverview]);

  const activeDeductions = useMemo(
    () => deductions.filter((d) => d.employeeId === selectedEmployeeId),
    [deductions, selectedEmployeeId]
  );

  const totalMonthlyDeduction = useMemo(
    () => activeDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0),
    [activeDeductions]
  );

  const distributionData = useMemo(() => {
    if (overviewData?.distribution?.length) {
      return overviewData.distribution.map((item) => ({
        name: item.label,
        value: item.amount,
        color: item.color,
      }));
    }
    return activeDeductions
      .filter((d) => d.status === "ACTIVE")
      .reduce((acc: any[], d) => {
        const existing = acc.find((item) => item.name === d.type);
        if (existing) {
          existing.value += d.monthlyAmount;
        } else {
          acc.push({ name: d.typeLabel || d.type, value: d.monthlyAmount });
        }
        return acc;
      }, []);
  }, [overviewData, activeDeductions]);

  return {
    selectedEmployeeId,
    employeeDetails,
    deductions: activeDeductions,
    allDeductions,
    overviewData,
    loading,
    totalMonthlyDeduction,
    distributionData,
    filterStatus,
    setFilterStatus,
    handleEmployeeChange,
    refreshOverview,
    loadEmployeeOverview,
    loadAllDeductions,
    loadDeductionById,
    createDeductionFromLoan,
  };
};

// Main Component
export default function DeductionConfiguration() {
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();

  const {
    selectedEmployeeId,
    employeeDetails,
    deductions,
    allDeductions,
    overviewData,
    loading,
    totalMonthlyDeduction,
    distributionData,
    filterStatus,
    setFilterStatus,
    handleEmployeeChange,
    refreshOverview,
    loadAllDeductions,
    loadDeductionById,
    createDeductionFromLoan,
  } = useDeductionManagement();

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDeductionId, setSelectedDeductionId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({ name: false, monthlyAmount: false });
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [loanRequestId, setLoanRequestId] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [selectedDeductionDetail, setSelectedDeductionDetail] = useState<EmployeeDeduction | null>(null);

  // Handlers
  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_STATE,
      employeeId: selectedEmployeeId || "",
    });
    setFormErrors({ name: false, monthlyAmount: false });
    setIsEditMode(false);
    setSelectedDeductionId(null);
  }, [selectedEmployeeId]);

  const handleOpenCreateDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleOpenEditDialog = useCallback((deduction: EmployeeDeduction) => {
    setIsEditMode(true);
    setSelectedDeductionId(deduction.id);
    setFormData({
      employeeId: deduction.employeeId,
      type: deduction.type as any,
      name: deduction.name,
      monthlyAmount: deduction.monthlyAmount,
      totalInstallments: deduction.totalInstallments,
      totalAmount: deduction.totalAmount,
      startedOn: deduction.startedOn?.split("T")[0] || new Date().toISOString().split("T")[0],
    });
    setFormErrors({ name: false, monthlyAmount: false });
    setIsDialogOpen(true);
  }, []);

  const handleSubmitDeduction = useCallback(async () => {
    const errors = {
      name: !formData.name.trim(),
      monthlyAmount: formData.monthlyAmount <= 0,
    };
    setFormErrors(errors);

    if (errors.name || errors.monthlyAmount) {
      showSnackbar("Please fill all required fields correctly", "warning");
      return;
    }

    showSpinner();
    try {
      const payload = {
        ...formData,
        employeeId: selectedEmployeeId || formData.employeeId,
        totalAmount: formData.totalAmount || formData.monthlyAmount * (formData.totalInstallments || 1),
      };

      if (isEditMode && selectedDeductionId) {
        await employeeDeductionsService.updateEmployeeDeduction(selectedDeductionId, payload);
        showSnackbar("Deduction updated successfully!", "success");
      } else {
        await employeeDeductionsService.createEmployeeDeduction(payload);
        showSnackbar("Deduction added successfully!", "success");
      }

      await refreshOverview();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to ${isEditMode ? "update" : "add"} deduction`, "error");
    } finally {
      hideSpinner();
    }
  }, [formData, isEditMode, selectedDeductionId, selectedEmployeeId, refreshOverview, showSpinner, hideSpinner, showSnackbar, resetForm]);

  const handleDeleteDeduction = useCallback((id: string) => {
    showConfirmDialog({
      title: "Delete Deduction",
      message: "Are you sure you want to delete this deduction? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeDeductionsService.deleteEmployeeDeduction(id);
          await refreshOverview();
          showSnackbar("Deduction deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete deduction", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  }, [refreshOverview, showSpinner, hideSpinner, showSnackbar, showConfirmDialog]);

  // Fixed: Correct status labels mapping
  const handleUpdateStatus = useCallback((id: string, status: string) => {
    const statusLabels: Record<string, { label: string; message: string }> = {
      ACTIVE: {
        label: "Activate",
        message: "activate"
      },
      PAUSED: {
        label: "Pause",
        message: "pause"
      },
      CANCELLED: {
        label: "Cancel",
        message: "cancel"
      },
      COMPLETED: {
        label: "Complete",
        message: "complete"
      },
    };

    const statusInfo = statusLabels[status] || { label: status, message: status.toLowerCase() };

    showConfirmDialog({
      title: `Update Status to ${statusInfo.label}`,
      message: `Are you sure you want to ${statusInfo.message} this deduction?`,
      confirmText: "Update",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeDeductionsService.updateEmployeeDeductionStatus(id, status);
          await refreshOverview();
          showSnackbar(`Deduction ${statusInfo.message}d successfully!`, "success");
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to update status", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  }, [refreshOverview, showSpinner, hideSpinner, showSnackbar, showConfirmDialog]);

  // Handle view deduction details
  const handleViewDeduction = useCallback(async (deductionId: string) => {
    showSpinner();
    try {
      const data = await loadDeductionById(deductionId);
      if (data) {
        setSelectedDeductionDetail(data);
      }
    } finally {
      hideSpinner();
    }
  }, [loadDeductionById, showSpinner, hideSpinner]);

  // Handle create from loan
  const handleCreateFromLoan = useCallback(() => {
    if (!selectedEmployeeId) {
      showSnackbar("Please select an employee first", "warning");
      return;
    }
    setIsLoanDialogOpen(true);
  }, [selectedEmployeeId, showSnackbar]);

  const handleSubmitLoanDeduction = useCallback(async () => {
    if (!loanRequestId.trim()) {
      showSnackbar("Please enter a loan request ID", "warning");
      return;
    }

    showSpinner();
    try {
      await createDeductionFromLoan(loanRequestId);
      setIsLoanDialogOpen(false);
      setLoanRequestId("");
    } finally {
      hideSpinner();
    }
  }, [loanRequestId, createDeductionFromLoan, showSpinner, hideSpinner, showSnackbar]);

  // Load all deductions on component mount
  useEffect(() => {
    loadAllDeductions();
  }, [loadAllDeductions]);

  // Load all deductions with filter when status filter changes
  useEffect(() => {
    loadAllDeductions({ status: filterStatus });
  }, [filterStatus, loadAllDeductions]);

  const summaryData = useMemo(
    () => overviewData?.summary || { compliant: 0, pending: 0, nonCompliant: 0, total: 0, totalAmount: 0 },
    [overviewData]
  );

  const hasActiveDeductions = useMemo(() => deductions.length > 0, [deductions]);

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800 !font-bold">
            Deduction Configuration
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-2">
            Manage employee loans, advances, and recurring deductions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LoanIcon fontSize="small" />}
            onClick={handleCreateFromLoan}
            disabled={!selectedEmployeeId}
            className="!border-gray-200 !text-gray-800"
          >
            From Loan
          </Button>
          <Button
            variant="contained"
            startIcon={<PlusIcon fontSize="small" />}
            onClick={handleOpenCreateDialog}
            className="!bg-primary"
            disabled={!selectedEmployeeId}
          >
            Add Deduction
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Employee Selector */}
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="body2" className="text-gray-800">
                    Select Employee:
                  </Typography>
                  <div className="w-[300px]">
                    <EmployeeSelector
                      value={null}
                      onChange={handleEmployeeChange}
                      placeholder="Search and select an employee…"
                    />
                  </div>
                  {loading && <CircularProgress size={20} />}
                  <IconButton onClick={refreshOverview}>
                    <RefreshIcon className="text-gray-800" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>

            {/* Employee Context Card */}
            {employeeDetails && <EmployeeContextCard employee={employeeDetails} />}

            <Alert severity="warning" icon={<AlertTriangleIcon />} sx={{ borderRadius: 2 }}>
              <AlertTitle sx={{ fontWeight: 600 }}>Important Note</AlertTitle>
              Deductions are automatically processed during payroll. Verify all amounts before saving.
            </Alert>

            {/* Tabs */}
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent>
                <Box className="border-b border-gray-200 mb-3">
                  <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{
                    "& .MuiTabs-indicator": {
                      backgroundColor: "var(--color-primary)",
                      height: 3,
                      borderRadius: "3px 3px 0 0",
                    },
                  }}>
                    <Tab label="Active Deductions" className="!text-gray-800" />
                    <Tab label="All Deductions" className="!text-gray-800" />
                  </Tabs>
                </Box>

                {tabValue === 0 && (
                  <>
                    <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                      {selectedEmployeeId ? "Active Deductions" : "Select an employee to view deductions"}
                    </Typography>
                    
                      <TableContainer className="border bg-white-50 border-gray-200 rounded-md">
                        <Table>
                          <TableHead>
                            <TableRow>
                              {["S No", "Type", "Name", "Monthly Amount","Total Amount", "Progress", "Started", "Status", "Actions"].map((header) => (
                                <TableCell key={header} className="!font-bold" align={header === "Monthly Amount" ? "right" : header === "Actions" ? "center" : "left"}>
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {!selectedEmployeeId ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center">
                                  <Typography variant="body2" className="text-gray-500 py-6">
                                    Please select an employee to view deductions
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : !hasActiveDeductions ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center">
                                  <Typography variant="body2" className="text-gray-500 py-6">
                                    No deductions configured for this employee
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              deductions.map((deduction, index) => (
                                <DeductionRow
                                  key={deduction.id}
                                  deduction={deduction}
                                  index={index}
                                  onView={handleViewDeduction}
                                  onEdit={handleOpenEditDialog}
                                  onStatusUpdate={handleUpdateStatus}
                                  onDelete={handleDeleteDeduction}
                                />
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    
                  </>
                )}

                {tabValue === 1 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                        All Deductions
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Status Filter</InputLabel>
                          <Select
                            value={filterStatus || ''}
                            onChange={(e) => setFilterStatus(e.target.value || undefined)}
                            label="Status Filter"
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="PAUSED">Paused</MenuItem>
                            <MenuItem value="COMPLETED">Completed</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    {loading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <TableContainer className="border bg-white-50 border-gray-200 rounded-md">
                        <Table>
                          <TableHead>
                            <TableRow>
                              {["S No", "Employee", "Type", "Name", "Monthly Amount","Total Amount","Progress", "Status", "Created", "Actions"].map((header) => (
                                <TableCell key={header} className="!font-bold" align={header === "Amount" ? "right" : header === "Actions" ? "center" : "left"}>
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allDeductions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} align="center">
                                  <Typography variant="body2" className="text-gray-500 py-6">
                                    No deductions found
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              allDeductions.map((deduction, index) => (
                                <AllDeductionRow
                                  key={deduction.id}
                                  deduction={deduction}
                                  index={index}
                                  onView={handleViewDeduction}
                                  onEdit={handleOpenEditDialog}
                                  onStatusUpdate={handleUpdateStatus}
                                  onDelete={handleDeleteDeduction}
                                />
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SummaryCard
              totalMonthlyDeduction={totalMonthlyDeduction}
              summaryData={summaryData}
              activeCount={deductions.filter(d => d.status === "ACTIVE").length}
              totalCount={deductions.length}
            />

            {distributionData.length > 0 && <DistributionChart data={distributionData} />}
          </Stack>
        </Grid>
      </Grid>

      {/* Add/Edit Deduction Dialog */}
      <DeductionDialog
        open={isDialogOpen}
        isEditMode={isEditMode}
        formData={formData}
        formErrors={formErrors}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        onSubmit={handleSubmitDeduction}
        onFormChange={setFormData}
        employeeName={employeeDetails?.name}
      />

      {/* Create From Loan Dialog */}
      <Dialog open={isLoanDialogOpen} onClose={() => setIsLoanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Deduction from Loan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" className="text-gray-500 !mb-4">
            Enter the loan request ID to create a deduction automatically from an approved loan/advance request.
          </Typography>
          <TextField
            label="Loan Request ID"
            value={loanRequestId}
            onChange={(e) => setLoanRequestId(e.target.value)}
            placeholder="Enter loan request ID"
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200">
          <Button variant="outlined" onClick={() => setIsLoanDialogOpen(false)} className="!border-gray-200 !text-gray-800">Cancel</Button>
          <Button onClick={handleSubmitLoanDeduction} variant="contained" className="!bg-primary">
            Create Deduction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deduction Details Dialog */}
      {selectedDeductionDetail && (
        <Dialog
          open={!!selectedDeductionDetail}
          onClose={() => setSelectedDeductionDetail(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Deduction Details</Typography>
              <IconButton onClick={() => setSelectedDeductionDetail(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">ID</Typography>
                <Typography variant="body2">{selectedDeductionDetail.id}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Type</Typography>
                <Typography variant="body2">{selectedDeductionDetail.typeLabel || selectedDeductionDetail.type}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Name</Typography>
                <Typography variant="body2">{selectedDeductionDetail.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Monthly Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedDeductionDetail.monthlyAmount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                <Typography variant="body2">{formatCurrency(selectedDeductionDetail.totalAmount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Installments</Typography>
                <Typography variant="body2">{selectedDeductionDetail.paidInstallments || 0} of {selectedDeductionDetail.totalInstallments || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Chip
                  label={selectedDeductionDetail.status}
                  size="small"
                  sx={{
                    bgcolor: STATUS_CONFIG[selectedDeductionDetail.status as keyof typeof STATUS_CONFIG]?.bgColor || '#f3f4f6',
                    color: STATUS_CONFIG[selectedDeductionDetail.status as keyof typeof STATUS_CONFIG]?.color || '#6b7280',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Started On</Typography>
                <Typography variant="body2">{selectedDeductionDetail.startedOn ? new Date(selectedDeductionDetail.startedOn).toLocaleDateString() : '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">Source</Typography>
                <Typography variant="body2">{selectedDeductionDetail.sourceType || 'Manual'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="caption" color="textSecondary">Created At</Typography>
                <Typography variant="body2">{selectedDeductionDetail.createdAt ? new Date(selectedDeductionDetail.createdAt).toLocaleString() : '-'}</Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedDeductionDetail(null)} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

// Subcomponents
const EmployeeContextCard = ({ employee }: { employee: EmployeeData }) => {
  const theme = useTheme();
  return (
    <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
            {employee.name?.charAt(0) || "E"}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
              {employee.name}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              {employee.designation} · {employee.department}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" className="text-gray-500">
              Annual CTC
            </Typography>
            <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 700 }}>
              {formatCurrency(employee.annualCtc || 0)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const SummaryCard = ({ totalMonthlyDeduction, summaryData, activeCount, totalCount }: any) => {
  const theme = useTheme();

  return (
    <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <DollarSignIcon sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
            Deduction Summary
          </Typography>
        </Box>
        <Stack spacing={2}>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
            <Typography variant="caption" sx={{ color: "error.main" }}>
              Total Monthly Deduction
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
              {formatCurrency(totalMonthlyDeduction)}
            </Typography>
          </Box>

          {summaryData.total > 0 && (
            <Grid container spacing={1.5}>
              {[
                { label: "Compliant", value: summaryData.compliant, color: theme.palette.success.main },
                { label: "Pending", value: summaryData.pending, color: theme.palette.warning.main },
                { label: "Non-Compliant", value: summaryData.nonCompliant, color: theme.palette.error.main },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 4 }}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 1,
                    textAlign: "center",
                    bgcolor: alpha(item.color, 0.04)
                  }}>
                    <Typography variant="caption" className="text-gray-500">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700, color: item.color }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          <Grid container spacing={1.5}>
            {[
              { label: "Active", value: activeCount },
              { label: "Total", value: totalCount },
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 6 }}>
                <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <Typography variant="caption" className="text-gray-500">
                    {item.label}
                  </Typography>
                  <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

const DistributionChart = ({ data }: { data: any[] }) => (
  <Card className="bg-white !mb-3" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TrendingDownIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
          Distribution
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_e, i) => (
              <Cell key={i} fill={_e.color || PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <ReTooltip formatter={(value: any) => [formatCurrency(value), "Amount"]} />
        </PieChart>
      </ResponsiveContainer>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {data.map((item, i) => (
          <Box key={item.name} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color || PIE_COLORS[i % PIE_COLORS.length] }} />
              <Typography variant="body2" className="text-gray-500">
                {item.name}
              </Typography>
            </Box>
            <Typography variant="body2" className="text-gray-500" sx={{ fontWeight: 500 }}>
              {formatCurrency(item.value)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const DeductionDialog = ({
  open,
  isEditMode,
  formData,
  formErrors,
  onClose,
  onSubmit,
  onFormChange,
  employeeName,
}: any) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={dialogsx}
    >
      <DialogTitle className="!p-2 border-b border-gray-200">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" className="!ml-4">
            {isEditMode ? "Edit Deduction" : "Add New Deduction"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon className="!w-4 text-gray-800" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Typography variant="body2" className="text-gray-500 !mb-6">
          {isEditMode
            ? "Update deduction details for selected employee"
            : `Configure a deduction for ${employeeName || "selected employee"}`}
        </Typography>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Deduction Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => onFormChange({ ...formData, type: e.target.value })}
                  label="Deduction Type *"
                >
                  {DEDUCTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Deduction Name"
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="e.g., Home Loan EMI"
                fullWidth
                required
                error={formErrors.name}
                helperText={formErrors.name ? "Deduction name is required" : ""}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Monthly Amount"
                type="number"
                value={formData.monthlyAmount || ""}
                onChange={(e) => onFormChange({ ...formData, monthlyAmount: Number(e.target.value) })}
                placeholder="10000"
                fullWidth
                required
                error={formErrors.monthlyAmount}
                helperText={formErrors.monthlyAmount ? "Monthly amount is required" : ""}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Total Installments"
                type="number"
                value={formData.totalInstallments || ""}
                onChange={(e) => onFormChange({ ...formData, totalInstallments: Number(e.target.value) })}
                placeholder="60 (leave 0 for recurring)"
                fullWidth
              />
            </Grid>
          </Grid>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              label="Start Date"
              value={formData.startedOn ? dayjs(formData.startedOn) : null}
              onChange={(newValue) => {
                onFormChange({
                  ...formData,
                  startedOn: newValue ? dayjs(newValue).format('YYYY-MM-DD') : '',
                });
              }}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  required: true,
                }
              }}
            />
          </LocalizationProvider>

          {formData.type === "LOAN_EMI" && formData.totalInstallments > 0 && (
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.04) }}>
              <Typography variant="caption" className="text-gray-500">
                Total Amount: {formatCurrency(formData.monthlyAmount * formData.totalInstallments)}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions className="!p-4 border-t border-gray-200">
        <Button
          onClick={onClose}
          variant="outlined"
          className="!text-gray-800 !border-gray-200"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          className="!bg-primary"
        >
          {isEditMode ? "Update Deduction" : "Add Deduction"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};