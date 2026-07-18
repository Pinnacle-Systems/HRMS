import { useState } from "react";
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
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockPayrollPeriods = [
  {
    id: "PER001",
    name: "June 2026",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-30"),
    paymentDate: new Date("2026-07-05"),
    cutoffDate: new Date("2026-06-25"),
    workingDays: 22,
    status: "pending",
    holidays: [
      { name: "Eid al-Fitr", date: new Date("2026-06-05") },
      { name: "Independence Day", date: new Date("2026-06-15") },
    ],
  },
  {
    id: "PER002",
    name: "May 2026",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-31"),
    paymentDate: new Date("2026-06-05"),
    cutoffDate: new Date("2026-05-25"),
    workingDays: 23,
    status: "processed",
    holidays: [{ name: "Labor Day", date: new Date("2026-05-01") }],
  },
  {
    id: "PER003",
    name: "April 2026",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-04-30"),
    paymentDate: new Date("2026-05-05"),
    cutoffDate: new Date("2026-04-25"),
    workingDays: 22,
    status: "closed",
    holidays: [],
  },
  {
    id: "PER004",
    name: "July 2026",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-31"),
    paymentDate: new Date("2026-08-05"),
    cutoffDate: new Date("2026-07-25"),
    workingDays: 23,
    status: "pending",
    holidays: [],
  },
];

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  processing: {
    label: "Processing",
    icon: PlayIcon,
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  processed: {
    label: "Processed",
    icon: CheckCircleIcon,
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  closed: {
    label: "Closed",
    icon: XCircleIcon,
    color: "#6b7280",
    bgColor: "#f3f4f6",
  },
};

export default function PayrollPeriodConfig() {
  const theme = useTheme();
  const [periods, setPeriods] = useState(mockPayrollPeriods);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  const handleOpenDialog = (period: any) => {
    setSelectedPeriod(period);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPeriod(null);
  };

  const handleProcessPayroll = (periodId: string) => {
    setPeriods(
      periods.map((p) =>
        p.id === periodId ? { ...p, status: "processing" } : p
      )
    );
    // Toast notification would go here
    console.log("Payroll processing started for period:", periodId);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Payroll Period Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Manage payroll periods, processing schedule, and auto-sync settings
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileBarChartIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Generate Reports
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Calendar View */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CalendarIcon sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Calendar View — 2026
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {periods.map((period) => {
              const cfg = statusConfig[period.status] || statusConfig.pending;
              const Icon = cfg.icon;
              const isPending = period.status === "pending";
              const isProcessing = period.status === "processing";
              const isProcessed = period.status === "processed";
              const isClosed = period.status === "closed";

              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={period.id}>
                  <Paper
                    onClick={() => handleOpenDialog(period)}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      borderRadius: 2,
                      border: `1px solid ${
                        isProcessing
                          ? alpha(theme.palette.primary.main, 0.3)
                          : isProcessed
                          ? alpha(theme.palette.success.main, 0.3)
                          : isPending
                          ? alpha(theme.palette.warning.main, 0.3)
                          : theme.palette.divider
                      }`,
                      bgcolor: isClosed ? alpha(theme.palette.grey[500], 0.05) : "background.paper",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: 2,
                        borderColor: theme.palette.primary.main,
                      },
                      opacity: isClosed ? 0.7 : 1,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {period.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                          {formatDate(period.startDate)} – {formatDate(period.endDate)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<Icon sx={{ fontSize: 14 }} />}
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
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Payment date
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatDate(period.paymentDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Working days
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {period.workingDays}
                        </Typography>
                      </Box>
                      {period.holidays && period.holidays.length > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Holidays
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {period.holidays.length}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {isPending && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayIcon fontSize="small" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProcessPayroll(period.id);
                        }}
                        sx={{ mt: 2, textTransform: "none", width: "100%" }}
                      >
                        Process Payroll
                      </Button>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Settings2Icon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Processing Schedule
                </Typography>
              </Box>
              <Stack spacing={2}>
                {[
                  { id: "calcDay", label: "Salary Calculation Day", defaultValue: 25, desc: "Day of month to calculate salaries" },
                  { id: "approvalDay", label: "Approval Deadline", defaultValue: 28, desc: "Last day for payroll approvals" },
                  { id: "paymentDay", label: "Payment Processing Day", defaultValue: 5, desc: "Day to disburse salary payments" },
                  { id: "reportDay", label: "Report Generation Day", defaultValue: 6, desc: "Day to auto-generate payroll reports" },
                ].map((field) => (
                  <Box key={field.id} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {field.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {field.desc}
                      </Typography>
                    </Box>
                    <TextField
                      type="number"
                      defaultValue={field.defaultValue}
                    //   inputProps={{ min: 1, max: 31 }}
                      size="small"
                      sx={{ width: 80 }}
                      slotProps={{ htmlInput: { style: { textAlign: "center" } } }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Auto-sync Features
              </Typography>
              <Stack spacing={2}>
                {[
                  { label: "Auto-sync LOP from Attendance", desc: "Calculate Loss of Pay based on attendance data", defaultChecked: true },
                  { label: "Auto-sync Leave Data", desc: "Sync approved leaves for payroll adjustments", defaultChecked: true },
                  { label: "Auto-calculate Deductions", desc: "Process recurring loan/advance EMI deductions", defaultChecked: true },
                  { label: "Notify on Payroll Complete", desc: "Send email notifications after processing", defaultChecked: false },
                ].map((feature) => (
                  <Box
                    key={feature.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {feature.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {feature.desc}
                      </Typography>
                    </Box>
                    <Switch defaultChecked={feature.defaultChecked} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => console.log("Configuration Saved")}
          sx={{ textTransform: "none" }}
        >
          Save Configuration
        </Button>
      </Box>

      {/* Period Detail Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Period Details — {selectedPeriod?.name}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Review and configure this payroll period
          </Typography>
          {selectedPeriod && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Start Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedPeriod.startDate)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      End Date
                    </Typography>
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
                    defaultValue={selectedPeriod.paymentDate.toISOString().split("T")[0]}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Cut-off Date"
                    type="date"
                    defaultValue={selectedPeriod.cutoffDate.toISOString().split("T")[0]}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Working Days"
                type="number"
                defaultValue={selectedPeriod.workingDays}
                fullWidth
                size="small"
              />

              {selectedPeriod.holidays && selectedPeriod.holidays.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Holidays
                  </Typography>
                  <Stack spacing={1}>
                    {selectedPeriod.holidays.map((h: any, i: number) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        }}
                      >
                        <Typography variant="body2">{h.name}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {formatDate(h.date)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            onClick={() => {
              console.log("Period Updated");
              handleCloseDialog();
            }}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}