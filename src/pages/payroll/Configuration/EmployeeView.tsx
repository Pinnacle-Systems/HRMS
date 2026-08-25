import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Avatar,
  LinearProgress,
  Grid,
  useTheme,
  alpha,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarSignIcon,
  Description as FileTextIcon,
  CreditCard as CreditCardIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, getCurrentMonthYear } from "../const";
import { salaryViewService } from "../../../services/modules/payrollServices/salaryView";
import { useUI } from "../../../context/Snackbar";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { formatDate } from "../../leave/leaveFormatters";
import { apiService } from "../../../services";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" className="bg-white p-4" hidden={value !== index} id={`salary-tabpanel-${index}`} aria-labelledby={`salary-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeSalaryView() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [tabValue, setTabValue] = useState(0);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // useEffect(() => {
  //   loadEmployees();
  // }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadSalaryView();
    } else {
      // Reset data when no employee is selected
      setSalaryData(null);
      setIsDataLoaded(false);
    }
  }, [selectedEmployee]);

  // const loadEmployees = async () => {
  //   setLoading(true);
  //   showSpinner();
  //   try {
  //     const response: any = await employeeService.getEmployees();
  //     const employeeList = (response.data?.content || []).map((employee: any) => ({
  //       id: employee.id,
  //       name: employee.name || employee.employeeName || employee.fullName,
  //       designation: employee.designation || employee.jobTitle,
  //       department: employee.department || employee.departmentName,
  //       ctc: employee.annualCtc || 0,
  //       grade: employee.grade || "A",
  //       employmentType: employee.employmentType || "Permanent",
  //       employeeCode: employee.employeeCode || employee.code,
  //     }));
  //     setEmployees(employeeList);
  //   } catch (error) {
  //     showSnackbar("Failed to load employee data", "error");
  //   } finally {
  //     hideSpinner();
  //     setLoading(false);
  //   }
  // };

  const loadSalaryView = async () => {
    if (!selectedEmployee) return;
    showSpinner();
    try {
      const response: any = await salaryViewService.getEmployeeSalaryView(selectedEmployee.id);
      const data = response.data?.data || response.data;
      setSalaryData(data);
      setIsDataLoaded(true);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load salary view", "error");
      setIsDataLoaded(false);
    } finally {
      hideSpinner();
    }
  };

  const handleDownloadPayslip = async (periodLabel?: string) => {
    if (!selectedEmployee) return;
    showSpinner();
    try {
      const response: any = await salaryViewService.downloadEmployeePayslip(selectedEmployee.id);
      const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;
      if (fileUrl) {
        await apiService.downloadFromPath(fileUrl, `payslip_${selectedEmployee.name}_${periodLabel}.pdf`);
      } else {
        showSnackbar("No payslip available for download", "warning");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to download payslip", "error");
    } finally {
      hideSpinner();
    }
  };

  // const employee = employees.find((e) => e.id === selectedEmployee?.id);
  const header = salaryData?.header || {};
  const structure = salaryData?.currentStructure || { earnings: [], deductions: [], grossSalary: 0, totalDeductions: 0, netTakeHome: 0 };
  const payrollHistory = salaryData?.payrollHistory || { ytdEarnings: 0, ytdDeductions: 0, ytdNet: 0, monthlyTrend: [], monthlyPayslips: [] };
  const loans = salaryData?.loans?.activeLoans || [];
  const taxSummary = salaryData?.taxSummary || { financialYear: "", grossAnnualIncome: 0, exemptionsDeductions: 0, netTaxableIncome: 0, taxComputed: 0, tdsDeducted: 0, balanceTaxPayable: 0 };

  return (
    <div className="bg-gray-50 min-h-screen pt-1">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800" sx={{ fontWeight: 600 }}>
            Employee Salary View
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Select an employee to view salary structure, payroll history, loans, and tax summary
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <div className="w-[280px]">
            <EmployeeSelector
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Search and select an employee..."
            />
          </div>
          {selectedEmployee && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={() => handleDownloadPayslip(getCurrentMonthYear())}
              sx={{ textTransform: "none", bgcolor: "primary.main" }}
            >
              Download Payslip
            </Button>
          )}
        </Box>
      </Box>

      {/* Show message when no employee is selected */}
      {!selectedEmployee && (
        <Card className="bg-white" sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          px: 4,
        }}>
          <SearchIcon className="text-gray-200 mb-4" />
          <Typography variant="h6" className="text-gray-500 !mb-2">
            Select an Employee
          </Typography>
          <Typography variant="body2" className="text-gray-500" sx={{ textAlign: "center", maxWidth: 400 }}>
            Please select an employee from the dropdown above to view their salary details, payroll history, loans, and tax summary.
          </Typography>
        </Card>
      )}

      {/* Show salary view when employee is selected */}
      {selectedEmployee && isDataLoaded && (
        <>
          {/* Employee Profile Card */}
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
                  {header.employeeName?.charAt(0) || "E"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gray-800">
                    {header.employeeName}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {header.designation || 'No Designation Assigned'} · {header.department || 'No department'}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                    <Chip label={`ID: ${header.employeeCode}`} size="small" variant="outlined" className="text-gray-800" />
                    <Chip label={`Grade: ${header.grade || 'No grade'}`} size="small" variant="outlined" className="text-gray-800" />
                    <Chip label={header.employmentType || 'N/A'} size="small" variant="outlined" className="text-gray-800" />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 4, textAlign: "right", flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Annual CTC
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} className="text-gray-800">
                      {formatCurrency(header.annualCtc)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Monthly Gross
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(header.monthlyGross || structure.grossSalary)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-gray-500">
                      Monthly Net
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(header.monthlyNet || header.netTakeHome)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box className="bg-white">
            <Tabs value={tabValue} className="border-b border-gray-200" onChange={(_, v) => setTabValue(v)} sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--color-primary)",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}>
              <Tab label="Current Structure" className="!text-gray-800" />
              <Tab label="Payroll History" className="!text-gray-800" />
              <Tab label="Loans & Advances" className="!text-gray-800" />
              <Tab label="Tax Summary" className="!text-gray-800" />
            </Tabs>
          </Box>

          {/* Tab 1: Current Structure */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="border border-green-500/50 rounded-md" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="bg-white-50" sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <TrendingUpIcon sx={{ color: "success.main" }} />
                      <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>
                        Earnings
                      </Typography>
                      <Chip label={`${structure.earnings?.length || 0} components`} size="small" className="text-gray-800" variant="outlined" sx={{ ml: 1 }} />
                    </Box>
                    <Stack spacing={0.5}>
                      {structure.earnings?.map((earning: any, index: number) => (
                        <Box key={earning.leaveTypeId || index}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1.5, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.04) } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Tooltip title={`${earning.leaveTypeCode || earning.componentCode || ""} · ${earning.leaveTypeName || earning.componentName || "Earning"}`}>
                                <InfoIcon className="text-gray-500 !w-4" />
                              </Tooltip>
                              <Typography variant="body2" className="text-gray-800">{earning.leaveTypeName || earning.componentName || earning.name || `Earning ${index + 1}`}</Typography>
                              {earning.days > 0 && <Chip label={`${earning.days} days`} size="small" variant="outlined" sx={{ fontSize: "10px", height: 20 }} />}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                              {formatCurrency(earning.amount)}
                            </Typography>
                          </Box>
                          {index < (structure.earnings?.length || 0) - 1 && <Divider className="border border-gray-200" sx={{ mx: 1.5 }} />}
                        </Box>
                      ))}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, mt: 1, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                          Gross Salary
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                          {formatCurrency(structure.grossSalary)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="border border-red-200 rounded-md" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent className="bg-white-50" sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      <DollarSignIcon sx={{ color: "error.main" }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} className="text-gray-800">
                        Deductions
                      </Typography>
                      <Chip label={`${structure.deductions?.length || 0} components`} size="small" variant="outlined" className="text-gray-800" sx={{ ml: 1 }} />
                    </Box>
                    <Stack spacing={0.5}>
                      {structure.deductions?.map((deduction: any, index: number) => (
                        <Box key={deduction.leaveTypeId || index}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1.5, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.04) } }}>
                            <Typography variant="body2" className="text-gray-800">{deduction.leaveTypeName || deduction.componentName || deduction.name || `Deduction ${index + 1}`}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                              - {formatCurrency(deduction.amount)}
                            </Typography>
                          </Box>
                          {index < (structure.deductions?.length || 0) - 1 && <Divider sx={{ mx: 1.5 }} className="border border-gray-200" />}
                        </Box>
                      ))}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, mt: 1, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                          Total Deductions
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                          - {formatCurrency(structure.totalDeductions)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body2" className="text-gray-500">
                      Net Take-Home Salary
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      After all deductions · Credited on 5th every month
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {formatCurrency(structure.netTakeHome)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 2: Payroll History */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {[
                { label: "YTD Earnings", value: payrollHistory.ytdEarnings || 0, color: "success.main", icon: TrendingUpIcon },
                { label: "YTD Deductions", value: payrollHistory.ytdDeductions || 0, color: "error.main", icon: DollarSignIcon },
                { label: "YTD Net Pay", value: payrollHistory.ytdNet || 0, color: "primary.main", icon: ReceiptIcon },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
                  <Card className="!bg-head" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <item.icon sx={{ fontSize: 20, color: item.color }} />
                        <Typography variant="caption" className="text-gray-800">
                          {item.label}
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                        {formatCurrency(item.value)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                  Monthly Trend
                </Typography>
                {payrollHistory.monthlyTrend?.length > 0 ? (
                  <div className="bg-white-50 !p-3">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={payrollHistory.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <ReTooltip formatter={(value: any) => [formatCurrency(value), ""]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="earnings" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 4 }} name="Earnings" />
                        <Line type="monotone" dataKey="deductions" stroke={theme.palette.error.main} strokeWidth={2} dot={{ r: 4 }} name="Deductions" />
                        <Line type="monotone" dataKey="net" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 4 }} name="Net Pay" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Typography variant="body2" className="text-gray-800">
                      No trend data available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="text-gray-800">
                  Monthly Payslips
                </Typography>
                <Stack spacing={1}>
                  {payrollHistory.monthlyPayslips?.length > 0 ? (
                    payrollHistory.monthlyPayslips.map((p: any, index: number) => {
                      // Create a unique key using multiple properties
                      const uniqueKey = p.runItemId || p.periodLabel || `payslip-${index}`;
                      // Or use combination for guaranteed uniqueness
                      const safeKey = `${p.periodLabel || 'payslip'}-${p.generatedOn || index}-${index}`;

                      return (
                        <Box
                          key={safeKey}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 1.5,
                            borderRadius: 1,
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                            transition: "background-color 0.2s"
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: theme.palette.grey[100],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <FileTextIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                                {p.periodLabel}
                              </Typography>
                              <Typography variant="caption" className="text-gray-800">
                                Gross: {formatCurrency(p.gross)} · Net: {formatCurrency(p.net)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption" className="text-gray-800">
                              {p.generatedOn ? formatDate(p.generatedOn) : ""}
                            </Typography>
                            <Button
                              variant="text"
                              size="small"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() => handleDownloadPayslip(p.periodLabel)}
                              sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            >
                              PDF
                            </Button>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <Typography variant="body2" className="text-gray-800">
                        No payslips available
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Loans & Advances */}
          <TabPanel value={tabValue} index={2}>
            <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                  Active Loans & Advances
                </Typography>
                <TableContainer className="bg-white-50 border border-gray-200 rounded-sm">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>EMI / Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Remaining</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <div className="py-6">
                              <CreditCardIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} className="text-gray-500" />
                              <Typography variant="body2" className="text-gray-800">
                                No loans or advances
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : loans.map((loan: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={loan.type || "Loan"}
                              size="small"
                              variant="outlined"
                              color={loan.type === "Home" ? "primary" : loan.type === "Vehicle" ? "secondary" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {loan.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(loan.total)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(loan.emiPerMonth)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" className="text-gray-800">
                              {loan.remainingMonths ? `${loan.remainingMonths} months` : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            {loan.progressPercent !== undefined ? (
                              <Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={loan.progressPercent}
                                  sx={{ height: 6, borderRadius: 3 }}
                                  color={loan.progressPercent > 70 ? "success" : loan.progressPercent > 40 ? "warning" : "error"}
                                />
                                <Typography variant="caption" className="text-gray-800">
                                  {loan.progressPercent}% repaid
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" className="text-gray-800">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 4: Tax Summary */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                      Tax Computation - {taxSummary.financialYear}
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.04) }}>
                        <Typography variant="body2" className="text-gray-800">
                          Gross Annual Income
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                          {formatCurrency(taxSummary.grossAnnualIncome)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                        <Typography variant="body2" className="text-gray-800">
                          Exemptions & Deductions
                        </Typography>
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                          - {formatCurrency(taxSummary.exemptionsDeductions)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                          Net Taxable Income
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {formatCurrency(taxSummary.netTaxableIncome)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="text-gray-800">
                      Tax Liability
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                        <Typography variant="body2" className="text-gray-800">
                          Tax Computed
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                          {formatCurrency(taxSummary.taxComputed)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 2, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                        <Typography variant="body2" className="text-gray-800">
                          TDS Deducted
                        </Typography>
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                          - {formatCurrency(taxSummary.tdsDeducted)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                          Balance Tax Payable
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                          {formatCurrency(taxSummary.balanceTaxPayable)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </>
      )}
    </div>
  );
}