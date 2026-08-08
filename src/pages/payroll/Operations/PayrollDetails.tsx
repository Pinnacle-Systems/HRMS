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
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { payrollRunsService } from "../../../services/modules/payrollServices/payrollRuns";
import { payslipsService } from "../../../services/modules/payrollServices/payslips";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";

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
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");

  useEffect(() => {
    loadRun();
  }, [id]);

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
        employeeId: item.employeeId || item.employeeCode,
        employeeCode: item.employeeCode,
        employeeName: item.employeeName || item.name,
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
      }));
      setRun(runData);
      setBreakdown(items);
      setPeriod(runData?.periodLabel || runData?.period || "Current period");
    } catch (error) {
      console.error("Failed to load payroll details", error);
      showSnackbar("Failed to load payroll details", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (employeeId: string) => {
    // try {
    //   const year = new Date().getFullYear();
    //   const month = new Date().getMonth() + 1;
    //   const res:any = await payslipsService.downloadPayslip(employeeId, year, month);
    //   window.open(res.data.fileUrl, "_blank");
    // } catch (error) {
    //   showSnackbar("Failed to download payslip", "error");
    // }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const runId = "Payroll run";
  const runPeriod = run?.periodLabel || run?.period || "Current period";
  const runStart = run?.startedAt || run?.createdAt || "-";
  // const runEnd = run?.finishedAt || run?.paymentDate || "-";
  const runEmployeeCount = run?.totalEmployees || run?.employeeCount || breakdown.length;
  const runGrossSalary = run?.totalGross || run?.grossSalary || 0;
  const runDeductions = run?.totalDeductions || run?.deductions || 0;
  const runNetSalary = run?.totalNetPay || run?.netSalary || 0;
  const isProcessed = (run?.status || "").toLowerCase() === "completed" || 
                      (run?.status || "").toLowerCase() === "approved";

  // Calculate totals from breakdown
  const totalBasic = breakdown.reduce((s, e) => s + (e.basic || 0), 0);
  const totalHRA = breakdown.reduce((s, e) => s + (e.hra || 0), 0);
  const totalConveyance = breakdown.reduce((s, e) => s + (e.conveyance || 0), 0);
  const totalSpecial = breakdown.reduce((s, e) => s + (e.special || 0), 0);
  const totalPF = breakdown.reduce((s, e) => s + (e.pf || 0), 0);
  const totalPT = breakdown.reduce((s, e) => s + (e.professionalTax || 0), 0);
  const totalTDS = breakdown.reduce((s, e) => s + (e.tds || 0), 0);
  const totalLoan = breakdown.reduce((s, e) => s + (e.loanAdvance || 0), 0);

  const earningRows = [
    { name: "Basic Salary", total: totalBasic, employees: breakdown.length },
    { name: "House Rent Allowance", total: totalHRA, employees: breakdown.length },
    { name: "Conveyance Allowance", total: totalConveyance, employees: breakdown.length },
    { name: "Special Allowance", total: totalSpecial, employees: breakdown.length },
  ];

  const deductionRows = [
    { name: "Provident Fund", total: totalPF, employees: breakdown.length, rate: "12% of Basic" },
    { name: "Professional Tax", total: totalPT, employees: breakdown.length, rate: "Slab" },
    { name: "TDS", total: totalTDS, employees: breakdown.length, rate: "Slab" },
    { name: "Loan/Advance", total: totalLoan, employees: breakdown.filter(e => e.loanAdvance > 0).length, rate: "Fixed" },
  ];

  const approvalHistory = [
    { step: "Payroll Generated", by: run?.createdBy || "System", on: run?.createdAt ? new Date(run.createdAt).toLocaleString() : "-", status: "done" },
    { step: "Processing", by: "System", on: run?.startedAt ? new Date(run.startedAt).toLocaleString() : "-", status: run?.status === "processing" ? "pending" : "done" },
    { step: "Completed", by: "System", on: run?.finishedAt ? new Date(run.finishedAt).toLocaleString() : "-", status: isProcessed ? "done" : "pending" },
  ];

  // if (loading) {
  //   return (
  //     <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

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
            <ArrowLeftIcon fontSize="small" className="text-gray-800"/>
          </IconButton>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {runId}
              </Typography>
              <Chip
                icon={<CheckCircleIcon fontSize="small" color={isProcessed ? 'success' : 'warning' }/>}
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className="border-b border-gray-200"
          sx={{
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
                sx={{ textTransform: "none" }}
              >
                Export All
              </Button>
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === "breakdown" && (
       
            <TableContainer className="border border-gray-200 rounded-sm h-[calc(100vh-320px)]">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold">S No</TableCell>
                    <TableCell className="!font-bold">Employee ID</TableCell>
                    <TableCell className="!font-bold">Name</TableCell>
                    <TableCell className="!font-bold">Department</TableCell>
                    <TableCell className="!font-bold">Designation</TableCell>
                    <TableCell className="!font-bold" align="right">Gross</TableCell>
                    <TableCell className="!font-bold" align="right">Deductions</TableCell>
                    <TableCell className="!font-bold" align="right">Net</TableCell>
                    <TableCell className="!font-bold" align="center">Payslip</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <div className="text-gray-500 py-6">No employees found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    breakdown.map((emp,i) => (
                      <TableRow key={emp.employeeId} sx={getRowColor(i)}>
                        <TableCell>{i+1}</TableCell>
                        <TableCell>
                          {/* <Typography variant="caption"> */}
                            {emp.employeeCode}
                          {/* </Typography> */}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {/* <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                                fontSize: "0.65rem",
                                fontWeight: 600,
                              }}
                            >
                              {emp.employeeName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </Avatar> */}
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
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                            {formatCurrency(emp.netSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="text"
                            size="small"
                            startIcon={<FileTextIcon fontSize="small" />}
                            onClick={() => navigate(`/payroll/payslips/${emp.employeeId}/${encodeURIComponent(period)}`)}
                            sx={{ textTransform: "none", fontSize: "0.7rem" }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

      )}

      {activeTab === "earnings" && (
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Earnings Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Avg per Employee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earningRows.map((r) => (
                    <TableRow key={r.name} hover>
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
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {r.employees > 0 ? formatCurrency(Math.round(r.total / r.employees)) : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total Earnings
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {breakdown.length}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(earningRows.reduce((s, r) => s + r.total, 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {breakdown.length > 0 ? formatCurrency(Math.round(earningRows.reduce((s, r) => s + r.total, 0) / breakdown.length)) : "-"}
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
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Deductions Breakdown
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>Component</TableCell>
                    <TableCell>Rate / Rule</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductionRows.map((r) => (
                    <TableRow key={r.name} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
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
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {t.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Detailed tax computation per employee is available in the Employee Breakdown tab.
              Tax summary is based on declared investments as of the payroll date.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === "summary" && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Payroll Summary
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: "Period", value: runPeriod },
                    { label: "Total Employees", value: runEmployeeCount.toString() },
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
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {r.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {r.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Department Distribution
                </Typography>
                <Stack spacing={1.5}>
                  {(() => {
                    const deptMap = breakdown.reduce((acc: any, emp) => {
                      acc[emp.department] = (acc[emp.department] || 0) + emp.netSalary;
                      return acc;
                    }, {});
                    const deptData = Object.entries(deptMap).map(([dept, total]) => ({
                      dept,
                      count: breakdown.filter(e => e.department === dept).length,
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
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {d.dept}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              ({d.count} emp)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                            {formatCurrency(d.net)}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
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
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {h.step}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
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