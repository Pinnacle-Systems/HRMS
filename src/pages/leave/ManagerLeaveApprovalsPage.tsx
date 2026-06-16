import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
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
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import ApprovalActionBar from "../../components/ApprovalActionBar";
import DataState from "../../components/DataState";
import DetailsDialog from "../../components/DetailsDialog";
import { GlobalPagination } from "../../components/GlobalPagination";
import { useUI } from "../../context/Snackbar";
import { useAuth } from "../../auth/authContext";
import { resolveEmployeeIdFromSession } from "../../auth/sessionIdentity";
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
  leaveTableActionCellSx,
  leaveTableActionHeaderCellClassName,
  leaveTableBodyCellSx,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableRowSx,
  leaveTableSx,
} from "./components/leaveTableStyles";
import {
  getLeaveStatusMeta,
  leaveRequestStatusOptions,
} from "./leaveStatusMeta";
import { getTeamOverlap } from "./leaveRules";
import dayjs from "dayjs";

type ActionKind = "approve" | "reject" | "clarify";

type ActionDialogState = {
  kind: ActionKind;
  request: LeaveRequest;
} | null;

export default function ManagerLeaveApprovalsPage() {
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
  const currentManagerEmployeeId = resolveEmployeeIdFromSession(session);

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
      const response = await leaveService.getMyManagerLeaveApprovals(
        {
          page: page - 1,
          size: limit,
          sort: "createdAt,DESC",
          status: status || undefined,
          department: department || undefined,
          leaveTypeId: leaveTypeId || undefined,
          fromDate: fromDate?.format("YYYY-MM-DD"),
          toDate: toDate?.format("YYYY-MM-DD"),
        },
        currentManagerEmployeeId,
      );
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
        leaveService.getMyManagerLeaveApprovals(
          {
            page: 0,
            size: 100,
            sort: "createdAt,DESC",
          },
          currentManagerEmployeeId,
        ),
      ]);
      setLeaveTypes(typeResponse.data?.content ?? []);
      setAllManagerRequests(managerResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load approval filters", "error");
    }
  };

  useEffect(() => {
    loadLookups();
  }, [currentManagerEmployeeId]);

  useEffect(() => {
    loadRequests();
  }, [
    page,
    limit,
    status,
    department,
    leaveTypeId,
    fromDate,
    toDate,
    currentManagerEmployeeId,
  ]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openDetail = async (request: LeaveRequest) => {
    setSelectedRequest(request);
    setTeamOverlap(getTeamOverlap(request, allManagerRequests));

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

  const resetFilters = () => {
    setStatus("PENDING");
    setDepartment("");
    setLeaveTypeId("");
    setFromDate(null);
    setToDate(null);
    setPage(1);
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
    <LeavePageShell
      group="manager"
      title="Leave Approval Inbox"
      breadcrumbLabel="Approvals"
      subtitle="Review team leave requests, overlaps, balances, and policy warnings"
    >

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <LeaveFilterBar onReset={resetFilters}>
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
                  setFromDate(dayjs(value));
                  setPage(1);
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                minDate={fromDate ?? undefined}
                onChange={(value) => {
                  setToDate(dayjs(value));
                  setPage(1);
                }}
                slotProps={{ textField: { fullWidth: true } }}
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
                  <TableCell className={leaveTableHeaderCellClassName}>Employee</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Department</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>From Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>To Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Submitted On</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
                  <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading &&
                  requests.map((request) => (
                    <TableRow key={request.id} hover sx={leaveTableRowSx}>
                      <TableCell sx={leaveTableBodyCellSx}>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {request.employeeCode}
                        </div>
                      </TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{request.department}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{request.leaveTypeName}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.fromDate)}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.toDate)}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{request.days}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.appliedOn)}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>
                        <LeaveStatusBadge status={request.status} />
                      </TableCell>
                      <TableCell sx={leaveTableActionCellSx}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(request)}>
                            <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                          </IconButton>
                        </Tooltip>
                        {request.status === "PENDING" && (
                          <ApprovalActionBar
                            variant="icons"
                            size="small"
                            onApprove={() => openActionDialog("approve", request)}
                            onReject={() => openActionDialog("reject", request)}
                            onClarify={() => openActionDialog("clarify", request)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <DataState
                        compact
                        type="loading"
                        title="Loading approval inbox..."
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
      <DetailsDialog
        open={Boolean(selectedRequest)}
        title="Leave Approval Details"
        onClose={() => setSelectedRequest(null)}
        maxWidth="lg"
        actions={
          <ApprovalActionBar
            onClarify={
              selectedPending && selectedRequest
                ? () => openActionDialog("clarify", selectedRequest)
                : undefined
            }
            onReject={
              selectedPending && selectedRequest
                ? () => openActionDialog("reject", selectedRequest)
                : undefined
            }
            onApprove={
              selectedPending && selectedRequest
                ? () => openActionDialog("approve", selectedRequest)
                : undefined
            }
            onClose={() => setSelectedRequest(null)}
          />
        }
      >
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
                  <LeaveStatusBadge status={selectedRequest.status} />
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
                  <div>No policy warnings for this mock request.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailsDialog>

      <Dialog open={Boolean(actionDialog)} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">{actionTitle}</div>
          <IconButton onClick={closeActionDialog}>
            <CloseOutlinedIcon className="!text-gray-800"/>
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
    </LeavePageShell>
  );
}
