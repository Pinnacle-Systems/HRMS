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
  Stack,
  useTheme,
  alpha,
  Grid,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import {
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { complianceService } from "../../../services/modules/payrollServices/compliance";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import { dialogsx } from "../../../const";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { apiService } from "../../../services";

const statusOptions = ["COMPLIANT", "PENDING", "NON_COMPLIANT"];

export default function StatutoryCompliance() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    dueDate: new Date().toISOString().split('T')[0],
    amount: 0,
    employeeCount: 0,
    status: "pending",
    filedDate: "",
    referenceNumber: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // setLoading(true);
    showSpinner();
    try {
      const [overviewRes, filingsRes]: any = await Promise.all([
        complianceService.getComplianceOverview({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }),
        complianceService.getCompliance({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          size: 100,
        }),
      ]);
      setOverview(overviewRes.data);
      setComplianceData(filingsRes.data?.content || []);
    } catch (error) {
      console.error("Failed to load compliance data", error);
      showSnackbar("Failed to load compliance data", "error");
    } finally {
      hideSpinner();
      // setLoading(false);
    }
  };

  const handleDownload = async (item: any) => {
    try {
      const res: any = await complianceService.downloadCompliance(item.id);
      console.log(res.data.fileUrl);
      
      await apiService.downloadFromPath(res.data.fileUrl, `statutory_${item.type}_${item.periodLabel}.pdf`);
      showSnackbar("Compliance exported successfully", "success");
    } catch (error) {
      showSnackbar("Failed to download report", "error");
    }
  };

  const handleGenerateReport = async () => {
    showSpinner();
    try {
      const res: any = await complianceService.generateComplianceReport({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
      window.open(res.data.fileUrl, "_blank");
      showSnackbar("Report generated successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to generate report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({
      type: "",
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      dueDate: new Date().toISOString().split('T')[0],
      amount: 0,
      employeeCount: 0,
      status: "pending",
      filedDate: "",
      referenceNumber: "",
      remarks: "",
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = async (id: string) => {
    showSpinner();
    try {
      const res: any = await complianceService.getComplianceById(id);
      const data = res.data;
      setIsEditing(true);
      setSelectedId(id);
      setFormData({
        type: data.type || "",
        periodYear: data.periodYear || new Date().getFullYear(),
        periodMonth: data.periodMonth || new Date().getMonth() + 1,
        dueDate: data.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        amount: data.amount || 0,
        employeeCount: data.employeeCount || 0,
        status: data.status || "pending",
        filedDate: data.filedDate?.split('T')[0] || "",
        referenceNumber: data.referenceNumber || "",
        remarks: data.remarks || "",
      });
      setOpenDialog(true);
    } catch (error) {
      showSnackbar("Failed to load compliance record", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleSave = async () => {
    if (!formData.type || !formData.dueDate) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }

    showSpinner();
    try {
      if (isEditing && selectedId) {
        await complianceService.updateCompliance(selectedId, formData);
        showSnackbar("Compliance record updated successfully!", "success");
      } else {
        await complianceService.createCompliance(formData);
        showSnackbar("Compliance record created successfully!", "success");
      }
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to save compliance record", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (item: any) => {
    showConfirmDialog({
      title: 'Delete Compliance Record',
      message: `Are you sure you want to delete "${item.type}" record for ${item.periodLabel}?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await complianceService.deleteCompliance(item.id);
          showSnackbar("Compliance record deleted successfully!", "success");
          loadData();
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete record", "error");
        } finally {
          hideSpinner();
        }
      }
    });
  };

  // const handleUpdateStatus = async (id: string, status: string) => {
  //   showConfirmDialog({
  //     title: 'Update Status',
  //     message: `Are you sure you want to update status to "${status}"?`,
  //     confirmText: 'Update',
  //     onConfirm: async () => {
  //       try {
  //         showSpinner();
  //         await complianceService.updateComplianceStatus(id, status);
  //         showSnackbar("Status updated successfully!", "success");
  //         loadData();
  //       } catch (error: any) {
  //         showSnackbar(error?.message || "Failed to update status", "error");
  //       } finally {
  //         hideSpinner();
  //       }
  //     }
  //   });
  // };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "compliant":
        return { label: "Compliant", color: "#10b981", bgColor: "#d1fae5", icon: VerifiedIcon };
      case "pending":
        return { label: "Pending", color: "#f59e0b", bgColor: "#fef3c7", icon: WarningIcon };
      case "non_compliant":
        return { label: "Non_Compliant", color: "#ef4444", bgColor: "#fee2e2", icon: ErrorIcon };
      default:
        return { label: "Unknown", color: "#6b7280", bgColor: "#f3f4f6", icon: WarningIcon };
    }
  };

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Statutory Compliance
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Track PF, ESI, TDS compliance and generate reports
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={loadData}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleOpenCreateDialog}
            sx={{ textTransform: "none" }}
          >
            Add Record
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={handleGenerateReport}
            sx={{ textTransform: "none" }}
          >
            Generate Report
          </Button>
        </Stack>
      </Box>

      {/* Compliance Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Compliant", value: overview?.summary?.compliant || 0, color: "#10b981" },
          { label: "Pending", value: overview?.summary?.pending || 0, color: "#f59e0b" },
          { label: "Non-Compliant", value: overview?.summary?.nonCompliant || 0, color: "#ef4444" },
          { label: "Total Amount", value: formatCurrency(overview?.summary?.totalAmount || 0), color: "#3b82f6" },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 3 }} key={stat.label}>
            <Card className="!bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" className="text-gray-800">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Compliance Table */}
      <TableContainer className="!bg-white-50 border border-gray-200 rounded-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">S No</TableCell>
              <TableCell className="!font-bold">Type</TableCell>
              <TableCell className="!font-bold">Period</TableCell>
              <TableCell className="!font-bold">Due Date</TableCell>
              <TableCell className="!font-bold">Filed Date</TableCell>
              <TableCell className="!font-bold" align="right">Amount</TableCell>
              <TableCell className="!font-bold" align="right">Employees</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complianceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <div className="py-6 text-gray-500">No compliance records found</div>
                </TableCell>
              </TableRow>
            ) : (
              complianceData.map((item, i) => {
                const status = getStatusConfig(item.status);
                const Icon = status.icon;
                return (
                  <TableRow key={item.id} sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Chip label={item.type} size="small" variant="outlined" className="text-gray-800 bg-gray-200" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.periodLabel}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(item.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(item.filedDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{item.employeeCount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon className="!w-4" />}
                        label={status.label}
                        size="small"
                        sx={{
                          bgcolor: status.bgColor, color: status.color, fontWeight: 500, '& .MuiChip-icon': {
                            color: status.color,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center justify-center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(item.id)}
                            sx={{ "&:hover": { color: "primary.main" } }}
                          >
                            <EditIcon fontSize="small" className="text-blue-500 !w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(item)}
                            sx={{ "&:hover": { color: "primary.main" } }}
                          >
                            <DownloadIcon fontSize="small" className="!w-4 text-green-700" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item)}
                          >
                            <DeleteIcon fontSize="small" className="text-error !w-4" />
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

      {/* Compliance Rates */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {overview?.complianceRates?.map((rate: any) => (
          <Grid size={{ xs: 12, md: 4 }} key={rate.type}>
            <Card className="bg-white" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
              <CardContent className="!pb-3">
                <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                  {rate.typeFullName}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" className="text-gray-500">Compliance Rate</Typography>
                    <Typography variant="caption" className="text-gray-500 !font-bold">
                      {rate.ratePercent}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={rate.ratePercent}
                    sx={{ height: 6, borderRadius: 3, my: 1 }}
                  />
                  <Typography variant="caption" className="text-gray-500 ">
                    {rate.compliantCount} of {rate.totalCount} compliant
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} sx={dialogsx}>
        <DialogTitle className="!border-b !border-gray-200 !p-2 flex items-center justify-between">
          <Typography variant="h6" className="!ml-4">
            {isEditing ? "Edit Compliance Record" : "Add Compliance Record"}
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseIcon className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-5 space-y-6">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., PF, ESI, TDS"
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Year"
                  type="number"
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: Number(e.target.value) })}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Month"
                  type="number"
                  value={formData.periodMonth}
                  onChange={(e) => setFormData({ ...formData, periodMonth: Number(e.target.value) })}
                  fullWidth
                // inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate ? dayjs(formData.dueDate) : null}
                  onChange={(newValue) => {
                    setFormData({
                      ...formData,
                      dueDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ""
                    });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: "outlined",
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Filed Date"
                  value={formData.filedDate ? dayjs(formData.filedDate) : null}
                  onChange={(newValue) => {
                    setFormData({
                      ...formData,
                      filedDate: newValue ? dayjs(newValue).format('YYYY-MM-DD') : ""
                    });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: "outlined",
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Employee Count"
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Reference Number"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g., PF-2026-001"
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional notes..."
              multiline
              rows={3}
              fullWidth
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button onClick={() => setOpenDialog(false)} variant="outlined" className="!text-gray-800 !border-gray-200">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary" >
            {isEditing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}