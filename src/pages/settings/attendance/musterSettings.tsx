import { useState, useEffect } from "react";
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Popover,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { SketchPicker, type ColorResult } from "react-color";
import { getCurrentRouteLabel } from "../const";
import { useUI } from "../../../context/Snackbar";
import { getRowColor, handleEnterAsTab } from "../../const";
import { musterService, type MusterSetting, type MusterSettingPayload } from "../../../services/modules/muster";

export default function MusterSettings() {
    const [musterData, setMusterData] = useState<MusterSetting[]>([]);
    const { showSnackbar, showSpinner, hideSpinner } = useUI();

    // --- Dialog State ---
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSetting, setEditingSetting] = useState<MusterSetting | null>(null);
    const [formData, setFormData] = useState<Partial<MusterSetting>>({
        status: "",
        musterType: "",
        specification: "",
        sequence: 0,
        color: "",
        active: true,
    });
    

    // --- Color Picker State ---
    const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
    const openColorPicker = Boolean(colorAnchorEl);

    // --- Fetch List ---
    const getMusterSettings = async () => {
        showSpinner();
        try {
            const data = await musterService.getMusterSettings();
            setMusterData(data || []);
        } catch (error: any) {
            showSnackbar(error.message, "error");
        } finally {
            hideSpinner();
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            getMusterSettings();
        });
    }, []);

    // --- Open Dialog ---
    const handleOpenDialog = async (setting?: MusterSetting) => {
        if (setting) {
            showSpinner();
            try {
                const detail = await musterService.getMusterSettingById(setting.id);
                if (detail) {
                    setEditingSetting(detail);
                    setFormData({
                        id: detail.id,
                        status: detail.status,
                        musterType: detail.musterType,
                        specification: detail.specification,
                        sequence: detail.sequence,
                        color: detail.color,
                        active: detail.active,
                    });
                } else {
                    setEditingSetting(setting);
                    setFormData(setting);
                }
            } catch (error: any) {
                showSnackbar(error.message, "error");
                setEditingSetting(setting);
                setFormData(setting);
            } finally {
                hideSpinner();
            }
        } else {
            setEditingSetting(null);
            setFormData({
                status: "",
                musterType: "",
                specification: "",
                sequence: musterData.length + 1,
                color: "#1976d2", // default pick color
                active: true,
            });
        }
        setOpenDialog(true);
    };

    // --- Close Dialog ---
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSetting(null);
        setColorAnchorEl(null);
        setFormData({
            status: "",
            musterType: "",
            specification: "",
            sequence: 0,
            color: "",
            active: true,
        });
    };

    // --- Input Change ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // --- Color Picker Handlers ---
    const handleOpenColorPicker = (e: React.MouseEvent<HTMLElement>) => {
        setColorAnchorEl(e.currentTarget);
    };

    const handleCloseColorPicker = () => {
        setColorAnchorEl(null);
    };

    const handleColorChange = (color: ColorResult) => {
        setFormData((prev) => ({
            ...prev,
            color: color.hex,
        }));
    };

    // --- Save (Create / Update) ---
    const handleSave = async () => {
        if (!formData.musterType || !formData.specification) {
            showSnackbar("Please fill all required fields", "error");
            return;
        }
        showSpinner();
        try {
            const payload: MusterSettingPayload = {
                status: formData.status || "",
                musterType: formData.musterType || "",
                specification: formData.specification || "",
                sequence: formData.sequence ?? 0,
                color: formData.color || "",
                active: formData.active ?? true,
            };

            if (editingSetting) {
                const res: any = await musterService.updateMusterSetting(editingSetting.id, payload);
                showSnackbar(res?.message || "Updated successfully", "success");
            } else {
                const res: any = await musterService.createMusterSetting(payload);
                showSnackbar(res?.message || "Created successfully", "success");
            }
            await getMusterSettings();
            handleCloseDialog();
        } catch (error: any) {
            showSnackbar(error.message, "error");
        } finally {
            hideSpinner();
        }
    };

    const commonsx = {
        "& .MuiDialog-paper": {
            width: "500px",
            maxWidth: "500px",
        },
    };

    return (
        <>
            {/* --- Page Header --- */}
            <div className="flex justify-between items-center mt-3 mb-3">
                <div className="text-gray-500 text-sm flex items-center gap-1">
                    Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
                    <span className="text-primary font-medium">
                        {getCurrentRouteLabel() || "Muster Roll Master"}
                    </span>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="!w-[500px]">
                <TableContainer className="h-[calc(100vh-220px)] overflow-auto ">
                    <Table stickyHeader className="border border-gray-200 bg-white-50 rounded-sm">
                        <TableHead className="bg-gray-100">
                            <TableRow>
                                <TableCell className="!font-bold">S No</TableCell>
                                <TableCell className="!font-bold">Muster Type</TableCell>
                                <TableCell className="!font-bold">Muster Specification</TableCell>
                                <TableCell align="center" className="!font-bold">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {musterData.map((row, index) => (
                                <TableRow key={row.id} sx={getRowColor(index)}>
                                    <TableCell className="font-medium text-gray-800">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {row.color && (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: 14,
                                                        height: 14,
                                                        borderRadius: 4,
                                                        background: row.color,
                                                        border: "1px solid #d1d5db",
                                                    }}
                                                />
                                            )}
                                            {row.musterType}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-mono">
                                        {row.specification}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                className="!mr-2"
                                                onClick={() => handleOpenDialog(row)}
                                            >
                                                <EditIcon className="!w-4 text-blue-500" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {musterData.length === 0 && (
                        <div className="bg-white-50 border border-gray-200 text-gray-800 text-center py-8">
                            No muster settings found
                        </div>
                    )}
                </TableContainer>
            </div>

            {/* --- Add/Edit Dialog --- */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                sx={commonsx}
            >
                <div className="flex items-center justify-between p-2 border-b border-gray-300">
                    <div className="text-gray-800 ml-4 text-[12px] font-semibold">
                        {editingSetting ? "Edit Muster Type" : "Add New Muster Type"}
                    </div>
                    <IconButton onClick={handleCloseDialog}>
                        <CloseOutlined className="!text-gray-800" />
                    </IconButton>
                </div>

                <DialogContent>
                    <div className="grid gap-5 mt-2" onKeyDown={handleEnterAsTab}>
                        <div>
                            <TextField
                                fullWidth
                                label="Muster Type"
                                name="musterType"
                                value={formData.musterType || ""}
                                onChange={handleInputChange}
                                disabled={!!editingSetting}
                                required
                            />
                        </div>
                        <div>
                            <TextField
                                fullWidth
                                label="Muster Specification"
                                name="specification"
                                value={formData.specification || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {/* --- Color Picker Field --- */}
                        <div>
                            <TextField
                                fullWidth
                                label="Color"
                                name="color"
                                value={formData.color || ""}
                                onClick={handleOpenColorPicker}
                                
                            />
                            <Popover
                                open={openColorPicker}
                                anchorEl={colorAnchorEl}
                                onClose={handleCloseColorPicker}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "left",
                                }}
                            >
                                <SketchPicker
                                    color={formData.color || "#1976d2"}
                                    onChangeComplete={handleColorChange}
                                    disableAlpha
                                />
                            </Popover>
                        </div>

                        {/* Read-only context fields (populated from GET /{id}) */}
                        {editingSetting && (
                            <div className="grid grid-cols-2 gap-4">
                                <TextField
                                    label="Status"
                                    value={formData.status || ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Sequence"
                                    value={formData.sequence ?? ""}
                                    disabled
                                    fullWidth
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>

                <DialogActions className="!p-4 !border-t !border-gray-300">
                    <Button
                        onClick={handleCloseDialog}
                        variant="outlined"
                        className="!text-gray-800 !border-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        className="!bg-primary"
                    >
                        {editingSetting ? "Update" : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}