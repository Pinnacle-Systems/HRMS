import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Chip,
    Checkbox,
    Button,
    IconButton,
    alpha,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert,
    CircularProgress,
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Security as SecurityIcon,
    Shield as ShieldIcon,
    Lock as LockIcon,
    Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { getRowColor } from "../const";
import { permissionService } from "../../services/modules/permisssions";
import { DEFAULT_ROLE_PERMISSIONS, getSortedRoles, PERMISSION_GROUPS, ROLE_COLORS, ROLES } from "./const";

export default function PermissionSettings() {
    const { session } = useAuth();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
    const [initialPermissions, setInitialPermissions] = useState<Record<string, string[]>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [loading, setLoading] = useState(false);

    const roles = Object.keys(rolePermissions);
    const isAdmin = session?.user.roles.includes("ADMIN");
    const tenantId = session?.user.tenantId;

    const loadPermissions = async () => {
        setLoading(true);
        showSpinner();
        try {
            // Load permissions for each role
            const predefinedRoles = Object.keys(ROLES);
            const permissionsMap: Record<string, string[]> = {};

            await Promise.all(
                predefinedRoles.map(async (role) => {
                    try {
                        const response = await permissionService.getRolePermissions(role, {
                            tenantId: tenantId
                        });
                        // Fix: Access permissions from response.data.permissions
                        if (response.success && response.data) {
                            permissionsMap[role] = response.data.permissions || [];
                        } else {
                            permissionsMap[role] = DEFAULT_ROLE_PERMISSIONS[role] || [];
                            console.warn(`Using default permissions for role ${role}`);
                        }
                    } catch (error) {
                        console.error(`Failed to load permissions for role ${role}:`, error);
                        permissionsMap[role] = DEFAULT_ROLE_PERMISSIONS[role] || [];
                    }
                })
            );

            setRolePermissions(permissionsMap);
            setInitialPermissions(permissionsMap);
            showSnackbar("Permissions loaded successfully", "success");
        } catch (error) {
            setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
            setInitialPermissions(DEFAULT_ROLE_PERMISSIONS);
            showSnackbar("Failed to load permissions from server, using default values", "warning");
        } finally {
            hideSpinner();
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPermissions();
    }, [tenantId]);

    const handlePermissionToggle = (role: string, permission: string) => {
        if (!isEditing) return;

        setRolePermissions(prev => {
            const currentPermissions = prev[role] || [];
            const newPermissions = currentPermissions.includes(permission)
                ? currentPermissions.filter(p => p !== permission)
                : [...currentPermissions, permission];

            return {
                ...prev,
                [role]: newPermissions,
            };
        });
    };

    const handleGroupToggle = (role: string, groupPermissions: string[]) => {
        if (!isEditing) return;

        setRolePermissions(prev => {
            const currentPermissions = prev[role] || [];
            const allInGroup = groupPermissions.every(p => currentPermissions.includes(p));

            let newPermissions;
            if (allInGroup) {
                // Remove all permissions in the group
                newPermissions = currentPermissions.filter(p => !groupPermissions.includes(p));
            } else {
                // Add all permissions in the group that aren't already present
                const permissionsToAdd = groupPermissions.filter(p => !currentPermissions.includes(p));
                newPermissions = [...currentPermissions, ...permissionsToAdd];
            }

            return {
                ...prev,
                [role]: newPermissions,
            };
        });
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        showSpinner();
        try {
            // Identify which roles have changed
            const changedRoles = Object.keys(rolePermissions).filter(
                role => JSON.stringify(rolePermissions[role].sort()) !==
                    JSON.stringify((initialPermissions[role] || []).sort())
            );

            if (changedRoles.length === 0) {
                showSnackbar("No changes to save", "info");
                setIsEditing(false);
                return;
            }

            // Save permissions for each changed role
            const updatePromises = changedRoles.map(async (role) => {
                const permissions = rolePermissions[role] || [];
                const response = await permissionService.updateRolePermissions(
                    role,
                    permissions,
                    { tenantId: tenantId }
                );
                return { role, response };
            });

            const results = await Promise.all(updatePromises);

            // Check for any failures
            const failed = results.filter(r => !r.response.success);
            if (failed.length > 0) {
                const failedRoles = failed.map(r => r.role).join(", ");
                showSnackbar(`Failed to update permissions for: ${failedRoles}`, "error");
                // Revert to initial state
                setRolePermissions(initialPermissions);
            } else {
                setInitialPermissions(rolePermissions);
                setIsEditing(false);
                showSnackbar("Permissions updated successfully!", "success");
            }
        } catch (error) {
            showSnackbar("Failed to save permissions. Please try again.", "error");
            // Revert to initial state
            setRolePermissions(initialPermissions);
        } finally {
            hideSpinner();
            setLoading(false);
        }
    };

    const handleCancelChanges = () => {
        setRolePermissions(initialPermissions);
        setIsEditing(false);
    };

    const handleAddRole = () => {
        if (!newRoleName.trim()) {
            showSnackbar("Please enter a role name", "warning");
            return;
        }

        const roleKey = newRoleName.toUpperCase().replace(/\s/g, "_");
        if (rolePermissions[roleKey]) {
            showSnackbar("Role already exists", "warning");
            return;
        }

        setRolePermissions(prev => ({
            ...prev,
            [roleKey]: [],
        }));
        setNewRoleName("");
        setOpenDialog(false);
        showSnackbar(`Role "${roleKey}" created successfully!`, "success");
    };

    const handleDeleteRole = async (role: string) => {
        if (role in ROLES) {
            showSnackbar(`Cannot delete default role "${role}"`, "warning");
            return;
        }

        try {
            const response = await permissionService.updateRolePermissions(
                role,
                [],
                { tenantId: tenantId }
            );

            if (response.success) {
                setRolePermissions(prev => {
                    const newPermissions = { ...prev };
                    delete newPermissions[role];
                    return newPermissions;
                });
                showSnackbar(`Role "${role}" deleted successfully!`, "success");
            } else {
                showSnackbar(`Failed to delete role "${role}"`, "error");
            }
        } catch (error) {
            showSnackbar("Failed to delete role", "error");
        }
    };

    const isPermissionInRole = (role: string, permission: string): boolean => {
        return (rolePermissions[role] || []).includes(permission);
    };

    const getGroupCompletion = (role: string, groupPermissions: string[]): number => {
        const currentPermissions = rolePermissions[role] || [];
        const count = groupPermissions.filter(p => currentPermissions.includes(p)).length;
        return (count / groupPermissions.length) * 100;
    };

    const getRoleColor = (role: string) => {
        return ROLE_COLORS[role] || { bg: "#f3f4f6", color: "#6b7280" };
    };

    const filteredRoles = getSortedRoles(roles);

    if (!isAdmin) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    You don't have permission to access this page. This page is restricted to ADMIN users.
                </Alert>
            </Box>
        );
    }

    return (
        <div className="bg-white-50">
            {/* Header */}
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                        <Typography variant="h5" className="text-gray-800 !font-bold">
                            Permission Settings
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 !mt-1">
                            Manage role-based permissions for the entire platform
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon fontSize="small" className="text-gray-500" />}
                                    onClick={handleCancelChanges}
                                    size="small"
                                    className="!text-gray-800 !border-gray-200"
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                                    onClick={handleSaveChanges}
                                    disabled={loading}
                                    size="small"
                                    className="!bg-primary"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon fontSize="small" />}
                                    onClick={loadPermissions}
                                    size="small"
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon fontSize="small" />}
                                    onClick={() => setIsEditing(true)}
                                    size="small"
                                    className="!bg-primary"
                                >
                                    Edit Permissions
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ py: 1 }}>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{
                            borderRadius: 1,
                            boxShadow: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha("#3b82f6", 0.04),
                        }}>
                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography variant="caption" className="text-gray-500">
                                            Total Roles
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#3b82f6" }}>
                                            {roles.length}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: alpha("#3b82f6", 0.1),
                                        color: "#3b82f6"
                                    }}>
                                        <AssignmentIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{
                            borderRadius: 1,
                            boxShadow: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha("#10b981", 0.04),
                        }}>
                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography variant="caption" className="text-gray-500">
                                            Total Permissions
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981" }}>
                                            {PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: alpha("#10b981", 0.1),
                                        color: "#10b981"
                                    }}>
                                        <LockIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{
                            borderRadius: 1,
                            boxShadow: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha("#8b5cf6", 0.04),
                        }}>
                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography variant="caption" className="text-gray-500">
                                            Permission Groups
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#8b5cf6" }}>
                                            {PERMISSION_GROUPS.length}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: alpha("#8b5cf6", 0.1),
                                        color: "#8b5cf6"
                                    }}>
                                        <ShieldIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{
                            borderRadius: 1,
                            boxShadow: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha(isEditing ? "#f59e0b" : "#10b981", 0.04),
                        }}>
                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography variant="caption" className="text-gray-500">
                                            Status
                                        </Typography>
                                        <Typography variant="h6" className="!text-[10px]" sx={{ fontWeight: 700, color: isEditing ? "#f59e0b" : "#10b981" }}>
                                            {isEditing ? "Editing" : "Viewing"}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: alpha(isEditing ? "#f59e0b" : "#10b981", 0.1),
                                        color: isEditing ? "#f59e0b" : "#10b981"
                                    }}>
                                        {isEditing ? <EditIcon sx={{ fontSize: 16 }} /> : <SecurityIcon sx={{ fontSize: 16 }} />}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Permission Matrix */}
            <Box sx={{
                flex: 1,
                overflow: "hidden",
            }}>
                <TableContainer className="bg-white-50 border border-gray-200" sx={{ height: "calc(100vh - 350px)" }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    className="!sticky !z-30 left-0 bg-white"
                                    sx={{
                                        minWidth: 200,
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Role / Permission
                                    </Typography>
                                </TableCell>
                                {filteredRoles.map((role) => {
                                    const colors = getRoleColor(role);
                                    return (
                                        <TableCell
                                            key={role}
                                            align="center"
                                            className="!sticky !z-30"
                                            sx={{
                                                minWidth: 140,
                                                position: "relative",
                                            }}
                                        >
                                            <Box sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 0.5,
                                            }}>
                                                <Box sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    bgcolor: colors.bg,
                                                    color: colors.color,
                                                }}>
                                                    <Typography variant="body2" className="!text-[10px]" sx={{ fontWeight: 600 }}>
                                                        {role}
                                                    </Typography>
                                                </Box>
                                                {isEditing && role in ROLES && (
                                                    <Chip
                                                        label="Default"
                                                        size="small"
                                                        variant="outlined"
                                                        className="!text-gray-800"
                                                        sx={{ fontSize: "8px", height: 16 }}
                                                    />
                                                )}
                                                {isEditing && !(role in ROLES) && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteRole(role)}
                                                        color="error"
                                                        sx={{ position: "absolute", top: -4, right: -4 }}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {PERMISSION_GROUPS.map((group) => (
                                <>
                                    {/* Group Header */}
                                    <TableRow className="bg-gray-200">
                                        <TableCell
                                            colSpan={filteredRoles.length + 1}
                                            className="!sticky left-0 z-20 bg-gray-200"
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography className="text-gray-800" sx={{ fontWeight: 600 }}>
                                                    {group.group}
                                                </Typography>
                                                <Chip
                                                    label={group.description}
                                                    size="small"
                                                    variant="outlined"
                                                    className="text-gray-800"
                                                    sx={{ fontSize: "9px", height: 18 }}
                                                />
                                                <Chip
                                                    label={`${group.permissions.length} permissions`}
                                                    size="small"
                                                    color="warning"
                                                    sx={{ fontSize: "9px", height: 18 }}
                                                />
                                            </Box>
                                        </TableCell>
                                    </TableRow>

                                    {/* Group Permissions */}
                                    {group.permissions.map((permission, permIndex) => (
                                        <TableRow
                                            key={permission}
                                            sx={getRowColor(permIndex)}
                                        >
                                            <TableCell
                                                className="sticky left-0 z-10"
                                            >
                                                <Typography variant="caption" className="text-gray-800" sx={{
                                                    fontSize: "0.75rem",
                                                    fontFamily: "monospace",
                                                }}>
                                                    {permission.replace(/_/g, " ")}
                                                </Typography>
                                            </TableCell>
                                            {filteredRoles.map((role) => {
                                                const isChecked = isPermissionInRole(role, permission);
                                                return (
                                                    <TableCell
                                                        key={`${role}-${permission}`}
                                                        align="center"
                                                        sx={{
                                                            py: 0.5,
                                                            borderBottom: "none",
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onChange={() => handlePermissionToggle(role, permission)}
                                                            disabled={!isEditing || loading}
                                                            size="small"
                                                            sx={{
                                                                color: isChecked ? "primary.main" : "grey.400",
                                                                "&.Mui-disabled": {
                                                                    color: isChecked ? "primary.light" : "grey.300",
                                                                },
                                                                p: 0.5,
                                                            }}
                                                        />
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}

                                    {/* Group Actions Row */}
                                    {isEditing && (
                                        <TableRow className="bg-blue-100">
                                            <TableCell
                                                className="sticky left-0 z-10 bg-blue-100"
                                                sx={{
                                                    py: 0.5,
                                                    px: 2,
                                                    borderBottom: "none",
                                                    backgroundColor: "#dbeafe",
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                                                    Group Actions
                                                </Typography>
                                            </TableCell>
                                            {filteredRoles.map((role) => {
                                                const completion = getGroupCompletion(role, group.permissions);
                                                const allChecked = completion === 100;
                                                const someChecked = completion > 0 && completion < 100;
                                                const noChecked = completion === 0;

                                                return (
                                                    <TableCell
                                                        key={`${role}-action`}
                                                        align="center"
                                                        sx={{
                                                            py: 0.5,
                                                            borderBottom: "none",
                                                        }}
                                                    >
                                                        <Tooltip 
                                                            title={
                                                                allChecked 
                                                                    ? "Remove all permissions in this group" 
                                                                    : noChecked 
                                                                    ? "Add all permissions in this group"
                                                                    : "Toggle all permissions in this group"
                                                            }
                                                        >
                                                            <Button
                                                                size="small"
                                                                variant={someChecked || allChecked ? "outlined" : "text"}
                                                                onClick={() => handleGroupToggle(role, group.permissions)}
                                                                disabled={loading}
                                                                sx={{
                                                                    fontSize: "0.6rem",
                                                                    textTransform: "none",
                                                                    minWidth: 32,
                                                                    py: 0.25,
                                                                    px: 1,
                                                                    color: someChecked ? "primary.main" : allChecked ? "error.main" : "text.secondary",
                                                                    borderColor: someChecked ? "primary.main" : allChecked ? "error.main" : "transparent",
                                                                    "&:hover": {
                                                                        borderColor: someChecked ? "primary.main" : allChecked ? "error.main" : "grey.300",
                                                                    }
                                                                }}
                                                            >
                                                                {allChecked ? "All ✓" : noChecked ? "None" : `${Math.round(completion)}%`}
                                                            </Button>
                                                        </Tooltip>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Add Role Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="h6">Add New Role</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            label="Role Name"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            fullWidth
                            size="medium"
                            placeholder="e.g., SUPER_ADMIN, DEPARTMENT_HEAD"
                            helperText="Role name will be converted to uppercase with underscores"
                            sx={{ mb: 2 }}
                        />
                        <Alert severity="info" sx={{ mt: 1 }}>
                            New roles will have no permissions by default. You can assign permissions in the table above.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddRole} variant="contained" sx={{ textTransform: "none" }}>
                        Add Role
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}