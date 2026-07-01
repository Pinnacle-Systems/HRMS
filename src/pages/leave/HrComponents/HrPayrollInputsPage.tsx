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
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Search,
  Refresh,
  Lock,
  LockOpen,
  Add,
  Preview,
  CheckCircle,
  LockOutlined,
  AttachMoneyOutlined,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DataState from "../../../components/DataState";
import EmployeeAsyncCombobox from "../../../components/employees/EmployeeAsyncCombobox";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  PayrollLeaveInput,
  PayrollLeaveSummary,
  LockUnlockPayload,
  GeneratePayload,
  LeaveEncashment,
  LeaveEncashmentPayload,
  LeaveEncashmentPreview,
  FinalSettlementProcess,
  FinalSettlementPayload,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import { getRowColor } from "../../const";
import type { EmployeeSummaryResponse } from "../../../services/modules/employees";


export default function HrPayrollInputsPage() {
  const { showSnackbar } = useUI();
  const [inputs, setInputs] = useState<PayrollLeaveInput[]>([]);
  const [summary, setSummary] = useState<PayrollLeaveSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filter states
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf("month"));
  const [toDate, setToDate] = useState(dayjs());

  // New states for payroll inputs
  const [payrollMonth, setPayrollMonth] = useState(dayjs().format("YYYY-MM"));
  const [branchId, _setBranchId] = useState<string>("");
  const [departmentId, _setDepartmentId] = useState<string>("");

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Encashment states
  const [encashmentDialogOpen, setEncashmentDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [encashments, setEncashments] = useState<LeaveEncashment[]>([]);
  const [encashmentFormData, setEncashmentFormData] =
    useState<LeaveEncashmentPayload>({
      employeeId: "",
      leaveTypeId: "",
      leaveYear: new Date().getFullYear(),
      days: 0,
      perDayRate: 0,
      payrollMonth: dayjs().format("YYYY-MM"),
      notes: "",
    });
  const [encashmentPreviewData, setEncashmentPreviewData] =
    useState<LeaveEncashmentPreview | null>(null);

  // Settlement states
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [settlementData, setSettlementData] =
    useState<FinalSettlementProcess | null>(null);
  const [settlementFormData, setSettlementFormData] =
    useState<FinalSettlementPayload>({
      perDayRate: 1000,
      payrollMonth: dayjs().format("YYYY-MM"),
      lapseNonEncashable: true,
      notes: "",
    });
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>(
    [],
  );
  useEffect(() => {
    leaveService
      .getLeaveTypes()
      .then((res: any) => {
        const data =
          res.data?.data?.content ?? res.data?.content ?? res.data ?? [];
        setLeaveTypes(Array.isArray(data) ? data : []);
      })
      .catch(() => { });

    // branchService.getDropdownBranches().then((res: any) => {
    //   const data = res.data?.data?.content ?? res.data?.content ?? res.data ?? [];
    //   setBranchId(Array.isArray(data) ? data : []);
    // }).catch(() => { });

    // departmentService.getActiveDepartments().then((res: any) => {
    //   const data = res.data?.data?.content ?? res.data?.content ?? res.data ?? [];
    //   setLeaveTypes(Array.isArray(data) ? data : []);
    // }).catch(() => { });
  }, []);

  // Load payroll inputs (without employee filter)
  const loadPayrollInputs = async () => {
    setLoading(true);
    try {
      const response: any = await leaveService.getPayrollLeaveInputs({
        payrollMonth: payrollMonth,
        branchId: branchId || undefined,
        departmentId: departmentId || undefined,
        page: 0,
        size: 50,
      });
      if (response.success) {
        setInputs(response.data.content || []);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load payroll inputs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load summary for selected employee
  const loadSummary = async () => {
    if (!employeeId) {
      setSummary(null);
      return;
    }

    try {
      const response: any = await leaveService.getPayrollLeaveSummary({
        employeeId: employeeId,
        from: fromDate.format("YYYY-MM-DD"),
        to: toDate.format("YYYY-MM-DD"),
      });
      setSummary(response.data ?? null);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load summary", "error");
      setSummary(null);
    }
  };

  // Load encashments for selected employee
  const loadEncashments = async () => {
    if (!employeeId) return;

    try {
      const response: any = await leaveService.getLeaveEncashments({
        employeeId: employeeId,
        page: 0,
        size: 50,
      });
      if (response.success) {
        setEncashments(response.data.content || []);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load encashments", "error");
    }
  };

  useEffect(() => {
    loadPayrollInputs();
  }, [payrollMonth, branchId, departmentId]);

  useEffect(() => {
    if (employeeId) {
      loadSummary();
      loadEncashments();
    }
  }, [employeeId, fromDate, toDate]);

  const handleEmployeeChange = (
    id: string | null,
    employee?: EmployeeSummaryResponse | null,
  ) => {
    console.log(id, employee);

    setEmployeeId(id);
    setEmployeeName(employee?.name || "");
    if (!id) {
      setSummary(null);
    }
  };

  const handleSearch = () => {
    loadPayrollInputs();
    if (employeeId) {
      loadSummary();
      loadEncashments();
    }
  };

  // Generate, Lock, Unlock functions
  const handleGenerate = async () => {
    setProcessing(true);
    try {
      const payload: GeneratePayload = {
        payrollMonth: payrollMonth,
        // branchId: branchId || "default-branch-id",
        // departmentId: departmentId || "default-department-id",
      };
      const response: any = await leaveService.generateLeaveInputs(payload);
      if (response.success) {
        setSuccessMessage("Leave inputs generated successfully");
        await loadPayrollInputs();
        setGenerateDialogOpen(false);
      } else {
        setErrorMessage(response.message || "Failed to generate leave inputs");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to generate leave inputs");
    } finally {
      setProcessing(false);
    }
  };

  const handleLock = async (lock: boolean) => {
    setProcessing(true);
    try {
      const payload: LockUnlockPayload = {
        payrollMonth: payrollMonth,
        // branchId: branchId || "default-branch-id",
        // departmentId: departmentId || "default-department-id",
      };
      const response: any = lock
        ? await leaveService.lockLeaveInputs(payload)
        : await leaveService.unlockLeaveInputs(payload);
      if (response.success) {
        setSuccessMessage(
          `Leave inputs ${lock ? "locked" : "unlocked"} successfully`,
        );
        await loadPayrollInputs();
        setLockDialogOpen(false);
      } else {
        setErrorMessage(
          response.message ||
          `Failed to ${lock ? "lock" : "unlock"} leave inputs`,
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || `Failed to ${lock ? "lock" : "unlock"} leave inputs`,
      );
    } finally {
      setProcessing(false);
    }
  };

  // Encashment functions
  const handleEncashmentPreview = async () => {
    if (!employeeId) {
      showSnackbar("Please select an employee first", "warning");
      return;
    }
    if (
      !encashmentFormData.leaveTypeId ||
      !encashmentFormData.days ||
      !encashmentFormData.perDayRate
    ) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }

    setProcessing(true);
    try {
      const response: any = await leaveService.previewLeaveEncashment({
        ...encashmentFormData,
        employeeId: employeeId,
      });
      if (response.success) {
        setEncashmentPreviewData(response.data);
        setPreviewDialogOpen(true);
      } else {
        showSnackbar(
          response.message || "Failed to preview encashment",
          "error",
        );
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to preview encashment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateEncashment = async () => {
    if (!employeeId) {
      showSnackbar("Please select an employee first", "warning");
      return;
    }

    setProcessing(true);
    try {
      const response: any = await leaveService.createLeaveEncashment({
        ...encashmentFormData,
        employeeId: employeeId,
      });
      if (response.success) {
        setSuccessMessage("Leave encashment created successfully");
        setEncashmentDialogOpen(false);
        setPreviewDialogOpen(false);
        await loadEncashments();
        // Reset form
        setEncashmentFormData({
          employeeId: "",
          leaveTypeId: "",
          leaveYear: new Date().getFullYear(),
          days: 0,
          perDayRate: 0,
          payrollMonth: dayjs().format("YYYY-MM"),
          notes: "",
        });
        setEncashmentPreviewData(null);
      } else {
        setErrorMessage(response.message || "Failed to create encashment");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to create encashment");
    } finally {
      setProcessing(false);
    }
  };

  // Settlement functions
  const handleSettlementPreview = async () => {
    if (!employeeId) {
      showSnackbar("Please select an employee first", "warning");
      return;
    }

    setProcessing(true);
    try {
      const response: any = await leaveService.previewFinalSettlement(
        employeeId,
        settlementFormData,
      );
      if (response.success) {
        setSettlementData(response.data);
        setConfirmDialogOpen(true);
      } else {
        showSnackbar(
          response.message || "Failed to preview settlement",
          "error",
        );
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to preview settlement", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessSettlement = async () => {
    if (!employeeId) return;

    setProcessing(true);
    try {
      const response: any = await leaveService.processFinalSettlement(
        employeeId,
        settlementFormData,
      );
      if (response.success) {
        setSuccessMessage("Final settlement processed successfully");
        setSettlementDialogOpen(false);
        setConfirmDialogOpen(false);
        setSettlementData(response.data);
      } else {
        setErrorMessage(response.message || "Failed to process settlement");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to process settlement");
    } finally {
      setProcessing(false);
    }
  };

  const handleTypeClick = (type: any) => {
    setSelectedType(type);
    setDetailsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const dialogSx = {
    "& .MuiDialog-paper": {
      width: "600px",
      maxWidth: "600px",
    },
  };

  const renderSettlementSummary = (data: FinalSettlementProcess) => (
    <Box className="mt-4">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent>
              <div className="text-[12px] text-gray-500">Per Day Rate</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(data.perDayRate)}
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-green-50 border border-green-200">
            <CardContent>
              <div className="text-[12px] text-gray-500">Total Encash Days</div>
              <div className="text-lg font-bold text-green-700">
                {data.totalEncashDays}
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-purple-50 border border-purple-200">
            <CardContent>
              <div className="text-[12px] text-gray-500">
                Total Encash Amount
              </div>
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(data.totalEncashAmount)}
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-red-50 border border-red-200">
            <CardContent>
              <div className="text-[12px] text-gray-500">Total Lapse Days</div>
              <div className="text-lg font-bold text-red-700">
                {data.totalLapseDays}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {data.totalRecoverDays > 0 && (
        <Alert severity="warning" className="mt-3">
          Recovery Days: <strong>{data.totalRecoverDays}</strong> days need to
          be recovered
        </Alert>
      )}

      <div className="mt-4 mb-2">
        <div className="text-[12px] font-semibold text-gray-900">
          Leave Settlement Details
        </div>
      </div>
      <TableContainer className="border border-gray-200 rounded-sm">
        <Table size="small">
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="!font-semibold">Leave Type</TableCell>
              <TableCell className="!font-semibold text-center">Year</TableCell>
              <TableCell className="!font-semibold text-center">
                Closing Balance
              </TableCell>
              <TableCell className="!font-semibold text-center">
                Action
              </TableCell>
              <TableCell className="!font-semibold text-center">Days</TableCell>
              <TableCell className="!font-semibold text-center">
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.lines.map((line, i) => (
              <TableRow key={line.leaveTypeId} sx={getRowColor(i)}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {line.leaveTypeName}
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {line.leaveTypeCode}
                    </div>
                  </div>
                </TableCell>
                <TableCell align="center">{line.leaveYear}</TableCell>
                <TableCell align="center">{line.closingBalance}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={line.action}
                    size="small"
                    className={
                      line.action === "ENCASH"
                        ? "!bg-green-50 !text-green-700 !border-green-200 !font-semibold"
                        : line.action === "LAPSE"
                          ? "!bg-red-50 !text-red-700 !border-red-200 !font-semibold"
                          : "!bg-yellow-50 !text-yellow-700 !border-yellow-200 !font-semibold"
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={line.days}
                    size="small"
                    className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                  />
                </TableCell>
                <TableCell align="center">
                  {line.amount > 0 ? formatCurrency(line.amount) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // const totalLeaveDays = summary?.totalLeaveDays || 0;
  // const paidLeaveDays = summary?.paidLeaveDays || 0;
  // const lopDays = summary?.lopDays || 0;

  return (
    <LeavePageShell
      group="hr"
      title="Payroll Inputs"
      subtitle="Leave-related payroll inputs and monthly rollups"
    >
      {/* Snackbar for messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Filter Section */}
      <div className="p-4 pt-6 my-4 border border-gray-200 rounded-xl bg-white-50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            {/* <EmployeeAsyncCombobox
              value={employeeId}
              selectedEmployee={employeeName}
              onChange={(id) => handleEmployeeChange(id)}
              placeholder="Search Employee (for summary)"
            /> */}
            <EmployeeAsyncCombobox
              value={employeeId}
              onChange={(employeeId, employee) =>
                handleEmployeeChange(employeeId, employee)
              }
            />
          </div>
          <div className="md:col-span-2">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) =>
                  newValue && setFromDate(dayjs(newValue))
                }
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>
          <div className="md:col-span-2">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => newValue && setToDate(dayjs(newValue))}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>
          {/* <div className="md:col-span-2">
            <TextField
              fullWidth
              label="Payroll Month"
              type="month"
              size="small"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
            />
          </div> */}
          <div className="md:col-span-2">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Payroll Month"
                views={["month", "year"]}
                value={dayjs(payrollMonth)}
                className="!text-[12px]"
                onChange={(newValue) => {
                  if (newValue) {
                    setPayrollMonth(dayjs(newValue).format("YYYY-MM"));
                  }
                }}
              />
            </LocalizationProvider>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              className="!bg-primary  !px-4"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Search />
                )
              }
            >
              {loading ? "Loading..." : "Search"}
            </Button>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleSearch}
                className="!border !border-gray-300 !rounded-lg"
              >
                <Refresh fontSize="small" className="text-gray-500" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add className="!w-4" />}
            onClick={() => setGenerateDialogOpen(true)}
            disabled={processing}
          >
            Generate
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LockOutlined className="!w-4" />}
            onClick={() => setLockDialogOpen(true)}
            disabled={processing}
          >
            Lock
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AttachMoneyOutlined className="!w-4" />}
            onClick={() => {
              if (!employeeId) {
                showSnackbar("Please select an employee first", "warning");
                return;
              }
              setEncashmentDialogOpen(true);
            }}
            disabled={!employeeId}
          >
            Encashment
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<CheckCircle className="!w-4" />}
            onClick={() => {
              if (!employeeId) {
                showSnackbar("Please select an employee first", "warning");
                return;
              }
              setSettlementDialogOpen(true);
            }}
            disabled={!employeeId}
            className=""
          >
            Final Settlement
          </Button>
        </div>

        {/* {employeeName && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Person className="text-blue-500" fontSize="small" />
              <span className="text-[12px] text-gray-600">
                Showing summary for: <strong className="text-gray-800">{employeeName}</strong>
              </span>
              <span className="text-[12px]] text-gray-500 ml-1">
                {fromDate.format('DD MMM YYYY')} - {toDate.format('DD MMM YYYY')}
              </span>
            </div>
          </div>
        )} */}
      </div>

      {/* Summary Cards - Only show when employee is selected */}
      {/* {employeeId && summary && !loading && (
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
                <div className="text-[12px] text-gray-500">Total Leave Types</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{summary.byLeaveType.length ?? 0}</div>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-full">
                <Info className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Leave Type Breakdown */}
      {employeeId &&
        summary &&
        summary.byLeaveType &&
        summary.byLeaveType.length > 0 &&
        !loading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <div className="text-[12px] font-bold text-gray-900">
                  Leave Type Breakdown
                </div>
              </div>
              <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                {summary.byLeaveType.length} types
              </span>
            </div>
            <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
              <Table size="small">
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="!font-semibold">Leave Type</TableCell>
                    <TableCell className="!font-semibold">Code</TableCell>
                    <TableCell className="!font-semibold text-center">
                      Days
                    </TableCell>
                    <TableCell className="!font-semibold text-center">
                      Status
                    </TableCell>
                    <TableCell className="!font-semibold text-center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.byLeaveType.map((type: any, i: number) => (
                    <TableRow key={type.leaveTypeId || i} sx={getRowColor(i)}>
                      <TableCell>
                        <div className="text-gray-900 font-medium">
                          {type.name}
                        </div>
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
                          className={
                            type.paid
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
                            className="!text-[12px]  !px-2 !py-0.5 !border-blue-400 !text-blue-700 hover:!bg-blue-50"
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

      {/* Encashment - By employees */}
      <div className="!mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <div className="text-[12px] font-bold text-gray-900">
              Encashment Details
            </div>
          </div>
          {!loading && encashments.length > 0 && (
            <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              {encashments.length} entries
            </span>
          )}
        </div>
        <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-semibold">Employee</TableCell>
                <TableCell className="!font-semibold">
                  Leave Type Name
                </TableCell>
                <TableCell className="!font-semibold">Leave Year</TableCell>
                <TableCell className="!font-semibold">Payroll Month</TableCell>
                <TableCell className="!font-semibold">Amount</TableCell>
                <TableCell className="!font-semibold">Per Day Rate</TableCell>
                <TableCell className="!font-semibold">Notes</TableCell>
                <TableCell className="!font-semibold">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                encashments.map((input, i) => (
                  <TableRow key={input.id} sx={getRowColor(i)}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {input.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-500">
                        {input.leaveTypeName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">
                        {input.leaveYear}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={input.payrollMonth}
                        size="small"
                        className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">
                        {input.amount}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={input.perDayRate}
                        size="small"
                        className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">
                        {input.notes}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">
                        {input.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <DataState
                      compact
                      type="loading"
                      title="Loading payroll inputs..."
                    />
                  </TableCell>
                </TableRow>
              )}
              {!loading && inputs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title="No payroll leave inputs found."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {
          !employeeName &&
          <div className="text-[12px] text-gray-600 text-center p-4 border borde-gray-200">Select Employee to Get Encashment Details</div>
        }
      </div>

      {/* Payroll Input Details Table - Shows all employees */}
      <div className="!mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <div className="text-[12px] font-bold text-gray-900">
              Payroll Input Details
            </div>
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
                <TableCell className="!font-semibold">Code</TableCell>
                <TableCell className="!font-semibold">Month</TableCell>
                <TableCell className="!font-semibold text-center">
                  LOP Days
                </TableCell>
                <TableCell className="!font-semibold text-center">
                  Paid Leave Days
                </TableCell>
                <TableCell className="!font-semibold text-center">
                  Total Leave Days
                </TableCell>
                <TableCell className="!font-semibold text-center">
                  Status
                </TableCell>
                <TableCell className="!font-semibold text-center">
                  Locked
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                inputs.map((input, i) => (
                  <TableRow key={input.id} sx={getRowColor(i)}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {input.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-500">
                        {input.employeeCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-700">
                        {input.payrollMonth}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.lopDays || 0}
                        size="small"
                        className={
                          input.lopDays > 0
                            ? "!bg-red-50 !text-red-700 !border-red-200 !font-semibold"
                            : "!bg-gray-50 !text-gray-500 !border-gray-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.paidLeaveDays || 0}
                        size="small"
                        className={
                          input.paidLeaveDays > 0
                            ? "!bg-green-50 !text-green-700 !border-green-200 !font-semibold"
                            : "!bg-gray-50 !text-gray-500 !border-gray-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.totalLeaveDays || 0}
                        size="small"
                        className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={input.status || "Active"}
                        size="small"
                        className={
                          input.status === "ACTIVE"
                            ? "!bg-green-50 !text-green-700 !border-green-200"
                            : "!bg-yellow-50 !text-yellow-700 !border-yellow-200"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={
                          input.locked ? (
                            <Lock className="!text-red-500 !w-3 !h-3" />
                          ) : (
                            <LockOpen className="!text-green-500 !w-3 !h-3" />
                          )
                        }
                        label={input.locked ? "Locked" : "Unlocked"}
                        size="small"
                        className={
                          input.locked
                            ? "!bg-red-50 !text-red-700 !border-red-200"
                            : "!bg-green-50 !text-green-700 !border-green-200"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <DataState
                      compact
                      type="loading"
                      title="Loading payroll inputs..."
                    />
                  </TableCell>
                </TableRow>
              )}
              {!loading && inputs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-8">
                    <DataState
                      compact
                      type="empty"
                      title="No payroll leave inputs found."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>


      {/* Leave Type Breakdown Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        sx={dialogSx}
      >
        <DialogTitle className="!pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] font-semibold text-gray-900">
              Leave Type Details
            </span>
          </div>
        </DialogTitle>
        <DialogContent>
          {selectedType && (
            <div className="space-y-3 mt-2">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[12px] text-gray-500">Leave Type</div>
                    <div className="text-[12px] font-medium text-gray-900">
                      {selectedType.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">Code</div>
                    <div className="text-[12px] font-medium text-gray-900">
                      {selectedType.code}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">Days</div>
                    <div className="text-[12px] font-bold text-gray-900">
                      {selectedType.days || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500">Status</div>
                    <Chip
                      label={selectedType.paid ? "Paid" : "Unpaid"}
                      size="small"
                      className={
                        selectedType.paid
                          ? "!bg-green-50 !text-green-700 !border-green-200"
                          : "!bg-red-50 !text-red-700 !border-red-200"
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="text-[12px] text-gray-500">
                Employee: {employeeName}
              </div>
              <div className="text-[12px] text-gray-500">
                Period: {fromDate.format("DD MMM YYYY")} -{" "}
                {toDate.format("DD MMM YYYY")}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            onClick={() => setDetailsDialogOpen(false)}
            className="!text-gray-600 "
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
      >
        <DialogTitle className="border-b border-gray-200">
          Generate Payroll Inputs
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will generate payroll inputs for the selected month (
            {payrollMonth}). Are you sure you want to continue?
          </Alert>
          <div className="mt-3 text-[12px] text-gray-600">
            <p>
              Month: <strong>{payrollMonth}</strong>
            </p>
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setGenerateDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={processing}
            className="!bg-primary"
          >
            {processing ? <CircularProgress size={24} /> : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lock/Unlock Dialog */}
      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle className="border-b border-gray-200">
          Lock/Unlock Payroll Inputs
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will lock all payroll inputs for {payrollMonth}. Locked inputs
            cannot be modified. Are you sure?
          </Alert>
          <div className="mt-3 text-[12px] text-gray-600">
            <p>
              Month: <strong>{payrollMonth}</strong>
            </p>
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setLockDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleLock(true)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : "Lock"}
          </Button>
          <Button
            variant="outlined"
            className="!text-primary !border-primary"
            onClick={() => handleLock(false)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : "Unlock"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Encashment Dialog */}
      <Dialog
        open={encashmentDialogOpen}
        onClose={() => {
          setEncashmentDialogOpen(false);
          setEncashmentPreviewData(null);
        }}
        maxWidth="md"
        sx={dialogSx}
      >
        <DialogTitle className="border-b !p-2 border-gray-200">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] text-gray-900">Leave Encashment</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box className="!mt-6">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Employee"
                  value={employeeName || "No employee selected"}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* <TextField
                  fullWidth
                  label="Payroll Month"
                  type="month"
                  value={encashmentFormData.payrollMonth}
                  onChange={(e) => setEncashmentFormData({ ...encashmentFormData, payrollMonth: e.target.value })}
                /> */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Payroll Month"
                    views={["month", "year"]}
                    value={dayjs(encashmentFormData.payrollMonth)}
                    className="!text-[12px]"
                    onChange={(newValue) => {
                      if (newValue) {
                        setEncashmentFormData({
                          ...encashmentFormData,
                          payrollMonth: dayjs(newValue).format("YYYY-MM"),
                        });
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {/* <TextField
                  fullWidth
                  label="Leave Type ID"
                  value={encashmentFormData.leaveTypeId}
                  onChange={(e) => setEncashmentFormData({ ...encashmentFormData, leaveTypeId: e.target.value })}
                  required
                  placeholder="Enter leave type ID"
                /> */}
                <TextField
                  select
                  label="Leave Type"
                  value={encashmentFormData.leaveTypeId}
                  onChange={(e) =>
                    setEncashmentFormData({
                      ...encashmentFormData,
                      leaveTypeId: e.target.value,
                    })
                  }
                >
                  {leaveTypes.map((leaveType) => (
                    <MenuItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Leave Year"
                  type="number"
                  value={encashmentFormData.leaveYear}
                  onChange={(e) =>
                    setEncashmentFormData({
                      ...encashmentFormData,
                      leaveYear: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Days to Encash"
                  type="number"
                  value={encashmentFormData.days}
                  onChange={(e) =>
                    setEncashmentFormData({
                      ...encashmentFormData,
                      days: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Per Day Rate"
                  type="number"
                  value={encashmentFormData.perDayRate}
                  onChange={(e) =>
                    setEncashmentFormData({
                      ...encashmentFormData,
                      perDayRate: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={encashmentFormData.notes}
                  onChange={(e) =>
                    setEncashmentFormData({
                      ...encashmentFormData,
                      notes: e.target.value,
                    })
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              {encashmentFormData.days > 0 &&
                encashmentFormData.perDayRate > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                      Total Amount:{" "}
                      <strong>
                        {formatCurrency(
                          encashmentFormData.days *
                          encashmentFormData.perDayRate,
                        )}
                      </strong>
                    </Alert>
                  </Grid>
                )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="outlined"
            onClick={() => {
              setEncashmentDialogOpen(false);
              setEncashmentPreviewData(null);
            }}
            className="!text-gray-600 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleEncashmentPreview}
            disabled={processing || !employeeId}
            className="!text-primary !border-primary"
            startIcon={<Preview />}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateEncashment}
            disabled={processing || !employeeId}
            className="!bg-primary"
          >
            {processing ? <CircularProgress size={24} /> : "Create Encashment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Encashment Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setEncashmentPreviewData(null);
        }}
        maxWidth="md"
        sx={dialogSx}
      >
        <DialogTitle className="border-b border-gray-200 !p-2">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] text-gray-800">
              Encashment Preview
            </span>
          </div>
        </DialogTitle>
        <DialogContent>
          {encashmentPreviewData && (
            <Box className="mt-4">
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className="text-[12px] text-gray-500">
                        Leave Type
                      </div>
                      <div className="text-[12px] font-semibold text-gray-900">
                        {encashmentPreviewData.leaveTypeName} (
                        {encashmentPreviewData.leaveTypeCode})
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className="text-[12px] text-gray-500">Year</div>
                      <div className="text-[12px] font-semibold text-gray-900">
                        {encashmentPreviewData.leaveYear}
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <div className="text-[12px] text-gray-500">
                        Available Days
                      </div>
                      <div className="text-[12px] font-semibold text-blue-600">
                        {encashmentPreviewData.availableDays}
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <div className="text-[12px] text-gray-500">
                        Encashable Days
                      </div>
                      <div className="text-[12px] font-semibold text-green-600">
                        {encashmentPreviewData.encashableDays}
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <div className="text-[12px] text-gray-500">
                        Per Day Rate
                      </div>
                      <div className="text-[12px] font-semibold text-gray-900">
                        {formatCurrency(encashmentPreviewData.perDayRate)}
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Divider className="my-2" />
                      <div className="text-[12px] text-gray-500">
                        Encashable Status
                      </div>
                      <Chip
                        label={
                          encashmentPreviewData.encashable
                            ? "Encashable"
                            : "Not Encashable"
                        }
                        color={
                          encashmentPreviewData.encashable ? "success" : "error"
                        }
                        size="small"
                        className="mt-1"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Alert
                        severity={
                          encashmentPreviewData.encashable
                            ? "success"
                            : "warning"
                        }
                      >
                        Total Encashment Amount:{" "}
                        <strong>
                          {formatCurrency(encashmentPreviewData.amount)}
                        </strong>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="outlined"
            onClick={() => {
              setPreviewDialogOpen(false);
              setEncashmentPreviewData(null);
            }}
            className="!text-gray-800 !border-gray-200 "
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateEncashment}
            disabled={processing}
            className="!bg-primary "
          >
            {processing ? <CircularProgress size={24} /> : "Confirm & Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final Settlement Dialog */}
      <Dialog
        open={settlementDialogOpen}
        onClose={() => setSettlementDialogOpen(false)}
        maxWidth="lg"
        sx={dialogSx}
      >
        <DialogTitle className="border-b !p-2 border-gray-200">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] text-gray-800">Final Settlement</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box className="mt-4">
            <Alert severity="info" className="!mb-6">
              Processing final settlement for: <strong>{employeeName}</strong>
            </Alert>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Per Day Rate"
                  type="number"
                  value={settlementFormData.perDayRate}
                  onChange={(e) =>
                    setSettlementFormData({
                      ...settlementFormData,
                      perDayRate: parseFloat(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {/* <TextField
                  fullWidth
                  label="Payroll Month"
                  type="month"
                  value={settlementFormData.payrollMonth}
                  onChange={(e) => setSettlementFormData({ ... , payrollMonth: e.target.value })}
                /> */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Payroll Month"
                    views={["month", "year"]}
                    value={dayjs(encashmentFormData.payrollMonth)}
                    className="!text-[12px]"
                    onChange={(newValue) => {
                      if (newValue) {
                        setEncashmentFormData({
                          ...encashmentFormData,
                          payrollMonth: dayjs(newValue).format("YYYY-MM"),
                        });
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settlementFormData.lapseNonEncashable}
                      onChange={(e) =>
                        setSettlementFormData({
                          ...settlementFormData,
                          lapseNonEncashable: e.target.checked,
                        })
                      }
                      color="primary"
                    />
                  }
                  label="Lapse Non-Encashable"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={settlementFormData.notes}
                  onChange={(e) =>
                    setSettlementFormData({
                      ...settlementFormData,
                      notes: e.target.value,
                    })
                  }
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {settlementData && renderSettlementSummary(settlementData)}
          </Box>
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setSettlementDialogOpen(false)}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={handleSettlementPreview}
            disabled={processing}
            className="!text-primary !border-primary"
            startIcon={<Preview />}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessSettlement}
            disabled={processing}
            className="!bg-primary "
          >
            {processing ? <CircularProgress size={24} /> : "Process Settlement"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Settlement Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        sx={dialogSx}
      >
        <DialogTitle className="border-b border-gray-200 !p-4">
          Confirm Final Settlement
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" className="my-3">
            This action is irreversible. It will process the final settlement
            for:
          </Alert>
          <div className="space-y-2 text-[12px]">
            <p>
              <span className="text-gray-600 font-bold">Employee:</span>{" "}
              {employeeName}
            </p>
            <p>
              <span className="text-gray-600 font-bold">Payroll Month:</span>{" "}
              {settlementFormData.payrollMonth}
            </p>
            <p>
              <span className="text-gray-600 font-bold">Per Day Rate:</span>{" "}
              {formatCurrency(settlementFormData.perDayRate)}
            </p>
            <p>
              <span className="text-gray-600 font-bold">
                Lapse Non-Encashable:
              </span>{" "}
              {settlementFormData.lapseNonEncashable ? "Yes" : "No"}
            </p>
          </div>
          <Alert severity="info" className="mt-3">
            Please ensure all leave encashments have been processed before
            proceeding.
          </Alert>
        </DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button
            variant="outlined"
            onClick={() => setConfirmDialogOpen(false)}
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleProcessSettlement}
            disabled={processing}
            className=""
          >
            {processing ? <CircularProgress size={24} /> : "Confirm & Process"}
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}
