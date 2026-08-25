import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  FormControlLabel,
  Switch,
  Box,
  Collapse,
} from "@mui/material";
import {
  CloseOutlined,
  CalculateOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { OvertimeCalculateParams } from "../../../services/modules/attendanceTypes";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { useState } from "react";
import { dialogsx } from "../../../const";

interface OvertimeCalculatorDialogProps {
  open: boolean;
  onClose: () => void;
  params: OvertimeCalculateParams;
  setParams: (params: OvertimeCalculateParams) => void;
  calculations: any[];
  loading: boolean;
  onCalculate: () => Promise<void>;
  selectedEmployee?: any;
  setSelectedEmployee?: (employee: any) => void;
}

export function OvertimeCalculatorDialog({
  open,
  onClose,
  params,
  setParams,
  calculations,
  loading,
  onCalculate,
  selectedEmployee,
  setSelectedEmployee,
}: OvertimeCalculatorDialogProps) {
  const handleEmployeeChange = (employee: any) => {
    if (setSelectedEmployee) {
      setSelectedEmployee(employee);
    }
    // Update params with the employee ID
    setParams({
      ...params,
      employeeId: employee?.id || "",
    });
  };

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleToggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
        <span className="!pl-4 flex items-center gap-2">
          <CalculateOutlined className="text-primary" />
          Calculate Overtime
        </span>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlined fontSize="small" className="text-gray-800" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="!p-4 !mt-3">
        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-3 gap-4 gap-y-7">
            <EmployeeSelector
              value={selectedEmployee || null}
              onChange={handleEmployeeChange}
              label="Select Employee"
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={params.startDate ? dayjs(params.startDate) : null}
                onChange={(newValue) =>
                  setParams({
                    ...params,
                    startDate: newValue
                      ? dayjs(newValue).format("YYYY-MM-DD")
                      : "",
                  })
                }
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={params.endDate ? dayjs(params.endDate) : null}
                onChange={(newValue) =>
                  setParams({
                    ...params,
                    endDate: newValue
                      ? dayjs(newValue).format("YYYY-MM-DD")
                      : "",
                  })
                }
                minDate={params.startDate ? dayjs(params.startDate) : undefined}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>

          {/* Calculate Button */}
          <div className="flex justify-between items-center">
            <FormControlLabel
              control={
                <Switch
                  checked={params.rateMultiplier}
                  onChange={(e) =>
                    setParams({ ...params, rateMultiplier: e.target.checked })
                  }
                />
              }
              label="Rate Multiplier"
            />
            <Button
              variant="contained"
              onClick={onCalculate}
              disabled={loading || !params.startDate || !params.endDate}
              className="!bg-primary flex justify-right"
            >
              {loading ? "Calculating..." : "Calculate Overtime"}
            </Button>
          </div>

          {loading && <LinearProgress />}

          {/* Results Table */}
          {calculations.length > 0 && (
            // <TableContainer className="border border-gray-200 rounded">
            //     <TableHead>
            //       <TableRow className="bg-gray-50">
            //         <TableCell className="!font-bold">Employee</TableCell>
            //         <TableCell className="!font-bold">Code</TableCell>
            //         <TableCell className="!font-bold">Department</TableCell>
            //         <TableCell className="!font-bold text-right">
            //           Total OT (hrs)
            //         </TableCell>
            //         <TableCell className="!font-bold text-center">
            //           Days
            //         </TableCell>
            //       </TableRow>
            //     </TableHead>
            //     <TableBody>
            //       {calculations.map((ot, i) => (
            //         <TableRow key={i}>
            //           <TableCell>{ot.employeeName}</TableCell>
            //           <TableCell>{ot.employeeCode}</TableCell>
            //           <TableCell>{ot.department}</TableCell>
            //           <TableCell className="text-right">
            //             <span className="text-orange-600 font-bold">
            //               {ot.totalOvertimeHours?.toFixed(1) || 0}
            //             </span>
            //           </TableCell>
            //           <TableCell className="text-center">
            //             <Chip label={ot.overtimeDays || 0} size="small" />
            //           </TableCell>
            //         </TableRow>
            //       ))}
            //     </TableBody>
            // </TableContainer>
            <TableContainer className="border border-gray-200 rounded-sm">
              <Table size="small">
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell
                      className="!font-bold"
                      style={{ width: "30px" }}
                    ></TableCell>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold text-right">
                      Total OT (mins)
                    </TableCell>
                    <TableCell className="!font-bold text-right">
                      Total OT (hrs)
                    </TableCell>
                    <TableCell className="!font-bold text-right">
                      Weighted OT (hrs)
                    </TableCell>
                    <TableCell className="!font-bold text-center">
                      Multiplier
                    </TableCell>
                    <TableCell className="!font-bold text-center">
                      Days
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculations.map((ot, index) => {
                    const isExpanded = expandedRows.has(index);
                    const hasDays = ot.days && ot.days.length > 1;

                    return (
                      <>
                        {/* Main Row */}
                        <TableRow
                          key={`main-${index}`}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => hasDays && handleToggleRow(index)}
                        >
                          <TableCell>
                            {hasDays && (
                              <IconButton size="small">
                                {isExpanded ? (
                                  <ExpandLessOutlined fontSize="small" className="!text-gray-800"/>
                                ) : (
                                  <ExpandMoreOutlined fontSize="small" className="!text-gray-800"/>
                                )}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {ot.employeeName}
                          </TableCell>
                          <TableCell>{ot.employeeCode}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-orange-600 font-bold">
                              {ot.totalOtMinutes?.toFixed(0) || 0} min
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-orange-600 font-bold">
                              {ot.totalOtHours?.toFixed(1) || 0} h
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-blue-600 font-bold">
                              {ot.weightedOtHours?.toFixed(1) || 0} h
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              label={
                                ot.rateMultiplierApplied
                                  ? "Applied"
                                  : "Not Applied"
                              }
                              size="small"
                              color={
                                ot.rateMultiplierApplied ? "success" : "default"
                              }
                              variant={
                                ot.rateMultiplierApplied ? "filled" : "outlined"
                              }
                              className="text-gray-800"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Chip
                              label={ot.days?.length || 0}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>

                        {/* Expandable Breakdown Row */}

                        {/* Expandable Breakdown Row - List Style */}
                        <TableRow key={`breakdown-${index}`}>
                          <TableCell colSpan={7} style={{ padding: 0 }}>
                            <Collapse
                              in={isExpanded}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box
                                sx={{
                                  m: 1,
                                  p: 1.5,
                                  borderRadius: 1.5,
                                }}
                              >
                                <div className="space-y-1">
                                  {ot.days.map((day: any, dayIndex: number) => (
                                    <div
                                      key={dayIndex}
                                      className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-gray-700 min-w-[80px]">
                                          {dayjs(day.date).format(
                                            "DD MMM YYYY",
                                          )}
                                        </span>
                                        <span className="text-[10px] text-gray-400 min-w-[40px]">
                                          {dayjs(day.date).format("ddd")}
                                        </span>
                                        <Chip
                                          label={day.dayType || "Normal"}
                                          size="small"
                                          color={
                                            day.dayType === "Holiday"
                                              ? "error"
                                              : day.dayType === "Weekly Off"
                                                ? "warning"
                                                : "default"
                                          }
                                          variant="outlined"
                                          className="!h-5 !text-[10px] text-gray-800"
                                        />
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500">
                                          ×{ot.rateMultiplierApplied ?  day.multiplier : 1}
                                        </span>
                                        <span className="text-xs font-semibold text-orange-600 min-w-[45px] text-right">
                                          {(day.otMinutes || 0).toFixed(0)} min
                                        </span>
                                        <span className="text-xs font-semibold text-orange-600 min-w-[45px] text-right">
                                          {(day.otHours || 0).toFixed(1)} h
                                        </span>
                                        <span className="text-gray-300">→</span>
                                        <span className="text-xs font-semibold text-blue-600 min-w-[45px] text-right">
                                          {(day.weightedHours || 0).toFixed(1)} h
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {/* Total Row */}
                                  <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded px-3 py-1.5 mt-1">
                                    <span className="text-xs font-semibold text-gray-700">
                                      Total
                                    </span>
                                    <div className="flex items-center gap-3">
                                      <Chip
                                        label={
                                          ot.rateMultiplierApplied
                                            ? "Multiplier Applied"
                                            : "No Multiplier"
                                        }
                                        size="small"
                                        color={
                                          ot.rateMultiplierApplied
                                            ? "success"
                                            : "default"
                                        }
                                        className="!h-5 !text-[10px] text-gray-800"
                                      />
                                      <span className="text-xs font-semibold text-orange-600 min-w-[45px] text-right">
                                        {ot.days
                                          .reduce(
                                            (sum: number, d: any) =>
                                              sum + (d.otHours || 0),
                                            0,
                                          )
                                          .toFixed(1)}
                                        h
                                      </span>
                                      <span className="text-gray-300">→</span>
                                      <span className="text-xs font-semibold text-blue-600 min-w-[45px] text-right">
                                        {ot.days
                                          .reduce(
                                            (sum: number, d: any) =>
                                              sum + (d.weightedHours || 0),
                                            0,
                                          )
                                          .toFixed(1)}
                                        h
                                      </span>

                                    </div>
                                  </div>
                                </div>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </DialogContent>

      <DialogActions className="!p-4 !border-t !border-gray-200">
        <Button
          variant="outlined"
          className="!border-gray-200 !text-gray-800"
          onClick={onClose}
          disabled={loading}
        >
          Close
        </Button>
        {/* {calculations.length > 0 && (
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => {
              onClose();
            }}
          >
            Apply to Records
          </Button>
        )} */}
      </DialogActions>
    </Dialog>
  );
}
