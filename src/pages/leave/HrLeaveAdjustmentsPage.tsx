import { useEffect, useState } from "react";
import {
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from "@mui/material";
import {

  History,
  TrendingUp,
  TrendingDown,
  InfoOutlineRounded,
} from "@mui/icons-material";
import DataState from "../../components/DataState";
import EmployeeAsyncCombobox from "../../components/employees/EmployeeAsyncCombobox";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveType,
} from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import { formatDate } from "./leaveFormatters";
import { getRowColor } from "../const";
import { selectSx } from "../../const";

export default function HrLeaveAdjustmentsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [_employeeName, setEmployeeName] = useState<string>("");
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [ledger, setLedger] = useState<LeaveLedgerEntry[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    leaveService
      .getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" })
      .then((response: any) => setLeaveTypes(response.data ?? []))
      .catch(() => setLeaveTypes([]));
  }, []);

  const loadEmployeeData = async (id: string) => {
    setLoading(true);
    showSpinner();
    try {
      const [balanceResponse, ledgerResponse]: any = await Promise.all([
        leaveService.getEmployeeLeaveBalances(id),
        leaveService.getEmployeeLeaveLedger(id,
          //   {
          //   page: 0,
          //   size: 50,
          //   sort: "transactionDate,DESC",
          // }
        ),
      ]);
      setBalances(balanceResponse.data?.content ?? []);
      setLedger(ledgerResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to load employee leave data",
        "error",
      );
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleEmployeeChange = (id: string | null, name?: string) => {
    setEmployeeId(id);
    setEmployeeName(name || "");
    setBalances([]);
    setLedger([]);
    setErrors({});
    if (id) {
      loadEmployeeData(id);
    }
  };

  const submitAdjustment = async () => {
    const nextErrors: Record<string, string> = {};
    if (!employeeId) nextErrors.employee = "Select an employee first";
    if (!leaveTypeId) nextErrors.leaveTypeId = "Leave type is required";
    if (!days || Number.isNaN(Number(days)))
      nextErrors.days = "Enter a valid number of days (use negative to debit)";
    if (!reason.trim()) nextErrors.reason = "Reason is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    showSpinner();
    try {
      const payload = {
        leaveTypeId: leaveTypeId,
        leaveYear: new Date().getFullYear(),
        days: Number(days),
        notes: reason,
      };
      const response = await leaveService.createLeaveAdjustment(
        employeeId!,
        payload,
      );
      if (response.success) {
        showSnackbar("Leave adjustment recorded successfully", "success");
        setLeaveTypeId("");
        setDays("");
        setReason("");
        await loadEmployeeData(employeeId!);
      }
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to create leave adjustment",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  // const getAdjustmentStats = () => {
  //   const adjustments = ledger.filter(
  //     (entry) => entry.transactionType === "ADJUSTMENT",
  //   );
  //   const totalCredits = adjustments.reduce(
  //     (sum, entry) => (entry.days && entry.days > 0 ? sum + entry.days : sum),
  //     0,
  //   );
  //   const totalDebits = adjustments.reduce(
  //     (sum, entry) =>
  //       entry.days && entry.days < 0 ? sum + Math.abs(entry.days) : sum,
  //     0,
  //   );
  //   return { totalCredits, totalDebits, totalAdjustments: adjustments.length };
  // };

  // const stats = getAdjustmentStats();
  const hasData = balances.length > 0;
  const adjustmentEntries = ledger.filter(
    (entry) => entry.transactionType === "ADJUSTMENT",
  );
  // Calculate stats from adjustment entries
  const totalCredits = adjustmentEntries.reduce((sum, entry) =>
    entry.creditDays ? sum + entry.creditDays : sum, 0
  );
  const totalDebits = adjustmentEntries.reduce((sum, entry) =>
    entry.debitDays ? sum + entry.debitDays : sum, 0
  );

  return (
    <LeavePageShell
      group="hr"
      title="Leave Adjustments"
      subtitle="Manually credit or debit an employee's leave balance"
    >
      {/* Employee Selection */}
      {/* <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Person className="text-blue-500" fontSize="small" />
          <span className="text-[12px] font-medium text-gray-700">Select Employee</span>
        </div>
        <div className="max-w-md">
          <EmployeeAsyncCombobox
            value={employeeId}
            onChange={(id) => handleEmployeeChange(id)}
            label="Search employee by name or ID"
            error={Boolean(errors.employee)}
            helperText={errors.employee}
          />
        </div>
        {employeeName && (
          <div className="mt-2 text-[12px] text-gray-600">
            Managing adjustments for: <span className="font-medium text-gray-900">{employeeName}</span>
          </div>
        )}
      </div> */}
      <div className="col-span-3 !mt-5">
        <EmployeeAsyncCombobox
          value={employeeId}
          onChange={(id) => handleEmployeeChange(id)}
          label="Search employee by name or ID"
          error={Boolean(errors.employee)}
          helperText={errors.employee}
        />
      </div>


      {/* Adjustment Form */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-100 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <InfoOutlineRounded className="!w-4 text-primary dark:text-gray-800" />
          <span className="text-[12px] font-medium text-gray-700">
            Record Adjustment
          </span>
          <span className="text-[12px] text-gray-500 ml-auto">
            Use positive values to credit, negative to debit
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <TextField
              select
              label="Leave Type"
              value={leaveTypeId}
              error={Boolean(errors.leaveTypeId)}
              helperText={errors.leaveTypeId}
              onChange={(event) => setLeaveTypeId(event.target.value)}
              sx={selectSx}
            >
              {leaveTypes.map((leaveType) => (
                <MenuItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div className="md:col-span-2">
            <TextField
              label="Days +/-"
              type="number"
              value={days}
              error={Boolean(errors.days)}
              helperText={errors.days}
              onChange={(event) => setDays(event.target.value)}
              fullWidth
            />
          </div>
          <div className="md:col-span-4">
            <TextField
              label="Reason"
              value={reason}
              error={Boolean(errors.reason)}
              helperText={errors.reason}
              onChange={(event) => setReason(event.target.value)}
              fullWidth
              placeholder="Enter reason for adjustment"
            />
          </div>
          <div className="w-max">
            <Button
              variant="contained"
              onClick={submitAdjustment}
              fullWidth
              className="!bg-primary"
              disabled={!employeeId}
            >
              Record Adjustment
            </Button>
          </div>
        </div>
        {/* <div className="flex mt-3 justify-end">
          <div className="w-max">
            <Button
              variant="contained"
              onClick={submitAdjustment}
              fullWidth
              className="!bg-primary"
              disabled={!employeeId}
            >
              Record Adjustment
            </Button>
          </div>
        </div> */}
      </div>

      
      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-gray-800">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px]">Total Adjustments</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {adjustmentEntries.length}
                </div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-full">
                <History className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px]">Total Credits</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  +{totalCredits}
                </div>
              </div>
              <div className="p-2.5 bg-green-50 rounded-full">
                <TrendingUp className="text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px]">Total Debits</div>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  -{totalDebits}
                </div>
              </div>
              <div className="p-2.5 bg-red-50 rounded-full">
                <TrendingDown className="text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Balances */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-bold text-gray-900">
              Current Balances
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
                <TableCell className="!font-semibold">Leave Type</TableCell>
                <TableCell className="!font-semibold">Available</TableCell>
                <TableCell className="!font-semibold">Pending</TableCell>
                <TableCell className="!font-semibold">Adjusted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                balances.map((balance, i) => (
                  <TableRow
                    key={`${balance.employeeId}-${balance.leaveTypeId}`}
                    sx={getRowColor(i)}
                  >
                    <TableCell>
                      <div className="text-gray-900">
                        {balance.leaveTypeName}{" "}
                        <span className="text-[12px] text-gray-500">
                          ({balance.leaveTypeCode})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={balance.balance}
                        size="small"
                        className={`font-semibold ${balance.balance > 2
                          ? "!bg-green-50 !text-green-700 !border-green-200"
                          : balance.balance > 0
                            ? "!bg-yellow-50 !text-yellow-700 !border-yellow-200"
                            : "!bg-red-50 !text-red-700 !border-red-200"
                          }`}
                      />
                    </TableCell>
                    <TableCell>{balance.pending || 0}</TableCell>
                    <TableCell>{balance.adjusted || 0}</TableCell>
                  </TableRow>
                ))}
              {!loading && balances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No balances found."
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

      {/* Adjustment History */}
      <div className="!mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>

            <h3 className="text-[12px] font-bold text-gray-900">
              Adjustment History
            </h3>
            <History className="text-red-400" fontSize="small" />
          </div>
          {adjustmentEntries.length > 0 && (
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {adjustmentEntries.length} adjustments
            </span>
          )}
        </div>
        <TableContainer

          className="overflow-auto border border-gray-200 rounded-sm"

        >
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-bold">
                  Date
                </TableCell>
                <TableCell className="!font-bold">
                  Leave Type
                </TableCell>
                <TableCell className="!font-bold">
                  Type
                </TableCell>
                <TableCell className="!font-bold">
                  Days
                </TableCell>
                <TableCell className="!font-bold">
                  Reason
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                adjustmentEntries.map((entry, i) => (
                  <TableRow key={entry.id} sx={getRowColor(i)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                      <Chip
                        label={entry.creditDays > 0 ? "Credit" : "Debit"}
                        size="small"
                        className={
                          entry.creditDays > 0
                            ? "!bg-green-50 !text-green-700 !border-green-200"
                            : "!bg-red-50 !text-red-700 !border-red-200"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[12px] font-semibold ${entry.creditDays > 0
                          ? "!text-green-600"
                          : "!text-red-600"
                          }`}
                      >
                        {entry.creditDays > 0 ? `+${entry.creditDays}` : `-${entry.debitDays}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-600">
                        {entry.notes || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              {!loading && adjustmentEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title={
                        employeeId
                          ? "No adjustments recorded."
                          : "Select an employee to view history."
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
