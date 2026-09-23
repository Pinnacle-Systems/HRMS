import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TextField,
} from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import {
    salaryRevisionService,
    type SalaryRevision,
} from "../../../services/modules/payrollServices/salaryRevision";
import { statusColor } from "../const";
import { getRowColor } from "../../const";
import { ArrowLeftIcon } from "@mui/x-date-pickers";
import { useUI } from "../../../context/Snackbar";

export default function RevisionDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [data, setData] = useState<SalaryRevision | null>(null);
    const [remarks, setRemarks] = useState("");
    const {
        showSpinner,
        showSnackbar,
        hideSpinner,
        showConfirmDialog,
    } = useUI();

    // ────────────────────────────────────────────────────────
    // Load
    // ────────────────────────────────────────────────────────
    const load = async () => {
        if (!id) return;
        showSpinner();
        try {
            const res: any = await salaryRevisionService.getRevisionById(id);
            setData(res.data);
        } catch (err) {
            showSnackbar("Failed to load revision details", "error");
        } finally {
            hideSpinner();
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!data) {
        return <div className="text-xs text-gray-500">Not found.</div>;
    }

    // ────────────────────────────────────────────────────────
    // Approve
    // ────────────────────────────────────────────────────────
    const handleApprove = () => {
        if (!data) return;

        showConfirmDialog({
            title: "Approve Revision",
            message: `Approve "${data.title}"?\n\nThis will move it to APPROVED status. You'll then be able to apply it to payroll.`,
            confirmText: "Approve",
            cancelText: "Cancel",
            variant: "success",
            onConfirm: async () => {
                showSpinner();
                try {
                    await salaryRevisionService.approveRevision(
                        data.id,
                        remarks
                    );
                    showSnackbar("Revision approved", "success");
                    load();
                } catch (err: any) {
                    showSnackbar(
                        err?.response?.data?.message || "Failed to approve",
                        "error"
                    );
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ────────────────────────────────────────────────────────
    // Reject
    // ────────────────────────────────────────────────────────
    const handleReject = () => {
        if (!data) return;

        const reason = remarks?.trim();
        if (!reason || reason.length < 5) {
            showSnackbar(
                "Please enter a rejection reason (min 5 chars) before rejecting",
                "warning"
            );
            return;
        }

        showConfirmDialog({
            title: "Reject Revision",
            message: `Reject "${data.title}"?\n\nReason: ${reason}`,
            confirmText: "Reject",
            cancelText: "Cancel",
            variant: "danger",
            onConfirm: async () => {
                showSpinner();
                try {
                    await salaryRevisionService.rejectRevision(
                        data.id,
                        reason
                    );
                    showSnackbar("Revision rejected", "success");
                    load();
                } catch (err: any) {
                    showSnackbar(
                        err?.response?.data?.message || "Failed to reject",
                        "error"
                    );
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ────────────────────────────────────────────────────────
    // Apply to Payroll
    // ────────────────────────────────────────────────────────
    const handleApply = () => {
        if (!data) return;

        showConfirmDialog({
            title: "Apply Revision to Payroll",
            message:
                `Apply this revision to payroll?\n\n` +
                `• Employees affected: ${data.totalEmployees}\n` +
                `• Effective from: ${formatDate(data.effectiveFrom)}\n` +
                `• Total cost: ₹ ${data.totalIncrementCost.toLocaleString("en-IN")}\n\n` +
                `This will update employee salary records and cannot be undone.`,
            confirmText: "Apply",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                showSpinner();
                try {
                    await salaryRevisionService.applyRevision(data.id);
                    showSnackbar("Revision applied to payroll", "success");
                    load();
                } catch (err: any) {
                    showSnackbar(
                        err?.response?.data?.message ||
                        "Failed to apply revision",
                        "error"
                    );
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ────────────────────────────────────────────────────────
    // Submit Draft
    // ────────────────────────────────────────────────────────
    const handleSubmitDraft = () => {
        if (!data) return;

        showConfirmDialog({
            title: "Submit for Approval",
            message:
                `Submit "${data.title}" for approval?\n\n` +
                `• Employees: ${data.totalEmployees}\n` +
                `• Total cost: ₹ ${data.totalIncrementCost.toLocaleString("en-IN")}\n\n` +
                `After submission, it can no longer be edited.`,
            confirmText: "Submit",
            cancelText: "Cancel",
            variant: "success",
            onConfirm: async () => {
                showSpinner();
                try {
                    await salaryRevisionService.submitForApproval(data.id);
                    showSnackbar("Revision submitted for approval", "success");
                    load();
                } catch (err: any) {
                    showSnackbar(
                        err?.response?.data?.message ||
                        "Failed to submit revision",
                        "error"
                    );
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ────────────────────────────────────────────────────────
    // Delete Draft
    // ────────────────────────────────────────────────────────
    const handleDeleteDraft = () => {
        if (!data) return;

        showConfirmDialog({
            title: "Delete Draft",
            message: `Delete draft "${data.title}"?\n\nThis action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
            onConfirm: async () => {
                showSpinner();
                try {
                    await salaryRevisionService.deleteRevision(data.id);
                    showSnackbar("Draft deleted", "success");
                    navigate("/payroll/revision");
                } catch (err: any) {
                    showSnackbar(
                        err?.response?.data?.message ||
                        "Failed to delete draft",
                        "error"
                    );
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ────────────────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────────────────
    return (
        <Box>
            <Box className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <IconButton
                        onClick={() => navigate("/payroll/revision")}
                        sx={{
                            border: `1px solid var(--border-color)`,
                            borderRadius: 1,
                        }}
                    >
                        <ArrowLeftIcon
                            fontSize="small"
                            className="text-gray-500"
                        />
                    </IconButton>
                    <div>
                        <div className="font-bold text-[12px] text-gray-800">
                            {data.title}
                        </div>
                        <div className="text-[12px] text-gray-500">
                            {data.revisionCode} • Effective{" "}
                            {formatDate(data.effectiveFrom)}
                        </div>
                    </div>
                </div>

                <Box className="flex gap-2 items-center">
                    <Chip
                        label={data.status.replace(/_/g, " ")}
                        color={statusColor[data.status]}
                        className={`${data.status == 'DRAFT' ? 'text-gray-800 bg-gray-200' : ''}`}
                    />

                    {data.status === "PENDING_APPROVAL" && (
                        <>
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={handleApprove}
                            >
                                Approve
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={handleReject}
                            >
                                Reject
                            </Button>
                        </>
                    )}

                    {data.status === "APPROVED" && (
                        <Button
                            size="small"
                            variant="contained"
                            className="!bg-primary"
                            onClick={handleApply}
                        >
                            Apply to Payroll
                        </Button>
                    )}

                    {data.status === "DRAFT" && (
                        <>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={handleDeleteDraft}
                            >
                                Delete
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                className="!text-gray-800"
                                onClick={() =>
                                    navigate(
                                        `/payroll/revision/edit/${data.id}`
                                    )
                                }
                            >
                                Edit
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                className="!bg-primary"
                                onClick={handleSubmitDraft}
                            >
                                Submit for Approval
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Paper className="!shadow-sm !bg-white">
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    className="border-b border-gray-200"
                    sx={{
                        "& .MuiTabs-indicator": {
                            backgroundColor: "var(--color-primary)",
                            height: 3,
                            borderRadius: "3px 3px 0 0",
                        },
                    }}
                >
                    <Tab label="Summary" className="!text-gray-800" />
                    <Tab
                        label="Employee Revisions"
                        className="!text-gray-800"
                    />
                    <Tab
                        label="Component Breakdown"
                        className="!text-gray-800"
                    />
                </Tabs>

                {tab === 0 && (
                    <Box className="!p-4 grid grid-cols-3 gap-4 text-xs">
                        <div className="text-gray-800">
                            <b>Reason:</b> {data.reason.replace(/_/g, " ")}
                        </div>
                        <div className="text-gray-800">
                            <b>Employees:</b> {data.totalEmployees}
                        </div>
                        <div className="text-gray-800">
                            <b>Total Cost:</b> ₹{" "}
                            {data.totalIncrementCost.toLocaleString("en-IN")}
                        </div>
                        <div className="text-gray-800">
                            <b>Created By:</b> {data.createdBy}
                        </div>
                        <div className="text-gray-800">
                            <b>Created At:</b> {formatDate(data.createdAt)}
                        </div>
                        {data.approvedBy && (
                            <div className="text-gray-800">
                                <b>Approved By:</b> {data.approvedBy}
                            </div>
                        )}
                    </Box>
                )}

                {tab === 1 && (
                    <div className="p-4">
                        <Table
                            size="small"
                            className="border border-gray-200 rounded-md"
                        >
                            <TableHead className="!bg-gray-50">
                                <TableRow>
                                    <TableCell className="!text-xs !font-semibold">
                                        Employee
                                    </TableCell>
                                    <TableCell className="!text-xs !font-semibold">
                                        Old CTC
                                    </TableCell>
                                    <TableCell className="!text-xs !font-semibold">
                                        New CTC
                                    </TableCell>
                                    <TableCell className="!text-xs !font-semibold">
                                        Δ Amount
                                    </TableCell>
                                    <TableCell className="!text-xs !font-semibold">
                                        Δ %
                                    </TableCell>
                                    <TableCell className="!text-xs !font-semibold">
                                        Letter
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.employees.map((e, i) => (
                                    <TableRow
                                        key={e.employeeId}
                                        sx={getRowColor(i)}
                                    >
                                        <TableCell className="!text-xs">
                                            {e.employeeName} (
                                            {e.employeeCode})
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            ₹{" "}
                                            {e.oldCtc.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="!text-xs !text-green-700">
                                            ₹{" "}
                                            {e.newCtc.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            ₹{" "}
                                            {e.incrementAmount.toLocaleString(
                                                "en-IN"
                                            )}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            {e.incrementPercent.toFixed(2)}%
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                className="!text-xs"
                                                onClick={() =>
                                                    navigate(
                                                        `/payroll/revision/${data.id}/letter/${e.employeeId}`
                                                    )
                                                }
                                            >
                                                View / Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {tab === 2 && (
                    <Box className="!p-4 grid grid-cols-2 gap-4">
                        {data.employees.map((e) => (
                            <Box key={e.employeeId}>
                                <div className="text-xs font-semibold text-primary mb-2 ml-2">
                                    {e.employeeName} - components
                                </div>
                                <Table
                                    size="small"
                                    className="border border-gray-200 rounded-md"
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell className="!text-xs">
                                                Component
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                Old
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                New
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                Δ
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {e.components.map((c, i) => (
                                            <TableRow
                                                key={c.componentId}
                                                sx={getRowColor(i)}
                                            >
                                                <TableCell className="!text-xs">
                                                    <div className="p-2">
                                                        {c.componentName}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="!text-xs">
                                                    ₹{" "}
                                                    {c.oldValue.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </TableCell>
                                                <TableCell className="!text-xs">
                                                    ₹{" "}
                                                    {c.newValue.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </TableCell>
                                                <TableCell className="!text-xs !text-green-700">
                                                    +₹{" "}
                                                    {c.delta.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {data.status === "PENDING_APPROVAL" && (
                <Paper className="!p-3 !mt-3 !shadow-sm !bg-white">
                    <TextField
                        label="Remarks"
                        fullWidth
                        multiline
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </Paper>
            )}
        </Box>
    );
}