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
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Badge,
  ListItemIcon,
  ListItemText,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Computer as ComputerIcon,
  LocationOn as LocationIcon,
  Wifi as WifiIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
  Schedule as ScheduleIcon,
  VisibilityOutlined,
  PlayForWorkOutlined,
  HealthAndSafetyOutlined,
  MoreVertOutlined,
} from "@mui/icons-material";
import {
  biometricService,
  type BiometricDevice,
  type CreateDeviceRequest,
  type DeviceHealth,
  type SyncStatus,
} from "../../../services/modules/biometricDevice";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { formatDateTime } from "../../../utils/dateFormatter";

// ==================== MAIN COMPONENT ====================
export const DeviceManagement: React.FC = () => {
  const { showSnackbar } = useUI();

  // State
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  //   const [page, setPage] = useState(0);
  //   const [rowsPerPage, setRowsPerPage] = useState(10)

  // Form State
  const [formData, setFormData] = useState<CreateDeviceRequest>({
    deviceName: "",
    deviceSerial: "",
    deviceModel: "",
    ipAddress: "",
    location: "",
    syncFrequency: 5,
    machineType: "",
    machineSetUp: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [healthLoading, setHealthLoading] = useState<string | null>(null);
  const [deviceHealth, setDeviceHealth] = useState<
    Record<string, DeviceHealth>
  >({});

  const [openSyncDialog, setOpenSyncDialog] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncFormData, setSyncFormData] = useState({
    deviceId: "",
    startDate: "",
    endDate: "",
  });
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});
  const [activeSyncs, setActiveSyncs] = useState<Record<string, SyncStatus>>(
    {},
  );

  const machineTypes = ["IN", "OUT", "IN / OUT"];
  const machineSetups = ["Single", "Separate"];
  const syncFrequencies = [1, 5, 10, 15, 30, 60];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedMenuDevice, setSelectedMenuDevice] = useState<BiometricDevice | null>(null);


  useEffect(() => {
    const syncIds = Object.keys(activeSyncs);
    if (syncIds.length === 0) return;

    const interval = setInterval(() => {
      syncIds.forEach((syncId) => {
        const sync = activeSyncs[syncId];
        if (sync && sync.status !== "completed" && sync.status !== "failed") {
          checkSyncStatus(sync.deviceId, syncId);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [activeSyncs]);

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await biometricService.getAllDevices();
      setDevices(data);
    } catch (error) {
      showSnackbar("Failed to fetch devices", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== DIALOG HANDLERS ====================
  const handleOpenAddDialog = () => {
    setSelectedDevice(null);
    setDialogMode("add");
    setFormData({
      deviceName: "",
      deviceSerial: "",
      deviceModel: "",
      ipAddress: "",
      location: "",
      syncFrequency: 5,
      machineType: "",
      machineSetUp: "",
      isActive: true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (device: BiometricDevice) => {
    setSelectedDevice(device);
    setDialogMode("edit");
    setFormData({
      deviceName: device.deviceName || "",
      deviceSerial: device.deviceSerial || "",
      deviceModel: device.deviceModel || "",
      ipAddress: device.ipAddress || "",
      location: device.location || "",
      syncFrequency: device.syncFrequency || 5,
      machineType: device.machineType || "",
      machineSetUp: device.machineSetUp || "",
      isActive: device.isActive !== undefined ? device.isActive : true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenDetailsDialog = (device: BiometricDevice) => {
    setSelectedDevice(device);
    setOpenDetails(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedDevice(null);
  };

  // const handleOpenSyncDialog = () => {
  //   setSyncFormData({
  //     deviceId: devices.length > 0 ? devices[0].id : "",
  //     startDate: "",
  //     endDate: "",
  //   });
  //   setSyncErrors({});
  //   setOpenSyncDialog(true);
  // };

  const handleCloseSyncDialog = () => {
    setOpenSyncDialog(false);
    setSyncErrors({});
  };

  const handleSyncFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSyncFormData({ ...syncFormData, [field]: event.target.value });
      if (syncErrors[field]) {
        setSyncErrors({ ...syncErrors, [field]: "" });
      }
    };

  const validateSyncForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!syncFormData.deviceId) errors.deviceId = "Device is required";
    if (!syncFormData.startDate) errors.startDate = "Start date is required";
    if (!syncFormData.endDate) errors.endDate = "End date is required";

    if (syncFormData.startDate && syncFormData.endDate) {
      const start = new Date(syncFormData.startDate);
      const end = new Date(syncFormData.endDate);
      if (start > end) {
        errors.endDate = "End date must be after start date";
      }
    }

    setSyncErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkSyncStatus = async (deviceId: string, syncId: string) => {
    try {
      const status = await biometricService.getSyncStatus(deviceId, syncId);

      // Update active syncs
      setActiveSyncs((prev) => ({
        ...prev,
        [syncId]: status,
      }));

      // If sync is completed or failed, show notification
      if (status.status === "completed" || status.status === "failed") {
        showSnackbar(
          status.status === "completed"
            ? `Sync completed: ${status.punchesApplied} punches applied`
            : `Sync failed: ${status.message}`,
          status.status === "completed" ? "success" : "error",
        );

        // Remove from active syncs after delay
        setTimeout(() => {
          setActiveSyncs((prev) => {
            const newSyncs = { ...prev };
            delete newSyncs[syncId];
            return newSyncs;
          });
        }, 5000);
      }
    } catch (error) {
      console.error("Failed to check sync status:", error);
    }
  };

  const handleInitiateSync = async () => {
    if (!validateSyncForm()) return;

    setSyncLoading(true);
    try {
      const result = await biometricService.initiateSync({
        deviceId: syncFormData.deviceId,
        startDate: syncFormData.startDate,
        endDate: syncFormData.endDate,
      });

      // Add to active syncs
      setActiveSyncs((prev) => ({
        ...prev,
        [result.id]: result,
      }));

      showSnackbar("Sync initiated successfully", "success");
      handleCloseSyncDialog();

      // Initial status check
      await checkSyncStatus(result.deviceId, result.id);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to initiate sync", "error");
    } finally {
      setSyncLoading(false);
    }
  };

  // ==================== HEALTH CHECK HANDLERS ====================
  const handleCheckDeviceHealth = async (device: BiometricDevice) => {
    setHealthLoading(device.id);
    try {
      const health = await biometricService.checkDeviceHealth(device.id);
      setDeviceHealth((prev) => ({
        ...prev,
        [device.id]: health,
      }));
      showSnackbar(
        `Device ${health.status === "online" ? "is online" : "is offline"} - ${health.message}`,
        health.status === "online" ? "success" : "error",
      );
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to check device health", "error");
    } finally {
      setHealthLoading(null);
    }
  };

  const getHealthStatusChip = (deviceId: string) => {
    const health = deviceHealth[deviceId];
    if (!health) return null;

    return (
      <Chip
        size="small"
        label={health.status.toUpperCase()}
        color={
          health.status === "online"
            ? "success"
            : health.status === "offline"
              ? "error"
              : "warning"
        }
        icon={health.status === "online" ? <CheckCircleIcon /> : <CancelIcon />}
      />
    );
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    deviceId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeviceId(deviceId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeviceId(null);
  };

  // ==================== FORM HANDLERS ====================
  const handleFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setFormData({ ...formData, [field]: value });
      if (formErrors[field]) {
        setFormErrors({ ...formErrors, [field]: "" });
      }
    };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.deviceName.trim())
      errors.deviceName = "Device name is required";
    if (!formData.deviceSerial.trim())
      errors.deviceSerial = "Serial number is required";
    if (!formData.deviceModel.trim())
      errors.deviceModel = "Device model is required";
    if (!formData.ipAddress.trim()) errors.ipAddress = "IP address is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.machineType) errors.machineType = "Machine type is required";
    if (!formData.machineSetUp)
      errors.machineSetUp = "Machine setup is required";

    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (formData.ipAddress && !ipRegex.test(formData.ipAddress)) {
      errors.ipAddress = "Invalid IP address format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDevice = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (dialogMode === "add") {
        await biometricService.registerDevice(formData);
        showSnackbar("Device registered successfully", "success");
      } else {
        await biometricService.updateDevice(selectedDevice!.id, formData);
        showSnackbar("Device updated successfully", "success");
      }
      await fetchDevices();
      handleCloseDialog();
    } catch (error: any) {
      showSnackbar(
        error?.message ||
          `Failed to ${dialogMode === "add" ? "register" : "update"} device`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== ACTION HANDLERS ====================
  const handleToggleDeviceStatus = async (device: BiometricDevice) => {
    try {
      await biometricService.updateDevice(device.id, {
        isActive: !device.isActive,
        deviceSerial: device.deviceSerial,
      });
      showSnackbar(
        `Device ${!device.isActive ? "activated" : "deactivated"} successfully`,
        "success",
      );
      await fetchDevices();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to update device status", "error");
    }
  };

  //   const handleDeleteDevice = async (deviceId: string) => {
  //     if (window.confirm('Are you sure you want to delete this device?')) {
  //       try {
  //         await biometricService.deleteDevice(deviceId);
  //         showSnackbar('Device deleted successfully', 'success');
  //         await fetchDevices();
  //       } catch (error: any) {
  //         showSnackbar(error?.message || 'Failed to delete device', 'error');
  //       }
  //     }
  //   };

  // ==================== RENDER FUNCTIONS ====================
  const renderDeviceForm = () => (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-2">
        <div className="ml-4">
          {dialogMode === "add" ? "Register New Device" : "Edit Device"}
        </div>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Device Name"
              value={formData.deviceName}
              onChange={handleFormChange("deviceName")}
              error={!!formErrors.deviceName}
              helperText={formErrors.deviceName}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Serial Number"
              value={formData.deviceSerial}
              onChange={handleFormChange("deviceSerial")}
              error={!!formErrors.deviceSerial}
              helperText={formErrors.deviceSerial}
              required
              disabled={dialogMode === "edit"}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Device Model"
              value={formData.deviceModel}
              onChange={handleFormChange("deviceModel")}
              error={!!formErrors.deviceModel}
              helperText={formErrors.deviceModel}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="IP Address"
              value={formData.ipAddress}
              onChange={handleFormChange("ipAddress")}
              error={!!formErrors.ipAddress}
              helperText={formErrors.ipAddress}
              required
              placeholder="192.168.1.100"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={handleFormChange("location")}
              error={!!formErrors.location}
              helperText={formErrors.location}
              required
              placeholder="Building A, Floor 2"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Machine Type"
              value={formData.machineType}
              onChange={handleFormChange("machineType")}
              error={!!formErrors.machineType}
              helperText={formErrors.machineType}
              required
            >
              {machineTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Machine Setup"
              value={formData.machineSetUp}
              onChange={handleFormChange("machineSetUp")}
              error={!!formErrors.machineSetUp}
              helperText={formErrors.machineSetUp}
              required
            >
              {machineSetups.map((setup) => (
                <MenuItem key={setup} value={setup}>
                  {setup}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Sync Frequency (minutes)"
              value={formData.syncFrequency}
              onChange={handleFormChange("syncFrequency")}
            >
              {syncFrequencies.map((freq) => (
                <MenuItem key={freq} value={freq}>
                  {freq} minute{freq > 1 ? "s" : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleFormChange("isActive")}
                  color="primary"
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="!border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseDialog}
          disabled={loading}
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveDevice}
          variant="contained"
          disabled={loading}
          className="!bg-primary"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {dialogMode === "add" ? "Register Device" : "Update Device"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeviceDetails = () => {
    if (!selectedDevice) return null;
    const health = deviceHealth[selectedDevice.id];

    const DetailItem = ({ icon, label, value }: any) => (
      <Box sx={{ display: "flex", alignItems: "center", py: 1 }}>
        {icon}
        <Box sx={{ ml: 2 }}>
          <div className="text-[12px] text-gray-800 mb-1">{label}</div>
          <div className="text-[12px] text-gray-800">{value || "N/A"}</div>
        </Box>
      </Box>
    );

    return (
      <Dialog
        open={openDetails}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="border-b border-gray-200">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ComputerIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6">{selectedDevice.deviceName}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {health && getHealthStatusChip(selectedDevice.id)}
              <Chip
                label={selectedDevice.isActive ? "Active" : "Inactive"}
                color={selectedDevice.isActive ? "success" : "error"}
                icon={
                  selectedDevice.isActive ? <CheckCircleIcon /> : <CancelIcon />
                }
              />
            </Box>
            {/* <Chip
                            label={selectedDevice.isActive ? "Active" : "Inactive"}
                            color={selectedDevice.isActive ? "success" : "error"}
                            icon={
                                selectedDevice.isActive ? <CheckCircleIcon /> : <CancelIcon />
                            }
                        /> */}
          </Box>
        </DialogTitle>
        <DialogContent className="!px-5 !py-3">
          <Grid container spacing={3}>
            {/* Health Status */}
            {health && (
              <Grid size={{ xs: 12 }}>
                <div className="mb-2 text-[12px] text-gray-800">
                  Device Health
                </div>
                <Paper variant="outlined" sx={{ p: 2 }} className="bg-white">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DetailItem
                        icon={<HealthAndSafetyOutlined color="primary" />}
                        label="Status"
                        value={health.status.toUpperCase()}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DetailItem
                        icon={<ScheduleIcon color="primary" />}
                        label="Minutes Since Last Punch"
                        value={health.minutesSinceLastPunch}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <DetailItem
                        icon={<SyncIcon color="primary" />}
                        label="Last Sync"
                        value={new Date(health.lastSyncAt).toLocaleString()}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            {/* Basic Information */}
            <Grid size={{ xs: 12 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                Basic Information
              </div>
              <Paper
                variant="outlined"
                sx={{ p: 2 }}
                className="bg-white text-gray-800"
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<ComputerIcon color="primary" />}
                      label="Device Name"
                      value={selectedDevice.deviceName}
                    />
                    <DetailItem
                      icon={<ComputerIcon color="primary" />}
                      label="Serial Number"
                      value={selectedDevice.deviceSerial}
                    />
                    <DetailItem
                      icon={<ComputerIcon color="primary" />}
                      label="Device Model"
                      value={selectedDevice.deviceModel}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<WifiIcon color="primary" />}
                      label="IP Address"
                      value={selectedDevice.ipAddress}
                    />
                    <DetailItem
                      icon={<LocationIcon color="primary" />}
                      label="Location"
                      value={selectedDevice.location}
                    />
                    <DetailItem
                      icon={<SettingsIcon color="primary" />}
                      label="Machine Type"
                      value={selectedDevice.machineType}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Configuration */}
            <Grid size={{ xs: 12 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                Configuration
              </div>
              <Paper variant="outlined" sx={{ p: 2 }} className="bg-white">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<SyncIcon color="primary" />}
                      label="Sync Frequency"
                      value={`${selectedDevice.syncFrequency} minutes`}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<SettingsIcon color="primary" />}
                      label="Machine Setup"
                      value={selectedDevice.machineSetUp}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sync Information */}
            <Grid size={{ xs: 12 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                Sync Information
              </div>
              <Paper variant="outlined" sx={{ p: 2 }} className="bg-white">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<SyncIcon color="primary" />}
                      label="Last Sync"
                      value={new Date(
                        selectedDevice.lastSyncAt,
                      ).toLocaleString()}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<ScheduleIcon color="primary" />}
                      label="Last Punch"
                      value={new Date(
                        selectedDevice.lastPunchAt,
                      ).toLocaleString()}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* System Information */}
            <Grid size={{ xs: 12 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                System Information
              </div>
              <Paper variant="outlined" sx={{ p: 2 }} className="bg-white">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<ScheduleIcon color="primary" />}
                      label="Created At"
                      value={new Date(
                        selectedDevice.createdAt,
                      ).toLocaleString()}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DetailItem
                      icon={<ScheduleIcon color="primary" />}
                      label="Last Updated"
                      value={new Date(
                        selectedDevice.updatedAt,
                      ).toLocaleString()}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            {/* Active Syncs */}
            {Object.values(activeSyncs).filter(
              (s) => s.deviceId === selectedDevice.id,
            ).length > 0 && (
              <Grid size={{ xs: 12 }}>
                <div className="mb-2 text-[12px] text-gray-800">
                  Active Syncs
                </div>
                <Paper variant="outlined" sx={{ p: 2 }} className="bg-white">
                  {Object.values(activeSyncs)
                    .filter((s) => s.deviceId === selectedDevice.id)
                    .map((sync) => (
                      <Box key={sync.id} sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption">
                            {new Date(sync.startDate).toLocaleString()} -{" "}
                            {new Date(sync.endDate).toLocaleString()}
                          </Typography>
                          <Chip
                            size="small"
                            label={sync.status}
                            color={
                              sync.status === "completed"
                                ? "success"
                                : sync.status === "failed"
                                  ? "error"
                                  : sync.status === "processing"
                                    ? "warning"
                                    : "default"
                            }
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            sync.status === "completed"
                              ? 100
                              : sync.status === "processing"
                                ? 60
                                : sync.status === "failed"
                                  ? 0
                                  : 0
                          }
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {sync.punchesApplied}/{sync.punchesReceived} punches
                          applied
                        </Typography>
                      </Box>
                    ))}
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            onClick={handleCloseDetails}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Close
          </Button>
          <Button
            onClick={() => handleCheckDeviceHealth(selectedDevice)}
            variant="outlined"
            className="!text-primary !border-primary"
            disabled={healthLoading === selectedDevice.id}
            startIcon={
              healthLoading === selectedDevice.id ? (
                <CircularProgress size={16} />
              ) : (
                <HealthAndSafetyOutlined />
              )
            }
          >
            Check Health
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="!bg-primary"
            onClick={() => {
              handleCloseDetails();
              handleOpenEditDialog(selectedDevice);
            }}
          >
            Edit Device
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderSyncDialog = () => (
    <Dialog
      open={openSyncDialog}
      onClose={handleCloseSyncDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-2">
        <div className="ml-4">Initiate Manual Sync</div>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Select device and date range to sync attendance data
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            select
                            label="Device"
                            value={syncFormData.deviceId}
                            onChange={handleSyncFormChange('deviceId')}
                            error={!!syncErrors.deviceId}
                            helperText={syncErrors.deviceId}
                            required
                        >
                            {devices.map((device) => (
                                <MenuItem key={device.id} value={device.id}>
                                    {device.deviceName} ({device.deviceSerial})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Start Date"
                            value={syncFormData.startDate}
                            onChange={handleSyncFormChange('startDate')}
                            error={!!syncErrors.startDate}
                            helperText={syncErrors.startDate}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="End Date"
                            value={syncFormData.endDate}
                            onChange={handleSyncFormChange('endDate')}
                            error={!!syncErrors.endDate}
                            helperText={syncErrors.endDate}
                            required
                        />
                    </Grid> */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Device"
                  value={syncFormData.deviceId}
                  onChange={handleSyncFormChange("deviceId")}
                  error={!!syncErrors.deviceId}
                  helperText={syncErrors.deviceId}
                  required
                >
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.deviceName} ({device.deviceSerial})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DateTimePicker
                  label="Start Date"
                  value={
                    syncFormData.startDate
                      ? dayjs(syncFormData.startDate)
                      : null
                  }
                  onChange={(newValue) => {
                    setSyncFormData({
                      ...syncFormData,
                      startDate: newValue ? newValue.toISOString() : "",
                    });
                    if (syncErrors.startDate) {
                      setSyncErrors({ ...syncErrors, startDate: "" });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!syncErrors.startDate,
                      helperText: syncErrors.startDate,
                      required: true,
                    },
                  }}
                  format="YYYY-MM-DD HH:mm"
                  ampm={false}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DateTimePicker
                  label="End Date"
                  value={
                    syncFormData.endDate ? dayjs(syncFormData.endDate) : null
                  }
                  onChange={(newValue) => {
                    setSyncFormData({
                      ...syncFormData,
                      endDate: newValue ? newValue.toISOString() : "",
                    });
                    if (syncErrors.endDate) {
                      setSyncErrors({ ...syncErrors, endDate: "" });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!syncErrors.endDate,
                      helperText: syncErrors.endDate,
                      required: true,
                    },
                  }}
                  format="YYYY-MM-DD HH:mm"
                  ampm={false}
                  minDateTime={
                    syncFormData.startDate
                      ? dayjs(syncFormData.startDate)
                      : undefined
                  }
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Grid>
      </DialogContent>
      <DialogActions className="!border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseSyncDialog}
          disabled={syncLoading}
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleInitiateSync}
          variant="contained"
          disabled={syncLoading}
          className="!bg-primary"
          startIcon={
            syncLoading ? (
              <CircularProgress size={20} />
            ) : (
              <PlayForWorkOutlined />
            )
          }
        >
          {syncLoading ? "Starting..." : "Start Sync"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================
  const stats = {
    total: devices.length,
    active: devices.filter((d) => d.isActive).length,
    inactive: devices.filter((d) => !d.isActive).length,
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <div>
          <div className="text-[12px] text-gray-800">Device Management</div>
          <span className="text-[10px] text-gray-500">
            Manage and monitor all biometric devices
          </span>
        </div>
        <Box>
          <Button
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-white-50">
            <CardContent className="!text-gray-800">
              <div className="mb-1 text-[12px]">Total Devices</div>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-white-50">
            <CardContent className="!text-gray-800">
              <div className="mb-1 text-[12px]">Active Devices</div>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card className="bg-white-50">
            <CardContent className="!text-gray-800">
              <div className="mb-1 text-[12px]">Inactive Devices</div>
              <Typography variant="h4" color="error.main">
                {stats.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Devices Table */}
      <TableContainer className="border border-gray-200 rounded-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">S No</TableCell>
              <TableCell className="!font-bold">Device Name</TableCell>
              <TableCell className="!font-bold">Serial Number</TableCell>
              <TableCell className="!font-bold">Model</TableCell>
              <TableCell className="!font-bold">IP Address</TableCell>
              <TableCell className="!font-bold">Location</TableCell>
              <TableCell className="!font-bold">Health</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold">Last Sync</TableCell>
              <TableCell className="!font-bold" align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3 }}>
                    No devices found. Click "Add Device" to register a new
                    device.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              devices
                // .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((device, i) => (
                  <TableRow key={device.id} sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ComputerIcon className="mr-1 text-primary" />
                        <Typography variant="body2">
                          {device.deviceName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{device.deviceSerial}</TableCell>
                    <TableCell>{device.deviceModel}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <WifiIcon sx={{ mr: 1, fontSize: 16 }} />
                        {device.ipAddress}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                        {device.location}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Click to check health">
                        <IconButton
                          size="small"
                          onClick={() => handleCheckDeviceHealth(device)}
                          disabled={healthLoading === device.id}
                        >
                          {healthLoading === device.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Badge
                              color={
                                deviceHealth[device.id]?.status === "online"
                                  ? "success"
                                  : deviceHealth[device.id]?.status ===
                                      "offline"
                                    ? "error"
                                    : "warning"
                              }
                              variant="dot"
                            >
                              <HealthAndSafetyOutlined />
                            </Badge>
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.isActive ? "Active" : "Inactive"}
                        color={device.isActive ? "success" : "error"}
                        size="small"
                        icon={
                          device.isActive ? <CheckCircleIcon /> : <CancelIcon />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {/* {new Date(device.lastSyncAt).toLocaleString()} */}
                      {formatDateTime(device.lastSyncAt)}
                    </TableCell>
                    <TableCell align="center">
                      {/* <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenDetailsDialog(device)}
                          >
                            <VisibilityOutlined className="!text-primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditDialog(device)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={device.isActive ? "Deactivate" : "Activate"}
                        >
                          <IconButton
                            size="small"
                            color={device.isActive ? "error" : "success"}
                            onClick={() => handleToggleDeviceStatus(device)}
                          >
                            {device.isActive ? (
                              <CancelIcon />
                            ) : (
                              <CheckCircleIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSyncFormData({
                                deviceId: device.id,
                                startDate: "",
                                endDate: "",
                              });
                              setOpenSyncDialog(true);
                            }}
                          >
                            <SyncIcon />
                          </IconButton>
                        </Tooltip>
                      </Box> */}
                       <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenDetailsDialog(device)}
                          >
                            <VisibilityOutlined className="!text-primary" />
                          </IconButton>
                        </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                            handleMenuOpen(e, device.id);
                            setSelectedMenuDevice(device)
                        }}
                      >
                        <MoreVertOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        {/* <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={devices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        /> */}
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {/* <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleOpenDetailsDialog(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" className="!text-primary" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem> */}

         <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              setSyncFormData({
                deviceId: selectedMenuDevice.id,
                startDate: "",
                endDate: "",
              });
              setOpenSyncDialog(true);
            }
          }}
        >
          <ListItemIcon>
            <SyncIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Sync</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleOpenEditDialog(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleToggleDeviceStatus(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            {selectedMenuDevice?.isActive ? (
              <CancelIcon fontSize="small" color="error" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedMenuDevice?.isActive ? "Deactivate" : "Activate"}
          </ListItemText>
        </MenuItem>

       
      </Menu>

      {/* Dialogs */}
      {renderDeviceForm()}
      {renderSyncDialog()}
      {renderDeviceDetails()}
    </Box>
  );
};

export default DeviceManagement;
