import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CalendarToday,
  History,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import DataState from "../../../components/DataState";
import EmployeeAsyncCombobox from "../../../components/employees/EmployeeAsyncCombobox";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  CompOffBalance,
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveRequest,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import { leaveTableBodyCellSx } from "../components/leaveTableStyles";
import { getRowColor } from "../../const";
import { useAuth } from "../../../auth/authContext";

// Helper to get color based on balance status
const getBalanceColor = (balance: number, threshold: number = 2) => {
  if (balance <= 0) return "error";
  if (balance < threshold) return "warning";
  return "success";
};

// Summary Card Component
// const SummaryCard = ({
//   title,
//   value,
//   icon: Icon,
//   color = "#3b82f6",
//   subtitle,
// }: {
//   title: string;
//   value: string | number;
//   icon: any;
//   color?: string;
//   subtitle?: string;
// }) => (
//   <Card
//     elevation={0}
//     sx={{
//       height: "100%",
//       background: "#ffffff",
//       border: "1px solid #e5e7eb",
//       borderRadius: "12px",
//       transition: "all 0.2s",
//       "&:hover": {
//         transform: "translateY(-2px)",
//         boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//         borderColor: color,
//       },
//     }}
//   >
//     <CardContent className="p-4 !bg-white">
//       <div className="flex items-center justify-between">
//         <div>
//           <div className="text-[12px] font-medium text-gray-500">
//             {title}
//             {subtitle && (
//               <span className="text-[10px] ml-2 text-gray-500">
//                 ({subtitle})
//               </span>
//             )}
//           </div>
//           <div
//             className={`text-2xl font-bold text-gray-800 text-${color} mt-1`}
//           >
//             {value}{" "}
//           </div>
//           {/* {subtitle && (
//             <div className="text-[12px] text-gray-500 mt-0.5"></div>
//           )} */}
//         </div>
//         <div
//           className="p-2.5 rounded-full"
//           style={{
//             backgroundColor: `${color}15`,
//             color: color,
//           }}
//         >
//           <Icon className="text-xl" />
//         </div>
//       </div>
//     </CardContent>
//   </Card>
// );

// Balance Table Row Component
const BalanceRow = ({
  balance,
  index,
}: {
  balance: LeaveBalance;
  index: any;
}) => {
  const [expanded, setExpanded] = useState(false);
  const available = balance.balance || 0;
  const color = getBalanceColor(available);

  return (
    <>
      <TableRow sx={getRowColor(index)}>
        <TableCell sx={leaveTableBodyCellSx}>
          <div>
            <div className="text-[12px] font-medium text-gray-900">
              {balance.leaveTypeName}{" "}
              <span className="text-[12px] text-gray-500">
                ({balance.leaveTypeCode})
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell sx={leaveTableBodyCellSx}>
          <span className="text-[12px] text-gray-700">{balance.opening}</span>
        </TableCell>
        <TableCell sx={leaveTableBodyCellSx}>
          <Chip
            icon={<TrendingUp className="!text-green-600" fontSize="small" />}
            label={balance.credited}
            size="small"
            className="!bg-green-50 !text-green-700 !border-green-200"
          />
        </TableCell>
        <TableCell sx={leaveTableBodyCellSx}>
          <Chip
            icon={<TrendingDown className="!text-red-600" fontSize="small" />}
            label={balance.availed}
            size="small"
            className="!bg-red-50 !text-red-700 !border-red-200"
          />
        </TableCell>
        {/* <TableCell sx={leaveTableBodyCellSx}>
          <Chip
            label={balance.pending || 0}
            size="small"
            className="!bg-yellow-50 !text-yellow-700 !border-yellow-200"
          />
        </TableCell> */}
        <TableCell sx={leaveTableBodyCellSx}>
          <Chip
            label={available}
            size="small"
            className={`font-semibold ${
              color === "success"
                ? "!bg-green-50 !text-green-700 !border-green-200"
                : color === "warning"
                  ? "!bg-yellow-50 !text-yellow-700 !border-yellow-200"
                  : "!bg-red-50 !text-red-700 !border-red-200"
            }`}
          />
        </TableCell>
        <TableCell sx={leaveTableBodyCellSx}>
          <Tooltip title={expanded ? "Collapse" : "View history"}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="p-0">
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <div className="text-[12px] font-medium text-gray-600">
                  Recent Transactions
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  No transactions available
                </div>
              </div>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default function HrLeaveBalancesPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [_employeeName, setEmployeeName] = useState<string>("");
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [ledger, setLedger] = useState<LeaveLedgerEntry[]>([]);
  const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRequest[]>([]);
  const [employeeCompOffBalances, setEmployeeCompOffBalances] = useState<
    CompOffBalance[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const handleEmployeeChange = async (id: string | null, name?: string) => {
    setEmployeeId(id);
    setEmployeeName(name || "");
    if (!id) {
      setBalances([]);
      setLedger([]);
      return;
    }

    setLoading(true);
    showSpinner();
    try {
      const [
        empLeaveResponse,
        compOffBalanceResponse,
        balanceResponse,
        ledgerResponse,
      ]: any = await Promise.all([
        leaveService.getEmployeeLeaves(id),
        leaveService.getEmployeeCompOffBalances(id),
        leaveService.getEmployeeLeaveBalances(id),
        leaveService.getEmployeeLeaveLedger(id, {
          page: 0,
          size: 20,
          sort: "transactionDate,DESC",
        }),
      ]);
      setEmployeeLeaves(empLeaveResponse.data?.content ?? []);
      setEmployeeCompOffBalances(compOffBalanceResponse.data?.content ?? []);
      setBalances(balanceResponse.data?.content ?? []);
      setLedger(ledgerResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave balances", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  // Calculate summary statistics
  // const totalAvailable = balances.reduce((sum, b) => sum + (b.balance || 0), 0);
  // const totalAvailed = balances.reduce((sum, b) => sum + (b.availed || 0), 0);
  // const totalPending = balances.reduce((sum, b) => sum + (b.pending || 0), 0);
  // const totalCredited = balances.reduce((sum, b) => sum + (b.credited || 0), 0);
  // const totalCompOffBalance = employeeCompOffBalances.reduce(
  //   (sum, item) => sum + (item.currentLeaveBalance || 0),
  //   0,
  // );
  // const totalCompOffPending = employeeCompOffBalances.reduce(
  //   (sum, item) => sum + (item.pendingCreditDays || 0), 0,
  // );
  // const totalCompOffApproved = employeeCompOffBalances.reduce(
  //   (sum, item) => sum + (item.approvedCreditDays || 0),
  //   0,
  // );
  const recentLeaves = employeeLeaves.slice(0, 5);
  const hasData =
    balances.length > 0 ||
    employeeCompOffBalances.length > 0 ||
    employeeLeaves.length > 0;

  return (
    <LeavePageShell
      group="hr"
      title="Leave Balances"
      subtitle="Review balances and ledger history for any employee"
    >
      {/* Employee Selection */}
      <div className="flex justify-end">
        <div className="w-[250px]">
          <EmployeeAsyncCombobox
            value={employeeId}
            onChange={(id) => handleEmployeeChange(id)}
            label="Search employee by name or ID"
            filters={{ assignedHrId: session?.user.userId }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {/* {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard
            title="Total Available"
            value={totalAvailable}
            icon={CheckCircle}
            color="#22c55e"
            subtitle={`${balances.length} types`}
          />
          <SummaryCard
            title="Total Credited"
            value={totalCredited}
            icon={TrendingUp}
            color="#3b82f6"
          />
          <SummaryCard
            title="Total Availed"
            value={totalAvailed}
            icon={TrendingDown}
            color="#ef4444"
          />
          <SummaryCard
            title="Total Pending"
            value={totalPending}
            icon={AccessTime}
            color="#eab308"
          />
        </div>
      )} */}

      {/* Comp-Off Balances */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-semibold text-gray-800">
              Comp-Off Balances
            </h3>
          </div>
          <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
            {employeeCompOffBalances.length} balance types
          </span>
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Leave Type
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Current Balance
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Approved Days
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Pending Days
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Pending Requests
                  </span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employeeCompOffBalances.map((balance, index) => (
                <TableRow
                  key={`${balance.employeeId}-${balance.leaveTypeId}-${index}`}
                >
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {balance.leaveTypeName || balance.leaveTypeCode}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {balance.currentLeaveBalance}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {balance.approvedCreditDays}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {balance.pendingCreditDays}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {balance.pendingCount}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && employeeCompOffBalances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No comp-off balances found for this employee."
                          : "Select an employee to view comp-off balances."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Recent Leave Requests */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-semibold text-gray-800">
              Recent Leave Requests
            </h3>
          </div>
          <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
            {employeeLeaves.length} requests
          </span>
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Date</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Session</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Leave Type
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Status</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Days</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Pay Status</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLeaves.map((leave, index) => (
                <TableRow key={`${leave.id}-${index}`} sx={getRowColor(index)}>
                  <TableCell className="!px-4 !py-3">
                    <span className="text-[12px] text-gray-700 py-4">
                      {formatDate(leave.fromDate)}
                      {leave.fromDate !== leave.toDate ? ` - ${formatDate(leave.toDate)}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {leave.fromSession && leave.toSession
                        ? `${leave.fromSession} - ${leave.toSession}`
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {leave.leaveTypeName}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {leave.currentStatus || leave.status || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Chip
                      label={leave.totalDays}
                      size="small"
                      className= {`${leave.totalDays && leave.totalDays > 10 ? "!text-red-500 !bg-red-100" : 
                        leave.totalDays && leave.totalDays > 5 ? "!text-yellow-600 !bg-yellow-200" : "!text-blue-500 !bg-blue-100"}`}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={` text-[12px] px-2 py-1 rounded-full font-medium
                      ${leave.payrollTreatment ? "text-green-700 bg-green-100" : "text-red-500 bg-red-100"}
                    `}>
                      {leave.payrollTreatment || "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && recentLeaves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No recent leaves found for this employee."
                          : "Select an employee to view recent leave requests."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Leave Balances Table */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-semibold text-gray-800">
              Leave Balances
            </h3>
          </div>
          {hasData && (
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {balances.length} types
            </span>
          )}
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Leave Type
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Opening</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Credited</span>
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Availed</span>
                </TableCell>
                {/* <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">Pending</span>
                </TableCell> */}
                <TableCell className="px-4 py-2.5">
                  <span className="!font-semibold text-gray-800">
                    Available
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5 text-center">
                  <span className="!font-semibold text-gray-800">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                balances.map((balance, i) => (
                  <BalanceRow
                    key={`${balance.employeeId}-${balance.leaveTypeId}`}
                    balance={balance}
                    index={i}
                  />
                ))}
              {/* {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <DataState
                      compact
                      type="loading"
                      title="Loading balances..."
                    />
                  </TableCell>
                </TableRow>
              )} */}
              {!loading && balances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No balances found for this employee."
                          : "Select an employee to view balances."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Ledger History */}
      <div className="!mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-semibold text-gray-900">
              Ledger History
            </h3>
            <History className="text-red-400" fontSize="small" />
          </div>
          {ledger.length > 0 && (
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {ledger.length} entries
            </span>
          )}
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell>
                  <span className="!font-semibold">Date</span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">Leave Type</span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">Transaction</span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">Credit Days</span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">Debit Days</span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">
                    Balance After Transaction
                  </span>
                </TableCell>
                <TableCell>
                  <span className="!font-semibold">Remarks</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                ledger.map((entry, i) => (
                  <TableRow key={entry.id} sx={getRowColor(i)}>
                    <TableCell>
                      <div className="flex items-center gap-2 py-1.5">
                        <CalendarToday className="text-gray-600 !w-3" />
                        <span className="text-[12px] text-gray-700">
                          {formatDate(entry.transactionDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {entry.leaveTypeCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[12px] px-2 py-1 rounded-full font-medium ${
                          entry.transactionType === "ACCRUAL"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {entry.transactionType}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className="text-[12px] font-semibold text-gray-700">
                        {entry.creditDays || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className="text-[12px] font-semibold text-gray-700">
                        {entry.debitDays || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="text-[12px] text-gray-700">
                        {entry.balanceAfterTransaction}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-500">
                        {entry.notes || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              {!loading && ledger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No ledger entries found."
                          : "Select an employee to view ledger."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </LeavePageShell>
  );
}
