import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAuth } from "../../auth/authContext";
import { resolveEmployeeIdFromProfile } from "../../auth/sessionIdentity";
import DataState from "../../components/DataState";
import { useUI } from "../../context/Snackbar";
import { authService } from "../../services/modules/auth";
import { isAccessDeniedError } from "../../utils/errorUtils";
import { leaveService } from "../../services/modules/leave";
import type { LeaveBalance, LeaveRequest } from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import LeaveStatusBadge from "./components/LeaveStatusBadge";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableBodyClassName,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "./components/leaveTableStyles";
import { isUpcomingApprovedLeave } from "./leaveRules";
import { formatDate } from "./leaveFormatters";

const balanceOrder = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Comp-Off",
  "Optional Holiday",
];


export default function MyLeaveDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const currentUserId = session?.user.userId ?? "";

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

        const employeeId = await resolveEmployeeIdFromProfile(session, authService);

        const balanceResult = await leaveService.getEmployeeLeaveBalances(employeeId, {
          page: 0,
          size: 20,
          sort: "leaveTypeName,ASC",
          leaveYear: new Date().getFullYear(),
        });

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
    return requests
      .filter((request) => isUpcomingApprovedLeave(request))
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
    <LeavePageShell
      title="My Leave"
      breadcrumbLabel="My Dashboard"
      subtitle="View balances, upcoming leave, and recent requests"
      actions={
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          className="!bg-primary"
          onClick={() => navigate("/leaves/apply")}
        >
          Apply Leave
        </Button>
      }
      contentClassName="p-5 space-y-5"
      titleClassName="text-2xl font-semibold text-gray-800"
    >

          {loading && (
            <DataState type="loading" title="Loading leave dashboard..." />
          )}

          {!loading && error && (
            <DataState type="error" title={error} />
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
                  <div className="text-xs text-gray-500 mt-1">submitted requests</div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-primary mb-3">Leave Balances</div>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={leaveTableContainerSx}
                >
                  <Table className={leaveTableClassName} sx={leaveTableSx}>
                    <TableHead>
                      <TableRow sx={leaveTableHeaderRowSx}>
                        <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
                        <TableCell className={leaveTableHeaderCellClassName}>Opening</TableCell>
                        <TableCell className={leaveTableHeaderCellClassName}>Accrued</TableCell>
                        <TableCell className={leaveTableHeaderCellClassName}>Used</TableCell>
                        <TableCell className={leaveTableHeaderCellClassName}>Pending</TableCell>
                        <TableCell className={leaveTableHeaderCellClassName}>Available</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className={leaveTableBodyClassName}>
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
                      {orderedBalances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <DataState
                              compact
                              type="empty"
                              title="No leave balances available."
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <div className="font-semibold text-primary mb-3">Upcoming Leave</div>
                  {upcomingLeaves.length === 0 ? (
                    <DataState
                      compact
                      type="empty"
                      title="No approved upcoming leave."
                    />
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
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={leaveTableContainerSx}
                  >
                    <Table className={leaveTableClassName} sx={leaveTableSx}>
                      <TableHead>
                        <TableRow sx={leaveTableHeaderRowSx}>
                          <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
                          <TableCell className={leaveTableHeaderCellClassName}>From Date</TableCell>
                          <TableCell className={leaveTableHeaderCellClassName}>To Date</TableCell>
                          <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
                          <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
                          <TableCell className={leaveTableHeaderCellClassName}>Approver</TableCell>
                          <TableCell className={leaveTableActionHeaderCellClassName}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody className={leaveTableBodyClassName}>
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
                              <LeaveStatusBadge status={request.status} />
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
                        {requests.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <DataState
                                compact
                                type="empty"
                                title="No recent leave requests found."
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </div>
            </>
          )}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Leave Request Details</div>
          <IconButton onClick={() => setSelectedRequest(null)}>
            <CloseOutlinedIcon className="!text-gray-800"/>
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
                <LeaveStatusBadge status={selectedRequest.status} />
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
    </LeavePageShell>
  );
}
