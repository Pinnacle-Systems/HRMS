import { useEffect, useMemo, useState } from "react";
import {
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  approvalWorkflowService,
  type ApprovalRequest,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

const decisionColor = (decision: string) => {
  switch (decision?.toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

export default function PendingApprovals() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { showSpinner, hideSpinner } = useUI();

  const loadPending = async () => {
    showSpinner();
    setError(null);
    try {
      const res = await approvalWorkflowService.getPendingApprovalsForMe();
      setRequests(res?.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load pending approvals");
      setRequests([]);
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [r.workflowName, r.moduleName, r.submittedByName, r.status, r.recordId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [requests, search]);

  const openDetail = async (req: ApprovalRequest) => {
    setSelected(req);
    setDetailLoading(true);
    try {
      const res = await approvalWorkflowService.getApprovalRequestById(req.id);
      if (res?.data) setSelected(res.data);
    } catch {
      // fall back to list row data
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-2">
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2">
        <TextField
          size="small"
          placeholder="Search by workflow, module, submitter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 320 }}
        />
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={loadPending}>
              <RefreshIcon className="!text-gray-800"/>
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Body */}
      {error ? (
        <div className="py-10 text-center text-red-600">{error}</div>
      ) : (
        <TableContainer className="!border !border-gray-200">
          <Table size="small">
            <TableHead>
              <TableRow className="!bg-gray-50">
                <TableCell className="!font-semibold">S No</TableCell>
                <TableCell className="!font-semibold">Workflow</TableCell>
                <TableCell className="!font-semibold">Module</TableCell>
                <TableCell className="!font-semibold">Submitted By</TableCell>
                <TableCell className="!font-semibold">Submitted At</TableCell>
                <TableCell className="!font-semibold">Current Level</TableCell>
                <TableCell className="!font-semibold">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <div className="py-10 text-[12px] text-gray-500">
                      No pending approvals for you.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r,idx) => {
                  const currentLevel = r.levels?.find((l) => l.current);
                  return (
                    <TableRow
                      key={r.id}
                      hover
                      className="!cursor-pointer"
                      onClick={() => openDetail(r)}
                    >
                      <TableCell>{idx + 1 }</TableCell>
                      <TableCell>{r.workflowName}</TableCell>
                      <TableCell>{r.moduleName}</TableCell>
                      <TableCell>{r.submittedByName || "—"}</TableCell>
                      <TableCell>{formatDate(r.submittedAt)}</TableCell>
                      <TableCell>
                        {currentLevel?.levelTitle ??
                          `Level ${r.currentLevelSeq ?? "—"}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.status}
                          color={statusColor(r.status) as any}
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
      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" className="!font-bold">
              Approval Request
            </Typography>
            <IconButton onClick={() => setSelected(null)}>
              <CloseIcon />
            </IconButton>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-16">
              <CircularProgress size={28} />
            </div>
          ) : selected ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <Info label="Workflow" value={selected.workflowName} />
                <Info label="Module" value={selected.moduleName} />
                <Info label="Status">
                  <Chip
                    size="small"
                    label={selected.status}
                    color={statusColor(selected.status) as any}
                  />
                </Info>
                <Info
                  label="Current Level"
                  value={String(selected.currentLevelSeq ?? "—")}
                />
                <Info label="Submitted By" value={selected.submittedByName} />
                <Info
                  label="Submitted At"
                  value={formatDate(selected.submittedAt)}
                />
                <Info label="Record ID" value={selected.recordId} />
                <Info label="Decided At" value={formatDate(selected.decidedAt)} />
              </div>

              <Divider className="!my-4" />

              <Typography variant="subtitle1" className="!font-semibold mb-2">
                Levels
              </Typography>

              <div className="flex flex-col gap-4">
                {(selected.levels ?? []).map((lvl) => (
                  <div
                    key={lvl.seqNo}
                    className={`rounded-lg border p-3 ${
                      lvl.current
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {lvl.cleared ? (
                          <CheckCircleIcon
                            fontSize="small"
                            className="!text-green-600"
                          />
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
                      {lvl.current && (
                        <Chip size="small" color="info" label="Current" />
                      )}
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
                            label={`${a.employeeName}${
                              a.employeeCode ? ` (${a.employeeCode})` : ""
                            }`}
                          />
                        ))}
                        {(lvl.approvers ?? []).length === 0 && (
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
                        {(lvl.decisions ?? []).map((d, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-gray-200 p-2"
                          >
                            <div className="flex items-center justify-between">
                              <Typography
                                variant="body2"
                                className="!font-medium"
                              >
                                {d.approverName}
                              </Typography>
                              <Chip
                                size="small"
                                label={d.decision}
                                color={decisionColor(d.decision) as any}
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
              </div>
            </>
          ) : null}
        </div>
      </Drawer>
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
      <div className="mt-0.5">
        {children ?? <Typography variant="body2">{value || "—"}</Typography>}
      </div>
    </div>
  );
}