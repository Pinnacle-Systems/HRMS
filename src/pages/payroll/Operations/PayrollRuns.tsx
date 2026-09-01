import { useEffect, useState } from "react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Chip,
    IconButton,
    Stack,
    Grid,
} from "@mui/material";
import {
    PlayArrow as PlayIcon,
    Visibility as EyeIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as ClockIcon,
    Cancel as XCircleIcon,
    Warning as AlertCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from "../../../auth/PermissionGuard";
import { PERMISSIONS } from "../../../auth/Permissions";
import { formatCurrency } from "../const";
import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
import { useUI } from "../../../context/Snackbar";
import { selectSx } from "../../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    completed: {
        label: "Completed",
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
    processing: {
        label: "Processing",
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
    failed: {
        label: "Failed",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: XCircleIcon,
    },
    cancelled: {
        label: "Cancelled",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: XCircleIcon,
    },
    completed_with_errors: {
        label: "COMPLETED_WITH_ERRORS",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        icon: AlertCircleIcon,
    }
};

export default function PayrollRuns() {
    const navigate = useNavigate();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state (0-based page for API)
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadPayrollRuns();
    }, [page, limit, search, statusFilter]);

    const loadPayrollRuns = async () => {
        setLoading(true);
        showSpinner();
        try {
            const response: any = await payrollRunsService.getPayrollRuns({
                page: page,
                size: limit,
                status: statusFilter !== "all" ? statusFilter : undefined,
            });

            const data = response.data || response;
            const content = data.content || data.items || data.records || [];

            const runs = content.map((run: any) => ({
                id: run.id,
                period: run.periodLabel || `${run.periodMonth}/${run.periodYear}`,
                employeeCount: run.totalEmployees || 0,
                grossSalary: run.totalGross || 0,
                deductions: run.totalDeductions || 0,
                netSalary: run.totalNetPay || 0,
                status: (run.status || "").toLowerCase(),
                createdBy: run.createdBy || "System",
                createdOn: run.createdAt || run.paymentDate || "-",
                paymentDate: run.paymentDate,
            }));

            setPayrollRuns(runs);
            setTotal(data.totalElements || data.total || data.totalCount || runs.length);
        } catch (error) {
            showSnackbar("Failed to load payroll runs", "error");
        } finally {
            setLoading(false);
            hideSpinner();
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage - 1); // Convert from 1-based (UI) to 0-based (API)
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setPage(0); // Reset to first page when changing page size
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page when searching
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(0); // Reset to first page when filtering
    };

    // Calculate totals from all data (not just current page)
    const totalNet = payrollRuns.reduce((s, r) => s + (r.netSalary || 0), 0);
    const totalGross = payrollRuns.reduce((s, r) => s + (r.grossSalary || 0), 0);
    const totalDeductions = payrollRuns.reduce((s, r) => s + (r.deductions || 0), 0);

    return (
        <div className="bg-white-50">
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box>
                    <div className="text-gray-800 text-[12px] font-bold">
                        Payroll Runs
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                        Manage and track all payroll processing runs
                    </div>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <PermissionGuard permissions={PERMISSIONS.PAYROLL_WRITE}>
                        <Button
                            variant="contained"
                            startIcon={<PlayIcon fontSize="small" />}
                            className="!bg-primary"
                            onClick={() => navigate("/payroll/generate")}
                        >
                            Generate Payroll
                        </Button>
                    </PermissionGuard>
                </Box>
            </Box>

            {/* Summary KPI */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
                {[
                    { label: "Total Runs", value: total.toString(), sub: "All time" },
                    { label: "Total Gross", value: formatCurrency(totalGross), sub: "Cumulative" },
                    { label: "Total Deductions", value: formatCurrency(totalDeductions), sub: "Cumulative" },
                    { label: "Total Net Paid", value: formatCurrency(totalNet), sub: "Cumulative" },
                ].map((s) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                        <Card className="bg-white !border !border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                            <CardContent className="!pb-3 !p-3">
                                <div className="text-gray-500 text-[12px]">{s.label}</div>
                                <div className="text-[12px] mt-1 text-gray-800 font-bold">{s.value}</div>
                                <div className="text-[12px] mt-1 text-gray-500">{s.sub}</div>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
                <TextField
                    placeholder="Search by ID, period, created by..."
                    value={search}
                    onChange={handleSearch}
                    size="small"
                />
                <FormControl size="small" sx={{ minWidth: 150 }} className="bg-white dark:bg-white-50">
                    <Select
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        label="Status"
                        sx={selectSx}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="completed_with_errors">Completed with Errors</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="processing">Processing</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Table */}
            <TableContainer className="bg-white-50 border border-gray-200 rounded-sm max-h-[calc(100vh-331px)] overflow-auto">
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell className="!font-bold !sticky left-0 !z-30">S No</TableCell>
                            <TableCell className="!font-bold !sticky left-[60px] !z-30">Period</TableCell>
                            <TableCell className="!font-bold">Employees</TableCell>
                            <TableCell className="!font-bold" align="right">Gross Salary</TableCell>
                            <TableCell className="!font-bold" align="right">Deductions</TableCell>
                            <TableCell className="!font-bold" align="right">Net Salary</TableCell>
                            <TableCell className="!font-bold">Status</TableCell>
                            <TableCell className="!font-bold">Created By</TableCell>
                            <TableCell className="!font-bold">Created On</TableCell>
                            <TableCell className="!font-bold sticky right-0 !z-30" align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                    <Typography sx={{ color: "text.secondary" }}>
                                        Loading payroll runs...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : payrollRuns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    <div className="py-8">No payroll runs found matching your filters.</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            payrollRuns.map((run, i) => {
                                const sc = statusConfig[run.status] || statusConfig.draft;
                                const Icon = sc.icon;
                                const serialNumber = page * limit + i + 1;

                                return (
                                    <TableRow
                                        key={run.id}
                                        sx={getRowColor(i)}
                                        onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                    >
                                        <TableCell className="sticky left-0 z-20 bg-inherit">
                                            {serialNumber}
                                        </TableCell>
                                        <TableCell className="sticky left-[60px] z-20 bg-inherit">
                                            <Typography sx={{ fontWeight: 600, color: "primary.main" }}>
                                                {run.period}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography>
                                                {run.employeeCount.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 500 }}>
                                                {formatCurrency(run.grossSalary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography sx={{ color: "error.main" }}>
                                                {formatCurrency(run.deductions)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 600, color: "success.main" }}>
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
                                                    "& .MuiChip-icon": { color: sc.color },
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography className="text-gray-800">
                                                {run.createdBy}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography className="text-gray-800">
                                                {formatDate(run.createdOn)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="sticky right-0 z-20 bg-inherit" onClick={(e) => e.stopPropagation()}>
                                            <Stack direction="row">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                                    sx={{ "&:hover": { color: "primary.main" } }}
                                                >
                                                    <EyeIcon fontSize="small" className="text-primary" />
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

            {/* Global Pagination */}
            {total > 0 && (
                <GlobalPagination
                    total={total}
                    page={page + 1} // Convert from 0-based (state) to 1-based (UI)
                    limit={limit}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    pageSizeOptions={[10, 20, 50, 100]}
                    showTotal={true}
                />
            )}
        </div>
    );
}