// import { useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TableContainer,
//   Chip,
//   IconButton,
//   Stack,
//   useTheme,
//   alpha,
//   Grid,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Avatar,
//   Tabs,
//   Tab,
// } from "@mui/material";
// import {
//   CheckCircle as CheckCircleIcon,
//   Pending as PendingIcon,
//   Cancel as CancelIcon,
//   Add as AddIcon,
//   Visibility as ViewIcon,
//   Download as DownloadIcon,
// } from "@mui/icons-material";
// import { formatCurrency } from "../const";

// // Mock data
// const loanRequests = [
//   { id: "LR001", employee: "Rajesh Kumar", type: "Loan", amount: 50000, purpose: "Home Renovation", tenure: 12, emi: 4560, status: "pending", date: "2026-07-15" },
//   { id: "LR002", employee: "Priya Sharma", type: "Advance", amount: 20000, purpose: "Festival Advance", tenure: 6, emi: 3500, status: "approved", date: "2026-07-10" },
//   { id: "LR003", employee: "Amit Patel", type: "Loan", amount: 100000, purpose: "Car Purchase", tenure: 24, emi: 4800, status: "rejected", date: "2026-07-05" },
// ];

// export default function LoanAdvanceRequest() {
//   const theme = useTheme();
//   const [tabValue, setTabValue] = useState(0);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [formData, setFormData] = useState({
//     type: "Loan",
//     amount: "",
//     purpose: "",
//     tenure: "",
//     emi: "",
//   });

//   const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
//     setTabValue(newValue);
//   };

//   const statusConfig = {
//     pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: PendingIcon },
//     approved: { label: "Approved", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
//     rejected: { label: "Rejected", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
//   };

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 600 }}>
//             Loan & Advance Request
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary" }}>
//             Manage employee loan and advance requests
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon fontSize="small" />}
//           onClick={() => setOpenDialog(true)}
//           sx={{ textTransform: "none" }}
//         >
//           New Request
//         </Button>
//       </Box>

//       {/* Summary Cards */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {[
//           { label: "Pending Requests", value: "3", color: "#f59e0b" },
//           { label: "Approved", value: "12", color: "#10b981" },
//           { label: "Total Amount", value: formatCurrency(850000), color: "#3b82f6" },
//         ].map((item) => (
//           <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5 }}>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                   {item.label}
//                 </Typography>
//                 <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
//                   {item.value}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       {/* Tabs */}
//       <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
//         <Tabs value={tabValue} onChange={handleTabChange}>
//           <Tab label="All Requests" />
//           <Tab label="Pending" />
//           <Tab label="Approved" />
//           <Tab label="Rejected" />
//         </Tabs>
//       </Box>

//       {/* Table */}
//       <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Request ID</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Employee</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Amount</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Purpose</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>EMI</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loanRequests.map((req) => {
//                 const status = statusConfig[req.status as keyof typeof statusConfig];
//                 const Icon = status.icon;
//                 return (
//                   <TableRow key={req.id} hover>
//                     <TableCell>
//                       <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
//                         {req.id}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//                         <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), fontSize: "0.7rem" }}>
//                           {req.employee.split(" ").map(n => n[0]).join("")}
//                         </Avatar>
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                           {req.employee}
//                         </Typography>
//                       </Box>
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={req.type} size="small" variant="outlined" />
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                         {formatCurrency(req.amount)}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         {req.purpose}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2">
//                         {req.emi ? formatCurrency(req.emi) : "-"}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         icon={<Icon sx={{ fontSize: 14 }} />}
//                         label={status.label}
//                         size="small"
//                         sx={{
//                           bgcolor: status.bgColor,
//                           color: status.color,
//                           fontWeight: 500,
//                         }}
//                       />
//                     </TableCell>
//                     <TableCell align="center">
//                       <Stack direction="row">
//                         <IconButton size="small">
//                           <ViewIcon fontSize="small" />
//                         </IconButton>
//                         <IconButton size="small">
//                           <DownloadIcon fontSize="small" />
//                         </IconButton>
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Card>

//       {/* New Request Dialog */}
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           <Typography variant="h6">New Loan/Advance Request</Typography>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Stack spacing={2.5} sx={{ pt: 1 }}>
//             <FormControl fullWidth size="small">
//               <InputLabel>Request Type *</InputLabel>
//               <Select
//                 value={formData.type}
//                 onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//                 label="Request Type *"
//               >
//                 <MenuItem value="Loan">Loan</MenuItem>
//                 <MenuItem value="Advance">Advance</MenuItem>
//               </Select>
//             </FormControl>

//             <TextField
//               label="Amount *"
//               type="number"
//               value={formData.amount}
//               onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//               placeholder="Enter amount"
//               fullWidth
//               size="small"
//             />

//             <TextField
//               label="Purpose *"
//               value={formData.purpose}
//               onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
//               placeholder="e.g., Home Renovation"
//               fullWidth
//               size="small"
//             />

//             <TextField
//               label="Tenure (Months)"
//               type="number"
//               value={formData.tenure}
//               onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
//               placeholder="e.g., 12"
//               fullWidth
//               size="small"
//             />

//             <TextField
//               label="EMI Amount"
//               type="number"
//               value={formData.emi}
//               onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
//               placeholder="e.g., 4560"
//               fullWidth
//               size="small"
//             />
//           </Stack>
//         </DialogContent>
//         <DialogActions sx={{ p: 2.5 }}>
//           <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
//             Cancel
//           </Button>
//           <Button variant="contained" sx={{ textTransform: "none" }}>
//             Submit Request
//           </Button>
//         </DialogActions>
//       </Dialog>
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { loanAdvanceService } from "../../../services/modules/payrollServices/loanAdvanceRequest";
import { useUI } from "../../../context/Snackbar";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: PendingIcon },
  approved: { label: "Approved", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
  rejected: { label: "Rejected", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
};

export default function LoanAdvanceRequest() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    requestType: "LOAN",
    amount: 0,
    purpose: "",
    tenureMonths: 0,
    emiAmount: 0,
    employeeId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [requestsRes, summaryRes]: any = await Promise.all([
        loanAdvanceService.getLoanRequests({ size: 100 }),
        loanAdvanceService.getLoanAdvanceSummary(),
      ]);
      setRequests(requestsRes.data?.content || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load loan requests", error);
      showSnackbar("Failed to load loan requests", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.amount || !formData.purpose || !formData.tenureMonths) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    showSpinner();
    try {
      const payload = {
        ...formData,
        emiAmount: formData.emiAmount || Math.round(formData.amount / formData.tenureMonths),
      };
      const res = await loanAdvanceService.createLoanRequest(payload);
      showSnackbar("Loan request submitted successfully!", "success");
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to submit request", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleApprove = async (id: string) => {
    showSpinner();
    try {
      await loanAdvanceService.approveLoanRequest(id, { reason: "Approved by manager" });
      showSnackbar("Request approved successfully!", "success");
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to approve request", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;
    showSpinner();
    try {
      await loanAdvanceService.rejectLoanRequest(id, { reason });
      showSnackbar("Request rejected", "success");
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to reject request", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res: any = await loanAdvanceService.downloadLoanRequest(id);
      window.open(res.data.fileUrl, "_blank");
    } catch (error) {
      showSnackbar("Failed to download request", "error");
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredRequests = () => {
    switch (tabValue) {
      case 1:
        return requests.filter((r) => r.status === "pending");
      case 2:
        return requests.filter((r) => r.status === "approved");
      case 3:
        return requests.filter((r) => r.status === "rejected");
      default:
        return requests;
    }
  };

  const filteredRequests = getFilteredRequests();

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
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Loan & Advance Request
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Manage employee loan and advance requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setOpenDialog(true)}
          sx={{ textTransform: "none" }}
        >
          New Request
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Pending Requests", value: summary?.pendingRequests || 0, color: "#f59e0b" },
          { label: "Approved", value: summary?.approvedRequests || 0, color: "#10b981" },
          { label: "Total Amount", value: formatCurrency(summary?.totalAmount || 0), color: "#3b82f6" },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`All Requests (${requests.length})`} />
          <Tab label={`Pending (${requests.filter(r => r.status === "pending").length})`} />
          <Tab label={`Approved (${requests.filter(r => r.status === "approved").length})`} />
          <Tab label={`Rejected (${requests.filter(r => r.status === "rejected").length})`} />
        </Tabs>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell>Request ID</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell align="right">EMI</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const Icon = status.icon;
                  return (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {req.requestCode || req.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), fontSize: "0.7rem" }}>
                            {req.employeeName?.split(" ").map((n: string) => n[0]).join("")}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {req.employeeName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={req.requestType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(req.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {req.purpose}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {req.emiAmount ? formatCurrency(req.emiAmount) : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<Icon sx={{ fontSize: 14 }} />}
                          label={status.label}
                          size="small"
                          sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row">
                          {req.status === "pending" && (
                            <>
                              <IconButton size="small" onClick={() => handleApprove(req.id)} sx={{ color: "success.main" }}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleReject(req.id)} sx={{ color: "error.main" }}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton size="small" onClick={() => handleDownload(req.id)}>
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

      {/* New Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">New Loan/Advance Request</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Request Type *</InputLabel>
              <Select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                label="Request Type *"
              >
                <MenuItem value="LOAN">Loan</MenuItem>
                <MenuItem value="ADVANCE">Advance</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Amount *"
              type="number"
              value={formData.amount || ""}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="Enter amount"
              fullWidth
              size="small"
            />

            <TextField
              label="Purpose *"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g., Home Renovation"
              fullWidth
              size="small"
            />

            <TextField
              label="Tenure (Months) *"
              type="number"
              value={formData.tenureMonths || ""}
              onChange={(e) => setFormData({ ...formData, tenureMonths: Number(e.target.value) })}
              placeholder="e.g., 12"
              fullWidth
              size="small"
            />

            <TextField
              label="EMI Amount (Optional)"
              type="number"
              value={formData.emiAmount || ""}
              onChange={(e) => setFormData({ ...formData, emiAmount: Number(e.target.value) })}
              placeholder="Auto-calculated if left empty"
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleCreateRequest} variant="contained" sx={{ textTransform: "none" }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}