import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
    approvalWorkflowService,
    type ApprovalChange,
    type ApprovalChangeDecision,
    type ApprovalChangeStatus,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { formatDateTime } from "../../../../utils/dateFormatter";
import { getRowColor } from "../../../const";

// ---------- Helpers ----------
const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (
                typeof data === "object" &&
                data !== null &&
                "message" in data &&
                typeof data.message === "string"
            ) {
                return data.message;
            }
        }
    }
    return error instanceof Error ? error.message : fallback;
};

const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
};

const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case "pending_approval":
        case "pending":
            return "warning";
        case "approved":
            return "success";
        case "rejected":
            return "error";
        case "returned":
            return "info";
        default:
            return "default";
    }
};

const statusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
        case "pending_approval":
            return "Pending";
        case "approved":
            return "Approved";
        case "rejected":
            return "Rejected";
        case "returned":
            return "Returned";
        default:
            return status;
    }
};

const methodColor = (method: string) => {
    switch (method?.toUpperCase()) {
        case "POST":
            return "success";
        case "PUT":
            return "info";
        case "PATCH":
            return "warning";
        case "DELETE":
            return "error";
        default:
            return "default";
    }
};

const TABS: Array<{ label: string; value: "" | ApprovalChangeStatus }> = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending_approval" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Returned", value: "returned" },
];

// ---------- Component ----------
export default function PendingChanges() {
    const { showSnackbar, showSpinner, hideSpinner } = useUI();

    const [changes, setChanges] = useState<ApprovalChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusTab, setStatusTab] = useState<"" | ApprovalChangeStatus>("");
    const [search, setSearch] = useState("");

    const [selected, setSelected] = useState<ApprovalChange | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Decision dialog
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionValue, setDecisionValue] =
        useState<ApprovalChangeDecision>("approved");
    const [decisionComments, setDecisionComments] = useState("");
    const [deciding, setDeciding] = useState(false);

    // ---------- Load ----------
    const loadChanges = async (opts?: { silent?: boolean }) => {
        setError(null);
        if (!opts?.silent) {
            setLoading(true);
            showSpinner();
        }
        try {
            const res = await approvalWorkflowService.getApprovalChanges({
                status: statusTab || undefined,
            });
            setChanges(res.data ?? []);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load pending changes."));
            setChanges([]);
        } finally {
            if (!opts?.silent) {
                setLoading(false);
                hideSpinner();
            }
        }
    };

    useEffect(() => {
        void loadChanges();
    }, [statusTab]);

    // ---------- Filtered ----------
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return changes;
        return changes.filter((c) =>
            [
                c.workflowName,
                c.approval?.moduleName,
                c.path,
                c.requestedBy,
                c.approval?.submittedByName,
                c.status,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [changes, search]);

    // ---------- Detail ----------
    const openDetail = async (change: ApprovalChange) => {
        setSelected(change);
        setDetailLoading(true);
        try {
            const res = await approvalWorkflowService.getApprovalChangeById(change.id);
            if (res?.data) setSelected(res.data);
        } catch {
            // fall back to row data
        } finally {
            setDetailLoading(false);
        }
    };

    // ---------- Decision ----------
    const canDecide = (c: ApprovalChange | null) =>
        !!c && c.status === "pending_approval";

    const openDecision = (initial: ApprovalChangeDecision) => {
        setDecisionValue(initial);
        setDecisionComments("");
        setDecisionOpen(true);
    };

    const submitDecision = async () => {
        if (!selected) return;
        setDeciding(true);
        try {
            const res = await approvalWorkflowService.decideApprovalChange(
                selected.id,
                {
                    decision: decisionValue,
                    comments: decisionComments.trim() || undefined,
                }
            );
            showSnackbar(`Change ${decisionValue}.`, "success");
            setDecisionOpen(false);
            // Refresh drawer + list
            if (res.data) setSelected(res.data);
            await loadChanges({ silent: true });
        } catch (err) {
            showSnackbar(getErrorMessage(err, "Failed to submit decision."), "error");
        } finally {
            setDeciding(false);
        }
    };

    // ---------- Render ----------
    return (
        <div className="p-2">
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <TextField
                    size="small"
                    placeholder="Search by workflow, module, path, requester…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ minWidth: 320 }}
                />
                <Tooltip title="Refresh">
                    <span>
                        <IconButton onClick={() => void loadChanges()} disabled={loading}>
                            <RefreshIcon className="!text-gray-800" />
                        </IconButton>
                    </span>
                </Tooltip>
                {!loading && (
                    <Chip
                        size="small"
                        variant="outlined"
                        className="!text-primary !border-primary"
                        label={`${filtered.length} changes`}
                    />
                )}
            </div>

            {/* Status tabs */}
            <Paper elevation={0} className="!border !border-gray-200 !mb-3 bg-white">
                <Tabs
                    value={statusTab}
                    onChange={(_e, v) => setStatusTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    className="text-gray-800"
                    sx={{
                        "& .MuiTabs-indicator": {
                            backgroundColor: "var(--color-primary)",
                            height: 3,
                        },
                    }}
                >
                    {TABS.map((t) => (
                        <Tab
                            key={t.value || "all"}
                            value={t.value}
                            label={t.label}
                            className="!text-gray-800"
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Body */}
            {error ? (
                <Alert
                    severity="error"
                    variant="outlined"
                    action={
                        <Button color="inherit" size="small" onClick={() => void loadChanges()}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            ) : (
                <TableContainer className="!border !border-gray-200">
                    <Table size="small">
                        <TableHead>
                            <TableRow className="!bg-gray-50">
                                <TableCell className="!font-semibold" width="50">#</TableCell>
                                <TableCell className="!font-semibold">Workflow</TableCell>
                                {/* <TableCell className="!font-semibold">Module</TableCell> */}
                                <TableCell className="!font-semibold">Request</TableCell>
                                <TableCell className="!font-semibold">Requester</TableCell>
                                <TableCell className="!font-semibold">Submitted</TableCell>
                                {/* <TableCell className="!font-semibold">Current Level</TableCell> */}
                                <TableCell className="!font-semibold" width="120">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <div className="flex justify-center py-10">
                                            <CircularProgress size={24} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <div className="py-10 text-[12px] text-gray-500">
                                            No pending changes{statusTab ? ` with status “${statusLabel(statusTab)}”` : ""}.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((c, idx) => {
                                    // const current = c.approval?.levels?.find((l) => l.current);
                                    return (
                                        <TableRow
                                            key={c.id}
                                            sx={getRowColor(idx)}
                                            className="!cursor-pointer"
                                            onClick={() => openDetail(c)}
                                        >
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{c.workflowName}</TableCell>
                                            {/* <TableCell>{c.approval?.moduleName || "—"}</TableCell> */}
                                            <TableCell>
                                                <Box className="flex items-center gap-1">
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={methodColor(c.method) as any}
                                                        label={c.method}
                                                    />
                                                    <code className="text-xs text-gray-700">{c.path}</code>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{c.approval?.submittedByName || c.requestedBy || "—"}</TableCell>
                                            <TableCell>{formatDateTime(c.submittedAt)}</TableCell>
                                            {/* <TableCell>
                                                {current?.levelTitle ??
                                                    (c.approval?.currentLevelSeq
                                                        ? `Level ${c.approval.currentLevelSeq}`
                                                        : "—")}
                                            </TableCell> */}
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={statusLabel(c.status)}
                                                    color={statusColor(c.status) as any}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Detail Drawer */}
            <Drawer
                anchor="right"
                open={!!selected}
                onClose={() => setSelected(null)}
            >
                <div className="bg-white relative top-[68px]">
                    <div className="flex items-start justify-between gap-3 p-3 border-b border-gray-200">
                        <div>
                            <Typography variant="h6" className="!font-bold !text-gray-800">
                                Held Change
                            </Typography>
                            {selected && (
                                <Typography variant="caption" className="!text-gray-500">
                                    {selected.workflowName}
                                    {selected.approval?.moduleName
                                        ? ` · ${selected.approval.moduleName}`
                                        : ""}
                                </Typography>
                            )}
                        </div>
                        <IconButton onClick={() => setSelected(null)}>
                            <CloseIcon className="!text-gray-800" />
                        </IconButton>
                    </div>

                    {detailLoading ? (
                        <div className="flex justify-center py-16">
                            <CircularProgress size={28} />
                        </div>
                    ) : selected ? (
                        <div className="p-4 h-[calc(100vh-192px)] overflow-y-auto">
                            {/* Meta grid */}
                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                <Info label="Status">
                                    <Chip
                                        size="small"
                                        label={statusLabel(selected.status)}
                                        color={statusColor(selected.status) as any}
                                    />
                                </Info>
                                <Info label="Submitted At" value={formatDate(selected.submittedAt)} />
                                <Info label="Requested By" value={selected.requestedBy || "—"} />
                                <Info label="Decided At" value={formatDate(selected.decidedAt)} />
                                <Info
                                    label="Current Level"
                                    value={
                                        selected.approval?.levels?.find((l) => l.current)?.levelTitle ||
                                        (selected.approval?.currentLevelSeq
                                            ? String(selected.approval.currentLevelSeq)
                                            : "—")
                                    }
                                />
                                <Info
                                    label="Decision Comments"
                                    value={selected.decisionComments || "—"}
                                />
                            </div>

                            <Divider className="!my-4 !border !border-gray-200" />

                            {/* Held request */}
                            <Typography variant="subtitle1" className="!font-semibold !mb-2 !text-gray-800">
                                Original Request
                            </Typography>
                            <div className="rounded-md border border-gray-200 p-3 space-y-2">
                                <Box className="flex items-center gap-2">
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color={methodColor(selected.method) as any}
                                        label={selected.method}
                                    />
                                    <code className="text-xs text-gray-800">{selected.path}</code>
                                </Box>
                                {selected.query && (
                                    <div>
                                        <Typography variant="caption" className="!text-gray-500">
                                            Query
                                        </Typography>
                                        <pre className="mt-0.5 whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                                            {selected.query}
                                        </pre>
                                    </div>
                                )}
                                {selected.body && Object.keys(selected.body).length > 0 && (
                                    <div>
                                        <Typography variant="caption" className="!text-gray-500">
                                            Body
                                        </Typography>
                                        <pre className="mt-0.5 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                                            {JSON.stringify(selected.body, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            <Divider className="!my-4" />

                            {/* Approval progress */}
                            <Typography variant="subtitle1" className="!font-semibold !mb-2 !text-gray-800">
                                Approval Progress
                            </Typography>
                            <div className="flex flex-col gap-3">
                                {(selected.approval?.levels ?? []).map((lvl) => (
                                    <div
                                        key={lvl.seqNo}
                                        className={`rounded-lg border p-3 ${lvl.current ? "border-blue-400 bg-blue-50 dark:bg-blue-50/50" : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {lvl.cleared ? (
                                                    <CheckCircleIcon fontSize="small" className="!text-green-600" />
                                                ) : (
                                                    <RadioButtonUncheckedIcon
                                                        fontSize="small"
                                                        className="!text-gray-400"
                                                    />
                                                )}
                                                <Typography className="!font-medium">
                                                    {lvl.levelTitle || `Level ${lvl.seqNo}`}
                                                </Typography>
                                            </div>
                                            {lvl.current && <Chip size="small" color="info" label="Current" />}
                                        </div>

                                        <div className="mt-2">
                                            <Typography variant="caption" className="!text-gray-500">
                                                Approvers
                                            </Typography>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {(lvl.approvers ?? []).map((a) => (
                                                    <Chip
                                                        key={a.employeeId}
                                                        size="small"
                                                        variant="outlined"
                                                        label={`${a.employeeName}${a.employeeCode ? ` (${a.employeeCode})` : ""
                                                            }`}
                                                    />
                                                ))}
                                                {(lvl.approverRoles ?? []).map((r) => (
                                                    <Chip
                                                        key={r}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        label={r}
                                                    />
                                                ))}
                                                {(lvl.approvers ?? []).length === 0 &&
                                                    (lvl.approverRoles ?? []).length === 0 && (
                                                        <Typography variant="body2" className="!text-gray-400">
                                                            No approvers
                                                        </Typography>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Typography variant="caption" className="!text-gray-500">
                                                Decisions
                                            </Typography>
                                            <div className="mt-1 flex flex-col gap-2">
                                                {(lvl.decisions ?? []).map((d, i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-md border border-gray-200 p-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <Typography variant="body2" className="!font-medium">
                                                                {d.approverName}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                label={d.decision}
                                                                color={statusColor(d.decision) as any}
                                                            />
                                                        </div>
                                                        {d.comments && (
                                                            <Typography
                                                                variant="body2"
                                                                className="!text-gray-600 mt-1"
                                                            >
                                                                {d.comments}
                                                            </Typography>
                                                        )}
                                                        <Typography
                                                            variant="caption"
                                                            className="!text-gray-400"
                                                        >
                                                            {formatDate(d.decidedAt)}
                                                        </Typography>
                                                    </div>
                                                ))}
                                                {(lvl.decisions ?? []).length === 0 && (
                                                    <Typography variant="body2" className="!text-gray-400">
                                                        No decisions yet
                                                    </Typography>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(selected.approval?.levels ?? []).length === 0 && (
                                    <Typography variant="body2" className="!text-gray-400">
                                        No approval levels.
                                    </Typography>
                                )}
                            </div>

                            {/* Applied outcome */}
                            {(selected.appliedHttpStatus != null ||
                                selected.appliedResponse) && (
                                    <>
                                        <Divider className="!my-4" />
                                        <Typography variant="subtitle1" className="!font-semibold !mb-2">
                                            Applied Outcome
                                        </Typography>
                                        <div className="rounded-md border border-gray-200 p-3 space-y-2">
                                            {selected.appliedHttpStatus != null && (
                                                <Box className="flex items-center gap-2">
                                                    <Typography variant="caption" className="!text-gray-500">
                                                        HTTP status
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            selected.appliedHttpStatus >= 200 &&
                                                                selected.appliedHttpStatus < 300
                                                                ? "success"
                                                                : "error"
                                                        }
                                                        label={selected.appliedHttpStatus}
                                                    />
                                                </Box>
                                            )}
                                            {selected.appliedResponse && (
                                                <div>
                                                    <Typography variant="caption" className="!text-gray-500">
                                                        Response
                                                    </Typography>
                                                    <pre className="mt-0.5 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                                                        {selected.appliedResponse}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}


                        </div>
                    ) : null}
                    <div className="p-3 border-t border-gray-200">
                        {/* Decisions */}
                        {canDecide(selected) && (
                            <>
                                {/* <Divider className="!my-4" /> */}
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        className="!text-gray-800 !border-gray-200"
                                        startIcon={<UndoIcon />}
                                        onClick={() => openDecision("returned")}
                                        disabled={deciding}
                                    >
                                        Return
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={() => openDecision("rejected")}
                                        disabled={deciding}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disableElevation
                                        color="success"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => openDecision("approved")}
                                        disabled={deciding}
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Drawer>

            {/* Decision Dialog */}
            <Dialog
                open={decisionOpen}
                onClose={() => !deciding && setDecisionOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle className="flex items-center justify-between !p-3 !border-b !border-gray-200">
                    <span className="!ml-2">
                        {decisionValue === "approved"
                            ? "Approve change"
                            : decisionValue === "rejected"
                                ? "Reject change"
                                : "Return change"}
                    </span>
                    <IconButton
                        onClick={() => setDecisionOpen(false)}
                        disabled={deciding}
                    >
                        <CloseIcon className="!text-gray-800 !w-4" />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="!p-4 space-y-4">
                    <FormControl fullWidth size="small">
                        <InputLabel>Decision</InputLabel>
                        <Select
                            label="Decision"
                            value={decisionValue}
                            onChange={(e) =>
                                setDecisionValue(e.target.value as ApprovalChangeDecision)
                            }
                        >
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="returned">Returned</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Comments"
                        fullWidth
                        multiline
                        minRows={3}
                        value={decisionComments}
                        onChange={(e) => setDecisionComments(e.target.value)}
                        placeholder="Optional — but recommended for reject/return."
                    />

                    {decisionValue === "approved" && (
                        <Alert severity="info" variant="outlined">
                            If this is the final approval, the original request will be
                            replayed and applied. The outcome will appear in the
                            <strong> Applied Outcome </strong> section.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions className="!border-t !border-gray-200 !p-3">
                    <Button
                        onClick={() => setDecisionOpen(false)}
                        disabled={deciding}
                        variant="outlined"
                        className="!text-gray-800 !border-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disableElevation
                        className="!bg-primary"
                        onClick={submitDecision}
                        disabled={deciding}
                        startIcon={deciding ? <CircularProgress size={14} color="inherit" /> : null}
                    >
                        {deciding ? "Submitting..." : "Submit decision"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

function Info({
    label,
    value,
    children,
}: {
    label: string;
    value?: string;
    children?: React.ReactNode;
}) {
    return (
        <div>
            <Typography variant="caption" className="!text-gray-500">
                {label}
            </Typography>
            <div className="mt-0.5 text-gray-800">
                {children ?? <Typography variant="body2">{value || "—"}</Typography>}
            </div>
        </div>
    );
}