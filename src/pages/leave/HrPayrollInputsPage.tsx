import { useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  CalendarToday,
  TrendingUp,
  TrendingDown,
  Info,
  Search,
  Refresh,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DataState from "../../components/DataState";
import EmployeeAsyncCombobox from "../../components/employees/EmployeeAsyncCombobox";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { PayrollLeaveInput } from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import { getRowColor } from "../const";
// import {
//   leaveTableBodyCellSx,
//   leaveTableClassName,
//   leaveTableContainerSx,
//   leaveTableHeaderCellClassName,
//   leaveTableHeaderRowSx,
//   leaveTableRowSx,
//   leaveTableSx,
// } from "./components/leaveTableStyles";
// import { getRowColor } from "../const";

export default function HrPayrollInputsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [inputs, setInputs] = useState<PayrollLeaveInput[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Filter states
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs());

  const loadData = async () => {
    if (!employeeId) {
      showSnackbar("Please select an employee", "warning");
      return;
    }

    setLoading(true);
    showSpinner();
    try {
      const [summaryResponse, inputResponse]:any = await Promise.all([
        leaveService.getPayrollLeaveSummary({
          employeeId: employeeId,
          from: fromDate.format('YYYY-MM-DD'),
          to: toDate.format('YYYY-MM-DD'),
        }),
        leaveService.getPayrollLeaveInputs({ 
          employeeId: employeeId,
          page: 0, 
          size: 50 
        }),
      ]);
      setSummary(summaryResponse.data ?? null);
      setInputs(inputResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load payroll data", "error");
      setSummary(null);
      setInputs([]);
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const handleEmployeeChange = (id: string | null, name?: string) => {
    setEmployeeId(id);
    setEmployeeName(name || "");
    if (!id) {
      setSummary(null);
      setInputs([]);
    }
  };

  const handleSearch = () => {
    if (employeeId) {
      loadData();
    }
  };

  const handleTypeClick = (type: any) => {
    setSelectedType(type);
    setDetailsDialogOpen(true);
  };

  const totalLeaveDays = summary?.totalLeaveDays || 0;
  const paidLeaveDays = summary?.paidLeaveDays || 0;
  const lopDays = summary?.lopDays || 0;
  const byLeaveType = summary?.byLeaveType || [];

  return (
    <LeavePageShell
      group="hr"
      title="Payroll Inputs"
      subtitle="Leave-related payroll inputs and monthly rollups"
    >
      {/* Filter Section */}
      <div className="p-4 pt-6 my-4 border border-gray-200 rounded-xl bg-white-50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <EmployeeAsyncCombobox
              value={employeeId}
              onChange={(id) => handleEmployeeChange(id)}
              // label="Search Employee"
            />
          </div>
          <div className="md:col-span-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => newValue && setFromDate(dayjs(newValue))}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>
          <div className="md:col-span-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => newValue && setToDate(dayjs(newValue))}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!employeeId || loading}
              className="!bg-primary !normal-case !px-4"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
            >
              {loading ? "Loading..." : "Search"}
            </Button>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => employeeId && loadData()} 
                className="!border !border-gray-300 !rounded-lg"
                disabled={!employeeId}
              >
                <Refresh fontSize="small" className="text-gray-500"/>
              </IconButton>
            </Tooltip>
          </div>
        </div>
        {employeeName && summary && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Person className="text-blue-500" fontSize="small" />
              <span className="text-sm text-gray-600">
                Showing summary for: <strong className="text-gray-900">{employeeName}</strong>
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {fromDate.format('DD MMM YYYY')} - {toDate.format('DD MMM YYYY')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Total Leave Days</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{totalLeaveDays}</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-full">
                <CalendarToday className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Paid Leave Days</div>
                <div className="text-2xl font-bold text-green-600 mt-1">{paidLeaveDays}</div>
              </div>
              <div className="p-2.5 bg-green-50 rounded-full">
                <TrendingUp className="text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">LOP Days</div>
                <div className="text-2xl font-bold text-red-600 mt-1">{lopDays}</div>
              </div>
              <div className="p-2.5 bg-red-50 rounded-full">
                <TrendingDown className="text-red-500" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-gray-500">Leave Types</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{byLeaveType.length}</div>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-full">
                <Info className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Type Breakdown */}
      {summary && byLeaveType.length > 0 && !loading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="text-[12px] font-bold text-gray-900">Leave Type Breakdown</h3>
            </div>
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {byLeaveType.length} types
            </span>
          </div>
          <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold">Leave Type</TableCell>
                  <TableCell className="!font-semibold">Code</TableCell>
                  <TableCell className="!font-semibold text-center">Days</TableCell>
                  <TableCell className="!font-semibold text-center">Status</TableCell>
                  <TableCell className="!font-semibold text-center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byLeaveType.map((type: any, i: number) => (
                  <TableRow key={type.leaveTypeId || i} sx={getRowColor(i)}>
                    <TableCell>
                      <div className="text-gray-900 font-medium">{type.name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {type.code}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={type.days || 0}
                        size="small"
                        className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={type.paid ? "Paid" : "Unpaid"}
                        size="small"
                        className={type.paid 
                          ? "!bg-green-50 !text-green-700 !border-green-200"
                          : "!bg-red-50 !text-red-700 !border-red-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleTypeClick(type)}
                          className="!text-[11px] !normal-case !px-2 !py-0.5 !border-blue-400 !text-blue-700 hover:!bg-blue-50"
                        >
                          Details
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* Payroll Input Details */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-[12px] font-bold text-gray-900">Payroll Input Details</h3>
          </div>
          {!loading && inputs.length > 0 && (
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {inputs.length} entries
            </span>
          )}
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-semibold">Employee</TableCell>
                <TableCell className="!font-semibold">Month</TableCell>
                <TableCell className="!font-semibold text-center">LOP Days</TableCell>
                <TableCell className="!font-semibold text-center">Paid Leave Days</TableCell>
                <TableCell className="!font-semibold text-center">Comp-Off Days</TableCell>
                <TableCell className="!font-semibold">Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                inputs.map((input, i) => (
                  <TableRow key={input.id} sx={getRowColor(i)}>
                    <TableCell>
                      <div>
                        <div className="text-gray-900 font-medium">{input.employeeName}</div>
                        <div className="text-[12px] text-gray-500">{input.employeeCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">{input.month}</span>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.lopDays || 0}
                        size="small"
                        className={input.lopDays > 0 
                          ? "!bg-red-50 !text-red-700 !border-red-200 !font-semibold"
                          : "!bg-gray-50 !text-gray-500 !border-gray-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.paidLeaveDays || 0}
                        size="small"
                        className={input.paidLeaveDays > 0 
                          ? "!bg-green-50 !text-green-700 !border-green-200 !font-semibold"
                          : "!bg-gray-50 !text-gray-500 !border-gray-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.compOffDays || 0}
                        size="small"
                        className={input.compOffDays > 0 
                          ? "!bg-purple-50 !text-purple-700 !border-purple-200 !font-semibold"
                          : "!bg-gray-50 !text-gray-500 !border-gray-200"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={input.remarks || "Ready"}
                        size="small"
                        className={
                          input.remarks?.toLowerCase().includes('pending') 
                            ? "!bg-yellow-50 !text-yellow-700 !border-yellow-200"
                            : input.remarks?.toLowerCase().includes('review')
                            ? "!bg-blue-50 !text-blue-700 !border-blue-200"
                            : "!bg-green-50 !text-green-700 !border-green-200"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <DataState compact type="loading" title="Loading payroll inputs..." />
                  </TableCell>
                </TableRow>
              )}
              {!loading && inputs.length === 0 && employeeId && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <DataState compact type="empty" title="No payroll leave inputs found." />
                  </TableCell>
                </TableRow>
              )}
              {!loading && !employeeId && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8">
                    <DataState compact type="empty" title="Select an employee to view payroll inputs." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Empty State - No Summary */}
      {!loading && employeeId && !summary && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center mt-4">
          <Info className="text-gray-400 text-4xl mb-2" />
          <h3 className="text-lg font-semibold text-gray-600">No Data Found</h3>
          <p className="text-sm text-gray-500 mt-1">
            No leave summary available for the selected period.
          </p>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="!pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-sm font-semibold text-gray-900">Leave Type Details</span>
          </div>
        </DialogTitle>
        <DialogContent>
          {selectedType && (
            <div className="space-y-3 mt-2">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-gray-500">Leave Type</div>
                    <div className="text-sm font-medium text-gray-900">{selectedType.name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Code</div>
                    <div className="text-sm font-medium text-gray-900">{selectedType.code}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Days</div>
                    <div className="text-sm font-bold text-gray-900">{selectedType.days || 0}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Status</div>
                    <Chip
                      label={selectedType.paid ? "Paid" : "Unpaid"}
                      size="small"
                      className={selectedType.paid 
                        ? "!bg-green-50 !text-green-700 !border-green-200"
                        : "!bg-red-50 !text-red-700 !border-red-200"
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-gray-500">
                Employee: {employeeName}
              </div>
              <div className="text-[11px] text-gray-500">
                Period: {fromDate.format('DD MMM YYYY')} - {toDate.format('DD MMM YYYY')}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            onClick={() => setDetailsDialogOpen(false)}
            className="!text-gray-600 !normal-case"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}