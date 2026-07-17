import { useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, Grid, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer,
  Paper, Chip, IconButton, Stack, useTheme, alpha,
  Select, MenuItem, FormControl, InputLabel, TextField,
  InputAdornment, Pagination
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from "@mui/icons-material";

// Mock data
const mockAuditLogs = [
  { id: "AUD001", timestamp: "2026-07-17T14:30:00Z", userName: "HR Admin", action: "PAYROLL_RUN_GENERATED", entityType: "PAYROLL_RUN", entityId: "PR-2026-001", details: { period: "June 2026", employeeCount: 248 } },
  { id: "AUD002", timestamp: "2026-07-17T13:15:00Z", userName: "Finance Manager", action: "PAYROLL_APPROVED", entityType: "PAYROLL_RUN", entityId: "PR-2026-001", details: { period: "June 2026" } },
  { id: "AUD003", timestamp: "2026-07-17T11:00:00Z", userName: "HR Admin", action: "EMPLOYEE_ASSIGNED", entityType: "EMPLOYEE", entityId: "EMP001", details: { structure: "L1" } },
];

const actionLabels: Record<string, string> = {
  PAYROLL_RUN_GENERATED: "Payroll Run Generated",
  PAYROLL_RUN_PROCESSED: "Payroll Run Processed",
  PAYROLL_APPROVED: "Payroll Approved",
  PAYROLL_REJECTED: "Payroll Rejected",
  PAYSLIP_GENERATED: "Payslip Generated",
  PAYSLIP_DOWNLOADED: "Payslip Downloaded",
  EMPLOYEE_ASSIGNED: "Employee Assigned",
  COMPONENT_CREATED: "Component Created",
  COMPONENT_UPDATED: "Component Updated",
  COMPONENT_DELETED: "Component Deleted",
};

export default function PayrollAudit() {
  const theme = useTheme();
  const [page, setPage] = useState(1);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Payroll Audit Logs
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Track all payroll activities and changes
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
        >
          Export Logs
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Events", value: "1,847", color: "#3b82f6" },
          { label: "Today", value: "45", color: "#10b981" },
          { label: "This Week", value: "238", color: "#f59e0b" },
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

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search..."
          size="small"
          sx={{ flex: 1, minWidth: 200, maxWidth: 300 }}
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action Type</InputLabel>
          <Select value="" label="Action Type">
            <MenuItem value="all">All Actions</MenuItem>
            {Object.entries(actionLabels).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Date Range</InputLabel>
          <Select value="" label="Date Range">
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon fontSize="small" />} sx={{ textTransform: "none" }}>
          Reset
        </Button>
      </Box>

      {/* Audit Logs Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {log.userName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={actionLabels[log.action] || log.action}
                      size="small"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.entityType} <span style={{ color: theme.palette.text.secondary }}>#{log.entityId}</span>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(", ")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Showing 1-10 of 1,847 logs
        </Typography>
        <Pagination count={93} page={page} onChange={handlePageChange} color="primary" shape="rounded" />
      </Box>
    </Box>
  );
}