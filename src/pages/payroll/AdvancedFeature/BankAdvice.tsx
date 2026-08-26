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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  TextField,
  FormHelperText,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Description as FileIcon,
  CloseOutlined,
  DeleteOutlined,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { bankAdviceService, type BankAdvice } from "../../../services/modules/payrollServices/bankAdvice";
import { useUI } from "../../../context/Snackbar";
import { bankService } from "../../../services/modules/bank";
import { periodsService, type Period } from "../../../services/modules/payrollServices/period";
import type { BankDetail } from "../../settings/general/type";
import { formatDate } from "../../leave/leaveFormatters";
import { apiService } from "../../../services";
import { getRowColor } from "../../const";

export default function BankAdvice() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [openDialog, setOpenDialog] = useState(false);
  const [bankAdvices, setBankAdvices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalAmount: 0,
    totalEmployees: 0,
    banks: 0
  });

  // Dropdown data states
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<Period[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const [formData, setFormData] = useState({
    bankId: "",
    fileFormat: "NEFT",
    payrollPeriodId: "",
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
  });

  const [formErrors, setFormErrors] = useState({
    bankId: false,
    payrollPeriodId: false,
    periodYear: false,
    periodMonth: false,
  });

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, []);

  const fetchData = async () => {
    showSpinner();
    try {
      const [advicesRes, summaryRes]: any = await Promise.all([
        bankAdviceService.getBankAdvices(),
        bankAdviceService.getBankAdviceSummary(),
      ]);
      setBankAdvices(advicesRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      showSnackbar("Failed to load bank advices", "error");
    } finally {
      hideSpinner();
    }
  };

  const fetchDropdownData = async () => {
    // Fetch banks
    setLoadingBanks(true);
    try {
      const banksRes: any = await bankService.getBanks();
      setBanks(banksRes.data.content || []);
    } catch (error) {
      showSnackbar("Failed to load banks", "error");
    } finally {
      setLoadingBanks(false);
    }

    // Fetch payroll periods
    setLoadingPeriods(true);
    try {
      const periodsRes: any = await periodsService.getPeriods();
      // Fix: Access data directly or with proper structure
      const periods = periodsRes.data?.items || periodsRes.data || [];
      setPayrollPeriods(periods);

      // Set default period if available
      // if (periods.length > 0) {
      //   const latestPeriod = periods[0];
      //   setFormData(prev => ({
      //     ...prev,
      //     payrollPeriodId: latestPeriod.id,
      //     // Fix: Use periodMonth and periodYear from the Period interface
      //     periodYear: latestPeriod.periodYear ? parseInt(latestPeriod.periodYear) : new Date().getFullYear(),
      //     periodMonth: latestPeriod.periodMonth ? parseInt(latestPeriod.periodMonth) : new Date().getMonth() + 1,
      //   }));
      // }
    } catch (error) {
      showSnackbar("Failed to load payroll periods", "error");
    } finally {
      setLoadingPeriods(false);
    }
  };

  const handleGenerate = async () => {
    // Validate form
    const errors = {
      bankId: !formData.bankId,
      payrollPeriodId: !formData.payrollPeriodId,
      periodYear: !formData.periodYear || formData.periodYear < 2000,
      periodMonth: !formData.periodMonth || formData.periodMonth < 1 || formData.periodMonth > 12,
    };
    setFormErrors(errors);

    if (errors.bankId || errors.payrollPeriodId || errors.periodYear || errors.periodMonth) {
      showSnackbar("Please fill all required fields correctly", "warning");
      return;
    }

    showSpinner();
    try {
      await bankAdviceService.generateBankAdvice(formData);
      showSnackbar("Bank advice generated successfully!", "success");
      setOpenDialog(false);
      fetchData();
      // Reset form
      setFormData({
        bankId: "",
        fileFormat: "NEFT",
        payrollPeriodId: "",
        periodYear: new Date().getFullYear(),
        periodMonth: new Date().getMonth() + 1,
      });
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to generate bank advice", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDownload = async (item: BankAdvice) => {
    try {
      const res: any = await bankAdviceService.downloadBankAdvice(item.id);
      await apiService.downloadFromPath(res.data.fileUrl, `bank_advice_${item.bankName}_${item.adviceCode}.csv`);
    } catch (error) {
      showSnackbar("Failed to download bank advice", "error");
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmDialog({
      title: "Delete Bank Advice",
      message: "Are you sure you want to delete this record?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await bankAdviceService.deleteBankAdvice(id);
          await fetchData();
          showSnackbar("Bank Advice deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  }

  const handlePeriodChange = (periodId: string) => {
    const selectedPeriod = payrollPeriods.find(p => p.id === periodId);
    if (selectedPeriod) {
      setFormData({
        ...formData,
        payrollPeriodId: periodId,
        // Fix: Use periodMonth and periodYear from the Period interface
        periodYear: selectedPeriod.periodYear ? parseInt(selectedPeriod.periodYear) : new Date().getFullYear(),
        periodMonth: selectedPeriod.periodMonth ? parseInt(selectedPeriod.periodMonth) : new Date().getMonth() + 1,
      });
    } else {
      setFormData({
        ...formData,
        payrollPeriodId: periodId,
      });
    }
  };

  // Format month name for display
  const getMonthName = (month: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month - 1] || '';
  };

  // Get period label for display
  const getPeriodLabel = (period: Period) => {
    const month = period.periodMonth ? parseInt(period.periodMonth) : 0;
    const year = period.periodYear || '';
    const monthName = month > 0 ? getMonthName(month) : '';
    return period.name || `${monthName} ${year}`.trim() || period.id;
  };

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Bank Advice
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Generate bank payment files (NEFT/RTGS) and advice documents
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={fetchData}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            className="!bg-primary"
          >
            Generate Bank Advice
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total Amount", value: formatCurrency(summary.totalAmount), color: "#3b82f6" },
          { label: "Total Employees", value: summary.totalEmployees?.toString() || "0", color: "#10b981" },
          { label: "Banks", value: summary.banks?.toString() || "0", color: "#f59e0b" },
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

      {/* Bank Advice Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <TableContainer className="border border-gray-200 rounded-sm bg-white-50 h-[calc(100vh-265px)]">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold sticky left-0 z-20">S No</TableCell>
                <TableCell className="!font-bold sticky left-[60px] z-20">Advice ID</TableCell>
                <TableCell className="!font-bold">Bank</TableCell>
                <TableCell className="!font-bold">Account</TableCell>
                <TableCell className="!font-bold">Amount</TableCell>
                <TableCell className="!font-bold">Employees</TableCell>
                <TableCell className="!font-bold">Status</TableCell>
                <TableCell className="!font-bold">Date</TableCell>
                <TableCell className="!font-bold sticky right-0 z-20" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankAdvices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <div className="py-8 text-gray-500">No bank advices found</div>
                  </TableCell>
                </TableRow>
              ) : (
                bankAdvices.map((item, index) => (
                  <TableRow key={item.id} sx={getRowColor(index)}>
                    <TableCell className="sticky left-0 z-30 bg-inherit">{index + 1}</TableCell>
                    <TableCell className="sticky left-[60px] z-30 bg-inherit">
                      <Typography variant="caption">
                        {item.adviceCode || item.id.substring(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.bankName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-500">
                        {item.accountNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(item.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.employeeCount}</Typography>
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
                      <Typography variant="body2" className="text-gray-500">
                        {formatDate(item.generatedOn)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" className="bg-inherit sticky right-0 z-30">
                      <IconButton size="small" onClick={() => handleDownload(item)}>
                        <DownloadIcon fontSize="small" className="!w-4 text-blue-500" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteOutlined fontSize="small" className="text-error !w-4" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Generate Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setFormErrors({ bankId: false, payrollPeriodId: false, periodYear: false, periodMonth: false });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="!p-2 flex items-center justify-between border-b border-gray-200">
          <Typography variant="h6" className="!ml-4">Generate Bank Advice</Typography>
          <IconButton
            onClick={() => {
              setOpenDialog(false);
              setFormErrors({ bankId: false, payrollPeriodId: false, periodYear: false, periodMonth: false });
            }}
          >
            <CloseOutlined className="text-gray-800 !w-4" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4 !mt-3">
          <Stack spacing={3}>
            {/* Payroll Period Dropdown */}
            <FormControl fullWidth required error={formErrors.payrollPeriodId}>
              <InputLabel>Payroll Period</InputLabel>
              <Select
                value={formData.payrollPeriodId}
                onChange={(e) => handlePeriodChange(e.target.value)}
                label="Payroll Period"
                disabled={loadingPeriods}
              >
                {loadingPeriods ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading...
                  </MenuItem>
                ) : payrollPeriods.length === 0 ? (
                  <MenuItem disabled>No periods available</MenuItem>
                ) : (
                  payrollPeriods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      {getPeriodLabel(period)}
                      {period.status && ` (${period.status})`}
                    </MenuItem>
                  ))
                )}
              </Select>
              {formErrors.payrollPeriodId && (
                <FormHelperText>Please select a payroll period</FormHelperText>
              )}
            </FormControl>

            {/* Bank Dropdown */}
            <FormControl fullWidth required error={formErrors.bankId}>
              <InputLabel>Bank</InputLabel>
              <Select
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                label="Bank"
                disabled={loadingBanks}
              >
                {loadingBanks ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading...
                  </MenuItem>
                ) : banks.length === 0 ? (
                  <MenuItem disabled>No banks available</MenuItem>
                ) : (
                  banks.map((bank) => (
                    <MenuItem key={bank.id} value={bank.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {bank.bankName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {bank.accountNumber || 'No account'}
                          </Typography>
                          {bank.branchName && (
                            <Typography variant="caption" color="text.secondary">
                              • {bank.branchName}
                            </Typography>
                          )}
                          {bank.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: '0.55rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {formErrors.bankId && (
                <FormHelperText>Please select a bank</FormHelperText>
              )}
            </FormControl>

            {/* Year and Month Display (Read-only, auto-populated from period) */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Year"
                value={formData.periodYear}
                disabled
                fullWidth
              />
              <TextField
                label="Month"
                value={getMonthName(formData.periodMonth)}
                disabled
                fullWidth
              />
            </Box>

            {/* File Format Dropdown */}
            <FormControl fullWidth size="small">
              <InputLabel>File Format</InputLabel>
              <Select
                value={formData.fileFormat}
                onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value })}
                label="File Format"
              >
                <MenuItem value="NEFT">NEFT</MenuItem>
                <MenuItem value="RTGS">RTGS</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions className="!border-t !border-gray-200 !p-4">
          <Button
            onClick={() => {
              setOpenDialog(false);
              setFormErrors({ bankId: false, payrollPeriodId: false, periodYear: false, periodMonth: false });
            }}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<FileIcon fontSize="small" />}
            onClick={handleGenerate}
            className="!bg-primary"
            disabled={loadingBanks || loadingPeriods}
          >
            Generate File
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}