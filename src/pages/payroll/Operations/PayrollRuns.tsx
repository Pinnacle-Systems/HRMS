import { useState } from "react";
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
    Chip,
    IconButton,
    Stack,
    Pagination,
    useTheme,
    alpha,
    Grid,
} from "@mui/material";
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon,
    PlayArrow as PlayIcon,
    Visibility as EyeIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as ClockIcon,
    Cancel as XCircleIcon,
    Warning as AlertCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/authContext";
import { PermissionGuard } from "../../../auth/PermissionGuard";
import { PERMISSIONS } from "../../../auth/Permissions";

// Mock data - replace with your actual API data
const mockPayrollRuns = [
    {
        id: "PR-2026-001",
        period: "June 2026",
        employeeCount: 248,
        grossSalary: 2850000,
        deductions: 450000,
        netSalary: 2400000,
        status: "processed",
        createdBy: "HR Admin",
        createdOn: "25 Jun 2026",
    },
    {
        id: "PR-2026-002",
        period: "May 2026",
        employeeCount: 245,
        grossSalary: 2750000,
        deductions: 430000,
        netSalary: 2320000,
        status: "approved",
        createdBy: "HR Admin",
        createdOn: "25 May 2026",
    },
    {
        id: "PR-2026-003",
        period: "April 2026",
        employeeCount: 242,
        grossSalary: 2600000,
        deductions: 410000,
        netSalary: 2190000,
        status: "pending",
        createdBy: "HR Manager",
        createdOn: "25 Apr 2026",
    },
    {
        id: "PR-2026-004",
        period: "March 2026",
        employeeCount: 240,
        grossSalary: 2500000,
        deductions: 390000,
        netSalary: 2110000,
        status: "draft",
        createdBy: "HR Admin",
        createdOn: "25 Mar 2026",
    },
    {
        id: "PR-2026-005",
        period: "February 2026",
        employeeCount: 238,
        grossSalary: 2350000,
        deductions: 370000,
        netSalary: 1980000,
        status: "rejected",
        createdBy: "HR Admin",
        createdOn: "25 Feb 2026",
    },
    {
        id: "PR-2026-006",
        period: "January 2026",
        employeeCount: 235,
        grossSalary: 2200000,
        deductions: 350000,
        netSalary: 1850000,
        status: "processed",
        createdBy: "HR Manager",
        createdOn: "25 Jan 2026",
    },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    processed: {
        label: "Processed",
        color: "#10b981",
        bgColor: "#d1fae5",
        icon: CheckCircleIcon,
    },
    approved: {
        label: "Approved",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        icon: CheckCircleIcon,
    },
    pending: {
        label: "Pending",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        icon: ClockIcon,
    },
    draft: {
        label: "Draft",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: AlertCircleIcon,
    },
    rejected: {
        label: "Rejected",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: XCircleIcon,
    },
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function PayrollRuns() {
    const { hasPermission } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const filtered = mockPayrollRuns.filter((r) => {
        const matchSearch =
            r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.period.toLowerCase().includes(search.toLowerCase()) ||
            r.createdBy.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const totalNet = mockPayrollRuns.reduce((s, r) => s + r.netSalary, 0);
    const totalGross = mockPayrollRuns.reduce((s, r) => s + r.grossSalary, 0);
    const totalDeductions = mockPayrollRuns.reduce((s, r) => s + r.deductions, 0);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    return (
        <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
                        Payroll Runs
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Manage and track all payroll processing runs
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon fontSize="small" />}
                            sx={{ textTransform: "none" }}
                        >
                            Export
                        </Button>
                    )}
                    <PermissionGuard permissions={PERMISSIONS.PAYROLL_WRITE}>
                        <Button
                            variant="contained"
                            startIcon={<PlayIcon fontSize="small" />}
                            sx={{ textTransform: "none", bgcolor: "primary.main" }}
                            onClick={() => navigate("/generate-payroll")}
                        >
                            Generate Payroll
                        </Button>
                    </PermissionGuard>
                </Box>
            </Box>

            {/* Summary KPI */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {[
                    { label: "Total Runs", value: mockPayrollRuns.length.toString(), sub: "All time" },
                    { label: "Total Gross", value: formatCurrency(totalGross), sub: "Cumulative" },
                    { label: "Total Deductions", value: formatCurrency(totalDeductions), sub: "Cumulative" },
                    { label: "Total Net Paid", value: formatCurrency(totalNet), sub: "Cumulative" },
                ].map((s) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={s.label}>
                        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                    {s.label}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                                    {s.value}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                                    {s.sub}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
                <TextField
                    placeholder="Search by ID, period, created by..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    // size="small"
                    // sx={{ flex: 1, maxWidth: 300 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        label="Status"
                        startAdornment={
                            <FilterIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />
                        }
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="processed">Processed</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Table */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <TableContainer>
                    <Table sx={{ minWidth: 1200 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Payroll ID
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Period
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Employees
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Gross Salary
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Deductions
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Net Salary
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Status
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Created By
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Created On
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        color: "text.secondary",
                                    }}
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                        No payroll runs found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((run) => {
                                    const sc = statusConfig[run.status] ?? statusConfig.pending;
                                    const Icon = sc.icon;
                                    return (
                                        <TableRow
                                            key={run.id}
                                            hover
                                            sx={{
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                "&:hover": {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                                },
                                            }}
                                            onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                        >
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: "monospace",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {run.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {run.period}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2">
                                                    {run.employeeCount.toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {formatCurrency(run.grossSalary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ color: "error.main" }}>
                                                    {formatCurrency(run.deductions)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                                                    {formatCurrency(run.netSalary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<Icon fontSize="small" />}
                                                    label={sc.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: sc.bgColor,
                                                        color: sc.color,
                                                        fontSize: "0.7rem",
                                                        fontWeight: 500,
                                                        "& .MuiChip-icon": {
                                                            color: sc.color,
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                    {run.createdBy}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                    {run.createdOn}
                                                </Typography>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Stack direction="row">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: "text.secondary",
                                                            "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                                        }}
                                                        onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                                    >
                                                        <EyeIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: "text.secondary",
                                                            "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                                        }}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} runs
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            )}
        </Box>
    );
}