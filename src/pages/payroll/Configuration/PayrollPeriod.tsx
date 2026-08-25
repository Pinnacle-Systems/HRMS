import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  Cancel as XCircleIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Assessment as FileBarChartIcon,
} from "@mui/icons-material";
import { periodsService } from "../../../services/modules/payrollServices/period";
import { useUI } from "../../../context/Snackbar";
import { dialogsx } from "../../../const";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { label: "Pending", icon: ClockIcon, color: "#f59e0b", bgColor: "#fef3c7" },
  scheduled: { label: "Scheduled", icon: PlayIcon, color: "#3b82f6", bgColor: "#dbeafe" },
  processed: { label: "Processed", icon: CheckCircleIcon, color: "#10b981", bgColor: "#d1fae5" },
  closed: { label: "Closed", icon: XCircleIcon, color: "#6b7280", bgColor: "#f3f4f6" },
};

export default function PayrollPeriodConfig() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [periods, setPeriods] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    startDate: "",
    endDate: "",
    paymentDate: "",
    cutoffDate: "",
    workingDays: 0,
    status: "pending",
    holidays: [] as { name: string; date: string }[],
  });
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });

  useEffect(() => {
    loadPeriods();
  }, []);

  // Auto-load summary when dates change in create mode
  useEffect(() => {
    if (!isEditMode && formData.startDate && formData.endDate) {
      const delayDebounceFn = setTimeout(() => {
        loadSummaryPeriods();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [formData.startDate, formData.endDate, isEditMode]);

  const loadPeriods = async () => {
    showSpinner();
    try {
      const response: any = await periodsService.getPeriods();
      setPeriods(response.data?.items || response.data || []);
    } catch (error) {
      showSnackbar("Failed to load payroll periods", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadSummaryPeriods = async () => {
    if (!formData.startDate || !formData.endDate) {
      return;
    }

    setIsLoadingSummary(true);
    const params = {
      startDate: formData.startDate,
      endDate: formData.endDate
    };
    try {
      const response: any = await periodsService.getSummaryPeriods(params);
      setSummaryData(response.data);
    } catch (error) {
      showSnackbar("Failed to load period summary", "error");
      setSummaryData(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setFormData({
      id: "",
      name: "",
      startDate: "",
      endDate: "",
      paymentDate: "",
      cutoffDate: "",
      workingDays: 0,
      status: "pending",
      holidays: [],
    });
    setNewHoliday({ name: "", date: "" });
    setSummaryData(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (period: any) => {
    setIsEditMode(true);
    setFormData({
      id: period.id,
      name: period.name || "",
      startDate: period.startDate?.split("T")[0] || "",
      endDate: period.endDate?.split("T")[0] || "",
      paymentDate: period.paymentDate?.split("T")[0] || "",
      cutoffDate: period.cutoffDate?.split("T")[0] || "",
      workingDays: period.workingDays || 0,
      status: period.status || "pending",
      holidays: period.holidays || [],
    });
    setNewHoliday({ name: "", date: "" });
    setSummaryData(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.paymentDate) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }

    showSpinner();
    try {
      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        paymentDate: formData.paymentDate,
        cutoffDate: formData.cutoffDate || formData.startDate,
        workingDays: formData.workingDays || summaryData.workingDays,
        status: formData.status,
        holidays: formData.holidays,
      };

      if (isEditMode) {
        await periodsService.updatePeriod(formData.id, payload);
        showSnackbar("Period updated successfully!", "success");
      } else {
        await periodsService.createPeriod(payload);
        showSnackbar("Period created successfully!", "success");
      }

      setIsDialogOpen(false);
      loadPeriods();
      resetForm();
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to ${isEditMode ? "update" : "create"} period`, "error");
    } finally {
      hideSpinner();
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      startDate: "",
      endDate: "",
      paymentDate: "",
      cutoffDate: "",
      workingDays: 0,
      status: "pending",
      holidays: [],
    });
    setNewHoliday({ name: "", date: "" });
    setSummaryData(null);
    setIsEditMode(false);
  };

  const handleDeletePeriod = async (id: string) => {
    showConfirmDialog({
      title: "Delete Period",
      message: "Are you sure you want to delete this period?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await periodsService.deletePeriod(id);
          await loadPeriods();
          showSnackbar("Period deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete period", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      showSnackbar("Please fill holiday name and date", "warning");
      return;
    }
    setFormData({
      ...formData,
      holidays: [...formData.holidays, { name: newHoliday.name, date: newHoliday.date }],
    });
    setNewHoliday({ name: "", date: "" });
  };

  const handleRemoveHoliday = (index: number) => {
    setFormData({
      ...formData,
      holidays: formData.holidays.filter((_, i) => i !== index),
    });
  };

  const handleLoadSummary = async () => {
    await loadSummaryPeriods();
  };

  // Render summary component
  const renderSummary = () => {
    if (isLoadingSummary) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }

    if (!summaryData) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" className="text-gray-800">
            {isEditMode 
              ? "Click 'Load Summary' to view period details" 
              : "Select start and end dates to view summary"}
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={2}>
        {/* Date Range */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" className="text-gray-800">
            Period
          </Typography>
          <Typography variant="body2" className="text-gray-800">
            {formatDate(summaryData.startDate)} - {formatDate(summaryData.endDate)}
          </Typography>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <Typography variant="h6" color="primary">
                {summaryData.totalDays}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Total Days
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.04) }}>
              <Typography variant="h6" color="success">
                {summaryData.workingDays}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Working
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
              <Typography variant="h6" color="warning">
                {summaryData.weekends}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Weekends
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.04) }}>
              <Typography variant="h6" color="info">
                {summaryData.holidays}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Holidays
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Holiday List */}
        {summaryData.holidayList && summaryData.holidayList.length > 0 && (
          <Box>
            <Typography variant="subtitle2" className="text-gray-800" gutterBottom>
              Holiday List
            </Typography>
            <Stack spacing={0.5}>
              {summaryData.holidayList.map((holiday: any, index: number) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                  }}
                >
                  <Box>
                    <Typography variant="body2" className="text-gray-800">
                      {holiday.name}
                    </Typography>
                    <Typography variant="caption" className="text-gray-800">
                      {formatDate(holiday.date)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={holiday.type} 
                    size="small"
                    color={holiday.type === 'PUBLIC' ? 'error' : 'warning'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Summary Footer */}
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 1, 
          bgcolor: alpha(theme.palette.success.main, 0.04),
          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
        }}>
          <Typography variant="caption" className="text-gray-500" align="center">
            Total: {summaryData.totalDays} days | Working: {summaryData.workingDays} | 
            Non-working: {summaryData.weekends + summaryData.holidays}
          </Typography>
        </Box>
      </Stack>
    );
  };

  return (
    <div>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <div className="text-[12px] text-gray-800 font-bold">
            Payroll Period Configuration
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5">
            Manage payroll periods, processing schedule, and auto-sync settings
          </div>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openCreateDialog}
            className="!bg-primary"
          >
            Create Period
          </Button>
        </Box>
      </Box>

      <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
        <CardContent className="!p-5">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CalendarIcon className="text-primary !w-4" />
            <div className="text-[12px] text-gray-800">
              Calendar View — {new Date().getFullYear()}
            </div>
            <Chip label={`${periods.length} periods`} size="small" className="!bg-gray-200 text-gray-800 ml-2" />
          </Box>
          <Grid container spacing={2}>
            {periods.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" className="text-gray-800">No periods found. Click "Create Period" to add one.</Typography>
                </Box>
              </Grid>
            ) : (
              periods.map((period) => {
                const cfg = statusConfig[period.status] || statusConfig.pending;
                const Icon = cfg.icon;
                const isClosed = period.status === "closed";

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={period.id}>
                    <Paper className="bg-white-50"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(cfg.color, 0.3)}`,
                        bgcolor: isClosed ? alpha(theme.palette.grey[500], 0.05) : "background.paper",
                        transition: "all 0.2s",
                        "&:hover": { boxShadow: 2, borderColor: 'var(--color-primary)' },
                        opacity: isClosed ? 0.7 : 1,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Box sx={{ flex: 1 }}>
                          <div className="text-[12px] text-gray-800 !font-bold">
                            {period.name}
                          </div>
                          <div className="text-[12px] text-gray-500 mt-1">
                            {formatDate(period.startDate)} – {formatDate(period.endDate)}
                          </div>
                        </Box>
                        <Chip
                          icon={<Icon className="!w-4" />}
                          label={cfg.label}
                          size="small"
                          sx={{
                            bgcolor: cfg.bgColor,
                            color: cfg.color,
                            fontSize: "0.65rem",
                            fontWeight: 500,
                            "& .MuiChip-icon": { color: cfg.color },
                          }}
                        />
                      </Box>
                      <Stack spacing={0.75}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <div className="text-[12px] text-gray-500">Payment date</div>
                          <div className="text-[12px] text-gray-800">{formatDate(period.paymentDate)}</div>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <div className="text-[12px] text-gray-500">Working days</div>
                          <div className="text-[12px] text-gray-800">{period.workingDays}</div>
                        </Box>
                        {period.holidays?.length > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="text-[12px] text-gray-500">Holidays</div>
                            <div className="text-[12px] text-gray-800">{period.holidays.length}</div>
                          </Box>
                        )}
                      </Stack>
                      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => openEditDialog(period)}
                          sx={{ textTransform: "none", flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePeriod(period.id);
                          }}
                          sx={{ textTransform: "none" }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Unified Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} maxWidth="md" sx={dialogsx}>
        <DialogTitle className="!p-2 border-b border-gray-200">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" className="!ml-4">
              {isEditMode ? "Edit Payroll Period" : "Create New Payroll Period"}
            </Typography>
            <IconButton onClick={() => { setIsDialogOpen(false); resetForm(); }} size="small">
              <CloseIcon className="!w-4 text-gray-800" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className="!p-7">
          <Stack spacing={2.5}>
            {/* Basic Fields */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Period Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., August 2026"
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate ? dayjs(formData.startDate) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        startDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate ? dayjs(formData.endDate) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        endDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid container spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Payment Date"
                    value={formData.paymentDate ? dayjs(formData.paymentDate) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        paymentDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      }
                    }}
                  />
                </Grid>
              </LocalizationProvider>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Working Days"
                  type="number"
                  value={formData.workingDays}
                  onChange={(e) => setFormData({ ...formData, workingDays: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>

            {isEditMode && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Summary Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <div className="text-[12px] text-gray-800">
                  Period Summary
                </div>
                {isEditMode && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FileBarChartIcon fontSize="small" />}
                    onClick={handleLoadSummary}
                    className="!text-primary !border-primary"
                  >
                    Load Summary
                  </Button>
                )}
              </Box>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                {renderSummary()}
              </Paper>
            </Box>

            {/* Holidays Section */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 2 }}>
                Holidays
              </Typography>
              <div className="flex items-center gap-3">
                <TextField
                  label="Holiday Name"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={newHoliday.date ? dayjs(newHoliday.date) : null}
                    onChange={(newValue) => {
                      setNewHoliday({
                        ...newHoliday,
                        date: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ''
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        sx: { minWidth: 150 },
                      }
                    }}
                  />
                </LocalizationProvider>
                <Button
                  variant="outlined"
                  onClick={handleAddHoliday}
                  className="!text-primary !border-primary"
                >
                  Add
                </Button>
              </div>
              {formData.holidays.length > 0 && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {formData.holidays.map((h, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <Box>
                        <Typography variant="body2">{h.name}</Typography>
                        <div className="text-[12px] text-gray-800">
                          {formatDate(h.date)}
                        </div>
                      </Box>
                      <IconButton size="small" onClick={() => handleRemoveHoliday(i)}>
                        <CloseIcon fontSize="small" className="text-error !w-4" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions className="!p-4 border-t border-gray-200">
          <Button
            onClick={() => { setIsDialogOpen(false); resetForm(); }}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="!bg-primary"
          >
            {isEditMode ? "Update Period" : "Create Period"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}