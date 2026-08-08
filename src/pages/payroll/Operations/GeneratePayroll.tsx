import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Chip,
    IconButton,
    Stack,
    Stepper,
    Step,
    StepLabel,
    useTheme,
    alpha,
    Grid,
    Checkbox,
    Alert,
    AlertTitle,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import {
    CalendarToday as CalendarIcon,
    People as UsersIcon,
    AttachMoney as DollarSignIcon,
    RemoveCircle as MinusCircleIcon,
    Visibility as EyeIcon,
    CheckCircle as CheckCircleIcon,
    PlayArrow as PlayIcon,
    ArrowBack as ArrowLeftIcon,
    ArrowForward as ArrowRightIcon,
    Check as CheckIcon,
    Warning as AlertCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from "@mui/icons-material";
import {
    formatCurrency,
    type EmployeeEarnings,
    type PreviewData,
} from "../const";
import { useUI } from "../../../context/Snackbar";
import {
    periodsService,
    type Period,
} from "../../../services/modules/payrollServices/period";
import { employeeService } from "../../../services/modules/employees";
import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getRowColor } from "../../const";

const STEPS = [
    { id: 1, label: "Select Period", icon: CalendarIcon },
    { id: 2, label: "Employee Selection", icon: UsersIcon },
    { id: 3, label: "Earnings & Allowances", icon: DollarSignIcon },
    { id: 4, label: "Deductions & Taxes", icon: MinusCircleIcon },
    { id: 5, label: "Review Payroll", icon: EyeIcon },
    { id: 6, label: "Process Payroll", icon: PlayIcon },
];

export default function GeneratePayroll() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();

    const [step, setStep] = useState<number>(1);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("all");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(false);
    const [payrollRunId, setPayrollRunId] = useState<string>("");

    // State for API data
    const [payrollPeriods, setPayrollPeriods] = useState<Period[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [periodDetails, setPeriodDetails] = useState<Period | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [failedEmployees, setFailedEmployees] = useState<any[]>([]);

    // Fetch periods on mount
    useEffect(() => {
        fetchPeriods();
        fetchEmployees();
    }, []);

    const fetchPeriods = async () => {
        try {
            const res: any = await periodsService.getPeriods();
            setPayrollPeriods(res.data.items || []);
        } catch (error) {
            console.error("Error fetching periods:", error);
            showSnackbar("Failed to load payroll periods", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res: any = await employeeService.getEmployees({
                includeInactive: false,
                size: 1000
            });
            setEmployees(res.data?.content || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            showSnackbar("Failed to load employees", "error");
        }
    };

    const fetchPeriodDetails = async (periodId: string) => {
        try {
            const res: any = await periodsService.getPeriodById(periodId);
            setPeriodDetails(res.data);
        } catch (error) {
            console.error("Error fetching period details:", error);
            showSnackbar("Failed to load period details", "error");
        }
    };

    const fetchPreview = async () => {
        if (!selectedPeriodId || selectedEmployees.length === 0) return;

        showSpinner();
        try {
            const period = payrollPeriods.find(
                (p: Period) => p.id === selectedPeriodId,
            );
            const res: any = await payrollRunsService.previewPayrollRun({
                periodYear: new Date().getFullYear(),
                periodMonth: new Date().getMonth() + 1,
                workingDays: period?.workingDays || 22,
                employeeIds: selectedEmployees,
            });
            setPreviewData(res.data);

            // Track failed employees
            const failed = res.data?.items?.filter((item: any) => item.status === "FAILED") || [];
            setFailedEmployees(failed);

            if (failed.length > 0) {
                showSnackbar(
                    `${failed.length} employee(s) have no active salary assignment. They will be skipped.`,
                    "warning"
                );
            }
        } catch (error) {
            console.error("Error fetching preview:", error);
            showSnackbar("Failed to load payroll preview", "error");
        } finally {
            hideSpinner();
        }
    };

    // Fetch preview when moving to step 3, 4, or 5
    useEffect(() => {
        if (
            (step === 3 || step === 4 || step === 5) &&
            selectedEmployees.length > 0 &&
            selectedPeriodId
        ) {
            fetchPreview();
        }
    }, [step, selectedEmployees, selectedPeriodId]);

    // Handle period selection
    const handlePeriodChange = (periodId: string) => {
        setSelectedPeriodId(periodId);
        if (periodId) {
            fetchPeriodDetails(periodId);
        }
    };

    // Get departments from employees
    const departments = [
        "all",
        ...Array.from(new Set(employees.map((e: any) => e.department))),
    ];
    const filteredEmployees =
        selectedDept === "all"
            ? employees
            : employees.filter((e: any) => e.department === selectedDept);

    // Calculate employee earnings from preview data
    const employeeEarnings =
        previewData?.items?.length > 0
            ? previewData.items.map((item: any) => ({
                ...item,
                id: item.employeeId,
                name: item.employeeName,
                code: item.employeeCode,
                basic: item.basic || 0,
                hra: item.hra || 0,
                conv: item.conveyance || 0,
                special: item.special || 0,
                gross: item.gross || 0,
                loanAdvance: item.loanAdvance || 0,
                status: item.status || "PENDING",
                errorMessage: item.errorMessage || "",
            }))
            : filteredEmployees.map((e: any) => {
                const annualCtc = e.annualCtc || 0;
                const basic = Math.round((annualCtc * 0.4) / 12);
                const hra = Math.round(basic * 0.5);
                const conv = 1600;
                const special = Math.round(annualCtc / 12) - basic - hra - conv;
                const gross = basic + hra + conv + Math.max(0, special);
                return {
                    ...e,
                    basic,
                    hra,
                    conv,
                    special: Math.max(0, special),
                    gross,
                    loanAdvance: 0,
                    status: "PENDING",
                    errorMessage: "",
                };
            });

    const toggleEmployee = (id: string) => {
        setSelectedEmployees((prev: string[]) =>
            prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id],
        );
    };

    const toggleAll = () => {
        if (selectedEmployees.length === filteredEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(filteredEmployees.map((e: any) => e.id));
        }
    };

    const selectedEarnings = employeeEarnings.filter((e: any) =>
        selectedEmployees.includes(e.id),
    );

    // Filter out failed employees from calculations
    const successfulEarnings = selectedEarnings.filter((e: any) => e.status !== "FAILED");
    const failedSelected = selectedEarnings.filter((e: any) => e.status === "FAILED");

    const totalGross = successfulEarnings.reduce(
        (s: number, e: any) => s + (e.gross || 0),
        0,
    );
    const totalPF = successfulEarnings.reduce(
        (s: number, e: any) => s + Math.round((e.basic || 0) * 0.12),
        0,
    );
    const totalPT = successfulEarnings.length * 0;
    const totalDeductions = previewData?.totalDeductions || totalPF + totalPT;
    const totalNet = previewData?.totalNetPay || totalGross - totalDeductions;

    const handleProcess = async () => {
        // Check if there are failed employees
        if (failedSelected.length > 0) {
            const confirmProcess = window.confirm(
                `${failedSelected.length} employee(s) have no active salary assignment and will be skipped.\n\nDo you want to continue processing ${successfulEarnings.length} employee(s)?`
            );
            if (!confirmProcess) return;
        }

        setProcessing(true);
        try {
            const period = payrollPeriods.find(
                (p: Period) => p.id === selectedPeriodId,
            );
            const payload: any = {
                periodYear: new Date().getFullYear(),
                periodMonth: new Date().getMonth() + 1,
                paymentDate:
                    period?.paymentDate || new Date().toISOString().split("T")[0],
                workingDays: period?.workingDays || 22,
                employeeIds: selectedEmployees,
                // notifyEmail: true,
            };

            const res: any = await payrollRunsService.createPayrollRun(payload);
            setPayrollRunId(res.data.id);
            setDone(true);

            if (failedSelected.length > 0) {
                showSnackbar(
                    `Payroll processed! ${successfulEarnings.length} employees processed, ${failedSelected.length} skipped.`,
                    "warning"
                );
            } else {
                showSnackbar("Payroll processed successfully!", "success");
            }
        } catch (error: any) {
            console.error("Error processing payroll:", error);
            showSnackbar(error?.message || "Failed to process payroll", "error");
            setProcessing(false);
        } finally {
            setProcessing(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return !!selectedPeriodId;
            case 2:
                return selectedEmployees.length > 0;
            default:
                return true;
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="bg-white-50">
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <IconButton
                    onClick={() => navigate("/payroll/runs")}
                    sx={{
                        border: `1px solid var(--border-color)`,
                        borderRadius: 1,
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                >
                    <ArrowLeftIcon fontSize="small" className="text-gray-500" />
                </IconButton>
                <Box>
                    <div className="text-gray-800 text-[12px] font-bold">
                        Generate Payroll
                    </div>
                    <div className="text-gray-500 text-[12px] mt-0.5">
                        Follow the 6-step wizard to process payroll
                    </div>
                </Box>
            </Box>

            {/* Failed Employees Alert - Show on steps 3, 4, 5 */}


            <div className="bg-white border border-gray-200 p-3 pt-5 rounded-md">
                {/* Stepper */}
                <Box sx={{ mb: 2 }}>
                    <Stepper activeStep={step - 1} alternativeLabel>
                        {STEPS.map((s) => (
                            <Step key={s.id}>
                                <StepLabel
                                    icon={
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor:
                                                    step > s.id
                                                        ? "green"
                                                        : step === s.id
                                                            ? "var(--color-primary)/50"
                                                            : theme.palette.grey[100],
                                                border: `2px solid ${step > s.id
                                                        ? "green"
                                                        : step === s.id
                                                            ? "var(--color-primary)"
                                                            : theme.palette.grey[300]
                                                    }`,
                                                color:
                                                    step > s.id
                                                        ? "#fff"
                                                        : step === s.id
                                                            ? "var(--color-primary)"
                                                            : theme.palette.text.secondary,
                                            }}
                                        >
                                            {step > s.id ? (
                                                <CheckIcon fontSize="small" className="text-white" />
                                            ) : (
                                                <s.icon fontSize="small" />
                                            )}
                                        </Box>
                                    }
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: step === s.id ? 600 : 400,
                                            color:
                                                step === s.id
                                                    ? "var(--color-primary)"
                                                    : "var(--text-primary)",
                                        }}
                                    >
                                        {s.label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Step Content */}
                <Card className="bg-white-50 rounded-sm">
                    <CardContent sx={{ p: 2 }}>
                        {/* Step 1: Select Period */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <Box className="mb-8">
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Select Payroll Period
                                    </div>
                                    <div className="text-[12px] text-gray-500 mt-1">
                                        Choose the period for which payroll should be generated
                                    </div>
                                </Box>
                                <Grid container spacing={3} sx={{ maxWidth: 600 }}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Payroll Period *</InputLabel>
                                            <Select
                                                value={selectedPeriodId}
                                                onChange={(e) => handlePeriodChange(e.target.value)}
                                                label="Payroll Period"
                                                required
                                            >
                                                {payrollPeriods.map((p: Period) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.name || `${p.periodMonth}/${p.periodYear}`}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="Payment Date"
                                                value={
                                                    periodDetails?.paymentDate
                                                        ? dayjs(periodDetails.paymentDate)
                                                        : null
                                                }
                                                onChange={(newValue) => {
                                                    setPeriodDetails({
                                                        ...periodDetails!,
                                                        paymentDate: newValue
                                                            ? dayjs(newValue).format("YYYY-MM-DD")
                                                            : "",
                                                    });
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: "outlined",
                                                    },
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                </Grid>
                                {periodDetails && (
                                    <div className="p-3 rounded-md border border-green-700 max-w-[600px] bg-green-100 dark:bg-green-800/50">
                                        <div className="text-[12px] font-bold text-gray-800 mb-4">
                                            Period Details
                                        </div>
                                        <Grid container spacing={1}>
                                            {[
                                                ["Start Date", periodDetails.startDate],
                                                ["End Date", periodDetails.endDate],
                                                ["Working Days", periodDetails.workingDays],
                                                ["Payment Date", periodDetails.paymentDate],
                                            ].map(([k, v]) => (
                                                <Grid size={{ xs: 12 }} key={k}>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                        }}
                                                    >
                                                        <div className="text-gray-500 text-[12px]">{k}</div>
                                                        <div className="text-[12px] text-gray-800 font-bold">
                                                            {v}
                                                        </div>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Employee Selection */}
                        {step === 2 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                    }}
                                >
                                    <Box>
                                        <div className="text-[12px] text-gray-800 font-bold">
                                            Employee Selection
                                        </div>
                                        <div className="text-[12px] text-gray-500 mt-1">
                                            Select employees to include in this payroll run
                                        </div>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                        <Chip
                                            label={`${selectedEmployees.length} selected`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                                value={selectedDept}
                                                onChange={(e) => setSelectedDept(e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="all">All Departments</MenuItem>
                                                {departments
                                                    .filter((d: string) => d !== "all")
                                                    .map((d: string) => (
                                                        <MenuItem key={d} value={d}>
                                                            {d}
                                                        </MenuItem>
                                                    ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>

                                <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-435px)] overflow-auto">
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={
                                                            selectedEmployees.length ===
                                                            filteredEmployees.length &&
                                                            filteredEmployees.length > 0
                                                        }
                                                        indeterminate={
                                                            selectedEmployees.length > 0 &&
                                                            selectedEmployees.length <
                                                            filteredEmployees.length
                                                        }
                                                        onChange={toggleAll}
                                                        className="!p-1"
                                                    />
                                                </TableCell>
                                                <TableCell className="!font-bold">#</TableCell>
                                                <TableCell className="!font-bold">Employee</TableCell>
                                                <TableCell className="!font-bold">Department</TableCell>
                                                <TableCell className="!font-bold">Designation</TableCell>
                                                <TableCell className="!font-bold" align="right">CTC (Annual)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredEmployees.map((emp: any, i) => (
                                                <TableRow
                                                    key={emp.id}
                                                    sx={getRowColor(i)}
                                                    onClick={() => toggleEmployee(emp.id)}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={selectedEmployees.includes(emp.id)}
                                                            onChange={() => toggleEmployee(emp.id)}
                                                            className="!p-1 !border !border-gray-200"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                {emp.name
                                                                    ?.split(" ")
                                                                    .map((n: string) => n[0])
                                                                    .join("")
                                                                    .slice(0, 2)}
                                                            </div>
                                                            <Box>
                                                                <div className="text-[12px] text-gray-800">
                                                                    {emp.name}
                                                                    <span className="text-gray-500 ml-2 text-[10px]">
                                                                        ({emp.employeeId})
                                                                    </span>
                                                                </div>
                                                            </Box>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {emp.department}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {emp.designation}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {formatCurrency(emp.annualCtc || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Step 3: Earnings */}
                        {step === 3 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] text-gray-800 font-bold">
                                            Earnings & Allowances
                                        </div>
                                        <div className="text-[12px] mt-1 text-gray-500">
                                            Review and confirm salary components for selected employees
                                        </div>
                                    </div>
                                    {failedSelected.length > 0 && (
                                        <Chip
                                            icon={<ErrorIcon />}
                                            label={`${failedSelected.length} employee(s) have no salary assignment`}
                                            color="error"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                </Box>

                                <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-435px)] overflow-auto">
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="!font-bold">#</TableCell>
                                                <TableCell className="!font-bold">Employee</TableCell>
                                                <TableCell align="right" className="!font-bold">Basic</TableCell>
                                                <TableCell align="right" className="!font-bold">HRA</TableCell>
                                                <TableCell align="right" className="!font-bold">Conveyance</TableCell>
                                                <TableCell align="right" className="!font-bold">Special</TableCell>
                                                <TableCell align="right" className="!font-bold">Gross</TableCell>
                                                <TableCell className="!font-bold">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedEarnings.map((e: any, i: any) => (
                                                <TableRow
                                                    key={e.id}
                                                    sx={{
                                                        ...getRowColor(i),
                                                        bgcolor: e.status === "FAILED"
                                                            ? alpha(theme.palette.error.main, 0.08)
                                                            : getRowColor(i),
                                                    }}
                                                >
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {e.name}
                                                        </Typography>
                                                        <div className="text-primary text-[10px]">
                                                            {e.code || e.id}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {e.status === "FAILED" ? "—" : formatCurrency(e.basic || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {e.status === "FAILED" ? "—" : formatCurrency(e.hra || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {e.status === "FAILED" ? "—" : formatCurrency(e.conv || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {e.status === "FAILED" ? "—" : formatCurrency(e.special || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: e.status === "FAILED" ? "error.main" : "success.main"
                                                            }}
                                                        >
                                                            {e.status === "FAILED" ? "—" : formatCurrency(e.gross || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {e.status === "FAILED" ? (
                                                            <Tooltip title={e.errorMessage || "No active salary assignment"}>
                                                                <Chip
                                                                    label="Failed"
                                                                    size="small"
                                                                    color="error"
                                                                    icon={<ErrorIcon />}
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Chip
                                                                label="Ready"
                                                                size="small"
                                                                color="success"
                                                                icon={<CheckCircleIcon />}
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-head !sticky z-40 bottom-0">
                                                <TableCell colSpan={2}>
                                                    <Typography variant="body2" className="!py-2" sx={{ fontWeight: 600 }}>
                                                        Total
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEarnings.reduce(
                                                                (s: number, e: any) => s + (e.basic || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEarnings.reduce(
                                                                (s: number, e: any) => s + (e.hra || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEarnings.reduce(
                                                                (s: number, e: any) => s + (e.conv || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEarnings.reduce(
                                                                (s: number, e: any) => s + (e.special || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 700, color: "success.main" }}
                                                    >
                                                        {formatCurrency(totalGross)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Step 4: Deductions */}
                        {step === 4 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Deductions & Taxes
                                    </div>
                                    <Typography variant="body2" className="text-gray-500 !mt-1">
                                        Review statutory and other deductions
                                    </Typography>
                                </Box>

                                <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-435px)] overflow-auto">
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="!font-bold">#</TableCell>
                                                <TableCell className="!font-bold">Employee</TableCell>
                                                <TableCell align="right" className="!font-bold">PF (12%)</TableCell>
                                                <TableCell align="right" className="!font-bold">Prof. Tax</TableCell>
                                                <TableCell align="right" className="!font-bold">Loan/Advance</TableCell>
                                                <TableCell align="right" className="!font-bold">Total Deductions</TableCell>
                                                <TableCell align="right" className="!font-bold">Net Pay</TableCell>
                                                <TableCell className="!font-bold">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedEarnings.map((e: any, i: any) => {
                                                const pf = e.status === "FAILED" ? 0 : Math.round((e.basic || 0) * 0.12);
                                                const pt = 0;
                                                const loan = e.status === "FAILED" ? 0 : (e.loanAdvance || 0);
                                                const deductions = pf + pt + loan;
                                                const net = (e.gross || 0) - deductions;
                                                return (
                                                    <TableRow
                                                        key={e.id}
                                                        sx={{
                                                            ...getRowColor(i),
                                                            bgcolor: e.status === "FAILED"
                                                                ? alpha(theme.palette.error.main, 0.08)
                                                                : getRowColor(i),
                                                        }}
                                                    >
                                                        <TableCell>{i + 1}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {e.name}
                                                            </Typography>
                                                            <div className="text-primary text-[10px]">
                                                                {e.code || e.id}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2">
                                                                {e.status === "FAILED" ? "—" : formatCurrency(pf)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2">
                                                                {e.status === "FAILED" ? "—" : formatCurrency(pt)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2">
                                                                {e.status === "FAILED" ? "—" : (loan > 0 ? formatCurrency(loan) : "—")}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: e.status === "FAILED" ? "text.secondary" : "error.main"
                                                                }}
                                                            >
                                                                {e.status === "FAILED" ? "—" : formatCurrency(deductions)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: e.status === "FAILED" ? "text.secondary" : "success.main"
                                                                }}
                                                            >
                                                                {e.status === "FAILED" ? "—" : formatCurrency(net)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {e.status === "FAILED" ? (
                                                                <Tooltip title={e.errorMessage || "No active salary assignment"}>
                                                                    <Chip
                                                                        label="Failed"
                                                                        size="small"
                                                                        color="error"
                                                                        icon={<ErrorIcon />}
                                                                    />
                                                                </Tooltip>
                                                            ) : (
                                                                <Chip
                                                                    label="Ready"
                                                                    size="small"
                                                                    color="success"
                                                                    icon={<CheckCircleIcon />}
                                                                />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Step 5: Review */}
                        {step === 5 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Review Payroll
                                    </div>
                                    <Typography variant="body2" className="text-gray-500 mt-1">
                                        Verify all details before processing
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    {[
                                        {
                                            label: "Total Selected",
                                            value: selectedEmployees.length.toString(),
                                            color: theme.palette.primary.main,
                                        },
                                        {
                                            label: "Ready to Process",
                                            value: successfulEarnings.length.toString(),
                                            color: theme.palette.success.main,
                                        },
                                        {
                                            label: "Failed/Skipped",
                                            value: failedSelected.length.toString(),
                                            color: theme.palette.error.main,
                                        },
                                        {
                                            label: "Total Gross",
                                            value: formatCurrency(totalGross),
                                            color: theme.palette.success.main,
                                        },
                                        {
                                            label: "Total Deductions",
                                            value: formatCurrency(totalDeductions),
                                            color: theme.palette.error.main,
                                        },
                                        {
                                            label: "Net Payable",
                                            value: formatCurrency(totalNet),
                                            color: theme.palette.primary.main,
                                        },
                                    ].map((s) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.label}>
                                            <Box
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 1,
                                                    textAlign: "center",
                                                    bgcolor: alpha(s.color, 0.08),
                                                    border: `1px solid ${alpha(s.color, 0.2)}`,
                                                }}
                                            >
                                                <Typography variant="caption" className="text-gray-700 !font-bold">
                                                    {s.label}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: s.color }}>
                                                    {s.value}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* {failedSelected.length > 0 && (
                                    <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                                        <AlertTitle sx={{ fontWeight: 600 }}>
                                            {failedSelected.length} employee(s) will be skipped
                                        </AlertTitle>
                                        <Box sx={{ mt: 1, maxHeight: 80, overflow: "auto" }}>
                                            {failedSelected.map((emp: any) => (
                                                <div key={emp.id} className="text-[12px]">
                                                    • {emp.name} ({emp.code}) - {emp.errorMessage || "No active salary assignment"}
                                                </div>
                                            ))}
                                        </Box>
                                    </Alert>
                                )} */}

                                <Alert severity="warning" icon={<AlertCircleIcon />} sx={{ mt: 2 }}>
                                    <AlertTitle sx={{ fontWeight: 600 }}>
                                        Ready to Process
                                    </AlertTitle>
                                    Payroll will be processed for{" "}
                                    <strong>{successfulEarnings.length}</strong> employees.
                                    {failedSelected.length > 0 && (
                                        <> <strong>{failedSelected.length}</strong> employee(s) will be skipped.</>
                                    )}
                                    This action cannot be undone once approved. Ensure all data is
                                    correct before proceeding.
                                </Alert>
                            </Box>
                        )}

                        {/* Step 6: Process */}
                        {step === 6 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] text-gray-800 font-bold">
                                        Process Payroll
                                    </div>
                                    <Typography variant="body2" className="text-gray-500">
                                        Confirm and initiate payroll generation
                                    </Typography>
                                    </div>
                                    {failedSelected.length > 0 && (
                                        <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
                                            <Typography variant="body2">
                                                <strong>{failedSelected.length}</strong> employee(s) without salary assignments will be skipped.
                                                {successfulEarnings.length > 0 && (
                                                    <> <strong>{successfulEarnings.length}</strong> employee(s) will be processed.</>
                                                )}
                                            </Typography>
                                        </Alert>
                                    )}
                                </Box>

                                {!done ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            py: 4,
                                            gap: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: "50%",
                                                border: `4px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                                bgcolor: alpha(theme.palette.success.main, 0.05),
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <PlayIcon
                                                sx={{ fontSize: 40, color: theme.palette.success.main }}
                                            />
                                        </Box>
                                        <Box sx={{ textAlign: "center" }}>
                                            <div className="text-[12px] text-gray-800 font-bold">
                                                Ready to Process Payroll
                                            </div>
                                            <Typography variant="body2" className="text-gray-500 !mt-1">
                                                {successfulEarnings.length} employees • Net Payable:{" "}
                                                {formatCurrency(totalNet)}
                                            </Typography>
                                            {failedSelected.length > 0 && (
                                                <Typography variant="caption" className="text-gray-500 !mt-1 block">
                                                    ⚠️ {failedSelected.length} employee(s) will be skipped
                                                </Typography>
                                            )}
                                        </Box>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            color="success"
                                            startIcon={
                                                processing ? (
                                                    <CircularProgress size={20} color="inherit" />
                                                ) : (
                                                    <PlayIcon />
                                                )
                                            }
                                            onClick={handleProcess}
                                            disabled={processing || successfulEarnings.length === 0}
                                            sx={{ px: 4, textTransform: "none" }}
                                        >
                                            {processing ? "Processing..." : "Process Payroll"}
                                        </Button>
                                        {successfulEarnings.length === 0 && (
                                            <Typography variant="caption" color="error">
                                                No eligible employees to process. Please assign salary structures.
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            py: 4,
                                            gap: 3,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: "50%",
                                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <CheckCircleIcon
                                                sx={{ fontSize: 40, color: "success.main" }}
                                            />
                                        </Box>
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography
                                                variant="h5"
                                                sx={{ fontWeight: 700, color: "success.main" }}
                                            >
                                                Payroll Processed Successfully!
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary", mt: 0.5 }}
                                            >
                                                {successfulEarnings.length} payslips have been generated.
                                                {failedSelected.length > 0 && (
                                                    <> {failedSelected.length} employee(s) were skipped.</>
                                                )}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={2}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => navigate("/payroll/runs")}
                                                sx={{ textTransform: "none" }}
                                            >
                                                View Payroll Runs
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={() => navigate("/payroll/payslips")}
                                                sx={{ textTransform: "none" }}
                                            >
                                                View Payslips
                                            </Button>
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Navigation */}
            {!done && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setStep((s: number) => Math.max(1, s - 1))}
                        disabled={step === 1}
                        startIcon={<ArrowLeftIcon />}
                        sx={{ textTransform: "none" }}
                        className="!text-primary !border-primary"
                    >
                        Previous
                    </Button>
                    {failedSelected.length > 0 && (step === 3 || step === 4 || step === 5) && (
                        <Alert severity="error" icon={<ErrorIcon />} className="!p-0 !px-4">
                            <Typography variant="body2" >
                                These employees will be <strong>skipped</strong> during processing.
                                Please assign salary structures to them first if they should be included.
                            </Typography>
                        </Alert>
                    )}
                    {step < 6 ? (
                        <Button
                            variant="contained"
                            onClick={() => setStep((s: number) => Math.min(6, s + 1))}
                            endIcon={<ArrowRightIcon />}
                            disabled={!isStepValid()}
                            className="!bg-primary"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleProcess}
                            disabled={processing || done || successfulEarnings.length === 0}
                            className="!bg-primary"
                            startIcon={
                                processing ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <PlayIcon />
                                )
                            }
                            sx={{ textTransform: "none" }}
                        >
                            {processing ? "Processing..." : "Process Payroll"}
                        </Button>
                    )}
                </Box>
            )}
        </div>
    );
}