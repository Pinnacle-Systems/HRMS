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
  // CompOffCreditRequest,
  LeaveRequest,
  LeaveRequestStatus,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import CompOffStatusBadge from "../components/CompOffStatusBadge";
import { formatDate } from "../leaveFormatters";
import { getLeaveStatusMeta, leaveRequestStatusOptions } from "../leaveStatusMeta";
import { CheckCircleOutlineOutlined, Person2Outlined } from "@mui/icons-material";
import { getRowColor } from "../../const";

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
                      <div>{request.department}</div>
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
                <TableCell colSpan={8}>
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
      <Box sx={{ mt: 4 }}>
        <div className="text-[12px] flex items-center gap-2 text-gray-800 !mt-6">
          <EventNoteIcon fontSize="small" color="secondary" />
          Comp-Off Credit Approvals
          <Chip label={`${compOffRequests.length}`} size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
        </div>

        <TableContainer className="overflow-auto border border-gray-200 rounded-sm mt-3">
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
                  <TableCell colSpan={6}>
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
    </LeavePageShell>
  );
}