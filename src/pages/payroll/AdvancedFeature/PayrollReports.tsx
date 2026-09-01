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
} from "@mui/material";
import {
  Download as DownloadIcon,
  Add as AddIcon,
  CloseOutlined,
  DeleteForeverOutlined,
} from "@mui/icons-material";
import { reportsService } from "../../../services/modules/payrollServices/reports";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { apiService } from "../../../services";

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
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Pagination state (0-based for API)
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    reportType: "SALARY_REGISTER",
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    format: "PDF",
  });

  const reportTypes = [
    { value: "SALARY_REGISTER", label: "Salary Register" },
    { value: "DEPARTMENT_WISE", label: "Department Wise" },
    { value: "TAX_SUMMARY", label: "Tax Summary" },
    { value: "PF_ESI", label: "PF/ESI Report" },
    { value: "BANK_ADVICE", label: "Bank Advice" },
    { value: "AUDIT_LOG", label: "Audit Log" },
  ];

  const statusConfig = {
    GENERATED: { label: "Generated", color: "#10b981", bgColor: "#d1fae5" },
    PENDING: { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7" },
    FAILED: { label: "Failed", color: "#ef4444", bgColor: "#fee2e2" },
  };

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const loadData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [reportsRes, summaryRes]: any = await Promise.all([
        reportsService.getPayrollReports({
          page: page,
          size: limit,
        }),
        reportsService.getPayrollReportSummary(),
      ]);

      const data = reportsRes.data || reportsRes;
      const content = data.content || data.items || [];
      setReports(content);
      setTotal(data.totalElements || data.total || content.length);
      setSummary(summaryRes.data);
    } catch (error) {
      showSnackbar("Failed to load reports", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    showSpinner();
    try {
      await reportsService.generatePayrollReport({
        reportType: formData.reportType,
        periodYear: formData.periodYear,
        periodMonth: formData.periodMonth,
      });
      showSnackbar("Report generated successfully!", "success");
      setOpenDialog(false);
      setPage(0);
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to generate report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDownload = async (id: any) => {
    try {
      const res: any = await reportsService.downloadPayrollReport(id.id);
      if (res.data?.fileUrl) {
        await apiService.downloadFromPath(res.data?.fileUrl, `attendance_${id.reportType}.pdf`)
      } else if (res.data instanceof Blob) {
        const url = window.URL.createObjectURL(res.data);
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      showSnackbar("Failed to download report", "error");
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmDialog({
      title: 'Delete Report',
      message: `Are you sure you want to delete this report?`,
      confirmText: 'Delete',
      onConfirm: async () => {
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
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800" sx={{ fontWeight: 600 }}>
            Payroll Reports
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Generate and export payroll reports for analysis
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setOpenDialog(true)}
          className="!bg-primary"
        >
          Generate Report
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Reports", value: summary?.totalReports || total || 0, color: "#3b82f6" },
          { label: "This Month", value: summary?.thisMonth || 0, color: "#10b981" },
          { label: "Pending", value: summary?.pending || 0, color: "#f59e0b" },
        ].map((item) => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" className="text-gray-500">
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
      <TableContainer className="h-[calc(100vh-295px)] overflow-auto">
        <Table className="bg-white-50 border border-gray-200 rounded-sm ">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>S No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Report Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Generated By</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography className="text-gray-500">Loading reports...</Typography>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{color: "text.secondary" }}>
                  <div className="py-6"> No reports found</div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report, i) => {
                const status = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.PENDING;
                const serialNumber = page * limit + i + 1;

                return (
                  <TableRow key={report.id} sx={getRowColor(i)}>
                    <TableCell>{serialNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.reportTypeLabel || reportTypes.find(r => r.value === report.reportType)?.label || report.reportType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.periodLabel}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-500">
                        {formatDate(report.generatedOn)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-500">
                        {report.generatedByName || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{report.size || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center">
                        {report.status === "GENERATED" ? (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(report)}
                              title="Download"
                            >
                              <DownloadIcon fontSize="small" className="!w-4 text-green-600" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(report.id)}
                              sx={{ color: "error.main" }}
                              title="Delete"
                            >
                              <DeleteForeverOutlined fontSize="small" className="!w-4" />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            variant="text"
                            size="small"
                            onClick={handleGenerate}
                            sx={{ textTransform: "none" }}
                          >
                            Generate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Global Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1} // Convert from 0-based to 1-based for UI
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={true}
        />
      )}

      {/* Generate Report Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200">
          <Typography variant="h6" component="div">Generate Report</Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-5 !mt-2">
          <Stack spacing={3} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Report Type</InputLabel>
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
                Format
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
        <DialogActions sx={{ p: 2.5 }} className="!border-t !border-gray-200">
          <Button onClick={() => setOpenDialog(false)} variant="outlined" className="!text-gray-800 !border-gray-200">
            Cancel
          </Button>
          <Button onClick={handleGenerate} variant="contained" className="!bg-primary">
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}