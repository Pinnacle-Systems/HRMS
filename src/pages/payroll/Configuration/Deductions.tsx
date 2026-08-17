import { useEffect, useState, useRef } from "react";
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
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add as PlusIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as DollarSignIcon,
  Warning as AlertTriangleIcon,
  Edit as EditIcon,
  Block as BanIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { formatCurrency } from "../const";
import {
  employeeDeductionsService,
  type EmployeeDeduction,
  type Employee,
  type EmployeeDeductionOverview,
} from "../../../services/modules/payrollServices/deductions";
import { useUI } from "../../../context/Snackbar";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { dialogsx } from "../../../const";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

const typeLabels: Record<string, string> = {
  LOAN_EMI: "Loan EMI",
  ADVANCE: "Salary Advance",
  CANTEEN: "Canteen",
  OTHER: "Other",
};

// Updated status config with new status values
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  ACTIVE: { label: "Active", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
  PAUSED: { label: "Paused", color: "#f59e0b", bgColor: "#fef3c7", icon: PauseIcon },
  COMPLETED: { label: "Completed", color: "#6b7280", bgColor: "#f3f4f6", icon: CheckCircleIcon },
  CANCELLED: { label: "Cancelled", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
};

export default function DeductionConfiguration() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [overviewData, setOverviewData] = useState<EmployeeDeductionOverview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [selectedDeductionId, setSelectedDeductionId] = useState<string | null>(null);
  
  // Ref to track if overview has been loaded for current employee
  const loadedEmployeeIdRef = useRef<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    employeeId: "",
    type: "LOAN_EMI",
    name: "",
    monthlyAmount: 0,
    totalInstallments: 0,
    totalAmount: 0,
    startedOn: new Date().toISOString().split("T")[0],
  });
  const [formErrors, setFormErrors] = useState({
    name: false,
    monthlyAmount: false,
  });

  useEffect(() => {
    if (selectedEmployee?.id && selectedEmployee.id !== loadedEmployeeIdRef.current) {
      loadEmployeeOverview(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const loadEmployeeOverview = async (employeeId: string) => {
    // Prevent duplicate calls
    if (loadedEmployeeIdRef.current === employeeId) {
      return;
    }
    
    setLoadingOverview(true);
    try {
      const response: any = await employeeDeductionsService.getEmployeeDeductionOverview(employeeId);
      const data = response.data;
      setOverviewData(data);
      setDeductions(data?.activeDeductions || []);
      
      // Mark this employee as loaded
      loadedEmployeeIdRef.current = employeeId;
      
      // Update employee details with overview data if available
      if (data?.employee) {
        setSelectedEmployee(prev => ({
          ...prev,
          ...data.employee
        }));
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load employee deductions", "error");
      setDeductions([]);
      setOverviewData(null);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Force refresh overview data (for after CRUD operations)
  const refreshOverview = async () => {
    if (selectedEmployee?.id) {
      // Reset the loaded ref to force a reload
      loadedEmployeeIdRef.current = null;
      await loadEmployeeOverview(selectedEmployee.id);
    }
  };

  const employeeDeductions = deductions.filter((d) => d.employeeId === selectedEmployee?.id);
  const totalMonthlyDeduction = employeeDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0);

  // Use overview summary data if available
  const summaryData = overviewData?.summary || {
    compliant: 0,
    pending: 0,
    nonCompliant: 0,
    total: 0,
    totalAmount: 0,
  };

  const distributionData = overviewData?.distribution || [];

  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setSelectedDeductionId(null);
    setFormData({
      employeeId: selectedEmployee?.id || "",
      type: "LOAN_EMI",
      name: "",
      monthlyAmount: 0,
      totalInstallments: 0,
      totalAmount: 0,
      startedOn: new Date().toISOString().split("T")[0],
    });
    setFormErrors({ name: false, monthlyAmount: false });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (deduction: EmployeeDeduction) => {
    setIsEditMode(true);
    setSelectedDeductionId(deduction.id);
    setFormData({
      employeeId: deduction.employeeId,
      type: deduction.type,
      name: deduction.name,
      monthlyAmount: deduction.monthlyAmount,
      totalInstallments: deduction.totalInstallments,
      totalAmount: deduction.totalAmount,
      startedOn: deduction.startedOn?.split("T")[0] || new Date().toISOString().split("T")[0],
    });
    setFormErrors({ name: false, monthlyAmount: false });
    setIsDialogOpen(true);
  };

  const handleSubmitDeduction = async () => {
    // Validate
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
        employeeId: selectedEmployee?.id || formData.employeeId,
        totalAmount: formData.totalAmount || formData.monthlyAmount * (formData.totalInstallments || 1),
      };

      if (isEditMode && selectedDeductionId) {
        await employeeDeductionsService.updateEmployeeDeduction(selectedDeductionId, payload);
        showSnackbar("Deduction updated successfully!", "success");
      } else {
        await employeeDeductionsService.createEmployeeDeduction(payload);
        showSnackbar("Deduction added successfully!", "success");
      }

      // Refresh overview data
      await refreshOverview();

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to ${isEditMode ? "update" : "add"} deduction`, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteDeduction = async (id: string) => {
    showConfirmDialog({
      title: "Delete Deduction",
      message: "Are you sure you want to delete this deduction? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeDeductionsService.deleteEmployeeDeduction(id);
          // Refresh overview data
          await refreshOverview();
          showSnackbar("Deduction deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete deduction", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const statusLabels: Record<string, string> = {
      PAUSED: "pause",
      ACTIVE: "activate",
      CANCELLED: "cancel",
      COMPLETED: "complete",
    };
    
    showConfirmDialog({
      title: `Update Status to ${status}`,
      message: `Are you sure you want to ${statusLabels[status] || status.toLowerCase()} this deduction?`,
      confirmText: "Update",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeDeductionsService.updateEmployeeDeductionStatus(id, status);
          // Refresh overview data
          await refreshOverview();
          showSnackbar(`Deduction ${statusLabels[status] || status.toLowerCase()}d successfully!`, "success");
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to update status", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      employeeId: selectedEmployee?.id || "",
      type: "LOAN_EMI",
      name: "",
      monthlyAmount: 0,
      totalInstallments: 0,
      totalAmount: 0,
      startedOn: new Date().toISOString().split("T")[0],
    });
    setFormErrors({ name: false, monthlyAmount: false });
    setIsEditMode(false);
    setSelectedDeductionId(null);
  };

  const handleEmployeeChange = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    if (employee?.id !== loadedEmployeeIdRef.current) {
      loadedEmployeeIdRef.current = null;
    }
  };

  // Use distribution data from overview or calculate from deductions
  const deductionPieData = distributionData.length > 0 
    ? distributionData.map(item => ({
        name: item.label,
        value: item.amount,
        color: item.color,
      }))
    : employeeDeductions.reduce((acc: any[], d) => {
        if (d.status === "ACTIVE") {
          const existing = acc.find((item) => item.name === d.type);
          if (existing) {
            existing.value += d.monthlyAmount;
          } else {
            acc.push({ name: typeLabels[d.type] || d.type, value: d.monthlyAmount });
          }
        }
        return acc;
      }, []);

  // Get available status actions based on current status
  const getStatusActions = (currentStatus: string) => {
    const actions: { label: string; value: string; icon: any; color: string }[] = [];
    
    if (currentStatus === "ACTIVE") {
      actions.push({ 
        label: "Pause", 
        value: "PAUSED", 
        icon: PauseIcon, 
        color: "#f59e0b" 
      });
      actions.push({ 
        label: "Cancel", 
        value: "CANCELLED", 
        icon: CancelIcon, 
        color: "#ef4444" 
      });
    } else if (currentStatus === "PAUSED") {
      actions.push({ 
        label: "Activate", 
        value: "ACTIVE", 
        icon: CheckCircleIcon, 
        color: "#10b981" 
      });
      actions.push({ 
        label: "Cancel", 
        value: "CANCELLED", 
        icon: CancelIcon, 
        color: "#ef4444" 
      });
    } else if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      // No actions for completed or cancelled
    }
    
    return actions;
  };

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
        <Button
          variant="contained"
          startIcon={<PlusIcon fontSize="small" />}
          onClick={handleOpenCreateDialog}
          className="!bg-primary"
          disabled={!selectedEmployee}
        >
          Add Deduction
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Employee Selector */}
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" className="text-gray-800">
                    Select Employee:
                  </Typography>
                  <div className="w-[300px]">
                    <EmployeeSelector
                      value={selectedEmployee || null}
                      onChange={handleEmployeeChange}
                      placeholder="Search and select an employee…"
                    />
                  </div>
                  {loadingOverview && <CircularProgress size={20} />}
                </Box>
              </CardContent>
            </Card>

            {/* Employee Context Card */}
            {selectedEmployee && (
              <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                      {selectedEmployee.name?.charAt(0) || "E"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                        {selectedEmployee.name}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {selectedEmployee.designation} · {selectedEmployee.department}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" className="text-gray-500">
                        Annual CTC
                      </Typography>
                      <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 700 }}>
                        {formatCurrency(selectedEmployee.annualCtc || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Deductions Table */}
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedEmployee ? "Active Deductions" : "Select an employee to view deductions"}
                </Typography>
                {loadingOverview ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer className="border border-gray-200 rounded-md">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                          <TableCell className="!font-bold">Type</TableCell>
                          <TableCell className="!font-bold">Name</TableCell>
                          <TableCell className="!font-bold" align="right">Monthly Amount</TableCell>
                          <TableCell className="!font-bold">Progress</TableCell>
                          <TableCell className="!font-bold">Started</TableCell>
                          <TableCell className="!font-bold">Status</TableCell>
                          <TableCell className="!font-bold" align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!selectedEmployee ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" className="text-gray-500 py-6">
                                Please select an employee to view deductions
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : employeeDeductions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" className="text-gray-500 py-6">
                                No deductions configured for this employee
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          employeeDeductions.map((d) => {
                            const status = statusConfig[d.status] || statusConfig.ACTIVE;
                            const StatusIcon = status.icon;
                            const progress = d.totalInstallments > 0
                              ? Math.round(((d.paidInstallments || 0) / d.totalInstallments) * 100)
                              : 0;
                            const statusActions = getStatusActions(d.status);

                            return (
                              <TableRow key={d.id} hover>
                                <TableCell>
                                  <Chip 
                                    label={d.typeLabel || typeLabels[d.type] || d.type} 
                                    size="small" 
                                    className="text-gray-800" 
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
                                    {formatCurrency(d.monthlyAmount)}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ minWidth: 120 }}>
                                  {d.totalInstallments > 0 ? (
                                    <Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={progress}
                                        sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                      />
                                      <Typography variant="caption" className="text-gray-500">
                                        {d.progressLabel || `${d.paidInstallments || 0} of ${d.totalInstallments} paid`}
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
                                    {d.startedOn ? new Date(d.startedOn).toLocaleDateString() : "-"}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={status.label}
                                    size="small"
                                    icon={<StatusIcon fontSize="small" />}
                                    sx={{ bgcolor: status.bgColor, color: status.color, fontSize: "0.7rem", fontWeight: 500 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row">
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenEditDialog(d)}
                                      >
                                        <EditIcon fontSize="small" className="text-blue-500 !w-4"/>
                                      </IconButton>
                                    </Tooltip>
                                    
                                    {statusActions.map((action) => (
                                      <Tooltip key={action.value} title={action.label}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleUpdateStatus(d.id, action.value)}
                                          sx={{ color: action.color }}
                                        >
                                          <action.icon fontSize="small" className="!w-4" />
                                        </IconButton>
                                      </Tooltip>
                                    ))}

                                    {(d.status === "COMPLETED" || d.status === "CANCELLED") && (
                                      <Tooltip title="No actions available">
                                        <Typography variant="caption" className="text-gray-400" sx={{ px: 1 }}>
                                          —
                                        </Typography>
                                      </Tooltip>
                                    )}

                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteDeduction(d.id)}
                                        sx={{
                                          color: theme.palette.error.main,
                                        }}
                                      >
                                        <BanIcon fontSize="small" className="!w-4" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
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
                  
                  {/* Summary stats from overview API */}
                  {summaryData.total > 0 && (
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                          <Typography variant="caption" className="text-gray-500">
                            Compliant
                          </Typography>
                          <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700, color: "success.main" }}>
                            {summaryData.compliant}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                          <Typography variant="caption" className="text-gray-500">
                            Pending
                          </Typography>
                          <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700, color: "warning.main" }}>
                            {summaryData.pending}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                          <Typography variant="caption" className="text-gray-500">
                            Non-Compliant
                          </Typography>
                          <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700, color: "error.main" }}>
                            {summaryData.nonCompliant}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <Typography variant="caption" className="text-gray-500">
                          Active
                        </Typography>
                        <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700 }}>
                          {employeeDeductions.filter(d => d.status === "ACTIVE").length}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <Typography variant="caption" className="text-gray-500">
                          Total
                        </Typography>
                        <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700 }}>
                          {employeeDeductions.length}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            {deductionPieData.length > 0 && (
              <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
                        data={deductionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deductionPieData.map((_e, i) => (
                          <Cell key={i} fill={_e.color || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(value: any) => [formatCurrency(value), "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {deductionPieData.map((item, i) => (
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
            )}

            <div className="!mb-4">
              <Alert severity="warning" icon={<AlertTriangleIcon />} sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Important Note</AlertTitle>
                Deductions are automatically processed during payroll. Verify all amounts before saving.
              </Alert>
            </div>
          </Stack>
        </Grid>
      </Grid>

      {/* Add/Edit Deduction Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        maxWidth="md"
        fullWidth
        sx={dialogsx}
      >
        <DialogTitle className="!p-2 border-b border-gray-200">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" className="!ml-4">
              {isEditMode ? "Edit Deduction" : "Add New Deduction"}
            </Typography>
            <IconButton onClick={() => { setIsDialogOpen(false); resetForm(); }} size="small">
              <CloseIcon className="!w-4 text-gray-800" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="!p-4">
          <Typography variant="body2" className="text-gray-500 !mb-6">
            {isEditMode
              ? "Update deduction details for selected employee"
              : `Configure a deduction for ${selectedEmployee?.name || "selected employee"}`}
          </Typography>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Deduction Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Deduction Type *"
                  >
                    <MenuItem value="LOAN_EMI">Loan EMI</MenuItem>
                    <MenuItem value="ADVANCE">Salary Advance</MenuItem>
                    <MenuItem value="CANTEEN">Canteen</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Deduction Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, monthlyAmount: Number(e.target.value) })}
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
                  onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
                  placeholder="60 (leave 0 for recurring)"
                  fullWidth
                />
              </Grid>
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={formData.startedOn ? dayjs(formData.startedOn) : null}
                onChange={(newValue) => {
                  setFormData({
                    ...formData,
                    startedOn: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
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
            onClick={() => { setIsDialogOpen(false); resetForm(); }}
            variant="outlined"
            className="text-gray-800 border-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitDeduction}
            variant="contained"
            className="!bg-primary"
          >
            {isEditMode ? "Update Deduction" : "Add Deduction"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}