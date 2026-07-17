// BankAdvice.tsx
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
  Stack,
  useTheme,
  alpha,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Description as FileIcon,
} from "@mui/icons-material";

const bankAdviceData = [
  { id: "BA001", bank: "HDFC Bank", account: "1234****5678", amount: 850000, employees: 95, status: "generated", date: "2026-07-05" },
  { id: "BA002", bank: "ICICI Bank", account: "8765****4321", amount: 620000, employees: 72, status: "pending", date: "2026-07-05" },
  { id: "BA003", bank: "SBI", account: "9988****7766", amount: 410000, employees: 48, status: "generated", date: "2026-07-05" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BankAdvice() {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Bank Advice
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Generate bank payment files (NEFT/RTGS) and advice documents
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Refresh
          </Button>
          <Button variant="contained" onClick={() => setOpenDialog(true)} sx={{ textTransform: "none" }}>
            Generate Bank Advice
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Amount", value: formatCurrency(1880000), color: "#3b82f6" },
          { label: "Total Employees", value: "215", color: "#10b981" },
          { label: "Banks", value: "3", color: "#f59e0b" },
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

      {/* Bank Advice Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Advice ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Bank</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Employees</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankAdviceData.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {item.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.bank}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {item.account}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(item.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.employees}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      size="small"
                      sx={{
                        bgcolor: item.status === "generated" ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                        color: item.status === "generated" ? "success.main" : "warning.main",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {item.date}
                    </Typography>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Generate Bank Advice</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Payroll Period *</InputLabel>
              <Select value="" label="Payroll Period *">
                <MenuItem value="june2026">June 2026</MenuItem>
                <MenuItem value="may2026">May 2026</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Bank *</InputLabel>
              <Select value="" label="Bank *">
                <MenuItem value="hdfc">HDFC Bank</MenuItem>
                <MenuItem value="icici">ICICI Bank</MenuItem>
                <MenuItem value="sbi">State Bank of India</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>File Format</InputLabel>
              <Select value="neft" label="File Format">
                <MenuItem value="neft">NEFT</MenuItem>
                <MenuItem value="rtgs">RTGS</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<FileIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Generate File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}