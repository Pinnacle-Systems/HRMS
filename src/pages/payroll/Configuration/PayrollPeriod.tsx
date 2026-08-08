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
  Switch,
  Paper,
  CircularProgress,
  Fab,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  Cancel as XCircleIcon,
  Settings as Settings2Icon,
  Download as DownloadIcon,
  Assessment as FileBarChartIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { periodsService } from "../../../services/modules/payrollServices/period";
import { useUI } from "../../../context/Snackbar";

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
  processing: { label: "Processing", icon: PlayIcon, color: "#3b82f6", bgColor: "#dbeafe" },
  processed: { label: "Processed", icon: CheckCircleIcon, color: "#10b981", bgColor: "#d1fae5" },
  closed: { label: "Closed", icon: XCircleIcon, color: "#6b7280", bgColor: "#f3f4f6" },
};

export default function PayrollPeriodConfig() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [periods, setPeriods] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    paymentDate: "",
    cutoffDate: "",
    workingDays: 22,
    status: "pending",
    holidays: [] as { name: string; date: string }[],
  });
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await periodsService.getPeriods();
      setPeriods(response.data?.items || response.data || []);
    } catch (error) {
      console.error("Failed to load payroll periods", error);
      showSnackbar("Failed to load payroll periods", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    if (!createForm.name || !createForm.startDate || !createForm.endDate || !createForm.paymentDate) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    showSpinner();
    try {
      const payload = {
        name: createForm.name,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        paymentDate: createForm.paymentDate,
        cutoffDate: createForm.cutoffDate || createForm.startDate,
        workingDays: createForm.workingDays,
        status: createForm.status,
        holidays: createForm.holidays,
      };
      await periodsService.createPeriod(payload);
      showSnackbar("Period created successfully!", "success");
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: "",
        startDate: "",
        endDate: "",
        paymentDate: "",
        cutoffDate: "",
        workingDays: 22,
        status: "pending",
        holidays: [],
      });
      loadPeriods();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to create period", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUpdatePeriod = async () => {
    if (!selectedPeriod) return;
    showSpinner();
    try {
      await periodsService.updatePeriod(selectedPeriod.id, selectedPeriod);
      showSnackbar("Period updated successfully!", "success");
      setIsDialogOpen(false);
      loadPeriods();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to update period", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Are you sure you want to delete this period?")) return;
    showSpinner();
    try {
      await periodsService.deletePeriod(id);
      showSnackbar("Period deleted successfully!", "success");
      loadPeriods();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to delete period", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      showSnackbar("Please fill holiday name and date", "warning");
      return;
    }
    setCreateForm({
      ...createForm,
      holidays: [...createForm.holidays, { name: newHoliday.name, date: newHoliday.date }],
    });
    setNewHoliday({ name: "", date: "" });
  };

  const handleRemoveHoliday = (index: number) => {
    setCreateForm({
      ...createForm,
      holidays: createForm.holidays.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

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
            onClick={() => setIsCreateDialogOpen(true)}
            className="!bg-primary"
          >
            Create Period
          </Button>
          {/* <Button variant="outlined" startIcon={<FileBarChartIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Generate Reports
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Export Data
          </Button> */}
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
                <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  <Typography variant="body1">No periods found. Click "Create Period" to add one.</Typography>
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
                        cursor: "pointer",
                        borderRadius: 2,
                        border: `1px solid ${alpha(cfg.color, 0.3)}`,
                        // bgcolor: alpha(cfg.color, 0.05),
                        bgcolor: isClosed ? alpha(theme.palette.grey[500], 0.05) : "background.paper",
                        transition: "all 0.2s",
                        "&:hover": { boxShadow: 2, borderColor: 'var(--color-primary)' },
                        opacity: isClosed ? 0.7 : 1,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Box
                          onClick={() => { setSelectedPeriod(period); setIsDialogOpen(true); }}
                          sx={{ flex: 1 }}
                        >
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
                            bgcolor: cfg.bgColor, color: cfg.color,
                            fontSize: "0.65rem", fontWeight: 500,
                            "& .MuiChip-icon": { color: cfg.color },
                          }}
                        />
                      </Box>
                      <Stack spacing={0.75}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <div className="text-[12px] text-gray-500">
                            Payment date
                          </div>
                          <div className="text-[12px] text-gray-800">
                            {formatDate(period.paymentDate)}
                          </div>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <div className="text-[12px] text-gray-500">
                            Working days
                          </div>
                          <div className="text-[12px] text-gray-800">
                            {period.workingDays}
                          </div>
                        </Box>
                        {period.holidays?.length > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="text-[12px] text-gray-500">
                              Holidays
                            </div>
                            <div className="text-[12px] text-gray-800">
                              {period.holidays.length}
                            </div>
                          </Box>
                        )}
                      </Stack>
                      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeriod(period);
                            setIsDialogOpen(true);
                          }}
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

      {/* Create Period Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Create New Payroll Period</Typography>
            <IconButton onClick={() => setIsCreateDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Period Name *"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., August 2026"
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Start Date *"
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="End Date *"
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Payment Date *"
                  type="date"
                  value={createForm.paymentDate}
                  onChange={(e) => setCreateForm({ ...createForm, paymentDate: e.target.value })}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Working Days"
                  type="number"
                  value={createForm.workingDays}
                  onChange={(e) => setCreateForm({ ...createForm, workingDays: Number(e.target.value) })}
                  fullWidth
                  size="small"
                // inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Holidays
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="Holiday Name"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Date"
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  size="small"
                  sx={{ width: 160 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button variant="outlined" onClick={handleAddHoliday} sx={{ textTransform: "none" }}>
                  Add
                </Button>
              </Box>
              {createForm.holidays.length > 0 && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {createForm.holidays.map((h, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <Box>
                        <Typography variant="body2">{h.name}</Typography>
                        <div className="text-[12px] text-gray-800">
                          {formatDate(h.date)}
                        </div>
                      </Box>
                      <IconButton size="small" onClick={() => handleRemoveHoliday(i)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsCreateDialogOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleCreatePeriod} variant="contained" sx={{ textTransform: "none" }}>
            Create Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Period Detail Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Period Details — {selectedPeriod?.name}</Typography>
            <IconButton onClick={() => setIsDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPeriod && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <div className="text-[12px] text-gray-800">
                      Start Date
                    </div>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedPeriod.startDate)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <div className="text-[12px] text-gray-800">
                      End Date
                    </div>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedPeriod.endDate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Payment Date"
                    type="date"
                    value={selectedPeriod.paymentDate?.split("T")[0] || ""}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, paymentDate: e.target.value })}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Working Days"
                    type="number"
                    value={selectedPeriod.workingDays || ""}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, workingDays: Number(e.target.value) })}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              {selectedPeriod.holidays?.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Holidays
                  </Typography>
                  <Stack spacing={1}>
                    {selectedPeriod.holidays.map((h: any, i: number) => (
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <Typography variant="body2">{h.name}</Typography>
                        <div className="text-[12px] text-gray-800">
                          {formatDate(h.date)}
                        </div>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsDialogOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button onClick={handleUpdatePeriod} variant="contained" sx={{ textTransform: "none" }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}