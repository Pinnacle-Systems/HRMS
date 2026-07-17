import { useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, Grid, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer,
  Paper, Chip, IconButton, Stack, useTheme, alpha,
  Select, MenuItem, FormControl, InputLabel, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

// Mock data
const mockReports = [
  { id: "RPT001", name: "Salary Register", type: "salary", period: "June 2026", generatedOn: "2026-07-01T10:30:00Z", status: "generated", fileSize: "2.4 MB", generatedBy: "HR Admin" },
  { id: "RPT002", name: "Department Wise Salary", type: "department", period: "June 2026", generatedOn: "2026-07-01T11:45:00Z", status: "generated", fileSize: "1.8 MB", generatedBy: "HR Admin" },
  { id: "RPT003", name: "Tax Summary", type: "tax", period: "May 2026", generatedOn: null, status: "pending", fileSize: null, generatedBy: null },
];

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

export default function PayrollReports() {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [reportType, setReportType] = useState("salary");
  const [period, setPeriod] = useState("June 2026");
  const [format, setFormat] = useState("PDF");

  const reportTypes = [
    { value: "salary", label: "Salary Register" },
    { value: "department", label: "Department Wise" },
    { value: "tax", label: "Tax Summary" },
    { value: "pfesi", label: "PF/ESI Report" },
    { value: "bank", label: "Bank Advice" },
    { value: "audit", label: "Audit Log" },
  ];

  const periods = ["June 2026", "May 2026", "April 2026", "March 2026"];

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Payroll Reports
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Generate and export payroll reports for analysis
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setOpenDialog(true)}
          sx={{ textTransform: "none" }}
        >
          Generate Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Reports", value: "12", color: "#3b82f6" },
          { label: "This Month", value: "6", color: "#10b981" },
          { label: "Last Month", value: "4", color: "#f59e0b" },
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Report Type</InputLabel>
          <Select value="" label="Report Type">
            <MenuItem value="all">All Types</MenuItem>
            {reportTypes.map((r) => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select value="" label="Period">
            {periods.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon fontSize="small" />} sx={{ textTransform: "none" }}>
          Refresh
        </Button>
      </Box>

      {/* Reports Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Report Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Generated On</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Generated By</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockReports.map((report) => {
                const statusConfig = {
                  generated: { label: "Generated", color: "#10b981", bgColor: "#d1fae5" },
                  pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
                  failed: { label: "Failed", color: "#ef4444", bgColor: "#fee2e2" },
                };
                const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.pending;

                return (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {reportTypes.find(r => r.value === report.type)?.label || report.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.period}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {report.generatedOn ? formatDate(report.generatedOn) : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {report.generatedBy || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.fileSize || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row">
                        {report.status === "generated" ? (
                          <>
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: "error.main" }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                          <Button variant="text" size="small" sx={{ textTransform: "none" }}>
                            Generate
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Quick Reports */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Reports
        </Typography>
        <Stack direction="row">
          {[
            { label: "Salary Register", icon: <FileIcon /> },
            { label: "Department Wise", icon: <ReportIcon /> },
            { label: "Tax Summary", icon: <PdfIcon /> },
            { label: "PF/ESI Report", icon: <ExcelIcon /> },
            { label: "Bank Advice", icon: <FileIcon /> },
            { label: "Audit Log", icon: <ReportIcon /> },
          ].map((item) => (
            <Button
              key={item.label}
              variant="outlined"
              startIcon={item.icon}
              sx={{ textTransform: "none" }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Generate Report Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Generate Report</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Report Type *</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type *"
              >
                {reportTypes.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Period *</InputLabel>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                label="Period *"
              >
                {periods.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Department (Optional)"
              placeholder="All Departments"
              fullWidth
              size="small"
            />

            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Format *
              </Typography>
              <RadioGroup
                row
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <FormControlLabel value="PDF" control={<Radio />} label="PDF" />
                <FormControlLabel value="Excel" control={<Radio />} label="Excel" />
                <FormControlLabel value="CSV" control={<Radio />} label="CSV" />
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ textTransform: "none" }}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}