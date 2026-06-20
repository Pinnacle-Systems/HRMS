import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField,
  IconButton, Tooltip, CircularProgress,
  Chip,
} from "@mui/material";
import {
  VisibilityOutlined, CheckOutlined, CloseOutlined,
  FilterListOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { CorrectionRequest, CorrectionStatus } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { formatTime } from "./const";
import dayjs from "dayjs";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { getRowColor } from "../../const";

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


  const loadCorrections = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getCorrections({
        status: statusFilter || undefined,
        employeeId: search || undefined,
        page, limit
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
        approvedBy: "current-user",
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

  return (
    <div className="p-4 space-y-3">
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className="max-h-[calc(100vh-335px)]">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["S No", "Employee", "Code", "Date", "Current In", "Current Out", "Requested In", "Requested Out", "Reason", "Status", "Requested At", "Actions"].map((h) => (
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
                  <TableCell colSpan={11} align="center" className="py-8 text-gray-400 text-sm">
                    No correction requests found
                  </TableCell>
                </TableRow>
              ) : (
                corrections.map((c, index) => (
                  <TableRow key={c.id} hover sx={getRowColor(index)}>
                    <TableCell >{index + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">{c.employeeName}</TableCell>
                    <TableCell>{c.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dayjs(c.attendanceDate).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell>{c.currentCheckIn ? formatTime(c.currentCheckIn) : '-'}</TableCell>
                    <TableCell>{c.currentCheckOut ? formatTime(c.currentCheckOut) : '-'}</TableCell>
                    <TableCell><span className="text-green-700"> {formatTime(c.requestedCheckIn)}</span></TableCell>
                    <TableCell> <span className="text-green-700">{formatTime(c.requestedCheckOut)}</span></TableCell>
                    <TableCell className="max-w-[150px] truncate" title={c.reason}>{c.reason}</TableCell>
                    <TableCell sx={{
                      padding: '8px !important',
                    }}>
                      <span className={`px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dayjs(c.createdAt).format("DD MMM, h:mm A")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(c)}>
                            <VisibilityOutlined className="text-primary !w-4" />
                          </IconButton>
                        </Tooltip>
                        {c.status === "pending" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small" onClick={() => openApprove(c, "approved")}>
                                <CheckOutlined className="text-green-500 !w-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" onClick={() => openApprove(c, "rejected")}>
                                <CloseOutlined className="text-red-500 !w-4" />
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
              <Button size="small" color="error" variant="outlined"
                onClick={() => { setDetailOpen(false); openApprove(selected, "rejected"); }}>
                Reject
              </Button>
              <Button size="small" color="success" variant="contained"
                onClick={() => { setDetailOpen(false); openApprove(selected, "approved"); }}>
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
          <Button onClick={() => setApproveOpen(false)} disabled={submitting} variant="outlined" className="!border-gray-200 !text-gray-800" >
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
    </div>
  );
}
