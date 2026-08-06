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
    Divider,
    LinearProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Email as EmailIcon,
    Send as SendIcon,
    EditOutlined,
    DeleteOutlined,
    EmailOutlined,
} from "@mui/icons-material";
import { useUI } from "../../context/Snackbar";
import { configService, type CreateEmailConfigPayload, type EmailConfig, type TestEmailPayload } from "../../services/modules/configs";
import { getRowColor } from "../const";

export function EmailConfigurations() {
    const { showSnackbar, showConfirmDialog } = useUI();

    // State
    const [configs, setConfigs] = useState<EmailConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
    const [openTestDialog, setOpenTestDialog] = useState(false);
    const [testingConfig, setTestingConfig] = useState<EmailConfig | null>(null);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const [formData, setFormData] = useState<CreateEmailConfigPayload>({
        name: "",
        host: "",
        port: 587,
        username: "",
        password: "",
        fromEmail: "",
        fromName: "",
        auth: true,
        starttls: true,
        ssl: false,
        isDefault: false,
        active: true,
    });

    const [testFormData, setTestFormData] = useState<TestEmailPayload>({
        to: "",
        subject: "",
        body: "",
        templateCode: "",
        variables: {},
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [testErrors, setTestErrors] = useState<Record<string, string>>({});

    // Load configurations
    const loadConfigs = async () => {
        setLoading(true);
        try {
            const response = await configService.getEmailConfigs();
            if (response.success) {
                setConfigs(response.data || []);
            } else {
                showSnackbar(response.message || "Failed to load Email configs", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to load Email configs", "error");
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
            host: "",
            port: 587,
            username: "",
            password: "",
            fromEmail: "",
            fromName: "",
            auth: true,
            starttls: true,
            ssl: false,
            isDefault: false,
            active: true,
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (config: EmailConfig) => {
        setEditingConfig(config);
        setFormData({
            name: config.name,
            host: config.host,
            port: config.port,
            username: config.username,
            password: "",
            fromEmail: config.fromEmail,
            fromName: config.fromName,
            auth: config.auth,
            starttls: config.starttls,
            ssl: config.ssl,
            isDefault: config.isDefault,
            active: config.active,
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleOpenTestDialog = (config: EmailConfig) => {
        setTestingConfig(config);
        setTestFormData({
            to: "",
            subject: "",
            body: "",
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

    const handleFormChange = (field: keyof CreateEmailConfigPayload) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const target = event.target;
        const isCheckbox = 'type' in target && target.type === 'checkbox';

        const value = isCheckbox
            ? (target as HTMLInputElement).checked
            : target.value;

        setFormData((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleTestFormChange = (field: keyof TestEmailPayload) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        const value = event.target.value;
        setTestFormData((prev) => ({ ...prev, [field]: value }));
        if (testErrors[field]) {
            setTestErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Config name is required";
        if (!formData.host.trim()) errors.host = "SMTP host is required";
        if (!formData.port) errors.port = "Port is required";
        if (formData.port < 1 || formData.port > 65535) {
            errors.port = "Port must be between 1 and 65535";
        }
        if (!formData.username.trim()) errors.username = "Username is required";
        if (!formData.password.trim() && !editingConfig) {
            errors.password = "Password is required for new configs";
        }
        if (!formData.fromEmail.trim()) errors.fromEmail = "From email is required";
        if (!formData.fromEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errors.fromEmail = "Invalid email format";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateTestForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!testFormData.to.trim()) errors.to = "Recipient email is required";
        if (!testFormData.to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errors.to = "Invalid email format";
        }
        if (!testFormData.subject?.trim() && !testFormData.templateCode?.trim()) {
            errors.subject = "Either subject or template code is required";
        }
        if (!testFormData.body?.trim() && !testFormData.templateCode?.trim()) {
            errors.body = "Either body or template code is required";
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
                const response = await configService.updateEmailConfig(
                    editingConfig.id,
                    formData
                );
                if (response.success) {
                    showSnackbar("Email config updated successfully", "success");
                    loadConfigs();
                    handleCloseDialog();
                } else {
                    showSnackbar(response.message || "Failed to update config", "error");
                }
            } else {
                const response = await configService.createEmailConfig(formData);
                if (response.success) {
                    showSnackbar("Email config created successfully", "success");
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
            title: "Delete Email Config",
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    const response = await configService.deleteEmailConfig(id);
                    if (response.success) {
                        showSnackbar("Email config deleted successfully", "success");
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
            message: `Are you sure you want to set "${name}" as the default Email configuration?`,
            confirmText: "Set as Default",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    const response = await configService.setDefaultEmailConfig(id);
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
            const payload: TestEmailPayload = {
                to: testFormData.to,
                ...(testFormData.subject ? { subject: testFormData.subject } : {}),
                ...(testFormData.body ? { body: testFormData.body } : {}),
                ...(testFormData.templateCode ? { templateCode: testFormData.templateCode } : {}),
                ...(testFormData.variables && Object.keys(testFormData.variables).length > 0
                    ? { variables: testFormData.variables }
                    : {}),
            };

            const response = await configService.testEmailConfig(testingConfig.id, payload);
            setTestResult(response.data);
            if (response.success && response.data?.sent) {
                showSnackbar("Test email sent successfully!", "success");
            } else {
                showSnackbar(response.message || "Failed to send test email", "warning");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to send test email", "error");
            setTestResult({ sent: false, detail: error?.message || "Failed to send" });
        } finally {
            setTestLoading(false);
        }
    };

    const getSecurityLabel = (config: EmailConfig) => {
        if (config.ssl) return "SSL";
        if (config.starttls) return "STARTTLS";
        return "None";
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        {/* <EmailIcon className="text-blue-500 !w-6 !h-6" /> */}
                        <div className="text-[12px]">Email SMTP Configurations</div>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1">
                        Manage multiple SMTP servers, set the default, and test-send.
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
            <Paper className="border bg-white-50 border-gray-200 rounded-lg overflow-hidden">
                <TableContainer className="w-full">
                    <Table size="small">
                        <TableHead>
                            <TableRow className="bg-gray-50">
                                <TableCell className="!font-bold">S No</TableCell>
                                <TableCell className="!font-bold">Name</TableCell>
                                <TableCell className="!font-bold">SMTP Host</TableCell>
                                <TableCell className="!font-bold">Port</TableCell>
                                <TableCell className="!font-bold">From Email</TableCell>
                                <TableCell className="!font-bold">Security</TableCell>
                                <TableCell className="!font-bold">Status</TableCell>
                                <TableCell className="!font-bold">Default</TableCell>
                                <TableCell className="!font-bold" align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" className="py-8">
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : configs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <div className="text-gray-500 py-8">
                                            No Email configurations found. Click "Add Config" to create one.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                configs.map((config, index) => (
                                    <TableRow key={config.id} sx={getRowColor(index)}>
                                        <TableCell className="font-mono text-gray-600">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <EmailIcon className="text-blue-500 !w-4 !h-4" />
                                                <span className="font-medium text-gray-800">{config.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600">{config.host}</TableCell>
                                        <TableCell>{config.port}</TableCell>
                                        <TableCell className="text-gray-600">{config.fromEmail}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getSecurityLabel(config)}
                                                size="small"
                                                className={`!font-medium ${config.ssl
                                                        ? "!bg-green-100 !text-green-700"
                                                        : config.starttls
                                                            ? "!bg-blue-100 !text-blue-700"
                                                            : "!bg-gray-100 !text-gray-700"
                                                    }`}
                                            />
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
                                                <Tooltip title="Send Test">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenTestDialog(config)}
                                                        className="!text-green-600"
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
                                                        <EditOutlined fontSize="small" className="!w-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(config.id, config.name)}
                                                    >
                                                        <DeleteOutlined fontSize="small" className="!w-4" />
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
                        <EmailOutlined className="text-blue-500" />
                        <span className="text-[12px]">
                            {editingConfig ? "Edit SMTP Config" : "Create SMTP Config"}
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
                                onChange={handleFormChange("name")}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="SMTP Host"
                                value={formData.host}
                                onChange={handleFormChange("host")}
                                error={!!formErrors.host}
                                helperText={formErrors.host}
                                placeholder="smtp.gmail.com"
                                required
                            />
                        </Grid>

                        {/* Connection Settings */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Port"
                                type="number"
                                value={formData.port}
                                onChange={handleFormChange("port")}
                                error={!!formErrors.port}
                                helperText={formErrors.port}
                                placeholder="587"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={formData.username}
                                onChange={handleFormChange("username")}
                                error={!!formErrors.username}
                                helperText={formErrors.username}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={handleFormChange("password")}
                                error={!!formErrors.password}
                                helperText={editingConfig ? "Leave blank to keep existing" : formErrors.password}
                                required={!editingConfig}
                            />
                        </Grid>

                        {/* Email Settings */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="From Email"
                                type="email"
                                value={formData.fromEmail}
                                onChange={handleFormChange("fromEmail")}
                                error={!!formErrors.fromEmail}
                                helperText={formErrors.fromEmail}
                                placeholder="noreply@yourdomain.com"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="From Name"
                                value={formData.fromName}
                                onChange={handleFormChange("fromName")}
                                placeholder="Your Company Name"
                            />
                        </Grid>

                        {/* Security Settings */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-6 flex-wrap">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.auth}
                                            onChange={handleFormChange("auth")}
                                            color="primary"
                                        />
                                    }
                                    label="Authentication"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.starttls}
                                            onChange={handleFormChange("starttls")}
                                            color="primary"
                                        />
                                    }
                                    label="STARTTLS"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.ssl}
                                            onChange={handleFormChange("ssl")}
                                            color="primary"
                                        />
                                    }
                                    label="SSL"
                                />
                            </div>
                        </Grid>

                        {/* Settings */}
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

            {/* Test Email Dialog */}
            <Dialog
                open={openTestDialog}
                onClose={handleCloseTestDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="border-b border-gray-200 !p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 ml-4">
                            <SendIcon className="text-green-600 !w-4" />
                            <span className="text-[12px]">Send Test Email</span>
                        </div>
                        <Chip
                            label={testingConfig?.name || ''}
                            size="small"
                            className="!bg-blue-100 !text-blue-700"
                        />
                    </div>
                </DialogTitle>
                <DialogContent className="!p-4">
                    <Grid container spacing={2} className="mt-2">
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Recipient Email"
                                value={testFormData.to}
                                onChange={handleTestFormChange("to")}
                                error={!!testErrors.to}
                                helperText={testErrors.to || "Enter the recipient's email address"}
                                placeholder="recipient@example.com"
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Subject"
                                value={testFormData.subject}
                                onChange={handleTestFormChange("subject")}
                                error={!!testErrors.subject}
                                helperText={testErrors.subject || "Either provide a subject or use a template"}
                                placeholder="Test Email Subject"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Email Body"
                                value={testFormData.body}
                                onChange={handleTestFormChange("body")}
                                error={!!testErrors.body}
                                helperText={testErrors.body || "Either provide a body or use a template"}
                                multiline
                                rows={4}
                                placeholder="Write your test email content here..."
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider className="!my-2 border-gray-200">
                                <Chip label="OR" size="small" className="bg-gray-100 text-gray-800" />
                            </Divider>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Template Code (Optional)"
                                value={testFormData.templateCode}
                                onChange={handleTestFormChange("templateCode")}
                                helperText="Use template code instead of plain subject/body"
                                placeholder="WELCOME_EMAIL"
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
                                        <div className="text-[12px] text-gray-800">
                                            Reference: <span className="font-mono">{testResult.reference}</span>
                                        </div>
                                    )}
                                    {testResult.detail && (
                                        <div className="text-[12px] text-gray-800">
                                            Detail: {testResult.detail}
                                        </div>
                                    )}
                                    {testResult.provider && (
                                        <div className="text-[12px] text-gray-500">
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
                            <div className="text-[12px] text-gray-500 text-center mt-1">
                                Sending test email...
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