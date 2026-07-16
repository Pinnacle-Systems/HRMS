import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import {
  History,
  Person,
  Pending,
} from "@mui/icons-material";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type { LeaveRequest } from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import { formatDate } from "../leaveFormatters";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";

type ActionKind = "convertToLop" | "forceApprove";

type ActionDialogState = {
  kind: ActionKind;
  request: LeaveRequest;
} | null;

export default function HrLopReviewPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null);
  const [remarks, setRemarks] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const load = async (_pageNum: number = page, pageSize: number = limit) => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getPendingApprovals({
        limit: pageSize,
        page: _pageNum
      });
      // Extract data from nested structure: response.data.data
      setRequests(response.data?.data ?? response.data?.content ?? []);
      setTotal(response.data?.meta?.totalRecords ?? response.data?.totalElements ?? 0);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load LOP review queue", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, limit);
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    load(1, newLimit);
  };

  const openAction = (kind: ActionKind, request: LeaveRequest) => {
    setActionDialog({ kind, request });
    setRemarks("");
  };

  const submitAction = async () => {
    if (!actionDialog) return;
    showSpinner();
    try {
      const response =
        actionDialog.kind === "convertToLop"
          ? await leaveService.convertLeaveToLop(actionDialog.request.id, { comments: remarks, lopLeaveTypeId: actionDialog.request.leaveTypeId })
          : await leaveService.forceApproveLeave(actionDialog.request.id, { comments: remarks, lopLeaveTypeId: actionDialog.request.leaveTypeId });
      if (response.success) {
        showSnackbar(response.message || "Leave request updated", "success");
        setActionDialog(null);
        await load(page, limit);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update leave request", "error");
    } finally {
      hideSpinner();
    }
  };

  // Calculate stats
  const totalPending = total;
  const totalDays = requests.reduce((sum, r) => sum + (r.totalDays || r.days || 0), 0);
  const uniqueEmployees = new Set(requests.map(r => r.employeeId)).size;

  return (
    <LeavePageShell
      group="hr"
      title="LOP Review"
      subtitle="Review pending requests and convert insufficient-balance leave to loss of pay"
    >
      {/* Summary Cards */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-gray-800">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Pending Requests</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {totalPending}
                </div>
              </div>
              <div className="p-2.5 bg-yellow-50 rounded-full">
                <Pending className="text-yellow-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Total Leave Days</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {totalDays}
                </div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-full">
                <History className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Employees</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {uniqueEmployees}
                </div>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-full">
                <Person className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests Table */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-bold text-gray-900">
              Pending Leave Requests
            </h3>
          </div>
          {!loading && requests.length > 0 && (
            <span className="text-[12px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
              {total} pending
            </span>
          )}
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm h-[calc(100vh-425px)]">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-semibold">S No</TableCell>
                <TableCell className="!font-semibold">Request #</TableCell>
                <TableCell className="!font-semibold">Employee</TableCell>
                <TableCell className="!font-semibold">Leave Type</TableCell>
                <TableCell className="!font-semibold">From</TableCell>
                <TableCell className="!font-semibold">To</TableCell>
                <TableCell className="!font-semibold text-center">Days</TableCell>
                <TableCell className="!font-semibold text-center">Status</TableCell>
                <TableCell className="!font-semibold text-center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                requests.map((request, i) => (
                  <TableRow key={request.id} sx={getRowColor(i)}>
                     <TableCell>
                    {i+1}
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] font-medium text-gray-700">
                        {request.requestNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-gray-900 font-medium">{request.employeeName}</div>
                        <div className="text-[10px] text-gray-500">{request.employeeCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {request.leaveTypeName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">{formatDate(request.fromDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">{formatDate(request.toDate)}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.totalDays || request.days || 0}
                        size="small"
                        className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      <LeaveStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip title="Convert to Loss of Pay">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openAction("convertToLop", request)}
                            className="!text-[11px] !normal-case !px-2 !py-0.5 !border-yellow-600 !text-yellow-700 hover:!bg-yellow-50"
                          >
                            Convert to LOP
                          </Button>
                        </Tooltip>
                        <Tooltip title="Force Approve">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openAction("forceApprove", request)}
                            className="!text-[11px] !normal-case !px-2 !py-0.5 !border-green-600 !text-green-700 hover:!bg-green-50"
                          >
                            Force Approve
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <DataState compact type="loading" title="Loading LOP review queue..." />
                  </TableCell>
                </TableRow>
              )}
              {!loading && requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="p-8">
                    <DataState compact type="empty" title="No pending requests to review." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[5, 10, 20, 50]}
            showTotal
          />
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={Boolean(actionDialog)} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] font-semibold text-gray-900">
              {actionDialog?.kind === "convertToLop" ? "Convert to Loss of Pay" : "Force Approve"}
            </span>
          </div>
          <IconButton onClick={() => setActionDialog(null)} size="small">
            <CloseOutlinedIcon className="!text-gray-500" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-[12px] text-gray-500">Request Details</div>
              <div className="text-[12px] font-medium text-gray-900 mt-1">
                {actionDialog?.request.employeeName}
              </div>
              <div className="text-[12px] text-gray-600">
                {actionDialog?.request.leaveTypeName} • {actionDialog && formatDate(actionDialog.request.fromDate)} to{" "}
                {actionDialog && formatDate(actionDialog.request.toDate)}
              </div>
              <div className="text-[12px] text-gray-600">
                Request #: {actionDialog?.request.requestNumber}
              </div>
              <div className="text-[12px] text-gray-600">
                Days: {actionDialog?.request.totalDays || actionDialog?.request.days || 0}
              </div>
            </div>
            <TextField
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Enter remarks for this action"
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200 gap-2">
          <Button
            variant="outlined"
            onClick={() => setActionDialog(null)}
            className="!text-gray-600 !border-gray-300 !normal-case"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitAction}
            className="!bg-primary !normal-case"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}