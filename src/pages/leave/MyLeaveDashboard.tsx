import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
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
  Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import { leaveService } from "../../services/modules/leave";
import type { LeaveBalance, LeaveRequest, LeaveRequestStatus } from "../../services/modules/leaveTypes";
import { leaveGroupLabels, leaveRoutes } from "./leaveRoutes";

const balanceOrder = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Comp-Off",
  "Optional Holiday",
];

const statusLabels: Record<LeaveRequestStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Manager Approval",
  PENDING_HR_VERIFICATION: "Pending HR Verification",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Cancelled",
  CANCEL_REQUESTED: "Cancelled",
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white text-center py-8 text-gray-500 text-sm">
      {message}
    </div>
  );
}

type ProfileResponse = {
  data?: {
    id?: string;
    employeeId?: string;
    userId?: string;
    employee?: {
      id?: string;
      employeeId?: string;
      userId?: string;
    };
  };
};

function isAccessDeniedError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? "");

  return /access denied|insufficient permissions|forbidden/i.test(message);
}

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

export default function MyLeaveDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const currentUserId = session?.user.userId ?? "";

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      showSpinner();
      try {
        if (!currentUserId) {
          throw new Error("Current employee id is unavailable");
        }

        let employeeIds = [currentUserId];
        try {
          const profileResponse = await authService.getProfile() as ProfileResponse;
          employeeIds = uniqueValues([
            profileResponse?.data?.employeeId ||
              profileResponse?.data?.employee?.employeeId,
            profileResponse?.data?.employee?.id,
            profileResponse?.data?.id,
            profileResponse?.data?.userId,
            profileResponse?.data?.employee?.userId,
            currentUserId,
          ]);
        } catch {
          employeeIds = [currentUserId];
        }

        let employeeId = employeeIds[0];
        let balanceResult = null;
        let lastBalanceError: unknown = null;

        for (const candidateEmployeeId of employeeIds) {
          try {
            balanceResult = await leaveService.getEmployeeLeaveBalances(candidateEmployeeId, {
              page: 0,
              size: 20,
              sort: "leaveTypeName,ASC",
              leaveYear: new Date().getFullYear(),
            });
            employeeId = candidateEmployeeId;
            break;
          } catch (balanceError) {
            lastBalanceError = balanceError;
          }
        }

        if (!balanceResult && lastBalanceError && !isAccessDeniedError(lastBalanceError)) {
          throw lastBalanceError;
        }

        const requestResult = await leaveService
          .getMyLeaves({
            employeeId,
            page: 0,
            size: 10,
            sort: "createdAt,DESC",
          })
          .catch(() => null);

        if (!isMounted) {
          return;
        }

        setBalances(balanceResult?.data?.content ?? []);
        setRequests(requestResult?.data?.content ?? []);
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        const message = err?.message || "Failed to load leave dashboard";
        if (isAccessDeniedError(err)) {
          setBalances([]);
          setRequests([]);
        } else {
          setError(message);
          showSnackbar(message, "error");
        }
      } finally {
        if (isMounted) {
          hideSpinner();
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
      hideSpinner();
    };
  }, [currentUserId]);

  const orderedBalances = useMemo(
    () =>
      [...balances].sort(
        (left, right) =>
          balanceOrder.indexOf(left.leaveTypeName) -
          balanceOrder.indexOf(right.leaveTypeName),
      ),
    [balances],
  );

  const upcomingLeaves = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return requests
      .filter(
        (request) =>
          request.status === "APPROVED" && new Date(request.fromDate) >= today,
      )
      .sort(
        (left, right) =>
          new Date(left.fromDate).getTime() - new Date(right.fromDate).getTime(),
      );
  }, [requests]);

  const totalAvailable = orderedBalances.reduce(
    (sum, item) => sum + item.balance,
    0,
  );
  const totalPending = orderedBalances.reduce((sum, item) => sum + item.pending, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Leave
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {leaveGroupLabels.employee}
          </span>
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-gray-800 font-medium">My Dashboard</span>
        </div>
      </div>

      <Paper elevation={0} className="border border-gray-300 !bg-white">
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

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-gray-800">My Leave</div>
              <div className="text-sm text-gray-500 mt-1">
                View balances, upcoming leave, and recent requests
              </div>
            </div>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              className="!bg-primary"
              onClick={() => navigate("/leaves/apply")}
            >
              Apply Leave
            </Button>
          </div>

          {loading && (
            <div className="border border-gray-300 rounded-lg p-5 text-sm text-gray-500 bg-gray-50">
              Loading leave dashboard...
            </div>
          )}

          {!loading && error && (
            <div className="border border-red-200 rounded-lg p-5 text-sm text-red-700 bg-red-50">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-gray-500 text-sm">Available Balance</div>
                  <div className="text-2xl font-semibold text-gray-800 mt-1">
                    {totalAvailable}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">days across leave types</div>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-gray-500 text-sm">Pending Approval</div>
                  <div className="text-2xl font-semibold text-gray-800 mt-1">
                    {totalPending}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">days currently reserved</div>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-gray-500 text-sm">Recent Requests</div>
                  <div className="text-2xl font-semibold text-gray-800 mt-1">
                    {requests.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">requests loaded</div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-primary mb-3">Leave Balances</div>
                <TableContainer component={Paper} elevation={0}>
                  <Table className="border">
                    <TableHead>
                      <TableRow className="bg-gray-100">
                        <TableCell className="!font-semibold text-gray-800">Leave Type</TableCell>
                        <TableCell className="!font-semibold text-gray-800">Opening</TableCell>
                        <TableCell className="!font-semibold text-gray-800">Accrued</TableCell>
                        <TableCell className="!font-semibold text-gray-800">Used</TableCell>
                        <TableCell className="!font-semibold text-gray-800">Pending</TableCell>
                        <TableCell className="!font-semibold text-gray-800">Available</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="bg-white">
                      {orderedBalances.map((balance) => (
                        <TableRow key={balance.leaveTypeId} hover>
                          <TableCell className="text-gray-800 font-medium">
                            {balance.leaveTypeName}
                          </TableCell>
                          <TableCell className="text-gray-800">{balance.opening}</TableCell>
                          <TableCell className="text-gray-800">{balance.credited}</TableCell>
                          <TableCell className="text-gray-800">{balance.availed}</TableCell>
                          <TableCell className="text-gray-800">{balance.pending}</TableCell>
                          <TableCell className="text-gray-800 font-semibold">
                            {balance.balance}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {orderedBalances.length === 0 && (
                    <EmptyState message="No leave balances available." />
                  )}
                </TableContainer>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <div className="font-semibold text-primary mb-3">Upcoming Leave</div>
                  {upcomingLeaves.length === 0 ? (
                    <EmptyState message="No approved upcoming leave." />
                  ) : (
                    <div className="space-y-3">
                      {upcomingLeaves.map((request) => (
                        <div
                          key={request.id}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-gray-800">
                              {request.leaveTypeName}
                            </div>
                            <Chip
                              size="small"
                              label={request.days}
                              className="!bg-white !text-gray-800"
                            />
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Approved by {request.managerName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="xl:col-span-2">
                  <div className="font-semibold text-primary mb-3">Recent Requests</div>
                  <TableContainer component={Paper} elevation={0}>
                    <Table className="border">
                      <TableHead>
                        <TableRow className="bg-gray-100">
                          <TableCell className="!font-semibold text-gray-800">Leave Type</TableCell>
                          <TableCell className="!font-semibold text-gray-800">From Date</TableCell>
                          <TableCell className="!font-semibold text-gray-800">To Date</TableCell>
                          <TableCell className="!font-semibold text-gray-800">Days</TableCell>
                          <TableCell className="!font-semibold text-gray-800">Status</TableCell>
                          <TableCell className="!font-semibold text-gray-800">Approver</TableCell>
                          <TableCell className="!font-semibold text-gray-800 text-center">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody className="bg-white">
                        {requests.map((request) => (
                          <TableRow key={request.id} hover>
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
                              {request.managerName}
                            </TableCell>
                            <TableCell className="text-center">
                              <Tooltip title="View request">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {requests.length === 0 && (
                      <EmptyState message="No recent leave requests found." />
                    )}
                  </TableContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </Paper>

      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Leave Request Details</div>
          <IconButton onClick={() => setSelectedRequest(null)}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        <DialogContent>
          {selectedRequest && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Leave Type</span>
                <span className="text-gray-800 font-medium">
                  {selectedRequest.leaveTypeName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Dates</span>
                <span className="text-gray-800">
                  {formatDate(selectedRequest.fromDate)} -{" "}
                  {formatDate(selectedRequest.toDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Days</span>
                <span className="text-gray-800">{selectedRequest.days}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Status</span>
                <Chip
                  size="small"
                  label={statusLabels[selectedRequest.status]}
                  className={statusClasses[selectedRequest.status]}
                />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Approver</span>
                <span className="text-gray-800">{selectedRequest.managerName}</span>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Reason</div>
                <div className="text-gray-800 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {selectedRequest.reason}
                </div>
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
