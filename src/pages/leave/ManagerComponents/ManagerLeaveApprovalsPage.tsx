import { useEffect, useState } from "react";
import {
  Button,
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
  Tooltip,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import ApprovalActionBar from "../../../components/ApprovalActionBar";
import DataState from "../../../components/DataState";
import DetailsDialog from "../../../components/DetailsDialog";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { useUI } from "../../../context/Snackbar";
import { useAuth } from "../../../auth/authContext";
import { resolveEmployeeIdFromSession } from "../../../auth/sessionIdentity";
import { leaveService } from "../../../services/modules/leave";
import type {
  LeaveBalance,
  LeaveCalculationResult,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from "../../../services/modules/leaveTypes";
import LeaveFilterBar from "../components/LeaveFilterBar";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableClassName,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";
import {
  getLeaveStatusMeta,
  leaveRequestStatusOptions,
} from "../leaveStatusMeta";
import { getTeamOverlap } from "../leaveRules";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import {
  AttachFileOutlined,
  CheckCircleOutlineOutlined,
  FolderOutlined,
  GroupOutlined,
  MoreVertOutlined,
  Person2Outlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { CalendarIcon, ClockIcon } from "@mui/x-date-pickers";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { formatDateTime } from "../../../utils/dateFormatter";

type ActionKind = "approve" | "reject" | "clarify" | "hrVerify";
type ActionDialogState = {
  kind: ActionKind;
  request: LeaveRequest;
} | null;

export default function ManagerLeaveApprovalsPage() {
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allManagerRequests, setAllManagerRequests] = useState<LeaveRequest[]>(
    [],
  );
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
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [detailBalance, setDetailBalance] = useState<LeaveBalance | null>(null);
  const [detailCalculation, setDetailCalculation] =
    useState<LeaveCalculationResult | null>(null);
  const [teamOverlap, setTeamOverlap] = useState<LeaveRequest[]>([]);
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null);
  const [actionComments, setActionComments] = useState("");
  const [actionError, setActionError] = useState("");
  const currentManagerEmployeeId = resolveEmployeeIdFromSession(session);
  // const [departments, setDepartments] = useState<Department[]>([]);
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const [actionRequest, setActionRequest] = useState<LeaveRequest | null>(null);
  const isAdmin = session?.user.roles.includes("ADMIN");
  const [manager, setManager] = useState<any>(null);

  // const getDepartments = async () => {
  //   try {
  //     const response: any = await departmentService.getActiveDepartments();
  //     setDepartments(response.data.content || response.data || []);
  //   } catch (error: any) {
  //     console.error("Failed to load departments:", error.message);
  //   }
  // };

  // useEffect(() => {
  //   if (isAdmin) {
  //     getDepartments();
  //   }
  // }, []);

  const loadRequests = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getManagerLeaveApprovals(
        {
          page: page - 1,
          size: limit,
          sort: "createdAt,DESC",
          status: status || "PENDING",
          // departmentId: department || undefined,
          leaveTypeId: leaveTypeId || undefined,
          fromDate: fromDate?.format("YYYY-MM-DD"),
          toDate: toDate?.format("YYYY-MM-DD"),
          managerId: manager?.id || undefined,
        },
        manager?.id,
        isAdmin,
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
      const [typeResponse, managerResponse]: any = await Promise.all([
        leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
        leaveService.getMyManagerLeaveApprovals(
          {
            page: 0,
            size: 100,
            sort: "createdAt,DESC",
          },
          // currentManagerEmployeeId,
        ),
      ]);
      setLeaveTypes(typeResponse.data ?? []);
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
    manager,
    currentManagerEmployeeId,
  ]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openDetail = async (request: LeaveRequest) => {
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
    setTeamOverlap(getTeamOverlap(request, allManagerRequests));

    try {
      const [balanceResponse, calculationResponse]: any = await Promise.all([
        leaveService.getEmployeeLeaveBalances(request.employeeId),
        leaveService.calculateLeaveDays({
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          fromDate: request.fromDate,
          toDate: request.toDate,
          // dayType: request.dayType,
        }),
      ]);
      setDetailBalance(
        balanceResponse.data?.content.find(
          (balance: any) => balance.leaveTypeId === request.leaveTypeId,
        ) ?? null,
      );
      setDetailCalculation(calculationResponse.data ?? null);
    } catch {
      setDetailBalance(null);
      setDetailCalculation(null);
    }
  };

  const openActionDialog = (kind: ActionKind, request: any) => {
    setActionDialog({ kind, request });
    setActionComments("");
    setActionError("");
  };

  const closeActionDialog = () => {
    setActionDialog(null);
    setActionComments("");
    setActionError("");
  };

  const handleHrVerification = async (request: LeaveRequest) => {
    setActionDialog({ kind: "hrVerify", request });
    setActionComments("");
    setActionError("");
  };

  const submitAction = async () => {
    if (!actionDialog) return;

    const comments = actionComments.trim();
    if (
      actionDialog.kind !== "approve" &&
      actionDialog.kind !== "hrVerify" &&
      !comments
    ) {
      setActionError(
        actionDialog.kind === "reject"
          ? "Rejection reason is required"
          : "Clarification comments are required",
      );
      return;
    }

    showSpinner();
    try {
      const payload: any = {
        comments: comments || "Approved by manager",
        lopLeaveTypeId: actionDialog.request.leaveTypeId,
      };
      // const response =
      //   actionDialog.kind === "approve"
      //     ? await leaveService.approveLeave(actionDialog.request.id, payload)
      //     : actionDialog.kind === "reject"
      //       ? await leaveService.rejectLeave(actionDialog.request.id, payload)
      //       : await leaveService.requestLeaveClarification(
      //           actionDialog.request.id,
      //           payload,
      //         );
      let response: any;
      if (actionDialog.kind === "approve") {
        response = await leaveService.approveLeave(
          actionDialog.request.id,
          payload,
        );
      } else if (actionDialog.kind === "reject") {
        response = await leaveService.rejectLeave(
          actionDialog.request.id,
          payload,
        );
      } else if (actionDialog.kind === "clarify") {
        response = await leaveService.requestLeaveClarification(
          actionDialog.request.id,
          payload,
        );
      } else if (actionDialog.kind === "hrVerify") {
        response = await leaveService.sendToHrVerification(
          actionDialog.request.id,
          {
            verified: true,
            comments: comments || "Sent for HR verification",
          },
        );
      }

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

  const selectedPending = selectedRequest?.currentStatus === "PENDING";
  const actionTitle =
    actionDialog?.kind === "approve"
      ? "Approve Leave Request"
      : actionDialog?.kind === "reject"
        ? "Reject Leave Request"
        : actionDialog?.kind === "clarify"
          ? "Request Clarification"
          : "Send to HR Verification";
  const actionConfirmText =
    actionDialog?.kind === "approve"
      ? "Approve"
      : actionDialog?.kind === "reject"
        ? "Reject"
        : actionDialog?.kind === "clarify"
          ? "Request Clarification"
          : "Send to HR";

  const handleManagerChange = (selectedManager: any) => {
    setManager(selectedManager);
    setPage(1);
  };

  return (
    <LeavePageShell
      group="manager"
      title="Leave Approval Inbox"
      breadcrumbLabel="Approvals"
      subtitle="Review team leave requests, overlaps, balances, and policy warnings"
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <LeaveFilterBar onReset={resetFilters}>
          {isAdmin && (
            <>
              <EmployeeSelector
                value={manager}
                onChange={handleManagerChange}
                label="Select Manager"
                isManager={true}
              />
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
                        : "All Status",
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
              {/* <TextField
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
                {departments.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.departmentName}
                  </MenuItem>
                ))}
              </TextField> */}
            </>
          )}
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

      <TableContainer className="max-w-full overflow-auto h-[calc(100vh-430px)]">
        <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>
                S No
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Employee
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Department
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Leave Type
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                From Date
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                To Date
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Days
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Submitted On
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Status
              </TableCell>
              <TableCell className={leaveTableActionHeaderCellClassName}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              requests.map((request, i) => (
                <TableRow key={request.id} sx={getRowColor(i)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{request.employeeName}</div>
                    <div
                      className="text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {request.department}
                    </div>
                  </TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell>{request.leaveTypeName}</TableCell>
                  <TableCell>{formatDate(request.fromDate)}</TableCell>
                  <TableCell>{formatDate(request.toDate)}</TableCell>
                  <TableCell>{request.days || request.totalDays}</TableCell>
                  <TableCell>
                    {formatDate(request.appliedOn) ||
                      formatDate(request.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <LeaveStatusBadge
                      status={request.status || request.currentStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => openDetail(request)}
                      >
                        <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                      </IconButton>
                    </Tooltip>
                    {request.currentStatus === "PENDING" && (
                      <Tooltip title="More">
                        <IconButton
                          size="small"
                          onClick={(event) => openActionMenu(event, request)}
                        >
                          <MoreVertOutlined className="!w-4 !h-4 text-gray-900" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {/* {loading && (
              <TableRow>
                <TableCell colSpan={9}>
                  <DataState
                    compact
                    type="loading"
                    title="Loading approval inbox..."
                  />
                </TableCell>
              </TableRow>
            )} */}
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

      {/* Enhanced Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}
        classes={{ paper: "bg-white shadow-2xl rounded-xl mt-1 min-w-[180px]" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* <MenuItem className="text-gray-400"> */}
        <ApprovalActionBar
          variant="menu"
          size="small"
          onApprove={() => openActionDialog("approve", actionRequest)}
          onReject={() => openActionDialog("reject", actionRequest)}
          onClarify={() => openActionDialog("clarify", actionRequest)}
        />
        {/* </MenuItem> */}
      </Menu>

      {/* <DetailsDialog
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
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
      </DetailsDialog> */}

      <DetailsDialog
        open={Boolean(selectedRequest)}
        title={"Leave Approval Details"}
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
          <div className="space-y-6">
            {/* Status Banner */}
            {(detailCalculation?.insufficientBalance ||
              (detailCalculation?.warnings &&
                detailCalculation?.warnings?.length > 0)) && (
              <div
                className={`p-3 rounded-lg border-l-4 ${
                  detailCalculation?.insufficientBalance
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
                      className={`text-xs font-semibold ${
                        detailCalculation?.insufficientBalance
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
                        className={`text-[11px] mt-0.5 ${
                          detailCalculation?.insufficientBalance
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
                  className={`text-lg font-bold mt-0.5 ${
                    (detailBalance?.closingBalance || 0) <
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
                  className={`text-lg font-bold mt-0.5 ${
                    (detailCalculation?.balanceAfter || 0) < 0
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
                  className={`text-lg font-bold mt-0.5 ${
                    (detailCalculation?.potentialLop || 0) > 0
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
                      {selectedRequest.department}
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
                        className={`text-sm font-bold ${
                          detailBalance.closingBalance <
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
                      className={`text-[11px] font-medium ${
                        (detailCalculation?.balanceAfter || 0) < 0
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
                      className={`text-[11px] font-medium ${
                        (detailCalculation?.potentialLop || 0) > 0
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
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        detailCalculation?.payrollTreatment === "PAID" ||
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
                          className={`p-2.5 rounded border ${
                            day.holiday || day.weeklyOff
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

              {/* Team Overlap */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <GroupOutlined className="w-4 h-4 text-primary" />
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    Team Overlap
                  </h3>
                  {teamOverlap.length > 0 && (
                    <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {teamOverlap.length}{" "}
                      {teamOverlap.length === 1 ? "member" : "members"}
                    </span>
                  )}
                </div>
                {teamOverlap.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {teamOverlap.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-amber-100/50 rounded border border-amber-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-gray-800 truncate">
                              {item.employeeName}
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {item.leaveTypeCode} • {formatDate(item.fromDate)}{" "}
                              - {formatDate(item.toDate)}
                            </div>
                          </div>
                          <span className="text-amber-500 text-xs ml-2">
                            ⚠️
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 justify-center py-4">
                    <CheckCircleOutlineOutlined className="w-4 h-4 text-green-500" />
                    <span className="text-[11px]">
                      No overlapping team leave found
                    </span>
                  </div>
                )}
              </div>

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
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            approval.actionTaken === "APPROVED"
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
                {(selectedRequest.currentStatus === "PENDING" || selectedRequest.status === "PENDING") && 
                (selectedRequest.attachmentIds && selectedRequest.attachmentIds.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center">
                    <Button
                      variant="contained"
                      size="small"
                      className="!bg-blue-600 hover:!bg-blue-700 !text-white !text-[11px] !px-4 !py-1"
                      onClick={() => handleHrVerification(selectedRequest)}
                    >
                      Send to HR Verification
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailsDialog>

      <Dialog
        open={Boolean(actionDialog)}
        onClose={closeActionDialog}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="text-gray-800 ml-4 text-[12px]">{actionTitle}</div>
          <IconButton onClick={closeActionDialog}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="space-y-3">
            <Typography color="text.secondary">
              {actionDialog?.request.employeeName} -{" "}
              {actionDialog?.request.leaveTypeName}
            </Typography>
            <TextField
              label={
                actionDialog?.kind === "approve"
                  ? "Comments"
                  : actionDialog?.kind === "reject"
                    ? "Reason"
                    : actionDialog?.kind === "hrVerify"
                      ? "Verification Comments"
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
                (actionDialog?.kind === "approve" ||
                actionDialog?.kind === "hrVerify"
                  ? "Optional"
                  : "Required")
              }
              multiline
              rows={3}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={closeActionDialog}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog?.kind === "reject" ? "error" : "success"}
            className={actionDialog?.kind === "clarify" ? "!bg-primary" : ""}
            onClick={submitAction}
          >
            {actionConfirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}
