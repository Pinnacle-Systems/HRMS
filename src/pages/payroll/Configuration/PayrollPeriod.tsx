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
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  // AccessTime as ClockIcon,
  // CheckCircle as CheckCircleIcon,
  // PlayArrow as PlayIcon,
  // Cancel as XCircleIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Assessment as FileBarChartIcon,
  Delete,
  // DeleteOutlined,
} from "@mui/icons-material";
import { periodsService } from "../../../services/modules/payrollServices/period";
import { useUI } from "../../../context/Snackbar";
import { dialogsx } from "../../../const";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { fiscalYearService } from "../../../services/modules/fiscalYear";
import { companyService } from "../../../services/modules/company";
import { getRowColor } from "../../const";

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
//   pending: { label: "Pending", icon: ClockIcon, color: "#f59e0b", bgColor: "#fef3c7" },
//   scheduled: { label: "Scheduled", icon: PlayIcon, color: "#3b82f6", bgColor: "#dbeafe" },
//   processed: { label: "Processed", icon: CheckCircleIcon, color: "#10b981", bgColor: "#d1fae5" },
//   closed: { label: "Closed", icon: XCircleIcon, color: "#6b7280", bgColor: "#f3f4f6" },
// };

function PeriodTable({
  title,
  periods,
  activeFiscalYear,
  onEdit,
  onDelete,
  viewType,
  onViewTypeChange,
  monthlyCount,
  weeklyCount,
}: {
  title: string;
  periods: any[];
  activeFiscalYear: any;
  onEdit: (period: any) => void;
  onDelete: (id: string) => void;
  viewType: "monthly" | "weekly";
  onViewTypeChange: (v: "monthly" | "weekly") => void;
  monthlyCount: number;
  weeklyCount: number;
}) {
  return (
    <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
      <CardContent className="!p-5">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <CalendarIcon className="text-primary !w-4" />
          <div className="text-[12px] text-gray-800 font-bold">{title}</div>
          <Chip
            label={`${periods.length} periods`}
            size="small"
            color="warning"
            variant="outlined"
          />

          <Box sx={{ ml: "auto" }}>
            <ToggleButtonGroup
              value={viewType}
              exclusive
              size="small"
              onChange={(_, val) => {
                if (val) onViewTypeChange(val);
              }}
            >
              <ToggleButton value="monthly" className="!text-gray-800" sx={{ textTransform: "none", px: 1.5 }}>
                Monthly ({monthlyCount})
              </ToggleButton>
              <ToggleButton value="weekly" className="!text-gray-800" sx={{ textTransform: "none", px: 1.5 }}>
                Weekly ({weeklyCount})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {periods.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" className="text-gray-800">
              {activeFiscalYear
                ? `No ${title.toLowerCase()} found for the active fiscal year.`
                : "No active fiscal year configured. Please activate a fiscal year in Company Settings."}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <TableContainer className="border border-gray-200 h-[calc(100vh-282px)] overflow-auto bg-white shadow-sm rounded-md">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold">S No</TableCell>
                    <TableCell className="!font-bold">Period Name</TableCell>
                    <TableCell className="!font-bold">Start Date</TableCell>
                    <TableCell className="!font-bold">End Date</TableCell>
                    <TableCell className="!font-bold">Payment Date</TableCell>
                    <TableCell align="right" className="!font-bold">
                      Working Days
                    </TableCell>
                    <TableCell align="right" className="!font-bold">
                      Holidays
                    </TableCell>
                    {/* <TableCell align="center">Status</TableCell> */}
                    <TableCell align="center" className="!font-bold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((period: any, index: number) => {
                    // const cfg = statusConfig[period.status] || statusConfig.pending;
                    return (
                      <TableRow key={period.id} sx={getRowColor(index)}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="!text-gray-800 !font-medium">
                            {period.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(period.startDate)}</TableCell>
                        <TableCell>{formatDate(period.endDate)}</TableCell>
                        <TableCell>{formatDate(period.paymentDate)}</TableCell>
                        <TableCell align="right">{period.workingDays}</TableCell>
                        <TableCell align="right">{period.holidays?.length ?? 0}</TableCell>
                        {/* <TableCell align="center">
                  <Chip
                    label={cfg.label}
                    // color={cfg.color}
                    size="small"
                  />
                </TableCell> */}
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => onEdit(period)}>
                              <EditIcon fontSize="small" className="!w-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(period.id);
                              }}
                            >
                              <Delete fontSize="small" className="text-error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function PayrollPeriodConfig() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [periods, setPeriods] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [viewType, setViewType] = useState<"monthly" | "weekly">("monthly");

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
  // const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });

  const [activeFiscalYear, setActiveFiscalYear] = useState<{
    id: string;
    yearLabel: string;
    startDate: string;
    endDate: string;
    active?: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      await loadActiveFiscalYear();
      await loadPeriods();
    })();
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

  const loadActiveFiscalYear = async () => {
    try {
      const companyRes: any = await companyService.getCompany();
      const companyId = companyRes?.data?.length
        ? companyRes.data[0].id
        : companyRes?.data?.id || "";

      if (!companyId) {
        setActiveFiscalYear(null);
        return;
      }

      const fyRes: any = await fiscalYearService.getFiscalYears(companyId);
      const list: any[] = Array.isArray(fyRes?.data) ? fyRes.data : [];

      const active =
        list.find((f) => f.active === true) ??
        (list.length === 1 ? list[0] : null);

      setActiveFiscalYear(
        active
          ? {
            id: active.id,
            yearLabel: active.yearLabel,
            startDate: active.startDate,
            endDate: active.endDate,
            active: active.active,
          }
          : null
      );
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to load active fiscal year",
        "error"
      );
      setActiveFiscalYear(null);
    }
  };

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
      endDate: formData.endDate,
    };
    try {
      const response: any = await periodsService.getSummaryPeriods(params);
      setSummaryData(response.data);
      if (response.data?.workingDays != null) {
        setFormData((prev) => ({
          ...prev,
          workingDays: response.data.workingDays,
        }));
      }
    } catch (error) {
      showSnackbar("Failed to load period summary", "error");
      setSummaryData(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // const openCreateDialog = () => {
  //   setIsEditMode(false);
  //   setFormData({
  //     id: "",
  //     name: "",
  //     startDate: "",
  //     endDate: "",
  //     paymentDate: "",
  //     cutoffDate: "",
  //     workingDays: 0,
  //     status: "pending",
  //     holidays: [],
  //   });
  //   setNewHoliday({ name: "", date: "" });
  //   setSummaryData(null);
  //   setIsDialogOpen(true);
  // };

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
    // setNewHoliday({ name: "", date: "" });
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
      const payload: any = {
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
    // setNewHoliday({ name: "", date: "" });
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

  // const handleAddHoliday = () => {
  //   if (!newHoliday.name || !newHoliday.date) {
  //     showSnackbar("Please fill holiday name and date", "warning");
  //     return;
  //   }
  //   setFormData({
  //     ...formData,
  //     holidays: [...formData.holidays, { name: newHoliday.name, date: newHoliday.date }],
  //   });
  //   setNewHoliday({ name: "", date: "" });
  // };

  // const handleRemoveHoliday = (index: number) => {
  //   setFormData({
  //     ...formData,
  //     holidays: formData.holidays.filter((_, i) => i !== index),
  //   });
  // };

  const handleLoadSummary = async () => {
    await loadSummaryPeriods();
  };

  const visiblePeriods = periods.filter((period) => {
    if (!activeFiscalYear) return false;
    if (!period.startDate || !period.endDate) return false;

    const pStart = dayjs(period.startDate);
    const pEnd = dayjs(period.endDate);
    const fStart = dayjs(activeFiscalYear.startDate);
    const fEnd = dayjs(activeFiscalYear.endDate);

    return !pStart.isAfter(fEnd) && !pEnd.isBefore(fStart);
  });

  const monthlyPeriods = visiblePeriods
    .filter((p) => p.periodType === "monthly")
    .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());

  const weeklyPeriods = visiblePeriods
    .filter((p) => p.periodType === "weekly")
    .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());

  const displayedPeriods = viewType === "monthly" ? monthlyPeriods : weeklyPeriods;

  const renderSummary = () => {
    if (isLoadingSummary) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }

    if (!summaryData) {
      return (
        <Box sx={{ textAlign: "center", py: 3 }}>
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2" className="text-gray-800">
            Period
          </Typography>
          <Typography variant="body2" className="text-gray-800">
            {formatDate(summaryData.startDate)} - {formatDate(summaryData.endDate)}
          </Typography>
        </Box>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <Typography variant="h6" color="primary">
                {summaryData.totalDays}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Total Days
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: alpha(theme.palette.success.main, 0.04) }}>
              <Typography variant="h6" color="success">
                {summaryData.workingDays}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Working
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
              <Typography variant="h6" color="warning">
                {summaryData.weekends || 0}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Weekends
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: alpha(theme.palette.info.main, 0.04) }}>
              <Typography variant="h6" color="info">
                {summaryData.holidays || 0}
              </Typography>
              <Typography variant="caption" className="text-gray-800">
                Holidays
              </Typography>
            </Paper>
          </Grid>
        </Grid>

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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
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
                    color={holiday.type === "PUBLIC" ? "error" : "warning"}
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.6rem" }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.success.main, 0.04),
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          }}
        >
          <Typography variant="caption" className="text-gray-500" align="center">
            Total: {summaryData.totalDays} days | Working: {summaryData.workingDays} | Non-working:{" "}
            {(summaryData.weekends || 0) + summaryData.holidays}
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
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="body2" className="text-gray-800">
          Active Fiscal Year:{" "}
          <strong>
            {activeFiscalYear
              ? `${activeFiscalYear.yearLabel || ""} (${formatDate(activeFiscalYear.startDate)} – ${formatDate(activeFiscalYear.endDate)})`
              : "Not configured"}
          </strong>
        </Typography>
      </Box>

      <PeriodTable
        title={
          viewType === "monthly"
            ? "Monthly Payroll Periods"
            : "Weekly Payroll Periods"
        }
        periods={displayedPeriods}
        activeFiscalYear={activeFiscalYear}
        onEdit={openEditDialog}
        onDelete={handleDeletePeriod}
        viewType={viewType}
        onViewTypeChange={setViewType}
        monthlyCount={monthlyPeriods.length}
        weeklyCount={weeklyPeriods.length}
      />

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

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate ? dayjs(formData.startDate) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        startDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true, required: true },
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
                        endDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true, required: true },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid container spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Payment Date"
                    value={formData.paymentDate ? dayjs(formData.paymentDate) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        paymentDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true, required: true },
                    }}
                  />
                </Grid>
              </LocalizationProvider>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Working Days"
                  type="number"
                  value={formData.workingDays ?? ""}
                  onChange={(e) => setFormData({ ...formData, workingDays: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <div className="text-[12px] text-gray-800">Period Summary</div>
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

            {/* <Box>
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
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                  <DatePicker
                    label="Date"
                    value={newHoliday.date ? dayjs(newHoliday.date) : null}
                    onChange={(newValue) => {
                      setNewHoliday({
                        ...newHoliday,
                        date: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      });
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { sx: { minWidth: 150 } },
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
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }}
                    >
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
            </Box> */}
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