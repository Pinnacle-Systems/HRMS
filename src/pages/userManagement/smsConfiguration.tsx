import { useEffect, useState } from "react";
import {
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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
    Divider,
    LinearProgress,
    type SelectChangeEvent,
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
    Sms as SmsIcon,
    Send as SendIcon,
    SmsOutlined,
} from "@mui/icons-material";
import { useUI } from "../../context/Snackbar";
import { type SMSConfig, type CreateSMSConfigPayload, type TestSMSPayload, configService } from "../../services/modules/configs";
import { getRowColor } from "../const";

export function SMSConfigurations() {
    const { showSnackbar, showConfirmDialog } = useUI();

    // State
    const [configs, setConfigs] = useState<SMSConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingConfig, setEditingConfig] = useState<SMSConfig | null>(null);
    const [openTestDialog, setOpenTestDialog] = useState(false);
    const [testingConfig, setTestingConfig] = useState<SMSConfig | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const [formData, setFormData] = useState<CreateSMSConfigPayload>({
        name: "",
        provider: "TWILIO",
        accountSid: "",
        authToken: "",
        fromNumber: "",
        baseUrl: "",
        apiKey: "",
        senderId: "",
        httpMethod: "POST",
        paramMapping: "{}",
        isDefault: false,
        active: true,
    });

    const [testFormData, setTestFormData] = useState<TestSMSPayload>({
        to: "",
        message: "",
        templateCode: "",
        variables: {},
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [testErrors, setTestErrors] = useState<Record<string, string>>({});

    // Load configurations
    const loadConfigs = async () => {
        setLoading(true);
        try {
            const response = await configService.getSMSConfigs();
            if (response.success) {
                setConfigs(response.data || []);
            } else {
                showSnackbar(response.message || "Failed to load SMS configs", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to load SMS configs", "error");
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
            provider: "TWILIO",
            accountSid: "",
            authToken: "",
            fromNumber: "",
            baseUrl: "",
            apiKey: "",
            senderId: "",
            httpMethod: "POST",
            paramMapping: "{}",
            isDefault: false,
            active: true,
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (config: SMSConfig) => {
        setEditingConfig(config);
        setFormData({
            name: config.name,
            provider: config.provider,
            accountSid: config.accountSid || "",
            authToken: "",
            fromNumber: config.fromNumber,
            baseUrl: config.baseUrl || "",
            apiKey: config.apiKey || "",
            senderId: config.senderId || "",
            httpMethod: config.httpMethod || "POST",
            paramMapping: config.paramMapping || "{}",
            isDefault: config.isDefault,
            active: config.active,
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleOpenTestDialog = (config: SMSConfig) => {
        setTestingConfig(config);
        setTestFormData({
            to: "",
            message: "",
            templateCode: "",
            variables: {},
        });
        setTestResult(null);
        setTestErrors({});
        setOpenTestDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingConfig(null);
        setFormErrors({});
    };

    const handleCloseTestDialog = () => {
        setOpenTestDialog(false);
        setTestingConfig(null);
        setTestResult(null);
        setTestErrors({});
    };

    const handleTextChange = (field: any) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleSwitchChange = (field: any) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.checked;
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleSelectChange = (field: any) => (
        event: SelectChangeEvent<string>
    ) => {
        const value = event.target.value;
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleTestFormChange = (field: any) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const value = event.target.value;
        setTestFormData((prev: any) => ({ ...prev, [field]: value }));
        if (testErrors[field]) {
            setTestErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Name is required";
        if (!formData.provider.trim()) errors.provider = "Provider is required";
        if (!formData.fromNumber.trim()) errors.fromNumber = "From number is required";

        if (formData.provider === "TWILIO") {
            if (!formData.accountSid?.trim()) errors.accountSid = "Account SID is required for Twilio";
            if (!formData.authToken?.trim() && !editingConfig) {
                errors.authToken = "Auth Token is required for Twilio";
            }
        } else if (formData.provider === "GENERIC_HTTP") {
            if (!formData.baseUrl?.trim()) errors.baseUrl = "Base URL is required for Generic HTTP";
            if (!formData.apiKey?.trim()) errors.apiKey = "API Key is required for Generic HTTP";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateTestForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!testFormData.to.trim()) errors.to = "Recipient phone number is required";
        if (!testFormData.message?.trim() && !testFormData.templateCode?.trim()) {
            errors.message = "Either message or template code is required";
        }
        setTestErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // CRUD operations
    const handleSave = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (editingConfig) {
                const response = await configService.updateSMSConfig(
                    editingConfig.id,
                    formData
                );
                if (response.success) {
                    showSnackbar("SMS config updated successfully", "success");
                    loadConfigs();
                    handleCloseDialog();
                } else {
                    showSnackbar(response.message || "Failed to update config", "error");
                }
            } else {
                const response = await configService.createSMSConfig(formData);
                if (response.success) {
                    showSnackbar("SMS config created successfully", "success");
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
            title: "Delete SMS Config",
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    const response = await configService.deleteSMSConfig(id);
                    if (response.success) {
                        showSnackbar("SMS config deleted successfully", "success");
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
            message: `Are you sure you want to set "${name}" as the default SMS configuration?`,
            confirmText: "Set as Default",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    const response = await configService.setDefaultSMSConfig(id);
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

    const handleSendTest = async () => {
        if (!validateTestForm()) return;
        if (!testingConfig) return;

        setTestLoading(true);
        setTestResult(null);
        try {
            const payload: TestSMSPayload = {
                to: testFormData.to,
                ...(testFormData.message ? { message: testFormData.message } : {}),
                ...(testFormData.templateCode ? { templateCode: testFormData.templateCode } : {}),
                ...(testFormData.variables && Object.keys(testFormData.variables).length > 0
                    ? { variables: testFormData.variables }
                    : {}),
            };

            const response = await configService.testSMSConfig(testingConfig.id, payload);
            setTestResult(response.data);
            if (response.success && response.data?.sent) {
                showSnackbar("Test SMS sent successfully!", "success");
            } else {
                showSnackbar(response.message || "Failed to send test SMS", "warning");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to send test SMS", "error");
            setTestResult({ sent: false, detail: error?.message || "Failed to send" });
        } finally {
            setTestLoading(false);
        }
    };

    const getProviderLabel = (provider: string) => {
        const labels: Record<string, string> = {
            'TWILIO': 'Twilio',
            'GENERIC_HTTP': 'Generic HTTP',
        };
        return labels[provider] || provider;
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        {/* <SmsIcon className="text-blue-500 !w-6 !h-6" /> */}
                        <div className="text-[12px]">SMS Configurations</div>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1">
                        Twilio / generic HTTP SMS gateways: manage, default, and test-send.
                    </p>
                </div>
                <div className="flex gap-2">
                    <IconButton>
                        <RefreshIcon className="text-gray-500" onClick={loadConfigs} />
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
            <Paper className="border border-gray-200 rounded-lg bg-white-50 overflow-hidden">
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow className="bg-gray-50">
                                <TableCell className="!font-bold">S No</TableCell>
                                <TableCell className="!font-bold">Name</TableCell>
                                <TableCell className="!font-bold">Provider</TableCell>
                                <TableCell className="!font-bold">From Number</TableCell>
                                <TableCell className="!font-bold">Sender ID</TableCell>
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
                                    <TableCell colSpan={8} align="center">
                                        <div className="py-8">
                                            No SMS configurations found. Click "Add Config" to create one.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                configs.map((config, index) => (
                                    <TableRow key={config.id} sx={getRowColor(index)}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <SmsIcon className="text-blue-500 !w-4 !h-4" />
                                                <span className="font-medium text-gray-800">{config.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getProviderLabel(config.provider)}
                                                size="small"
                                                className={`!font-medium ${config.provider === "TWILIO"
                                                        ? "!bg-blue-100 !text-blue-700"
                                                        : "!bg-purple-100 !text-purple-700"
                                                    }`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">{config.fromNumber}</TableCell>
                                        <TableCell>{config.senderId || '-'}</TableCell>
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
                                                <Tooltip title="Send Test">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenTestDialog(config)}
                                                        className="!text-green-700"
                                                    >
                                                        <SendIcon fontSize="small" className="!w-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditDialog(config)}
                                                        className="!text-blue-500"
                                                    >
                                                        <EditIcon fontSize="small" className="!w-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(config.id, config.name)}
                                                    >
                                                        <DeleteIcon fontSize="small" className="!w-4" />
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
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="border-b border-gray-200 !p-4">
                    <div className="flex items-center gap-2">
                        <SmsOutlined className="text-amber-500" />
                        <span className="text-[12px]">
                            {editingConfig ? "Edit SMS Config" : "Create SMS Config"}
                        </span>
                    </div>
                </DialogTitle>
                <DialogContent className="!p-4">
                    <Grid container spacing={3} className="mt-2">
                        {/* Basic Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Config Name"
                                value={formData.name}
                                onChange={handleTextChange("name")}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Provider *</InputLabel>
                                <Select
                                    value={formData.provider}
                                    label="Provider *"
                                    onChange={handleSelectChange("provider")}
                                    error={!!formErrors.provider}
                                >
                                    <MenuItem value="TWILIO">Twilio</MenuItem>
                                    <MenuItem value="GENERIC_HTTP">Generic HTTP</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Twilio Specific */}
                        {formData.provider === "TWILIO" && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Account SID"
                                        value={formData.accountSid}
                                        onChange={handleTextChange("accountSid")}
                                        error={!!formErrors.accountSid}
                                        helperText={formErrors.accountSid}
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Auth Token"
                                        type="password"
                                        value={formData.authToken}
                                        onChange={handleTextChange("authToken")}
                                        error={!!formErrors.authToken}
                                        helperText={editingConfig ? "Leave blank to keep existing" : formErrors.authToken}
                                        required={!editingConfig}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Generic HTTP Specific */}
                        {formData.provider === "GENERIC_HTTP" && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Base URL"
                                        value={formData.baseUrl}
                                        onChange={handleTextChange("baseUrl")}
                                        error={!!formErrors.baseUrl}
                                        helperText={formErrors.baseUrl}
                                        placeholder="https://api.sms-gateway.com/send"
                                        required
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="API Key"
                                        type="password"
                                        value={formData.apiKey}
                                        onChange={handleTextChange("apiKey")}
                                        error={!!formErrors.apiKey}
                                        helperText={formErrors.apiKey}
                                        required={!editingConfig}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>HTTP Method</InputLabel>
                                        <Select
                                            value={formData.httpMethod}
                                            label="HTTP Method"
                                            onChange={handleSelectChange("httpMethod")}
                                        >
                                            <MenuItem value="POST">POST</MenuItem>
                                            <MenuItem value="GET">GET</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Parameter Mapping (JSON)"
                                        value={formData.paramMapping}
                                        onChange={handleTextChange("paramMapping")}
                                        placeholder='{"to": "to", "message": "text"}'
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Common Fields */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="From Number"
                                value={formData.fromNumber}
                                onChange={handleTextChange("fromNumber")}
                                error={!!formErrors.fromNumber}
                                helperText={formErrors.fromNumber}
                                placeholder="e.g., +1234567890 or alphanumeric sender"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Sender ID (Optional)"
                                value={formData.senderId}
                                onChange={handleTextChange("senderId")}
                                helperText="Custom sender ID for display"
                                placeholder="YourCompany"
                            />
                        </Grid>

                        {/* Settings */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-6">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isDefault}
                                            onChange={handleSwitchChange("isDefault")}
                                            color="primary"
                                        />
                                    }
                                    label="Set as Default"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.active}
                                            onChange={handleSwitchChange("active")}
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

            {/* Test SMS Dialog */}
            <Dialog
                open={openTestDialog}
                onClose={handleCloseTestDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="border-b border-gray-200 !p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SendIcon className="text-green-500 !w-4" />
                            <span className="text-[12px]">Send Test SMS</span>
                        </div>
                        <Chip
                            label={testingConfig?.name || ''}
                            size="small"
                            className="!bg-blue-100 !text-blue-700"
                        />
                    </div>
                </DialogTitle>
                <DialogContent className="!p-4">
                    <Grid container spacing={3} className="mt-2">
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Recipient Phone Number *"
                                value={testFormData.to}
                                onChange={handleTestFormChange("to")}
                                error={!!testErrors.to}
                                helperText={testErrors.to || "Include country code (e.g., +1234567890)"}
                                placeholder="+1234567890"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Message"
                                value={testFormData.message}
                                onChange={handleTestFormChange("message")}
                                error={!!testErrors.message}
                                helperText={testErrors.message || "Either provide a message or use a template"}
                                multiline
                                rows={3}
                                placeholder="Type your test message here..."
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider>
                                <Chip label="OR" size="small" className="bg-gray-100 text-gray-800" />
                            </Divider>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Template Code (Optional)"
                                value={testFormData.templateCode}
                                onChange={handleTestFormChange("templateCode")}
                                helperText="Use template code instead of plain message"
                                placeholder="WELCOME_SMS"
                            />
                        </Grid>
                    </Grid>

                    {/* Test Result */}
                    {testResult && (
                        <div className="mt-4">
                            <div
                                className={`!rounded-lg p-4 ${testResult.sent ? "bg-green-100 dark:bg-green-800/50 border border-green-500" : "bg-red-100 dark:bg-red-800/50 border border-red-500"}`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {testResult.sent ? (
                                            <CheckCircleIcon className="!w-4 !h-4 text-green-600" />
                                        ) : (
                                            <CancelIcon className="!w-4 !h-4 text-red-500" />
                                        )}
                                        <span className="font-medium">
                                            {testResult.sent ? "Sent Successfully" : "Failed to Send"}
                                        </span>
                                    </div>
                                    {testResult.reference && (
                                        <div className="text-xs text-gray-600">
                                            Reference: <span className="font-mono">{testResult.reference}</span>
                                        </div>
                                    )}
                                    {testResult.detail && (
                                        <div className="text-xs text-gray-500">
                                            Detail: {testResult.detail}
                                        </div>
                                    )}
                                    {testResult.provider && (
                                        <div className="text-xs text-gray-500">
                                            Provider: {testResult.provider}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {testLoading && (
                        <div className="mt-4">
                            <LinearProgress />
                            <div className="text-xs text-gray-500 text-center mt-1">
                                Sending test SMS...
                            </div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions className="!p-4 !border-t !border-gray-200">
                    <Button
                        variant="outlined"
                        onClick={handleCloseTestDialog}
                        className="!border-gray-200 !text-gray-800"
                        disabled={testLoading}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        className="!bg-primary"
                        onClick={handleSendTest}
                        disabled={testLoading}
                        startIcon={testLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                        {testLoading ? "Sending..." : "Send Test"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}