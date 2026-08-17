import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Grid,
  Avatar,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Visibility as EyeIcon,
  People as UsersIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  RefreshOutlined,
} from "@mui/icons-material";
import { formatCurrency } from "../const";
import { payslipsService, type PayslipListItem, type PayslipSummary } from "../../../services/modules/payrollServices/payslips";
import { useUI } from "../../../context/Snackbar";
import { departmentService } from "../../../services/modules/department";
import { periodsService, type Period } from "../../../services/modules/payrollServices/period";
import { getRowColor } from "../../const";
import { apiService } from "../../../services";

export default function EmployeePayslips() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [payslips, setPayslips] = useState<PayslipListItem[]>([]);
  const [summary, setSummary] = useState<PayslipSummary | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  // Load available periods on mount
  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const response: any = await periodsService.getPeriods();
        const periods = response?.data.items || response || [];
        setAvailablePeriods(periods);
        setSelectedPeriod(periods[0])
      } catch (error) {
        showSnackbar("Failed to load periods", "error");
      }
    };
    loadPeriods();
  }, []);

  // Load payslips when period changes
  useEffect(() => {
    if (selectedPeriod) {
      loadPayslips();
    }
  }, [selectedPeriod]);

  const loadPayslips = async () => {
    if (!selectedPeriod) return;
    showSpinner();
    try {
      const [payslipsRes, summaryRes, deptRes]: any = await Promise.all([
        payslipsService.getPayslips({
          year: 2026,
          month: 8,
          page: 0,
          size: 100,
        }),
        payslipsService.getPayslipSummary({
          year: 2026,
          month: 8,
        }),
        departmentService.getActiveDepartments(),
      ]);

      // Extract departments from response
      const deptList = deptRes?.data.content || deptRes || [];
      setDepartments(["all", ...deptList.map((d: any) => d.departmentName || d)]);

      // Extract payslips from response - using the actual API response structure
      const content = payslipsRes?.data?.content || payslipsRes?.data || [];
      const list: PayslipListItem[] = content.map((item: any) => ({
        id: item.id || item.employeeId,
        employeeId: item.employeeId,
        employeeCode: item.employeeCode || "",
        employeeName: item.employeeName || item.name || "",
        departmentId: item.departmentId || "",
        department: item.department || "General",
        designationId: item.designationId || "",
        payDays: item.payDays || 30,
        grossSalary: item.grossSalary || item.gross || 0,
        deductions: item.deductions || 0,
        netSalary: item.netSalary || item.net || 0,
        status: item.status || "generated",
      }));

      setPayslips(list);

      // Set summary from response
      if (summaryRes?.data) {
        setSummary({
          periodLabel: summaryRes.data.periodLabel || selectedPeriod.name,
          totalEmployees: summaryRes.data.totalEmployees || 0,
          totalGross: summaryRes.data.totalGross || 0,
          totalNet: summaryRes.data.totalNet || 0,
        });
      }

      showSnackbar("Payslips loaded successfully", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load payslips", "error");
    } finally {
      hideSpinner();
    }
  };

  // Filter payslips
  const filtered = payslips.filter((e) => {
    const matchSearch =
      e.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode?.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "all" || e.department === dept;
    return matchSearch && matchDept;
  });

  // Calculate totals from filtered data
  const totalGross = filtered.reduce((s, e) => s + (e.grossSalary || 0), 0);
  const totalNet = filtered.reduce((s, e) => s + (e.netSalary || 0), 0);
  const totalDeductions = filtered.reduce((s, e) => s + (e.deductions || 0), 0);

  // Download payslip
  // const handleDownload = async (id: string) => {
  //   try {
  //     showSpinner();
  //     const res: any = await payslipsService.downloadPayslip(id);
  //     if (res.data?.fileUrl) {
  //       window.open(res.data.fileUrl, "_blank");
  //     } else if (res.data instanceof Blob) {
  //       const url = window.URL.createObjectURL(res.data);
  //       window.open(url, "_blank");
  //       setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  //     } else {
  //       // Fallback - try to create blob from response
  //       const blob = new Blob([res.data], { type: "application/pdf" });
  //       const url = window.URL.createObjectURL(blob);
  //       window.open(url, "_blank");
  //       setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  //     }
  //     showSnackbar("Download started", "success");
  //   } catch (error) {
  //     showSnackbar("Failed to download payslip", "error");
  //   } finally {
  //     hideSpinner();
  //   }
  // };

  const handleDownload = async (item: any) => {
    try {
      const res: any = await payslipsService.downloadPayslip(item.id);
      await apiService.downloadFromPath(res.data.fileUrl, `payslip  _${item.employeeName}_${selectedPeriod?.name}.pdf`);
    } catch (error) {
      showSnackbar("Failed to download bank advice", "error");
    }
  };

  // View payslip details
  // const handleViewPayslip = async (emp: any) => {
  //   try {
  //     showSpinner();
  //     const res: any = await payslipsService.viewPayslip(emp.id);
  //     // const res4 = `payroll/payslips/${emp.employeeCode}/${selectedPeriod?.name}`
  //         navigate(`/payroll/payslips/${emp.employeeCode}/${encodeURIComponent(selectedPeriod?.name || '')}`);

      
  //     // navigate(res4)
  //     // navigate(`/payroll/payslips/${id}`, { state: { payslip: res.data } });
  //   } catch (error) {
  //     showSnackbar("Failed to view payslip", "error");
  //   } finally {
  //     hideSpinner();
  //   }
  // };

  // Bulk download
  const handleBulkDownload = async () => {
    // try {
    //   showSpinner();
    //   const res: any = await payslipsService.bulkDownload({
    //     year: selectedPeriod?.year || 0,
    //     month: selectedPeriod?.month || 0,
    //     departmentId: dept === "all" ? undefined : dept,
    //   });
    //   if (res.data?.fileUrl) {
    //     window.open(res.data.fileUrl, "_blank");
    //   }
    //   showSnackbar("Bulk download started", "success");
    // } catch (error) {
    //   console.error("Failed to bulk download", error);
    //   showSnackbar("Failed to bulk download", "error");
    // } finally {
    //   hideSpinner();
    // }
  };

  // Refresh data
  const handleRefresh = () => {
    loadPayslips();
  };

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800" sx={{ fontWeight: 600 }}>
            Employee Payslips
          </Typography>
          <Typography variant="body2" className="text-gray-800 mt-1">
            View and download payslips for all employees
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            onClick={handleBulkDownload}
            sx={{ textTransform: "none" }}
          >
            Bulk Download
          </Button>
          <Button
            variant="contained"
            onClick={handleRefresh}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {[
          {
            label: "Total Employees",
            value: summary?.totalEmployees?.toString() || payslips.length.toString(),
            icon: <UsersIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.primary.main,
          },
          {
            label: "Total Gross",
            value: formatCurrency(summary?.totalGross || totalGross),
            icon: <DollarSignIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.success.main,
          },
          {
            label: "Total Deductions",
            value: formatCurrency(totalDeductions),
            icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.error.main,
          },
          {
            label: "Total Net",
            value: formatCurrency(summary?.totalNet || totalNet),
            icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
            color: theme.palette.primary.main,
          },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" className="text-gray-800" sx={{ fontWeight: 500 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h5" className="text-gray-500" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {s.value}
                    </Typography>
                    <Typography variant="caption" className="text-gray-800" sx={{ display: "block", mt: 0.5 }}>
                      {selectedPeriod?.name || ""}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(s.color, 0.1),
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3  ">
        <TextField
          placeholder="Search by name, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }} className="bg-white dark:bg-white-50">
          <Select
            value={selectedPeriod?.name || ""}
            onChange={(e) => {
              const p = availablePeriods.find(p => p.name === e.target.value);
              if (p) setSelectedPeriod(p);
            }}
            displayEmpty
          >
            {availablePeriods.map((p) => (
              <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }} className="bg-white dark:bg-white-50">
          <Select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            displayEmpty
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.filter(d => d !== "all").map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton onClick={handleRefresh}>
          <RefreshOutlined className="text-gray-800 !w-4" />
        </IconButton>
      </div>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <TableContainer className="border border-gray-200 rounded-sm bg-white-50 h-[calc(100vh-400px)] overflow-auto">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold sticky left-0 !z-30">
                  S No
                </TableCell>
                <TableCell className="!font-bold sticky left-[60px] !z-30">
                  Employee
                </TableCell>
                <TableCell className="!font-bold">
                  Department
                </TableCell>
                <TableCell className="!font-bold">
                  Designation
                </TableCell>
                <TableCell align="right" className="!font-bold">
                  Pay Days
                </TableCell>
                <TableCell align="right" className="!font-bold">
                  Gross Salary
                </TableCell>
                <TableCell align="right" className="!font-bold">
                  Deductions
                </TableCell>
                <TableCell align="right" className="!font-bold">
                  Net Salary
                </TableCell>
                <TableCell align="center" className="!font-bold sticky right-0 !z-30">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <div className="py-6">
                      No employees match your search
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp, i) => (
                  <TableRow
                    key={emp.id}
                    sx={getRowColor(i)}
                  >
                    <TableCell className="sticky left-0 !z-20 bg-inherit">{i + 1}</TableCell>
                    <TableCell className="sticky left-[60px] !z-20 bg-inherit">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {emp.employeeName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {emp.employeeName}
                          </Typography>
                          <Typography variant="caption" className="text-primary !text-[10px]">
                            {emp.employeeCode || emp.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-800">
                        {emp.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-800">
                        {emp.designationId || "Employee"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{emp.payDays}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(emp.grossSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: "error.main" }}>
                        {formatCurrency(emp.deductions)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                        {formatCurrency(emp.netSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell className="sticky right-0 !z-20 bg-inherit">
                      <Stack direction="row">
                        <IconButton onClick={() => { navigate(`/payroll/payslips/${emp.id}/${encodeURIComponent(selectedPeriod?.name || '')}`) }}>
                          <EyeIcon className="!w-4 text-blue-500" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(emp)}
                        >
                          <DownloadIcon fontSize="small" className="!w-4 text-green-700" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}