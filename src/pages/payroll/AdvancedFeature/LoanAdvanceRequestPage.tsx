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
  CloseOutlined,
  Edit as EditIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { loanAdvanceService } from "../../../services/modules/payrollServices/loanAdvanceRequest";
import { useUI } from "../../../context/Snackbar";
import { useAuth } from "../../../auth/authContext";
import { getRowColor } from "../../const";
import { apiService } from "../../../services";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: PendingIcon },
  APPROVED: { label: "Approved", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
  REJECTED: { label: "Rejected", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
};

export default function LoanAdvanceRequest() {
  const theme = useTheme();
  const { session } = useAuth();
  const isAdmin = session?.user.roles.includes('ADMIN');
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    requestType: "LOAN",
    amount: 0,
    purpose: "",
    tenureMonths: 0,
    emiAmount: 0,
    employeeId: session?.user?.employeeId ? session?.user?.employeeId : session?.user?.userId,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    showSpinner();
    try {
      const [requestsRes, summaryRes]: any = await Promise.all([
        isAdmin ? loanAdvanceService.getLoanRequests({ size: 100 }) : loanAdvanceService.getMyLoanRequests({ size: 100 }),
        loanAdvanceService.getLoanAdvanceSummary(),
      ]);
      setRequests(requestsRes.data?.content || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load loan requests", error);
      showSnackbar("Failed to load loan requests", "error");
    } finally {
      hideSpinner();
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
      await loanAdvanceService.createLoanRequest(payload);
      showSnackbar("Loan request submitted successfully!", "success");
      setOpenDialog(false);
      setIsEditMode(false);
      setEditingRequestId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to submit request", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateRequest = async () => {
    if (!editingRequestId) {
      showSnackbar("No request selected for update", "warning");
      return;
    }
    if (!formData.amount || !formData.purpose || !formData.tenureMonths) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    showSpinner();
    try {
      const payload = {
        requestType: formData.requestType,
        amount: formData.amount,
        purpose: formData.purpose,
        tenureMonths: formData.tenureMonths,
        emiAmount: formData.emiAmount || Math.round(formData.amount / formData.tenureMonths),
      };
      await loanAdvanceService.updateLoanRequest(editingRequestId, payload);
      showSnackbar("Loan request updated successfully!", "success");
      setOpenDialog(false);
      setIsEditMode(false);
      setEditingRequestId(null);
      resetForm();
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to update request", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleEditClick = (request: any) => {
    // Only allow editing if status is PENDING
    if (request.status !== "PENDING") {
      showSnackbar("Only pending requests can be edited", "warning");
      return;
    }
    setIsEditMode(true);
    setEditingRequestId(request.id);
    setFormData({
      requestType: request.requestType || "LOAN",
      amount: request.amount || 0,
      purpose: request.purpose || "",
      tenureMonths: request.tenureMonths || 0,
      emiAmount: request.emiAmount || 0,
      employeeId: request.employeeId || session?.user?.employeeId || session?.user?.userId,
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      requestType: "LOAN",
      amount: 0,
      purpose: "",
      tenureMonths: 0,
      emiAmount: 0,
      employeeId: session?.user?.employeeId ? session?.user?.employeeId : session?.user?.userId,
    });
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

  const handleDownload = async (req: any) => {
    try {
      const res: any = await loanAdvanceService.downloadLoanRequest(req.id);
      await apiService.downloadFromPath(res.data.fileUrl, `loan_request_${req.requestCode || req.id}.pdf`);
    } catch (error) {
      showSnackbar("Failed to download request", "error");
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setIsEditMode(false);
    setEditingRequestId(null);
    resetForm();
  };

  const getFilteredRequests = () => {
    switch (tabValue) {
      case 1:
        return requests.filter((r) => r.status === "PENDING");
      case 2:
        return requests.filter((r) => r.status === "APPROVED");
      case 3:
        return requests.filter((r) => r.status === "REJECTED");
      default:
        return requests;
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Loan & Advance Request
          </Typography>
          <Typography className="text-gray-500 !mt-1">
            Manage employee loan and advance requests
          </Typography>
        </Box>
        {!isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              setIsEditMode(false);
              setEditingRequestId(null);
              resetForm();
              setOpenDialog(true);
            }}
            className="!bg-primary"
          >
            New Request
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {[
          { label: "Pending Requests", value: summary?.pendingRequests || 0, color: "#f59e0b" },
          { label: "Approved", value: summary?.approvedRequests || 0, color: "#10b981" },
          { label: "Rejected", value: summary?.rejectedRequests || 0, color: "#f81414" },
          { label: "Approved Amount", value: formatCurrency(summary?.approvedAmount || 0), color: "#02ca2a" },
          { label: "Total Amount", value: formatCurrency(summary?.totalAmount || 0), color: "#3b82f6" },
        ].map((item) => (
          <Grid size={{ xs: 6, sm: 2.4, lg: 2.4 }} key={item.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" className="text-gray-800">
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
      <Box className="border-b border-gray-200 bg-white">
        <Tabs value={tabValue} onChange={handleTabChange} sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--color-primary)",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}>
          <Tab label={`All Requests (${requests.length})`} className="!text-gray-800" />
          <Tab label={`Pending (${requests.filter(r => r.status === "PENDING").length})`} className="!text-gray-800" />
          <Tab label={`Approved (${requests.filter(r => r.status === "APPROVED").length})`} className="!text-gray-800" />
          <Tab label={`Rejected (${requests.filter(r => r.status === "REJECTED").length})`} className="!text-gray-800" />
        </Tabs>
      </Box>

      {/* Table */}
      <TableContainer className="border border-gray-200 bg-white">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">Request ID</TableCell>
              <TableCell className="!font-bold">Employee</TableCell>
              <TableCell className="!font-bold">Type</TableCell>
              <TableCell className="!font-bold">Amount</TableCell>
              <TableCell className="!font-bold">Purpose</TableCell>
              <TableCell className="!font-bold">EMI</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <div className="py-6 text-gray-500">No requests found</div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req, i) => {
                const status = statusConfig[req.status] || statusConfig.PENDING;
                const Icon = status.icon;
                return (
                  <TableRow key={req.id} sx={getRowColor(i)}>
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
                      <Chip label={req.requestType} size="small" variant="outlined" className="text-gray-800" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(req.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-800">
                        {req.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {req.emiAmount ? formatCurrency(req.emiAmount) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon sx={{ fontSize: 14 }} color={status.color} />}
                        label={status.label}
                        size="small"
                        sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                        {/* Edit button - only for pending requests and for the employee who created it or admin */}
                        {(req.status === "PENDING" && (!isAdmin || req.employeeId === session?.user?.userId)) && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(req)}
                            sx={{ color: "info.main" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        {/* Approve/Reject buttons - Admin/Manager only */}
                        {isAdmin && req.status === "PENDING" && (
                          <>
                            <IconButton 
                              size="small" 
                              onClick={() => handleApprove(req.id)} 
                              sx={{ color: "success.main" }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleReject(req.id)} 
                              sx={{ color: "error.main" }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                       
                          </>
                        )}
                        {
                          isAdmin && 
                           <IconButton size="small" onClick={() => handleDownload(req)}>
                          <DownloadIcon fontSize="small" color="primary" />
                        </IconButton>
                        }
                        {
                          req.status != 'PENDING' && !isAdmin &&
                          <div className="text-gray-500">No actions</div>
                        }
                        
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Request Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b border-gray-200 !p-2 flex items-center justify-between">
          <Typography variant="h6" className="!ml-4">
            {isEditMode ? "Edit Loan/Advance Request" : "New Loan/Advance Request"}
          </Typography>
          <IconButton onClick={handleDialogClose}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-5">
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Request Type</InputLabel>
              <Select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                label="Request Type"
              >
                <MenuItem value="LOAN">Loan</MenuItem>
                <MenuItem value="ADVANCE">Advance</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount || ""}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="Enter amount"
              fullWidth
              required
            />

            <TextField
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g., Home Renovation"
              fullWidth
              required
            />

            <TextField
              label="Tenure (Months)"
              type="number"
              value={formData.tenureMonths || ""}
              onChange={(e) => setFormData({ ...formData, tenureMonths: Number(e.target.value) })}
              placeholder="e.g., 12"
              fullWidth
              required
            />

            <TextField
              label="EMI Amount (Optional)"
              type="number"
              value={formData.emiAmount || ""}
              onChange={(e) => setFormData({ ...formData, emiAmount: Number(e.target.value) })}
              placeholder="Auto-calculated if left empty"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions className="border-t border-gray-200" sx={{ p: 2 }}>
          <Button onClick={handleDialogClose} variant="outlined" className="!border-gray-200 !text-gray-800">
            Cancel
          </Button>
          <Button 
            onClick={isEditMode ? handleUpdateRequest : handleCreateRequest} 
            variant="contained" 
            className="!bg-primary"
          >
            {isEditMode ? "Update Request" : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}