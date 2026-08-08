// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   TextField,
//   InputAdornment,
//   Select,
//   MenuItem,
//   FormControl,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TableContainer,
//   IconButton,
//   Stack,
//   useTheme,
//   alpha,
//   Grid,
//   Avatar,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   FilterList as FilterIcon,
//   Download as DownloadIcon,
//   Visibility as EyeIcon,
//   People as UsersIcon,
//   AttachMoney as DollarSignIcon,
//   TrendingUp as TrendingUpIcon,
// } from "@mui/icons-material";
// import { formatCurrency } from "../const";
// import { payslipsService } from "../../../services/modules/payrollServices/payslips";

// const periods = ["May 2026", "Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026"];
// const periodMap: Record<string, { year: number; month: number }> = {
//   "May 2026": { year: 2026, month: 5 },
//   "Apr 2026": { year: 2026, month: 4 },
//   "Mar 2026": { year: 2026, month: 3 },
//   "Feb 2026": { year: 2026, month: 2 },
//   "Jan 2026": { year: 2026, month: 1 },
// };

// const normalizeCollection = (response: any) => {
//   const payload = response?.data ?? response;
//   const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
//   const collection = candidates.find(Array.isArray);
//   return Array.isArray(collection) ? collection : [];
// };

// export default function EmployeePayslips() {
//   const navigate = useNavigate();
//   const theme = useTheme();
//   const [search, setSearch] = useState("");
//   const [dept, setDept] = useState("all");
//   const [period, setPeriod] = useState("May 2026");
//   const [payslips, setPayslips] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const loadPayslips = async () => {
//       setLoading(true);
//       try {
//         const { year, month } = periodMap[period] || periodMap["May 2026"];
//         const response: any = await payslipsService.getPayslips({ year, month });
//         const list = normalizeCollection(response).map((item: any) => ({
//           id: item.employeeId || item.id,
//           name: item.employeeName || item.name,
//           department: item.department || "General",
//           designation: item.designation || "Employee",
//           gross: item.grossSalary || item.gross || 0,
//           pf: item.pf || 0,
//           pt: item.professionalTax || 0,
//           net: item.netSalary || item.net || 0,
//           payDays: item.payDays || 30,
//         }));
//         setPayslips(list);
//         setError("");
//       } catch (err) {
//         console.error("Failed to load payslips", err);
//         setError("Unable to load payslips right now.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadPayslips();
//   }, [period]);

//   const departments = ["all", ...Array.from(new Set(payslips.map((e) => e.department)))];

//   const filtered = payslips.filter((e) => {
//     const matchSearch =
//       e.name.toLowerCase().includes(search.toLowerCase()) ||
//       e.id.toLowerCase().includes(search.toLowerCase()) ||
//       e.designation.toLowerCase().includes(search.toLowerCase());
//     const matchDept = dept === "all" || e.department === dept;
//     return matchSearch && matchDept;
//   });

//   const totalGross = payslips.reduce((s, e) => s + (e.gross || 0), 0);
//   const totalNet = payslips.reduce((s, e) => s + (e.net || 0), 0);

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
//             Employee Payslips
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//             View and download payslips for all employees
//           </Typography>
//         </Box>
//         <Button
//           variant="outlined"
//           startIcon={<DownloadIcon fontSize="small" />}
//           sx={{ textTransform: "none" }}
//         >
//           Bulk Download
//         </Button>
//       </Box>

//       {/* Summary Cards */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {[
//           { 
//             label: "Total Employees", 
//             value: payslips.length.toString(),
//             icon: <UsersIcon sx={{ fontSize: 20 }} />,
//             color: theme.palette.primary.main,
//           },
//           { 
//             label: "Total Gross (Month)", 
//             value: formatCurrency(totalGross),
//             icon: <DollarSignIcon sx={{ fontSize: 20 }} />,
//             color: theme.palette.success.main,
//           },
//           { 
//             label: "Total Net (Month)", 
//             value: formatCurrency(totalNet),
//             icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
//             color: theme.palette.primary.main,
//           },
//         ].map((s) => (
//           <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={s.label}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                   <Box>
//                     <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
//                       {s.label}
//                     </Typography>
//                     <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
//                       {s.value}
//                     </Typography>
//                     <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
//                       {period}
//                     </Typography>
//                   </Box>
//                   <Box
//                     sx={{
//                       width: 40,
//                       height: 40,
//                       borderRadius: 2,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       bgcolor: alpha(s.color, 0.1),
//                       color: s.color,
//                     }}
//                   >
//                     {s.icon}
//                   </Box>
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       {/* Filters */}
//       <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
//         <TextField
//           placeholder="Search by name, ID, designation..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           size="small"
//           sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
//           slotProps={{
//             input: {
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
//                 </InputAdornment>
//               ),
//             },
//           }}
//         />
//         <FormControl size="small" sx={{ minWidth: 140 }}>
//           <Select
//             value={period}
//             onChange={(e) => setPeriod(e.target.value)}
//             displayEmpty
//           >
//             {periods.map((p) => (
//               <MenuItem key={p} value={p}>{p}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <FormControl size="small" sx={{ minWidth: 160 }}>
//           <Select
//             value={dept}
//             onChange={(e) => setDept(e.target.value)}
//             displayEmpty
//             startAdornment={
//               <FilterIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />
//             }
//           >
//             <MenuItem value="all">All Departments</MenuItem>
//             {departments.filter(d => d !== "all").map((d) => (
//               <MenuItem key={d} value={d}>{d}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </Box>

//       {/* Table */}
//       {loading ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>Loading payslips…</Box>
//       ) : error ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>{error}</Box>
//       ) : (
//       <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                 <TableCell
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Employee
//                 </TableCell>
//                 <TableCell
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Department
//                 </TableCell>
//                 <TableCell
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Designation
//                 </TableCell>
//                 <TableCell
//                   align="right"
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Pay Days
//                 </TableCell>
//                 <TableCell
//                   align="right"
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Gross Salary
//                 </TableCell>
//                 <TableCell
//                   align="right"
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Deductions
//                 </TableCell>
//                 <TableCell
//                   align="right"
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Net Salary
//                 </TableCell>
//                 <TableCell
//                   align="center"
//                   sx={{
//                     fontWeight: 600,
//                     fontSize: "0.65rem",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                     color: "text.secondary",
//                   }}
//                 >
//                   Actions
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filtered.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                     No employees match your search.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filtered.map((emp) => (
//                   <TableRow
//                     key={emp.id}
//                     hover
//                     sx={{
//                       transition: "background-color 0.2s",
//                       "&:hover": {
//                         bgcolor: alpha(theme.palette.primary.main, 0.04),
//                       },
//                     }}
//                   >
//                     <TableCell>
//                       <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//                         <Avatar
//                           sx={{
//                             width: 32,
//                             height: 32,
//                             bgcolor: alpha(theme.palette.primary.main, 0.1),
//                             color: "primary.main",
//                             fontSize: "0.75rem",
//                             fontWeight: 600,
//                           }}
//                         >
//                           {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
//                         </Avatar>
//                         <Box>
//                           <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                             {emp.name}
//                           </Typography>
//                           <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                             {emp.id}
//                           </Typography>
//                         </Box>
//                       </Box>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         {emp.department}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         {emp.designation}
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="right">
//                       <Typography variant="body2">{emp.payDays}</Typography>
//                     </TableCell>
//                     <TableCell align="right">
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         {formatCurrency(emp.gross)}
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="right">
//                       <Typography variant="body2" sx={{ color: "error.main" }}>
//                         {formatCurrency(emp.pf + emp.pt)}
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="right">
//                       <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
//                         {formatCurrency(emp.net)}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Stack direction="row" >
//                         <Button
//                           variant="text"
//                           size="small"
//                           startIcon={<EyeIcon fontSize="small" />}
//                           onClick={() => navigate(`/payroll/payslips/${emp.id}/${encodeURIComponent(period)}`) }
//                           sx={{
//                             textTransform: "none",
//                             fontSize: "0.75rem",
//                             color: "text.secondary",
//                             "&:hover": {
//                               color: "primary.main",
//                               bgcolor: alpha(theme.palette.primary.main, 0.08),
//                             },
//                           }}
//                         >
//                           View
//                         </Button>
//                         <IconButton
//                           size="small"
//                           sx={{
//                             color: "text.secondary",
//                             "&:hover": {
//                               color: "primary.main",
//                               bgcolor: alpha(theme.palette.primary.main, 0.08),
//                             },
//                           }}
//                         >
//                           <DownloadIcon fontSize="small" />
//                         </IconButton>
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Card>
//       )}
//     </Box>
//   );
// }

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as EyeIcon,
  People as UsersIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { payslipsService } from "../../../services/modules/payrollServices/payslips";
import { useUI } from "../../../context/Snackbar";

const periods = [
  { label: "May 2026", year: 2026, month: 5 },
  { label: "Apr 2026", year: 2026, month: 4 },
  { label: "Mar 2026", year: 2026, month: 3 },
  { label: "Feb 2026", year: 2026, month: 2 },
  { label: "Jan 2026", year: 2026, month: 1 },
];

export default function EmployeePayslips() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [period, setPeriod] = useState(periods[0]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadPayslips();
  }, [period]);

  const loadPayslips = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [payslipsRes, summaryRes]:any = await Promise.all([
        payslipsService.getPayslips({
          year: period.year,
          month: period.month,
        }),
        payslipsService.getPayslipSummary({
          year: period.year,
          month: period.month,
        }),
      ]);
      const list = (payslipsRes.data?.content || []).map((item: any) => ({
        id: item.employeeId,
        name: item.employeeName,
        department: item.department,
        designation: item.designation,
        gross: item.grossSalary || 0,
        net: item.netSalary || 0,
        pf: item.pf || 0,
        pt: item.professionalTax || 0,
        payDays: item.payDays || 30,
      }));
      setPayslips(list);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load payslips", error);
      showSnackbar("Failed to load payslips", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const departments = ["all", ...Array.from(new Set(payslips.map((e) => e.department)))];

  const filtered = payslips.filter((e) => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.id?.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "all" || e.department === dept;
    return matchSearch && matchDept;
  });

  const totalGross = payslips.reduce((s, e) => s + (e.gross || 0), 0);
  const totalNet = payslips.reduce((s, e) => s + (e.net || 0), 0);

  const handleDownload = async (id: string) => {
    try {
      const res:any = await payslipsService.downloadPayslip(id);
      window.open(res.data.fileUrl, "_blank");
    } catch (error) {
      showSnackbar("Failed to download payslip", "error");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Employee Payslips
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            View and download payslips for all employees
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />} sx={{ textTransform: "none" }}>
          Bulk Download
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Employees", value: summary?.totalEmployees || payslips.length, icon: <UsersIcon sx={{ fontSize: 20 }} />, color: theme.palette.primary.main },
          { label: "Total Gross", value: formatCurrency(summary?.totalGross || totalGross), icon: <DollarSignIcon sx={{ fontSize: 20 }} />, color: theme.palette.success.main },
          { label: "Total Net", value: formatCurrency(summary?.totalNet || totalNet), icon: <TrendingUpIcon sx={{ fontSize: 20 }} />, color: theme.palette.primary.main },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={s.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {s.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                      {period.label}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(s.color, 0.1), color: s.color }}>
                    {s.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search by name, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={period.label} onChange={(e) => {
            const p = periods.find(p => p.label === e.target.value);
            if (p) setPeriod(p);
          }}>
            {periods.map((p) => (
              <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} displayEmpty>
            <MenuItem value="all">All Departments</MenuItem>
            {departments.filter(d => d !== "all").map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell align="right">Pay Days</TableCell>
                <TableCell align="right">Gross Salary</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                          {emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </Avatar>
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
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {emp.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {emp.designation}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{emp.payDays}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(emp.gross)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "error.main" }}>
                        {formatCurrency((emp.pf || 0) + (emp.pt || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                        {formatCurrency(emp.net)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row">
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<EyeIcon fontSize="small" />}
                          onClick={() => navigate(`/payroll/payslips/${emp.id}/${encodeURIComponent(period.label)}`)}
                          sx={{ textTransform: "none", fontSize: "0.75rem" }}
                        >
                          View
                        </Button>
                        <IconButton size="small" onClick={() => handleDownload(emp.id)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}