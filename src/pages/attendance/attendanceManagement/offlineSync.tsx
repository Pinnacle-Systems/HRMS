import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Select,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  DeviceUnknown as DeviceIcon,
  Merge as MergeIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  CancelOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import {
  offlineSyncService,
  type AttendanceConflict,
  type ConsolidateRequest,
  type ResolveConflictRequest,
  type OfflinePunch,
} from "../../../services/modules/offlineSync";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import {
  biometricService,
  type BiometricDevice,
} from "../../../services/modules/biometricDevice";

// ==================== TAB PANELS ====================
// interface TabPanelProps {
//   children?: React.ReactNode;
//   index: number;
//   value: number;
// }

// const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
//   <div role="tabpanel" hidden={value !== index}>
//     {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
//   </div>
// );

// ==================== MAIN COMPONENT ====================
export const OfflineSyncManagement: React.FC = () => {
  const { showSnackbar } = useUI();
  //   const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<AttendanceConflict[]>([]);
  const [openConsolidateDialog, setOpenConsolidateDialog] = useState(false);
  const [openResolveDialog, setOpenResolveDialog] = useState(false);
  const [openErrorLogDialog, setOpenErrorLogDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] =
    useState<AttendanceConflict | null>(null);

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState<any>(null);

  const [filterSyncToken, setFilterSyncToken] = useState("");
  const [devices, setDevices] = useState<BiometricDevice[]>([]);

  // Consolidate Form
  const [consolidateForm, setConsolidateForm] = useState({
    employeeId: "",
    deviceId: "",
    syncToken: "",
  });
  const [offlinePunches, setOfflinePunches] = useState<OfflinePunch[]>([
    {
      type: "check_in",
      timestamp: new Date().toISOString(),
      latitude: 0,
      longitude: 0,
      photoHash: "",
    },
  ]);

  // Resolve Form
  const [resolveForm, setResolveForm] = useState<ResolveConflictRequest>({
    resolutionStrategy: "manual",
    resolvedBy: "",
    notes: "",
  });

  // Error Log Form
  const [errorLogForm, setErrorLogForm] = useState({
    deviceId: "",
    employeeId: "",
    errorCode: "",
    errorMessage: "",
    stackTrace: "",
    timestamp: new Date().toISOString(),
    appVersion: "",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchConflicts();
    fetchDevices();
  }, []);

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const employeeId = filterEmployeeId?.id || filterEmployeeId || undefined;
      const syncToken = filterSyncToken || undefined;
      const data = await offlineSyncService.getConflicts(employeeId, syncToken);
      setConflicts(data);
    } catch (error) {
      showSnackbar("Failed to fetch conflicts", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data: any = await biometricService.getAllDevices({
        isActive: true,
      });
      setDevices(data);
    } catch (error) {
      showSnackbar("Failed to fetch devices", "error");
    } finally {
      setLoading(false);
    }
  };

  // const fetchErrorLogs = async () => {
  //     try {
  //         const data = await offlineSyncService.getErrorLogs(
  //             filterDeviceId || undefined,
  //             filterEmployeeId || undefined
  //         );
  //         setErrorLogs(data);
  //     } catch (error) {
  //         showSnackbar('Failed to fetch error logs', 'error');
  //     }
  // };

  // ==================== CONSOLIDATION HANDLERS ====================
  const handleOpenConsolidateDialog = () => {
    setConsolidateForm({
      employeeId: "",
      deviceId: "",
      syncToken: new Date().toISOString(),
    });
    setOfflinePunches([
      {
        type: "check_in",
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        photoHash: "",
      },
    ]);
    setOpenConsolidateDialog(true);
  };

  const handleCloseConsolidateDialog = () => {
    setOpenConsolidateDialog(false);
    setFilterEmployeeId(null);
  };

  const handleConsolidateFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setConsolidateForm({ ...consolidateForm, [field]: event.target.value });
    };

  const handlePunchChange =
    (index: number, field: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPunches = [...offlinePunches];
      newPunches[index] = { ...newPunches[index], [field]: event.target.value };
      setOfflinePunches(newPunches);
    };

  const handleAddPunch = () => {
    setOfflinePunches([
      ...offlinePunches,
      {
        type: "check_in",
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        photoHash: "",
      },
    ]);
  };

  const handleRemovePunch = (index: number) => {
    setOfflinePunches(offlinePunches.filter((_, i) => i !== index));
  };

  const handleConsolidate = async () => {
    if ((!consolidateForm.employeeId && !filterEmployeeId.id)  || !consolidateForm.deviceId) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const data: ConsolidateRequest = {
        employeeId:
          consolidateForm.employeeId || filterEmployeeId.id || undefined,
        deviceId: consolidateForm.deviceId,
        syncToken: consolidateForm.syncToken || new Date().toISOString(),
        offlinePunches: offlinePunches,
      };

      const result = await offlineSyncService.consolidateOfflinePunches(data);
      showSnackbar(
        `Consolidation complete: ${result.daysApplied} days applied, ${result.conflicts} conflicts, ${result.skipped} skipped`,
        "success",
      );
      handleCloseConsolidateDialog();
      await fetchConflicts();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to consolidate", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RESOLUTION HANDLERS ====================
  const handleOpenResolveDialog = (conflict: AttendanceConflict) => {
    setSelectedConflict(conflict);
    setResolveForm({
      resolutionStrategy: "manual",
      resolvedBy: "Admin", // Should come from auth context
      notes: "",
    });
    setOpenResolveDialog(true);
  };

  const handleCloseResolveDialog = () => {
    setOpenResolveDialog(false);
    setSelectedConflict(null);
  };

  const handleResolveFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setResolveForm({ ...resolveForm, [field]: event.target.value });
    };

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    setLoading(true);
    try {
      await offlineSyncService.resolveConflict(
        selectedConflict.id,
        resolveForm,
      );

      showSnackbar("Conflict resolved successfully", "success");
      handleCloseResolveDialog();
      await fetchConflicts();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to resolve conflict", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== ERROR LOG HANDLERS ====================
  const handleOpenErrorLogDialog = () => {
    setErrorLogForm({
      deviceId: "",
      employeeId: "",
      errorCode: "",
      errorMessage: "",
      stackTrace: "",
      timestamp: new Date().toISOString(),
      appVersion: "1.0.0",
    });
    setOpenErrorLogDialog(true);
  };

  const handleCloseErrorLogDialog = () => {
    setOpenErrorLogDialog(false);
    setFilterEmployeeId(null);
  };

  const handleErrorLogFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setErrorLogForm({ ...errorLogForm, [field]: event.target.value });
    };

  const handleLogError = async () => {
    if (
      !errorLogForm.deviceId ||
      !errorLogForm.errorCode ||
      !errorLogForm.errorMessage
    ) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await offlineSyncService.logDeviceError({
        deviceId: errorLogForm.deviceId,
        employeeId: errorLogForm.employeeId || filterEmployeeId.id || undefined,
        errorCode: errorLogForm.errorCode,
        errorMessage: errorLogForm.errorMessage,
        stackTrace: errorLogForm.stackTrace || undefined,
        timestamp: errorLogForm.timestamp,
        appVersion: errorLogForm.appVersion,
      });

      showSnackbar("Error logged successfully", "success");
      handleCloseErrorLogDialog();
      setFilterEmployeeId(null);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to log error", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTER HANDLERS ====================
  const handleApplyFilters = () => {
    fetchConflicts();
  };

  const handleClearFilters = () => {
    setFilterEmployeeId(null);
    setFilterSyncToken("");
    setTimeout(() => {
      fetchConflicts();
    }, 100);
  };

  // ==================== STATUS HELPERS ====================
  const getStatusChip = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Chip
            label="Pending"
            color="warning"
            size="small"
            icon={<PendingIcon />}
          />
        );
      case "resolved":
        return (
          <Chip
            label="Resolved"
            color="success"
            size="small"
            icon={<CheckCircleIcon />}
          />
        );
      case "ignored":
        return (
          <Chip
            label="Ignored"
            color="default"
            size="small"
            icon={<CancelIcon />}
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getStrategyChip = (strategy: string) => {
    const strategyMap: Record<string, { label: string; color: any }> = {
      server_wins: { label: "Server Wins", color: "primary" },
      client_wins: { label: "Client Wins", color: "secondary" },
      latest_wins: { label: "Latest Wins", color: "info" },
      manual: { label: "Manual", color: "warning" },
    };
    const s = strategyMap[strategy] || { label: strategy, color: "default" };
    return (
      <Chip
        label={s.label}
        color={s.color as any}
        size="small"
        variant="outlined"
      />
    );
  };

  // ==================== STATISTICS ====================
  const stats = {
    totalConflicts: conflicts.length,
    pendingConflicts: conflicts.filter((c) => c.status === "pending").length,
    resolvedConflicts: conflicts.filter((c) => c.status === "resolved").length,
    // errorCount: errorLogs.length,
  };

  // ==================== RENDER CONSOLIDATE DIALOG ====================
  const renderConsolidateDialog = () => (
    <Dialog
      open={openConsolidateDialog}
      onClose={handleCloseConsolidateDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="border-b border-gray-200">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MergeIcon color="primary" />
          <Typography variant="h6">Consolidate Offline Punches</Typography>
        </Box>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* <TextField
              fullWidth
              label="Employee ID"
              value={consolidateForm.employeeId}
              onChange={handleConsolidateFormChange("employeeId")}
              required
            /> */}
            <EmployeeSelector
              value={filterEmployeeId}
              onChange={setFilterEmployeeId}
              label="Employee"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* <TextField
              fullWidth
              label="Device ID"
              value={consolidateForm.deviceId}
              onChange={handleConsolidateFormChange("deviceId")}
              required
            /> */}
            <Select
              value={consolidateForm.deviceId}
              onChange={(e) =>
                setConsolidateForm({
                  ...consolidateForm,
                  deviceId: e.target.value,
                })
              }
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Select</MenuItem>
              {devices.map((d) => (
                <MenuItem value={d.id}>{d.deviceName}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Sync Token"
              value={consolidateForm.syncToken}
              onChange={handleConsolidateFormChange("syncToken")}
            />
            <span className="text-[10px] ml-3">Timestamp of last sync</span>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <div className="text-[12px] text-primary font-bold">
                Offline Punches
              </div>
              <Button
                size="small"
                onClick={handleAddPunch}
                variant="outlined"
                className="!text-primary !border-primary"
              >
                Add Punch
              </Button>
            </Box>
            {offlinePunches.map((punch, index) => (
              <div key={index} className="p-4 pt-6 mb-2 border border-gray-200">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      select
                      label="Type"
                      value={punch.type}
                      onChange={handlePunchChange(index, "type")}
                    >
                      <MenuItem value="check_in">Check In</MenuItem>
                      <MenuItem value="check_out">Check Out</MenuItem>
                      <MenuItem value="break_in">Break In</MenuItem>
                      <MenuItem value="break_out">Break Out</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    {/* <TextField
                      fullWidth
                      type="datetime-local"
                      label="Timestamp"
                      value={punch.timestamp}
                      onChange={handlePunchChange(index, "timestamp")}
                    /> */}
                   <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Timestamp"
                      value={punch.timestamp ? dayjs(punch.timestamp) : null}
                      onChange={(newValue) => {
                        const newPunches = [...offlinePunches];
                        newPunches[index] = {
                          ...newPunches[index],
                          timestamp: newValue ? newValue.toISOString() : ''
                        };
                        setOfflinePunches(newPunches);
                      }}
                      format="YYYY-MM-DD HH:mm"
                      ampm={false}
                    />
                  </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Latitude"
                      value={punch.latitude}
                      onChange={handlePunchChange(index, "latitude")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Longitude"
                      value={punch.longitude}
                      onChange={handlePunchChange(index, "longitude")}
                    />
                  </Grid>
                  <Grid size={{ xs: 10 }}>
                    <TextField
                      fullWidth
                      label="Photo Hash"
                      value={punch.photoHash}
                      onChange={handlePunchChange(index, "photoHash")}
                    />
                  </Grid>
                  {offlinePunches.length > 1 && (
                    <Grid size={{ xs: 2 }}>
                      {/* <Button
                        color="error"
                        onClick={() => handleRemovePunch(index)}
                      >
                        Remove
                      </Button> */}
                      <IconButton onClick={() => handleRemovePunch(index)}>
                        <CancelOutlined color="error"/>
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </div>
            ))}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Consolidation will merge {offlinePunches.length} offline punches
                with existing attendance records. Conflicts will be created for
                mismatches.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseConsolidateDialog}
          disabled={loading}
          variant="outlined"
          className="!text-gray-800 !border-gray-200"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConsolidate}
          variant="contained"
          disabled={loading}
          className="!bg-primary"
          startIcon={loading ? <CircularProgress size={20} /> : <MergeIcon />}
        >
          {loading ? "Processing..." : "Consolidate"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ==================== RENDER RESOLVE DIALOG ====================
  const renderResolveDialog = () => (
    <Dialog
      open={openResolveDialog}
      onClose={handleCloseResolveDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="border-b border-gray-200">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckIcon color="primary" />
          <Typography variant="h6">Resolve Conflict</Typography>
        </Box>
      </DialogTitle>
      <DialogContent className="!p-4">
        {selectedConflict && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  Conflict detected for {selectedConflict.employeeId} on{" "}
                  {selectedConflict.attendanceDate}
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Resolution Strategy"
                value={resolveForm.resolutionStrategy}
                onChange={handleResolveFormChange("resolutionStrategy")}
                required
              >
                <MenuItem value="server_wins">Server Data Wins</MenuItem>
                <MenuItem value="client_wins">Client Data Wins</MenuItem>
                <MenuItem value="latest_wins">Latest Data Wins</MenuItem>
                <MenuItem value="manual">Manual Review Required</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Resolved By"
                value={resolveForm.resolvedBy}
                onChange={handleResolveFormChange("resolvedBy")}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={resolveForm.notes}
                onChange={handleResolveFormChange("notes")}
                placeholder="Add resolution notes..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <div className="text-[12px] text-gray-800">
                  Server Check In:{" "}
                  {new Date(selectedConflict.serverCheckIn).toLocaleString()}
                </div>
                <div className="text-[12px] text-gray-800">
                  Server Check Out:{" "}
                  {new Date(selectedConflict.serverCheckOut).toLocaleString()}
                </div>
                <div className="text-[12px] text-gray-800">
                  Client Check In:{" "}
                  {new Date(selectedConflict.clientCheckIn).toLocaleString()}
                </div>
                <div className="text-[12px] text-gray-800">
                  Client Check Out:{" "}
                  {new Date(selectedConflict.clientCheckOut).toLocaleString()}
                </div>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions className="border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseResolveDialog}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleResolveConflict}
          variant="contained"
          disabled={loading}
          className="!bg-success"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? "Resolving..." : "Resolve"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ==================== RENDER ERROR LOG DIALOG ====================
  const renderErrorLogDialog = () => (
    <Dialog
      open={openErrorLogDialog}
      onClose={handleCloseErrorLogDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="border-b border-gray-200">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ErrorIcon color="error" />
          <Typography variant="h6">Log Device Error</Typography>
        </Box>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            {/* <TextField
              fullWidth
              label="Device ID"
              value={errorLogForm.deviceId}
              onChange={handleErrorLogFormChange("deviceId")}
              required
            /> */}
            <Select
              value={errorLogForm.deviceId}
              fullWidth
              onChange={(e) =>
                setErrorLogForm({
                  ...errorLogForm,
                  deviceId: e.target.value,
                })
              }
              displayEmpty
            >
              <MenuItem value="">Select Device</MenuItem>
              {devices.map((d) => (
                <MenuItem value={d.id}>{d.deviceName}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={{ xs: 12 }}>
            {/* <TextField
              fullWidth
              label="Employee ID"
              value={errorLogForm.employeeId}
              onChange={handleErrorLogFormChange("employeeId")}
            /> */}
            <EmployeeSelector
              value={filterEmployeeId}
              onChange={setFilterEmployeeId}
              label="Employee"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Error Code"
              value={errorLogForm.errorCode}
              onChange={handleErrorLogFormChange("errorCode")}
              required
              placeholder="ERR_5001"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="App Version"
              value={errorLogForm.appVersion}
              onChange={handleErrorLogFormChange("appVersion")}
              placeholder="1.0.0"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Error Message"
              value={errorLogForm.errorMessage}
              onChange={handleErrorLogFormChange("errorMessage")}
              required
              multiline
              rows={2}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Stack Trace"
              value={errorLogForm.stackTrace}
              onChange={handleErrorLogFormChange("stackTrace")}
              multiline
              rows={3}
              placeholder="Stack trace details..."
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            {/* <TextField
              fullWidth
              type="datetime-local"
              label="Occurred At"
              value={errorLogForm.timestamp}
              onChange={handleErrorLogFormChange("timestamp")}
            /> */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Occurred At"
                value={
                  errorLogForm.timestamp ? dayjs(errorLogForm.timestamp) : null
                }
                onChange={(newValue) => {
                  setErrorLogForm({
                    ...errorLogForm,
                    timestamp: newValue ? newValue.toISOString() : "",
                  });
                }}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseErrorLogDialog}
          disabled={loading}
          variant="outlined"
          className="text-gray-800 border-gray-200"
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogError}
          variant="contained"
          disabled={loading}
          color="error"
          startIcon={loading ? <CircularProgress size={20} /> : <ErrorIcon />}
        >
          {loading ? "Logging..." : "Log Error"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">Offline Sync & Data Integrity</Typography>
          <Typography variant="body2">
            Manage offline punches, conflicts, and error logs
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            className="!text-primary !border-primary"
            onClick={() => {
              fetchConflicts();
            }}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ErrorIcon />}
            className="!text-error !border-red-500"
            onClick={handleOpenErrorLogDialog}
            sx={{ mr: 1 }}
          >
            Log Error
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<MergeIcon />}
            onClick={handleOpenConsolidateDialog}
          >
            Consolidate
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-white-50">
            <CardContent>
              <Typography className="text-gray-800 !mb-2">
                Total Conflicts
              </Typography>
              <Typography className="text-gray-800">
                {stats.totalConflicts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            className="bg-white-50"
            sx={{ borderLeft: 4, borderColor: "warning.main" }}
          >
            <CardContent>
              <Typography className="text-gray-800 !mb-2">
                Pending Conflicts
              </Typography>
              <Typography className="text-gray-800" color="warning.main">
                {stats.pendingConflicts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            className="bg-white-50"
            sx={{ borderLeft: 4, borderColor: "success.main" }}
          >
            <CardContent>
              <Typography className="text-gray-800 !mb-2">
                Resolved Conflicts
              </Typography>
              <Typography className="text-gray-800" color="success.main">
                {stats.resolvedConflicts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Error Logs
                            </Typography>
                            <Typography variant="h4" color="error.main">
                                {stats.errorCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid> */}
      </Grid>

      {/* Filters */}
      <div className="p-4 pt-5 mb-3 border border-gray-200 shadow-sm bg-white-50 rounded-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Typography
              variant="subtitle2"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterIcon fontSize="small" /> Filters:
            </Typography>
            {/* <TextField
              label="Employee ID"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              placeholder="Filter by employee"
            /> */}
            <div className="w-[450px]">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={setFilterEmployeeId}
                label="Employee"
              />
            </div>
            <TextField
              label="Sync Token"
              value={filterSyncToken}
              onChange={(e) => setFilterSyncToken(e.target.value)}
              placeholder="Filter by sync token"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              className="!border-gray-200 !text-gray-800"
              size="small"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              className="!bg-primary"
              onClick={handleApplyFilters}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5">
        <div className="text-gray-800 text-[12px] mb-3">{`Conflicts (${conflicts.length})`}</div>
        {/* <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Conflicts (${conflicts.length})`}
            icon={<WarningIcon />}
            iconPosition="start"
          />
          <Tab label={`Error Logs (${errorLogs.length})`} icon={<ErrorIcon />} iconPosition="start" />
        </Tabs> */}

        {/* Conflicts Tab */}
        {/* <TabPanel value={tabValue} index={0} > */}
        <TableContainer className="bg-white border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold">S No</TableCell>
                <TableCell className="!font-bold">Employee</TableCell>
                <TableCell className="!font-bold">Date</TableCell>
                <TableCell className="!font-bold">Device</TableCell>
                <TableCell className="!font-bold">Status</TableCell>
                <TableCell className="!font-bold">Strategy</TableCell>
                <TableCell className="!font-bold">Server vs Client</TableCell>
                <TableCell className="!font-bold" align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : conflicts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No conflicts found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                conflicts.map((conflict, i) => (
                  <TableRow key={conflict.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonIcon fontSize="small" />
                        {conflict.employeeId}
                      </Box>
                    </TableCell>
                    <TableCell>{conflict.attendanceDate}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DeviceIcon fontSize="small" />
                        {conflict.deviceId}
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(conflict.status)}</TableCell>
                    <TableCell>
                      {getStrategyChip(conflict.resolutionStrategy)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Server data vs Client data">
                        <Box>
                          <div className="text-[12px] text-gray-800">
                            In:{" "}
                            {new Date(
                              conflict.serverCheckIn,
                            ).toLocaleTimeString()}{" "}
                            vs{" "}
                            {new Date(
                              conflict.clientCheckIn,
                            ).toLocaleTimeString()}
                          </div>
                          <div className="text-[12px] text-gray-800">
                            Out:{" "}
                            {new Date(
                              conflict.serverCheckOut,
                            ).toLocaleTimeString()}{" "}
                            vs{" "}
                            {new Date(
                              conflict.clientCheckOut,
                            ).toLocaleTimeString()}
                          </div>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {conflict.status === "pending" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenResolveDialog(conflict)}
                        >
                          Resolve
                        </Button>
                      )}
                      {conflict.status === "resolved" && (
                        <Chip
                          label={`Resolved by ${conflict.resolvedBy}`}
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* </TabPanel> */}

        {/* Error Logs Tab */}
        {/* <TabPanel value={tabValue} index={1}>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Device</TableCell>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Error Code</TableCell>
                                    <TableCell>Message</TableCell>
                                    <TableCell>Version</TableCell>
                                    <TableCell>Logged At</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {errorLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body1" sx={{ py: 3 }}>
                                                No error logs found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    errorLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>{log.deviceId}</TableCell>
                                            <TableCell>{log.employeeId || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.errorCode}
                                                    color={getErrorLevel(log.errorCode) as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{log.errorMessage}</TableCell>
                                            <TableCell>{log.appVersion}</TableCell>
                                            <TableCell>
                                                {new Date(log.loggedAt).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel> */}
      </div>

      {/* Dialogs */}
      {renderConsolidateDialog()}
      {renderResolveDialog()}
      {renderErrorLogDialog()}
    </Box>
  );
};

export default OfflineSyncManagement;
