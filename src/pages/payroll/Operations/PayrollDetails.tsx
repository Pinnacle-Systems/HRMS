import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Tab,
  Tabs,
  Avatar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as ArrowLeftIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  People as UsersIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Description as FileTextIcon,
  BarChart as BarChart3Icon,
  History as HistoryIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";

const normalizeCollection = (response: any) => {
  const payload = response?.data ?? response;
  const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
  const collection = candidates.find(Array.isArray);
  return Array.isArray(collection) ? collection : [];
};

const TABS = [
  { id: "breakdown", label: "Employee Breakdown", icon: UsersIcon },
  { id: "earnings", label: "Earnings", icon: TrendingUpIcon },
  { id: "deductions", label: "Deductions", icon: TrendingDownIcon },
  { id: "taxes", label: "Taxes", icon: BarChart3Icon },
  { id: "summary", label: "Summary", icon: FileTextIcon },
  { id: "history", label: "Approval History", icon: HistoryIcon },
];

export default function PayrollDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [activeTab, setActiveTab] = useState("breakdown");
  const [run, setRun] = useState<any | null>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [filteredBreakdown, setFilteredBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [paginatedBreakdown, setPaginatedBreakdown] = useState<any[]>([]);

  useEffect(() => {
    loadRun();
  }, [id]);

  useEffect(() => {
    // Apply filter
    let filtered = breakdown;
    if (filterStatus) {
      filtered = breakdown.filter(item =>
        item.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    setFilteredBreakdown(filtered);
    setTotal(filtered.length);
    setPage(0);
  }, [breakdown, filterStatus]);

  useEffect(() => {
    const start = page * limit;
    const end = start + limit;
    setPaginatedBreakdown(filteredBreakdown.slice(start, end));
  }, [filteredBreakdown, page, limit]);

  const loadRun = async () => {
    if (!id) return;
    setLoading(true);
    showSpinner();
    try {
      const [runResponse, itemsResponse]: any = await Promise.all([
        payrollRunsService.getPayrollRunById(id),
        payrollRunsService.getPayrollRunItems(id, { size: 100 }),
      ]);
      const runData = runResponse?.data ?? runResponse;
      const items = normalizeCollection(itemsResponse).map((item: any) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeCode: item.employeeCode,
        employeeName: item.employeeName || item.name,
        status: item.status,
        errorMessage: item.errorMessage,
        department: item.department || "General",
        designation: item.designation || "Employee",
        grossSalary: item.gross || item.grossSalary || 0,
        deductions: item.totalDeductions || item.deductions || 0,
        netSalary: item.netPay || item.netSalary || 0,
        basic: item.basic || 0,
        hra: item.hra || 0,
        conveyance: item.conveyance || 0,
        special: item.special || 0,
        pf: item.pf || 0,
        professionalTax: item.professionalTax || 0,
        tds: item.tds || 0,
        loanAdvance: item.loanAdvance || 0,
        lopDays: item.lopDays || 0,
        lopAmount: item.lopAmount || 0,
        otherDeductions: item.otherDeductions || 0,
        payslipId: item.payslipId
      }));
      setRun(runData);
      setBreakdown(items);
      setFilteredBreakdown(items);
      setTotal(items.length);
      setPeriod(runData?.periodLabel || runData?.period || "Current period");
      setPage(0);
      setFilterStatus(null);
    } catch (error) {
      console.error("Failed to load payroll details", error);
      showSnackbar("Failed to load payroll details", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleFilterClick = (status: string) => {
    if (filterStatus === status) {
      // If clicking the same filter, clear it
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
  };

  const clearFilter = () => {
    setFilterStatus(null);
  };

  const getStatusChip = (status: string, errorMessage?: string) => {
    const statusLower = status?.toLowerCase() || "";

    if (statusLower === "processed" || statusLower === "completed") {
      return (
        <Chip
          label="Processed"
          size="small"
          icon={<CheckCircleIcon fontSize="small" color="success"/>}
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            fontWeight: 500,
          }}
        />
      );
    } else if (statusLower === "failed") {
      return (
        <Tooltip title={errorMessage || "Processing failed"} arrow>
          <Chip
            label="Failed"
            size="small"
            icon={<ErrorIcon fontSize="small" color="error"/>}
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              fontWeight: 500,
              cursor: "pointer",
            }}
          />
        </Tooltip>
      );
    } else if (statusLower === "pending") {
      return (
        <Chip
          label="Pending"
          size="small"
          icon={<WarningIcon fontSize="small" color="warning"/>}
          sx={{
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.main,
            fontWeight: 500,
          }}
        />
      );
    }
    return null;
  };

  const runId = "Payroll run";
  const runPeriod = run?.periodLabel || run?.period || "Current period";
  const runStart = run?.startedAt || run?.createdAt || "-";
  const runEmployeeCount = run?.totalEmployees || run?.employeeCount || breakdown.length;
  const runGrossSalary = run?.totalGross || run?.grossSalary || 0;
  const runDeductions = run?.totalDeductions || run?.deductions || 0;
  const runNetSalary = run?.totalNetPay || run?.netSalary || 0;
  const isProcessed = (run?.status || "").toLowerCase() === "completed" ||
    (run?.status || "").toLowerCase() === "approved";

  // Calculate processed and failed counts
  const processedCount = breakdown.filter(e => e.status?.toLowerCase() === "processed").length;
  const failedCount = breakdown.filter(e => e.status?.toLowerCase() === "failed").length;

  // Calculate totals from breakdown (only for processed employees)
  const processedBreakdown = breakdown.filter(e => e.status?.toLowerCase() === "processed");
  const totalBasic = processedBreakdown.reduce((s, e) => s + (e.basic || 0), 0);
  const totalHRA = processedBreakdown.reduce((s, e) => s + (e.hra || 0), 0);
  const totalConveyance = processedBreakdown.reduce((s, e) => s + (e.conveyance || 0), 0);
  const totalSpecial = processedBreakdown.reduce((s, e) => s + (e.special || 0), 0);
  const totalPF = processedBreakdown.reduce((s, e) => s + (e.pf || 0), 0);
  const totalPT = processedBreakdown.reduce((s, e) => s + (e.professionalTax || 0), 0);
  const totalTDS = processedBreakdown.reduce((s, e) => s + (e.tds || 0), 0);
  const totalLoan = processedBreakdown.reduce((s, e) => s + (e.loanAdvance || 0), 0);

  const earningRows = [
    { name: "Basic Salary", total: totalBasic, employees: processedBreakdown.length },
    { name: "House Rent Allowance", total: totalHRA, employees: processedBreakdown.length },
    { name: "Conveyance Allowance", total: totalConveyance, employees: processedBreakdown.length },
    { name: "Special Allowance", total: totalSpecial, employees: processedBreakdown.length },
  ];

  const deductionRows = [
    { name: "Provident Fund", total: totalPF, employees: processedBreakdown.length, rate: "12% of Basic" },
    { name: "Professional Tax", total: totalPT, employees: processedBreakdown.length, rate: "Slab" },
    { name: "TDS", total: totalTDS, employees: processedBreakdown.length, rate: "Slab" },
    { name: "Loan/Advance", total: totalLoan, employees: processedBreakdown.filter(e => e.loanAdvance > 0).length, rate: "Fixed" },
  ];

  const approvalHistory = [
    { step: "Payroll Generated", by: run?.createdBy || "System", on: run?.createdAt ? new Date(run.createdAt).toLocaleString() : "-", status: "done" },
    { step: "Processing", by: "System", on: run?.startedAt ? new Date(run.startedAt).toLocaleString() : "-", status: run?.status === "processing" ? "pending" : "done" },
    { step: "Completed", by: "System", on: run?.finishedAt ? new Date(run.finishedAt).toLocaleString() : "-", status: isProcessed ? "done" : "pending" },
  ];

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <IconButton
            onClick={() => navigate("/payroll/runs")}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            <ArrowLeftIcon fontSize="small" className="text-gray-800" />
          </IconButton>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {runId}
              </Typography>
              <Chip
                icon={<CheckCircleIcon fontSize="small" color={isProcessed ? 'success' : 'warning'} />}
                label={(run?.status || "Pending").charAt(0).toUpperCase() + (run?.status || "Pending").slice(1)}
                sx={{
                  bgcolor: isProcessed ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                  color: isProcessed ? theme.palette.success.main : theme.palette.warning.main,
                  fontWeight: 500,
                }}
              />
            </Box>
            <Typography variant="body2" className="text-gray-500 mt-2">
              Payroll Period: {runPeriod} &nbsp;|&nbsp; Started: {runStart} &nbsp;|&nbsp; Created by {run?.createdBy || "System"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
            className="!text-primary !border-primary"
          >
            Download Report
          </Button>
          {!isProcessed && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon fontSize="small" />}
              sx={{ textTransform: "none" }}
              className="!bg-primary"
            >
              Approve Payroll
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 1 }}>
        {[
          { label: "Employees Processed", value: runEmployeeCount.toLocaleString(), icon: UsersIcon, color: theme.palette.primary.main },
          { label: "Gross Salary", value: formatCurrency(runGrossSalary), icon: TrendingUpIcon, color: theme.palette.success.main },
          { label: "Total Deductions", value: formatCurrency(runDeductions), icon: TrendingDownIcon, color: theme.palette.error.main },
          { label: "Net Payable", value: formatCurrency(runNetSalary), icon: CheckCircleIcon, color: theme.palette.primary.main },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(s.color, 0.1),
                    color: s.color,
                  }}
                >
                  <s.icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" className="text-gray-800">
                    {s.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} className="text-gray-500">
                    {s.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Status Filter Chips */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="caption" className="text-gray-500 !font-bold">
          Filter by:
        </Typography>
        <Chip
          label={`Processed (${processedCount})`}
          onClick={() => handleFilterClick("processed")}
          onDelete={filterStatus === "processed" ? clearFilter : undefined}
          sx={{
            bgcolor: filterStatus === "processed"
              ? theme.palette.success.main
              : alpha(theme.palette.success.main, 0.1),
            color: filterStatus === "processed"
              ? "#fff"
              : theme.palette.success.main,
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": {
              bgcolor: filterStatus === "processed"
                ? theme.palette.success.dark
                : alpha(theme.palette.success.main, 0.2),
            },
            ...(filterStatus === "processed" && {
              "& .MuiChip-deleteIcon": {
                color: "#fff",
                "&:hover": {
                  color: "rgba(255,255,255,0.7)",
                },
              },
            }),
          }}
        />
        <Chip
          label={`Failed (${failedCount})`}
          onClick={() => handleFilterClick("failed")}
          onDelete={filterStatus === "failed" ? clearFilter : undefined}
          sx={{
            bgcolor: filterStatus === "failed"
              ? theme.palette.error.main
              : alpha(theme.palette.error.main, 0.1),
            color: filterStatus === "failed"
              ? "#fff"
              : theme.palette.error.main,
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": {
              bgcolor: filterStatus === "failed"
                ? theme.palette.error.dark
                : alpha(theme.palette.error.main, 0.2),
            },
            ...(filterStatus === "failed" && {
              "& .MuiChip-deleteIcon": {
                color: "#fff",
                "&:hover": {
                  color: "rgba(255,255,255,0.7)",
                },
              },
            }),
          }}
        />
        <Chip
          label={`All (${breakdown.length})`}
          onClick={() => clearFilter()}
          sx={{
            bgcolor: !filterStatus
              ? theme.palette.primary.main
              : alpha(theme.palette.primary.main, 0.1),
            color: !filterStatus
              ? "#fff"
              : theme.palette.primary.main,
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": {
              bgcolor: !filterStatus
                ? theme.palette.primary.dark
                : alpha(theme.palette.primary.main, 0.2),
            },
          }}
        />
        {filterStatus && (
          <Typography variant="caption" className="text-gray-500 ml-1 !mt-1">
            Showing {filterStatus} employees ({filteredBreakdown.length})
          </Typography>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="standard"
          scrollButtons="auto"
          className="border-b border-gray-200"
          sx={{
            "& .MuiTabs-list": {
              alignItems: "center",
              display: "flex",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 48,
              px: 2,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={<tab.icon fontSize="small" />}
              iconPosition="start"
              className="!text-gray-800"
            />
          ))}
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon fontSize="small" />}
            className="!max-h-[35px] !ml-4"
          >
            Export All
          </Button>
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === "breakdown" && (
        <>
          <TableContainer className="border border-gray-200 rounded-sm h-[calc(100vh-405px)]">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold sticky left-0 !z-40">S No</TableCell>
                  <TableCell className="!font-bold sticky left-[60px] !z-40">Employee ID</TableCell>
                  <TableCell className="!font-bold">Name</TableCell>
                  <TableCell className="!font-bold">Department</TableCell>
                  <TableCell className="!font-bold">Designation</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell className="!font-bold" align="right">Gross</TableCell>
                  <TableCell className="!font-bold" align="right">Deductions</TableCell>
                  <TableCell className="!font-bold" align="right">Net</TableCell>
                  <TableCell className="!font-bold sticky right-0 !z-40" align="center">Payslip</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <div className="text-gray-500 py-6">
                        {filterStatus
                          ? `No ${filterStatus} employees found`
                          : "No employees found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBreakdown.map((emp, i) => (
                    <TableRow
                      key={emp.id || emp.employeeId}
                      sx={{
                        ...getRowColor(i),
                        bgcolor: emp.status?.toLowerCase() === "failed"
                          ? alpha(theme.palette.error.main, 0.04)
                          : undefined,
                      }}
                    >
                      <TableCell className="sticky left-0 z-30 bg-inherit">{page * limit + i + 1}</TableCell>
                      <TableCell className="sticky left-[60px] z-30 bg-inherit">
                        {emp.employeeCode}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {emp.employeeName}
                          </Typography>
                        </Box>
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
                      <TableCell>
                        {getStatusChip(emp.status, emp.errorMessage)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(emp.grossSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: "error.main" }}>
                          {formatCurrency(emp.deductions)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: emp.status?.toLowerCase() === "failed" ? "error.main" : "success.main" }}>
                          {emp.status?.toLowerCase() === "failed" ? "-" : formatCurrency(emp.netSalary)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" className="sticky right-0 z-30 bg-inherit">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<FileTextIcon fontSize="small" />}
                          onClick={() => navigate(`/payroll/payslips/${emp.payslipId}/${encodeURIComponent(period)}`)}
                          sx={{ textTransform: "none", fontSize: "0.7rem" }}
                          disabled={emp.status?.toLowerCase() === "failed"}
                        >
                          {emp.status?.toLowerCase() === "failed" ? "N/A" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {total > 0 && (
            <GlobalPagination
              total={total}
              page={page + 1}
              limit={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              pageSizeOptions={[10, 20, 50, 100]}
              showTotal={true}
            />
          )}
        </>
      )}

      {activeTab === "earnings" && (
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                Earnings Breakdown
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                (Only for processed employees)
              </Typography>
            </Box>
            <TableContainer className="m-4 border border-gray-200 rounded-md !w-[600px]">
              <Table stickyHeader className="w-[200px]">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Avg per Employee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningRows.map((r,i) => (
                    <TableRow key={r.name} sx={getRowColor(i)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{r.employees}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(r.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" className="text-gray-800">
                          {r.employees > 0 ? formatCurrency(Math.round(r.total / r.employees)) : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-100/50">
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Earnings
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {processedBreakdown.length}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(earningRows.reduce((s, r) => s + r.total, 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" className="text-gray-800 !font-bold">
                        {processedBreakdown.length > 0 ? formatCurrency(Math.round(earningRows.reduce((s, r) => s + r.total, 0) / processedBreakdown.length)) : "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "deductions" && (
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                Deductions Breakdown
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                (Only for processed employees)
              </Typography>
            </Box>
            <TableContainer className="m-4 border border-gray-200 rounded-md !w-[600px]">
              <Table stickyHeader className="">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Rate / Rule</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductionRows.map((r,i) => (
                    <TableRow key={r.name} sx={getRowColor(i)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-gray-800">
                          {r.rate}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{r.employees}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                          {formatCurrency(r.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-100/50">
                    <TableCell colSpan={3}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Deductions
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                        {formatCurrency(deductionRows.reduce((s, r) => s + r.total, 0))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === "taxes" && (
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { label: "Income Tax (TDS)", value: formatCurrency(totalTDS) },
                { label: "Professional Tax", value: formatCurrency(totalPT) },
                { label: "PF (Employee Share)", value: formatCurrency(totalPF) },
              ].map((t) => (
                <Grid size={{ xs: 12, sm: 4 }} key={t.label}>
                  <Paper
                    sx={{
                      p: 2.5,
                      textAlign: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" className="text-gray-800">
                      {t.label}
                    </Typography>
                    <Typography variant="h6" className="text-gray-800" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {t.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" className="text-gray-800">
              Detailed tax computation per employee is available in the Employee Breakdown tab.
              Tax summary is based on declared investments as of the payroll date.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === "summary" && (
        <Grid container spacing={3} className="mb-5">
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                  Payroll Summary
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: "Period", value: runPeriod },
                    { label: "Total Employees", value: runEmployeeCount.toString() },
                    { label: "Processed", value: processedCount.toString() },
                    { label: "Failed", value: failedCount.toString() },
                    { label: "Gross Payable", value: formatCurrency(runGrossSalary) },
                    { label: "Total Deductions", value: formatCurrency(runDeductions) },
                    { label: "Net Payable", value: formatCurrency(runNetSalary) },
                    { label: "Payment Date", value: run?.paymentDate || "-" },
                    { label: "Status", value: (run?.status || "PENDING").toUpperCase() },
                  ].map((r) => (
                    <Box
                      key={r.label}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Typography variant="body2" className="text-gray-500 !font-bold">
                        {r.label}
                      </Typography>
                      <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                        {r.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                  Department Distribution
                </Typography>
                <Stack spacing={1.5}>
                  {(() => {
                    const deptMap = processedBreakdown.reduce((acc: any, emp) => {
                      acc[emp.department] = (acc[emp.department] || 0) + emp.netSalary;
                      return acc;
                    }, {});
                    const deptData = Object.entries(deptMap).map(([dept, total]) => ({
                      dept,
                      count: processedBreakdown.filter(e => e.department === dept).length,
                      net: total as number,
                    }));
                    return deptData.length > 0 ? (
                      deptData.map((d) => (
                        <Box
                          key={d.dept}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 1,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Box>
                            <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                              {d.dept}
                            </Typography>
                            <Typography variant="caption" className="text-gray-800">
                              ({d.count} emp)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                            {formatCurrency(d.net)}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" className="text-gray-500" sx={{ textAlign: "center" }}>
                        No department data available
                      </Typography>
                    );
                  })()}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === "history" && (
        <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={0}>
              {approvalHistory.map((h, i) => (
                <Box key={h.step} sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: h.status === "done" ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                        border: `2px solid ${h.status === "done" ? theme.palette.success.main : theme.palette.warning.main}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, color: h.status === "done" ? "success.main" : "warning.main" }} />
                    </Box>
                    {i < approvalHistory.length - 1 && (
                      <Box sx={{ width: 2, height: 40, bgcolor: h.status === "done" ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.warning.main, 0.3) }} />
                    )}
                  </Box>
                  <Box sx={{ pb: 3 }}>
                    <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                      {h.step}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500" sx={{ display: "block", mt: 0.25 }}>
                      By <strong>{h.by}</strong> — {h.on}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </div>
  );
}