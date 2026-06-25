import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
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
  leaveTableHeaderCellClassName,
} from "./components/leaveTableStyles";
import {
  getLeaveStatusMeta,
  leaveRequestStatusOptions,
} from "./leaveStatusMeta";
import { canRequestCancellation, canWithdrawLeave } from "./leaveRules";
import dayjs from "dayjs";
import { ClockIcon } from "@mui/x-date-pickers";
import {
  CancelOutlined,
  CheckCircleOutlineOutlined,
  DeleteOutlineOutlined,
  SaveAltOutlined,
} from "@mui/icons-material";
import { selectSx } from "../../const";
import {
  getRowColor,
  getStickyLeftSx,
  getStickyRightSx,
  stickyHeaderLeftSx,
  stickyHeaderRightSx,
} from "../const";

export default function MyLeaveRequestsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<LeaveRequestStatus | "">("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [detailBalance, setDetailBalance] = useState<LeaveBalance | null>(null);
  // const [detailCalculation, setDetailCalculation] =
  //   useState<LeaveCalculationResult | null>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(
    null,
  );
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
        page: page,
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
        const response:any = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data ?? []);
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
      const [balanceResponse, _calculationResponse]: any = await Promise.all([
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
      // setDetailCalculation(calculationResponse.data ?? null);
    } catch {
      setDetailBalance(null);
      // setDetailCalculation(null);
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
            comments: "Withdrawn by employee",
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

  const handleDelete = (request: LeaveRequest) => {
    closeActionMenu();
    showConfirmDialog({
      title: "Delete Leave Request",
      message: `Are you sure you want to delete this request?`,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          showSpinner();
          const response = await leaveService.deleteLeave(request?.id);
          if (response.success) {
            await loadRequests();
          }
        } catch (error: any) {
          showSnackbar(error.message, "error");
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
          const response = await leaveService.requestLeaveCancellation(
            request.id,
            {
              comments: "Cancellation requested by employee",
            },
          );
          if (response.success) {
            showSnackbar(
              response.message || "Cancellation requested",
              "success",
            );
            await loadRequests();
          }
        } catch (err: any) {
          showSnackbar(
            err?.message || "Failed to request cancellation",
            "error",
          );
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
    setPage(0);
  };

  return (
    // <LeavePageShell
    //   group="employee"
    //   title="My Leave Requests"
    //   breadcrumbLabel="My Requests"
    //   subtitle="Track submitted requests, approvals, and cancellation actions"
    //   actions={
    //     <Button
    //       variant="contained"
    //       className="!bg-primary"
    //       onClick={() => navigate("/leaves/apply")}
    //     >
    //       Apply Leave
    //     </Button>
    //   }
    //   paperClassName="border border-gray-200 !bg-white w-full max-w-full overflow-hidden"
    // >

    //       <LocalizationProvider dateAdapter={AdapterDayjs}>
    //         <LeaveFilterBar gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 gap-y-6" onReset={resetFilters}>
    //           <TextField
    //             select
    //             label="Status"
    //             value={status}
    //             slotProps={{
    //               inputLabel: { shrink: true },
    //               select: {
    //                 displayEmpty: true,
    //                 renderValue: (value: unknown) =>
    //                   value
    //                     ? getLeaveStatusMeta(value as LeaveRequestStatus).label
    //                     : "All Status",
    //               },
    //             }}
    //             onChange={(event) => {
    //               setStatus(event.target.value as LeaveRequestStatus | "");
    //               setPage(0);
    //             }}
    //           >
    //             <MenuItem value="">All Statuses</MenuItem>
    //             {leaveRequestStatusOptions.map((value) => (
    //               <MenuItem key={value} value={value}>
    //                 {getLeaveStatusMeta(value).label}
    //               </MenuItem>
    //             ))}
    //           </TextField>
    //           <TextField
    //             select
    //             label="Leave Type"
    //             value={leaveTypeId}
    //             slotProps={{
    //               inputLabel: { shrink: true },
    //               select: {
    //                 displayEmpty: true,
    //                 renderValue: (value: unknown) =>
    //                   value
    //                     ? leaveTypes.find((leaveType) => leaveType.id === value)
    //                         ?.name
    //                     : "All Leave Types",
    //               },
    //             }}
    //             onChange={(event) => {
    //               setLeaveTypeId(event.target.value);
    //               setPage(0);
    //             }}
    //           >
    //             <MenuItem value="">All Leave Types</MenuItem>
    //             {leaveTypes.map((leaveType) => (
    //               <MenuItem key={leaveType.id} value={leaveType.id}>
    //                 {leaveType.name}
    //               </MenuItem>
    //             ))}
    //           </TextField>
    //           <DatePicker
    //             label="From Date"
    //             value={fromDate}
    //             onChange={(value) => {
    //               setFromDate(dayjs(value));
    //               setPage(0);
    //             }}
    //             slots={{
    //               openPickerIcon: CalendarMonthOutlinedIcon,
    //             }}
    //             slotProps={{
    //               textField: { fullWidth: true },
    //               openPickerButton: {
    //                 color: "primary",
    //                 edge: "end",
    //               },
    //             }}
    //           />
    //           <DatePicker
    //             label="To Date"
    //             value={toDate}
    //             minDate={fromDate ?? undefined}
    //             onChange={(value) => {
    //               setToDate(dayjs(value));
    //               setPage(0);
    //             }}
    //             slots={{
    //               openPickerIcon: CalendarMonthOutlinedIcon,
    //             }}
    //             slotProps={{
    //               textField: { fullWidth: true },
    //               openPickerButton: {
    //                 color: "primary",
    //                 edge: "end",
    //               },
    //             }}
    //           />
    //         </LeaveFilterBar>
    //       </LocalizationProvider>

    //       <TableContainer
    //         component={Paper}
    //         elevation={0}
    //         className="max-w-full overflow-auto"
    //         sx={leaveTableContainerSx}
    //       >
    //         <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
    //           <TableHead>
    //             <TableRow sx={leaveTableHeaderRowSx}>
    //               <TableCell className={leaveTableHeaderCellClassName}>Request No</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>From Date</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>To Date</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Submitted On</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Current Approver</TableCell>
    //               <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
    //             </TableRow>
    //           </TableHead>
    //           <TableBody className={leaveTableBodyClassName}>
    //             {!loading &&
    //               requests.map((request) => (
    //                 <TableRow key={request.id} hover>
    //                   <TableCell className="text-gray-800">
    //                     <code className="text-[12px] bg-gray-100 px-2 py-1 rounded">
    //                       {request.requestNumber}
    //                     </code>
    //                   </TableCell>
    //                   <TableCell className="text-gray-800 ">
    //                     {request.leaveTypeName}
    //                   </TableCell>
    //                   <TableCell className="text-gray-800">
    //                     {formatDate(request.fromDate)}
    //                   </TableCell>
    //                   <TableCell className="text-gray-800">
    //                     {formatDate(request.toDate)}
    //                   </TableCell>
    //                   <TableCell className="text-gray-800">{request.days}</TableCell>
    //                   <TableCell>
    //                     <LeaveStatusBadge status={request.status} />
    //                   </TableCell>
    //                   <TableCell className="text-gray-800">
    //                     {formatDate(request.appliedOn)}
    //                   </TableCell>
    //                   <TableCell className="text-gray-800">
    //                     {request.managerName}
    //                   </TableCell>
    //                   <TableCell className="text-center">
    //                     <Tooltip title="View">
    //                       <IconButton size="small" onClick={() => openDetail(request)}>
    //                         <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
    //                       </IconButton>
    //                     </Tooltip>
    //                     <IconButton
    //                       size="small"
    //                       onClick={(event) => openActionMenu(event, request)}
    //                     >
    //                       <MoreVertOutlinedIcon className="!w-4 !h-4 text-gray-600" />
    //                     </IconButton>
    //                   </TableCell>
    //                 </TableRow>
    //               ))}
    //             {loading && (
    //               <TableRow>
    //                 <TableCell colSpan={9}>
    //                   <DataState
    //                     compact
    //                     type="loading"
    //                     title="Loading leave requests..."
    //                   />
    //                 </TableCell>
    //               </TableRow>
    //             )}
    //             {!loading && requests.length === 0 && (
    //               <TableRow>
    //                 <TableCell colSpan={9}>
    //                   <DataState
    //                     compact
    //                     type="empty"
    //                     title="No leave requests found."
    //                   />
    //                 </TableCell>
    //               </TableRow>
    //             )}
    //           </TableBody>
    //         </Table>
    //       </TableContainer>

    //       {total > 0 && (
    //         <GlobalPagination
    //           total={total}
    //           page={page}
    //           limit={limit}
    //           onPageChange={setPage}
    //           onLimitChange={handleLimitChange}
    //           pageSizeOptions={[5, 10, 20, 50]}
    //           showTotal
    //         />
    //       )}
    //   <Menu
    //     anchorEl={actionAnchorEl}
    //     open={Boolean(actionAnchorEl)}
    //     onClose={closeActionMenu}
    //     classes={{ paper: "bg-white" }}
    //   >
    //     <MenuItem
    //       onClick={() => {
    //         if (actionRequest) openDetail(actionRequest);
    //         closeActionMenu();
    //       }}
    //     >
    //       View
    //     </MenuItem>
    //     {canWithdraw && actionRequest && (
    //       <MenuItem onClick={() => confirmWithdraw(actionRequest)}>
    //         Withdraw
    //       </MenuItem>
    //     )}
    //     {canCancel && actionRequest && (
    //       <MenuItem onClick={() => confirmCancellation(actionRequest)}>
    //         Request Cancellation
    //       </MenuItem>
    //     )}
    //     {!canWithdraw && !canCancel && (
    //       <MenuItem disabled>No status actions available</MenuItem>
    //     )}
    //   </Menu>

    //   <DetailsDialog
    //     open={Boolean(selectedRequest)}
    //     title="Leave Request Details"
    //     onClose={() => setSelectedRequest(null)}
    //     maxWidth="md"
    //     actions={
    //       <Button
    //         variant="outlined"
    //         className="!text-gray-800 !border-gray-300"
    //         onClick={() => setSelectedRequest(null)}
    //       >
    //         Close
    //       </Button>
    //     }
    //   >
    //     {selectedRequest && (
    //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Request Summary</div>
    //           <div className="space-y-2">
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Request No</span>
    //               <span className="text-gray-800 ">{selectedRequest.id}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Leave Type</span>
    //               <span className="text-gray-800">{selectedRequest.leaveTypeName}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Dates</span>
    //               <span className="text-gray-800">
    //                 {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}
    //               </span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Status</span>
    //               <LeaveStatusBadge status={selectedRequest.status} />
    //             </div>
    //           </div>
    //         </div>

    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Day-wise Breakup</div>
    //           <div className="space-y-2">
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Working Days</span>
    //               <span className="text-gray-800">{detailCalculation?.workingDays ?? selectedRequest.days}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Excluded Weekends</span>
    //               <span className="text-gray-800">{detailCalculation?.weeklyOffs.length ?? 0}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Excluded Holidays</span>
    //               <span className="text-gray-800">{detailCalculation?.holidays.length ?? 0}</span>
    //             </div>
    //           </div>
    //         </div>

    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Approval Timeline</div>
    //           <div className="space-y-2 text-gray-800">
    //             <div>Submitted on {formatDate(selectedRequest.appliedOn)}</div>
    //             <div>Pending with {selectedRequest.managerName}</div>
    //             {selectedRequest.approverRemarks && (
    //               <div>Remarks: {selectedRequest.approverRemarks}</div>
    //             )}
    //           </div>
    //         </div>

    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Attachments</div>
    //           <div className="text-gray-500">No attachments uploaded.</div>
    //         </div>

    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Balance Impact</div>
    //           <div className="space-y-2">
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Available Balance</span>
    //               <span className="text-gray-800">{detailBalance?.balance ?? "N/A"}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Requested Days</span>
    //               <span className="text-gray-800">{selectedRequest.days}</span>
    //             </div>
    //             <div className="flex justify-between gap-3">
    //               <span className="text-gray-500">Potential LOP</span>
    //               <span className="text-gray-800">{detailCalculation?.lopDays ?? 0}</span>
    //             </div>
    //           </div>
    //         </div>

    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="font-semibold text-primary mb-3">Comments / History</div>
    //           <div className="text-gray-800">{selectedRequest.reason}</div>
    //         </div>
    //       </div>
    //     )}
    //   </DetailsDialog>
    // </LeavePageShell>

    <LeavePageShell
      group="employee"
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
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <LeaveFilterBar
          gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
          onReset={resetFilters}
        >
          <TextField
            select
            label="Status"
            value={status}
            slotProps={{
              inputLabel: { shrink: true, className: "text-gray-600" },
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
              setPage(0);
            }}
            sx={selectSx}
          >
            <MenuItem value="">All Status</MenuItem>
            {leaveRequestStatusOptions.map((value) => (
              <MenuItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {getLeaveStatusMeta(value).label}
                </div>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Leave Type"
            value={leaveTypeId}
            slotProps={{
              inputLabel: { shrink: true, className: "text-gray-600" },
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
              setPage(0);
            }}
            sx={selectSx}
          >
            <MenuItem value="">All Leave Types</MenuItem>
            {leaveTypes.map((leaveType) => (
              <MenuItem key={leaveType.id} value={leaveType.id}>
                <div className="flex items-center gap-2">
                  {leaveType.name}
                </div>
              </MenuItem>
            ))}
          </TextField>

          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={(value) => {
              setFromDate(dayjs(value));
              setPage(0);
            }}
            slots={{
              openPickerIcon: CalendarMonthOutlinedIcon,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
              },
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
              setToDate(dayjs(value));
              setPage(0);
            }}
            slots={{
              openPickerIcon: CalendarMonthOutlinedIcon,
            }}
            slotProps={{
              textField: {
                fullWidth: true,
              },
              openPickerButton: {
                color: "primary",
                edge: "end",
              },
            }}
          />
        </LeaveFilterBar>
      </LocalizationProvider>

      {/* Enhanced Table with better styling */}
      <TableContainer className="max-w-full overflow-auto h-[calc(100vh-430px)] overflow-auto">
        <Table stickyHeader className="border border-gray-200 rounded-sm bg-white-50">
          <TableHead>
            <TableRow>
              <TableCell
                className={leaveTableHeaderCellClassName}
                sx={{
                  ...stickyHeaderLeftSx,
                  minWidth: "70px",
                }}
              >
                S No
              </TableCell>
              <TableCell className="nth-c !font-bold">Leave Type</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Request No
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                From Date
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                To Date
              </TableCell>
              <TableCell
                className={`${leaveTableHeaderCellClassName} text-center`}
              >
                Days
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Status
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Submitted On
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Current Approver
              </TableCell>
              <TableCell
                className={leaveTableActionHeaderCellClassName}
                sx={{
                  ...stickyHeaderRightSx,
                  minWidth: "100px",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              requests.map((request, i) => (
                <TableRow key={request.id || i} sx={getRowColor(i)}>
                  <TableCell
                    sx={{
                      ...getStickyLeftSx(i),
                      minWidth: "70px",
                    }}
                  >
                    {page * limit + i + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...getStickyLeftSx(i),
                      left: "70px",
                      minWidth: "100px",
                    }}
                  >
                    {request.leaveTypeName}
                  </TableCell>
                  <TableCell>{request.requestNumber}</TableCell>
                  <TableCell>{formatDate(request.fromDate)}</TableCell>
                  <TableCell>{formatDate(request.toDate)}</TableCell>
                  <TableCell className="!text-center">{request.days}</TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>{formatDate(request.appliedOn)}</TableCell>
                  <TableCell>
                    <div>
                      {request.managerName?.charAt(0) || "-"}
                      <span className="text-gray-700 text-[12px]">
                        {request.managerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...getStickyRightSx(i),
                      minWidth: "50px",
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => openDetail(request)}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(event) => openActionMenu(event, request)}
                          className="hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertOutlinedIcon className="!w-4 !h-4 text-gray-500" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
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

      {/* Enhanced Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage - 1)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(0);
          }}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          showTotal={true}
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
        {actionRequest && actionRequest.status == "DRAFT" && (
          <MenuItem
            onClick={() => {
              handleDelete(actionRequest);
            }}
            className="hover:bg-blue-50 transition-colors"
          >
            <DeleteOutlineOutlined className="!w-4 !h-4 mr-2 text-red-500" />
            Delete
          </MenuItem>
        )}
        {canWithdraw && actionRequest && (
          <MenuItem
            onClick={() => confirmWithdraw(actionRequest)}
            className="hover:bg-amber-50 transition-colors"
          >
            <span className="mr-2">↩️</span>
            Withdraw Request
          </MenuItem>
        )}
        {canCancel && actionRequest && (
          <MenuItem
            onClick={() => confirmCancellation(actionRequest)}
            className="hover:bg-red-50 transition-colors"
          >
            <span className="mr-2">❌</span>
            Request Cancellation
          </MenuItem>
        )}
        {!canWithdraw && !canCancel && (
          <MenuItem disabled className="text-gray-400">
            No status actions available
          </MenuItem>
        )}
      </Menu>

      {/* Enhanced Details Dialog */}
      <DetailsDialog
        open={Boolean(selectedRequest)}
        title="Leave Request Details"
        onClose={() => setSelectedRequest(null)}
        // maxWidth="md"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              className="!text-gray-600 !border-gray-200 hover:!bg-gray-50"
              onClick={() => setSelectedRequest(null)}
            >
              Close
            </Button>
            {selectedRequest?.status === "PENDING" && (
              <Button
                variant="contained"
                className="!bg-red-500 hover:!bg-red-600"
                onClick={() => {
                  setSelectedRequest(null);
                  confirmCancellation(selectedRequest);
                }}
              >
                Cancel Request
              </Button>
            )}
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Status and Days - Simple Row */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {selectedRequest.status === "PENDING" && (
                    <ClockIcon className="!w-5 !h-5 text-amber-500" />
                  )}
                  {selectedRequest.status === "APPROVED" && (
                    <CheckCircleOutlineOutlined className="!w-5 !h-5 text-emerald-500" />
                  )}
                  {selectedRequest.status === "REJECTED" && (
                    <CancelOutlined className="!w-5 !h-5 text-red-500" />
                  )}
                  {selectedRequest.status === "DRAFT" && (
                    <SaveAltOutlined className="!w-5 !h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Status</div>
                  <LeaveStatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Total Days</div>
                <div className="text-xl font-bold text-gray-900">
                  {selectedRequest.totalDays || selectedRequest.days}
                </div>
              </div>
            </div>

            {/* Simple Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  From
                </div>
                <div className="text-[12px]  text-gray-800 mt-1">
                  {formatDate(selectedRequest.fromDate)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  To
                </div>
                <div className="text-[12px]  text-gray-800 mt-1">
                  {formatDate(selectedRequest.toDate)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  Submitted
                </div>
                <div className="text-[12px]  text-gray-800 mt-1">
                  {formatDate(
                    selectedRequest.submittedAt || selectedRequest.createdAt,
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  Leave Type
                </div>
                <div className="text-[12px]  text-gray-800 mt-1">
                  {selectedRequest.leaveTypeName}
                </div>
              </div>
            </div>

            {/* Session & Balance - Two Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider mb-2">
                  Session
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-600">From</span>
                  <span className="text-[10px] text-gray-800">
                    {selectedRequest.fromSession}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px] mt-1">
                  <span className="text-gray-600">To</span>
                  <span className="text-[10px] text-gray-800">
                    {selectedRequest.toSession}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider mb-2">
                  Balance
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-600">Available</span>
                  <span className=" text-emerald-600">
                    {detailBalance?.balance ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px] mt-1">
                  <span className="text-gray-600">Requested</span>
                  <span className=" text-gray-800">
                    {selectedRequest.totalDays || selectedRequest.days}
                  </span>
                </div>
                {selectedRequest.lop && (
                  <div className="mt-2 text-[11px] text-red-600 ">
                    ⚠ LOP: {selectedRequest.lop || 0} days
                  </div>
                )}
              </div>
            </div>

            {/* Day-wise Breakup - Simple */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-800 uppercase tracking-wider">
                  Day-wise Breakup
                </div>
                <span className="text-[11px] text-gray-500">
                  {selectedRequest.dates?.length || 0} days
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRequest.dates?.map((date: any) => (
                  <div
                    key={date.id}
                    className={`px-2.5 py-1 rounded-md text-[10px]  ${
                      date.weeklyOff || date.holiday
                        ? "bg-gray-100 text-gray-800"
                        : "bg-primary-50 text-primary-700"
                    }`}
                  >
                    {formatDate(date.leaveDate)}
                    {date.weeklyOff && " (W)"}
                    {date.holiday && " (H)"}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-500">
                <span>
                  ✅{" "}
                  {selectedRequest.dates?.filter(
                    (d: any) => !d.weeklyOff && !d.holiday,
                  ).length || 0}{" "}
                  working
                </span>
                <span>
                  📅{" "}
                  {selectedRequest.dates?.filter((d: any) => d.weeklyOff)
                    .length || 0}{" "}
                  weekends
                </span>
                <span>
                  🎉{" "}
                  {selectedRequest.dates?.filter((d: any) => d.holiday)
                    .length || 0}{" "}
                  holidays
                </span>
              </div>
            </div>

            {/* Approval Timeline - Simple */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-[10px] text-gray-800 uppercase tracking-wider mb-2">
                Approval Timeline
              </div>
              <div className="space-y-2">
                {selectedRequest.approvals?.map(
                  (approval: any, _index: number) => (
                    <div key={approval.id} className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          approval.actionTaken === "APPROVED"
                            ? "bg-emerald-500"
                            : approval.actionTaken === "REJECTED"
                              ? "bg-red-500"
                              : "bg-amber-500"
                        }`}
                      ></div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="text-[12px]  text-gray-800">
                            {approval.approverName || "Manager"}
                          </span>
                          <span
                            className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                              approval.actionTaken === "APPROVED"
                                ? "bg-emerald-50 text-emerald-600"
                                : approval.actionTaken === "REJECTED"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {approval.actionTaken}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-800">
                          {formatDate(approval.actionAt)}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Reason - Simple */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-[10px] text-gray-800 uppercase tracking-wider mb-2">
                Reason
              </div>
              {selectedRequest.reason ? (
                <div className="text-[12px] text-gray-700 leading-relaxed">
                  {selectedRequest.reason}
                </div>
              ) : (
                <div className="text-[12px] text-gray-800 italic">
                  No reason provided
                </div>
              )}
              {selectedRequest.emergencyContactNumber && (
                <div className="mt-2 text-[11px] text-gray-500">
                  📞 Emergency: {selectedRequest.emergencyContactNumber}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailsDialog>
    </LeavePageShell>
  );
}
