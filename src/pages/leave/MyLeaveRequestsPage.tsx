import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../auth/authContext";
import DataState from "../../components/DataState";
import DetailsDialog from "../../components/DetailsDialog";
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
import LeaveFilterBar from "./components/LeaveFilterBar";
import LeavePageShell from "./components/LeavePageShell";
import { formatDate } from "./leaveFormatters";
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
import {
  getLeaveStatusMeta,
  leaveRequestStatusOptions,
} from "./leaveStatusMeta";
import { canRequestCancellation, canWithdrawLeave } from "./leaveRules";

export default function MyLeaveRequestsPage() {
  const navigate = useNavigate();
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
  const currentEmployeeId = session?.user.userId ?? "";

  const loadRequests = async () => {
    setLoading(true);
    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const response = await leaveService.getMyLeaves({
        employeeId: currentEmployeeId,
        page: page - 1,
        size: limit,
        sort: "createdAt,DESC",
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
  }, [page, limit, status, leaveTypeId, fromDate, toDate, currentEmployeeId]);

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

  const canWithdraw = canWithdrawLeave(actionRequest);
  const canCancel = canRequestCancellation(actionRequest);

  const resetFilters = () => {
    setStatus("");
    setLeaveTypeId("");
    setFromDate(null);
    setToDate(null);
    setPage(1);
  };

  return (
    <LeavePageShell
      title="My Leave Requests"
      breadcrumbLabel="My Requests"
      subtitle="Track submitted requests, approvals, and cancellation actions"
      actions={
        <Button
          variant="contained"
          className="!bg-primary"
          onClick={() => navigate("/leaves/apply")}
        >
          Apply Leave
        </Button>
      }
      paperClassName="border border-gray-300 !bg-white w-full max-w-full overflow-hidden"
    >

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <LeaveFilterBar gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3" onReset={resetFilters}>
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
                        ? getLeaveStatusMeta(value as LeaveRequestStatus).label
                        : "All Statuses",
                  },
                }}
                onChange={(event) => {
                  setStatus(event.target.value as LeaveRequestStatus | "");
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {leaveRequestStatusOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {getLeaveStatusMeta(value).label}
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
                slots={{
                  openPickerIcon: CalendarMonthOutlinedIcon,
                }}
                slotProps={{
                  textField: { fullWidth: true },
                  openPickerButton: {
                    color: "primary",
                    edge: "end",
                  },
                }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                minDate={fromDate ?? undefined}
                onChange={(value) => {
                  setToDate(value);
                  setPage(1);
                }}
                slots={{
                  openPickerIcon: CalendarMonthOutlinedIcon,
                }}
                slotProps={{
                  textField: { fullWidth: true },
                  openPickerButton: {
                    color: "primary",
                    edge: "end",
                  },
                }}
              />
            </LeaveFilterBar>
          </LocalizationProvider>

          <TableContainer
            component={Paper}
            elevation={0}
            className="max-w-full overflow-auto"
            sx={leaveTableContainerSx}
          >
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Request No</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>From Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>To Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Submitted On</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Current Approver</TableCell>
                  <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className={leaveTableBodyClassName}>
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
                        <LeaveStatusBadge status={request.status} />
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
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <DataState
                        compact
                        type="loading"
                        title="Loading leave requests..."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <DataState
                        compact
                        type="empty"
                        title="No leave requests found."
                      />
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
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
              pageSizeOptions={[5, 10, 20, 50]}
              showTotal
            />
          )}
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

      <DetailsDialog
        open={Boolean(selectedRequest)}
        title="Leave Request Details"
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        actions={
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setSelectedRequest(null)}
          >
            Close
          </Button>
        }
      >
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
                  <LeaveStatusBadge status={selectedRequest.status} />
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
      </DetailsDialog>
    </LeavePageShell>
  );
}
