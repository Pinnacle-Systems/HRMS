import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { useUI } from "../../context/Snackbar";
import { configService, type CreateWhatsAppConfigPayload, type WhatsAppConfig } from "../../services/modules/configs";
import { getRowColor } from "../const";

export function WhatsAppConfigurations() {
  const { showSnackbar, showConfirmDialog } = useUI();
  
  // State
  const [configs, setConfigs] = useState<WhatsAppConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WhatsAppConfig | null>(null);
  const [formData, setFormData] = useState<CreateWhatsAppConfigPayload>({
    name: "",
    provider: "",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    isDefault: false,
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load configurations
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await configService.getWhatsAppConfigs();
      if (response.success) {
        setConfigs(response.data || []);
      } else {
        showSnackbar(response.message || "Failed to load WhatsApp configs", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load WhatsApp configs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // Form handlers
  const handleOpenCreateDialog = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      provider: "",
      accountSid: "",
      authToken: "",
      fromNumber: "",
      isDefault: false,
      active: true,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (config: WhatsAppConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      provider: config.provider,
      accountSid: config.accountSid,
      authToken: "",
      fromNumber: config.fromNumber,
      isDefault: config.isDefault,
      active: config.active,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConfig(null);
    setFormErrors({});
  };

  const handleFormChange = (field:any) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData((prev:any) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.provider.trim()) errors.provider = "Provider is required";
    if (!formData.accountSid.trim()) errors.accountSid = "Account SID is required";
    if (!formData.authToken.trim() && !editingConfig) {
      errors.authToken = "Auth Token is required";
    }
    if (!formData.fromNumber.trim()) errors.fromNumber = "From Number is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD operations
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingConfig) {
        // Update existing config
        const response = await configService.updateWhatsAppConfig(
          editingConfig.id,
          formData
        );
        if (response.success) {
          showSnackbar("WhatsApp config updated successfully", "success");
          loadConfigs();
          handleCloseDialog();
        } else {
          showSnackbar(response.message || "Failed to update config", "error");
        }
      } else {
        // Create new config
        const response = await configService.createWhatsAppConfig(formData);
        if (response.success) {
          showSnackbar("WhatsApp config created successfully", "success");
          loadConfigs();
          handleCloseDialog();
        } else {
          showSnackbar(response.message || "Failed to create config", "error");
        }
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Delete WhatsApp Config",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const response = await configService.deleteWhatsAppConfig(id);
          if (response.success) {
            showSnackbar("WhatsApp config deleted successfully", "success");
            loadConfigs();
          } else {
            showSnackbar(response.message || "Failed to delete config", "error");
          }
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete config", "error");
        }
      },
    });
  };

  const handleSetDefault = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Set as Default",
      message: `Are you sure you want to set "${name}" as the default WhatsApp configuration?`,
      confirmText: "Set as Default",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const response = await configService.setDefaultWhatsAppConfig(id);
          if (response.success) {
            showSnackbar(`"${name}" set as default successfully`, "success");
            loadConfigs();
          } else {
            showSnackbar(response.message || "Failed to set default", "error");
          }
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to set default", "error");
        }
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* <WhatsAppIcon className="text-green-500 !w-6 !h-6" /> */}
            <div className="text-[12px]">WhatsApp Configurations</div>
          </div>
          <p className="text-[12px] text-gray-500 mt-1">
            Twilio WhatsApp Business configs: manage and set the default.
          </p>
        </div>
        <div className="flex gap-2">
         <IconButton>
            <RefreshIcon className="text-gray-500" onClick={loadConfigs}/>
          </IconButton>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Config
          </Button>
        </div>
      </div>

      {/* Configurations Table */}
      <Paper className="border border-gray-200 bg-white-50 rounded-lg overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-bold">S No</TableCell>
                <TableCell className="!font-bold">Name</TableCell>
                <TableCell className="!font-bold">Provider</TableCell>
                <TableCell className="!font-bold">From Number</TableCell>
                <TableCell className="!font-bold">Account SID</TableCell>
                <TableCell className="!font-bold">Status</TableCell>
                <TableCell className="!font-bold">Default</TableCell>
                <TableCell className="!font-bold" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-8">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" className="py-8">
                    <div className="py-8">
                      No WhatsApp configurations found. Click "Add Config" to create one.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config,index) => (
                  <TableRow key={config.id} sx={getRowColor(index)}>
                    <TableCell className="font-mono text-gray-600">{index+1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WhatsAppIcon className="text-green-500 !w-4 !h-4" />
                        <span className="font-medium text-gray-800">{config.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.provider}
                        size="small"
                        className="!bg-blue-100 !text-blue-700 !font-medium"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-gray-600">{config.fromNumber}</TableCell>
                    <TableCell className="font-mono text-gray-500 text-sm">
                      {config.accountSid.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.active ? "Active" : "Inactive"}
                        size="small"
                        icon={config.active ? <CheckCircleIcon className="!w-3 !h-3" /> : <CancelIcon className="!w-3 !h-3" />}
                        color={config.active ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>
                      {config.isDefault ? (
                        <Chip
                          label="Default"
                          size="small"
                          icon={<StarIcon className="!w-3 !h-3" />}
                          className="!bg-amber-100 !text-amber-700"
                        />
                      ) : (
                        <Chip
                          label="Set Default"
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetDefault(config.id, config.name)}
                          className="cursor-pointer hover:!bg-gray-100"
                          icon={<StarBorderIcon className="!w-3 !h-3" />}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(config)}
                            className="!text-primary"
                          >
                            <EditIcon fontSize="small" className="!w-4 text-blue-500"/>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(config.id, config.name)}
                          >
                            <DeleteIcon fontSize="small" className="!w-4"/>
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="border-b border-gray-200 !p-4">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="text-green-500" />
            <span className="text-[12px]">
              {editingConfig ? "Edit WhatsApp Config" : "Create WhatsApp Config"}
            </span>
          </div>
        </DialogTitle>
        <DialogContent className="!p-4">
          <Grid container spacing={3} className="mt-2">
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Config Name"
                value={formData.name}
                onChange={handleFormChange("name")}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Provider"
                value={formData.provider}
                onChange={handleFormChange("provider")}
                error={!!formErrors.provider}
                helperText={formErrors.provider}
                placeholder="e.g., twilio, meta, etc."
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Account SID"
                value={formData.accountSid}
                onChange={handleFormChange("accountSid")}
                error={!!formErrors.accountSid}
                helperText={formErrors.accountSid}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Auth Token"
                type="password"
                value={formData.authToken}
                onChange={handleFormChange("authToken")}
                error={!!formErrors.authToken}
                helperText={editingConfig ? "Leave blank to keep existing" : formErrors.authToken}
                required={!editingConfig}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="From Number"
                value={formData.fromNumber}
                onChange={handleFormChange("fromNumber")}
                error={!!formErrors.fromNumber}
                helperText={formErrors.fromNumber}
                placeholder="e.g., +1234567890"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <div className="flex items-center gap-6">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isDefault}
                      onChange={handleFormChange("isDefault")}
                      color="primary"
                    />
                  }
                  label="Set as Default"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={handleFormChange("active")}
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </div>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            className="!border-gray-200 !text-gray-800"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {editingConfig ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}