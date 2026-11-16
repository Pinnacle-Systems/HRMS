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
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  // Search,
  Refresh,
  Lock,
  LockOpen,
  Add,
  Preview,
  CheckCircle,
  LockOutlined,
  AttachMoneyOutlined,
  CalendarToday,
  TrendingUp,
  TrendingDown,
  Info,
  Person,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
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
import type { EmployeeSummaryResponse } from "../../../services/modules/employees";
import { useAuth } from "../../../auth/authContext";
import { formatCurrency } from "../../payroll/const";
import { dialogsx } from "../../../const";
import { getRowColor } from "../../const";

/* -------------------------------------------------------------------------- */
/*                              Helper Components                             */
/* -------------------------------------------------------------------------- */

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Box className="mb-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[12px] font-bold text-gray-900">{title}</div>
          {subtitle && (
            <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </Box>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "red" | "purple";
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    red: "bg-red-50 border-red-100",
    purple: "bg-purple-50 border-purple-100",
  };
  return (
    <Paper
      elevation={0}
      className={`!border ${toneMap[tone]} !rounded-xl !p-3 !bg-white flex items-center justify-between`}
    >
      <div>
        <div className="text-[11px] text-gray-500 font-medium">{label}</div>
        <div className="text-[20px] font-bold text-gray-900 mt-0.5">{value}</div>
      </div>
      <div className="p-2 bg-white/70 rounded-full">{icon}</div>
    </Paper>
  );
}

/**
 * Centered empty-state row content (replaces DataState).
 */
function EmptyCell({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-6 bg-white w-full text-center text-[12px] text-gray-500">
      {message}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

export default function HrPayrollInputsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const { session } = useAuth();
  const isHR = session?.user?.roles?.includes("HR");

  const [inputs, setInputs] = useState<PayrollLeaveInput[]>([]);
  const [summary, setSummary] = useState<PayrollLeaveSummary | null>(null);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Filters
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(dayjs().format("YYYY-MM"));
  const [fromDate, setFromDate] = useState(
    dayjs(`${dayjs().format("YYYY-MM")}-01`).startOf("month"),
  );
  const [toDate, setToDate] = useState(
    dayjs(`${dayjs().format("YYYY-MM")}-01`).endOf("month"),
  );
  const [branchId, _setBranchId] = useState<string>("");
  const [departmentId, _setDepartmentId] = useState<string>("");

  // Dialogs / status
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Encashment
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

  // Settlement
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

  /* ------------------------------- Loaders ------------------------------- */

  useEffect(() => {
    leaveService
      .getLeaveTypes()
      .then((res: any) => {
        const data =
          res.data?.data?.content ?? res.data?.content ?? res.data ?? [];
        setLeaveTypes(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const monthStart = dayjs(`${payrollMonth}-01`).startOf("month");
    const monthEnd = dayjs(`${payrollMonth}-01`).endOf("month");
    setFromDate(monthStart);
    setToDate(monthEnd);
  }, [payrollMonth]);

  const loadPayrollInputs = async () => {
    showSpinner();
    try {
      const response: any = await leaveService.getPayrollLeaveInputs({
        payrollMonth,
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
      hideSpinner();
    }
  };

  const loadSummary = async () => {
    if (!employeeId) {
      setSummary(null);
      return;
    }
    try {
      const response: any = await leaveService.getPayrollLeaveSummary({
        employeeId,
        from: fromDate.format("YYYY-MM-DD"),
        to: toDate.format("YYYY-MM-DD"),
      });
      setSummary(response.data ?? null);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load summary", "error");
      setSummary(null);
    }
  };

  const loadEncashments = async () => {
    if (!employeeId) return;
    try {
      const response: any = await leaveService.getLeaveEncashments({
        employeeId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollMonth, branchId, departmentId]);

  useEffect(() => {
    if (employeeId) {
      loadSummary();
      loadEncashments();
    } else {
      setSummary(null);
      setEncashments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, payrollMonth]);

  /* ------------------------------ Handlers ------------------------------- */

  const handleEmployeeChange = (
    id: string | null,
    employee?: EmployeeSummaryResponse | null,
  ) => {
    setEmployeeId(id);
    setEmployeeName(employee?.name || "");
    if (!id) {
      setSummary(null);
      setEncashments([]);
    }
  };

  const handleSearch = () => {
    loadPayrollInputs();
    if (employeeId) {
      loadSummary();
      loadEncashments();
    }
  };

  const handleResetFilters = () => {
    setEmployeeId(null);
    setEmployeeName(null);
    setPayrollMonth(dayjs().format("YYYY-MM"));
  };

  const handleGenerate = async () => {
    setProcessing(true);
    try {
      const payload: GeneratePayload = { payrollMonth };
      const response: any = await leaveService.generateLeaveInputs(payload);
      if (response.success) {
        showSnackbar("Leave inputs generated successfully",'success');
        await loadPayrollInputs();
        setGenerateDialogOpen(false);
      } else {
        showSnackbar(response.message || "Failed to generate leave inputs",'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to generate leave inputs",'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleLock = async (lock: boolean) => {
    setProcessing(true);
    try {
      const payload: LockUnlockPayload = { payrollMonth };
      const response: any = lock
        ? await leaveService.lockLeaveInputs(payload)
        : await leaveService.unlockLeaveInputs(payload);
      if (response.success) {
        showSnackbar(
          `Leave inputs ${lock ? "locked" : "unlocked"} successfully`, 'success'
        );
        await loadPayrollInputs();
        setLockDialogOpen(false);
      } else {
        showSnackbar(
          response.message ||
            `Failed to ${lock ? "lock" : "unlock"} leave inputs`,'error'
        );
      }
    } catch (err: any) {
      showSnackbar(
        err?.message || `Failed to ${lock ? "lock" : "unlock"} leave inputs`,'error'
      );
    } finally {
      setProcessing(false);
    }
  };

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
        employeeId,
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
        employeeId,
      });
      if (response.success) {
        showSnackbar("Leave encashment created successfully",'success');
        setEncashmentDialogOpen(false);
        setPreviewDialogOpen(false);
        await loadEncashments();
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
        showSnackbar(response.message || "Failed to create encashment",'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to create encashment",'error');
    } finally {
      setProcessing(false);
    }
  };

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
        showSnackbar("Final settlement processed successfully",'success');
        setSettlementDialogOpen(false);
        setConfirmDialogOpen(false);
        setSettlementData(response.data);
      } else {
        showSnackbar(response.message || "Failed to process settlement",'error');
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to process settlement",'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTypeClick = (type: any) => {
    setSelectedType(type);
    setDetailsDialogOpen(true);
  };

  /* ------------------------ Render: Settlement summary ------------------- */

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
              <TableCell className="!font-semibold text-center">Action</TableCell>
              <TableCell className="!font-semibold text-center">Days</TableCell>
              <TableCell className="!font-semibold text-center">Amount</TableCell>
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

  /* --------------------------------- Render ------------------------------ */

  return (
    <div>
      <PageHeader
        title="Payroll Inputs"
        subtitle="Leave-related payroll inputs, encashments & final settlements"
        actions={
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh className="!w-4" />}
              onClick={handleSearch}
              className="!text-gray-700 !border-gray-300"
            >
              Refresh
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Add className="!w-4" />}
              onClick={() => setGenerateDialogOpen(true)}
              disabled={processing}
              className="!bg-primary"
            >
              Generate
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Paper
        elevation={0}
        className="!border !border-gray-200 !rounded-sm !p-4 !mb-4 !bg-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="text-[13px] font-semibold text-gray-900">
              Filters
            </span>
          </div>
          <Chip
            label={`Month: ${dayjs(payrollMonth).format("MMM YYYY")}`}
            size="small"
            className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <EmployeeAsyncCombobox
              value={employeeId}
              onChange={(id, emp) => handleEmployeeChange(id, emp)}
              filters={{
                assignedHrId: isHR ? session?.user.employeeId : "",
              }}
            />
          </div>

           <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Payroll Month
            </label>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="en-gb"
            >
              <DatePicker
                format="MM/YYYY"
                views={["month", "year"]}
                value={dayjs(payrollMonth)}
                onChange={(v) =>
                  v && setPayrollMonth(dayjs(v).format("YYYY-MM"))
                }
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              From Date{" "}
              <span className="text-gray-400 font-normal">(auto)</span>
            </label>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="en-gb"
            >
              <DatePicker
                format="DD/MM/YYYY"
                value={fromDate}
                disabled
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              To Date <span className="text-gray-400 font-normal">(auto)</span>
            </label>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="en-gb"
            >
              <DatePicker
                format="DD/MM/YYYY"
                value={toDate}
                disabled
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              className="!bg-primary !h-10"
            >
              Search
            </Button>
            <Tooltip title="Reset filters">
              <IconButton
                onClick={handleResetFilters}
                className="!border !border-gray-300 !rounded-lg !h-10 !w-10"
              >
                <Refresh fontSize="small" className="text-gray-500" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-medium text-gray-500 mr-1">
            Quick Actions:
          </span>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LockOutlined className="!w-4" />}
            onClick={() => setLockDialogOpen(true)}
            disabled={processing}
            className="!text-gray-700 !border-gray-300"
          >
            Lock / Unlock
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AttachMoneyOutlined className="!w-4" />}
            onClick={() => {
              if (!employeeId) {
                showSnackbar("Select an employee first", "warning");
                return;
              }
              setEncashmentDialogOpen(true);
            }}
            disabled={!employeeId}
            className="!text-gray-700 !border-gray-300"
          >
            Encashment
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<CheckCircle className="!w-4" />}
            onClick={() => {
              if (!employeeId) {
                showSnackbar("Select an employee first", "warning");
                return;
              }
              setSettlementDialogOpen(true);
            }}
            disabled={!employeeId}
          >
            Final Settlement
          </Button>

          {employeeName && (
            <Chip
              icon={<Person className="!w-4" />}
              label={employeeName}
              size="small"
              className="!bg-blue-50 !text-blue-700 !border-blue-200 !ml-auto"
              onDelete={() => handleEmployeeChange(null)}
            />
          )}
        </div>
      </Paper>

      {/* KPI cards */}
      {employeeId && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Leave Days"
            value={summary.totalLeaveDays ?? 0}
            icon={<CalendarToday className="!text-blue-500" />}
            tone="blue"
          />
          <StatCard
            label="Paid Leave Days"
            value={summary.paidLeaveDays ?? 0}
            icon={<TrendingUp className="!text-green-500" />}
            tone="green"
          />
          <StatCard
            label="LOP Days"
            value={summary.lopDays ?? 0}
            icon={<TrendingDown className="!text-red-500" />}
            tone="red"
          />
          <StatCard
            label="Leave Types"
            value={summary.byLeaveType?.length ?? 0}
            icon={<Info className="!text-purple-500" />}
            tone="purple"
          />
        </div>
      )}

      {/* Tabbed tables */}
      <Paper
        elevation={0}
        className="!border !border-gray-200 !rounded-md overflow-hidden"
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          className="!border-b !border-gray-200 !bg-gray-50 !min-h-[44px]"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab
            label={`Payroll Inputs (${inputs.length})`}
            className="!text-gray-800"
          />
          <Tab
            label={`Leave Breakdown (${summary?.byLeaveType?.length ?? 0})`}
            className="!text-gray-800"
          />
          <Tab
            label={`Encashments (${encashments.length})`}
            className="!text-gray-800"
          />
        </Tabs>

        {/* TAB 0 — Payroll inputs */}
        {activeTab === 0 && (
          <TableContainer className="overflow-auto">
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-[11px]">
                    Employee
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Code
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Month
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    LOP
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Paid
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Total
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Status
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Lock
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inputs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyCell message="No payroll leave inputs found." />
                    </TableCell>
                  </TableRow>
                ) : (
                  inputs.map((input, i) => (
                    <TableRow key={input.id} sx={getRowColor(i)}>
                      <TableCell>
                        <span className="font-medium text-gray-900 text-[12px]">
                          {input.employeeName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-gray-500">
                          {input.employeeCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-gray-700">
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* TAB 1 — Leave breakdown */}
        {activeTab === 1 && (
          <TableContainer className="overflow-auto">
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-[11px]">
                    Leave Type
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Code
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Days
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Status
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!employeeId ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyCell message="Select an employee to see leave breakdown." />
                    </TableCell>
                  </TableRow>
                ) : !summary || !summary.byLeaveType?.length ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyCell message="No leave breakdown available." />
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.byLeaveType.map((type: any, i: number) => (
                    <TableRow key={type.leaveTypeId || i} sx={getRowColor(i)}>
                      <TableCell>
                        <span className="text-[12px] font-medium text-gray-900">
                          {type.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
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
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleTypeClick(type)}
                          className="!text-[11px] !text-blue-700 !px-2 !py-0"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* TAB 2 — Encashments */}
        {activeTab === 2 && (
          <TableContainer className="overflow-auto">
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-[11px]">
                    Employee
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Leave Type
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Year
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Payroll Month
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-right">
                    Amount
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px] text-right">
                    Rate
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Notes
                  </TableCell>
                  <TableCell className="!font-semibold !text-[11px]">
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!employeeName ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyCell message="Select an employee to see encashments." />
                    </TableCell>
                  </TableRow>
                ) : encashments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyCell message="No encashment details found." />
                    </TableCell>
                  </TableRow>
                ) : (
                  encashments.map((e, i) => (
                    <TableRow key={e.id} sx={getRowColor(i)}>
                      <TableCell>
                        <span className="font-medium text-[12px] text-gray-900">
                          {e.employeeName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-gray-600">
                          {e.leaveTypeName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-gray-700">
                          {e.leaveYear}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.payrollMonth}
                          size="small"
                          className="!bg-blue-50 !text-blue-700 !border-blue-200 !font-semibold"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <span className="text-[12px] font-semibold text-gray-900">
                          {formatCurrency(e.amount)}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="text-[11px] text-gray-600">
                          {formatCurrency(e.perDayRate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-gray-600">
                          {e.notes || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.status}
                          size="small"
                          className="!bg-gray-50 !text-gray-700 !border-gray-200"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* =========================== DIALOGS =========================== */}

      {/* Leave Type Details */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={dialogsx}
      >
        <DialogTitle className="!pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
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
            className="!text-gray-600"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate */}
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

      {/* Lock / Unlock */}
      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle className="border-b border-gray-200">
          Lock / Unlock Payroll Inputs
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

      {/* Encashment form */}
      <Dialog
        open={encashmentDialogOpen}
        onClose={() => {
          setEncashmentDialogOpen(false);
          setEncashmentPreviewData(null);
        }}
        maxWidth="md"
        fullWidth
        sx={dialogsx}
      >
        <DialogTitle className="border-b !p-2 border-gray-200">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
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
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="en-gb"
                >
                  <DatePicker
                    label="Payroll Month"
                    format="MM/YYYY"
                    views={["month", "year"]}
                    value={dayjs(encashmentFormData.payrollMonth)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setEncashmentFormData({
                          ...encashmentFormData,
                          payrollMonth: dayjs(newValue).format("YYYY-MM"),
                        });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
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

      {/* Encashment preview */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setEncashmentPreviewData(null);
        }}
        maxWidth="md"
        fullWidth
        sx={dialogsx}
      >
        <DialogTitle className="border-b border-gray-200 !p-2">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
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
            className="!text-gray-800 !border-gray-200"
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateEncashment}
            disabled={processing}
            className="!bg-primary"
          >
            {processing ? <CircularProgress size={24} /> : "Confirm & Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final settlement form */}
      <Dialog
        open={settlementDialogOpen}
        onClose={() => setSettlementDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={dialogsx}
      >
        <DialogTitle className="border-b !p-2 border-gray-200">
          <div className="flex items-center gap-2 ml-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
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
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="en-gb"
                >
                  <DatePicker
                    label="Payroll Month"
                    format="MM/YYYY"
                    views={["month", "year"]}
                    value={dayjs(settlementFormData.payrollMonth)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setSettlementFormData({
                          ...settlementFormData,
                          payrollMonth: dayjs(newValue).format("YYYY-MM"),
                        });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
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
            className="!bg-primary"
          >
            {processing ? <CircularProgress size={24} /> : "Process Settlement"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm settlement */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        sx={dialogsx}
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
          >
            {processing ? <CircularProgress size={24} /> : "Confirm & Process"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}