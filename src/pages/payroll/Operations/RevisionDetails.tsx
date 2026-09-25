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
    TableContainer,
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
        return <div className="text-[12px] text-gray-500">Not found.</div>;
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
            variant: "success",
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
                    <Box className="!p-4 grid grid-cols-3 gap-4 text-[12px]">
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
                        <TableContainer className="!max-h-[calc(100vh-305px)] overflow-auto">
                            <Table stickyHeader
                                size="small"
                                className="border border-gray-200 rounded-md"
                            >
                                <TableHead className="!bg-gray-50">
                                    <TableRow>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            S No
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            Employee
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            Old CTC
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            Old Gross
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            New CTC
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            New Gross
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            Δ Amount
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
                                            Δ %
                                        </TableCell>
                                        <TableCell className="!text-[12px] !font-semibold">
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
                                            <TableCell className="!text-[12px]">
                                                {i + 1}                                        </TableCell>
                                            <TableCell className="!text-[12px]">
                                                {e.employeeName} (
                                                {e.employeeCode})
                                            </TableCell>
                                            <TableCell className="!text-[12px]">
                                                ₹{" "}
                                                {e.oldCtc.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell className="!text-[12px]">
                                                ₹{" "}
                                                {e.oldGross.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell className="!text-[12px] !text-green-700">
                                                ₹{" "}
                                                {e.newCtc.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell className="!text-[12px]">
                                                ₹{" "}
                                                {e.newGross.toLocaleString("en-IN")}
                                            </TableCell>
                                            <TableCell className="!text-[12px]">
                                                ₹{" "}
                                                {e.incrementAmount.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </TableCell>
                                            <TableCell className="!text-[12px]">
                                                {e.incrementPercent.toFixed(2)}%
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    className="!text-[12px]"
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
                        </TableContainer>
                    </div>
                )}

                {tab === 2 && (
                    <Box className="!p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-auto">
                        {data.employees.length === 0 && (
                            <div className="text-center text-[12px] text-gray-500 py-6">
                                No employee data available.
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {data.employees.map((e: any) => {
                                const totalOld = (e.components || []).reduce(
                                    (s: number, c: any) =>
                                        c.componentType === "EARNING"
                                            ? s + Number(c.oldValue ?? 0)
                                            : s,
                                    0
                                );
                                const totalNew = (e.components || []).reduce(
                                    (s: number, c: any) =>
                                        c.componentType === "EARNING"
                                            ? s + Number(c.newValue ?? 0)
                                            : s,
                                    0
                                );
                                const totalDelta = totalNew - totalOld;
                                const totalPct =
                                    totalOld > 0 ? (totalDelta / totalOld) * 100 : 0;

                                return (
                                    <Paper
                                        key={e.employeeId}
                                        className="!shadow-sm border border-gray-200 !bg-white !rounded-lg overflow-hidden"
                                    >
                                        {/* ── Employee header ── */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">
                                                    {e.employeeName}
                                                </div>
                                                <div className="text-[11px] text-gray-500">
                                                    {e.employeeCode} • {e.department} •{" "}
                                                    {e.designation}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip
                                                    size="small"
                                                    label={`Old: ₹ ${totalOld.toLocaleString(
                                                        "en-IN"
                                                    )}`}
                                                    className="!bg-gray-200 !text-gray-700"
                                                />
                                                <span className="text-gray-400 text-[12px]">→</span>
                                                <Chip
                                                    size="small"
                                                    label={`New: ₹ ${totalNew.toLocaleString(
                                                        "en-IN"
                                                    )}`}
                                                    className="!bg-blue-100 !text-blue-800"
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`${totalDelta >= 0 ? "+" : "-"
                                                        }₹ ${Math.abs(totalDelta).toLocaleString(
                                                            "en-IN"
                                                        )} (${totalPct >= 0 ? "+" : ""}${totalPct.toFixed(
                                                            2
                                                        )}%)`}
                                                    className={
                                                        totalDelta >= 0
                                                            ? "!bg-green-100 !text-green-800"
                                                            : "!bg-red-100 !text-red-800"
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* ── Components table ── */}
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow className="!bg-gray-50">
                                                    <TableCell className="!text-[12px] !font-semibold">
                                                        Component
                                                    </TableCell>
                                                    {/* <TableCell className="!text-[12px] !font-semibold">
                                                    Type
                                                </TableCell> */}
                                                    <TableCell
                                                        align="right"
                                                        className="!text-[12px] !font-semibold"
                                                    >
                                                        Old Value
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        className="!text-[12px] !font-semibold"
                                                    >
                                                        New Value
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        className="!text-[12px] !font-semibold"
                                                    >
                                                        Δ Amount
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        className="!text-[12px] !font-semibold"
                                                    >
                                                        Δ %
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {(e.components || []).map(
                                                    (c: any, i: number) => {
                                                        const delta = Number(c.delta ?? 0);
                                                        const pct = Number(
                                                            c.deltaPercent ?? 0
                                                        );
                                                        // const isEarning =
                                                        //     c.componentType === "EARNING";

                                                        return (
                                                            <TableRow
                                                                key={
                                                                    c.componentId ||
                                                                    `${c.componentName}-${i}`
                                                                }
                                                                sx={getRowColor(i)}
                                                            >
                                                                <TableCell className="!text-[12px]">
                                                                    {c.componentName}
                                                                    {/* <Chip
                                                                        size="small"
                                                                        label={c.componentType}
                                                                        className={
                                                                            isEarning
                                                                                ? "!bg-green-100 !text-green-800 !h-5 !text-[10px] ml-2"
                                                                                : "!bg-red-100 !text-red-800 !h-5 !text-[10px] ml-2"
                                                                        }
                                                                    /> */}
                                                                </TableCell>

                                                                <TableCell
                                                                    align="right"
                                                                    className="!text-[12px] !text-gray-600"
                                                                >
                                                                    ₹{" "}
                                                                    {Number(
                                                                        c.oldValue ?? 0
                                                                    ).toLocaleString("en-IN")}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="right"
                                                                    className="!text-[12px] "
                                                                >
                                                                    ₹{" "}
                                                                    {Number(
                                                                        c.newValue ?? 0
                                                                    ).toLocaleString("en-IN")}
                                                                </TableCell>
                                                                <TableCell
                                                                    align="right"

                                                                >
                                                                    <div className={`!text-[12px] !font-bold ${delta >= 0
                                                                        ? "!text-green-700"
                                                                        : "!text-red-700"
                                                                        }`}>
                                                                        {delta >= 0 ? "+" : "-"}₹
                                                                        {Math.abs(
                                                                            delta
                                                                        ).toLocaleString("en-IN")}
                                                                    </div>

                                                                </TableCell>
                                                                <TableCell
                                                                    align="right"

                                                                >
                                                                    <div className={`!text-[12px] !font-bold ${pct >= 0
                                                                        ? "!text-green-700"
                                                                        : "!text-red-700"
                                                                        }`}>
                                                                        {pct >= 0 ? "+" : ""}
                                                                        {pct.toFixed(2)}%
                                                                    </div>

                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                )}

                                                {(e.components || []).length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            align="center"
                                                            className="!text-[12px] !py-4 !text-gray-500"
                                                        >
                                                            No components found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>

                                            {/* ── Footer total row ── */}
                                            {(e.components || []).length > 0 && (
                                                <TableHead>
                                                    <TableRow className="!bg-gray-50">
                                                        <TableCell
                                                            colSpan={1}
                                                            className="!text-[12px] !font-bold !text-gray-700"
                                                        >
                                                            Total (Earnings)
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            className="!text-[12px] !font-bold !text-gray-700"
                                                        >
                                                            ₹{" "}
                                                            {totalOld.toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            className="!text-[12px] !font-bold !text-gray-700"
                                                        >
                                                            ₹{" "}
                                                            {totalNew.toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"

                                                        >
                                                            <div className={`!text-[12px] !font-bold ${totalDelta >= 0
                                                                ? "!text-blue-700"
                                                                : "!text-red-700"
                                                                }`}>
                                                                {totalDelta >= 0 ? "+" : "-"}₹
                                                                {Math.abs(totalDelta).toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </div>

                                                        </TableCell>
                                                        <TableCell
                                                            align="right"

                                                        >
                                                            <div className={`!text-[12px] !font-bold ${totalPct >= 0
                                                                ? "!text-blue-700"
                                                                : "!text-red-700"
                                                                }`}>
                                                                {totalPct >= 0 ? "+" : ""}
                                                                {totalPct.toFixed(2)}%
                                                            </div>

                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                            )}
                                        </Table>
                                    </Paper>
                                );
                            })}
                        </div>
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