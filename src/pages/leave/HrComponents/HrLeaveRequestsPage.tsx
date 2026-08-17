import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
// import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
// import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DomainIcon from "@mui/icons-material/Domain";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  CompOffCredit,
  LeaveBalance,
  LeaveCalculationResult,
  // CompOffCreditRequest,
  LeaveRequest,
  LeaveRequestStatus,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import CompOffStatusBadge from "../components/CompOffStatusBadge";
import { formatDate } from "../leaveFormatters";
import { getLeaveStatusMeta, leaveRequestStatusOptions } from "../leaveStatusMeta";
import { AttachFileOutlined, CheckCircleOutlineOutlined, FolderOutlined, Person2Outlined, VisibilityOutlined, WorkOutlineOutlined } from "@mui/icons-material";
import { getRowColor } from "../../const";
import { normalizeLeaveAuditEntries } from "../../../utils/leaveAudit";
import { formatDateTime } from "../../../utils/dateFormatter";
import { CalendarIcon, ClockIcon } from "@mui/x-date-pickers";
import DetailsDialog from "../../../components/DetailsDialog";

type ActionKind =
  | "approve"
  | "reject"
  | "clarify"
  | "forceApprove"
  | "revoke"
  | "convertToLop";

type ActionDialogState = {
  kind: ActionKind;
  request: LeaveRequest;
} | null;

type CompOffActionDialogState = {
  kind: "approve" | "reject";
  request: CompOffCredit;
} | null;

const actionLabels: Record<ActionKind, string> = {
  approve: "Approve",
  reject: "Reject",
  clarify: "Request Clarification",
  forceApprove: "Force Approve",
  revoke: "Revoke",
  convertToLop: "Convert to LOP",
};

const actionColors: Record<ActionKind, string> = {
  approve: "#10b981",
  reject: "#ef4444",
  clarify: "#f59e0b",
  forceApprove: "#8b5cf6",
  revoke: "#6b7280",
  convertToLop: "#f97316",
};

export default function HrLeaveRequestsPage() {
  const theme = useTheme();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [status, setStatus] = useState<LeaveRequestStatus | "">("PENDING_HR_VERIFICATION");
  const [loading, setLoading] = useState(true);
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(null);
  const [actionRequest, setActionRequest] = useState<LeaveRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null);
  const [remarks, setRemarks] = useState("");

  const [compOffRequests, setCompOffRequests] = useState<CompOffCredit[]>([]);
  const [compOffLoading, setCompOffLoading] = useState(true);
  const [compOffActionDialog, setCompOffActionDialog] = useState<CompOffActionDialogState>(null);
  const [compOffRemarks, setCompOffRemarks] = useState("");

  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [detailBalance, setDetailBalance] = useState<LeaveBalance | null>(null);
  const [detailCalculation, setDetailCalculation] =
    useState<LeaveCalculationResult | null>(null);
  const [hrComments, setHrComments] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response = status
        ? await leaveService.getLeaves({ status, page: 0, size: 100, sort: "createdAt,DESC" })
        : await leaveService.getLeaves({ page: 0, size: 100, sort: "createdAt,DESC" });
      setRequests(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave requests", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadCompOffRequests = async () => {
    setCompOffLoading(true);
    try {
      const response: any = await leaveService.getCompOffCredits({
        status: undefined,
        page: 0,
        size: 50,
        // sort: "submittedOn,DESC",
      });
      setCompOffRequests((response.data?.content ?? []).filter((item: any) => item.currentStatus === "PENDING"));
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load comp-off requests", "error");
    } finally {
      setCompOffLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status]);

  useEffect(() => {
    loadCompOffRequests();
  }, []);

  const openActionMenu = (event: React.MouseEvent<HTMLElement>, request: LeaveRequest) => {
    setActionAnchorEl(event.currentTarget);
    setActionRequest(request);
  };

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionRequest(null);
  };

  const openAction = (kind: ActionKind) => {
    if (!actionRequest) return;
    setActionDialog({ kind, request: actionRequest });
    setRemarks("");
    closeActionMenu();
  };

  const submitAction = async () => {
    if (!actionDialog) return;
    showSpinner();
    try {
      const payload: any = { comments: remarks, lopLeaveTypeId: actionDialog.request.leaveTypeId };
      const id = actionDialog.request.id;
      const response = await {
        approve: () => leaveService.approveLeave(id, payload),
        reject: () => leaveService.rejectLeave(id, payload),
        clarify: () => leaveService.requestLeaveClarification(id, payload),
        forceApprove: () => leaveService.forceApproveLeave(id, payload),
        revoke: () => leaveService.revokeLeave(id, payload),
        convertToLop: () => leaveService.convertLeaveToLop(id, payload),
      }[actionDialog.kind]();

      if (response.success) {
        showSnackbar(response.message || "Leave request updated", "success");
        setActionDialog(null);
        await loadRequests();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update leave request", "error");
    } finally {
      hideSpinner();
    }
  };

  const openCompOffAction = (kind: "approve" | "reject", request: CompOffCredit) => {
    setCompOffActionDialog({ kind, request });
    setCompOffRemarks("");
  };

  const submitCompOffAction = async () => {
    if (!compOffActionDialog) return;
    showSpinner();
    try {
      const { kind, request } = compOffActionDialog;
      const payload = { comments: compOffRemarks, lopLeaveTypeId: request.leaveTypeId };

      const response: any = kind === "approve"
        ? await leaveService.approveCompOffCredit(request.id, payload)
        : await leaveService.rejectCompOffCredit(request.id, payload);

      if (response.success) {
        showSnackbar(
          kind === "approve" ? "Comp-off credit approved" : "Comp-off credit rejected",
          "success"
        );
        setCompOffActionDialog(null);
        await loadCompOffRequests();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update comp-off request", "error");
    } finally {
      hideSpinner();
    }
  };

  const openDetail = async (request: LeaveRequest) => {
    setAuditEntries([]);
    try {
      const attachmentResponse: any = await leaveService.getLeaveAttachments(
        request.id,
      );
      request.attachments = attachmentResponse.data || [];
    } catch (error) {
      console.error("Failed to load attachments:", error);
      request.attachments = [];
    }
    setSelectedRequest(request);
    // setTeamOverlap(getTeamOverlap(request, allManagerRequests));

    try {
      const [balanceResponse, calculationResponse, auditResponse]: any = await Promise.all([
        leaveService.getEmployeeLeaveBalances(request.employeeId),
        leaveService.calculateLeaveDays({
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          fromDate: request.fromDate,
          toDate: request.toDate,
          // dayType: request.dayType,
        }),
        // session?.user.roles == "ADMIN" ?  leaveService.getLeaveAudit(request.id),
      ]);
      setDetailBalance(
        balanceResponse.data?.content.find(
          (balance: any) => balance.leaveTypeId === request.leaveTypeId,
        ) ?? null,
      );
      setAuditEntries(normalizeLeaveAuditEntries(auditResponse));
      setDetailCalculation(calculationResponse.data ?? null);
    } catch {
      setDetailBalance(null);
      setDetailCalculation(null);
      setAuditEntries([]);
    }
  };

  const handleHrVerification = async (request: LeaveRequest) => {
    showSpinner();
    const payload =
    {
      "verified": true,
      "comments": hrComments || "verified"
    }
    try {
      await leaveService.hrVerified(request.id, payload);
      selectedRequest ? selectedRequest.hrVerified = true : '';
      loadRequests();
    } catch (error: any) {
      showSnackbar(error.msg, 'error')
    } finally {
      hideSpinner();
    }

  };

  // const handleCompOffDecision = async (request: CompOffCredit, approve: boolean) => {
  //   showSpinner();
  //   try {
  //     const payload = {
  //       "comments": "string",
  //       "lopLeaveTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  //     }
  //     const response: any = approve
  //       ? await leaveService.approveCompOffCredit(request.id)
  //       : await leaveService.rejectCompOffCredit(request.id);
  //     if (response.success) {
  //       showSnackbar(approve ? "Comp-off credit approved" : "Comp-off credit rejected", "success");
  //       await loadCompOffRequests();
  //     }
  //   } catch (err: any) {
  //     showSnackbar(err?.message || "Failed to update comp-off request", "error");
  //   } finally {
  //     hideSpinner();
  //   }
  // };

  // const getStatusCount = (status: LeaveRequestStatus) => {
  //   return requests.filter(r => r.currentStatus === status).length;
  // };

  return (
    <LeavePageShell
      group="hr"
      title="HR Leave Requests"
      subtitle="HR-wide leave request administration and comp-off approvals"
    >
      <div className="flex items-center text-gray-800 justify-end gap-2">
        <div >Filter:</div>
        <TextField
          select
          // label="Status"
          value={status}
          className="!w-[200px]"
          slotProps={{
            select: {
              displayEmpty: true,
              renderValue: (value: unknown) =>
                value ? getLeaveStatusMeta(value as LeaveRequestStatus).label : "All Statuses",
            },
          }}
          onChange={(event) => setStatus(event.target.value as LeaveRequestStatus | "")}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {leaveRequestStatusOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {getLeaveStatusMeta(value).label}
            </MenuItem>
          ))}
        </TextField>
      </div>
      {/* Leave Requests Table */}
      <div className="text-[12px] flex items-center gap-2 text-gray-800">
        <EventNoteIcon fontSize="small" color="primary" />
        Leave Requests
        <Chip label={`${requests.length}`} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
      </div>

      <TableContainer className="overflow-auto border border-gray-200 rounded-sm max-h-[calc(100vh-510px)] overflow-auto">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">#</TableCell>
              <TableCell className="!font-bold">Employee</TableCell>
              <TableCell className="!font-bold">Department</TableCell>
              <TableCell className="!font-bold">Leave Type</TableCell>
              <TableCell className="!font-bold">From</TableCell>
              <TableCell className="!font-bold">To</TableCell>
              <TableCell className="!font-bold">Days</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              requests.map((request, i) => (
                <TableRow
                  key={request.id}
                  sx={getRowColor(i)}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <Person2Outlined className="!w-3 text-blue-400" />
                      </Avatar>
                      <Box>
                        <div>
                          {request.employeeName}
                        </div>
                        <div>
                          {request.employeeCode}
                        </div>
                      </Box>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DomainIcon className="text-gray-600 !w-3" />
                      <div>{request.departmentName ? request.departmentName : '-'}</div>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.leaveTypeName}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        fontWeight: 500,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(request.fromDate)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(request.toDate)}</div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${request.days} day${request.days > 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      className="text-gray-800"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => openDetail(request)}
                      >
                        <VisibilityOutlined className="!w-4 !h-4 text-primary" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(event) => openActionMenu(event, request)}

                    >
                      <MoreVertOutlinedIcon className="text-gray-800" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {/* {loading && (
              <TableRow>
                <TableCell colSpan={8}>
                  <DataState compact type="loading" title="Loading leave requests..." />
                </TableCell>
              </TableRow>
            )} */}
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <DataState compact type="empty" title="No leave requests found." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}

      >
        <MenuItem onClick={() => openAction("approve")}>
          <div className="flex items-center gap-2">
            <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: actionColors.approve }} />
            <span>Approve</span>
          </div>
        </MenuItem>
        <MenuItem onClick={() => openAction("reject")}>
          <div className="flex items-center gap-2">
            <CancelOutlinedIcon sx={{ fontSize: 18, color: actionColors.reject }} />
            <span>Reject</span>
          </div>
        </MenuItem>
        {/* <Divider /> */}
        <MenuItem onClick={() => openAction("clarify")}>
          <div className="flex items-center gap-2">
            <AccessTimeIcon sx={{ fontSize: 18, color: actionColors.clarify }} />
            <span>Request Clarification</span>
          </div>
        </MenuItem>
        <MenuItem onClick={() => openAction("forceApprove")}>
          <div className="flex items-center gap-2">
            <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: actionColors.forceApprove }} />
            <span>Force Approve</span>
          </div>
        </MenuItem>
        {/* <Divider /> */}
        <MenuItem onClick={() => openAction("revoke")}>
          <div className="flex items-center gap-2">
            <CancelOutlinedIcon sx={{ fontSize: 18, color: actionColors.revoke }} />
            <span>Revoke</span>
          </div>
        </MenuItem>
        <MenuItem onClick={() => openAction("convertToLop")}>
          <div className="flex items-center gap-2">
            <AccessTimeIcon sx={{ fontSize: 18, color: actionColors.convertToLop }} />
            <span>Convert to LOP</span>
          </div>
        </MenuItem>
      </Menu>

      {/* Comp-Off Requests Section */}
      <Box sx={{ my: 4 }}>
        <div className="text-[12px] flex items-center gap-2 text-gray-800 !mt-3">
          <EventNoteIcon fontSize="small" color="secondary" />
          Comp-Off Credit Approvals
          <Chip label={`${compOffRequests.length}`} size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
        </div>

        <TableContainer className="overflow-auto border border-gray-200 rounded-sm my-3">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold">#</TableCell>
                <TableCell className="!font-bold">Employee</TableCell>
                <TableCell className="!font-bold">Worked Date</TableCell>
                <TableCell className="!font-bold">Days</TableCell>
                <TableCell className="!font-bold">Reason</TableCell>
                <TableCell className="!font-bold">Status</TableCell>
                <TableCell className="!font-bold">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!compOffLoading &&
                compOffRequests.map((request, i) => (
                  <TableRow
                    key={request.id}
                    sx={getRowColor(i)}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                          <Person2Outlined sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
                        </Avatar>
                        <div >
                          {request.employeeName ?? request.employeeId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(request.workedDate)}</div>
                    </TableCell>
                    <TableCell >
                      <Chip
                        label={`${request.creditDays} day${request.creditDays > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-ellipsis">
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CompOffStatusBadge status={request.currentStatus} />
                    </TableCell>
                    <TableCell>
                      {/* <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}> */}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openCompOffAction("approve", request)}
                        color="success"
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        className="!ml-3"
                        onClick={() => openCompOffAction("reject", request)}
                      >
                        Reject
                      </Button>
                      {/* </Box> */}
                    </TableCell>
                  </TableRow>
                ))}
              {!compOffLoading && compOffRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <DataState compact type="empty" title="No pending comp-off requests." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Action Dialog */}
      <Dialog
        open={Boolean(actionDialog)}
        onClose={() => setActionDialog(null)}
        maxWidth="sm"
        fullWidth
      >

        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {actionDialog && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: actionColors[actionDialog.kind],
                }}
              />
            )}
            {actionDialog ? actionLabels[actionDialog.kind] : ""}
          </div>
          <IconButton onClick={() => setActionDialog(null)} sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
            <CloseOutlinedIcon className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="text-[12px] mb-4">
            <div>{actionDialog?.request.employeeName}</div>
            <div className="mt-1">
              {actionDialog?.request.leaveTypeName} • {formatDate(actionDialog?.request.fromDate || '')} - {formatDate(actionDialog?.request.toDate || '')}
            </div>
          </div>
          <TextField
            label="Remarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Add your remarks here..."
          />
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            variant="outlined"
            onClick={() => setActionDialog(null)}
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitAction}
            sx={{ bgcolor: actionDialog ? actionColors[actionDialog.kind] : theme.palette.primary.main, }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(compOffActionDialog)}
        onClose={() => setCompOffActionDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex items-center gap-2 ml-3">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: compOffActionDialog?.kind === "approve" ? "#038f36" : "#ef2a2a",
              }}
            />
            <span className="text-gray-800 text-[12px]">
              {compOffActionDialog?.kind === "approve" ? "Approve" : "Reject"} Comp-Off Credit
            </span>
          </div>
          <IconButton
            onClick={() => setCompOffActionDialog(null)}
            sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
          >
            <CloseOutlinedIcon className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="text-[12px] mb-4 text-gray-600">
            <div className="font-medium text-gray-800">
              {compOffActionDialog?.request.employeeName ?? compOffActionDialog?.request.employeeId}
            </div>
            <div className="mt-1">
              Worked Date: {formatDate(compOffActionDialog?.request.workedDate || '')}
            </div>
            <div>
              Days: {compOffActionDialog?.request.creditDays} days
            </div>
            <div className="mt-1 text-gray-500">
              Reason: {compOffActionDialog?.request.reason}
            </div>
          </div>
          <TextField
            label="Comments"
            value={compOffRemarks}
            onChange={(event) => setCompOffRemarks(event.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Enter your comments here..."
          />
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            variant="outlined"
            onClick={() => setCompOffActionDialog(null)}
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCompOffAction}
            color={compOffActionDialog?.kind === "approve" ? 'success' : 'error'}
          >
            {compOffActionDialog?.kind === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
      <DetailsDialog
        open={Boolean(selectedRequest)}
        title={"Leave Approval Details"}
        onClose={() => setSelectedRequest(null)}
        maxWidth="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status Banner */}
            {(detailCalculation?.insufficientBalance ||
              (detailCalculation?.warnings &&
                detailCalculation?.warnings?.length > 0)) && (
                <div
                  className={`p-3 rounded-lg border-l-4 ${detailCalculation?.insufficientBalance
                    ? "bg-amber-50 border-amber-500"
                    : "bg-blue-50 border-blue-500"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {detailCalculation?.insufficientBalance ? (
                      <span className="text-amber-500 text-sm font-bold">⚠️</span>
                    ) : (
                      <span className="text-blue-500 text-sm font-bold">ℹ️</span>
                    )}
                    <div className="flex-1">
                      <div
                        className={`text-xs font-semibold ${detailCalculation?.insufficientBalance
                          ? "text-amber-800"
                          : "text-blue-800"
                          }`}
                      >
                        {detailCalculation?.insufficientBalance
                          ? "Insufficient Balance Warning"
                          : "Policy Information"}
                      </div>
                      {detailCalculation?.warnings?.map((warning, index) => (
                        <div
                          key={index}
                          className={`text-[11px] mt-0.5 ${detailCalculation?.insufficientBalance
                            ? "text-amber-700"
                            : "text-blue-700"
                            }`}
                        >
                          • {warning}
                        </div>
                      ))}
                      {detailCalculation?.insufficientBalance && (
                        <div className="text-[11px] text-amber-700 mt-1 font-medium">
                          {detailCalculation.potentialLop} days may be converted
                          to Loss of Pay (LOP)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="text-[12px] text-blue-600">Total Days</div>
                <div className="text-lg font-bold text-blue-700 mt-0.5">
                  {detailCalculation?.calculatedDays ||
                    selectedRequest.days ||
                    selectedRequest.totalDays ||
                    0}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="text-[12px] text-green-600">
                  Available Balance
                </div>
                <div
                  className={`text-lg font-bold mt-0.5 ${(detailBalance?.closingBalance || 0) <
                    (detailCalculation?.calculatedDays || 0)
                    ? "text-red-600"
                    : "text-green-700"
                    }`}
                >
                  {detailBalance?.closingBalance || 0}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="text-[12px] text-purple-600">Balance After</div>
                <div
                  className={`text-lg font-bold mt-0.5 ${(detailCalculation?.balanceAfter || 0) < 0
                    ? "text-red-600"
                    : "text-purple-700"
                    }`}
                >
                  {detailCalculation?.balanceAfter ?? "N/A"}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <div className="text-[12px] text-amber-600">Potential LOP</div>
                <div
                  className={`text-lg font-bold mt-0.5 ${(detailCalculation?.potentialLop || 0) > 0
                    ? "text-amber-700"
                    : "text-green-700"
                    }`}
                >
                  {detailCalculation?.potentialLop || 0}
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee Summary */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <Person2Outlined className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Employee Summary
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">Name</span>
                    <span className="text-[11px] text-gray-800 font-medium">
                      {selectedRequest.employeeName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Employee Code
                    </span>
                    <span className="text-[11px] text-gray-800">
                      {selectedRequest.employeeCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Department
                    </span>
                    <span className="text-[11px] text-gray-800">
                      {selectedRequest.departmentName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">Location</span>
                    <span className="text-[11px] text-gray-800">
                      {selectedRequest.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leave Request Details */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Leave Details
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Leave Type
                    </span>
                    <span className="text-[11px] text-gray-800 font-medium">
                      {selectedRequest.leaveTypeName} (
                      {selectedRequest.leaveTypeCode})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">Duration</span>
                    <span className="text-[11px] text-gray-800">
                      {formatDate(selectedRequest.fromDate)} -{" "}
                      {formatDate(selectedRequest.toDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Days Requested
                    </span>
                    <span className="text-[11px] text-gray-800 font-medium">
                      {detailCalculation?.calculatedDays ||
                        selectedRequest.days ||
                        selectedRequest.totalDays ||
                        0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">Status</span>
                    <LeaveStatusBadge
                      status={
                        selectedRequest.status || selectedRequest.currentStatus
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Leave Balance */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <WorkOutlineOutlined className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Leave Balance
                  </h3>
                </div>
                {detailBalance ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[11px] text-gray-500">
                        Opening Balance
                      </span>
                      <span className="text-[11px] text-gray-800">
                        {detailBalance.openingBalance}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[11px] text-gray-500">Accrued</span>
                      <span className="text-[11px] text-green-600">
                        +{detailBalance.accruedDays}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[11px] text-gray-500">
                        Consumed
                      </span>
                      <span className="text-[11px] text-red-600">
                        -{detailBalance.consumedDays}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-2">
                      <span className="text-[11px] font-medium text-gray-700">
                        Available Balance
                      </span>
                      <span
                        className={`text-sm font-bold ${detailBalance.closingBalance <
                          (detailCalculation?.calculatedDays || 0)
                          ? "text-red-600"
                          : "text-green-600"
                          }`}
                      >
                        {detailBalance.closingBalance}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 text-center py-4">
                    No balance information available
                  </div>
                )}
              </div>

              {/* Leave Impact */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <ClockIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Leave Impact
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Current Balance
                    </span>
                    <span className="text-[11px] text-gray-800 font-medium">
                      {detailCalculation?.currentBalance ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Balance After Leave
                    </span>
                    <span
                      className={`text-[11px] font-medium ${(detailCalculation?.balanceAfter || 0) < 0
                        ? "text-red-600"
                        : "text-green-600"
                        }`}
                    >
                      {detailCalculation?.balanceAfter ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-gray-500">
                      Potential LOP
                    </span>
                    <span
                      className={`text-[11px] font-medium ${(detailCalculation?.potentialLop || 0) > 0
                        ? "text-amber-600"
                        : "text-green-600"
                        }`}
                    >
                      {detailCalculation?.potentialLop || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-200 pt-2">
                    <span className="text-[11px] text-gray-500">Pay Type</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${detailCalculation?.payrollTreatment === "PAID" ||
                        selectedRequest.payrollTreatment === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {detailCalculation?.payrollTreatment ||
                        selectedRequest.payrollTreatment ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Day Breakdown - Full Width */}
              {detailCalculation?.dayBreakdown &&
                detailCalculation.dayBreakdown.length > 0 && (
                  <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <h3 className="text-[12px] font-semibold text-gray-800">
                        Day Breakdown
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {detailCalculation.dayBreakdown.map((day, index) => (
                        <div
                          key={index}
                          className={`p-2.5 rounded border ${day.holiday || day.weeklyOff
                            ? "bg-gray-50 border-gray-200"
                            : "bg-blue-100/50 border-blue-200"
                            }`}
                        >
                          <div className="text-[11px] font-medium text-gray-800">
                            {formatDate(day.date)}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {day.session} • {day.days} day
                            {day.days > 1 ? "s" : ""}
                          </div>
                          {(day.holiday || day.weeklyOff) && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {day.holiday ? "🎉 Holiday" : "📅 Weekend"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="text-[10px] text-gray-600 flex items-center flex-wrap gap-3">
                        <span className="font-medium">Policy:</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          {detailCalculation.policyApplied
                            ?.weeklyOffInclusion === "EXCLUDE"
                            ? "Weekends excluded"
                            : "Weekends included"}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          {detailCalculation.policyApplied?.holidayInclusion ===
                            "EXCLUDE"
                            ? "Holidays excluded"
                            : "Holidays included"}
                        </span>
                        {detailCalculation.policyApplied?.sandwichRule ==
                          true ? (
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                            Sandwich rule applied
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Reason */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <FolderOutlined className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Reason
                  </h3>
                </div>
                <div className="text-[11px] text-gray-800 bg-gray-50 p-3 rounded min-h-[65px] leading-relaxed">
                  {selectedRequest.appliedReason || "No reason provided"}
                </div>
              </div>

              {/* Approval Timeline */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <ClockIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Approval Timeline
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedRequest.approvals &&
                    selectedRequest.approvals.length > 0 &&
                    selectedRequest.approvals.map((approval, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${approval.actionTaken === "APPROVED"
                            ? "bg-green-500 ring-2 ring-green-300"
                            : approval.actionTaken === "SUBMITTED"
                              ? "bg-blue-500 ring-2 ring-blue-300"
                              : approval.actionTaken === "REJECTED"
                                ? "bg-red-500 ring-2 ring-red-300"
                                : approval.actionTaken === "HR_VERIFIED"
                                  ? "bg-yellow-500 ring-2 ring-yellow-300"
                                  : "bg-gray-300"
                            }`}
                        />
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                            {approval.actionTaken}
                          </div>
                          <div className="text-[11px] text-gray-800 font-medium">
                            {approval.approverName
                              ? approval.approverName
                              : "N/A"}{" "}
                            - {formatDateTime(approval.actionAt)}
                          </div>
                          {/* {approval.actionComments && (
                                  <div className="text-[11px] text-gray-800 bg-gray-50 p-2 rounded mt-0.5">
                                    {approval.actionComments}
                                  </div>
                                )} */}
                          {/* {approval.remarks && (
                                  <div className="text-[11px] text-gray-800 bg-gray-50 p-2 rounded mt-0.5">
                                    {approval.remarks}
                                  </div>
                                )} */}
                        </div>
                      </div>
                    ))}
                  {/* <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 ring-2 ring-amber-200 flex-shrink-0"></div>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pending With</div>
                            <div className="text-[11px] text-gray-800 font-medium">
                              {selectedRequest.managerName}
                            </div>
                          </div>
                        </div> */}
                  {selectedRequest.approverRemarks && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Remarks
                        </div>
                        <div className="text-[11px] text-gray-800 bg-gray-50 p-2 rounded mt-0.5">
                          {selectedRequest.approverRemarks}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <AttachFileOutlined className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Attachments
                  </h3>
                  {selectedRequest.attachments &&
                    selectedRequest.attachments.length > 0 && (
                      <span className="ml-auto text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {selectedRequest.attachments.length} file(s)
                      </span>
                    )}
                </div>

                {/* Show attachments if they exist */}
                {selectedRequest.attachments &&
                  selectedRequest.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 text-xs">📄</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-medium text-gray-800 truncate">
                              {attachment.documentName ||
                                `Attachment ${index + 1}`}
                            </div>
                            {/* {attachment.fileSize && (
                      <div className="text-[10px] text-gray-500">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </div>
                    )} */}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {attachment.fileUrl && (
                            <Button
                              size="small"
                              variant="text"
                              className="!text-primary !min-w-0 !p-1 !text-[11px]"
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded bg-gray-50/50">
                    <AttachFileOutlined className="w-6 h-6 text-gray-300 mb-1" />
                    <span className="text-[11px] text-gray-500">
                      No attachments uploaded
                    </span>
                  </div>
                )}

                {/* Show action buttons when pending */}
                {(selectedRequest.attachments && selectedRequest.attachments.length > 0) && (
                  !selectedRequest.hrVerified ? (
                    <div className="border-t border-gray-200 mt-3 pt-3 grid gap-3">
                      <TextField
                        placeholder="Comments"
                        value={hrComments}
                        multiline
                        rows={3}
                        onChange={(e) => setHrComments(e.target.value)}
                      />
                      <div className="flex items-center justify-center">
                        <Button
                          variant="contained"
                          size="small"
                          className="!bg-blue-600 hover:!bg-blue-700 !text-white !text-[11px] !px-4 !py-1"
                          onClick={() => handleHrVerification(selectedRequest)}
                        >
                          Verification
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center mt-3">
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                      >
                        Verified
                      </Button>
                      <div>{selectedRequest.hrVerifiedAt ? formatDateTime(selectedRequest.hrVerifiedAt) : ''}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  Audit Trail
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {auditEntries.length} item(s)
                </span>
              </div>
              {auditEntries.length === 0 ? (
                <div className="text-sm text-gray-500">No audit history is available yet.</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-auto pr-1">
                  {auditEntries.map((entry, index) => (
                    <div
                      key={entry.id || `${entry.fieldName || "field"}-${index}`}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[12px] font-medium text-gray-800">
                          {entry.fieldName || entry.screen || "Record update"}
                          <span className="rounded-full bg-white px-2 py-1 ml-2">
                            {entry.actionType || "UPDATE"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {entry.changedOn
                            ? formatDateTime(entry.changedOn)
                            : "—"}
                          <span className="rounded-full bg-gray-200 px-2 py-1 ml-2">
                            {entry.changedBy?.userName || "System"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">


                        {/* {entry.module ? (
                                            <span className="rounded-full bg-white px-2 py-1">
                                              {entry.module}
                                            </span>
                                          ) : null} */}
                      </div>
                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <div className="rounded-md border border-red-500 bg-red-100/50 dark:bg-head p-2">
                          <div className="text-[10px] uppercase tracking-wide text-red-500">
                            Previous
                          </div>
                          <div className="mt-1 break-words text-gray-700">
                            {entry.oldValue || "—"}
                          </div>
                        </div>
                        <div className="rounded-md border border-emerald-500 bg-emerald-100/50 dark:bg-head p-2">
                          <div className="text-[10px] uppercase tracking-wide text-emerald-500">
                            Current
                          </div>
                          <div className="mt-1 break-words text-gray-700">
                            {entry.newValue || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailsDialog>
    </LeavePageShell>
  );
}