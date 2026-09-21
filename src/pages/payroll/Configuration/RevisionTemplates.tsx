import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { salaryRevisionService, type RevisionTemplate, type RevisionTemplateType } from "../../../services/modules/payrollServices/salaryRevision";
import { CloseOutlined, DeleteOutlineOutlined } from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";

const EMPTY: Partial<RevisionTemplate> = {
    name: "",
    type: "PERCENT",
    config: { percent: 10, roundingRule: "NEAREST_100" },
};

export default function RevisionTemplates() {
    const [rows, setRows] = useState<RevisionTemplate[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Partial<RevisionTemplate>>(EMPTY);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { hideSpinner, showSpinner, showSnackbar } = useUI()

    const load = async () => {
        showSpinner();
        try {
            const res: any = await salaryRevisionService.getTemplates();
            setRows(res.data || []);
        } catch (err) {
            showSnackbar("Failed to load templates", "error");
            setRows([
                {
                    id: "t1",
                    name: "Standard 10%",
                    type: "PERCENT",
                    config: { percent: 10, roundingRule: "NEAREST_100" },
                },
                {
                    id: "t2",
                    name: "Flat ₹5000",
                    type: "FLAT",
                    config: { flatAmount: 5000, roundingRule: "NEAREST_100" },
                },
                {
                    id: "t3",
                    name: "Slab Based FY26",
                    type: "SLAB",
                    config: {
                        slabs: [
                            { from: 0, to: 500000, percent: 12 },
                            { from: 500001, to: 1000000, percent: 10 },
                            { from: 1000001, to: Number.MAX_SAFE_INTEGER, percent: 8 },
                        ],
                        minIncrement: 5000,
                        maxIncrement: 200000,
                        roundingRule: "NEAREST_100",
                    },
                },
            ] as any);
        } finally {
            hideSpinner();
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setForm(EMPTY);
        setEditingId(null);
        setOpen(true);
    };

    const openEdit = (row: RevisionTemplate) => {
        setForm(row);
        setEditingId(row.id);
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.name) {
            alert("Template name required");
            return;
        }
        try {
            if (editingId) {
                await salaryRevisionService.updateTemplate(editingId, form);
            } else {
                await salaryRevisionService.createTemplate(form);
            }
            setOpen(false);
            load();
        } catch (err) {
            showSnackbar("Save failed (using local state)", "error");
            if (editingId) {
                setRows((prev) =>
                    prev.map((r) =>
                        r.id === editingId ? ({ ...r, ...form } as any) : r
                    )
                );
            } else {
                setRows((prev) => [
                    ...prev,
                    { ...(form as any), id: `local-${Date.now()}` },
                ]);
            }
            setOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this template?")) return;
        try {
            await salaryRevisionService.deleteTemplate(id);
            load();
        } catch (err) {
            showSnackbar("Delete failed (local removal)", "error");
            setRows((prev) => prev.filter((r) => r.id !== id));
        }
    };

    const renderConfigSummary = (t: RevisionTemplate) => {
        if (t.type === "PERCENT") return `${t.config.percent}%`;
        if (t.type === "FLAT") return `₹ ${t.config.flatAmount?.toLocaleString("en-IN")}`;
        if (t.type === "SLAB") return `${t.config.slabs?.length || 0} slabs`;
        return "-";
    };

    return (
        <Box>
            <Box className="flex justify-between items-center mb-4">
                <div>
                    <div className="text-[12px] font-bold text-gray-800">Revision Templates</div>
                    <span className="text-[12px] text-gray-500">
                        Predefined rules used when creating salary revisions
                    </span>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    className="!bg-primary !text-white !text-xs"
                    onClick={openCreate}
                >
                    New Template
                </Button>
            </Box>

            <Table size="small" className="border border-gray-200 rounded-md">
                <TableHead className="!bg-gray-50">
                    <TableRow>
                        <TableCell className="!text-xs !font-semibold">S No</TableCell>
                        <TableCell className="!text-xs !font-semibold">Name</TableCell>
                        <TableCell className="!text-xs !font-semibold">Type</TableCell>
                        <TableCell className="!text-xs !font-semibold">Config</TableCell>
                        <TableCell className="!text-xs !font-semibold">Rounding</TableCell>
                        <TableCell className="!text-xs !font-semibold">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((t, i) => (
                        <TableRow key={t.id} sx={getRowColor(i)}>
                            <TableCell className="!text-xs">{i+1}</TableCell>
                            <TableCell className="!text-xs">{t.name}</TableCell>
                            <TableCell className="!text-xs">
                                <Chip label={t.type} size="small" variant="outlined" className="text-gray-800" />
                            </TableCell>
                            <TableCell className="!text-xs">{renderConfigSummary(t)}</TableCell>
                            <TableCell className="!text-xs">
                                {t.config.roundingRule || "NONE"}
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => openEdit(t)}>
                                        <EditOutlinedIcon fontSize="small" className="text-blue-500 !w-4" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        className="!text-red-500"
                                        onClick={() => handleDelete(t.id)}
                                    >
                                        <DeleteOutlineOutlined fontSize="small" className="!w-4" />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!rows.length && (
                        <TableRow>
                            <TableCell colSpan={5} align="center" className="!py-6 !text-xs !text-gray-500">
                                No templates yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <div className="p-2 flex items-center justify-between !text-[12px] border-b border-gray-200">
                    <div className="ml-4">{editingId ? "Edit Template" : "New Template"}</div>
                    <IconButton onClick={() => setOpen(false)}>
                        <CloseOutlined className="!w-4 text-gray-800 cursor-pointer" />
                    </IconButton>
                </div>
                <DialogContent className="!grid !gap-6 !p-4">
                    <TextField
                        label="Name"
                        value={form.name || ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Type"
                        select
                        value={form.type || "PERCENT"}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                type: e.target.value as RevisionTemplateType,
                                config: { roundingRule: "NEAREST_100" },
                            })
                        }
                        fullWidth
                    >
                        <MenuItem value="PERCENT">PERCENT</MenuItem>
                        <MenuItem value="FLAT">FLAT</MenuItem>
                        <MenuItem value="SLAB">SLAB</MenuItem>
                        <MenuItem value="CTC_BASED">CTC_BASED</MenuItem>
                    </TextField>

                    {form.type === "PERCENT" && (
                        <TextField
                            label="Percent (%)"
                            type="number"
                            value={form.config?.percent || 0}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    config: { ...form.config, percent: Number(e.target.value) },
                                })
                            }
                            fullWidth
                        />
                    )}

                    {form.type === "FLAT" && (
                        <TextField
                            label="Flat Amount"
                            type="number"
                            value={form.config?.flatAmount || 0}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    config: { ...form.config, flatAmount: Number(e.target.value) },
                                })
                            }
                            fullWidth
                        />
                    )}

                    {form.type === "SLAB" && (
                        <div className="text-xs text-gray-500">
                            Slab config handled by backend. Default slab percentages will apply.
                        </div>
                    )}

                    <TextField
                        label="Rounding Rule"
                        size="small"
                        select
                        value={form.config?.roundingRule || "NONE"}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                config: {
                                    ...form.config,
                                    roundingRule: e.target.value as any,
                                },
                            })
                        }
                        fullWidth
                    >
                        <MenuItem value="NONE">NONE</MenuItem>
                        <MenuItem value="NEAREST_100">NEAREST 100</MenuItem>
                        <MenuItem value="NEAREST_1000">NEAREST 1000</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions className="!p-4 !border-t border-gray-200">
                    <Button size="small" className="!text-gray-800 !border-gray-200" variant="outlined" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        className="!bg-primary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}