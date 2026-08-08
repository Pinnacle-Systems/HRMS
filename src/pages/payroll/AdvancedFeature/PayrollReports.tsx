// import { useState } from "react";
// import {
//   Box, Card, CardContent, Typography, Button, Grid, Table,
//   TableBody, TableCell, TableHead, TableRow, TableContainer,
//   Chip, IconButton, Stack, useTheme, alpha,
//   Select, MenuItem, FormControl, InputLabel, TextField,
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   RadioGroup, FormControlLabel, Radio
// } from "@mui/material";
// import {
//   Download as DownloadIcon,
//   Visibility as ViewIcon,
//   Refresh as RefreshIcon,
//   Description as FileIcon,
//   PictureAsPdf as PdfIcon,
//   TableChart as ExcelIcon,
//   Assessment as ReportIcon,
//   Add as AddIcon,
//   Delete as DeleteIcon
// } from "@mui/icons-material";

// // Mock data
// const mockReports = [
//   { id: "RPT001", name: "Salary Register", type: "salary", period: "June 2026", generatedOn: "2026-07-01T10:30:00Z", status: "generated", fileSize: "2.4 MB", generatedBy: "HR Admin" },
//   { id: "RPT002", name: "Department Wise Salary", type: "department", period: "June 2026", generatedOn: "2026-07-01T11:45:00Z", status: "generated", fileSize: "1.8 MB", generatedBy: "HR Admin" },
//   { id: "RPT003", name: "Tax Summary", type: "tax", period: "May 2026", generatedOn: null, status: "pending", fileSize: null, generatedBy: null },
// ];

// const formatDate = (dateString: string) => {
//   if (!dateString) return "-";
//   return new Date(dateString).toLocaleString("en-IN", {
//     day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
//   });
// };

// export default function PayrollReports() {
//   const theme = useTheme();
//   const [openDialog, setOpenDialog] = useState(false);
//   const [reportType, setReportType] = useState("salary");
//   const [period, setPeriod] = useState("June 2026");
//   const [format, setFormat] = useState("PDF");

//   const reportTypes = [
//     { value: "salary", label: "Salary Register" },
//     { value: "department", label: "Department Wise" },
//     { value: "tax", label: "Tax Summary" },
//     { value: "pfesi", label: "PF/ESI Report" },
//     { value: "bank", label: "Bank Advice" },
//     { value: "audit", label: "Audit Log" },
//   ];

//   const periods = ["June 2026", "May 2026", "April 2026", "March 2026"];

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 600 }}>
//             Payroll Reports
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary" }}>
//             Generate and export payroll reports for analysis
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon fontSize="small" />}
//           onClick={() => setOpenDialog(true)}
//           sx={{ textTransform: "none" }}
//         >
//           Generate Report
//         </Button>
//       </Box>

//       {/* Summary Cards */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {[
//           { label: "Total Reports", value: "12", color: "#3b82f6" },
//           { label: "This Month", value: "6", color: "#10b981" },
//           { label: "Last Month", value: "4", color: "#f59e0b" },
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

//       {/* Filters */}
//       <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
//         <FormControl size="small" sx={{ minWidth: 200 }}>
//           <InputLabel>Report Type</InputLabel>
//           <Select value="" label="Report Type">
//             <MenuItem value="all">All Types</MenuItem>
//             {reportTypes.map((r) => (
//               <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <FormControl size="small" sx={{ minWidth: 150 }}>
//           <InputLabel>Period</InputLabel>
//           <Select value="" label="Period">
//             {periods.map((p) => (
//               <MenuItem key={p} value={p}>{p}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         <Button variant="outlined" startIcon={<RefreshIcon fontSize="small" />} sx={{ textTransform: "none" }}>
//           Refresh
//         </Button>
//       </Box>

//       {/* Reports Table */}
//       <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Report Type</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Period</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Generated On</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Generated By</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Size</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Status</TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }} align="center">Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {mockReports.map((report) => {
//                 const statusConfig = {
//                   generated: { label: "Generated", color: "#10b981", bgColor: "#d1fae5" },
//                   pending: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
//                   failed: { label: "Failed", color: "#ef4444", bgColor: "#fee2e2" },
//                 };
//                 const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.pending;

//                 return (
//                   <TableRow key={report.id} hover>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                         {reportTypes.find(r => r.value === report.type)?.label || report.type}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2">{report.period}</Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         {report.generatedOn ? formatDate(report.generatedOn) : ''}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                         {report.generatedBy || "-"}
//                       </Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Typography variant="body2">{report.fileSize || "-"}</Typography>
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={status.label}
//                         size="small"
//                         sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
//                       />
//                     </TableCell>
//                     <TableCell align="center">
//                       <Stack direction="row">
//                         {report.status === "generated" ? (
//                           <>
//                             <IconButton size="small">
//                               <ViewIcon fontSize="small" />
//                             </IconButton>
//                             <IconButton size="small">
//                               <DownloadIcon fontSize="small" />
//                             </IconButton>
//                             <IconButton size="small" sx={{ color: "error.main" }}>
//                               <DeleteIcon fontSize="small" />
//                             </IconButton>
//                           </>
//                         ) : (
//                           <Button variant="text" size="small" sx={{ textTransform: "none" }}>
//                             Generate
//                           </Button>
//                         )}
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Card>

//       {/* Quick Reports */}
//       <Box sx={{ mt: 3 }}>
//         <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
//           Quick Reports
//         </Typography>
//         <Stack direction="row">
//           {[
//             { label: "Salary Register", icon: <FileIcon /> },
//             { label: "Department Wise", icon: <ReportIcon /> },
//             { label: "Tax Summary", icon: <PdfIcon /> },
//             { label: "PF/ESI Report", icon: <ExcelIcon /> },
//             { label: "Bank Advice", icon: <FileIcon /> },
//             { label: "Audit Log", icon: <ReportIcon /> },
//           ].map((item) => (
//             <Button
//               key={item.label}
//               variant="outlined"
//               startIcon={item.icon}
//               sx={{ textTransform: "none" }}
//             >
//               {item.label}
//             </Button>
//           ))}
//         </Stack>
//       </Box>

//       {/* Generate Report Dialog */}
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           <Typography variant="h6">Generate Report</Typography>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Stack spacing={2.5} sx={{ pt: 1 }}>
//             <FormControl fullWidth size="small">
//               <InputLabel>Report Type *</InputLabel>
//               <Select
//                 value={reportType}
//                 onChange={(e) => setReportType(e.target.value)}
//                 label="Report Type *"
//               >
//                 {reportTypes.map((r) => (
//                   <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             <FormControl fullWidth size="small">
//               <InputLabel>Period *</InputLabel>
//               <Select
//                 value={period}
//                 onChange={(e) => setPeriod(e.target.value)}
//                 label="Period *"
//               >
//                 {periods.map((p) => (
//                   <MenuItem key={p} value={p}>{p}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>

//             <TextField
//               label="Department (Optional)"
//               placeholder="All Departments"
//               fullWidth
//               size="small"
//             />

//             <FormControl component="fieldset">
//               <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
//                 Format *
//               </Typography>
//               <RadioGroup
//                 row
//                 value={format}
//                 onChange={(e) => setFormat(e.target.value)}
//               >
//                 <FormControlLabel value="PDF" control={<Radio />} label="PDF" />
//                 <FormControlLabel value="Excel" control={<Radio />} label="Excel" />
//                 <FormControlLabel value="CSV" control={<Radio />} label="CSV" />
//               </RadioGroup>
//             </FormControl>
//           </Stack>
//         </DialogContent>
//         <DialogActions sx={{ p: 2.5 }}>
//           <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ textTransform: "none" }}>
//             Cancel
//           </Button>
//           <Button variant="contained" sx={{ textTransform: "none" }}>
//             Generate
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
  Grid,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
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
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { reportsService } from "../../../services/modules/payrollServices/reports";
import { useUI } from "../../../context/Snackbar";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PayrollReports() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    reportType: "salary",
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    format: "PDF",
  });

  const reportTypes = [
    { value: "salary", label: "Salary Register" },
    { value: "department", label: "Department Wise" },
    { value: "tax", label: "Tax Summary" },
    { value: "pfesi", label: "PF/ESI Report" },
    { value: "bank", label: "Bank Advice" },
    { value: "audit", label: "Audit Log" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [reportsRes, summaryRes]: any = await Promise.all([
        reportsService.getPayrollReports(),
        reportsService.getPayrollReportSummary(),
      ]);
      setReports(reportsRes.data?.content || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Failed to load reports", error);
      showSnackbar("Failed to load reports", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    showSpinner();
    try {
      const res = await reportsService.generatePayrollReport({
        reportType: formData.reportType,
        periodYear: formData.periodYear,
        periodMonth: formData.periodMonth,
      });
      showSnackbar("Report generated successfully!", "success");
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to generate report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res:any = await reportsService.downloadPayrollReport(id);
      window.open(res.data.fileUrl, "_blank");
    } catch (error) {
      showSnackbar("Failed to download report", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    showSpinner();
    try {
      await reportsService.deletePayrollReport(id);
      showSnackbar("Report deleted successfully!", "success");
      loadData();
    } catch (error) {
      showSnackbar("Failed to delete report", "error");
    } finally {
      hideSpinner();
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
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Payroll Reports
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Generate and export payroll reports for analysis
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => setOpenDialog(true)} sx={{ textTransform: "none" }}>
          Generate Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Reports", value: summary?.totalReports || 0, color: "#3b82f6" },
          { label: "This Month", value: summary?.thisMonth || 0, color: "#10b981" },
          { label: "Pending", value: summary?.pending || 0, color: "#f59e0b" },
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

      {/* Reports Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell>Report Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Generated On</TableCell>
                <TableCell>Generated By</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => {
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
                          {reportTypes.find(r => r.value === report.reportType)?.label || report.reportType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{report.periodLabel}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {formatDate(report.generatedOn)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {report.generatedByName || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{report.size || "-"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={status.label} size="small" sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row">
                          {report.status === "generated" ? (
                            <>
                              <IconButton size="small" onClick={() => handleDownload(report.id)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(report.id)} sx={{ color: "error.main" }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <Button variant="text" size="small" onClick={() => handleGenerate()} sx={{ textTransform: "none" }}>
                              Generate
                            </Button>
                          )}
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
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                label="Report Type *"
              >
                {reportTypes.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="number"
                  label="Year"
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: Number(e.target.value) })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="number"
                  label="Month"
                  value={formData.periodMonth}
                  onChange={(e) => setFormData({ ...formData, periodMonth: Number(e.target.value) })}
                  fullWidth
                  size="small"
                  // inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
            </Grid>

            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Format *
              </Typography>
              <RadioGroup
                row
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
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
          <Button onClick={handleGenerate} variant="contained" sx={{ textTransform: "none" }}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}