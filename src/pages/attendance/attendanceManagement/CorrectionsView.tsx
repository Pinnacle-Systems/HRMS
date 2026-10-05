import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Checkbox,
  IconButton, Tooltip, CircularProgress,
  Chip,
} from "@mui/material";
import {
  VisibilityOutlined, CloseOutlined,
  FilterListOutlined,
  CheckCircleOutlined,
  CancelOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type {
  CorrectionRequest,
  CorrectionStatus,
  BulkDecisionError,
} from "../../../services/modules/attendanceTypes";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { formatTime } from "../const";
import dayjs from "dayjs";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { getRowColor } from "../../const";
import { formatDateTime } from "../../../utils/dateFormatter";
import { useAuth } from "../../../auth/authContext";

const STATUS_STYLES: Record<CorrectionStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function CorrectionsView() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, _setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CorrectionStatus | "">("");
  const [loading, setLoading] = useState(false);

  // Detail/Approve dialog
  const [selected, setSelected] = useState<CorrectionRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveStatus, setApproveStatus] = useState<"approved" | "rejected">("approved");
  const [approverRemarks, setApproverRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<"approved" | "rejected">("approved");
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<BulkDecisionError[]>([]);

  const { session } = useAuth();

  const loadCorrections = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getCorrections({
        status: statusFilter || undefined,
        employeeId: search || undefined,
        page, limit,
      });
      const data = res?.data?.data ?? res?.data;
      setCorrections(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load correction requests", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadCorrections();
  }, [loadCorrections]);

  // Clear stale selection when the visible page/filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, limit, statusFilter, search]);

  async function openDetail(correction: CorrectionRequest) {
    setSelected(correction);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res: any = await attendanceService.getCorrectionById(correction.id);
      const data = res?.data?.data ?? res?.data;
      if (data) setSelected(data);
    } catch {
      // keep the list-level data already set
    } finally {
      setDetailLoading(false);
    }
  }

  function openApprove(correction: CorrectionRequest, defaultStatus: "approved" | "rejected") {
    setSelected(correction);
    setApproveStatus(defaultStatus);
    setApproverRemarks("");
    setApproveOpen(true);
  }

  async function submitApproval() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await attendanceService.approveCorrection(selected.id, {
        status: approveStatus,
        approverRemarks,
        approvedBy: session?.user.email  || "current-user",
      });
      showSnackbar(
        approveStatus === "approved" ? "Correction approved" : "Correction rejected",
        approveStatus === "approved" ? "success" : "info"
      );
      setApproveOpen(false);
      loadCorrections();
    } catch {
      showSnackbar("Failed to process correction", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  // -------- Bulk selection helpers --------
  const pendingCorrections = corrections.filter((c) => c.status === "pending");
  const selectableIds = pendingCorrections.map((c) => c.id);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : selectableIds);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  function openBulk(status: "approved" | "rejected") {
    setBulkStatus(status);
    setBulkRemarks("");
    setBulkErrors([]);
    setBulkOpen(true);
  }

  async function submitBulk() {
    if (selectedIds.length === 0) return;
    if (bulkStatus === "rejected" && !bulkRemarks.trim()) return;

    setBulkSubmitting(true);
    setBulkErrors([]);
    try {
      const res: any = await attendanceService.bulkApproveCorrections({
        ids: selectedIds,
        status: bulkStatus,
        approverRemarks: bulkRemarks,
        approvedBy: session?.user.email  || "current-user",
      });

      const data = res?.data?.data ?? res?.data;

      // All-or-nothing: if the API returned errors, nothing was applied
      if (data?.errors?.length) {
        setBulkErrors(data.errors);
        showSnackbar(
          "Some requests could not be processed. No changes were applied.",
          "error"
        );
        return;
      }

      showSnackbar(
        `${data?.successCount ?? selectedIds.length} correction(s) ${
          bulkStatus === "approved" ? "approved" : "rejected"
        }`,
        bulkStatus === "approved" ? "success" : "info"
      );
      setBulkOpen(false);
      setSelectedIds([]);
      loadCorrections();
    } catch {
      showSnackbar("Failed to process bulk correction", "error");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="p-4 pt-1 space-y-3">
      {/* Filters */}
      <div className="bg-white flex flex-wrap items-center gap-2 my-2">
        <FilterListOutlined className="text-gray-500" />
        <div className="w-[250px]">
          <EmployeeSelector
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            label="Select Employee"
          />
        </div>
        <div className="flex items-center gap-1">
          <Chip
            label="All"
            size="small"
            variant={statusFilter === '' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter(''); setPage(0); }}
            className="cursor-pointer text-gray-800 bg-gray-100"
          />
          <Chip
            label="Pending"
            size="small"
            variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('pending'); setPage(0); }}
            color="warning"
            className="cursor-pointer"
          />
          <Chip
            label="Approved"
            size="small"
            variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('approved'); setPage(0); }}
            color="success"
            className="cursor-pointer"
          />
          <Chip
            label="Rejected"
            size="small"
            variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('rejected'); setPage(0); }}
            color="error"
            className="cursor-pointer"
          />
          {(selectedEmployee || statusFilter) && (
            <Chip
              label="Clear all"
              size="small"
              variant="outlined"
              onDelete={() => {
                setSelectedEmployee(null);
                setStatusFilter('');
                setPage(0);
              }}
              className="ml-1 text-gray-800"
            />
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50/20 border border-blue-200 rounded-md px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedIds.length} request{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="outlined"
              className="!border-gray-200 !text-gray-800"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => openBulk("rejected")}
            >
              Reject Selected
            </Button>
            <Button
              size="small"
              color="success"
              variant="contained"
              onClick={() => openBulk("approved")}
            >
              Approve Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className="max-h-[calc(100vh-325px)]">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="bg-gray-50" padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableIds.length === 0}
                    className="!p-0 text-gray-800"
                  />
                </TableCell>
                {["S No", "Employee Name", "Date", "In Time", "Out Time", "Reason", "Source", "Status", "Requested At", "Actions"].map((h) => (
                  <TableCell key={h} className="bg-gray-50 text-gray-600 font-semibold text-xs whitespace-nowrap">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" className="py-8 text-gray-400 text-sm">Loading...</TableCell>
                </TableRow>
              ) : corrections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <div className="py-6 text-gray-400 text-[12px]">No correction requests found</div>
                  </TableCell>
                </TableRow>
              ) : (
                corrections.map((c, index) => (
                  <TableRow key={c.id} hover sx={getRowColor(index)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        className="!p-0 text-gray-800"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelectOne(c.id)}
                        disabled={c.status !== "pending"}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.employeeName} <span className="text-gray-500 text-[10px]">({c.employeeCode})</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dayjs(c.attendanceDate).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell>
                      <div className="text-green-700" title="Current In Time">{c.currentCheckIn ? formatTime(c.currentCheckIn) : '-'}</div>
                      <div className={`${c.currentCheckIn == c.requestedCheckIn ? 'text-green-700' : 'text-red-500'}`} title="Requested In Time">{formatTime(c.requestedCheckIn)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-700" title="Current Out Time">{c.currentCheckOut ? formatTime(c.currentCheckOut) : '-'}</div>
                      <div className={`${c.currentCheckOut == c.requestedCheckOut ? 'text-green-700' : 'text-red-500'}`} title="Requested Out Time">{formatTime(c.requestedCheckOut)}</div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={c.reason}>{c.reason}</TableCell>
                    <TableCell>{c.source}</TableCell>
                    <TableCell sx={{ padding: '8px !important' }}>
                      <span className={`px-2 py-1 rounded-full capitalize ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.createdAt ? formatDateTime(c.createdAt) : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(c)}>
                            <VisibilityOutlined className="text-primary !w-4" />
                          </IconButton>
                        </Tooltip>
                        {c.status === "pending" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small" onClick={() => openApprove(c, "approved")}>
                                <CheckCircleOutlined className="text-green-600 !w-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" onClick={() => openApprove(c, "rejected")}>
                                <CancelOutlined className="text-red-500 !w-4" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200">
          <span>Correction Request Details</span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          {detailLoading ? (
            <div className="flex justify-center py-8"><CircularProgress size={24} /></div>
          ) : selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  ["Employee", `${selected.employeeName} (${selected.employeeCode})`],
                  ["Attendance Date", dayjs(selected.attendanceDate).format("DD MMM YYYY, dddd")],
                  ["Status", selected.status],
                  ["Source", selected.source ?? "—"],
                  ["Current Check-in", formatTime(selected.currentCheckIn)],
                  ["Current Check-out", formatTime(selected.currentCheckOut)],
                  ["Requested Check-in", formatTime(selected.requestedCheckIn)],
                  ["Requested Check-out", formatTime(selected.requestedCheckOut)],
                  ["Reason", selected.reason],
                  ["Submitted At", dayjs(selected.createdAt).format("DD MMM YYYY, h:mm A")],
                  ["Approver Remarks", selected.approverRemarks ?? "—"],
                  ["Decided At", selected.decidedAt ? dayjs(selected.decidedAt).format("DD MMM YYYY, h:mm A") : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-head rounded p-2">
                    <div className="text-gray-500 text-[12px]">{label}</div>
                    <div className="text-gray-800 font-medium mt-0.5 text-[12px]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200 !p-4">
          <Button size="small" variant="outlined" className="!border-gray-200 !text-gray-800" onClick={() => setDetailOpen(false)}>Close</Button>
          {selected?.status === "pending" && (
            <>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => { setDetailOpen(false); openApprove(selected, "rejected"); }}
              >
                Reject
              </Button>
              <Button
                size="small"
                color="success"
                variant="contained"
                onClick={() => { setDetailOpen(false); openApprove(selected, "approved"); }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between !p-2 !border-b !border-gray-200">
          <span className="!pl-4">{approveStatus === "approved" ? "Approve" : "Reject"} Correction</span>
          <IconButton size="small" onClick={() => setApproveOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-5 pt-1">
            {selected && (
              <div className="text-sm text-gray-600 bg-head mt-2 rounded p-2">
                <span className="font-medium text-gray-700">{selected.employeeName}</span> —{" "}
                {dayjs(selected.attendanceDate).format("DD MMM YYYY")}
              </div>
            )}
            <TextField
              label={`Remarks ${approveStatus === "rejected" ? "(required)" : "(optional)"}`}
              fullWidth
              multiline
              required={approveStatus === "rejected" ? true : false}
              rows={3}
              value={approverRemarks}
              onChange={(e) => setApproverRemarks(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            onClick={() => setApproveOpen(false)}
            disabled={submitting}
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={approveStatus === "approved" ? "success" : "error"}
            onClick={submitApproval}
            disabled={submitting || (approveStatus === "rejected" && !approverRemarks.trim())}
          >
            {submitting ? "Processing..." : approveStatus === "approved" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Approve/Reject Dialog */}
      <Dialog open={bulkOpen} onClose={() => !bulkSubmitting && setBulkOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between !p-2 !border-b !border-gray-200">
          <span className="!pl-4">
            {bulkStatus === "approved" ? "Approve" : "Reject"} {selectedIds.length} Correction{selectedIds.length > 1 ? "s" : ""}
          </span>
          <IconButton size="small" onClick={() => setBulkOpen(false)} disabled={bulkSubmitting}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-3 pt-1">
            <div className="text-sm text-gray-600 bg-head mt-2 rounded p-2">
              All <span className="font-medium text-gray-700">{selectedIds.length}</span> selected request(s)
              will be {bulkStatus === "approved" ? "approved" : "rejected"} together.
              {bulkStatus === "approved" && " Corrected times will be applied to each attendance record."}
            </div>

            <TextField
              label={`Remarks ${bulkStatus === "rejected" ? "(required)" : "(optional)"}`}
              fullWidth
              multiline
              required={bulkStatus === "rejected"}
              rows={3}
              value={bulkRemarks}
              onChange={(e) => setBulkRemarks(e.target.value)}
            />

            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 max-h-40 overflow-auto">
                <div className="font-medium mb-1">Nothing was applied. Fix the following:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {bulkErrors.map((e, i) => (
                    <li key={i}>
                      {e.branchName ? `${e.branchName}: ` : ""}
                      {e.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            onClick={() => setBulkOpen(false)}
            disabled={bulkSubmitting}
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={bulkStatus === "approved" ? "success" : "error"}
            onClick={submitBulk}
            disabled={bulkSubmitting || (bulkStatus === "rejected" && !bulkRemarks.trim())}
          >
            {bulkSubmitting ? "Processing..." : bulkStatus === "approved" ? "Approve All" : "Reject All"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}