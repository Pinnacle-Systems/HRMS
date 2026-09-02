import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
  DialogTitle,
} from "@mui/material";
import {
  FilterListOutlined,
  FileDownloadOutlined,
  VisibilityOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";

import { GlobalPagination } from "../../../components/GlobalPagination";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { getRowColor } from "../../const";
import type { PayrollConsolidated, PayrollConsolidatedData } from "../../../services/modules/attendanceTypes";
import { attendanceService } from "../../../services/modules/attendance";

export function AttendanceConsolidated() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [records, setRecords] = useState<PayrollConsolidatedData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [includeOvertime, setIncludeOvertime] = useState(true);
  const [includeLop, setIncludeLop] = useState(true);

  const [lopDialogOpen, setLopDialogOpen] = useState(false);
  const [lopCalculations, _setLopCalculations] = useState<any[]>([]);
  // const [lopParams, setLopParams] = useState<LopCalculateParams>({
  //   startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  //   endDate: dayjs().format("YYYY-MM-DD"),
  //   employeeId: "",
  // });

  // Summary statistics
  const [_summary, setSummary] = useState({
    totalEmployees: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLOP: 0,
    totalOvertime: 0,
    attendanceRate: 0,
  });

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<PayrollConsolidatedData | null>(null);

  const loadRecords = useCallback(async () => {
    if (!selectedEmployee) {
      setRecords([]);
      setTotal(0);
      setSummary({
        totalEmployees: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLOP: 0,
        totalOvertime: 0,
        attendanceRate: 0,
      });
      return;
    }

    setLoading(true);
    showSpinner();
    try {
      const params: PayrollConsolidated = {
        employeeId: selectedEmployee.id,
        startDate: fromDate,
        endDate: toDate,
        includeOvertime,
        includeLop,
      };

      const res: any = await attendanceService.getPayrollConsolidated(params);
      const data = res?.data?.data ?? res?.data;

      if (data) {
        // Transform single record to array for table display
        const record: PayrollConsolidatedData = {
          ...data,
          department:
            selectedEmployee.department ||
            selectedEmployee.departmentName ||
            "—",
        };
        setRecords([record]);
        setTotal(1);

        // Calculate summary
        setSummary({
          totalEmployees: 1,
          totalPresent: data.presentDays || 0,
          totalAbsent: data.lopDays || 0,
          totalLOP: data.lopDays || 0,
          totalOvertime: data.overtimeHours || 0,
          attendanceRate:
            data.workingDays > 0
              ? (data.presentDays / data.workingDays) * 100
              : 0,
        });
      } else {
        setRecords([]);
        setTotal(0);
      }
    } catch (error: any) {
      showSnackbar(
        error?.message || "Failed to load consolidated data",
        "error",
      );
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [fromDate, toDate, selectedEmployee, includeOvertime, includeLop]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function openDetail(record: PayrollConsolidatedData) {
    setSelectedRecord(record);
    setDetailOpen(true);
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  // Format hours and minutes
  const formatHours = (hours: number) => {
    if (!hours) return "0h";
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="p-4 space-y-3">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterListOutlined className="text-gray-500" />
            <span className="text-[12px] text-gray-700">
              Payroll Consolidation Filters
            </span>
            {/* {(fromDate || toDate || selectedEmployee || departmentId) && (
              <Chip
                label="Active Filters"
                size="small"
                color="primary"
                onDelete={() => {
                  setFromDate(dayjs().startOf('month').format("YYYY-MM-DD"));
                  setToDate(dayjs().format("YYYY-MM-DD"));
                  setSelectedEmployee(null);
                  setDepartmentId("");
                }}
              />
            )} */}
          </div>
          <div className="flex items-center gap-1">            
            <Tooltip title="Export Data">
              <IconButton
                size="small"
                className="text-gray-500 hover:text-gray-700"
              >
                <FileDownloadOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Filter Body */}
        <div className="p-4 pt-5 bg-white-50">
          <div className="flex items-center justify-between gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="w-[250px]">
                <EmployeeSelector
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  label="Select Employee"
                />
              </div>
              <div className="flex items-center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeOvertime}
                      onChange={(e) => setIncludeOvertime(e.target.checked)}
                    />
                  }
                  label="Include Overtime"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeLop}
                      onChange={(e) => setIncludeLop(e.target.checked)}
                    />
                  }
                  label="Include LOP"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <div className="flex items-center gap-2">
                  <DatePicker
                    label="From"
                    value={fromDate ? dayjs(fromDate) : null}
                    onChange={(newValue) =>
                      setFromDate(
                        newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      )
                    }
                    maxDate={toDate ? dayjs(toDate) : undefined}
                    slotProps={{ textField: { sx: { width: "140px" } } }}
                  />
                  <span className="text-gray-400">→</span>
                  <DatePicker
                    label="To"
                    value={toDate ? dayjs(toDate) : null}
                    onChange={(newValue) =>
                      setToDate(
                        newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      )
                    }
                    minDate={fromDate ? dayjs(fromDate) : undefined}
                    slotProps={{ textField: { sx: { width: "140px" } } }}
                  />
                </div>
              </LocalizationProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      {/* {selectedEmployee && records.length > 0 && (
        <div className="grid grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="caption"
                    className="text-blue-600 font-medium"
                  >
                    Total Employees
                  </Typography>
                  <Typography variant="h5" className="font-bold text-blue-700">
                    {summary.totalEmployees}
                  </Typography>
                </div>
                <PeopleAltOutlined className="text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="caption"
                    className="text-green-600 font-medium"
                  >
                    Present Days
                  </Typography>
                  <Typography variant="h5" className="font-bold text-green-700">
                    {summary.totalPresent}
                  </Typography>
                </div>
                <CheckCircleOutlineOutlined className="text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="caption"
                    className="text-red-600 font-medium"
                  >
                    LOP Days
                  </Typography>
                  <Typography variant="h5" className="font-bold text-red-700">
                    {summary.totalLOP}
                  </Typography>
                </div>
                <CancelOutlined className="text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="caption"
                    className="text-orange-600 font-medium"
                  >
                    Overtime Hours
                  </Typography>
                  <Typography
                    variant="h5"
                    className="font-bold text-orange-700"
                  >
                    {formatHours(summary.totalOvertime)}
                  </Typography>
                </div>
                <AccessTimeOutlined className="text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 col-span-2">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="caption"
                    className="text-purple-600 font-medium"
                  >
                    Attendance Rate
                  </Typography>
                  <Typography
                    variant="h5"
                    className="font-bold text-purple-700"
                  >
                    {summary.attendanceRate.toFixed(1)}%
                  </Typography>
                </div>
                <div className="flex items-center gap-1">
                  {summary.attendanceRate >= 90 ? (
                    <TrendingUpOutlined className="text-green-500" />
                  ) : (
                    <TrendingDownOutlined className="text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className="max-h-[calc(100vh-400px)]">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  "S No",
                  "Name",
                  "Period",
                  "Working Days",
                  "Present",
                  "Paid Leave",
                  "Holiday",
                  "Weekly Off",
                  "Worked Hours",
                  "Payable Days",
                  "LOP",
                  "OT Hours",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h} className="!font-bold">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    align="center"
                    className="py-8 text-gray-400 text-[12px]"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    align="center"

                  >
                    <div className="!py-6 text-gray-500 text-[12px]">
                      {selectedEmployee
                        ? "No consolidated data found"
                        : "Please select an employee to view consolidated data"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, index) => (
                  <TableRow
                    key={r.employeeId || index}
                    hover
                    sx={getRowColor(index)}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>{r.employeeName}</div>
                      <div className="text-primary">({r.employeeCode})</div>
                    </TableCell>
                    {/* <TableCell>{r.department}</TableCell> */}
                    <TableCell className="whitespace-nowrap">
                      {dayjs(r.startDate).format("DD MMM")} -{" "}
                      {dayjs(r.endDate).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell>{r.workingDays}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-bold">
                        {r.presentDays}
                      </span>
                    </TableCell>
                    <TableCell>{r.paidLeaveDays}</TableCell>
                    <TableCell>{r.holidayDays}</TableCell>
                    <TableCell>{r.weeklyOffDays}</TableCell>
                    <TableCell>{r.totalWorkedHours}</TableCell>
                    <TableCell>
                      <span className="text-blue-600 !font-bold">
                        {r.payableDays}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.lopDays > 0 ? (
                        <span className="text-red-600 !font-bold">
                          {r.lopDays}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {r.overtimeHours > 0 ? (
                        <span className="text-orange-600 font-bold">
                          {r.overtimeHours}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center gap-1">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openDetail(r)}
                          >
                            <VisibilityOutlined
                              fontSize="small"
                              className="text-primary !w-4"
                            />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Consolidated Summary">
                          <IconButton
                            size="small"
                            onClick={() => openDetail(r)}
                          >
                            <SummarizeOutlined
                              fontSize="small"
                              className="text-blue-500 !w-4"
                            />
                          </IconButton>
                        </Tooltip> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between !p-2 border-b border-gray-200">
          <span className="pl-4 text-[12px]">
            Consolidated Attendance Details
          </span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          {selectedRecord && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="bg-head rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" className="font-semibold">
                      {selectedRecord.employeeName}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {selectedRecord.employeeCode}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography
                      variant="caption"
                      className="text-gray-500 block"
                    >
                      Period
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {dayjs(selectedRecord.startDate).format("DD MMM YYYY")} -{" "}
                      {dayjs(selectedRecord.endDate).format("DD MMM YYYY")}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Card className="bg-green-50">
                    <CardContent className="p-3">
                      <Typography
                        variant="caption"
                        className="text-gray-500 block"
                      >
                        Present Days
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-green-700"
                      >
                        {selectedRecord.presentDays}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card className="bg-blue-50">
                    <CardContent className="p-3">
                      <Typography
                        variant="caption"
                        className="text-gray-500 block"
                      >
                        Payable Days
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-blue-700"
                      >
                        {selectedRecord.payableDays}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card className="bg-orange-50">
                    <CardContent className="p-3">
                      <Typography
                        variant="caption"
                        className="text-gray-500 block"
                      >
                        Overtime Hours
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-orange-700"
                      >
                        {formatHours(selectedRecord.overtimeHours)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Working Days", selectedRecord.workingDays],
                  ["Paid Leave Days", selectedRecord.paidLeaveDays],
                  ["Holiday Days", selectedRecord.holidayDays],
                  ["Weekly Off Days", selectedRecord.weeklyOffDays],
                  [
                    "Total Worked Hours",
                    formatHours(selectedRecord.totalWorkedHours),
                  ],
                  [
                    "LOP Days",
                    selectedRecord.lopDays > 0 ? selectedRecord.lopDays : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="bg-head rounded p-2">
                    <div className="text-gray-500 text-[12px]">{label}</div>
                    <div className="text-gray-800 text-[12px] mt-0.5 font-medium">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance Rate */}
              <div className="bg-head rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="text-lg font-bold text-primary">
                    {selectedRecord.workingDays > 0
                      ? (
                        (selectedRecord.presentDays /
                          selectedRecord.workingDays) *
                        100
                      ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setDetailOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add LOP dialog */}
      <Dialog open={lopDialogOpen} onClose={() => setLopDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">LOP Calculation Results</span>
          <IconButton size="small" onClick={() => setLopDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          {lopCalculations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No LOP data found</div>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold">Department</TableCell>
                    <TableCell className="!font-bold">LOP Days</TableCell>
                    <TableCell className="!font-bold">Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lopCalculations.map((lop, i) => (
                    <TableRow key={i}>
                      <TableCell>{lop.employeeName}</TableCell>
                      <TableCell>{lop.employeeCode}</TableCell>
                      <TableCell>{lop.department}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-bold">{lop.lopDays}</span>
                      </TableCell>
                      <TableCell>{lop.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => setLopDialogOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
