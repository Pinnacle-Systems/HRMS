import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
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
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../auth/authContext";
import { GlobalPagination } from "../../components/GlobalPagination";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  LeaveBalance,
  LeaveCalculationResult,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from "../../services/modules/leaveTypes";
import { leaveGroupLabels, leaveRoutes } from "./leaveRoutes";

const MOCK_MANAGER_ID = "emp-200";

const statusLabels: Record<LeaveRequestStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Manager Approval",
  PENDING_HR_VERIFICATION: "Pending HR Verification",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  CANCEL_REQUESTED: "Cancellation Requested",
  CANCELLED: "Cancelled",
  CONVERTED_TO_LOP: "Converted to LOP",
};

const statusClasses: Record<LeaveRequestStatus, string> = {
  DRAFT: "!bg-gray-100 !text-gray-800",
  PENDING: "!bg-primary-50 !text-primary",
  PENDING_HR_VERIFICATION: "!bg-blue-50 !text-blue-700",
  APPROVED: "!bg-green-50 !text-green-700",
  REJECTED: "!bg-red-50 !text-red-700",
  WITHDRAWN: "!bg-gray-100 !text-gray-700",
  CANCEL_REQUESTED: "!bg-yellow-50 !text-yellow-700",
  CANCELLED: "!bg-gray-100 !text-gray-700",
  CONVERTED_TO_LOP: "!bg-red-50 !text-red-700",
};

const tableTextCellSx = {
  color: "var(--text-primary)",
  fontSize: "0.875rem",
};

const tableContainerSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableHeaderRowSx = {
  backgroundColor: "var(--bg-secondary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
};

const tableRowSx = {
  backgroundColor: "var(--bg-primary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
  },
};

type ActionKind = "approve" | "reject" | "clarify";

type ActionDialogState = {
  kind: ActionKind;
  request: LeaveRequest;
} | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function overlaps(left: LeaveRequest, right: LeaveRequest) {
  return left.fromDate <= right.toDate && left.toDate >= right.fromDate;
}

export default function ManagerLeaveApprovalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allManagerRequests, setAllManagerRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<LeaveRequestStatus | "">("PENDING");
  const [department, setDepartment] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [detailBalance, setDetailBalance] = useState<LeaveBalance | null>(null);
  const [detailCalculation, setDetailCalculation] =
    useState<LeaveCalculationResult | null>(null);
  const [teamOverlap, setTeamOverlap] = useState<LeaveRequest[]>([]);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null);
  const [actionComments, setActionComments] = useState("");
  const [actionError, setActionError] = useState("");

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(allManagerRequests.map((request) => request.department)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [allManagerRequests],
  );

  const loadRequests = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response = await leaveService.getManagerLeaveApprovals({
        page: page - 1,
        size: limit,
        sort: "createdAt,DESC",
        managerId: MOCK_MANAGER_ID,
        status: status || undefined,
        department: department || undefined,
        leaveTypeId: leaveTypeId || undefined,
        fromDate: fromDate?.format("YYYY-MM-DD"),
        toDate: toDate?.format("YYYY-MM-DD"),
      });
      setRequests(response.data?.content ?? []);
      setTotal(response.data?.totalElements ?? 0);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load approval inbox", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [typeResponse, managerResponse] = await Promise.all([
        leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
        leaveService.getManagerLeaveApprovals({
          page: 0,
          size: 100,
          managerId: MOCK_MANAGER_ID,
          sort: "createdAt,DESC",
        }),
      ]);
      setLeaveTypes(typeResponse.data?.content ?? []);
      setAllManagerRequests(managerResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load approval filters", "error");
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [page, limit, status, department, leaveTypeId, fromDate, toDate]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openDetail = async (request: LeaveRequest) => {
    setSelectedRequest(request);
    const overlapsForRequest = allManagerRequests.filter(
      (item) =>
        item.id !== request.id &&
        item.status !== "REJECTED" &&
        item.status !== "CANCELLED" &&
        overlaps(item, request),
    );
    setTeamOverlap(overlapsForRequest);

    try {
      const [balanceResponse, calculationResponse] = await Promise.all([
        leaveService.getEmployeeLeaveBalances(request.employeeId, {
          page: 0,
          size: 20,
        }),
        leaveService.calculateLeaveDays({
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          fromDate: request.fromDate,
          toDate: request.toDate,
          dayType: request.dayType,
        }),
      ]);
      setDetailBalance(
        balanceResponse.data?.content.find(
          (balance) => balance.leaveTypeId === request.leaveTypeId,
        ) ?? null,
      );
      setDetailCalculation(calculationResponse.data ?? null);
    } catch {
      setDetailBalance(null);
      setDetailCalculation(null);
    }
  };

  const openActionDialog = (kind: ActionKind, request: LeaveRequest) => {
    setActionDialog({ kind, request });
    setActionComments("");
    setActionError("");
  };

  const closeActionDialog = () => {
    setActionDialog(null);
    setActionComments("");
    setActionError("");
  };

  const submitAction = async () => {
    if (!actionDialog) return;

    const comments = actionComments.trim();
    if (actionDialog.kind !== "approve" && !comments) {
      setActionError(
        actionDialog.kind === "reject"
          ? "Rejection reason is required"
          : "Clarification comments are required",
      );
      return;
    }

    showSpinner();
    try {
      const payload = { remarks: comments || "Approved by manager" };
      const response =
        actionDialog.kind === "approve"
          ? await leaveService.approveLeave(actionDialog.request.id, payload)
          : actionDialog.kind === "reject"
            ? await leaveService.rejectLeave(actionDialog.request.id, payload)
            : await leaveService.requestLeaveClarification(
                actionDialog.request.id,
                payload,
              );

      if (response.success) {
        showSnackbar(response.message || "Leave request updated", "success");
        closeActionDialog();
        setSelectedRequest(null);
        await loadLookups();
        await loadRequests();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update leave request", "error");
    } finally {
      hideSpinner();
    }
  };

  const selectedPending = selectedRequest?.status === "PENDING";
  const actionTitle =
    actionDialog?.kind === "approve"
      ? "Approve Leave Request"
      : actionDialog?.kind === "reject"
        ? "Reject Leave Request"
        : "Request Clarification";
  const actionConfirmText =
    actionDialog?.kind === "approve"
      ? "Approve"
      : actionDialog?.kind === "reject"
        ? "Reject"
        : "Request Clarification";

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1">
        Leave
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-primary font-medium">{leaveGroupLabels.manager}</span>
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-gray-800 font-medium">Approvals</span>
      </div>

      <Paper elevation={0} className="border border-gray-300 !bg-white overflow-hidden">
        <Tabs
          value={location.pathname}
          variant="scrollable"
          scrollButtons="auto"
          className="!border-b !border-gray-300"
          sx={{ "& .MuiTabs-indicator": { backgroundColor: "var(--color-primary)", height: 3 } }}
        >
          {visibleRoutes.map((route) => (
            <Tab
              key={route.path}
              value={route.path}
              label={route.label}
              onClick={() => navigate(route.path)}
              className="!text-gray-900"
            />
          ))}
        </Tabs>

        <div className="p-3 space-y-3">
          <div>
            <div className="text-xl font-semibold text-gray-800">
              Leave Approval Inbox
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Review team leave requests, overlaps, balances, and policy warnings
            </div>
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 border border-gray-300 rounded-lg p-3 bg-gray-50">
              <TextField
                select
                label="Status"
                value={status}
                slotProps={{
                  inputLabel: { shrink: true },
                  select: {
                    displayEmpty: true,
                    renderValue: (value: unknown) =>
                      value
                        ? statusLabels[value as LeaveRequestStatus]
                        : "All Statuses",
                  },
                }}
                onChange={(event) => {
                  setStatus(event.target.value as LeaveRequestStatus | "");
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Department"
                value={department}
                slotProps={{
                  inputLabel: { shrink: true },
                  select: {
                    displayEmpty: true,
                    renderValue: (value: unknown) =>
                      value ? String(value) : "All Departments",
                  },
                }}
                onChange={(event) => {
                  setDepartment(event.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departmentOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Leave Type"
                value={leaveTypeId}
                slotProps={{
                  inputLabel: { shrink: true },
                  select: {
                    displayEmpty: true,
                    renderValue: (value: unknown) =>
                      value
                        ? leaveTypes.find((leaveType) => leaveType.id === value)
                            ?.name
                        : "All Leave Types",
                  },
                }}
                onChange={(event) => {
                  setLeaveTypeId(event.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Leave Types</MenuItem>
                {leaveTypes.map((leaveType) => (
                  <MenuItem key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </MenuItem>
                ))}
              </TextField>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(value) => {
                  setFromDate(value);
                  setPage(1);
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                minDate={fromDate ?? undefined}
                onChange={(value) => {
                  setToDate(value);
                  setPage(1);
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </div>
          </LocalizationProvider>

          <TableContainer
            component={Paper}
            elevation={0}
            className="max-w-full overflow-auto"
            sx={tableContainerSx}
          >
            <Table className="border" size="small" sx={tableSx}>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell className="!font-semibold">Employee</TableCell>
                  <TableCell className="!font-semibold">Department</TableCell>
                  <TableCell className="!font-semibold">Leave Type</TableCell>
                  <TableCell className="!font-semibold">From Date</TableCell>
                  <TableCell className="!font-semibold">To Date</TableCell>
                  <TableCell className="!font-semibold">Days</TableCell>
                  <TableCell className="!font-semibold">Submitted On</TableCell>
                  <TableCell className="!font-semibold">Status</TableCell>
                  <TableCell className="!font-semibold text-center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading &&
                  requests.map((request) => (
                    <TableRow key={request.id} hover sx={tableRowSx}>
                      <TableCell sx={tableTextCellSx}>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {request.employeeCode}
                        </div>
                      </TableCell>
                      <TableCell sx={tableTextCellSx}>{request.department}</TableCell>
                      <TableCell sx={tableTextCellSx}>{request.leaveTypeName}</TableCell>
                      <TableCell sx={tableTextCellSx}>{formatDate(request.fromDate)}</TableCell>
                      <TableCell sx={tableTextCellSx}>{formatDate(request.toDate)}</TableCell>
                      <TableCell sx={tableTextCellSx}>{request.days}</TableCell>
                      <TableCell sx={tableTextCellSx}>{formatDate(request.appliedOn)}</TableCell>
                      <TableCell sx={tableTextCellSx}>
                        <Chip
                          size="small"
                          label={statusLabels[request.status]}
                          className={statusClasses[request.status]}
                        />
                      </TableCell>
                      <TableCell className="text-center" sx={tableTextCellSx}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(request)}>
                            <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                          </IconButton>
                        </Tooltip>
                        {request.status === "PENDING" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog("approve", request)}
                              >
                                <CheckCircleOutlineOutlinedIcon className="!w-4 !h-4 !text-green-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog("reject", request)}
                              >
                                <CloseOutlinedIcon className="!w-4 !h-4 !text-red-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Request Clarification">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog("clarify", request)}
                              >
                                <HelpOutlineOutlinedIcon className="!w-4 !h-4 text-primary" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {loading && (
              <Typography color="text.secondary" className="text-center py-8">
                Loading approval inbox...
              </Typography>
            )}
            {!loading && requests.length === 0 && (
              <Typography color="text.secondary" className="text-center py-8">
                No leave requests found.
              </Typography>
            )}
          </TableContainer>

          {total > 0 && (
            <GlobalPagination
              total={total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
              pageSizeOptions={[5, 10, 20, 50]}
              showTotal
            />
          )}
        </div>
      </Paper>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="lg"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Leave Approval Details</div>
          <IconButton onClick={() => setSelectedRequest(null)}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Employee Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Employee</span>
                    <span className="text-gray-800 font-medium">
                      {selectedRequest.employeeName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Code</span>
                    <span className="text-gray-800">{selectedRequest.employeeCode}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Department</span>
                    <span className="text-gray-800">{selectedRequest.department}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-800">{selectedRequest.location}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Leave Request Details</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Leave Type</span>
                    <span className="text-gray-800">{selectedRequest.leaveTypeName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Dates</span>
                    <span className="text-gray-800">
                      {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Days</span>
                    <span className="text-gray-800">{selectedRequest.days}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Status</span>
                    <Chip
                      size="small"
                      label={statusLabels[selectedRequest.status]}
                      className={statusClasses[selectedRequest.status]}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Available Leave Balance</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Available</span>
                    <span className="text-gray-800">{detailBalance?.balance ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Pending</span>
                    <span className="text-gray-800">{detailBalance?.pending ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Potential LOP</span>
                    <span className="text-gray-800">{detailCalculation?.lopDays ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Team Overlap</div>
                {teamOverlap.length > 0 ? (
                  <div className="space-y-2 text-gray-800">
                    {teamOverlap.map((item) => (
                      <div key={item.id}>
                        {item.employeeName} - {item.leaveTypeCode} ({formatDate(item.fromDate)} to {formatDate(item.toDate)})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No overlapping team leave found.</div>
                )}
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Reason</div>
                <div className="text-gray-800">{selectedRequest.reason}</div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Attachments</div>
                <div className="text-gray-500">No attachments uploaded.</div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Approval Timeline</div>
                <div className="space-y-2 text-gray-800">
                  <div>Submitted on {formatDate(selectedRequest.appliedOn)}</div>
                  <div>Pending with {selectedRequest.managerName}</div>
                  {selectedRequest.approverRemarks && (
                    <div>Remarks: {selectedRequest.approverRemarks}</div>
                  )}
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Policy Warnings</div>
                <div className="space-y-2 text-gray-800">
                  {(detailCalculation?.lopDays ?? 0) > 0 && (
                    <div>Insufficient balance may convert to LOP.</div>
                  )}
                  {teamOverlap.length > 0 && (
                    <div>Team coverage risk due to overlapping leave.</div>
                  )}
                  {(detailCalculation?.lopDays ?? 0) === 0 && teamOverlap.length === 0 && (
                    <div>No policy warnings for this request.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          {selectedPending && selectedRequest && (
            <>
              <Button
                variant="outlined"
                onClick={() => openActionDialog("clarify", selectedRequest)}
              >
                Request Clarification
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => openActionDialog("reject", selectedRequest)}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                className="!bg-primary"
                onClick={() => openActionDialog("approve", selectedRequest)}
              >
                Approve
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setSelectedRequest(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(actionDialog)} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">{actionTitle}</div>
          <IconButton onClick={closeActionDialog}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="space-y-3">
            <Typography color="text.secondary">
              {actionDialog?.request.employeeName} - {actionDialog?.request.leaveTypeName}
            </Typography>
            <TextField
              label={
                actionDialog?.kind === "approve"
                  ? "Comments"
                  : actionDialog?.kind === "reject"
                    ? "Reason"
                    : "Comments"
              }
              value={actionComments}
              onChange={(event) => {
                setActionComments(event.target.value);
                setActionError("");
              }}
              error={Boolean(actionError)}
              helperText={
                actionError ||
                (actionDialog?.kind === "approve"
                  ? "Optional"
                  : "Required")
              }
              multiline
              rows={3}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={closeActionDialog}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog?.kind === "reject" ? "error" : "primary"}
            className={actionDialog?.kind === "reject" ? "" : "!bg-primary"}
            onClick={submitAction}
          >
            {actionConfirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
