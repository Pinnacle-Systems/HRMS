import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
} from "@mui/material";
import {
  CloseOutlined,
  EventBusyOutlined,
  MoneyOffCsredOutlined,
  MoneyOff,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { LopCalculateParams } from "../../../services/modules/attendanceTypes";

interface LopResult {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  lopDays: number;
  lopDates: string[];
}

export function LopManagement() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState<LopResult[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [params, setParams] = useState<LopCalculateParams>({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    employeeId: "",
  });

  async function handleCalculateLop() {
    if (!params.startDate || !params.endDate ) {
      showSnackbar("Please select date range", "warning");
      return;
    }

     if (!selectedEmployee ) {
      showSnackbar("Please select the employee", "warning");
      return;
    }

    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.calculateLop({
        ...params,
        employeeId: selectedEmployee?.id || "",
      });
      const data = res?.data?.data ?? res?.data;
      
      // Transform single result to array if needed
      const results = Array.isArray(data) ? data : [data];
      setCalculations(results);
      setDialogOpen(true);
      showSnackbar("LOP calculation completed", "success");
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to calculate LOP", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }

  // Calculate summary stats
  const stats = {
    totalEmployees: calculations.length,
    totalLopDays: calculations.reduce((sum, c) => sum + (c.lopDays || 0), 0),
    totalWorkingDays: calculations.reduce((sum, c) => sum + (c.workingDays || 0), 0),
    totalPresentDays: calculations.reduce((sum, c) => sum + (c.presentDays || 0), 0),
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[12px] font-semibold text-gray-800">LOP Management</h2>
          <p className="text-[12px] text-gray-500">
            Calculate and manage Loss of Pay (LOP) for employees
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<MoneyOffCsredOutlined />}
          onClick={handleCalculateLop}
          className="!bg-primary"
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate LOP"}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-[250px]">
            <EmployeeSelector
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              label="Select Employee"
            />
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={params.startDate ? dayjs(params.startDate) : null}
              onChange={(newValue) =>
                setParams({
                  ...params,
                  startDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                })
              }
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
            <DatePicker
              label="End Date"
              value={params.endDate ? dayjs(params.endDate) : null}
              onChange={(newValue) =>
                setParams({
                  ...params,
                  endDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                })
              }
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
          </LocalizationProvider>
          {/* <Tooltip title="Export">
            <IconButton className="border border-gray-300">
              <FileDownloadOutlined fontSize="small" />
            </IconButton>
          </Tooltip> */}
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4 flex items-center gap-2">
            <MoneyOff className="text-orange-500" />
            LOP Calculation Results
            <Chip 
              label={`${calculations.length} employees`} 
              size="small" 
              color="primary"
              className="ml-2"
            />
          </span>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        
        <DialogContent className="!p-4">
          {loading ? (
            <div className="space-y-2">
              <LinearProgress />
              <div className="text-center py-4 text-gray-500">Calculating LOP...</div>
            </div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <EventBusyOutlined className="text-4xl text-gray-300" />
              <div className="mt-2">No LOP data found for the selected period</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Card className="bg-blue-50 border border-blue-200">
                    <CardContent className="p-3">
                      <Typography variant="caption" className="text-blue-600 font-medium block">
                        Total Employees
                      </Typography>
                      <Typography variant="h5" className="font-bold text-blue-700">
                        {stats.totalEmployees}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card className="bg-red-50 border border-red-200">
                    <CardContent className="p-3">
                      <Typography variant="caption" className="text-red-600 font-medium block">
                        Total LOP Days
                      </Typography>
                      <Typography variant="h5" className="font-bold text-red-700">
                        {stats.totalLopDays}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card className="bg-green-50 border border-green-200">
                    <CardContent className="p-3">
                      <Typography variant="caption" className="text-green-600 font-medium block">
                        Total Working Days
                      </Typography>
                      <Typography variant="h5" className="font-bold text-green-700">
                        {stats.totalWorkingDays}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Card className="bg-purple-50 border border-purple-200">
                    <CardContent className="p-3">
                      <Typography variant="caption" className="text-purple-600 font-medium block">
                        Total Present Days
                      </Typography>
                      <Typography variant="h5" className="font-bold text-purple-700">
                        {stats.totalPresentDays}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Results Table */}
              <TableContainer className="border border-gray-200 rounded">
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="!font-bold">S No</TableCell>
                      <TableCell className="!font-bold">Employee</TableCell>
                      <TableCell className="!font-bold">Code</TableCell>
                      <TableCell className="!font-bold text-center">Working Days</TableCell>
                      <TableCell className="!font-bold text-center">Present</TableCell>
                      <TableCell className="!font-bold text-center">Paid Leave</TableCell>
                      <TableCell className="!font-bold text-center">Holiday</TableCell>
                      <TableCell className="!font-bold text-center">Weekly Off</TableCell>
                      <TableCell className="!font-bold text-center">LOP Days</TableCell>
                      <TableCell className="!font-bold text-center">LOP Dates</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculations.map((result, index) => (
                      <TableRow key={result.employeeId || index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{result.employeeName}</TableCell>
                        <TableCell>{result.employeeCode}</TableCell>
                        <TableCell className="text-center">{result.workingDays || 0}</TableCell>
                        <TableCell className="text-center text-green-600">
                          {result.presentDays || 0}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          {result.paidLeaveDays || 0}
                        </TableCell>
                        <TableCell className="text-center text-purple-600">
                          {result.holidayDays || 0}
                        </TableCell>
                        <TableCell className="text-center text-gray-500">
                          {result.weeklyOffDays || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip
                            label={result.lopDays || 0}
                            size="small"
                            color={result.lopDays > 0 ? "error" : "default"}
                            className="font-bold"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {result.lopDates && result.lopDates.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {result.lopDates.map((date, idx) => (
                                <Chip
                                  key={idx}
                                  label={dayjs(date).format("DD MMM")}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  className="!h-5 !text-[10px]"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </DialogContent>
        
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => setDialogOpen(false)}
            disabled={loading}
          >
            Close
          </Button>
          {calculations.length > 0 && (
            <>
              {/* <Button
                variant="outlined"
                className="!border-orange-500 !text-orange-500"
                startIcon={<FileDownloadOutlined />}
                onClick={() => {
                  showSnackbar("Export started", "success");
                }}
              >
                Export
              </Button> */}
              {/* <Button
                variant="contained"
                className="!bg-primary"
                onClick={() => {
                  showSnackbar("LOP applied successfully", "success");
                  setDialogOpen(false);
                }}
              >
                Apply LOP
              </Button> */}
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}