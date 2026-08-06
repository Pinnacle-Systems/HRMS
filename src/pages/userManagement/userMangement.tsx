import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tab,
    Tabs,
} from "@mui/material";
import {
    DeleteOutlineOutlined,
    Add as AddIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Settings as SettingsIcon,
    WhatsApp as WhatsAppIcon,
    Sms as SmsIcon,
    EmailOutlined,
    CloseOutlined,
    SmsOutlined,
} from "@mui/icons-material";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { branchService } from "../../services/modules/branch";
import { roleAdminService, type RoleOption, type UserRoleGrantRecord } from "../../services/modules/roleAdmin";
import { EmployeeSelector } from "../../components/PolicyManagement/Common/EmployeeSelector";
import { getRowColor } from "../const";
import { WhatsAppConfigurations } from "./whatsAppConfig";
import { SMSConfigurations } from "./smsConfiguration";
import { EmailConfigurations } from "./emailConfiguration";
import { dialogsx, EMPTY_FORM, type EmailConfig, type SMSConfig, type User, type WhatsAppConfig } from "./const";

export default function UserManagement() {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [grants, setGrants] = useState<UserRoleGrantRecord[]>([]);
    const [branches, setBranches] = useState<Array<{ id: string; branchName: string }>>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const { showSnackbar, showConfirmDialog } = useUI();
    const { session } = useAuth();

    const [selectedUser, setSelectedUser] = useState<any>('');
    const [selectedTab, setSelectedTab] = useState(0);

    // Configuration States
    const [emailConfig, setEmailConfig] = useState<EmailConfig>({
        host: '',
        port: 587,
        username: '',
        password: '',
        fromEmail: '',
        fromName: '',
        encryption: 'tls',
        isActive: false
    });
    const [smsConfig, setSmsConfig] = useState<SMSConfig>({
        provider: 'twilio',
        apiKey: '',
        apiSecret: '',
        fromNumber: '',
        accountSid: '',
        authToken: '',
        isActive: false
    });
    const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: '',
        webhookVerifyToken: '',
        isActive: false
    });

    // Dialog States
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [openEmailConfigDialog, setOpenEmailConfigDialog] = useState(false);
    const [openSMSConfigDialog, setOpenSMSConfigDialog] = useState(false);
    const [openWhatsAppConfigDialog, setOpenWhatsAppConfigDialog] = useState(false);

    const activeUserId = useMemo(() => selectedUser?.id || session?.user.userId || "", [selectedUser, session]);

    // Load branches
    const loadBranches = async () => {
        try {
            const response: any = await branchService.getActiveBranches();
            let branch: any;
            if (response.success) {
                const res = response.data.content || response.data || [];
                if (session?.branchId) {
                    branch = res.filter((item: any) => item.id === session?.branchId);
                } else {
                    branch = res;
                }
                setBranches(branch);
            }
        } catch (error: any) {
            showSnackbar(error.message, "error");
        }
    };

    // Load roles
    const loadRoles = async () => {
        try {
            const response: any = await roleAdminService.getRoles();
            const items = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.data)
                    ? response.data.data
                    : [];
            setRoles(items);
        } catch {
            setRoles([]);
        }
    };

    // Load grants for selected user
    const loadGrants = async (targetUserId: string) => {
        if (!targetUserId) {
            setGrants([]);
            return;
        }

        setLoading(true);
        try {
            const response: any = await roleAdminService.getUserRoleGrants(targetUserId);
            const data = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.data)
                    ? response.data.data
                    : [];
            setGrants(data);
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to load role grants", "error");
            setGrants([]);
        } finally {
            setLoading(false);
        }
    };

    // Load users
    const loadUsers = async () => {
        // try {
        //     const response: any = await userService.getUsers();
        //     const data = response?.data?.content || response?.data || [];
        //     setUsers(Array.isArray(data) ? data : []);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to load users", "error");
        // } finally {
        //     setUsersLoading(false);
        // }
    };

    // Load configurations
    const loadConfigurations = async () => {
        // try {
        //     const [email, sms, whatsapp] = await Promise.all([
        //         userService.getEmailConfig(),
        //         userService.getSMSConfig(),
        //         userService.getWhatsAppConfig()
        //     ]);
        //     if (email) setEmailConfig(email);
        //     if (sms) setSmsConfig(sms);
        //     if (whatsapp) setWhatsappConfig(whatsapp);
        // } catch (error) {
        //     console.error("Failed to load configurations:", error);
        // }
    };

    useEffect(() => {
        loadBranches();
        loadRoles();
        loadUsers();
        loadConfigurations();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            loadGrants(selectedUser.id);
        }
    }, [selectedUser]);

    // User CRUD operations
    const handleAddUser = async (userData: Partial<User>) => {
        // try {
        //     const response = await userService.createUser(userData);
        //     showSnackbar("User created successfully", "success");
        //     loadUsers();
        //     setOpenUserDialog(false);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to create user", "error");
        // }
    };

    const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
        // try {
        //     await userService.updateUser(userId, userData);
        //     showSnackbar("User updated successfully", "success");
        //     loadUsers();
        //     setOpenUserDialog(false);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to update user", "error");
        // }
    };

    const handleDeleteUser = async (userId: string) => {
        showConfirmDialog({
            title: "Delete User",
            message: "Are you sure you want to delete this user? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                // try {
                //     await userService.deleteUser(userId);
                //     showSnackbar("User deleted successfully", "success");
                //     loadUsers();
                //     if (selectedUser?.id === userId) {
                //         setSelectedUser(null);
                //         setGrants([]);
                //     }
                // } catch (error: any) {
                //     showSnackbar(error?.message || "Failed to delete user", "error");
                // }
            },
        });
    };

    // Role assignment
    const onAssign = async () => {
        if (!activeUserId) {
            showSnackbar("Select a user first", "warning");
            return;
        }
        if (!form.roleId) {
            showSnackbar("Select a role to assign", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                roleId: form.roleId,
                ...(form.branchId ? { branchId: form.branchId } : {}),
            };
            const response: any = await roleAdminService.createUserRoleGrant(
                activeUserId,
                payload,
            );
            if (response?.success) {
                showSnackbar("Role grant added successfully", "success");
                setForm(EMPTY_FORM);
                await loadGrants(activeUserId);
            } else {
                showSnackbar(response?.message || "Unable to add role grant", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Unable to add role grant", "error");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (grantId: string) => {
        if (!activeUserId) return;

        showConfirmDialog({
            title: "Remove role grant",
            message: "This will delete the role grant for the selected user. Continue?",
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                setLoading(true);
                try {
                    const response: any = await roleAdminService.deleteUserRoleGrant(
                        activeUserId,
                        grantId,
                    );
                    if (response?.success) {
                        showSnackbar("Role grant removed", "success");
                        await loadGrants(activeUserId);
                    } else {
                        showSnackbar(response?.message || "Unable to remove role grant", "error");
                    }
                } catch (error: any) {
                    showSnackbar(error?.message || "Unable to remove role grant", "error");
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // Configuration handlers
    const handleSaveEmailConfig = async () => {
        // try {
        //     await userService.updateEmailConfig(emailConfig);
        //     showSnackbar("Email configuration saved successfully", "success");
        //     setOpenEmailConfigDialog(false);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to save email configuration", "error");
        // }
    };

    const handleSaveSMSConfig = async () => {
        // try {
        //     await userService.updateSMSConfig(smsConfig);
        //     showSnackbar("SMS configuration saved successfully", "success");
        //     setOpenSMSConfigDialog(false);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to save SMS configuration", "error");
        // }
    };

    const handleSaveWhatsAppConfig = async () => {
        // try {
        //     await userService.updateWhatsAppConfig(whatsappConfig);
        //     showSnackbar("WhatsApp configuration saved successfully", "success");
        //     setOpenWhatsAppConfigDialog(false);
        // } catch (error: any) {
        //     showSnackbar(error?.message || "Failed to save WhatsApp configuration", "error");
        // }
    };

    // Tabs
    const tabs = [
        // { label: "Users", icon: <PersonIcon /> },
        { label: "Role Mapping", icon: <SecurityIcon className="!w-4" /> },
        { label: "Configurations", icon: <SettingsIcon className="!w-4" /> },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[14px] font-bold">User Management</div>
                    <p className="text-[12px] text-gray-500">Manage users, roles, and system configurations</p>
                </div>
                <div className="flex gap-2">
                    {/* <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            loadUsers();
                            loadConfigurations();
                        }}
                    >
                        Refresh
                    </Button> */}
                    <Button
                        variant="contained"
                        className="!bg-primary"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenUserDialog(true)}
                    >
                        Add User
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Paper className="border border-gray-200 bg-white-50">
                <Tabs
                    value={selectedTab}
                    onChange={(_, newValue) => setSelectedTab(newValue)}
                    className="border-b border-gray-200"
                    sx={{
                        "& .MuiTabs-indicator": {
                            backgroundColor: "var(--color-primary)",
                            height: 3,
                            borderRadius: "3px 3px 0 0",
                        },
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            className="!text-gray-600 !text-[12px] !min-h-[40px] !h-[50px]"
                        />
                    ))}
                </Tabs>

                {/* Tab Content */}
                <div className="p-4">

                    {/* Role Mapping Tab */}
                    {selectedTab === 0 && (
                        <div className="space-y-3 h-[calc(100vh-240px)] overflow-y-auto">
                            {/* User Selection Section */}
                            <div className="bg-white-50 rounded-md p-4 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <PersonIcon className="text-blue-600 !w-5 !h-5" />
                                    </div>
                                    <div>
                                        <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                            Select User
                                        </Typography>
                                        <Typography variant="caption" className="text-gray-500">
                                            Search and select a user to manage their role assignments
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                                    <div className="flex-1 w-full">
                                        <EmployeeSelector
                                            value={selectedUser ? selectedUser : null}
                                            onChange={(value) => setSelectedUser(value)}
                                            label="Search Employees"
                                            placeholder="Type employee name or email..."
                                        />
                                    </div>
                                    {selectedUser && (
                                        <Chip
                                            label={
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{selectedUser.name}</span>
                                                    <span className="text-gray-400">|</span>
                                                    <span className=" text-xs">{selectedUser.emailAddress}</span>
                                                </div>
                                            }
                                            onDelete={() => {
                                                setSelectedUser(null);
                                                setGrants([]);
                                            }}
                                            color="default"
                                            className="!bg-gray-200 !text-gray-800"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-4">
                                    {selectedUser ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Role Assignment Card */}
                                            <div className="lg:col-span-2">
                                                <Paper className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    {/* Header */}
                                                    <div className="px-6 py-4 border-b border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-primary-100 rounded-lg">
                                                                    <SecurityIcon className="text-primary !w-5 !h-5" />
                                                                </div>
                                                                <div>
                                                                    <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                                                        Role Assignment
                                                                    </Typography>
                                                                    <Typography variant="caption" className="text-gray-500">
                                                                        Assign roles to {selectedUser.name}
                                                                    </Typography>
                                                                </div>
                                                            </div>
                                                            <Chip
                                                                label={`${grants.length} Role${grants.length !== 1 ? 's' : ''} Assigned`}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Assignment Form */}
                                                    <div className="bg-white-50 p-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <FormControl fullWidth>
                                                                <InputLabel className="!text-gray-600">Select Role *</InputLabel>
                                                                <Select
                                                                    value={form.roleId}
                                                                    label="Select Role *"
                                                                    onChange={(e) =>
                                                                        setForm((prev) => ({ ...prev, roleId: e.target.value }))
                                                                    }
                                                                    className="!rounded-lg"
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-root': {
                                                                            borderRadius: '10px',
                                                                        }
                                                                    }}
                                                                >
                                                                    {roles.map((role) => (
                                                                        <MenuItem key={role.roleId} value={role.roleId} className="!py-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <SecurityIcon className="!w-4 !h-4 text-gray-400" />
                                                                                <span>{role.name}</span>
                                                                            </div>
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>

                                                            <FormControl fullWidth>
                                                                <InputLabel className="!text-gray-600">Branch Scope</InputLabel>
                                                                <Select
                                                                    value={form.branchId}
                                                                    label="Branch Scope"
                                                                    onChange={(e) =>
                                                                        setForm((prev) => ({ ...prev, branchId: e.target.value }))
                                                                    }
                                                                    className="!rounded-lg"
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-root': {
                                                                            borderRadius: '10px',
                                                                        }
                                                                    }}
                                                                >
                                                                    <MenuItem value="">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-blue-600">🌐</span>
                                                                            <span>Tenant-wide</span>
                                                                        </div>
                                                                    </MenuItem>
                                                                    {branches.map((branch) => (
                                                                        <MenuItem key={branch.id} value={branch.id}>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-gray-400">🏢</span>
                                                                                <span>{branch.branchName}</span>
                                                                            </div>
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </div>

                                                        <div className="mt-4 flex justify-end">
                                                            <Button
                                                                variant="contained"
                                                                className="!bg-primary !rounded-xl !px-6 !py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                                                onClick={onAssign}
                                                                disabled={!activeUserId || loading || !form.roleId}
                                                                startIcon={!loading && <AddIcon />}
                                                            >
                                                                {loading ? (
                                                                    <CircularProgress size={20} className="!text-white" />
                                                                ) : (
                                                                    'Assign Role'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Paper>
                                            </div>
                                        </div>
                                    ) : (
                                        // Empty State
                                        <div className="text-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                <PersonIcon className="!w-12 !h-12 text-gray-300" />
                                            </div>
                                            <Typography variant="h6" className="text-gray-600 font-medium">
                                                No User Selected
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-400 mt-1">
                                                Search and select a user from the dropdown above to manage their roles
                                            </Typography>
                                        </div>
                                    )}
                                    {/* Summary Card */}
                                    <div className="lg:col-span-1">
                                        <Paper className="border bg-white-50 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-white px-6 py-4 border-b border-gray-200">
                                                <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                                    Quick Summary
                                                </Typography>
                                            </div>
                                            <div className=" grid grid-cols-3 justify-between gap-2 p-4">
                                                <div className="flex items-center justify-between p-3 border border-blue-500 rounded-lg w-full">
                                                    <span className="text-[12px] text-gray-600">Total Roles</span>
                                                    <span className="text-[12px] font-bold text-blue-600">{grants.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 border border-green-500 rounded-lg">
                                                    <span className="text-[12px] text-gray-600">Tenant-wide</span>
                                                    <span className="text-[12px] font-bold text-green-600">
                                                        {grants.filter(g => g.scope === 'TENANT').length}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 border border-purple-500 rounded-lg">
                                                    <span className="text-[12px] text-gray-600">Branch Scoped</span>
                                                    <span className="text-[12px] font-bold text-purple-600">
                                                        {grants.filter(g => g.scope === 'BRANCH').length}
                                                    </span>
                                                </div>
                                            </div>
                                        </Paper>
                                    </div>
                                </div>

                                {/* Current Role Assignments Table */}
                                {selectedUser && grants.length > 0 && (
                                    <div className="">
                                        <Paper className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                                            <SecurityIcon className="text-indigo-600 !w-5 !h-5" />
                                                        </div>
                                                        <div>
                                                            <Typography variant="subtitle1" className="font-semibold text-gray-800">
                                                                Current Role Assignments
                                                            </Typography>
                                                            <Typography variant="caption" className="text-gray-500">
                                                                Manage existing role grants for {selectedUser.name}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto p-5 max-h-[calc(100vh-480px)] bg-white-50">
                                                <Table className="border border-gray-200">
                                                    <TableHead>
                                                        <TableRow className="bg-gray-50">
                                                            <TableCell className="!font-semibold !text-gray-700">Role</TableCell>
                                                            <TableCell className="!font-semibold !text-gray-700">Scope</TableCell>
                                                            <TableCell className="!font-semibold !text-gray-700">Branch</TableCell>
                                                            <TableCell className="!font-semibold !text-gray-700" align="center">Action</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {loading ? (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center" className="py-8">
                                                                    <CircularProgress size={30} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : grants.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center" className="py-8">
                                                                    <Typography color="text.secondary">
                                                                        No role grants assigned for this user.
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            grants.map((grant, index) => (
                                                                <TableRow key={grant.grantId} sx={getRowColor(index)}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <SecurityIcon className="!w-4 !h-4 text-primary" />
                                                                            <span className="font-medium text-gray-800">{grant.roleName}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={grant.scope}
                                                                            size="small"
                                                                            className={`!font-medium ${grant.scope === "BRANCH"
                                                                                ? "!bg-purple-100 !text-purple-700"
                                                                                : "!bg-blue-100 !text-blue-700"
                                                                                }`}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {grant.branchName ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-gray-400">🏢</span>
                                                                                <span className="text-gray-700">{grant.branchName}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400">Tenant-wide</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        <Button
                                                                            variant="text"
                                                                            color="error"
                                                                            size="small"
                                                                            onClick={() => onDelete(grant.grantId)}
                                                                            className="!text-red-500 hover:!bg-red-50 !rounded-lg"
                                                                            startIcon={<DeleteOutlineOutlined className="!w-4 !h-4" />}
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </Paper>
                                    </div>
                                )}
                                {
                                    grants.length === 0 && (
                                        <div className="grid items-center justify-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                                            <div>
                                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                    <PersonIcon className="!w-12 !h-12 text-gray-300" />
                                                </div>
                                                <Typography variant="h6" className="text-gray-600 font-medium">
                                                    No Role Grants Assigned for this User.
                                                </Typography>
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    )}

                    {/* Configurations Tab */}
                    {selectedTab === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Email Configuration */}
                            <Card className="border border-gray-200 bg-white-50">
                                <CardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <EmailOutlined className="text-blue-500" />
                                            <div className="text-[12px] text-gray-800">
                                                Email
                                            </div>
                                        </div>
                                        {/* <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={emailConfig.isActive}
                                                    onChange={(e) => setEmailConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                                                    size="small"
                                                />
                                            }
                                            label={emailConfig.isActive ? "Active" : "Inactive"}
                                            labelPlacement="start"
                                            className="mr-0"
                                        /> */}
                                    </div>
                                    <div className="text-[12px] text-gray-600 space-y-3 mb-5">
                                        <p><span className="font-medium">Host:</span> {emailConfig.host || 'Not configured'}</p>
                                        <p><span className="font-medium">Port:</span> {emailConfig.port || 'Not configured'}</p>
                                        <p><span className="font-medium">From:</span> {emailConfig.fromEmail || 'Not configured'}</p>
                                    </div>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        className="mt-3 !border-primary !text-primary"
                                        onClick={() => setOpenEmailConfigDialog(true)}
                                    >
                                        Configure
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* SMS Configuration */}
                            <Card className="border border-gray-200 bg-white-50">
                                <CardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <SmsOutlined className="text-amber-500" />
                                            <div className="text-[12px] text-gray-800">
                                                SMS
                                            </div>
                                        </div>
                                        {/* <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={smsConfig.isActive}
                                                    onChange={(e) => setSmsConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                                                    size="small"
                                                />
                                            }
                                            label={smsConfig.isActive ? "Active" : "Inactive"}
                                            labelPlacement="start"
                                            className="mr-0"
                                        /> */}
                                    </div>
                                    <div className="text-[12px] text-gray-600 space-y-3 mb-5">
                                        <p><span className="font-medium">Provider:</span> {smsConfig.provider || 'Not configured'}</p>
                                        <p><span className="font-medium">From:</span> {smsConfig.fromNumber || 'Not configured'}</p>
                                    </div>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        className="mt-3 !border-primary !text-primary"
                                        onClick={() => setOpenSMSConfigDialog(true)}
                                    >
                                        Configure
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* WhatsApp Configuration */}
                            <Card className="border border-gray-200 bg-white-50">
                                <CardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <WhatsAppIcon className="text-green-500" />
                                            <div className="text-[12px] text-gray-800">
                                                WhatsApp
                                            </div>
                                        </div>
                                        {/* <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={whatsappConfig.isActive}
                                                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                                                    size="small"
                                                />
                                            }
                                            label={whatsappConfig.isActive ? "Active" : "Inactive"}
                                            labelPlacement="start"
                                            className="mr-0"
                                        /> */}
                                    </div>
                                    <div className="text-[12px] text-gray-600 space-y-3 mb-5">
                                        <p><span className="font-medium">Business ID:</span> {whatsappConfig.businessAccountId || 'Not configured'}</p>
                                        <p><span className="font-medium">Phone ID:</span> {whatsappConfig.phoneNumberId || 'Not configured'}</p>
                                    </div>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        className="mt-3 !border-primary !text-primary"
                                        onClick={() => setOpenWhatsAppConfigDialog(true)}
                                    >
                                        Configure
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </Paper>

            {/* Add/Edit User Dialog */}
            <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} className="mt-2">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={selectedUser?.name || ''}
                                onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, name: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={selectedUser?.emailAddress || ''}
                                onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, emailAddress: e.target.value }))}
                            />
                        </Grid>
                        {/* <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={selectedUser?.email || ''}
                                onChange={(e) => setSelectedUser(prev => ({ ...prev!, email: e.target.value }))}
                            />
                        </Grid> */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={selectedUser?.phone || ''}
                                onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, phone: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Employee Code"
                                value={selectedUser?.employeeCode || ''}
                                onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, employeeCode: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Branch</InputLabel>
                                <Select
                                    value={selectedUser?.branchId || ''}
                                    label="Branch"
                                    onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, branchId: e.target.value }))}
                                >
                                    {branches.map(branch => (
                                        <MenuItem key={branch.id} value={branch.id}>
                                            {branch.branchName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={selectedUser?.isActive ?? true}
                                        onChange={(e) => setSelectedUser((prev: any) => ({ ...prev!, isActive: e.target.checked }))}
                                    />
                                }
                                label="Active"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="!p-4 !border-t !border-gray-200">
                    <Button onClick={() => setOpenUserDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (selectedUser?.id) {
                                handleUpdateUser(selectedUser.id, selectedUser);
                            } else {
                                handleAddUser(selectedUser || {});
                            }
                        }}
                        variant="contained"
                        className="!bg-primary"
                    >
                        {selectedUser?.id ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Configuration Dialog */}
            <Dialog open={openEmailConfigDialog} onClose={() => setOpenEmailConfigDialog(false)} sx={dialogsx}>
                <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
                    <div className="text-gray-800 text-[12px] ml-2">Email Configuration</div>
                    <IconButton onClick={() => setOpenEmailConfigDialog(false)}>
                        <CloseOutlined className="text-gray-800" />
                    </IconButton>
                </DialogTitle>
                <EmailConfigurations />
                <DialogActions className="!p-4 !border-t !border-gray-200">
                    <Button onClick={() => setOpenEmailConfigDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEmailConfig} variant="contained" className="!bg-primary">
                        Save Configuration
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SMS Configuration Dialog */}
            <Dialog open={openSMSConfigDialog} onClose={() => setOpenSMSConfigDialog(false)} sx={dialogsx}>
                <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
                    <div className="text-gray-800 text-[12px] ml-2">SMS Configuration</div>
                    <IconButton onClick={() => setOpenSMSConfigDialog(false)}>
                        <CloseOutlined className="text-gray-800" />
                    </IconButton>
                </DialogTitle>
                <SMSConfigurations />
                <DialogActions className="!p-4 !border-t !border-gray-200">
                    <Button onClick={() => setOpenSMSConfigDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveSMSConfig} variant="contained" className="!bg-primary">
                        Save Configuration
                    </Button>
                </DialogActions>
            </Dialog>

            {/* WhatsApp Configuration Dialog */}
            <Dialog open={openWhatsAppConfigDialog} onClose={() => setOpenWhatsAppConfigDialog(false)} sx={dialogsx}>
                <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
                    <div className="text-gray-800 text-[12px] ml-2">WhatsApp Configuration</div>
                    <IconButton onClick={() => setOpenWhatsAppConfigDialog(false)}>
                        <CloseOutlined className="text-gray-800" />
                    </IconButton>
                </DialogTitle>
                <WhatsAppConfigurations />
                <DialogActions className="!p-4 !border-t !border-gray-200">
                    <Button onClick={() => setOpenWhatsAppConfigDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveWhatsAppConfig} variant="contained" className="!bg-primary">
                        Save Configuration
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}