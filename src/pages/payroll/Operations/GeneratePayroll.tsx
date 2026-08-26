import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
} from "@mui/material";
import {
    CalendarToday as CalendarIcon,
    People as UsersIcon,

    Visibility as EyeIcon,
    CheckCircle as CheckCircleIcon,
    PlayArrow as PlayIcon,
    ArrowBack as ArrowLeftIcon,
    ArrowForward as ArrowRightIcon,
    Check as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    AddCircle,
    ExpandMore as ExpandMoreIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import {
    formatCurrency,
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
    { id: 3, label: "Attendance & OT", icon: AccessTimeIcon },
    { id: 4, label: "Earnings & Bonuses", icon: TrendingUpIcon },
    { id: 5, label: "Deductions & Loans", icon: TrendingDownIcon },
    { id: 6, label: "Review Payroll", icon: EyeIcon },
    { id: 7, label: "Process Payroll", icon: PlayIcon },
];

export default function GeneratePayroll() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();

    // State Management
    const [step, setStep] = useState<number>(1);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
    const [selectedDept, setSelectedDept] = useState<string>("all");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(false);
    // const [payrollRunId, setPayrollRunId] = useState<string>("");

    // API Data States
    const [payrollPeriods, setPayrollPeriods] = useState<Period[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [periodDetails, setPeriodDetails] = useState<Period | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const [failedEmployees, setFailedEmployees] = useState<any[]>([]);

    // Fetch data on mount
    useEffect(() => {
        fetchPeriods();
        fetchEmployees();
    }, []);

    // Fetch preview when moving to relevant steps
    useEffect(() => {
        if (
            (step === 3 || step === 4 || step === 5 || step === 6 || step === 7) &&
            selectedEmployees.length > 0 &&
            selectedPeriodId
        ) {
            fetchPayrollPreview();
        }
    }, [step, selectedEmployees, selectedPeriodId]);

    // API Calls
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

    const fetchPayrollPreview = async () => {
        if (!selectedPeriodId || selectedEmployees.length === 0) return;

        showSpinner();
        try {
            const period = payrollPeriods.find(
                (p: Period) => p.id === selectedPeriodId,
            );

            const response: any = await payrollRunsService.previewPayrollRun({
                periodYear: new Date().getFullYear(),
                periodMonth: new Date().getMonth() + 1,
                workingDays: period?.workingDays || 0,
                employeeIds: selectedEmployees,
            });

            // Set the preview data from backend response
            setPreviewData(response.data);

            // Track failed employees (if any)
            const failed = response.data?.employees?.filter(
                (item: any) => item.status === "Failed"
            ) || [];
            // setFailedEmployees(failed);

            if (failed.length > 0) {
                showSnackbar(
                    `${failed.length} employee(s) have issues and will be skipped.`,
                    "warning"
                );
            }
        } catch (error) {
            console.error("Error fetching payroll preview:", error);
            showSnackbar("Failed to load payroll data", "error");
        } finally {
            hideSpinner();
        }
    };

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

    // Transform backend data for display
    const getEmployeePayrollData = () => {
        if (!previewData?.employees) return [];

        return previewData.employees.map((emp: any) => {
            return {
                id: emp.employeeId,
                name: emp.employeeName,
                code: emp.employeeCode,
                status: emp.status,
                // Attendance data
                present: emp.attendance?.present || 0,
                absent: emp.attendance?.absent || 0,
                leave: emp.attendance?.leave || 0,
                otHours: emp.attendance?.otHours || 0,
                lateArrivals: emp.attendance?.lateArrivals || 0,
                otPay: emp.attendance?.otPay || 0,
                leaveDeduction: emp.attendance?.leaveDeduction || 0,
                absentDeduction: emp.attendance?.absentDeduction || 0,
                // Earnings
                basic: emp.earnings?.basic || 0,
                hra: emp.earnings?.hra || 0,
                conveyance: emp.earnings?.conveyance || 0,
                special: emp.earnings?.special || 0,
                overtimePay: emp.earnings?.otPay || 0,
                bonusAmount: emp.earnings?.bonus || 0,
                arrearsAmount: emp.earnings?.arrears || 0,
                gross: emp.earnings?.gross || 0,
                // Deductions
                pf: emp.deductions?.pf || 0,
                esi: emp.deductions?.esi || 0,
                profTax: emp.deductions?.profTax || 0,
                tds: emp.deductions?.tds || 0,
                loanEMI: emp.deductions?.loanEmi || 0,
                advanceDeduction: emp.deductions?.advance || 0,
                otherDeductions: emp.deductions?.otherDeductions || 0,
                dleaveDeduction: emp.deductions?.leaveDeduction || 0,
                dabsentDeduction: emp.deductions?.absentDeduction || 0,
                totalDeductions: emp.deductions?.totalDeductions || 0,
                netPay: emp.deductions?.netPay || 0,
            };
        });
    };

    const employeePayrollData = getEmployeePayrollData();

    // Get totals from backend
    const totals = previewData?.totals || {};
    const review = previewData?.review || {};

    // Calculate totals for display (use backend totals when available)
    const totalGross = review.totalGross || totals.gross || 0;
    const totalDeductions = review.totalDeductions || totals.totalDeductions || 0;
    const totalNet = review.netPayable || totals.netPay || 0;
    const totalOT = totals.otPay || 0;
    // const totalBonus = review.earningsBreakdown?.bonuses || 0;
    const totalLoanEMI = totals.loanEmi || 0;
    const totalAdvance = totals.advance || 0;
    const totalPF = totals.pf || 0;
    const totalTDS = totals.tds || 0;

    const successfulEmployees = employeePayrollData.filter(
        (e: any) => e.status !== "Failed"
    );
    const failedSelected = employeePayrollData.filter(
        (e: any) => e.status === "Failed"
    );

    // Toggle employee selection
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

    // Handle payroll processing
    const handleProcess = async () => {
        // Check if there are failed employees
        if (failedSelected.length > 0) {
            const confirmProcess = window.confirm(
                `${failedSelected.length} employee(s) have issues and will be skipped.\n\nDo you want to continue processing ${successfulEmployees.length} employee(s)?`
            );
            if (!confirmProcess) return;
        }

        setProcessing(true);
        try {
            const period = payrollPeriods.find(
                (p: Period) => p.id === selectedPeriodId,
            );

            const payload = {
                periodYear: new Date().getFullYear(),
                periodMonth: new Date().getMonth() + 1,
                paymentDate: periodDetails?.paymentDate || new Date().toISOString().split("T")[0],
                workingDays: period?.workingDays || 0,
                employeeIds: selectedEmployees,
                previewData: previewData, // Send the preview data
            };

            await payrollRunsService.createPayrollRun(payload);
            // setPayrollRunId(res.data.id);
            setDone(true);

            if (failedSelected.length > 0) {
                showSnackbar(
                    `Payroll processed! ${successfulEmployees.length} employees processed, ${failedSelected.length} skipped.`,
                    "warning"
                );
            } else {
                showSnackbar("Payroll processed successfully!", "success");
            }
        } catch (error: any) {
            console.error("Error processing payroll:", error);
            showSnackbar(error?.message || "Failed to process payroll", "error");
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
                        Complete payroll processing with attendance, bonuses, loans, and deductions
                    </div>
                </Box>
            </Box>

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
                                        <FormControl fullWidth required>
                                            <InputLabel>Payroll Period</InputLabel>
                                            <Select
                                                value={selectedPeriodId}
                                                onChange={(e) => handlePeriodChange(e.target.value)}
                                                label="Payroll Period"
                                                required
                                            >
                                                {payrollPeriods.map((p: Period) => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.name || `${p.month}/${p.year}`}
                                                    </MenuItem>
                                                ))}
                                                <MenuItem className="!text-primary" onClick={() => navigate("/payroll/periods")}>
                                                    <AddCircle className="mr-2" /> Add Payroll Period
                                                </MenuItem>
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
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedEmployees.includes(emp.id)}
                                                            onChange={() => toggleEmployee(emp.id)}
                                                            className="!p-1"
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
                                                        <Typography className="text-gray-800">
                                                            {emp.department}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography className="text-gray-800">
                                                            {emp.designation}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 500 }}>
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

                        {/* Step 3: Attendance & OT */}
                        {step === 3 && (
                            <Box sx={{ spaceY: 3 }}>
                                <div className="flex items-center justify-between">
                                    <Box sx={{ mb: 2 }}>
                                        <div className="text-[12px] text-gray-800 font-bold">
                                            Attendance & Overtime
                                        </div>
                                        <div className="text-[12px] mt-1 text-gray-500">
                                            View attendance records, overtime hours, and leave details
                                        </div>
                                    </Box>
                                    <Button variant="contained" size="small" onClick={() => navigate("/payroll/assign")}
                                        className="!bg-primary">Assign Salary</Button>
                                </div>

                                <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-435px)] overflow-auto">
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="!font-bold">#</TableCell>
                                                <TableCell className="!font-bold">Employee</TableCell>
                                                <TableCell className="!font-bold" align="center">Present</TableCell>
                                                <TableCell className="!font-bold" align="center">Absent</TableCell>
                                                <TableCell className="!font-bold" align="center">Leave</TableCell>
                                                <TableCell className="!font-bold" align="center">Irregular</TableCell>
                                                <TableCell className="!font-bold" align="center">OT Hours</TableCell>
                                                <TableCell className="!font-bold" align="center">Late Arrivals</TableCell>
                                                <TableCell className="!font-bold" align="right">OT Pay</TableCell>
                                                <TableCell className="!font-bold" align="right">Leave Deduction</TableCell>
                                                <TableCell className="!font-bold" align="right">Absent Deduction</TableCell>
                                                <TableCell className="!font-bold">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {employeePayrollData.map((e: any, i: any) => (
                                                <TableRow
                                                    key={e.id}
                                                    sx={{
                                                        ...getRowColor(i),
                                                        bgcolor: e.status === "Failed"
                                                            ? alpha(theme.palette.error.main, 0.08)
                                                            : getRowColor(i),
                                                    }}
                                                >
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 500 }}>
                                                            {e.name}
                                                        </Typography>
                                                        <div className="text-primary text-[10px]">
                                                            {e.code || e.id}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={e.present || 0}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={e.absent || 0}
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={e.leave || 0}
                                                            size="small"
                                                            color="warning"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={e.irregular || 0}
                                                            size="small"
                                                            className="!text-pink-600 !border-pink-500"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`${e.otHours || 0}h`}
                                                            size="small"
                                                            color="info"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={e.lateArrivals || 0}
                                                            size="small"
                                                            color="default"
                                                            variant="outlined"
                                                            className="text-gray-800"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-green-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.otPay || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-red-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.leaveDeduction || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-red-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.absentDeduction || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {e.status === "Failed" ? (
                                                            <Tooltip title="Employee has issues">
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
                                                <TableCell colSpan={8}>
                                                    <Typography className="!py-2" sx={{ fontWeight: 600 }}>
                                                        Total
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600, color: "success.main" }}>
                                                        {formatCurrency(totalOT)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600, color: "error.main" }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.leaveDeduction || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600, color: "error.main" }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.absentDeduction || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Step 4: Earnings & Bonuses */}
                        {step === 4 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Earnings & Bonuses
                                    </div>
                                    <div className="text-[12px] mt-1 text-gray-500">
                                        Complete earnings breakdown including bonuses and arrears
                                    </div>
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
                                                <TableCell align="right" className="!font-bold">OT Pay</TableCell>
                                                <TableCell align="right" className="!font-bold">Bonus</TableCell>
                                                <TableCell align="right" className="!font-bold">Arrears</TableCell>
                                                <TableCell align="right" className="!font-bold">Gross</TableCell>
                                                <TableCell className="!font-bold">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {employeePayrollData.map((e: any, i: any) => (
                                                <TableRow
                                                    key={e.id}
                                                    sx={{
                                                        ...getRowColor(i),
                                                        bgcolor: e.status === "Failed"
                                                            ? alpha(theme.palette.error.main, 0.08)
                                                            : getRowColor(i),
                                                    }}
                                                >
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 500 }}>
                                                            {e.name}
                                                        </Typography>
                                                        <div className="text-primary text-[10px]">
                                                            {e.code || e.id}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.basic || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.hra || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.conveyance || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.special || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-green-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.overtimePay || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-blue-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.bonusAmount || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-purple-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.arrearsAmount || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            className="text-gray-500"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: "success.main"
                                                            }}
                                                        >
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.gross || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {e.status === "Failed" ? (
                                                            <Tooltip title="Employee has issues">
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
                                                <TableCell colSpan={9}>
                                                    <Typography className="text-gray-500 !py-2" sx={{ fontWeight: 600 }}>
                                                        Total
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        className="text-gray-500"
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

                        {/* Step 5: Deductions & Loans */}
                        {step === 5 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Deductions & Loans
                                    </div>
                                    <Typography className="text-gray-500 !mt-1">
                                        Complete breakdown of all deductions including loans, advances, and statutory
                                    </Typography>
                                </Box>

                                <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-435px)] overflow-auto">
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="!font-bold">#</TableCell>
                                                <TableCell className="!font-bold">Employee</TableCell>
                                                <TableCell align="right" className="!font-bold">PF (12%)</TableCell>
                                                <TableCell align="right" className="!font-bold">ESI</TableCell>
                                                <TableCell align="right" className="!font-bold">Prof. Tax</TableCell>
                                                <TableCell align="right" className="!font-bold">TDS</TableCell>
                                                <TableCell align="right" className="!font-bold">Loan EMI</TableCell>
                                                <TableCell align="right" className="!font-bold">Advance</TableCell>
                                                <TableCell align="right" className="!font-bold">Others</TableCell>
                                                <TableCell align="right" className="!font-bold">Leave</TableCell>
                                                <TableCell align="right" className="!font-bold">Absent</TableCell>
                                                <TableCell align="right" className="!font-bold">Total Ded.</TableCell>
                                                <TableCell align="right" className="!font-bold">Net Pay</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {employeePayrollData.map((e: any, i: any) => (
                                                <TableRow
                                                    key={e.id}
                                                    sx={{
                                                        ...getRowColor(i),
                                                        bgcolor: e.status === "Failed"
                                                            ? alpha(theme.palette.error.main, 0.08)
                                                            : getRowColor(i),
                                                    }}
                                                >
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 500 }}>
                                                            {e.name}
                                                        </Typography>
                                                        <div className="text-primary text-[10px]">
                                                            {e.code || e.id}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.pf || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.esi || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-gray-800">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.profTax || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-red-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.tds || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-orange-600">
                                                            {e.status === "Failed" ? "—" : (e.loanEMI > 0 ? formatCurrency(e.loanEMI) : "—")}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-purple-600">
                                                            {e.status === "Failed" ? "—" : (e.advanceDeduction > 0 ? formatCurrency(e.advanceDeduction) : "—")}
                                                        </Typography>
                                                    </TableCell>
                                                     <TableCell align="right">
                                                        <Typography className="text-blue-600">
                                                            {e.status === "Failed" ? "—" : (e.otherDeductions > 0 ? formatCurrency(e.otherDeductions) : "—")}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-red-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.dleaveDeduction || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography className="text-red-600">
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.dabsentDeduction || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: "error.main"
                                                            }}
                                                        >
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.totalDeductions || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            className="text-gray-500"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: "success.main"
                                                            }}
                                                        >
                                                            {e.status === "Failed" ? "—" : formatCurrency(e.netPay || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-head !sticky z-40 bottom-0">
                                                <TableCell colSpan={2}>
                                                    <Typography className="text-gray-500 !py-2" sx={{ fontWeight: 600 }}>
                                                        Total
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(totalPF)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.esi || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.profTax || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(totalTDS)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(totalLoanEMI)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(totalAdvance)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(review.deductionsBreakdown?.otherDeductions || 0)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.leaveDeduction || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>
                                                        {formatCurrency(
                                                            successfulEmployees.reduce(
                                                                (s: number, e: any) => s + (e.absentDeduction || 0),
                                                                0,
                                                            )
                                                        )}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 700, color: "error.main" }}>
                                                        {formatCurrency(totalDeductions)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography className="text-gray-500" sx={{ fontWeight: 700, color: "success.main" }}>
                                                        {formatCurrency(totalNet)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Step 6: Review */}
                        {step === 6 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <div className="text-[12px] text-gray-800 font-bold">
                                        Review Payroll
                                    </div>
                                    <Typography className="text-gray-500 mt-1">
                                        Complete payroll summary before processing
                                    </Typography>
                                </Box>

                                {/* Summary Cards */}
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 1,
                                                textAlign: "center",
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            }}
                                        >
                                            <Typography variant="caption" className="text-gray-700 !font-bold">
                                                Total Employees
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                                {review.totalEmployees || employeePayrollData.length}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500">
                                                {review.ready || successfulEmployees.length} ready · {review.failed || failedSelected.length} failed
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 1,
                                                textAlign: "center",
                                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                            }}
                                        >
                                            <Typography variant="caption" className="text-gray-700 !font-bold">
                                                Total Gross
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                                {formatCurrency(totalGross)}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500">
                                                Including bonuses & arrears
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 1,
                                                textAlign: "center",
                                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                            }}
                                        >
                                            <Typography variant="caption" className="text-gray-700 !font-bold">
                                                Total Deductions
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                                                {formatCurrency(totalDeductions)}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500">
                                                Including taxes, loans & advances
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 1,
                                                textAlign: "center",
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            }}
                                        >
                                            <Typography variant="caption" className="text-gray-700 !font-bold">
                                                Net Payable
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                                {formatCurrency(totalNet)}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500">
                                                After all deductions
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Detailed Summary Accordion */}
                                <Accordion defaultExpanded className="bg-white">
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography sx={{ fontWeight: 600 }} className="text-gray-800">
                                            Detailed Payroll Summary
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={5}>
                                            {/* Earnings Breakdown */}
                                            <Grid className="bg-white-50 p-4 border border-green-500 rounded-md" size={{ xs: 12, md: 6 }}>
                                                <Typography variant="subtitle2" className="text-green-600" sx={{ fontWeight: 600, mb: 1 }}>
                                                    Earnings Breakdown
                                                </Typography>
                                                <Box sx={{ spaceY: 1 }}>
                                                    {review.earningsBreakdown && Object.entries(review.earningsBreakdown).map(([key, value]) => {
                                                        // Skip totalGross as it's shown separately at the bottom
                                                        if (key === 'totalGross') return null;

                                                        // Format the label
                                                        const label = key
                                                            .replace(/([A-Z])/g, ' $1')
                                                            .replace(/^./, str => str.toUpperCase());

                                                        // Color coding for different earnings types
                                                        let color = 'text-gray-500';
                                                        if (key === 'overtimePay') color = 'text-green-600';
                                                        else if (key === 'bonuses') color = 'text-blue-600';
                                                        else if (key === 'arrears') color = 'text-purple-600';

                                                        return (
                                                            <Box key={key} className="!mb-2" sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                <Typography className="text-gray-800">{label}</Typography>
                                                                <Typography className={color} sx={{ fontWeight: 500 }}>
                                                                    {formatCurrency(Number(value) || 0)}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                    <Divider className="!border !border-gray-200 !my-4" />
                                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>Total Gross</Typography>
                                                        <Typography className="text-green-600 !font-bold">
                                                            {formatCurrency(review.earningsBreakdown?.totalGross || 0)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            {/* Deductions Breakdown */}
                                            <Grid className="bg-white-50 p-4 border border-red-500 rounded-md" size={{ xs: 12, md: 6 }}>
                                                <Typography variant="subtitle2" className="text-error" sx={{ fontWeight: 600, mb: 1 }}>
                                                    Deductions Breakdown
                                                </Typography>
                                                <Box sx={{ spaceY: 1 }}>
                                                    {review.deductionsBreakdown && Object.entries(review.deductionsBreakdown).map(([key, value]) => {
                                                        // Skip these as they're shown separately at the bottom
                                                        if (key === 'totalDeductions' || key === 'netPayable') return null;

                                                        // Format the label
                                                        const label = key
                                                            .replace(/([A-Z])/g, ' $1')
                                                            .replace(/^./, str => str.toUpperCase());

                                                        // Color coding for different deduction types
                                                        let color = 'text-gray-500';
                                                        if (key === 'tds') color = 'text-red-600';
                                                        else if (key === 'loanEmi') color = 'text-orange-600';
                                                        else if (key === 'advanceDeduction') color = 'text-purple-600';
                                                        else if (key === 'otherDeductions') color = 'text-blue-600';
                                                        else if (key === 'leaveAndAbsentDeduction') color = 'text-red-600';
                                                        else if (key === 'providentFund') color = 'text-gray-600';
                                                        else if (key === 'professionalTax') color = 'text-gray-600';

                                                        return (
                                                            <Box key={key} className="!mb-2" sx={{ display: "flex", justifyContent: "space-between" }}>
                                                                <Typography className="text-gray-800">{label}</Typography>
                                                                <Typography className={color} sx={{ fontWeight: 500 }}>
                                                                    {formatCurrency(Number(value) || 0)}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                    <Divider className="!border !border-gray-200 !my-4" />
                                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 600 }}>Total Deductions</Typography>
                                                        <Typography className="text-error !font-bold">
                                                            {formatCurrency(review.deductionsBreakdown?.totalDeductions || 0)}
                                                        </Typography>
                                                    </Box>
                                                    <Divider className="!border !border-gray-200 !my-4" />
                                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                        <Typography className="text-gray-500" sx={{ fontWeight: 700 }}>Net Payable</Typography>
                                                        <Typography className="text-blue-500 !font-bold !text-[16px]">
                                                            {formatCurrency(review.deductionsBreakdown?.netPayable || 0)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                {/* {failedSelected.length > 0 && (
                                    <Alert severity="warning" icon={<AlertCircleIcon />}>
                                        <AlertTitle sx={{ fontWeight: 600 }}>
                                            {failedSelected.length} employee(s) will be skipped
                                        </AlertTitle>
                                        <Box sx={{ mt: 1, maxHeight: 80, overflow: "auto" }}>
                                            {failedSelected.map((emp: any) => (
                                                <div key={emp.id} className="text-[12px]">
                                                    • {emp.name} ({emp.code}) - {emp.errorMessage || "Issues with employee data"}
                                                </div>
                                            ))}
                                        </Box>
                                    </Alert>
                                )} */}

                                <Alert severity="info" icon={<InfoIcon />}>
                                    <AlertTitle sx={{ fontWeight: 600 }}>
                                        Ready to Process
                                    </AlertTitle>
                                    Payroll will be processed for <strong>{successfulEmployees.length}</strong> employees.
                                    {failedSelected.length > 0 && (
                                        <> <strong>{failedSelected.length}</strong> employee(s) will be skipped.</>
                                    )}
                                    <br />
                                    Total Net Payable: <strong className="!text-[16px] !text-green-600">{formatCurrency(totalNet)}</strong>
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        This action cannot be undone once approved. Ensure all data is correct before proceeding.
                                    </Typography>
                                </Alert>
                            </Box>
                        )}

                        {/* Step 7: Process */}
                        {step === 7 && (
                            <Box sx={{ spaceY: 3 }}>
                                <Box sx={{ mb: 2 }} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] text-gray-800 font-bold">
                                            Process Payroll
                                        </div>
                                        <Typography className="text-gray-500">
                                            Confirm and initiate payroll generation
                                        </Typography>
                                    </div>
                                    {failedSelected.length > 0 && (
                                        <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
                                            <Typography className="text-gray-800">
                                                <strong>{failedSelected.length}</strong> employee(s) with issues will be skipped.
                                                {successfulEmployees.length > 0 && (
                                                    <> <strong>{successfulEmployees.length}</strong> employee(s) will be processed.</>
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
                                            gap: 3,
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
                                            <div className="text-[16px] text-gray-800 font-bold">
                                                Ready to Process Payroll
                                            </div>
                                            <Typography className="text-gray-500 !mt-1">
                                                {successfulEmployees.length} employees • Net Payable: {formatCurrency(totalNet)}
                                            </Typography>
                                            {failedSelected.length > 0 && (
                                                <Typography variant="caption" className="text-gray-500 !mt-1 block">
                                                    ⚠️ {failedSelected.length} employee(s) will be skipped
                                                </Typography>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={2}>
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
                                                disabled={processing || successfulEmployees.length === 0}
                                                sx={{ px: 4, textTransform: "none" }}
                                            >
                                                {processing ? "Processing..." : "Process Payroll"}
                                            </Button>
                                        </Stack>
                                        {successfulEmployees.length === 0 && (
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
                                                className="text-gray-500"

                                            >
                                                {successfulEmployees.length} payslips have been generated.
                                                {failedSelected.length > 0 && (
                                                    <> {failedSelected.length} employee(s) were skipped.</>
                                                )}
                                            </Typography>
                                            <Typography className="text-gray-500">
                                                Total Net Payable: {formatCurrency(totalNet)}
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 3 }}>
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

                    {step > 2 && step < 7 && failedSelected.length > 0 && (
                        <Alert severity="warning" icon={<ErrorIcon />} className="!p-0 !px-4">
                            <Typography className="text-black">
                                <strong>{failedSelected.length}</strong> employees will be skipped.
                                Please check employee data to include them.
                            </Typography>
                        </Alert>
                    )}

                    {step < 7 ? (
                        <Button
                            variant="contained"
                            onClick={() => setStep((s: number) => Math.min(7, s + 1))}
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
                            disabled={processing || done || successfulEmployees.length === 0}
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