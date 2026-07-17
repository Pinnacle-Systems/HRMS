// StatutoryCompliance.tsx
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
  LinearProgress,
  IconButton,
} from "@mui/material";
import {
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const complianceData = [
  { id: "PF001", type: "PF", period: "June 2026", dueDate: "2026-07-15", status: "compliant", amount: 302400, employees: 248 },
  { id: "PF002", type: "PF", period: "May 2026", dueDate: "2026-06-15", status: "compliant", amount: 298500, employees: 245 },
  { id: "ESI001", type: "ESI", period: "June 2026", dueDate: "2026-07-20", status: "pending", amount: 85000, employees: 156 },
  { id: "TDS001", type: "TDS", period: "June 2026", dueDate: "2026-07-31", status: "non-compliant", amount: 175000, employees: 248 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function StatutoryCompliance() {
  const theme = useTheme();

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "compliant":
        return { label: "Compliant", color: "#10b981", bgColor: "#d1fae5", icon: VerifiedIcon };
      case "pending":
        return { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: WarningIcon };
      case "non-compliant":
        return { label: "Non-Compliant", color: "#ef4444", bgColor: "#fee2e2", icon: ErrorIcon };
      default:
        return { label: "Unknown", color: "#6b7280", bgColor: "#f3f4f6", icon: WarningIcon };
    }
  };

  const complianceStats = [
    { label: "Compliant", value: "5", color: "#10b981" },
    { label: "Pending", value: "2", color: "#f59e0b" },
    { label: "Non-Compliant", value: "1", color: "#ef4444" },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Statutory Compliance
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Track PF, ESI, TDS compliance and generate reports
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon fontSize="small" />} sx={{ textTransform: "none" }}>
            Generate Report
          </Button>
        </Stack>
      </Box>

      {/* Compliance Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {complianceStats.map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Compliance Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="right">Employees</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complianceData.map((item) => {
                const status = getStatusConfig(item.status);
                const Icon = status.icon;
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Chip label={item.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.period}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {item.dueDate}
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
                      <IconButton size="small">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Compliance Overview Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "success.main" }}>
                PF Compliance
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption">Compliance Rate</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>95%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={95} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "warning.main" }}>
                ESI Compliance
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption">Compliance Rate</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>78%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={78} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}` }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "error.main" }}>
                TDS Compliance
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption">Compliance Rate</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>60%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={60} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}