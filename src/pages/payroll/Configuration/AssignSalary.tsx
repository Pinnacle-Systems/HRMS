// import { useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TableContainer,
//   Paper,
//   Chip,
//   Stack,
//   useTheme,
//   alpha,
//   Grid,
//   Checkbox,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
//   Avatar,
//   InputAdornment,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   Upload as UploadIcon,
//   Business as Building2Icon,
//   Work as BriefcaseIcon,
//   AttachMoney as DollarSignIcon,
//   CheckCircle as CheckCircleIcon,
//   ExpandMore as ExpandMoreIcon,
// } from "@mui/icons-material";
// import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
// import { formatCurrency } from "../const";

// const PIE_COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#ec4899"];

// // Mock data - replace with your actual API data
// const mockEmployees = [
//   { id: "EMP001", name: "Rajesh Kumar", department: "Engineering", designation: "Senior Developer", grade: "L3" },
//   { id: "EMP002", name: "Priya Sharma", department: "Sales", designation: "Sales Manager", grade: "L4" },
//   { id: "EMP003", name: "Amit Patel", department: "HR", designation: "HR Executive", grade: "L2" },
//   { id: "EMP004", name: "Sneha Reddy", department: "Finance", designation: "Finance Analyst", grade: "L3" },
//   { id: "EMP005", name: "Vikram Singh", department: "Engineering", designation: "Team Lead", grade: "L4" },
//   { id: "EMP006", name: "Ananya Gupta", department: "Marketing", designation: "Marketing Specialist", grade: "L2" },
//   { id: "EMP007", name: "Deepak Jain", department: "Operations", designation: "Operations Manager", grade: "L4" },
//   { id: "EMP008", name: "Kavya Nair", department: "Sales", designation: "Sales Executive", grade: "L1" },
// ];

// const mockSalaryStructures = [
//   { id: "1", name: "Standard L1 Structure" },
//   { id: "2", name: "Standard L2 Structure" },
//   { id: "3", name: "Executive L3 Structure" },
//   { id: "4", name: "Leadership L4 Structure" },
// ];

// export default function AssignSalaryStructure() {
//   const theme = useTheme();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedDept, setSelectedDept] = useState("all");
//   const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
//   const [selectedTemplate, setSelectedTemplate] = useState("");
//   const [ctcAmount, setCtcAmount] = useState<number>(0);
//   const [ctcMode, setCtcMode] = useState<"annual" | "monthly">("annual");

//   const filteredEmployees = mockEmployees.filter((emp) => {
//     const matchesSearch =
//       emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       emp.id.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesDept = selectedDept === "all" || emp.department === selectedDept;
//     return matchesSearch && matchesDept;
//   });

//   const departments = Array.from(new Set(mockEmployees.map((e) => e.department)));

//   const toggleEmployeeSelection = (empId: string) => {
//     setSelectedEmployees((prev) =>
//       prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
//     );
//   };

//   const toggleAllEmployees = () => {
//     setSelectedEmployees(
//       selectedEmployees.length === filteredEmployees.length
//         ? []
//         : filteredEmployees.map((e) => e.id)
//     );
//   };

//   const calculateBreakdown = () => {
//     if (!selectedTemplate || ctcAmount === 0) return null;
//     const annual = ctcMode === "monthly" ? ctcAmount * 12 : ctcAmount;
//     const totalEarnings = annual * 0.9;
//     const totalDeductions = annual * 0.1;
//     return {
//       earnings: [
//         { name: "Basic", value: totalEarnings * 0.4 },
//         { name: "HRA", value: totalEarnings * 0.25 },
//         { name: "Special", value: totalEarnings * 0.25 },
//         { name: "Transport", value: totalEarnings * 0.1 },
//       ],
//       deductions: [
//         { name: "Provident Fund", value: totalDeductions * 0.6 },
//         { name: "Professional Tax", value: totalDeductions * 0.4 },
//       ],
//       netMonthly: (totalEarnings - totalDeductions) / 12,
//       grossMonthly: annual / 12,
//     };
//   };

//   const breakdown = calculateBreakdown();
//   const allData = breakdown ? [...breakdown.earnings, ...breakdown.deductions] : [];

//   const currencyFormatter = (value: any): [string, string] => {
//     if (typeof value === 'number') {
//       return [formatCurrency(value), "Amount"];
//     }
//     return [String(value || 0), "Amount"];
//   };

//   const handleAssign = () => {
//     if (selectedEmployees.length === 0) {
//       return;
//     }
//     if (!selectedTemplate) {
//       return;
//     }
//     if (ctcAmount === 0) {
//       return;
//     }
//     // Toast notification would go here
//     console.log(`Salary structure assigned to ${selectedEmployees.length} employee(s).`);
//     setSelectedEmployees([]);
//   };

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {/* Header */}
//       <Box sx={{ mb: 3 }}>
//         <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
//           Assign Salary Structure
//         </Typography>
//         <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//           Assign salary structures to employees individually or in bulk
//         </Typography>
//       </Box>

//       <Grid container spacing={3}>
//         {/* Left: Employee selection */}
//         <Grid size={{ xs: 12, lg: 8 }}>
//           <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//             <CardContent sx={{ p: 2.5 }}>
//               <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                   Select Employees
//                 </Typography>
//                 {selectedEmployees.length > 0 && (
//                   <Chip
//                     icon={<CheckCircleIcon fontSize="small" />}
//                     label={`${selectedEmployees.length} selected`}
//                     color="primary"
//                     size="small"
//                   />
//                 )}
//               </Box>

//               <Stack spacing={2}>
//                 <Box sx={{ display: "flex", gap: 2 }}>
//                   <TextField
//                     placeholder="Search by name or ID..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     size="small"
//                     slotProps={{
//                       input: {
//                         startAdornment: (
//                           <InputAdornment position="start">
//                             <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
//                           </InputAdornment>
//                         ),
//                       },
//                     }}
//                   />
//                   <FormControl size="small" sx={{ minWidth: 180 }}>
//                     <Select
//                       value={selectedDept}
//                       onChange={(e) => setSelectedDept(e.target.value)}
//                       displayEmpty
//                     >
//                       <MenuItem value="all">All Departments</MenuItem>
//                       {departments.map((dept) => (
//                         <MenuItem key={dept} value={dept}>{dept}</MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                 </Box>

//                 <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
//                   <Table>
//                     <TableHead>
//                       <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                         <TableCell padding="checkbox">
//                           <Checkbox
//                             checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
//                             indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
//                             onChange={toggleAllEmployees}
//                           />
//                         </TableCell>
//                         <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                           Employee
//                         </TableCell>
//                         <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                           Department
//                         </TableCell>
//                         <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                           Designation
//                         </TableCell>
//                         <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                           Grade
//                         </TableCell>
//                       </TableRow>
//                     </TableHead>
//                     <TableBody>
//                       {filteredEmployees.map((employee) => (
//                         <TableRow
//                           key={employee.id}
//                           hover
//                           sx={{
//                             cursor: "pointer",
//                             bgcolor: selectedEmployees.includes(employee.id)
//                               ? alpha(theme.palette.primary.main, 0.04)
//                               : "transparent",
//                             "&:hover": {
//                               bgcolor: selectedEmployees.includes(employee.id)
//                                 ? alpha(theme.palette.primary.main, 0.08)
//                                 : alpha(theme.palette.primary.main, 0.02),
//                             },
//                           }}
//                           onClick={() => toggleEmployeeSelection(employee.id)}
//                         >
//                           <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
//                             <Checkbox
//                               checked={selectedEmployees.includes(employee.id)}
//                               onChange={() => toggleEmployeeSelection(employee.id)}
//                             />
//                           </TableCell>
//                           <TableCell>
//                             <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//                               <Avatar
//                                 sx={{
//                                   width: 32,
//                                   height: 32,
//                                   bgcolor: alpha(theme.palette.primary.main, 0.1),
//                                   color: "primary.main",
//                                   fontSize: "0.75rem",
//                                   fontWeight: 600,
//                                 }}
//                               >
//                                 {employee.name.charAt(0)}
//                               </Avatar>
//                               <Box>
//                                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                                   {employee.name}
//                                 </Typography>
//                                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                                   {employee.id}
//                                 </Typography>
//                               </Box>
//                             </Box>
//                           </TableCell>
//                           <TableCell>
//                             <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//                               <Building2Icon sx={{ fontSize: 14, color: "text.secondary" }} />
//                               <Typography variant="body2">{employee.department}</Typography>
//                             </Box>
//                           </TableCell>
//                           <TableCell>
//                             <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//                               <BriefcaseIcon sx={{ fontSize: 14, color: "text.secondary" }} />
//                               <Typography variant="body2">{employee.designation}</Typography>
//                             </Box>
//                           </TableCell>
//                           <TableCell>
//                             <Chip label={employee.grade} size="small" variant="outlined" />
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </TableContainer>

//                 <Button
//                   variant="outlined"
//                   startIcon={<UploadIcon fontSize="small" />}
//                   sx={{ borderStyle: "dashed", textTransform: "none" }}
//                   fullWidth
//                 >
//                   Bulk Upload via CSV
//                 </Button>
//               </Stack>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Right: Assignment details + breakdown */}
//         <Grid size={{ xs: 12, lg: 4 }}>
//           <Stack spacing={3}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//                   Assignment Details
//                 </Typography>

//                 <Stack spacing={2.5}>
//                   <Box
//                     sx={{
//                       p: 1.5,
//                       borderRadius: 1,
//                       bgcolor: alpha(theme.palette.primary.main, 0.04),
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                     }}
//                   >
//                     <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                       Selected Employees
//                     </Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       {selectedEmployees.length}
//                     </Typography>
//                   </Box>

//                   <FormControl fullWidth size="small">
//                     <InputLabel>Salary Template *</InputLabel>
//                     <Select
//                       value={selectedTemplate}
//                       onChange={(e) => setSelectedTemplate(e.target.value)}
//                       label="Salary Template *"
//                     >
//                       {mockSalaryStructures.map((t) => (
//                         <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>

//                   <Box>
//                     <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
//                       CTC Amount *
//                     </Typography>
//                     <Box sx={{ display: "flex", gap: 1 }}>
//                       <TextField
//                         type="number"
//                         value={ctcAmount || ""}
//                         onChange={(e) => setCtcAmount(Number(e.target.value))}
//                         placeholder="0"
//                         size="small"
//                         fullWidth
//                       />
//                       <FormControl size="small" sx={{ minWidth: 100 }}>
//                         <Select
//                           value={ctcMode}
//                           onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly")}
//                         >
//                           <MenuItem value="annual">Annual</MenuItem>
//                           <MenuItem value="monthly">Monthly</MenuItem>
//                         </Select>
//                       </FormControl>
//                     </Box>
//                   </Box>

//                   <Accordion
//                     sx={{
//                       border: `1px solid ${theme.palette.divider}`,
//                       borderRadius: 1,
//                       "&:before": { display: "none" },
//                     }}
//                   >
//                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         Bank Details
//                       </Typography>
//                     </AccordionSummary>
//                     <AccordionDetails>
//                       <Stack spacing={1.5}>
//                         <TextField
//                           label="Account Number"
//                           placeholder="1234567890"
//                           size="small"
//                           fullWidth
//                         />
//                         <TextField
//                           label="Bank Name"
//                           placeholder="HDFC Bank"
//                           size="small"
//                           fullWidth
//                         />
//                         <Grid container spacing={1}>
//                           <Grid size={{ xs: 6 }}>
//                             <TextField
//                               label="IFSC Code"
//                               placeholder="HDFC0001234"
//                               size="small"
//                               fullWidth
//                             />
//                           </Grid>
//                           <Grid size={{ xs: 6 }}>
//                             <TextField
//                               label="Branch"
//                               placeholder="Mumbai"
//                               size="small"
//                               fullWidth
//                             />
//                           </Grid>
//                         </Grid>
//                       </Stack>
//                     </AccordionDetails>
//                   </Accordion>

//                   <Button
//                     variant="contained"
//                     startIcon={<DollarSignIcon fontSize="small" />}
//                     onClick={handleAssign}
//                     fullWidth
//                     sx={{ textTransform: "none" }}
//                   >
//                     Assign Salary Structure
//                   </Button>
//                 </Stack>
//               </CardContent>
//             </Card>

//             {breakdown && (
//               <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//                 <CardContent sx={{ p: 2.5 }}>
//                   <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
//                     <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                       Salary Breakdown Preview
//                     </Typography>
//                     <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                       Monthly estimates
//                     </Typography>
//                   </Box>

//                   <Grid container spacing={1.5} sx={{ mb: 2 }}>
//                     <Grid size={{ xs: 6 }}>
//                       <Box
//                         sx={{
//                           p: 1.5,
//                           borderRadius: 1,
//                           textAlign: "center",
//                           bgcolor: alpha(theme.palette.success.main, 0.08),
//                         }}
//                       >
//                         <Typography variant="caption" sx={{ color: "success.main" }}>
//                           Gross Monthly
//                         </Typography>
//                         <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "success.main" }}>
//                           {formatCurrency(breakdown.grossMonthly)}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                     <Grid size={{ xs: 6 }}>
//                       <Box
//                         sx={{
//                           p: 1.5,
//                           borderRadius: 1,
//                           textAlign: "center",
//                           bgcolor: alpha(theme.palette.primary.main, 0.08),
//                         }}
//                       >
//                         <Typography variant="caption" sx={{ color: "primary.main" }}>
//                           Net Monthly
//                         </Typography>
//                         <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
//                           {formatCurrency(breakdown.netMonthly)}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                   </Grid>

//                   <ResponsiveContainer width="100%" height={180}>
//                     <PieChart>
//                       <Pie
//                         data={allData}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={45}
//                         outerRadius={72}
//                         paddingAngle={2}
//                         dataKey="value"
//                       >
//                         {allData.map((_entry, index) => (
//                           <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <ReTooltip formatter={currencyFormatter} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
//                     </PieChart>
//                   </ResponsiveContainer>

//                   <Stack spacing={0.5} sx={{ mt: 1 }}>
//                     {allData.map((item, i) => (
//                       <Box
//                         key={item.name}
//                         sx={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           alignItems: "center",
//                           py: 0.5,
//                         }}
//                       >
//                         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                           <Box
//                             sx={{
//                               width: 8,
//                               height: 8,
//                               borderRadius: "50%",
//                               bgcolor: PIE_COLORS[i % PIE_COLORS.length],
//                               flexShrink: 0,
//                             }}
//                           />
//                           <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                             {item.name}
//                           </Typography>
//                         </Box>
//                         <Typography variant="caption" sx={{ fontWeight: 500 }}>
//                           {formatCurrency(item.value / 12)}/mo
//                         </Typography>
//                       </Box>
//                     ))}
//                   </Stack>
//                 </CardContent>
//               </Card>
//             )}
//           </Stack>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }


import { useState, useEffect } from "react";
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
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Stack,
  useTheme,
  alpha,
  Grid,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Pagination,
} from "@mui/material";
import {
  AttachMoney as DollarSignIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  AssessmentOutlined,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { assignmentService } from "../../../services/modules/payrollServices/salaryAssignments";
import { salaryStructureService } from "../../../services/modules/payrollServices/salarystructure";
import { employeeService } from "../../../services/modules/employees";
import { useUI } from "../../../context/Snackbar";
import { dialogsx, selectSx } from "../../../const";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { GlobalPagination } from "../../../components/GlobalPagination";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "#10b981", bgColor: "#d1fae5" },
  inactive: { label: "Inactive", color: "#6b7280", bgColor: "#f3f4f6" },
  pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
  expired: { label: "Expired", color: "#ef4444", bgColor: "#fee2e2" },
};

export default function AssignSalaryStructure() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  
  // State for assignments
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<string>("");
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  
  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [ctcAmount, setCtcAmount] = useState<number>(0);
  const [ctcMode, setCtcMode] = useState<"annual" | "monthly">("annual");
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branch: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadAssignments();
  }, [page, limit, statusFilter, searchTerm]);

  const loadData = async () => {
    showSpinner();
    try {
      const [employeesRes, structuresRes]: any = await Promise.all([
        employeeService.getEmployees({ size: 1000 }),
        salaryStructureService.getSalaryStructures({ status: "PUBLISHED", size: 100 }),
      ]);
      setEmployees(employeesRes.data?.content || []);
      setStructures(structuresRes.data?.content || []);
    } catch (error) {
      console.error("Failed to load data", error);
      showSnackbar("Failed to load data", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
        sort: "createdAt,desc",
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const res: any = await assignmentService.getAssignments(params);
      setAssignments(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
      setTotalCount(res.data?.totalElements || 0);
    } catch (error) {
      console.error("Failed to load assignments", error);
      showSnackbar("Failed to load assignments", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadAssignmentHistory = async (employeeId: string) => {
    showSpinner();
    try {
      const res: any = await assignmentService.getEmployeeAssignmentHistory(employeeId);
      setAssignmentHistory(res.data || []);
    } catch (error) {
      console.error("Failed to load assignment history", error);
      showSnackbar("Failed to load assignment history", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleViewAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  const handleViewHistory = async (employeeId: string) => {
    setSelectedEmployeeForHistory(employeeId);
    await loadAssignmentHistory(employeeId);
    setOpenHistoryDialog(true);
  };

  const handleDeleteAssignment = async (assignment: any) => {
    showConfirmDialog({
      title: 'Deactive Assignment',
      message: `Are you sure you want to deactivate assignment for "${assignment.employeeName}"?`,
      confirmText: 'Deactivate',
      onConfirm: async () => {
        try {
          showSpinner();
          await assignmentService.deleteAssignment(assignment.id);
          showSnackbar("Assignment deleted successfully!", "success");
          loadAssignments();
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete assignment", "error");
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const departments = ["all", ...Array.from(new Set(employees.map((e) => e.department)))];
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleAllEmployees = () => {
    setSelectedEmployees(
      selectedEmployees.length === filteredEmployees.length
        ? []
        : filteredEmployees.map((e) => e.id)
    );
  };

  const calculateBreakdown = () => {
    if (!selectedTemplate || ctcAmount === 0) return null;
    const annual = ctcMode === "monthly" ? ctcAmount * 12 : ctcAmount;
    const totalEarnings = annual * 0.9;
    const totalDeductions = annual * 0.1;
    return {
      earnings: [
        { name: "Basic", value: totalEarnings * 0.4 },
        { name: "HRA", value: totalEarnings * 0.25 },
        { name: "Special", value: totalEarnings * 0.25 },
        { name: "Transport", value: totalEarnings * 0.1 },
      ],
      deductions: [
        { name: "Provident Fund", value: totalDeductions * 0.6 },
        { name: "Professional Tax", value: totalDeductions * 0.4 },
      ],
      netMonthly: (totalEarnings - totalDeductions) / 12,
      grossMonthly: annual / 12,
    };
  };

  const breakdown = calculateBreakdown();

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      showSnackbar("Please select at least one employee", "warning");
      return;
    }
    if (!selectedTemplate) {
      showSnackbar("Please select a salary template", "warning");
      return;
    }
    if (ctcAmount === 0) {
      showSnackbar("Please enter CTC amount", "warning");
      return;
    }

    showSpinner();
    try {
      const annualCtc = ctcMode === "monthly" ? ctcAmount * 12 : ctcAmount;
      const payload = {
        employeeIds: selectedEmployees,
        structureId: selectedTemplate,
        ctcAmount: annualCtc,
        ctcPeriod: "ANNUAL",
        effectiveFrom: new Date().toISOString().split('T')[0],
        bankDetails: bankDetails.accountNumber ? bankDetails : undefined,
      };
      const res: any = await assignmentService.createBulkAssignment(payload);
      showSnackbar(`Salary structure assigned to ${res.data.assigned} employee(s)!`, "success");
      setSelectedEmployees([]);
      loadAssignments();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to assign salary structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  if (loading && tabValue === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="bg-white-50">
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }} className="border-b border-gray-200">
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Assign Salary" className="!text-gray-800" />
          <Tab label={`Assignments (${assignments.length})`} className="!text-gray-800" />
        </Tabs>
      </Box>

      {/* Tab 0: Assign Salary */}
      {tabValue === 0 && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AssessmentOutlined sx={{ color: "primary.main" }} />
            </Box>
            <Box>
              <div className="text-gray-800 text-[12px] font-bold">
                Assign Salary Structure
              </div>
              <div className="text-gray-500 text-[12px]">
                Assign salary structures to employees individually or in bulk
              </div>
            </Box>
          </div>

          <Grid container spacing={2}>
            {/* Left: Employee selection */}
            <Grid size={{ xs: 12, md: breakdown ? 12 : 8, lg: breakdown ? 6 : 8 }}>
              <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography className="text-gray-800" sx={{ fontWeight: 600 }}>
                      Select Employees
                    </Typography>
                    {selectedEmployees.length > 0 && (
                      <Chip
                        icon={<CheckCircleIcon fontSize="small" />}
                        label={`${selectedEmployees.length} selected`}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <TextField
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          displayEmpty
                          sx={selectSx}
                        >
                          <MenuItem value="all">All Departments</MenuItem>
                          {departments.filter((d) => d !== "all").map((dept) => (
                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <TableContainer className="border border-gray-200 rounded-md h-[calc(100vh-380px)] overflow-auto">
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                                onChange={toggleAllEmployees}
                                className="text-gray-800"
                              />
                            </TableCell>
                            <TableCell className="!font-bold">#</TableCell>
                            <TableCell className="!font-bold">Employee</TableCell>
                            <TableCell className="!font-bold">Department</TableCell>
                            <TableCell className="!font-bold">Designation</TableCell>
                            <TableCell className="!font-bold">Grade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredEmployees.map((employee, i) => (
                            <TableRow
                              key={employee.id}
                              sx={getRowColor(i)}
                              onClick={() => toggleEmployeeSelection(employee.id)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onChange={() => toggleEmployeeSelection(employee.id)}
                                  className="text-gray-800"
                                />
                              </TableCell>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "0.75rem", fontWeight: 600 }}>
                                    {employee.name?.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {employee.name}
                                    </Typography>
                                    <div className="text-primary text-[10px]">
                                      {employee.employeeId || employee.id}
                                    </div>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{employee.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{employee.designation}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={employee.grade || "N/A"} size="small" variant="outlined" className="text-gray-800 bg-gray-200" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Assignment details */}
            <Grid size={{ xs: 12, md: breakdown ? 6 : 4, lg: breakdown ? 3 : 4 }}>
              <Stack spacing={3}>
                <Card className="bg-white h-full" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }} className="text-gray-800">
                      Assignment Details
                    </Typography>

                    <Stack spacing={3.5}>
                      <div className="p-3 rounded-sm bg-head flex items-center justify-between">
                        <Typography variant="body2" className="text-gray-800">
                          Selected Employees
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                          {selectedEmployees.length}
                        </Typography>
                      </div>

                      <FormControl fullWidth>
                        <InputLabel>Salary Template <span className="text-error">*</span></InputLabel>
                        <Select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          label="Salary Template"
                          required
                        >
                          {structures.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name} ({t.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }} className="text-gray-800">
                          CTC Amount <span className="text-error">*</span>
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            type="number"
                            value={ctcAmount || ""}
                            onChange={(e) => setCtcAmount(Number(e.target.value))}
                            placeholder="0"
                            fullWidth
                            size="small"
                          />
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={ctcMode}
                              onChange={(e) => setCtcMode(e.target.value as "annual" | "monthly")}
                              sx={selectSx}
                            >
                              <MenuItem value="annual">Annual</MenuItem>
                              <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <Accordion
                        className="bg-white-50"
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon className="text-gray-800" />}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                            Bank Details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Account Number"
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                              fullWidth
                              size="small"
                            />
                            <TextField
                              label="Bank Name"
                              value={bankDetails.bankName}
                              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                              fullWidth
                              size="small"
                            />
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 6 }}>
                                <TextField
                                  label="IFSC Code"
                                  value={bankDetails.ifscCode}
                                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                                  fullWidth
                                  size="small"
                                />
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <TextField
                                  label="Branch"
                                  value={bankDetails.branch}
                                  onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                                  fullWidth
                                  size="small"
                                />
                              </Grid>
                            </Grid>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>

                      <Button
                        variant="contained"
                        startIcon={<DollarSignIcon fontSize="small" />}
                        onClick={handleAssign}
                        fullWidth
                        className="!bg-primary"
                        sx={{ textTransform: "none" }}
                      >
                        Assign Salary Structure
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Breakdown Preview */}
            {breakdown && (
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <Card className="bg-white h-full" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} className="text-gray-800">
                        Salary Breakdown Preview
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }} className="text-gray-800">
                        Monthly estimates
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                          <Typography variant="caption" sx={{ color: "success.main" }}>
                            Gross Monthly
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "success.main" }}>
                            {formatCurrency(breakdown.grossMonthly)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ p: 1.5, borderRadius: 1, textAlign: "center", bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                          <Typography variant="caption" sx={{ color: "primary.main" }}>
                            Net Monthly
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
                            {formatCurrency(breakdown.netMonthly)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {breakdown.earnings.map((item, i) => (
                        <Box
                          key={item.name}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 0.5,
                          }}
                        >
                          <Typography variant="caption" className="text-gray-800">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }} className="text-gray-800">
                            {formatCurrency(item.value / 12)}/mo
                          </Typography>
                        </Box>
                      ))}
                      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 1, pt: 1 }}>
                        {breakdown.deductions.map((item) => (
                          <Box
                            key={item.name}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 0.5,
                            }}
                          >
                            <Typography variant="caption" className="text-gray-800" sx={{ color: "error.main" }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, color: "error.main" }}>
                              -{formatCurrency(item.value / 12)}/mo
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Tab 1: Assignments List */}
      {tabValue === 1 && (
        <Box>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <div className="text-gray-800 text-[12px] font-bold">
                Salary Assignments
              </div>
              <div className="text-gray-500 text-[12px] mt-1">
                View and manage all salary assignments
              </div>
            </Box>
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => setTabValue(0)}
              startIcon={<AssessmentOutlined />}
              sx={{ textTransform: "none" }}
            >
              New Assignment
            </Button>
          </Box>

          {/* Filters */}
          <div className="flex items-center gap-4 justify-between mb-4">
            <TextField
              placeholder="Search by employee or structure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
            />
            <div className="flex items-center gap-2">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={selectSx}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  {/* <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem> */}
                </Select>
              </FormControl>
              <IconButton onClick={loadAssignments} className="!border !border-gray-200 !rounded">
                <RefreshIcon className="!text-gray-800 !w-4" />
              </IconButton>
            </div>
          </div>

          {/* Assignments Table */}
          <TableContainer className="border border-gray-200 rounded-sm max-h-[calc(100vh-310px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold sticky left-0 !z-20">S No</TableCell>
                  <TableCell className="!font-bold sticky left-[59px] !z-20">Employee</TableCell>
                  <TableCell className="!font-bold">Structure</TableCell>
                  <TableCell className="!font-bold" align="right">Annual CTC</TableCell>
                  <TableCell className="!font-bold" align="right">Monthly CTC</TableCell>
                  <TableCell className="!font-bold">Effective From</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell className="!font-bold">Bank</TableCell>
                  <TableCell className="!font-bold sticky right-0 !z-20" align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <div className="text-gray-500">No assignments found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment, i) => {
                    const status = statusConfig[assignment.status?.toLowerCase()] || statusConfig.active;
                    return (
                      <TableRow key={assignment.id} sx={getRowColor(i)}>
                        <TableCell className="sticky left-0 bg-inherit !z-10">{i + 1}</TableCell>
                        <TableCell className="sticky left-[59px] bg-inherit !z-10">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", fontSize: "0.7rem", fontWeight: 600 }}>
                              {assignment.employeeName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {assignment.employeeName}
                              </Typography>
                              <Typography variant="caption" className="text-primary !text-[10px]">
                                {assignment.employeeCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {assignment.structureName}
                          </Typography>
                          <Typography variant="caption" className="text-blue-500 !text-[10px]">
                            {assignment.structureCode}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(assignment.annualCtc || assignment.ctcAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(assignment.monthlyCtc || (assignment.ctcAmount / 12))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(assignment.effectiveFrom)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          {assignment.bankName ? (
                            <Tooltip title={`${assignment.bankName} - ${assignment.bankAccountNumber}`}>
                              <Chip
                                label={assignment.bankName}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption">
                              Not provided
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" className="sticky right-0 bg-inherit !z-10">
                          <div className="flex items-center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewAssignment(assignment)}
                              >
                                <ViewIcon fontSize="small"  className="!w-4 text-blue-500"/>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton
                                size="small"
                                onClick={() => handleViewHistory(assignment.employeeId)}
                              >
                                <HistoryIcon fontSize="small"  className="!w-4 text-amber-500"/>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAssignment(assignment)}
                              >
                                <DeleteIcon fontSize="small"  className="!w-4 text-error"/>
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
            {totalPages > 0 && (
                    <GlobalPagination
                      total={totalCount}
                      page={page + 1}
                      limit={limit}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                      pageSizeOptions={[10, 20, 50, 100]}
                      showTotal={true}
                    />
                  )}
        </Box>
      )}

      {/* View Assignment Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" sx={dialogsx}>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
            <Typography variant="h6" className="!ml-4">Assignment Details</Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} size="small">
              <CloseIcon className="text-gray-800"/>
            </IconButton>
        </DialogTitle>
        <DialogContent className="!p-6">
          {selectedAssignment && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Employee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedAssignment.employeeName} ({selectedAssignment.employeeCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Structure</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedAssignment.structureName} ({selectedAssignment.structureCode})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Annual CTC</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                  {formatCurrency(selectedAssignment.annualCtc || selectedAssignment.ctcAmount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Monthly CTC</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(selectedAssignment.monthlyCtc || (selectedAssignment.ctcAmount / 12))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Effective From</Typography>
                <Typography variant="body2">{formatDate(selectedAssignment.effectiveFrom)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Status</Typography>
                <Chip
                  label={statusConfig[selectedAssignment.status?.toLowerCase()]?.label || selectedAssignment.status}
                  size="small"
                  sx={{
                    bgcolor: statusConfig[selectedAssignment.status?.toLowerCase()]?.bgColor || "#f3f4f6",
                    color: statusConfig[selectedAssignment.status?.toLowerCase()]?.color || "#6b7280",
                  }}
                />
              </Grid>
              {selectedAssignment.bankAccountNumber && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" className="text-blue-500">Bank Details</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Account Number</Typography>
                    <Typography variant="body2">{selectedAssignment.bankAccountNumber}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Bank Name</Typography>
                    <Typography variant="body2">{selectedAssignment.bankName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">IFSC Code</Typography>
                    <Typography variant="body2">{selectedAssignment.bankIfsc}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" className="text-gray-500 !font-bold">Branch</Typography>
                    <Typography variant="body2">{selectedAssignment.bankBranch}</Typography>
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" className="text-gray-500 !font-bold">Created At</Typography>
                <Typography variant="body2">{formatDate(selectedAssignment.createdAt)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
            <Typography variant="h6" className="!ml-4">Assignment History</Typography>
            <IconButton onClick={() => setOpenHistoryDialog(false)} size="small">
              <CloseIcon className="text-gray-800"/>
            </IconButton>
        </DialogTitle>
        <DialogContent className="!py-4">
          {assignmentHistory.length === 0 ? (
            <div className="text-center text-[12px] text-gray-500">
              No history found for this employee
            </div>
          ) : (
            <TableContainer className="border border-gray-200 rounded-md max-h-[500px]">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Structure</TableCell>
                    <TableCell >CTC</TableCell>
                    <TableCell>Effective From</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentHistory.map((history, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {history.structureName}
                        </Typography>
                        <Typography variant="caption" className="text-primary !text-[10px]">
                          {history.structureCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(history.ctcAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(history.effectiveFrom)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={history.status}
                          size="small"
                          sx={{
                            bgcolor: statusConfig[history.status?.toLowerCase()]?.bgColor || "#f3f4f6",
                            color: statusConfig[history.status?.toLowerCase()]?.color || "#6b7280",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(history.updatedAt || history.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions className="!border !border-gray-200">
          <Button onClick={() => setOpenHistoryDialog(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}