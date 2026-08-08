// import { useEffect, useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Tabs,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TableContainer,
//   Chip,
//   Avatar,
//   LinearProgress,
//   Select,
//   MenuItem,
//   FormControl,
//   Grid,
//   useTheme,
//   alpha,
//   Stack,
//   Divider,
//   Tooltip,
// } from "@mui/material";
// import {
//   Download as DownloadIcon,
//   TrendingUp as TrendingUpIcon,
//   AttachMoney as DollarSignIcon,
//   Description as FileTextIcon,
//   CreditCard as CreditCardIcon,
//   Lightbulb as LightbulbIcon,
//   Favorite as HeartIcon,
//   Info as InfoIcon,
// } from "@mui/icons-material";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip as ReTooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";
// import { formatCurrency } from "../const";

// import { employeeService } from "../../../services/modules/employees";
// import { salaryViewService } from "../../../services/modules/payrollServices/salaryView";
// import { employeeDeductionsService } from "../../../services/modules/payrollServices/deductions";

// const normalizeCollection = (response: any) => {
//   const payload = response?.data ?? response;
//   const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
//   const collection = candidates.find(Array.isArray);
//   return Array.isArray(collection) ? collection : [];
// };

// interface TabPanelProps {
//   children?: React.ReactNode;
//   index: number;
//   value: number;
// }

// function TabPanel(props: TabPanelProps) {
//   const { children, value, index, ...other } = props;
//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`salary-tabpanel-${index}`}
//       aria-labelledby={`salary-tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
//     </div>
//   );
// }

// export default function EmployeeSalaryView() {
//   const theme = useTheme();
//   const [selectedEmployee, setSelectedEmployee] = useState("");
//   const [tabValue, setTabValue] = useState(0);
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [salaryData, setSalaryData] = useState<any>(null);
//   const [deductions, setDeductions] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         const [employeesResponse, deductionsResponse] = await Promise.all([
//           employeeService.getEmployees(),
//           employeeDeductionsService.getEmployeeDeductions(),
//         ]);
//         const employeeList = normalizeCollection(employeesResponse).map((employee: any) => ({
//           id: employee.id || employee.employeeId,
//           name: employee.name || employee.employeeName || employee.fullName,
//           designation: employee.designationName || employee.designation || "Employee",
//           department: employee.departmentName || employee.department || "General",
//           ctc: employee.ctc || employee.annualCtc || 0,
//           grade: employee.grade || "A",
//           employmentType: employee.employmentType || "Permanent",
//         }));
//         const deductionList = normalizeCollection(deductionsResponse).map((deduction: any) => ({
//           id: deduction.id || deduction.deductionId,
//           employeeId: deduction.employeeId || deduction.empId,
//           type: deduction.type || "loan",
//           name: deduction.name || deduction.typeLabel || "Deduction",
//           amount: deduction.monthlyAmount || deduction.amount || 0,
//           installments: deduction.totalInstallments || deduction.installments || 0,
//         }));
//         setEmployees(employeeList);
//         setDeductions(deductionList);
//         if (!selectedEmployee && employeeList.length) {
//           const firstEmployee = employeeList[0];
//           setSelectedEmployee(firstEmployee.id);
//         }
//         setError("");
//       } catch (err) {
//         console.error("Failed to load employee salary view data", err);
//         setError("Unable to load employee salary data right now.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   useEffect(() => {
//     const loadSalaryView = async () => {
//       if (!selectedEmployee) return;
//       try {
//         const response = await salaryViewService.getEmployeeSalaryView(selectedEmployee);
//         setSalaryData(response?.data ?? response);
//       } catch (err) {
//         console.error("Failed to load salary view", err);
//       }
//     };

//     loadSalaryView();
//   }, [selectedEmployee]);

//   const employee = employees.find((e) => e.id === selectedEmployee);
//   const taxDeclaration = salaryData?.taxSummary;
//   const employeeDeductions = deductions.filter((d) => d.employeeId === selectedEmployee);

//   if (!employee) return null;

//   const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
//     setTabValue(newValue);
//   };

//   const currencyFormatter = (value: any): [string, string] => {
//   if (typeof value === 'number') {
//     return [formatCurrency(value), "Amount"];
//   }
//   return [String(value || 0), "Amount"];
// };

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {loading ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>Loading employee salary data…</Box>
//       ) : error ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>{error}</Box>
//       ) : (
//       <>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
//             Employee Salary View
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//             Salary structure, payroll history, loans, and tax summary
//           </Typography>
//         </Box>
//         <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
//           <FormControl size="small" sx={{ minWidth: 200 }}>
//             <Select
//               value={selectedEmployee}
//               onChange={(e) => setSelectedEmployee(e.target.value)}
//               displayEmpty
//             >
//               {employees.map((emp) => (
//                 <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//           <Button
//             variant="contained"
//             startIcon={<DownloadIcon fontSize="small" />}
//             sx={{ textTransform: "none" }}
//           >
//             Download Payslip
//           </Button>
//         </Box>
//       </Box>

//       {/* Employee Profile Card */}
//       <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
//         <CardContent sx={{ p: 3 }}>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
//             <Avatar
//               sx={{
//                 width: 64,
//                 height: 64,
//                 bgcolor: alpha(theme.palette.primary.main, 0.1),
//                 color: "primary.main",
//                 fontSize: "1.5rem",
//                 fontWeight: 700,
//               }}
//             >
//               {employee.name.charAt(0)}
//             </Avatar>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                 {employee.name}
//               </Typography>
//               <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                 {employee.designation} · {employee.department}
//               </Typography>
//               <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
//                 <Chip label={employee.id} size="small" variant="outlined" />
//                 <Chip label={`Grade ${employee.grade}`} size="small" variant="outlined" />
//                 <Chip label={employee.employmentType} size="small" variant="outlined" />
//               </Box>
//             </Box>
//             <Box sx={{ display: "flex", gap: 4, textAlign: "right", flexWrap: "wrap" }}>
//               <Box>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                   Annual CTC
//                 </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 700 }}>
//                   {formatCurrency(employee.ctc)}
//                 </Typography>
//               </Box>
//               <Box>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                   Monthly Gross
//                 </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
//                   {formatCurrency(payslip.grossSalary)}
//                 </Typography>
//               </Box>
//               <Box>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                   Monthly Net
//                 </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
//                   {formatCurrency(payslip.netSalary)}
//                 </Typography>
//               </Box>
//             </Box>
//           </Box>
//         </CardContent>
//       </Card>

//       {/* Tabs */}
//       <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
//         <Tabs value={tabValue} onChange={handleTabChange} aria-label="salary tabs">
//           <Tab label="Current Structure" />
//           <Tab label="Payroll History" />
//           <Tab label="Loans & Advances" />
//           <Tab label="Tax Summary" />
//         </Tabs>
//       </Box>

//       {/* Tab 1: Structure */}
//       <TabPanel value={tabValue} index={0}>
//         <Grid container spacing={3}>
//           <Grid size={{ xs: 12, md: 6 }}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
//                   <TrendingUpIcon sx={{ color: "success.main" }} />
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                     Earnings
//                   </Typography>
//                 </Box>
//                 <Stack spacing={1}>
//                   {payslip.earnings.map((earning, index) => (
//                     <Box key={index}>
//                       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.04) } }}>
//                         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                           <Tooltip title="Taxable component · Monthly">
//                             <InfoIcon sx={{ fontSize: 14, color: "text.secondary" }} />
//                           </Tooltip>
//                           <Typography variant="body2">{earning.name}</Typography>
//                         </Box>
//                         <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
//                           {formatCurrency(earning.amount)}
//                         </Typography>
//                       </Box>
//                       {index < payslip.earnings.length - 1 && <Divider />}
//                     </Box>
//                   ))}
//                   <Box
//                     sx={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       p: 2,
//                       mt: 1,
//                       borderRadius: 1,
//                       bgcolor: alpha(theme.palette.success.main, 0.08),
//                       fontWeight: 600,
//                     }}
//                   >
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       Gross Salary
//                     </Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
//                       {formatCurrency(payslip.grossSalary)}
//                     </Typography>
//                   </Box>
//                 </Stack>
//               </CardContent>
//             </Card>
//           </Grid>

//           <Grid size={{ xs: 12, md: 6 }}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
//                   <DollarSignIcon sx={{ color: "error.main" }} />
//                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                     Deductions
//                   </Typography>
//                 </Box>
//                 <Stack spacing={1}>
//                   {payslip.deductions.map((deduction, index) => (
//                     <Box key={index}>
//                       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.04) } }}>
//                         <Typography variant="body2">{deduction.name}</Typography>
//                         <Typography variant="body2" sx={{ color: "error.main" }}>
//                           - {formatCurrency(deduction.amount)}
//                         </Typography>
//                       </Box>
//                       {index < payslip.deductions.length - 1 && <Divider />}
//                     </Box>
//                   ))}
//                   <Box
//                     sx={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       p: 2,
//                       mt: 1,
//                       borderRadius: 1,
//                       bgcolor: alpha(theme.palette.error.main, 0.08),
//                       fontWeight: 600,
//                     }}
//                   >
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       Total Deductions
//                     </Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
//                       - {formatCurrency(payslip.deductions.reduce((s, d) => s + d.amount, 0))}
//                     </Typography>
//                   </Box>
//                 </Stack>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//           <CardContent sx={{ p: 3 }}>
//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
//               <Box>
//                 <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                   Net Take-Home Salary
//                 </Typography>
//                 <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
//                   After all deductions · Credited on 5th every month
//                 </Typography>
//               </Box>
//               <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
//                 {formatCurrency(payslip.netSalary)}
//               </Typography>
//             </Box>
//           </CardContent>
//         </Card>
//       </TabPanel>

//       {/* Tab 2: History */}
//       <TabPanel value={tabValue} index={1}>
//         <Grid container spacing={3}>
//           {[
//             { label: "YTD Earnings", value: payslip.ytdEarnings, color: "success.main", bgColor: alpha(theme.palette.success.main, 0.08) },
//             { label: "YTD Deductions", value: payslip.ytdDeductions, color: "error.main", bgColor: alpha(theme.palette.error.main, 0.08) },
//             { label: "YTD Net Pay", value: payslip.ytdEarnings - payslip.ytdDeductions, color: "primary.main", bgColor: alpha(theme.palette.primary.main, 0.08) },
//           ].map((item) => (
//             <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
//               <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", bgcolor: item.bgColor }}>
//                 <CardContent sx={{ p: 2.5 }}>
//                   <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                     {item.label}
//                   </Typography>
//                   <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
//                     {formatCurrency(item.value)}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>

//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
//           <CardContent sx={{ p: 2.5 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//               Monthly Trend (Jan – Jun 2026)
//             </Typography>
//             <ResponsiveContainer width="100%" height={240}>
//               <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
//                 <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
//                 <ReTooltip  formatter={currencyFormatter}  />
//                 <Legend wrapperStyle={{ fontSize: 12 }} />
//                 <Line type="monotone" dataKey="earnings" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} name="Earnings" />
//                 <Line type="monotone" dataKey="deductions" stroke={theme.palette.error.main} strokeWidth={2} dot={{ r: 3 }} name="Deductions" />
//                 <Line type="monotone" dataKey="net" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 3 }} name="Net Pay" />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
//           <CardContent sx={{ p: 2.5 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//               Monthly Payslips
//             </Typography>
//             <Stack spacing={1}>
//               {months.map((month) => (
//                 <Box
//                   key={month}
//                   sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     p: 1.5,
//                     borderRadius: 1,
//                     "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
//                     transition: "background-color 0.2s",
//                   }}
//                 >
//                   <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//                     <Box
//                       sx={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: 1,
//                         bgcolor: theme.palette.grey[100],
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <FileTextIcon sx={{ fontSize: 16, color: "text.secondary" }} />
//                     </Box>
//                     <Box>
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         {month}
//                       </Typography>
//                       <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                         Net: {formatCurrency(payslip.netSalary)}
//                       </Typography>
//                     </Box>
//                   </Box>
//                   <Button
//                     variant="text"
//                     size="small"
//                     startIcon={<DownloadIcon fontSize="small" />}
//                     sx={{ textTransform: "none", fontSize: "0.75rem" }}
//                   >
//                     PDF
//                   </Button>
//                 </Box>
//               ))}
//             </Stack>
//           </CardContent>
//         </Card>
//       </TabPanel>

//       {/* Tab 3: Loans */}
//       <TabPanel value={tabValue} index={2}>
//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//           <CardContent sx={{ p: 2.5 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//               Active Loans & Advances
//             </Typography>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Name</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Total</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">EMI / Month</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Remaining</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Progress</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {employeeDeductions.length === 0 ? (
//                     <TableRow>
//                       <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                         No loans or advances
//                       </TableCell>
//                     </TableRow>
//                   ) : employeeDeductions.map((d) => (
//                     <TableRow key={d.id} hover>
//                       <TableCell>
//                         <Chip label={d.type} size="small" variant="outlined" />
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                           {d.name}
//                         </Typography>
//                       </TableCell>
//                       <TableCell align="right">
//                         <Typography variant="body2">
//                           {formatCurrency(d.amount * (d.installments || 1))}
//                         </Typography>
//                       </TableCell>
//                       <TableCell align="right">
//                         <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                           {formatCurrency(d.amount)}
//                         </Typography>
//                       </TableCell>
//                       <TableCell align="right">
//                         <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                           {d.installments ? `${d.installments - 5} months` : "—"}
//                         </Typography>
//                       </TableCell>
//                       <TableCell sx={{ minWidth: 120 }}>
//                         {d.installments ? (
//                           <Box>
//                             <LinearProgress
//                               variant="determinate"
//                               value={(5 / d.installments) * 100}
//                               sx={{ height: 6, borderRadius: 3 }}
//                             />
//                             <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                               {Math.round((5 / d.installments) * 100)}% repaid
//                             </Typography>
//                           </Box>
//                         ) : (
//                           <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                             N/A
//                           </Typography>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </CardContent>
//         </Card>

//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
//           <CardContent sx={{ p: 2.5 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//               EMI Payment History
//             </Typography>
//             <Stack spacing={1}>
//               {["June 2026", "May 2026", "April 2026", "March 2026"].map((month) => (
//                 <Box
//                   key={month}
//                   sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     p: 1.5,
//                     borderRadius: 1,
//                     "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
//                   }}
//                 >
//                   <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//                     <Box
//                       sx={{
//                         width: 28,
//                         height: 28,
//                         borderRadius: "50%",
//                         bgcolor: alpha(theme.palette.success.main, 0.1),
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <CreditCardIcon sx={{ fontSize: 14, color: "success.main" }} />
//                     </Box>
//                     <Box>
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         {month}
//                       </Typography>
//                       <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                         All EMIs processed
//                       </Typography>
//                     </Box>
//                   </Box>
//                   <Chip label="Paid" size="small" color="success" sx={{ fontSize: "0.7rem" }} />
//                 </Box>
//               ))}
//             </Stack>
//           </CardContent>
//         </Card>
//       </TabPanel>

//       {/* Tab 4: Tax */}
//       <TabPanel value={tabValue} index={3}>
//         <Grid container spacing={3}>
//           <Grid size={{ xs: 12, md: 6 }}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//                   Tax Computation — FY {taxDeclaration.financialYear}
//                 </Typography>
//                 <Stack spacing={2}>
//                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
//                     <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                       Gross Annual Income
//                     </Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       {formatCurrency(employee.ctc)}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
//                     <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                       Total Exemptions & Deductions
//                     </Typography>
//                     <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
//                       - {formatCurrency(taxDeclaration.totalDeductions)}
//                     </Typography>
//                   </Box>
//                   <Box
//                     sx={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       p: 2,
//                       borderRadius: 1,
//                       bgcolor: alpha(theme.palette.primary.main, 0.08),
//                       fontWeight: 600,
//                     }}
//                   >
//                     <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
//                       Net Taxable Income
//                     </Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
//                       {formatCurrency(employee.ctc - taxDeclaration.totalDeductions)}
//                     </Typography>
//                   </Box>
//                 </Stack>
//               </CardContent>
//             </Card>
//           </Grid>

//           <Grid size={{ xs: 12, md: 6 }}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//                   Tax-saving Investments
//                 </Typography>
//                 <Stack spacing={2}>
//                   {[
//                     { label: "Section 80C", value: taxDeclaration.section80C, max: 150000 },
//                     { label: "Section 80D", value: taxDeclaration.section80D, max: 25000 },
//                     { label: "HRA Exemption", value: taxDeclaration.hra, max: null },
//                     { label: "Home Loan Interest", value: taxDeclaration.homeLoanInterest, max: 200000 },
//                   ].map((item) => (
//                     <Box key={item.label}>
//                       <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
//                         <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                           {item.label}
//                         </Typography>
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                           {formatCurrency(item.value)}
//                         </Typography>
//                       </Box>
//                       {item.max && (
//                         <LinearProgress
//                           variant="determinate"
//                           value={(item.value / item.max) * 100}
//                           sx={{ height: 4, borderRadius: 2 }}
//                         />
//                       )}
//                     </Box>
//                   ))}
//                 </Stack>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
//           <CardContent sx={{ p: 2.5 }}>
//             <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//               Tax-saving Suggestions
//             </Typography>
//             <Stack spacing={2}>
//               <Box
//                 sx={{
//                   display: "flex",
//                   gap: 2,
//                   p: 2,
//                   borderRadius: 1,
//                   border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
//                   bgcolor: alpha(theme.palette.info.main, 0.04),
//                 }}
//               >
//                 <Box
//                   sx={{
//                     width: 32,
//                     height: 32,
//                     borderRadius: 1,
//                     bgcolor: alpha(theme.palette.info.main, 0.1),
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexShrink: 0,
//                   }}
//                 >
//                   <LightbulbIcon sx={{ fontSize: 16, color: "info.main" }} />
//                 </Box>
//                 <Box>
//                   <Typography variant="body2" sx={{ fontWeight: 600, color: "info.main" }}>
//                     Maximize Section 80C
//                   </Typography>
//                   <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                     You can invest an additional {formatCurrency(150000 - taxDeclaration.section80C)} in ELSS, PPF, or NPS to reach the ₹1.5L limit.
//                   </Typography>
//                 </Box>
//               </Box>

//               <Box
//                 sx={{
//                   display: "flex",
//                   gap: 2,
//                   p: 2,
//                   borderRadius: 1,
//                   border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
//                   bgcolor: alpha(theme.palette.success.main, 0.04),
//                 }}
//               >
//                 <Box
//                   sx={{
//                     width: 32,
//                     height: 32,
//                     borderRadius: 1,
//                     bgcolor: alpha(theme.palette.success.main, 0.1),
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexShrink: 0,
//                   }}
//                 >
//                   <HeartIcon sx={{ fontSize: 16, color: "success.main" }} />
//                 </Box>
//                 <Box>
//                   <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
//                     Health Insurance (80D)
//                   </Typography>
//                   <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                     Consider increasing health insurance coverage for additional 80D deduction up to ₹25,000.
//                   </Typography>
//                 </Box>
//               </Box>
//             </Stack>
//           </CardContent>
//         </Card>
//       </TabPanel>
//     </Box>
//   );
// }

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
  Select,
  MenuItem,
  FormControl,
  Grid,
  useTheme,
  alpha,
  Stack,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarSignIcon,
  Description as FileTextIcon,
  CreditCard as CreditCardIcon,
  Lightbulb as LightbulbIcon,
  Favorite as HeartIcon,
  Info as InfoIcon,
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
import { formatCurrency } from "../const";
import { employeeService } from "../../../services/modules/employees";
import { salaryViewService } from "../../../services/modules/payrollServices/salaryView";
import { employeeDeductionsService } from "../../../services/modules/payrollServices/deductions";
import { useUI } from "../../../context/Snackbar";

const normalizeCollection = (response: any) => {
  const payload = response?.data ?? response;
  const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
  const collection = candidates.find(Array.isArray);
  return Array.isArray(collection) ? collection : [];
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`salary-tabpanel-${index}`} aria-labelledby={`salary-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeSalaryView() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadSalaryView();
    }
  }, [selectedEmployee]);

  const loadData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [employeesResponse, deductionsResponse]: any = await Promise.all([
        employeeService.getEmployees(),
        employeeDeductionsService.getEmployeeDeductions(),
      ]);
      const employeeList = (employeesResponse.data?.content || []).map((employee: any) => ({
        id: employee.id,
        name: employee.name,
        designation: employee.designation,
        department: employee.department,
        ctc: employee.annualCtc || 0,
        grade: employee.grade || "A",
        employmentType: employee.employmentType || "Permanent",
      }));
      const deductionList = (deductionsResponse.data || []).map((deduction: any) => ({
        id: deduction.id,
        employeeId: deduction.employeeId,
        type: deduction.type || "loan",
        name: deduction.name,
        amount: deduction.monthlyAmount || 0,
        installments: deduction.totalInstallments || 0,
      }));
      setEmployees(employeeList);
      setDeductions(deductionList);
      if (!selectedEmployee && employeeList.length) {
        setSelectedEmployee(employeeList[0].id);
      }
    } catch (error) {
      console.error("Failed to load employee data", error);
      showSnackbar("Failed to load employee data", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadSalaryView = async () => {
    if (!selectedEmployee) return;
    showSpinner();
    try {
      const response: any = await salaryViewService.getEmployeeSalaryView(selectedEmployee);
      setSalaryData(response.data);
    } catch (error) {
      console.error("Failed to load salary view", error);
      showSnackbar("Failed to load salary view", "error");
    } finally {
      hideSpinner();
    }
  };

  const employee = employees.find((e) => e.id === selectedEmployee);
  const employeeDeductions = deductions.filter((d) => d.employeeId === selectedEmployee);
  const payslip = salaryData?.currentStructure || { earnings: [], deductions: [], grossSalary: 0, netTakeHome: 0 };
  const monthlyTrend = salaryData?.payrollHistory?.monthlyTrend || [];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) return null;

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Salary View
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Salary structure, payroll history, loans, and tax summary
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} displayEmpty>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<DownloadIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Download Payslip
          </Button>
        </Box>
      </Box>

      {/* Employee Profile Card */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
              {employee.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {employee.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {employee.designation} · {employee.department}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Chip label={employee.id} size="small" variant="outlined" />
                <Chip label={`Grade ${employee.grade}`} size="small" variant="outlined" />
                <Chip label={employee.employmentType} size="small" variant="outlined" />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 4, textAlign: "right", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Annual CTC
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(employee.ctc)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Monthly Gross
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                  {formatCurrency(payslip.grossSalary)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Monthly Net
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatCurrency(payslip.netTakeHome)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Current Structure" />
          <Tab label="Payroll History" />
          <Tab label="Loans & Advances" />
          <Tab label="Tax Summary" />
        </Tabs>
      </Box>

      {/* Tab 1: Structure */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: "success.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Earnings
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {payslip.earnings?.map((earning: any, index: number) => (
                    <Box key={index}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.04) } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Tooltip title="Taxable component · Monthly">
                            <InfoIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                          </Tooltip>
                          <Typography variant="body2">{earning.componentName}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                          {formatCurrency(earning.amount)}
                        </Typography>
                      </Box>
                      {index < payslip.earnings.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, mt: 1, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.08), fontWeight: 600 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Gross Salary
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(payslip.grossSalary)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <DollarSignIcon sx={{ color: "error.main" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Deductions
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {payslip.deductions?.map((deduction: any, index: number) => (
                    <Box key={index}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 1, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.04) } }}>
                        <Typography variant="body2">{deduction.componentName}</Typography>
                        <Typography variant="body2" sx={{ color: "error.main" }}>
                          - {formatCurrency(deduction.amount)}
                        </Typography>
                      </Box>
                      {index < payslip.deductions.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, mt: 1, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.08), fontWeight: 600 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Total Deductions
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                      - {formatCurrency(payslip.totalDeductions)}
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
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Net Take-Home Salary
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  After all deductions · Credited on 5th every month
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                {formatCurrency(payslip.netTakeHome)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 2: History */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {[
            { label: "YTD Earnings", value: salaryData?.payrollHistory?.ytdEarnings || 0, color: "success.main" },
            { label: "YTD Deductions", value: salaryData?.payrollHistory?.ytdDeductions || 0, color: "error.main" },
            { label: "YTD Net Pay", value: (salaryData?.payrollHistory?.ytdEarnings || 0) - (salaryData?.payrollHistory?.ytdDeductions || 0), color: "primary.main" },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
              <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                    {formatCurrency(item.value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Monthly Trend
            </Typography>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <ReTooltip formatter={(value: any) => [formatCurrency(value), ""]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="earnings" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} name="Earnings" />
                  <Line type="monotone" dataKey="deductions" stroke={theme.palette.error.main} strokeWidth={2} dot={{ r: 3 }} name="Deductions" />
                  <Line type="monotone" dataKey="net" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 3 }} name="Net Pay" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No trend data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", mt: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Monthly Payslips
            </Typography>
            <Stack spacing={1}>
              {salaryData?.payrollHistory?.monthlyPayslips?.map((p: any) => (
                <Box key={p.periodLabel} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) }, transition: "background-color 0.2s" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: theme.palette.grey[100], display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileTextIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {p.periodLabel}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Net: {formatCurrency(p.net)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button variant="text" size="small" startIcon={<DownloadIcon fontSize="small" />} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                    PDF
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Loans */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Active Loans & Advances
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">EMI / Month</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeDeductions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No loans or advances
                      </TableCell>
                    </TableRow>
                  ) : employeeDeductions.map((d) => {
                    const progress = d.installments > 0 ? 50 : 0;
                    return (
                      <TableRow key={d.id} hover>
                        <TableCell>
                          <Chip label={d.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {d.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(d.amount * (d.installments || 1))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(d.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {d.installments ? `${d.installments - 5} months` : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          {d.installments > 0 ? (
                            <Box>
                              <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {progress}% repaid
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Tax */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Tax Computation — FY {salaryData?.taxSummary?.financialYear || "2025-26"}
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Gross Annual Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(salaryData?.taxSummary?.grossAnnualIncome || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Exemptions & Deductions
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                      - {formatCurrency(salaryData?.taxSummary?.exemptionsDeductions || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      Net Taxable Income
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {formatCurrency(salaryData?.taxSummary?.netTaxableIncome || 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Tax Computation
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Tax Computed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(salaryData?.taxSummary?.taxComputed || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      TDS Deducted
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                      - {formatCurrency(salaryData?.taxSummary?.tdsDeducted || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                      Balance Tax Payable
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
                      {formatCurrency(salaryData?.taxSummary?.balanceTaxPayable || 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}