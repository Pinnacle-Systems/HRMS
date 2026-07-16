import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
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
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAuth } from "../../../auth/authContext";
import { resolveEmployeeIdFromProfile } from "../../../auth/sessionIdentity";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { authService } from "../../../services/modules/auth";
import { isAccessDeniedError } from "../../../utils/errorUtils";
import { leaveService } from "../../../services/modules/leave";
import type { LeaveBalance, LeaveRequest } from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  leaveTableBodyClassName,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";
import { formatDate } from "../leaveFormatters";
import { getRowColor } from "../../const";

// const balanceOrder = [
//   "Casual Leave",
//   "Sick Leave",
//   "Earned Leave",
//   "Comp-Off",
//   "Optional Holiday",
// ];

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
          // page: 0,
          // size: 20,
          // sort: "leaveTypeName,ASC",
          leaveYear: new Date().getFullYear(),
        });

        const requestResult = await leaveService
          .getMyLeaves({
            // employeeId,
            page: 0,
            size: 10,
            sort: "createdAt,DESC",
          })
          .catch(() => null);

        if (!isMounted) {
          return;
        }

        //Get this month leave request
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const thisMonthRequests = requestResult?.data?.content?.filter(request => {
          const requestDate = new Date(request.fromDate);
          return requestDate >= startOfMonth && requestDate <= endOfMonth;
        }) ?? [];

        setBalances(balanceResult?.data?.content ?? []);
        setRequests(thisMonthRequests);
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

  // const orderedBalances = useMemo(
  //   () =>
  //     [...balances].sort(
  //       (left, right) =>
  //         balanceOrder.indexOf(left.leaveTypeName) -
  //         balanceOrder.indexOf(right.leaveTypeName),
  //     ),
  //   [balances],
  // );

  // const upcomingLeaves = useMemo(() => {
  //   return requests
  //     .filter((request) => isUpcomingApprovedLeave(request))
  //     .sort(
  //       (left, right) =>
  //         new Date(left.fromDate).getTime() - new Date(right.fromDate).getTime(),
  //     );
  // }, [requests]);

  const totalAvailable = balances.reduce(
    (sum, item) => sum + item.closingBalance,
    0,
  );
  const totalPending = requests.filter((request) => request.status === "PENDING").length;
  console.log("totalPending", totalPending, requests);

  return (
    // <LeavePageShell
    //   group="employee"
    //   title="My Leave"
    //   breadcrumbLabel="My Dashboard"
    //   subtitle="View balances, upcoming leave, and recent requests"
    //   actions={
    //     <Button
    //       variant="contained"
    //       startIcon={<AddOutlinedIcon />}
    //       className="!bg-primary"
    //       onClick={() => navigate("/leaves/apply")}
    //     >
    //       Apply Leave
    //     </Button>
    //   }
    //   contentClassName="p-5 space-y-5"
    //   titleClassName="text-2xl font-semibold text-gray-800"
    // >

    //       {loading && (
    //         <DataState type="loading" title="Loading leave dashboard..." />
    //       )}

    //       {!loading && error && (
    //         <DataState type="error" title={error} />
    //       )}

    //       {!loading && !error && (
    //         <>
    //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    //             <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
    //               <div className="text-gray-500 text-[12px]">Available Balance</div>
    //               <div className="text-2xl font-semibold text-gray-800 mt-1">
    //                 {totalAvailable}
    //               </div>
    //               <div className="text-[12px] text-gray-500 mt-1">days across leave types</div>
    //             </div>
    //             <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
    //               <div className="text-gray-500 text-[12px]">Pending Approval</div>
    //               <div className="text-2xl font-semibold text-gray-800 mt-1">
    //                 {totalPending}
    //               </div>
    //               <div className="text-[12px] text-gray-500 mt-1">days currently reserved</div>
    //             </div>
    //             <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
    //               <div className="text-gray-500 text-[12px]">Recent Requests</div>
    //               <div className="text-2xl font-semibold text-gray-800 mt-1">
    //                 {requests.length}
    //               </div>
    //               <div className="text-[12px] text-gray-500 mt-1">submitted requests</div>
    //             </div>
    //           </div>

    //           <div>
    //             <div className="font-semibold text-primary mb-3">Leave Balances</div>
    //             <TableContainer
    //               component={Paper}
    //               elevation={0}
    //               sx={leaveTableContainerSx}
    //             >
    //               <Table className={leaveTableClassName} sx={leaveTableSx}>
    //                 <TableHead>
    //                   <TableRow sx={leaveTableHeaderRowSx}>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Opening</TableCell>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Accrued</TableCell>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Used</TableCell>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Pending</TableCell>
    //                     <TableCell className={leaveTableHeaderCellClassName}>Available</TableCell>
    //                   </TableRow>
    //                 </TableHead>
    //                 <TableBody className={leaveTableBodyClassName}>
    //                   {orderedBalances.map((balance) => (
    //                     <TableRow key={balance.leaveTypeId} hover>
    //                       <TableCell className="text-gray-800 font-medium">
    //                         {balance.leaveTypeName}
    //                       </TableCell>
    //                       <TableCell className="text-gray-800">{balance.opening}</TableCell>
    //                       <TableCell className="text-gray-800">{balance.credited}</TableCell>
    //                       <TableCell className="text-gray-800">{balance.availed}</TableCell>
    //                       <TableCell className="text-gray-800">{balance.pending}</TableCell>
    //                       <TableCell className="text-gray-800 font-semibold">
    //                         {balance.balance}
    //                       </TableCell>
    //                     </TableRow>
    //                   ))}
    //                   {orderedBalances.length === 0 && (
    //                     <TableRow>
    //                       <TableCell colSpan={6}>
    //                         <DataState
    //                           compact
    //                           type="empty"
    //                           title="No leave balances available."
    //                         />
    //                       </TableCell>
    //                     </TableRow>
    //                   )}
    //                 </TableBody>
    //               </Table>
    //             </TableContainer>
    //           </div>

    //           <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
    //             <div className="border border-gray-300 rounded-lg p-4 bg-white">
    //               <div className="font-semibold text-primary mb-3">Upcoming Leave</div>
    //               {upcomingLeaves.length === 0 ? (
    //                 <DataState
    //                   compact
    //                   type="empty"
    //                   title="No approved upcoming leave."
    //                 />
    //               ) : (
    //                 <div className="space-y-3">
    //                   {upcomingLeaves.map((request) => (
    //                     <div
    //                       key={request.id}
    //                       className="border border-gray-200 rounded-lg p-3 bg-gray-50"
    //                     >
    //                       <div className="flex items-center justify-between gap-3">
    //                         <div className="font-medium text-gray-800">
    //                           {request.leaveTypeName}
    //                         </div>
    //                         <Chip
    //                           size="small"
    //                           label={request.days}
    //                           className="!bg-white !text-gray-800"
    //                         />
    //                       </div>
    //                       <div className="text-[12px] text-gray-500 mt-1">
    //                         {formatDate(request.fromDate)} - {formatDate(request.toDate)}
    //                       </div>
    //                       <div className="text-[12px] text-gray-500 mt-1">
    //                         Approved by {request.managerName}
    //                       </div>
    //                     </div>
    //                   ))}
    //                 </div>
    //               )}
    //             </div>

    //             <div className="xl:col-span-2">
    //               <div className="font-semibold text-primary mb-3">Recent Requests</div>
    //               <TableContainer
    //                 component={Paper}
    //                 elevation={0}
    //                 sx={leaveTableContainerSx}
    //               >
    //                 <Table className={leaveTableClassName} sx={leaveTableSx}>
    //                   <TableHead>
    //                     <TableRow sx={leaveTableHeaderRowSx}>
    //                       <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
    //                       <TableCell className={leaveTableHeaderCellClassName}>From Date</TableCell>
    //                       <TableCell className={leaveTableHeaderCellClassName}>To Date</TableCell>
    //                       <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
    //                       <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
    //                       <TableCell className={leaveTableHeaderCellClassName}>Approver</TableCell>
    //                       <TableCell className={leaveTableActionHeaderCellClassName}>
    //                         Actions
    //                       </TableCell>
    //                     </TableRow>
    //                   </TableHead>
    //                   <TableBody className={leaveTableBodyClassName}>
    //                     {requests.map((request) => (
    //                       <TableRow key={request.id} hover>
    //                         <TableCell className="text-gray-800 font-medium">
    //                           {request.leaveTypeName}
    //                         </TableCell>
    //                         <TableCell className="text-gray-800">
    //                           {formatDate(request.fromDate)}
    //                         </TableCell>
    //                         <TableCell className="text-gray-800">
    //                           {formatDate(request.toDate)}
    //                         </TableCell>
    //                         <TableCell className="text-gray-800">{request.days}</TableCell>
    //                         <TableCell>
    //                           <LeaveStatusBadge status={request.status} />
    //                         </TableCell>
    //                         <TableCell className="text-gray-800">
    //                           {request.managerName}
    //                         </TableCell>
    //                         <TableCell className="text-center">
    //                           <Tooltip title="View request">
    //                             <IconButton
    //                               size="small"
    //                               onClick={() => setSelectedRequest(request)}
    //                             >
    //                               <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
    //                             </IconButton>
    //                           </Tooltip>
    //                         </TableCell>
    //                       </TableRow>
    //                     ))}
    //                     {requests.length === 0 && (
    //                       <TableRow>
    //                         <TableCell colSpan={7}>
    //                           <DataState
    //                             compact
    //                             type="empty"
    //                             title="No recent leave requests found."
    //                           />
    //                         </TableCell>
    //                       </TableRow>
    //                     )}
    //                   </TableBody>
    //                 </Table>
    //               </TableContainer>
    //             </div>
    //           </div>
    //         </>
    //       )}
    //   <Dialog
    //     open={Boolean(selectedRequest)}
    //     onClose={() => setSelectedRequest(null)}
    //     maxWidth="sm"
    //     fullWidth
    //   >
    //     <div className="flex items-center justify-between p-2 border-b border-gray-300">
    //       <div className="text-primary ml-4">Leave Request Details</div>
    //       <IconButton onClick={() => setSelectedRequest(null)}>
    //         <CloseOutlinedIcon className="!text-gray-800"/>
    //       </IconButton>
    //     </div>
    //     <DialogContent>
    //       {selectedRequest && (
    //         <div className="grid gap-3 text-[12px]">
    //           <div className="flex justify-between gap-4">
    //             <span className="text-gray-500">Leave Type</span>
    //             <span className="text-gray-800 font-medium">
    //               {selectedRequest.leaveTypeName}
    //             </span>
    //           </div>
    //           <div className="flex justify-between gap-4">
    //             <span className="text-gray-500">Dates</span>
    //             <span className="text-gray-800">
    //               {formatDate(selectedRequest.fromDate)} -{" "}
    //               {formatDate(selectedRequest.toDate)}
    //             </span>
    //           </div>
    //           <div className="flex justify-between gap-4">
    //             <span className="text-gray-500">Days</span>
    //             <span className="text-gray-800">{selectedRequest.days}</span>
    //           </div>
    //           <div className="flex justify-between gap-4">
    //             <span className="text-gray-500">Status</span>
    //             <LeaveStatusBadge status={selectedRequest.status} />
    //           </div>
    //           <div className="flex justify-between gap-4">
    //             <span className="text-gray-500">Approver</span>
    //             <span className="text-gray-800">{selectedRequest.managerName}</span>
    //           </div>
    //           <div>
    //             <div className="text-gray-500 mb-1">Reason</div>
    //             <div className="text-gray-800 border border-gray-200 rounded-lg p-3 bg-gray-50">
    //               {selectedRequest.reason}
    //             </div>
    //           </div>
    //         </div>
    //       )}
    //     </DialogContent>
    //     <DialogActions className="!p-4 !border-t !border-gray-300">
    //       <Button
    //         variant="outlined"
    //         className="!text-gray-800 !border-gray-300"
    //         onClick={() => setSelectedRequest(null)}
    //       >
    //         Close
    //       </Button>
    //     </DialogActions>
    //   </Dialog>
    // </LeavePageShell>

    <LeavePageShell
      group="employee"
      title="My Leave"
      breadcrumbLabel="My Dashboard"
      subtitle="View balances, upcoming leave, and recent requests"
      // actions={
      //   <Button
      //     variant="contained"
      //     startIcon={<AddOutlinedIcon />}
      //     className="!bg-primary"
      //     onClick={() => navigate("/leaves/apply")}
      //   >
      //     Apply Leave
      //   </Button>
      // }
      // contentClassName="p-3 space-y-3 mx-auto"
      // titleClassName="text-[14px] font-bold text-gray-900"
    >

      {loading && (
        <DataState type="loading" title="Loading leave dashboard..." />
      )}

      {!loading && error && (
        <DataState type="error" title={error} />
      )}

      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium text-gray-500">Available Balance</div>
                  <div className="text-3xl font-bold text-blue-600 mt-1.5">
                    {totalAvailable}<span className="text-[10px] font-normal ml-2 text-gray-400">days across leave types</span>
                  </div>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium text-gray-500">Pending Approval (This Month)</div>
                  <div className="text-3xl font-bold text-amber-600 mt-1.5">
                    {totalPending}<span className="text-[10px] font-normal ml-2 text-gray-400">days currently reserved</span>
                  </div>

                </div>
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium text-gray-500">Recent Requests (This Month)</div>
                  <div className="text-3xl font-bold text-purple-600 mt-1.5">
                    {requests.length}<span className="text-[10px] font-normal ml-2 text-gray-400">submitted requests</span>
                  </div>

                </div>
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balances */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Leave Balances</h3>
              </div>
            </div>
            <div className="p-3">
              {balances.length === 0 ? (
                <DataState
                  compact
                  type="empty"
                  title="No leave balances available."
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {balances.map((balance) => (
                      <div key={balance.leaveTypeId} className="bg-white rounded-lg border border-gray-200 hover:border-primary/30 p-3 transition-all duration-200 group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 whitespace-nowrap max-w-[120px]" title={balance.leaveTypeName}>
                            {balance.leaveTypeName}<span className="text-[12px] ml-2 font-bold text-gray-500">[{balance.balance}]</span>
                          </span>
                          <Button variant="outlined" className="!h-5 !px-2 !text-[12px] !text-primary !border-primary"  onClick={() => navigate("/leaves/apply",{
                            state: balance.leaveTypeId
                          })}>Apply</Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[12px] text-gray-400 cursor-pointer">
                          <span title="Opening">Opening: {balance.opening}</span>
                          <span className="text-green-500" title="Accrued">Accrued: +{balance.credited}</span>
                          <span className="text-red-500" title="Used">Used: {balance.availed}</span>
                          {/* <span className="text-amber-500" title="Pending">{balance.pending}p</span> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming & Recent */}
          {/* <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 !mb-3"> */}
            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Upcoming Leave</h3>
                </div>
              </div>
              <div className="p-5">
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
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-gray-900 text-[12px]">
                            {request.leaveTypeName}
                          </div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-100 text-emerald-800">
                            {request.days} days
                          </div>
                        </div>
                        <div className="text-[12px] text-gray-500 mt-1.5">
                          {formatDate(request.fromDate)} — {formatDate(request.toDate)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-[12px] text-gray-500">Approved by {request.managerName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div> */}

            {/* Recent Requests */}
            <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden !mb-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Recent Requests <span className="text-[10px] font-normal text-gray-500">(This Month)</span></h3>
                </div>
              </div>
              <div className="p-0">
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    ...leaveTableContainerSx,
                    borderRadius: 0,
                    boxShadow: 'none'
                  }}
                >
                  <Table className={leaveTableClassName} sx={leaveTableSx}>
                    <TableHead>
                      <TableRow sx={{
                        ...leaveTableHeaderRowSx,
                        backgroundColor: '#f8fafc'
                      }}>
                        <TableCell className="text-[12px] !font-semibold">S No</TableCell>
                        <TableCell className="text-[12px] !font-semibold">Leave Type</TableCell>
                        <TableCell className="text-[12px] !font-semibold">From</TableCell>
                        <TableCell className="text-[12px] !font-semibold">To</TableCell>
                        <TableCell className="text-[12px] !font-semibold">Days</TableCell>
                        <TableCell className="text-[12px] !font-semibold">Status</TableCell>
                        <TableCell className="text-[12px] !font-semibold">Pay Type</TableCell>
                        <TableCell className="text-[12px] !font-semibold text-center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.map((request, index) => (
                        <TableRow key={request.id} sx={getRowColor(index)}>
                          <TableCell >
                            {index + 1}
                          </TableCell>
                          <TableCell >
                            {request.leaveTypeName}
                          </TableCell>
                          <TableCell>
                            {formatDate(request.fromDate)}
                          </TableCell>
                          <TableCell>
                            {formatDate(request.toDate)}
                          </TableCell>
                          <TableCell >{request.days}</TableCell>
                          <TableCell>
                            <LeaveStatusBadge status={request.status} />
                          </TableCell>
                          <TableCell>
                            {request.payrollTreatment}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip title="View request" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setSelectedRequest(request)}
                                className="transition-colors"
                              >
                                <VisibilityOutlinedIcon className="!w-4 !h-4 text-primary" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {requests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8}>
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
          {/* </div> */}
        </>
      )}

      {/* Dialog */}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={window.innerWidth < 640}
      >
        {selectedRequest && (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-gray-800">
                    Request Details
                  </span>
                  <LeaveStatusBadge status={selectedRequest.status} />
                </div>
                <IconButton
                  onClick={() => setSelectedRequest(null)}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <CloseOutlinedIcon className="!text-gray-500 !w-5 !h-5" />
                </IconButton>
              </div>
            </div>

            {/* Content */}
            <DialogContent>
              <div className="space-y-4">
                {/* Header Info */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-lg p-3 px-5 border border-primary-100">
                  <div className="text-[12px] text-primary dark:text-gray-800 font-medium uppercase tracking-wider">
                    Leave Type
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {selectedRequest.leaveTypeName}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-gray-800 text-[12px]">
                      Req no: #{selectedRequest.requestNumber}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span className="text-[12px] text-gray-800">
                      {selectedRequest.totalDays} days
                    </span>
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    <span className="text-[12px] text-gray-800">
                      {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-head rounded-xl p-4">
                    <div className="text-[12px] text-gray-500">Total Days</div>
                    <div className="text-[12px] font-medium text-gray-900 mt-1">
                      {selectedRequest.totalDays} day{selectedRequest.days > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="bg-head rounded-xl p-4">
                    <div className="text-[12px] text-gray-500">Pay Type</div>
                    <div className="text-[12px] font-medium text-gray-900 mt-1">
                      {selectedRequest.payrollTreatment}
                    </div>
                  </div>
                  <div className="bg-head rounded-xl p-4">
                    <div className="text-[12px] text-gray-500">LOP</div>
                    <div className="text-[12px] font-medium text-gray-900 mt-1">
                      {selectedRequest.lop ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="bg-head rounded-xl p-4">
                    <div className="text-[12px] text-gray-500">Submitted</div>
                    <div className="text-[12px] font-medium text-gray-900 mt-1">
                      {formatDate(selectedRequest.submittedAt)}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="rounded-lg p-4 border border-gray-200">
                  <div className="text-[12px] text-gray-500 mb-2">Reason for leave</div>
                  <div className="text-[12px] text-gray-700 leading-relaxed">
                    {selectedRequest.appliedReason || 'No reason provided'}
                  </div>
                </div>

                {/* Leave Dates Calendar View */}
                <div className="rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] text-gray-500">Leave Dates</div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-primary"></span>
                        Leave
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-200"></span>
                        Weekend
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {selectedRequest.dates?.map((date, index) => {
                      const dateObj = new Date(date.leaveDate);
                      const day = dateObj.getDate();
                      const isWeekend = date.weeklyOff;
                      const isHoliday = date.holiday;
                      const isLeaveDay = date.calculatedLeaveDays > 0;

                      return (
                        <div
                          key={index}
                          className={`
                    aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium
                    ${isWeekend ? 'bg-gray-100 text-gray-400' : ''}
                    ${isLeaveDay && !isWeekend ? 'bg-primary text-white' : ''}
                    ${isHoliday && !isWeekend ? 'bg-red-100 text-red-600' : ''}
                    ${!isLeaveDay && !isWeekend && !isHoliday ? 'bg-gray-50 text-gray-400' : ''}
                  `}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                    <span>Total: {selectedRequest.totalDays} days</span>
                    <span>Weekends: {selectedRequest.dates?.filter(d => d.weeklyOff).length} days</span>
                  </div>
                </div>

                {/* Timeline/Approvals */}
                <div className="rounded-lg p-4 border border-gray-200">
                  <div className="text-[12px] text-gray-500 mb-3">Request Timeline</div>
                  <div className="space-y-3">
                    {selectedRequest.approvals && selectedRequest.approvals.length > 0 ? (
                      selectedRequest.approvals.map((approval, index) => {
                        const isLast = index === (selectedRequest.approvals?.length || 0) - 1;
                        const getStatusColor = (action: any) => {
                          switch (action) {
                            case 'APPROVED': return 'bg-emerald-500';
                            case 'REJECTED': return 'bg-red-500';
                            case 'PENDING': return 'bg-amber-500';
                            default: return 'bg-blue-400';
                          }
                        };

                        return (
                          <div key={approval.id} className="flex items-start gap-3 relative">
                            {!isLast && (
                              <div className="absolute left-[5px] top-7 w-0.5 h-10 bg-gray-200"></div>
                            )}
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(approval.actionTaken)} mt-1 flex-shrink-0`}></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-[12px] text-gray-700">
                                  {approval.actionTaken.charAt(0) + approval.actionTaken.slice(1).toLowerCase()}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {formatDate(approval.actionAt)}
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                By: {approval.approverName} (Level {approval.approvalLevel})
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[12px] text-gray-400 text-center py-2">
                        No approval history available
                      </div>
                    )}
                  </div>
                </div>
                {/* Additional Info */}
                <div className="rounded-lg p-3 border border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDate(selectedRequest.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{' '}
                      {formatDate(selectedRequest.updatedAt)}
                    </div>
                    <div>
                      <span className="font-medium">Leave Code:</span>{' '}
                      {selectedRequest.leaveTypeCode}
                    </div>
                    <div>
                      <span className="font-medium">Cancellation:</span>{' '}
                      {selectedRequest.cancellationRequested ? 'Requested' : 'None'}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>

            {/* Footer Actions */}
            <DialogActions className="!p-2 !mr-4 !border-t !border-gray-200">
              <Button
                variant="contained"
                className="!bg-primary"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

    </LeavePageShell>
  );
}
