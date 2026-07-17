import { useState } from "react";
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
  Paper,
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
} from "@mui/material";
import {
  RequestPage as RequestIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

// Mock data
const loanRequests = [
  { id: "LR001", employee: "Rajesh Kumar", type: "Loan", amount: 50000, purpose: "Home Renovation", tenure: 12, emi: 4560, status: "pending", date: "2026-07-15" },
  { id: "LR002", employee: "Priya Sharma", type: "Advance", amount: 20000, purpose: "Festival Advance", tenure: 6, emi: 3500, status: "approved", date: "2026-07-10" },
  { id: "LR003", employee: "Amit Patel", type: "Loan", amount: 100000, purpose: "Car Purchase", tenure: 24, emi: 4800, status: "rejected", date: "2026-07-05" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function LoanAdvanceRequest() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: "Loan",
    amount: "",
    purpose: "",
    tenure: "",
    emi: "",
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const statusConfig = {
    pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: PendingIcon },
    approved: { label: "Approved", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircleIcon },
    rejected: { label: "Rejected", color: "#ef4444", bgColor: "#fee2e2", icon: CancelIcon },
  };

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
          { label: "Pending Requests", value: "3", color: "#f59e0b" },
          { label: "Approved", value: "12", color: "#10b981" },
          { label: "Total Amount", value: formatCurrency(850000), color: "#3b82f6" },
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
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Request ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>EMI</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loanRequests.map((req) => {
                const status = statusConfig[req.status as keyof typeof statusConfig];
                const Icon = status.icon;
                return (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                        {req.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), fontSize: "0.7rem" }}>
                          {req.employee.split(" ").map(n => n[0]).join("")}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {req.employee}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={req.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(req.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {req.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {req.emi ? formatCurrency(req.emi) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon sx={{ fontSize: 14 }} />}
                        label={status.label}
                        size="small"
                        sx={{
                          bgcolor: status.bgColor,
                          color: status.color,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row">
                        <IconButton size="small">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Request Type *"
              >
                <MenuItem value="Loan">Loan</MenuItem>
                <MenuItem value="Advance">Advance</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Amount *"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              label="Tenure (Months)"
              type="number"
              value={formData.tenure}
              onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
              placeholder="e.g., 12"
              fullWidth
              size="small"
            />

            <TextField
              label="EMI Amount"
              type="number"
              value={formData.emi}
              onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
              placeholder="e.g., 4560"
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ textTransform: "none" }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}