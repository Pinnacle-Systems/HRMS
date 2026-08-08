// import { useEffect, useState } from "react";
// import {
//     Box,
//     Card,
//     CardContent,
//     Typography,
//     Button,
//     TextField,
//     InputAdornment,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableRow,
//     TableContainer,
//     Chip,
//     IconButton,
//     Stack,
//     Pagination,
//     useTheme,
//     alpha,
//     Grid,
// } from "@mui/material";
// import {
//     Search as SearchIcon,
//     FilterList as FilterIcon,
//     Download as DownloadIcon,
//     PlayArrow as PlayIcon,
//     Visibility as EyeIcon,
//     CheckCircle as CheckCircleIcon,
//     AccessTime as ClockIcon,
//     Cancel as XCircleIcon,
//     Warning as AlertCircleIcon,
// } from "@mui/icons-material";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../../auth/authContext";
// import { PermissionGuard } from "../../../auth/PermissionGuard";
// import { PERMISSIONS } from "../../../auth/Permissions";
// import { formatCurrency } from "../const";
// import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
// import { selectSx } from "../../../const";

// const normalizeCollection = (response: any) => {
//     const payload = response?.data ?? response;
//     const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
//     const collection = candidates.find(Array.isArray);
//     return Array.isArray(collection) ? collection : [];
// };

// const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
//     processed: {
//         label: "Processed",
//         color: "#10b981",
//         bgColor: "#d1fae5",
//         icon: CheckCircleIcon,
//     },
//     approved: {
//         label: "Approved",
//         color: "#3b82f6",
//         bgColor: "#dbeafe",
//         icon: CheckCircleIcon,
//     },
//     pending: {
//         label: "Pending",
//         color: "#f59e0b",
//         bgColor: "#fef3c7",
//         icon: ClockIcon,
//     },
//     draft: {
//         label: "Draft",
//         color: "#6b7280",
//         bgColor: "#f3f4f6",
//         icon: AlertCircleIcon,
//     },
//     rejected: {
//         label: "Rejected",
//         color: "#ef4444",
//         bgColor: "#fee2e2",
//         icon: XCircleIcon,
//     },
// };

// export default function PayrollRuns() {
//     const { hasPermission } = useAuth();
//     const theme = useTheme();
//     const navigate = useNavigate();
//     const [search, setSearch] = useState("");
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [page, setPage] = useState(1);
//     const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const pageSize = 6;

//     useEffect(() => {
//         const loadPayrollRuns = async () => {
//             setLoading(true);
//             try {
//                 const response: any = await payrollRunsService.getPayrollRuns();
//                 const runs = normalizeCollection(response).map((run: any) => ({
//                     id: run.id || run.payrollRunId || `PR-${run.periodYear || ""}${run.periodMonth || ""}`,
//                     period: run.periodLabel || `${run.periodMonth || ""}/${run.periodYear || ""}`,
//                     employeeCount: run.totalEmployees || run.employeeCount || 0,
//                     grossSalary: run.totalGross || run.grossSalary || 0,
//                     deductions: run.totalDeductions || run.deductions || 0,
//                     netSalary: run.totalNetPay || run.netSalary || 0,
//                     status: (run.status || "pending").toLowerCase(),
//                     createdBy: run.createdBy || run.createdByName || "System",
//                     createdOn: run.createdAt || run.paymentDate || "-",
//                     paymentDate: run.paymentDate,
//                 }));
//                 setPayrollRuns(runs);
//                 setError("");
//             } catch (err) {
//                 console.error("Failed to load payroll runs", err);
//                 setError("Unable to load payroll runs right now.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadPayrollRuns();
//     }, []);

//     const filtered = payrollRuns.filter((r) => {
//         const matchSearch =
//             r.id.toLowerCase().includes(search.toLowerCase()) ||
//             r.period.toLowerCase().includes(search.toLowerCase()) ||
//             r.createdBy.toLowerCase().includes(search.toLowerCase());
//         const matchStatus = statusFilter === "all" || r.status === statusFilter;
//         return matchSearch && matchStatus;
//     });

//     const totalPages = Math.ceil(filtered.length / pageSize);
//     const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

//     const totalNet = payrollRuns.reduce((s, r) => s + (r.netSalary || 0), 0);
//     const totalGross = payrollRuns.reduce((s, r) => s + (r.grossSalary || 0), 0);
//     const totalDeductions = payrollRuns.reduce((s, r) => s + (r.deductions || 0), 0);

//     const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
//         setPage(value);
//     };

//     return (
//         <div className="bg-white-50">
//             {/* Header */}
//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
//                 <Box>
//                     <div className="text-gray-800 text-[12px] font-bold">
//                         Payroll Runs
//                     </div>
//                     <div className="text-[12px] text-gray-500 mt-0.5">
//                         Manage and track all payroll processing runs
//                     </div>
//                 </Box>
//                 <Box sx={{ display: "flex", gap: 1 }}>
//                     {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
//                         <Button
//                             variant="outlined"
//                             startIcon={<DownloadIcon fontSize="small" />}
//                             sx={{ textTransform: "none" }}
//                         >
//                             Export
//                         </Button>
//                     )}
//                     <PermissionGuard permissions={PERMISSIONS.PAYROLL_WRITE}>
//                         <Button
//                             variant="contained"
//                             startIcon={<PlayIcon fontSize="small" />}
//                             className="!bg-primary"
//                             onClick={() => navigate("/payroll/generate")}
//                         >
//                             Generate Payroll
//                         </Button>
//                     </PermissionGuard>
//                 </Box>
//             </Box>

//             {/* Summary KPI */}
//             <Grid container spacing={2} sx={{ mb: 3 }}>
//                 {[
//                     { label: "Total Runs", value: payrollRuns.length.toString(), sub: "All time" },
//                     { label: "Total Gross", value: formatCurrency(totalGross), sub: "Cumulative" },
//                     { label: "Total Deductions", value: formatCurrency(totalDeductions), sub: "Cumulative" },
//                     { label: "Total Net Paid", value: formatCurrency(totalNet), sub: "Cumulative" },
//                 ].map((s) => (
//                     <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
//                         <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//                             <CardContent sx={{ p: 2 }}>
//                                 <div className="text-gray-500 text-[12px]">
//                                     {s.label}
//                                 </div>
//                                 <div className="text-[12px] mt-1 text-gray-800 font-bold">
//                                     {s.value}
//                                 </div>
//                                 <div className="text-[12px] mt-1 text-gray-500">
//                                     {s.sub}
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                 ))}
//             </Grid>

//             {/* Filters */}
//             <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
//                 <TextField
//                     placeholder="Search by ID, period, created by..."
//                     value={search}
//                     onChange={(e) => {
//                         setSearch(e.target.value);
//                         setPage(1);
//                     }}
//                     // size="small"
//                     // sx={{ flex: 1, maxWidth: 300 }}
//                     // slotProps={{
//                     //     input: {
//                     //         startAdornment: (
//                     //             <InputAdornment position="start">
//                     //                 <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
//                     //             </InputAdornment>
//                     //         ),
//                     //     },
//                     // }}
//                 />
//                 <FormControl size="small" sx={{ minWidth: 150 }}>
//                     {/* <InputLabel id="status-filter-label">Status</InputLabel> */}
//                     <Select
//                         labelId="status-filter-label"
//                         value={statusFilter}
//                         onChange={(e) => {
//                             setStatusFilter(e.target.value);
//                             setPage(1);
//                         }}
//                         label="Status"
//                         className="bg-white-50"
//                         sx={selectSx}
//                         startAdornment={
//                             <FilterIcon fontSize="small" className="text-gray-500 mr-1" />
//                         }
//                     >
//                         <MenuItem value="all">All Status</MenuItem>
//                         <MenuItem value="processed">Processed</MenuItem>
//                         <MenuItem value="approved">Approved</MenuItem>
//                         <MenuItem value="pending">Pending</MenuItem>
//                         <MenuItem value="draft">Draft</MenuItem>
//                         <MenuItem value="rejected">Rejected</MenuItem>
//                     </Select>
//                 </FormControl>
//             </Box>

//             {/* Table */}
//             {loading ? (
//                 <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>Loading payroll runs…</Box>
//             ) : error ? (
//                 <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>{error}</Box>
//             ) : (
//             <div className="border border-gray-200 rounded-sm">
//                 <TableContainer>
//                     <Table >
//                         <TableHead>
//                             <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                                 <TableCell
//                                     // sx={{
//                                     //     fontWeight: 600,
//                                     //     fontSize: "0.65rem",
//                                     //     textTransform: "uppercase",
//                                     //     letterSpacing: "0.5px",
//                                     //     color: "text.secondary",
//                                     // }}
//                                 >
//                                     Payroll ID
//                                 </TableCell>
//                                 <TableCell
                                   
//                                 >
//                                     Period
//                                 </TableCell>
//                                 <TableCell
                                   
//                                 >
//                                     Employees
//                                 </TableCell>
//                                 <TableCell
                                    
//                                 >
//                                     Gross Salary
//                                 </TableCell>
//                                 <TableCell
                                   
//                                 >
//                                     Deductions
//                                 </TableCell>
//                                 <TableCell
                                    
//                                 >
//                                     Net Salary
//                                 </TableCell>
//                                 <TableCell
                                    
//                                 >
//                                     Status
//                                 </TableCell>
//                                 <TableCell
                                   
//                                 >
//                                     Created By
//                                 </TableCell>
//                                 <TableCell
                                   
//                                 >
//                                     Created On
//                                 </TableCell>
//                                 <TableCell
//                                     align="center"
                                   
//                                 >
//                                     Actions
//                                 </TableCell>
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {paginated.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                                         <div className="py-8">No payroll runs found matching your filters.</div>
//                                     </TableCell>
//                                 </TableRow>
//                             ) : (
//                                 paginated.map((run) => {
//                                     const sc = statusConfig[run.status] ?? statusConfig.pending;
//                                     const Icon = sc.icon;
//                                     return (
//                                         <TableRow
//                                             key={run.id}
//                                             hover
//                                             sx={{
//                                                 cursor: "pointer",
//                                                 transition: "background-color 0.2s",
//                                                 "&:hover": {
//                                                     bgcolor: alpha(theme.palette.primary.main, 0.04),
//                                                 },
//                                             }}
//                                             onClick={() => navigate(`/payroll/runs/${run.id}`)}
//                                         >
//                                             <TableCell>
//                                                 <Typography
//                                                     variant="body2"
//                                                     sx={{
//                                                         fontFamily: "monospace",
//                                                         fontSize: "0.75rem",
//                                                         fontWeight: 600,
//                                                         color: "primary.main",
//                                                     }}
//                                                 >
//                                                     {run.id}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                                                     {run.period}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell align="right">
//                                                 <Typography variant="body2">
//                                                     {run.employeeCount.toLocaleString()}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell align="right">
//                                                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                                                     {formatCurrency(run.grossSalary)}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell align="right">
//                                                 <Typography variant="body2" sx={{ color: "error.main" }}>
//                                                     {formatCurrency(run.deductions)}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell align="right">
//                                                 <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
//                                                     {formatCurrency(run.netSalary)}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Chip
//                                                     icon={<Icon fontSize="small" />}
//                                                     label={sc.label}
//                                                     size="small"
//                                                     sx={{
//                                                         bgcolor: sc.bgColor,
//                                                         color: sc.color,
//                                                         fontSize: "0.7rem",
//                                                         fontWeight: 500,
//                                                         "& .MuiChip-icon": {
//                                                             color: sc.color,
//                                                         },
//                                                     }}
//                                                 />
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                                                     {run.createdBy}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                                                     {run.createdOn}
//                                                 </Typography>
//                                             </TableCell>
//                                             <TableCell onClick={(e) => e.stopPropagation()}>
//                                                 <Stack direction="row">
//                                                     <IconButton
//                                                         size="small"
//                                                         sx={{
//                                                             color: "text.secondary",
//                                                             "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
//                                                         }}
//                                                         onClick={() => navigate(`/payroll/runs/${run.id}`)}
//                                                     >
//                                                         <EyeIcon fontSize="small" />
//                                                     </IconButton>
//                                                     <IconButton
//                                                         size="small"
//                                                         sx={{
//                                                             color: "text.secondary",
//                                                             "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
//                                                         }}
//                                                     >
//                                                         <DownloadIcon fontSize="small" />
//                                                     </IconButton>
//                                                 </Stack>
//                                             </TableCell>
//                                         </TableRow>
//                                     );
//                                 })
//                             )}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//             </div>
//             )}

//             {/* Pagination */}
//             {totalPages > 1 && (
//                 <Box
//                     sx={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         mt: 2,
//                     }}
//                 >
//                     <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} runs
//                     </Typography>
//                     <Pagination
//                         count={totalPages}
//                         page={page}
//                         onChange={handlePageChange}
//                         color="primary"
//                         shape="rounded"
//                     />
//                 </Box>
//             )}
//         </div>
//     );
// }

import { useEffect, useState } from "react";
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
    CircularProgress,
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
import { formatCurrency } from "../const";
import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
import { useUI } from "../../../context/Snackbar";
import { selectSx } from "../../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { getRowColor } from "../../const";

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
};

export default function PayrollRuns() {
    const { hasPermission } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const pageSize = 6;

    useEffect(() => {
        loadPayrollRuns();
    }, []);

    const loadPayrollRuns = async () => {
        setLoading(true);
        showSpinner();
        try {
            const response: any = await payrollRunsService.getPayrollRuns();
            const runs = (response.data?.content || []).map((run: any) => ({
                id: run.id,
                period: run.periodLabel || `${run.periodMonth}/${run.periodYear}`,
                employeeCount: run.totalEmployees || 0,
                grossSalary: run.totalGross || 0,
                deductions: run.totalDeductions || 0,
                netSalary: run.totalNetPay || 0,
                status: (run.status || "draft").toLowerCase(),
                createdBy: run.createdBy || "System",
                createdOn: run.createdAt || run.paymentDate || "-",
                paymentDate: run.paymentDate,
            }));
            setPayrollRuns(runs);
        } catch (error) {
            console.error("Failed to load payroll runs", error);
            showSnackbar("Failed to load payroll runs", "error");
        } finally {
            hideSpinner();
            setLoading(false);
        }
    };

    const filtered = payrollRuns.filter((r) => {
        const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.period.toLowerCase().includes(search.toLowerCase()) ||
            r.createdBy.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const totalNet = payrollRuns.reduce((s, r) => s + (r.netSalary || 0), 0);
    const totalGross = payrollRuns.reduce((s, r) => s + (r.grossSalary || 0), 0);
    const totalDeductions = payrollRuns.reduce((s, r) => s + (r.deductions || 0), 0);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="bg-white-50">
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
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
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "Total Runs", value: payrollRuns.length.toString(), sub: "All time" },
                    { label: "Total Gross", value: formatCurrency(totalGross), sub: "Cumulative" },
                    { label: "Total Deductions", value: formatCurrency(totalDeductions), sub: "Cumulative" },
                    { label: "Total Net Paid", value: formatCurrency(totalNet), sub: "Cumulative" },
                ].map((s) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                            <CardContent sx={{ p: 2 }}>
                                <div className="text-gray-500 text-[12px]">{s.label}</div>
                                <div className="text-[12px] mt-1 text-gray-800 font-bold">{s.value}</div>
                                <div className="text-[12px] mt-1 text-gray-500">{s.sub}</div>
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
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    size="small"
                    // sx={{ flex: 1, maxWidth: 300 }}
                    // slotProps={{
                    //     input: {
                    //         startAdornment: (
                    //             <InputAdornment position="start">
                    //                 <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    //             </InputAdornment>
                    //         ),
                    //     },
                    // }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }} className="bg-white dark:bg-white-50">
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        label="Status"
                        sx={selectSx}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="processing">Processing</MenuItem>
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Table */}
            <div className="border border-gray-200 rounded-sm">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                <TableCell className="!font-bold">S No</TableCell>
                                <TableCell>Period</TableCell>
                                <TableCell  className="!font-bold">Employees</TableCell>
                                <TableCell  className="!font-bold" align="right">Gross Salary</TableCell>
                                <TableCell  className="!font-bold" align="right">Deductions</TableCell>
                                <TableCell  className="!font-bold" align="right">Net Salary</TableCell>
                                <TableCell  className="!font-bold">Status</TableCell>
                                <TableCell  className="!font-bold">Created By</TableCell>
                                <TableCell  className="!font-bold">Created On</TableCell>
                                <TableCell  className="!font-bold" align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                        <div className="py-8">No payroll runs found matching your filters.</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((run,i) => {
                                    const sc = statusConfig[run.status] ?? statusConfig.draft;
                                    const Icon = sc.icon;
                                    return (
                                        <TableRow
                                            key={run.id}
                                            sx={getRowColor(i)}
                                            onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                        >
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {i+1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600,color: "primary.main" }}>
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
                                                        "& .MuiChip-icon": { color: sc.color },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" className="text-gray-800">
                                                    {run.createdBy}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" className="text-gray-800">
                                                    {formatDate(run.createdOn)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Stack direction="row">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/payroll/runs/${run.id}`)}
                                                        sx={{ "&:hover": { color: "primary.main" } }}
                                                    >
                                                        <EyeIcon fontSize="small" className="text-primary"/>
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} runs
                    </Typography>
                    <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
                </Box>
            )}
        </div>
    );
}