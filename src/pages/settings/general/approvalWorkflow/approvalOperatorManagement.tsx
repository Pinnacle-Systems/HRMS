import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Add as AddIcon,
    CloseOutlined,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
    approvalWorkflowService,
    type ApprovalOperator,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";

const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
                return data.message;
            }
        }
    }
    return error instanceof Error ? error.message : fallback;
};

interface FormState {
    id?: string;
    symbol: string;
    label: string;
    active: boolean;
}

const EMPTY_FORM: FormState = {
    symbol: "",
    label: "",
    active: true,
};

export default function ApprovalOperatorManagement() {
    const { showSnackbar,showSpinner,hideSpinner,showConfirmDialog } = useUI();
    const [saving, setSaving] = useState(false);
    const [operators, setOperators] = useState<ApprovalOperator[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const loadOperators = async () => {
        showSpinner();
        try {
            const res = await approvalWorkflowService.getOperators();
            setOperators(res.data);
        } catch (error) {
            showSnackbar(getErrorMessage(error, "Failed to load operators."), "error");
        } finally {
            hideSpinner();
        }
    };

    useEffect(() => {
        void loadOperators();
    }, []);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (o: ApprovalOperator) => {
        setForm({ id: o.id, symbol: o.symbol, label: o.label, active: o.active });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.symbol.trim() || !form.label.trim()) {
            showSnackbar("Symbol and label are required.", "warning");
            return;
        }
        setSaving(true);
        try {
            if (form.id) {
                await approvalWorkflowService.updateOperator(form.id, {
                    symbol: form.symbol,
                    label: form.label,
                    active: form.active,
                });
                showSnackbar("Operator updated.", "success");
            } else {
                await approvalWorkflowService.createOperator({
                    symbol: form.symbol,
                    label: form.label,
                    active: form.active,
                });
                showSnackbar("Operator created.", "success");
            }
            setDialogOpen(false);
            await loadOperators();
        } catch (error) {
            showSnackbar(getErrorMessage(error, "Failed to save operator."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (o: ApprovalOperator) => {
        showConfirmDialog({
            title: "Delete Operator",
            message: `Delete operator "${o.label}"? This cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                showSpinner();
                try {
                    await approvalWorkflowService.deleteOperator(o.id);
                    showSnackbar("Operator deleted.", "success");
                    await loadOperators();
                } catch (error) {
                    showSnackbar(getErrorMessage(error, "Failed to delete operator."), "error");
                } finally {
                    hideSpinner();
                }
            },
        });

    };

    return (
        <Box className="space-y-4">
            <div className="flex bg-white items-center justify-between gap-4 rounded-md p-2">
                <Box className="flex items-center gap-3">
                    <Typography variant="h6" className="!font-bold">Approval Operators</Typography>
                    <Chip label={`${operators.length} total`} size="small" className="!text-primary !border-primary" variant="outlined" />
                </Box>
                <Box className="flex items-center gap-2">
                    <Button variant="contained" className="!bg-primary" startIcon={<AddIcon />} onClick={openCreate}>
                        New Operator
                    </Button>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadOperators}>
                            <RefreshIcon className="!text-gray-800" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </div>

            <div className="rounded-md">
                {/* {loading ? (
                    <Alert severity="info">Loading operators...</Alert>
                ) : ( */}
                    <TableContainer className="rounded-md bg-white border border-gray-200 max-h-[calc(100vh-300px)] overflow-auto">
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell className="!font-bold" width="50px">#</TableCell>
                                    <TableCell className="!font-bold" width="140px">Symbol</TableCell>
                                    <TableCell className="!font-bold">Label</TableCell>
                                    <TableCell className="!font-bold" width="120px">Status</TableCell>
                                    <TableCell className="!font-bold" width="140px" align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {operators.map((o, idx) => (
                                    <TableRow key={o.id} sx={getRowColor(idx)}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                            <Chip label={o.symbol} size="small" className="!text-primary !border-primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell className="!font-medium">{o.label}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={o.active ? "Active" : "Inactive"}
                                                size="small"
                                                color={o.active ? "success" : "default"}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => openEdit(o)}>
                                                <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(o)}>
                                                <DeleteIcon fontSize="small" className="!w-4" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {operators.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                            No operators configured yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                {/* )} */}
            </div>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle className="flex items-center justify-between !p-2 !border-b border-gray-200">
                    <div className="ml-4">{form.id ? "Edit Operator" : "New Operator"}</div>
                    <IconButton onClick={() => setDialogOpen(false)}>
                        <CloseOutlined className="!w-4 !text-gray-800" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box className="space-y-6 pt-2">
                        <TextField
                            label="Symbol"
                            required
                            fullWidth
                            placeholder="e.g. =, >, <, >=, <="
                            value={form.symbol}
                            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                        />
                        <TextField
                            label="Label"
                            required
                            fullWidth
                            placeholder="e.g. Equals, Greater Than"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    color="success"
                                />
                            }
                            label={form.active ? "Active" : "Inactive"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions className="!border-t !border-gray-200">
                    <Button onClick={() => setDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200" disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} className="!bg-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}