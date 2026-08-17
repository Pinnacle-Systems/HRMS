import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowLeftIcon,
  Download as DownloadIcon,
  Print as PrinterIcon,
  Business as Building2Icon,
  Phone as PhoneIcon,
  Email as MailIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { useUI } from "../../../context/Snackbar";
import { payslipsService } from "../../../services/modules/payrollServices/payslips";
import { getRowColor } from "../../const";

export default function EmployeePayslip() {
  const { empId, period } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [payslip, setPayslip] = useState<any>(null);
  const employeeId = empId || " ";

  const decodedPeriod = period ? decodeURIComponent(period) : "May 2026";

  useEffect(() => {
    // Check if data was passed via state from the list page
    if (location.state?.payslip) {
      setPayslip(location.state.payslip);
      return;
    }

    // Otherwise, fetch by employee ID and period
    if (employeeId) {
      loadPayslip();
    }
  }, [employeeId, period]);

  const loadPayslip = async () => {
    showSpinner();
    try {
      const res: any = await payslipsService.viewPayslip(employeeId);
      setPayslip(res.data);
    } catch (error: any) {
      console.error("Failed to fetch payslip:", error);
      showSnackbar(error.message || "Failed to fetch the payslip", 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDownload = async () => {
    try {
      showSpinner();
      const res: any = await payslipsService.downloadPayslip(payslip?.id || employeeId || "");
      if (res.data?.fileUrl) {
        window.open(res.data.fileUrl, "_blank");
      }
      showSnackbar("Download started", "success");
    } catch (error) {
      showSnackbar("Failed to download payslip", "error");
    } finally {
      hideSpinner();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!payslip) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Typography>No payslip data found</Typography>
      </Box>
    );
  }

  // Use data from API response
  const employeeData = payslip;
  const basic = employeeData.basic || 0;
  const hra = employeeData.hra || 0;
  const conv = employeeData.conveyance || 0;
  const special = employeeData.special || 0;
  const gross = employeeData.gross || 0;
  const pf = employeeData.pf || 0;
  const pt = employeeData.professionalTax || 0;
  const loan = employeeData.loanAdvance || 0;
  const otherDeductions = employeeData.otherDeductions || 0;
  const totalDeductions = employeeData.totalDeductions || 0;
  const net = employeeData.netPay || 0;

  const earnings = [
    { name: "Basic Salary", amount: basic },
    { name: "House Rent Allowance", amount: hra },
    { name: "Conveyance Allowance", amount: conv },
    { name: "Special Allowance", amount: Math.max(0, special) },
  ];

  const deductions = [
    { name: "Provident Fund (Employee)", amount: pf },
    { name: "Professional Tax", amount: pt },
    ...(loan > 0 ? [{ name: "Loan EMI Recovery", amount: loan }] : []),
    ...(otherDeductions > 0 ? [{ name: "Other Deductions", amount: otherDeductions }] : []),
  ];

  return (
    <div className="bg-white-50 p-5">
      {/* Header Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          className="!text-gray-800 !border-gray-200"
          startIcon={<ArrowLeftIcon fontSize="small" />}
          onClick={() => navigate("/payroll/payslips")}
          
        >
          Back
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrinterIcon fontSize="small" />}
            onClick={handlePrint}
            className="!text-primary !border-primary"
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={handleDownload}
            className="!bg-primary"
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Payslip Document */}
      <Paper className="!bg-white"
        sx={{
          maxWidth: 900,
          mx: "auto",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Company Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            bgcolor: "primary.main",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.common.white, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2Icon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
                SRG Engineering Works
              </Typography>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
                Industrial Component Manufacturing
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", color: alpha(theme.palette.common.white, 0.8) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
              <MailIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption">hr@srgengineering.com</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
              <PhoneIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption">+91 44 2345 6789</Typography>
            </Box>
          </Box>
        </Box>

        {/* Pay Slip Title Bar */}
        <Box
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "primary.main" }}
          >
            Pay Slip
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            For the Month of <strong>{employeeData.periodLabel || decodedPeriod}</strong>
          </Typography>
        </Box>

        {/* Employee Info Grid */}
        <Box className="bg-white border-b border-gray-200" sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2}>
            {[
              ["Employee ID", employeeData.employeeCode || empId],
              ["Employee Name", employeeData.employeeName || "-"],
              ["Designation", employeeData.designation || "-"],
              ["Department", employeeData.department || "-"],
              ["Date of Joining", employeeData.joiningDate || "-"],
              ["Employment Type", employeeData.employmentType || "Permanent"],
              ["UAN Number", employeeData.uanNumber || "-"],
              ["PAN Number", employeeData.panNumber || "-"],
              ["PF Account No.", employeeData.pfAccount || "-"],
              ["Pay Days", employeeData.payDays || "30"],
              ["LOP Days", employeeData.lopDays || "0"],
              ["Pay Date", employeeData.paymentDate || "-"],
            ].map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Typography variant="caption" className="text-gray-800" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                  {label}
                </Typography>
                <Typography variant="body2" className="text-gray-500" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {value || "-"}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Earnings & Deductions */}
        <Box className="bg-white" sx={{ px: 4, py: 3 }}>
          <Grid container spacing={4}>
            {/* Earnings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Earnings
              </Typography>
              <Table size="small" className="border border-gray-200 rounded-md" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: "success.main" }}>
                      Component
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.7rem", color: "success.main" }}>
                      Amount (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings.map((e, i) => (
                    <TableRow key={e.name} sx={getRowColor(i)}>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{e.name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
                        {formatCurrency(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: `2px solid ${theme.palette.success.main}`, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700, color: "success.main" }}>Gross Salary</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>
                      {formatCurrency(gross)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>

            {/* Deductions */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" sx={{ color: "error.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Deductions
              </Typography>
              <Table size="small" className="border border-gray-200 rounded-md" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: "error.main" }}>
                      Component
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.7rem", color: "error.main" }}>
                      Amount (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deductions.map((d, i) => (
                    <TableRow key={d.name} sx={getRowColor(i)}>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{d.name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: 500, color: "error.main" }}>
                        {formatCurrency(d.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ borderTop: `2px solid ${theme.palette.error.main}`, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700, color: "error.main" }}>Total Deductions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>
                      {formatCurrency(totalDeductions)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </Box>

        {/* Tax Details */}
        <Box sx={{ px: 4, pb: 2 }}>
          <Typography variant="caption" className="text-gray-500" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tax Details
          </Typography>
          <Paper
            variant="outlined"
            className="border border-gray-200"
            sx={{
              p: 2,
              mt: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 1,
            }}
          >
            <Grid container spacing={1.5}>
              {[
                ["Annual CTC", formatCurrency(employeeData.annualCtc || 0)],
                ["Taxable Income (Est.)", formatCurrency(employeeData.taxableIncome || 0)],
                ["TDS This Month", formatCurrency(employeeData.tds || 0)],
                ["PF (Employer Share)", formatCurrency(employeeData.pfEmployerShare || 0)],
                ["ESI Applicable", employeeData.esiApplicable ? "Yes" : "No"],
                ["Tax Regime", employeeData.taxRegime || "New Regime"],
              ].map(([label, value]) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                  <Typography variant="caption" className="text-gray-500">
                    {label}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500" sx={{ fontWeight: 500 }}>
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Net Pay Banner */}
        <Box
          sx={{
            mx: 4,
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: theme.palette.success.main,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.8), fontWeight: 500, textTransform: "uppercase" }}>
              Net Pay (Take Home)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "white", mt: 0.5 }}>
              {formatCurrency(net)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", color: alpha(theme.palette.common.white, 0.8) }}>
            <Typography>Gross: {formatCurrency(gross)}</Typography>
            <Typography>Deductions: {formatCurrency(totalDeductions)}</Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 4,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" className="text-gray-500">
            This is a system-generated payslip and does not require a signature.
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            Generated on {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}