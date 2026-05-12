import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
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
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isFutureLeave(request: LeaveRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(request.fromDate) >= today;
}

function EmptyState() {
  return (
    <div className="bg-white text-center py-8 text-gray-500 text-sm">
      No leave requests found.
    </div>
  );
}

export default function MyLeaveRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<LeaveRequestStatus | "">("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [detailBalance, setDetailBalance] = useState<LeaveBalance | null>(null);
  const [detailCalculation, setDetailCalculation] =
    useState<LeaveCalculationResult | null>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(null);
  const [actionRequest, setActionRequest] = useState<LeaveRequest | null>(null);

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  const loadRequests = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response = await leaveService.getMyLeaves({
        page: page - 1,
        size: limit,
        sort: "appliedOn,DESC",
        status: status || undefined,
        leaveTypeId: leaveTypeId || undefined,
        fromDate: fromDate?.format("YYYY-MM-DD"),
        toDate: toDate?.format("YYYY-MM-DD"),
      });
      setRequests(response.data?.content ?? []);
      setTotal(response.data?.totalElements ?? 0);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave requests", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadLeaveTypes = async () => {
      try {
        const response = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data?.content ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          showSnackbar(err?.message || "Failed to load leave types", "error");
        }
      }
    };

    loadLeaveTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadRequests();
  }, [page, limit, status, leaveTypeId, fromDate, toDate]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    request: LeaveRequest,
  ) => {
    setActionAnchorEl(event.currentTarget);
    setActionRequest(request);
  };

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionRequest(null);
  };

  const openDetail = async (request: LeaveRequest) => {
    setSelectedRequest(request);
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

  const confirmWithdraw = (request: LeaveRequest) => {
    closeActionMenu();
    showConfirmDialog({
      title: "Withdraw Leave Request",
      message: `Withdraw request ${request.id}?`,
      confirmText: "Withdraw",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response = await leaveService.withdrawLeaveRequest(request.id, {
            remarks: "Withdrawn by employee",
          });
          if (response.success) {
            showSnackbar(response.message || "Leave withdrawn", "success");
            await loadRequests();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to withdraw leave", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const confirmCancellation = (request: LeaveRequest) => {
    closeActionMenu();
    showConfirmDialog({
      title: "Request Leave Cancellation",
      message: `Request cancellation for approved leave ${request.id}?`,
      confirmText: "Request Cancellation",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response = await leaveService.requestLeaveCancellation(request.id, {
            remarks: "Cancellation requested by employee",
          });
          if (response.success) {
            showSnackbar(response.message || "Cancellation requested", "success");
            await loadRequests();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to request cancellation", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const canWithdraw = actionRequest?.status === "PENDING";
  const canCancel =
    actionRequest?.status === "APPROVED" &&
    actionRequest !== null &&
    isFutureLeave(actionRequest);

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1 min-w-0">
          Leave
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {leaveGroupLabels.employee}
          </span>
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-gray-800 font-medium">My Requests</span>
        </div>
      </div>

      <Paper
        elevation={0}
        className="border border-gray-300 !bg-white w-full max-w-full overflow-hidden"
      >
        <Tabs
          value={location.pathname}
          variant="scrollable"
          scrollButtons="auto"
          className="!border-b !border-gray-300"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
            },
          }}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-gray-800">
                My Leave Requests
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Track submitted requests, approvals, and cancellation actions
              </div>
            </div>
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => navigate("/leaves/apply")}
            >
              Apply Leave
            </Button>
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 border border-gray-300 rounded-lg p-3 bg-gray-50">
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
          >
            <Table className="border" size="small">
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell className="!font-semibold text-gray-800">Request No</TableCell>
                  <TableCell className="!font-semibold text-gray-800">Leave Type</TableCell>
                  <TableCell className="!font-semibold text-gray-800">From Date</TableCell>
                  <TableCell className="!font-semibold text-gray-800">To Date</TableCell>
                  <TableCell className="!font-semibold text-gray-800">Days</TableCell>
                  <TableCell className="!font-semibold text-gray-800">Status</TableCell>
                  <TableCell className="!font-semibold text-gray-800">Submitted On</TableCell>
                  <TableCell className="!font-semibold text-gray-800">Current Approver</TableCell>
                  <TableCell className="!font-semibold text-gray-800 text-center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {!loading &&
                  requests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell className="text-gray-800">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {request.id}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-800 font-medium">
                        {request.leaveTypeName}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {formatDate(request.fromDate)}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {formatDate(request.toDate)}
                      </TableCell>
                      <TableCell className="text-gray-800">{request.days}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusLabels[request.status]}
                          className={statusClasses[request.status]}
                        />
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {formatDate(request.appliedOn)}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {request.managerName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(request)}>
                            <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(event) => openActionMenu(event, request)}
                        >
                          <MoreVertOutlinedIcon className="!w-4 !h-4 text-gray-600" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {loading && (
              <div className="bg-white text-center py-8 text-gray-500 text-sm">
                Loading leave requests...
              </div>
            )}
            {!loading && requests.length === 0 && <EmptyState />}
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

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}
        classes={{ paper: "bg-white" }}
      >
        <MenuItem
          onClick={() => {
            if (actionRequest) openDetail(actionRequest);
            closeActionMenu();
          }}
        >
          View
        </MenuItem>
        {canWithdraw && actionRequest && (
          <MenuItem onClick={() => confirmWithdraw(actionRequest)}>
            Withdraw
          </MenuItem>
        )}
        {canCancel && actionRequest && (
          <MenuItem onClick={() => confirmCancellation(actionRequest)}>
            Request Cancellation
          </MenuItem>
        )}
        {!canWithdraw && !canCancel && (
          <MenuItem disabled>No status actions available</MenuItem>
        )}
      </Menu>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Leave Request Details</div>
          <IconButton onClick={() => setSelectedRequest(null)}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          {selectedRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Request Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Request No</span>
                    <span className="text-gray-800 font-medium">{selectedRequest.id}</span>
                  </div>
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
                <div className="font-semibold text-primary mb-3">Day-wise Breakup</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Working Days</span>
                    <span className="text-gray-800">{detailCalculation?.workingDays ?? selectedRequest.days}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Excluded Weekends</span>
                    <span className="text-gray-800">{detailCalculation?.weeklyOffs.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Excluded Holidays</span>
                    <span className="text-gray-800">{detailCalculation?.holidays.length ?? 0}</span>
                  </div>
                </div>
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
                <div className="font-semibold text-primary mb-3">Attachments</div>
                <div className="text-gray-500">No attachments uploaded.</div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Balance Impact</div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Available Balance</span>
                    <span className="text-gray-800">{detailBalance?.balance ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Requested Days</span>
                    <span className="text-gray-800">{selectedRequest.days}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Potential LOP</span>
                    <span className="text-gray-800">{detailCalculation?.lopDays ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="font-semibold text-primary mb-3">Comments / History</div>
                <div className="text-gray-800">{selectedRequest.reason}</div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setSelectedRequest(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
