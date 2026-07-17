import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    InputAdornment,
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
    StepIcon,
    useTheme,
    alpha,
    Grid,
    Checkbox,
    FormControlLabel,
    Alert,
    AlertTitle,
    CircularProgress,
    Divider,
} from "@mui/material";
import {
    Search as SearchIcon,
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
    Download as DownloadIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockEmployees = [
    { id: "EMP001", name: "Rajesh Kumar", department: "Engineering", designation: "Senior Developer", ctc: 2400000 },
    { id: "EMP002", name: "Priya Sharma", department: "Sales", designation: "Sales Manager", ctc: 1800000 },
    { id: "EMP003", name: "Amit Patel", department: "HR", designation: "HR Executive", ctc: 1200000 },
    { id: "EMP004", name: "Sneha Reddy", department: "Finance", designation: "Finance Analyst", ctc: 1500000 },
    { id: "EMP005", name: "Vikram Singh", department: "Engineering", designation: "Team Lead", ctc: 3000000 },
    { id: "EMP006", name: "Ananya Gupta", department: "Marketing", designation: "Marketing Specialist", ctc: 1400000 },
    { id: "EMP007", name: "Deepak Jain", department: "Operations", designation: "Operations Manager", ctc: 2000000 },
    { id: "EMP008", name: "Kavya Nair", department: "Sales", designation: "Sales Executive", ctc: 1100000 },
];

const mockPayrollPeriods = [
    { id: "PER001", name: "June 2026" },
    { id: "PER002", name: "May 2026" },
    { id: "PER003", name: "April 2026" },
];

const STEPS = [
    { id: 1, label: "Select Period", icon: CalendarIcon },
    { id: 2, label: "Employee Selection", icon: UsersIcon },
    { id: 3, label: "Earnings & Allowances", icon: DollarSignIcon },
    { id: 4, label: "Deductions & Taxes", icon: MinusCircleIcon },
    { id: 5, label: "Review Payroll", icon: EyeIcon },
    { id: 6, label: "Process Payroll", icon: PlayIcon },
];

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function GeneratePayroll() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [step, setStep] = useState(1);
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [selectedDept, setSelectedDept] = useState("all");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(mockEmployees.map((e) => e.id));
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const departments = ["all", ...Array.from(new Set(mockEmployees.map((e) => e.department)))];
    const filtered = selectedDept === "all" ? mockEmployees : mockEmployees.filter((e) => e.department === selectedDept);

    const employeeEarnings = mockEmployees.map((e) => {
        const basic = Math.round(e.ctc * 0.4 / 12);
        const hra = Math.round(basic * 0.5);
        const conv = 1600;
        const special = Math.round(e.ctc / 12) - basic - hra - conv;
        const gross = basic + hra + conv + Math.max(0, special);
        return { ...e, basic, hra, conv, special: Math.max(0, special), gross };
    });

    const toggleEmployee = (id: string) => {
        setSelectedEmployees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedEmployees.length === filtered.length) setSelectedEmployees([]);
        else setSelectedEmployees(filtered.map((e) => e.id));
    };

    const selectedEarnings = employeeEarnings.filter((e) => selectedEmployees.includes(e.id));
    const totalGross = selectedEarnings.reduce((s, e) => s + e.gross, 0);
    const totalPF = selectedEarnings.reduce((s, e) => s + Math.round(e.basic * 0.12), 0);
    const totalPT = selectedEarnings.length * 200;
    const totalDeductions = totalPF + totalPT;
    const totalNet = totalGross - totalDeductions;

    const handleProcess = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setDone(true);
        }, 2500);
    };

    return (
        <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <IconButton
                    onClick={() => navigate("/payroll-runs")}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                >
                    <ArrowLeftIcon fontSize="small" />
                </IconButton>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
                        Generate Payroll
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Follow the 6-step wizard to process payroll
                    </Typography>
                </Box>
            </Box>

            {/* Stepper */}
            <Box sx={{ mb: 4 }}>
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
                                            bgcolor: step > s.id
                                                ? theme.palette.primary.main
                                                : step === s.id
                                                    ? alpha(theme.palette.primary.main, 0.1)
                                                    : theme.palette.grey[100],
                                            border: `2px solid ${step > s.id
                                                    ? theme.palette.primary.main
                                                    : step === s.id
                                                        ? theme.palette.primary.main
                                                        : theme.palette.grey[300]
                                                }`,
                                            color: step > s.id
                                                ? "#fff"
                                                : step === s.id
                                                    ? theme.palette.primary.main
                                                    : theme.palette.text.secondary,
                                        }}
                                    >
                                        {step > s.id ? (
                                            <CheckIcon fontSize="small" />
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
                                        color: step === s.id ? "primary.main" : "text.secondary",
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
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Step 1: Select Period */}
                    {step === 1 && (
                        <Box sx={{ spaceY: 3 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Select Payroll Period
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Choose the period for which payroll should be generated
                                </Typography>
                            </Box>
                            <Grid container spacing={3} sx={{ maxWidth: 600 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Payroll Period *</InputLabel>
                                        <Select
                                            value={selectedPeriod}
                                            onChange={(e) => setSelectedPeriod(e.target.value)}
                                            label="Payroll Period *"
                                        >
                                            {mockPayrollPeriods.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        type="date"
                                        label="Payment Date"
                                        defaultValue="2026-06-05"
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </Grid>
                            </Grid>
                            {selectedPeriod && (
                                <Box
                                    sx={{
                                        maxWidth: 600,
                                        p: 2,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        border: `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                        Period Details
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {[
                                            ["Start Date", "01/05/2026"],
                                            ["End Date", "31/05/2026"],
                                            ["Working Days", "23"],
                                            ["Payment Date", "05/06/2026"],
                                        ].map(([k, v]) => (
                                            <Grid size={{ xs: 6 }} key={k}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                        {k}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {v}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Step 2: Employee Selection */}
                    {step === 2 && (
                        <Box sx={{ spaceY: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Employee Selection
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                        Select employees to include in this payroll run
                                    </Typography>
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
                                            {departments.filter(d => d !== "all").map((d) => (
                                                <MenuItem key={d} value={d}>{d}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedEmployees.length === filtered.length && filtered.length > 0}
                                                    indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filtered.length}
                                                    onChange={toggleAll}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Employee
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Department
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Designation
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                CTC (Annual)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filtered.map((emp) => (
                                            <TableRow
                                                key={emp.id}
                                                hover
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => toggleEmployee(emp.id)}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onChange={() => toggleEmployee(emp.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                        <Box
                                                            sx={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: "50%",
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                color: "primary.main",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "0.65rem",
                                                                fontWeight: 600,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {emp.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                {emp.id}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{emp.department}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                        {emp.designation}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {formatCurrency(emp.ctc)}
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
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Earnings & Allowances
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Review and confirm salary components for selected employees
                                </Typography>
                            </Box>

                            <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Employee
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Basic
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                HRA
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Conveyance
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Special
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Gross
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedEarnings.map((e) => (
                                            <TableRow key={e.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {e.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                        {e.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">{formatCurrency(e.basic)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">{formatCurrency(e.hra)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">{formatCurrency(e.conv)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2">{formatCurrency(e.special)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                                                        {formatCurrency(e.gross)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Total
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(selectedEarnings.reduce((s, e) => s + e.basic, 0))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(selectedEarnings.reduce((s, e) => s + e.hra, 0))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(selectedEarnings.reduce((s, e) => s + e.conv, 0))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(selectedEarnings.reduce((s, e) => s + e.special, 0))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                                                    {formatCurrency(totalGross)}
                                                </Typography>
                                            </TableCell>
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
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Deductions & Taxes
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Review statutory and other deductions
                                </Typography>
                            </Box>

                            <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Employee
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                PF (12%)
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Prof. Tax
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Loan/Advance
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Total Deductions
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                                                Net Pay
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedEarnings.map((e) => {
                                            const pf = Math.round(e.basic * 0.12);
                                            const pt = 200;
                                            const loan = e.id === "EMP001" ? 1170 : 0;
                                            const deductions = pf + pt + loan;
                                            const net = e.gross - deductions;
                                            return (
                                                <TableRow key={e.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {e.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                            {e.id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">{formatCurrency(pf)}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">{formatCurrency(pt)}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2">
                                                            {loan > 0 ? formatCurrency(loan) : "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                                                            {formatCurrency(deductions)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                                                            {formatCurrency(net)}
                                                        </Typography>
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
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Review Payroll
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Verify all details before processing
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                {[
                                    { label: "Total Employees", value: selectedEmployees.length.toString(), color: theme.palette.primary.main },
                                    { label: "Total Gross", value: formatCurrency(totalGross), color: theme.palette.success.main },
                                    { label: "Total Deductions", value: formatCurrency(totalDeductions), color: theme.palette.error.main },
                                    { label: "PF Contribution", value: formatCurrency(totalPF), color: theme.palette.secondary.main },
                                    { label: "Professional Tax", value: formatCurrency(totalPT), color: theme.palette.warning.main },
                                    { label: "Net Payable", value: formatCurrency(totalNet), color: theme.palette.primary.main },
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
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                                {s.label}
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: s.color }}>
                                                {s.value}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            <Alert severity="warning" icon={<AlertCircleIcon />} sx={{ mt: 2 }}>
                                <AlertTitle sx={{ fontWeight: 600 }}>Ready to Process</AlertTitle>
                                Payroll will be processed for <strong>{selectedEmployees.length}</strong> employees.
                                This action cannot be undone once approved. Ensure all data is correct before proceeding.
                            </Alert>
                        </Box>
                    )}

                    {/* Step 6: Process */}
                    {step === 6 && (
                        <Box sx={{ spaceY: 3 }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Process Payroll
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                    Confirm and initiate payroll generation
                                </Typography>
                            </Box>

                            {!done ? (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 3 }}>
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: "50%",
                                            border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <PlayIcon sx={{ fontSize: 40, color: "primary.main" }} />
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Ready to Process Payroll
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                            {selectedEmployees.length} employees • Net Payable: {formatCurrency(totalNet)}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                                        onClick={handleProcess}
                                        disabled={processing}
                                        sx={{ px: 4, textTransform: "none" }}
                                    >
                                        {processing ? "Processing..." : "Process Payroll"}
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 3 }}>
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
                                        <CheckCircleIcon sx={{ fontSize: 40, color: "success.main" }} />
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>
                                            Payroll Processed Successfully!
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                            Payslips have been generated for all selected employees.
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

            {/* Navigation */}
            {!done && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        disabled={step === 1}
                        startIcon={<ArrowLeftIcon />}
                        sx={{ textTransform: "none" }}
                    >
                        Previous
                    </Button>
                    {step < 6 && (
                        <Button
                            variant="contained"
                            onClick={() => setStep((s) => Math.min(6, s + 1))}
                            endIcon={<ArrowRightIcon />}
                            sx={{ textTransform: "none" }}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
}