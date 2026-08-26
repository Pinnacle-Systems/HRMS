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
  Checkbox,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Computer as ComputerIcon,
  Wifi as WifiIcon,
  Sync as SyncIcon,
  Schedule as ScheduleIcon,
  VisibilityOutlined,
  PlayForWorkOutlined,
  HealthAndSafetyOutlined,
  MoreVertOutlined,
  Person as PersonIcon,
  Send as SendIcon,
  CloseOutlined,
  NumbersOutlined,
  ModelTrainingOutlined,
  LocationOnOutlined,
  SettingsOutlined,
  EditOutlined,
  Add,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import {
  biometricService,
  type BiometricDevice,
  type CreateDeviceRequest,
  type DeviceHealth,
  type FetchLogQuery,
  type SyncStatus,
} from "../../../services/modules/biometricDevice";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { useUI } from "../../../context/Snackbar";
import { getRowColor, handleEnterAsTab } from "../../const";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { formatDateTime } from "../../../utils/dateFormatter";

// ==================== MAIN COMPONENT ====================
export const DeviceManagement: React.FC = () => {
  const { showSnackbar, hideSpinner, showSpinner, showConfirmDialog } = useUI();

  // State
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Form State
  const [formData, setFormData] = useState<CreateDeviceRequest>({
    deviceName: "",
    deviceSerial: "",
    deviceModel: "",
    ipAddress: "",
    location: "",
    port: 4370,
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
  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingFormData, setMappingFormData] = useState({
    deviceId: "",
    deviceEmployeeCode: "",
    hrmsEmployeeId: "",
    isActive: true,
  });
  const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({});
  const [selectedMappingEmployee, setSelectedMappingEmployee] = useState<any>(null);
  const [openWebhookDialog, setOpenWebhookDialog] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookFormData, setWebhookFormData] = useState({
    deviceSerial: "",
    employeeCode: "",
    punchTime: dayjs().toISOString(),
    punchType: "check_in" as "check_in" | "check_out" | "break_in" | "break_out",
    verificationMode: "fingerprint" as "fingerprint" | "card" | "face" | "pin",
  });
  const [webhookErrors, setWebhookErrors] = useState<Record<string, string>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});
  const [activeSyncs, setActiveSyncs] = useState<Record<string, SyncStatus>>(
    {},
  );

  // Bulk Mapping State
  const [openBulkMapDialog, setOpenBulkMapDialog] = useState(false);
  const [bulkMappings, setBulkMappings] = useState<Array<{
    id: string;
    deviceId: string;
    deviceEmployeeCode: string;
    hrmsEmployeeId: string;
    hrmsEmployeeName: string;
    hrmsEmployeeCode: string;
    hrmsEmployee: any | null;
    isActive: boolean;
    status: 'pending' | 'success' | 'error';
    errorMessage?: string;
  }>>([]);
  const [bulkMappingLoading, setBulkMappingLoading] = useState(false);
  const [bulkMappingErrors, setBulkMappingErrors] = useState<{
    [key: string]: string;
  }>({});
  const [selectedDeviceForBulk, setSelectedDeviceForBulk] = useState('');
  const [bulkMappingResults, setBulkMappingResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: any[];
    mappings: any[];
  } | null>(null);
  // const [bulkSelectedEmployee, setBulkSelectedEmployee] = useState<any>(null);

  const machineTypes = ["IN", "OUT", "IN / OUT"];
  const machineSetups = ["Single", "Separate"];
  const syncFrequencies = [1, 5, 10, 15, 30, 60];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [_selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedMenuDevice, setSelectedMenuDevice] = useState<BiometricDevice | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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
    }, 10000);

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

  // ==================== BULK MAPPING HANDLERS ====================
  const addBulkMappingRow = () => {
    const newMapping = {
      id: `temp_${Date.now()}_${Math.random()}`,
      deviceId: selectedDeviceForBulk || '',
      deviceEmployeeCode: '',
      hrmsEmployeeId: '',
      hrmsEmployeeName: '',
      hrmsEmployeeCode: '',
      hrmsEmployee: null,
      isActive: true,
      status: 'pending' as const,
    };
    setBulkMappings([...bulkMappings, newMapping]);
  };

  const removeBulkMappingRow = (id: string) => {
    setBulkMappings(bulkMappings.filter(m => m.id !== id));
  };

  const handleBulkMappingChange = (id: string, field: string, value: any) => {
    setBulkMappings(bulkMappings.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleBulkEmployeeSelect = (employee: any, mappingId: string) => {
    setBulkMappings(bulkMappings.map(m =>
      m.id === mappingId ? {
        ...m,
        hrmsEmployeeId: employee?.id || '',
        hrmsEmployeeName: employee?.name || employee?.employeeName || '',
        hrmsEmployeeCode: employee?.employeeId || employee?.employeeCode || '',
        hrmsEmployee: employee,
      } : m
    ));
  };

  const resetBulkMappingDialog = () => {
    setBulkMappings([]);
    setBulkMappingErrors({});
    setBulkMappingResults(null);
    setSelectedDeviceForBulk('');
    // setBulkSelectedEmployee(null);
    setOpenBulkMapDialog(false);
  };

  const handleBulkSaveMapping = async () => {
    const errors: { [key: string]: string } = {};
    let hasError = false;

    bulkMappings.forEach((mapping, index) => {
      if (!mapping.deviceId) {
        errors[`mapping_${index}_deviceId`] = 'Device is required';
        hasError = true;
      }
      if (!mapping.deviceEmployeeCode) {
        errors[`mapping_${index}_deviceEmployeeCode`] = 'Device employee code is required';
        hasError = true;
      }
      if (!mapping.hrmsEmployeeId) {
        errors[`mapping_${index}_hrmsEmployeeId`] = 'HRMS employee is required';
        hasError = true;
      }
    });

    if (hasError) {
      setBulkMappingErrors(errors);
      showSnackbar('Please fix all errors before saving', 'warning');
      return;
    }

    setBulkMappingLoading(true);
    showSpinner();

    try {
      const mappingsPayload = bulkMappings.map(m => ({
        deviceId: m.deviceId,
        deviceEmployeeCode: m.deviceEmployeeCode,
        hrmsEmployeeId: m.hrmsEmployeeId,
        isActive: m.isActive
      }));

      const payload: any = {
        mappings: mappingsPayload
      }
      const response: any = await biometricService.mapEmployeeToDevice(payload);

      const responseData = response?.data || response || {};
      const mappings = responseData.mappings || [];
      const total = responseData.total || mappings.length || 0;
      const successful = responseData.successful || 0;
      const failed = responseData.failed || 0;
      const errors = responseData.errors || [];

      setBulkMappings(prev => prev.map(m => {
        const result = mappings.find(
          (r: any) => r.hrmsEmployeeId === m.hrmsEmployeeId
        );
        if (result) {
          return {
            ...m,
            status: result.status === 'success' ? 'success' : 'error',
            errorMessage: result.error || (result.status === 'failed' ? 'Mapping failed' : undefined)
          };
        }
        return m;
      }));

      setBulkMappingResults({
        total: total,
        successful: successful,
        failed: failed,
        errors: errors,
        mappings: mappings
      });

      if (failed > 0 && successful > 0) {
        showSnackbar(
          `Saved ${successful} mappings with ${failed} errors`,
          'warning'
        );
      } else if (failed > 0 && successful === 0) {
        showSnackbar(
          `All ${total} mappings failed to save`,
          'error'
        );
      } else if (successful > 0) {
        showSnackbar(`Successfully saved ${successful} mappings`, 'success');
      } else {
        showSnackbar('No mappings were saved', 'info');
      }

      if (failed === 0 && successful > 0) {
        setTimeout(() => {
          resetBulkMappingDialog();
          fetchDevices();
        }, 2000);
      }
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to save mappings', 'error');
    } finally {
      setBulkMappingLoading(false);
      hideSpinner();
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
      port: 4370,
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
      port: device.port || 4370,
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

  const handleCloseSyncDialog = () => {
    setOpenSyncDialog(false);
    setSyncErrors({});
  };

  // const handleOpenMapDialog = (device: BiometricDevice) => {
  //   setMappingFormData({
  //     deviceId: device.id,
  //     deviceEmployeeCode: "",
  //     hrmsEmployeeId: "",
  //     isActive: true,
  //   });
  //   setSelectedMappingEmployee(null);
  //   setMappingErrors({});
  //   setOpenMapDialog(true);
  // };

  const handleCloseMapDialog = () => {
    setOpenMapDialog(false);
    setMappingErrors({});
    setSelectedMappingEmployee(null);
  };

  // const handleOpenWebhookDialog = (device: BiometricDevice) => {
  //   setWebhookFormData({
  //     deviceSerial: device.deviceSerial || "",
  //     employeeCode: "",
  //     punchTime: dayjs().toISOString(),
  //     punchType: "check_in",
  //     verificationMode: "fingerprint",
  //   });
  //   setWebhookErrors({});
  //   setOpenWebhookDialog(true);
  // };

  const handleCloseWebhookDialog = () => {
    setOpenWebhookDialog(false);
    setWebhookErrors({});
  };

  const handleWebhookFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setWebhookFormData({ ...webhookFormData, [field]: event.target.value });
      if (webhookErrors[field]) {
        setWebhookErrors({ ...webhookErrors, [field]: "" });
      }
    };

  const validateWebhookForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!webhookFormData.deviceSerial.trim()) {
      errors.deviceSerial = "Device serial is required";
    }
    if (!webhookFormData.employeeCode.trim()) {
      errors.employeeCode = "Employee code is required";
    }
    if (!webhookFormData.punchTime) {
      errors.punchTime = "Punch time is required";
    }

    setWebhookErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProcessWebhook = async () => {
    if (!validateWebhookForm()) return;

    setWebhookLoading(true);
    try {
      const response = await biometricService.processWebhookPunch(webhookFormData);
      showSnackbar(
        response?.message || "Webhook processed successfully",
        response?.accepted ? "success" : "warning",
      );
      handleCloseWebhookDialog();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to process webhook", "error");
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleMappingFormChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setMappingFormData({ ...mappingFormData, [field]: value });
      if (mappingErrors[field]) {
        setMappingErrors({ ...mappingErrors, [field]: "" });
      }
    };

  const validateMappingForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!mappingFormData.deviceId) errors.deviceId = "Device is required";
    if (!mappingFormData.deviceEmployeeCode.trim()) {
      errors.deviceEmployeeCode = "Device employee code is required";
    }
    if (!mappingFormData.hrmsEmployeeId) {
      errors.hrmsEmployeeId = "HRMS employee is required";
    }

    setMappingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMapping = async () => {
    if (!validateMappingForm()) return;

    setMappingLoading(true);
    try {
      await biometricService.mapEmployeeToDevice(mappingFormData);
      showSnackbar("Employee mapping saved successfully", "success");
      handleCloseMapDialog();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to save employee mapping", "error");
    } finally {
      setMappingLoading(false);
    }
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

      setActiveSyncs((prev) => ({
        ...prev,
        [syncId]: status,
      }));

      if (status.status === "completed" || status.status === "failed") {
        showSnackbar(
          status.status === "completed"
            ? `Sync completed: ${status.punchesApplied} punches applied`
            : `Sync failed: ${status.message}`,
          status.status === "completed" ? "success" : "error",
        );

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

      setActiveSyncs((prev) => ({
        ...prev,
        [result.id]: result,
      }));

      showSnackbar("Sync initiated successfully", "success");
      handleCloseSyncDialog();
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
    showSpinner();
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
      hideSpinner();
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

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(d => d.id));
    }
    setSelectAll(!selectAll);
  };

  const fetchLogs = async () => {
    if (!fromDate || !toDate) {
      showSnackbar("Please select both From Date and To Date", "warning");
      return;
    }

    if (selectedDevices.length === 0) {
      showSnackbar("Please select at least one device", "warning");
      return;
    }

    try {
      const selectedDevicesData = devices.filter(d => selectedDevices.includes(d.id));
      const deviceIpsWithPorts = selectedDevicesData.map(device =>
        `${device.ipAddress}:${device.port || 4370}`
      );
      const params: FetchLogQuery = {
        from_date: fromDate,
        to_date: toDate,
        deviceIps: deviceIpsWithPorts,
      };
      const result: any = await biometricService.fetchLogs(params);
      const punchesData = result || [];
      showSnackbar(
        `Successfully fetched ${punchesData.length} logs from ${selectedDevices.length} device(s)`,
        "success"
      );
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to fetch logs from devices", "error");
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  // Bulk Mapping Dialog
  const renderBulkMapDialog = () => (
    <Dialog
      open={openBulkMapDialog}
      onClose={resetBulkMappingDialog}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-4">
            <span className="text-[12px]">Bulk Map Device Employees</span>
            <Chip
              label={`${bulkMappings.length} mappings`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </div>
          <IconButton size="small" onClick={resetBulkMappingDialog}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className="!p-4">
        <Typography variant="body2" className="text-gray-500" sx={{ mb: 3 }}>
          Link multiple device employee codes (MID) to HRMS employees before syncing punches.
          Add all mappings and save them in bulk.
        </Typography>
       
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Default Device</InputLabel>
            <Select
              value={selectedDeviceForBulk}
              label="Default Device"
              onChange={(e) => {
                const deviceId = e.target.value;
                setSelectedDeviceForBulk(deviceId);
                setBulkMappings(bulkMappings.map(m => ({
                  ...m,
                  deviceId: deviceId
                })));
              }}
            >
              <MenuItem value="">Select Device</MenuItem>
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.deviceName} ({device.deviceSerial})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<Add />}
            onClick={addBulkMappingRow}
            disabled={bulkMappingLoading}
          >
            Add Mapping
          </Button>

          {bulkMappings.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                showConfirmDialog({
                  title: 'Clear All Mappings',
                  message: 'Are you sure you want to clear all mappings?',
                  confirmText: 'Clear All',
                  onConfirm: () => setBulkMappings([]),
                });
              }}
              disabled={bulkMappingLoading}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Mappings Table */}
        {bulkMappings.length > 0 ? (
          <TableContainer className="border border-gray-200 bg-white-50">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold" style={{ width: '30px' }}>#</TableCell>
                  <TableCell className="!font-semibold" style={{ minWidth: '100px' }}>
                    Device Employee Code (MID)
                  </TableCell>
                  <TableCell className="!font-semibold" style={{ minWidth: '100px' }}>
                    HRMS Employee (Employee ID)
                  </TableCell>
                  {/* <TableCell className="!font-semibold" style={{ width: '120px' }}>
                    Status
                  </TableCell> */}
                  <TableCell className="!font-semibold" style={{ width: '80px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkMappings.map((mapping, index) => (
                  <TableRow key={mapping.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        className="!py-2"
                        placeholder="e.g., 1000"
                        value={mapping.deviceEmployeeCode}
                        onChange={(e) => handleBulkMappingChange(
                          mapping.id,
                          'deviceEmployeeCode',
                          e.target.value
                        )}
                        error={!!bulkMappingErrors[`mapping_${index}_deviceEmployeeCode`]}
                        helperText={bulkMappingErrors[`mapping_${index}_deviceEmployeeCode`]}
                        disabled={mapping.status === 'success' || bulkMappingLoading}
                      // sx={{ minWidth: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="!py-2">
                        <EmployeeSelector
                          value={mapping.hrmsEmployee || null}
                          onChange={(employee: any) => {
                            handleBulkEmployeeSelect(employee, mapping.id);
                            if (bulkMappingErrors[`mapping_${index}_hrmsEmployeeId`]) {
                              const newErrors = { ...bulkMappingErrors };
                              delete newErrors[`mapping_${index}_hrmsEmployeeId`];
                              setBulkMappingErrors(newErrors);
                            }
                          }}
                          placeholder="Search employee by name or code"
                        />
                      </div>
                      {bulkMappingErrors[`mapping_${index}_hrmsEmployeeId`] && (
                        <Typography variant="caption" color="error">
                          {bulkMappingErrors[`mapping_${index}_hrmsEmployeeId`]}
                        </Typography>
                      )}
                    </TableCell>
                    {/* <TableCell>
                      {mapping.status === 'pending' && (
                        <Chip label="Pending" size="small" color="warning" />
                      )}
                      {mapping.status === 'success' && (
                        <Chip label="Success" size="small" color="success" icon={<CheckCircleOutlined />} />
                      )}
                      {mapping.status === 'error' && (
                        <Chip label="Error" size="small" color="error" icon={<ErrorOutlined />} />
                      )}
                    </TableCell> */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip title="Delete mapping">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeBulkMappingRow(mapping.id)}
                            disabled={mapping.status === 'success' || bulkMappingLoading}
                          >
                            <CloseOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Typography variant="body2" className="text-gray-500">
              No mappings added yet. Click <strong>"Add Mapping"</strong> to start adding mappings.
            </Typography>
          </div>
        )}

         {/* Results Summary */}
        {bulkMappingResults && (
          <div
            // severity={bulkMappingResults.failed > 0 ? "warning" : "success"}
            className="mt-4 bg-green-100 p-2 px-4 text-green-800 rounded-md"
            // icon={bulkMappingResults.failed > 0 ? <WarningAmberOutlined /> : <CheckCircleOutlined />}
          >
            <div className="flex items-center justify-between text-[12px]">
              <span>
                <strong>{bulkMappingResults.successful}</strong> successful
                {bulkMappingResults.failed > 0 && (
                  <span className="ml-2">
                    <strong className="text-red-600">{bulkMappingResults.failed}</strong> failed
                  </span>
                )}
              </span>
              <Button
                size="small"
                variant="outlined"
                className="!text-primary !border-primary"
                onClick={() => setBulkMappingResults(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}


        {/* Error Summary */}
        {bulkMappingResults && bulkMappingResults.errors.length > 0 && (
          <Alert severity="error" className="mt-4">
            <div className="max-h-[100px] overflow-y-auto">
              {bulkMappingResults.errors.map((error, index) => (
                <div key={index} className="text-xs py-0.5">
                  • {error.deviceEmployeeCode}: {error.error}
                </div>
              ))}
            </div>
          </Alert>
        )}
      </DialogContent>

      <DialogActions className="!border-t border-gray-200 !p-3">
        <Button
          onClick={resetBulkMappingDialog}
          disabled={bulkMappingLoading}
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleBulkSaveMapping}
          variant="contained"
          disabled={bulkMappingLoading || bulkMappings.length === 0}
          className="!bg-primary"
          startIcon={bulkMappingLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {bulkMappingLoading
            ? 'Saving...'
            : `Save ${bulkMappings.filter(m => m.status !== 'success').length} Mappings`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeviceForm = () => (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-2 flex justify-between items-center">
        <div className="ml-4">
          {dialogMode === "add" ? "Register New Device" : "Edit Device"}
        </div>
        <IconButton onClick={handleCloseDialog}>
          <CloseOutlined className="text-gray-800" />
        </IconButton>
      </DialogTitle>
      <DialogContent className="!p-4" onKeyDown={handleEnterAsTab}>
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
              disabled={dialogMode === "edit"}
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
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Port"
              value={formData.port}
              onChange={handleFormChange("port")}
              error={!!formErrors.port}
              helperText={formErrors.port}
              required
              placeholder="Enter port "
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
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
          <div className="text-[12px] text-gray-500 mb-1">{label}</div>
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
                size="small"
              />
            </Box>
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailItem
                      icon={<ComputerIcon color="primary" />}
                      label="Device Name"
                      value={selectedDevice.deviceName}
                    />
                    <DetailItem
                      icon={<NumbersOutlined color="primary" />}
                      label="Serial Number"
                      value={selectedDevice.deviceSerial}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailItem
                      icon={<ModelTrainingOutlined color="primary" />}
                      label="Device Model"
                      value={selectedDevice.deviceModel}
                    />
                    <DetailItem
                      icon={<WifiIcon color="primary" />}
                      label="IP Address"
                      value={selectedDevice.ipAddress}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DetailItem
                      icon={<LocationOnOutlined color="primary" />}
                      label="Location"
                      value={selectedDevice.location}
                    />
                    <DetailItem
                      icon={<SettingsOutlined color="primary" />}
                      label="Machine Type"
                      value={selectedDevice.machineType}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Configuration */}
            <Grid size={{ xs: 6 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                Configuration
              </div>
              <Paper variant="outlined" sx={{ p: 1 }} className="bg-white">
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
                      icon={<SettingsOutlined color="primary" />}
                      label="Machine Setup"
                      value={selectedDevice.machineSetUp}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sync Information */}
            <Grid size={{ xs: 6 }}>
              <div className="mb-2 text-[12px] text-gray-800">
                Sync Information
              </div>
              <Paper variant="outlined" sx={{ p: 1 }} className="bg-white">
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
              <Paper variant="outlined" sx={{ p: 1 }} className="bg-white">
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
                          <Typography variant="caption" className="text-gray-500">
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

  const renderMapDialog = () => (
    <Dialog
      open={openMapDialog}
      onClose={handleCloseMapDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-2">
        <div className="ml-4">Map Device Employee</div>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Typography variant="body2" className="text-gray-500" sx={{ mb: 2 }}>
          Link the device employee code to the correct HRMS employee before syncing punches.
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              select
              label="Device"
              value={mappingFormData.deviceId}
              onChange={handleMappingFormChange("deviceId")}
              error={!!mappingErrors.deviceId}
              helperText={mappingErrors.deviceId}
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
              label="Device Employee Code"
              value={mappingFormData.deviceEmployeeCode}
              onChange={handleMappingFormChange("deviceEmployeeCode")}
              error={!!mappingErrors.deviceEmployeeCode}
              helperText={mappingErrors.deviceEmployeeCode}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <EmployeeSelector
              value={selectedMappingEmployee}
              onChange={(employee: any) => {
                setSelectedMappingEmployee(employee);
                setMappingFormData({
                  ...mappingFormData,
                  hrmsEmployeeId: employee?.id || "",
                });
                if (mappingErrors.hrmsEmployeeId) {
                  setMappingErrors({ ...mappingErrors, hrmsEmployeeId: "" });
                }
              }}
              label="HRMS Employee"
              placeholder="Search employee"
            />
            {mappingErrors.hrmsEmployeeId && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {mappingErrors.hrmsEmployeeId}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mappingFormData.isActive}
                  onChange={handleMappingFormChange("isActive")}
                  color="primary"
                />
              }
              label="Active mapping"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="!border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseMapDialog}
          disabled={mappingLoading}
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveMapping}
          variant="contained"
          disabled={mappingLoading}
          className="!bg-primary"
          startIcon={mappingLoading ? <CircularProgress size={20} /> : null}
        >
          {mappingLoading ? "Saving..." : "Save Mapping"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderWebhookDialog = () => (
    <Dialog
      open={openWebhookDialog}
      onClose={handleCloseWebhookDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="border-b !border-gray-200 !p-2">
        <div className="ml-4">Process Webhook Punch</div>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Typography variant="body2" className="text-gray-500" sx={{ mb: 2 }}>
          Send a biometric punch event to the HRMS webhook endpoint for processing.
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Device Serial"
              value={webhookFormData.deviceSerial}
              onChange={handleWebhookFormChange("deviceSerial")}
              error={!!webhookErrors.deviceSerial}
              helperText={webhookErrors.deviceSerial}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Employee Code"
              value={webhookFormData.employeeCode}
              onChange={handleWebhookFormChange("employeeCode")}
              error={!!webhookErrors.employeeCode}
              helperText={webhookErrors.employeeCode}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Punch Time"
              value={webhookFormData.punchTime}
              onChange={handleWebhookFormChange("punchTime")}
              error={!!webhookErrors.punchTime}
              helperText={webhookErrors.punchTime}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Punch Type"
              value={webhookFormData.punchType}
              onChange={handleWebhookFormChange("punchType")}
            >
              <MenuItem value="check_in">Check In</MenuItem>
              <MenuItem value="check_out">Check Out</MenuItem>
              <MenuItem value="break_in">Break In</MenuItem>
              <MenuItem value="break_out">Break Out</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Verification Mode"
              value={webhookFormData.verificationMode}
              onChange={handleWebhookFormChange("verificationMode")}
            >
              <MenuItem value="fingerprint">Fingerprint</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="face">Face</MenuItem>
              <MenuItem value="pin">PIN</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="!border-t border-gray-200 !p-4">
        <Button
          onClick={handleCloseWebhookDialog}
          disabled={webhookLoading}
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleProcessWebhook}
          variant="contained"
          disabled={webhookLoading}
          className="!bg-primary"
          startIcon={webhookLoading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {webhookLoading ? "Processing..." : "Send Webhook"}
        </Button>
      </DialogActions>
    </Dialog>
  );

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
        <Typography variant="body2" className="text-gray-500" sx={{ mb: 2 }}>
          Select device and date range to sync attendance data
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
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
            variant="outlined"
            className="!text-primary !border-primary"
            startIcon={<PersonIcon />}
            onClick={() => setOpenBulkMapDialog(true)}
            sx={{ mr: 2 }}
          >
            Bulk Map
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
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Card className="bg-white-50">
            <CardContent className="!text-gray-800">
              <div className="mb-1 text-[12px]">Total Devices</div>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Card className="bg-white-50">
            <CardContent className="!text-gray-800">
              <div className="mb-1 text-[12px]">Active Devices</div>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
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

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
        <Grid container spacing={2} sx={{ mb: 2 }} className="items-center">
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <DatePicker
              label="From Date"
              value={fromDate ? dayjs(fromDate) : null}
              onChange={(newValue) => setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
              slotProps={{
                textField: { fullWidth: true },
              }}
              format="YYYY-MM-DD"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <DatePicker
              label="To Date"
              value={toDate ? dayjs(toDate) : null}
              onChange={(newValue) => setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")}
              slotProps={{
                textField: { fullWidth: true },
              }}
              format="YYYY-MM-DD"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 6 }} className="flex items-center whitespace-nowrap justify-end gap-2">
            <Button
              variant="contained"
              color="success"
              onClick={() => fetchLogs()}
              disabled={selectedDevices.length === 0 || !fromDate || !toDate}
            >
              Fetch Logs ({selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''} selected)
            </Button>
          </Grid>
        </Grid>
      </LocalizationProvider>

      {/* Devices Table */}
      <TableContainer className="border border-gray-200 rounded-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold sticky left-0 z-30">
                <Checkbox
                  checked={selectAll}
                  indeterminate={selectedDevices.length > 0 && selectedDevices.length < devices.length}
                  onChange={handleSelectAll}
                />S No</TableCell>
              <TableCell className="!font-bold sticky left-[58px] z-30">Device Name</TableCell>
              <TableCell className="!font-bold">Serial Number</TableCell>
              <TableCell className="!font-bold">Model</TableCell>
              <TableCell className="!font-bold">IP Address</TableCell>
              <TableCell className="!font-bold">Port</TableCell>
              <TableCell className="!font-bold">Location</TableCell>
              <TableCell className="!font-bold">Health</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold">Last Sync</TableCell>
              <TableCell className="!font-bold sticky right-0 z-30" align="center">
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
              devices.map((device, i) => (
                <TableRow key={device.id} sx={getRowColor(i)}>
                  <TableCell className="sticky left-0 z-30 bg-inherit" >
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => handleSelectDevice(device.id)}
                    />
                    {i + 1}
                  </TableCell>
                  <TableCell className="sticky left-[58px] z-30 bg-inherit">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
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
                  <TableCell>{device.port}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationOnOutlined sx={{ mr: 1, fontSize: 16 }} />
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
                                : deviceHealth[device.id]?.status === "offline"
                                  ? "error"
                                  : "warning"
                            }
                            variant="dot"
                          >
                            <HealthAndSafetyOutlined className="!text-gray-500" />
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
                    />
                  </TableCell>
                  <TableCell>
                    {formatDateTime(device.lastSyncAt)}
                  </TableCell>
                  <TableCell align="center" className="sticky right-0 z-30 bg-inherit">
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
                      <MoreVertOutlined className="!text-gray-800" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleOpenEditDialog(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" color="primary" className="!w-4" />
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

        {/* <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleOpenMapDialog(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" className="!w-4 text-gray-500" />
          </ListItemIcon>
          <ListItemText>Map Employee</ListItemText>
        </MenuItem> */}

        {/* <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedMenuDevice) {
              handleOpenWebhookDialog(selectedMenuDevice);
            }
          }}
        >
          <ListItemIcon>
            <SendIcon fontSize="small" color="success" className="!w-4" />
          </ListItemIcon>
          <ListItemText>Process Webhook</ListItemText>
        </MenuItem> */}

        {/* <MenuItem
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
            <SyncIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Sync</ListItemText>
        </MenuItem> */}
      </Menu>

      {/* Dialogs */}
      {renderDeviceForm()}
      {renderMapDialog()}
      {renderWebhookDialog()}
      {renderSyncDialog()}
      {renderDeviceDetails()}
      {renderBulkMapDialog()}
    </Box>
  );
};

export default DeviceManagement;