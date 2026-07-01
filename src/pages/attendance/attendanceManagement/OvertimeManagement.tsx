import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import {
  AccessTimeOutlined, CalculateOutlined, CloseOutlined,
  FilterListOutlined, RefreshOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import type { OvertimeCalculateParams } from "../../../services/modules/attendanceTypes";
import { useOvertimeCalculator } from "../../../hooks/useOTCalculator";
import { OvertimeCalculatorDialog } from "./OvertimeCalculatorDialog";

interface OvertimeRecord {
  // recordId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  attendanceDate: string;
  // shiftCode: string;
  overtimeMinutes: number;
  overtimeHours: number;
  // status: "pending" | "approved" | "rejected";
  // remarks?: string;
  // createdAt: string;
  recordId: string;
  department: string;
  otApprovalStatus: string;
  otApprovedBy?: string;
  otRemarks: string;
}

const mockOvertimeData = {
  "success": true,
  "message": "Overtime records fetched successfully",
  "data": {
    "dateRangeStart": "2026-06-01",
    "total": 5,
    "items": [
      {
        "recordId": "ot-001",
        "employeeId": "emp-1001",
        "employeeName": "Rajesh Kumar",
        "employeeCode": "EMP001",
        "department": "Engineering",
        "attendanceDate": "2026-06-01",
        "overtimeMinutes": 120,
        "overtimeHours": 2,
        "otApprovalStatus": "approved",
        "otApprovedBy": "HOD-01",
        "otRemarks": "Project deadline completion"
      },
      {
        "recordId": "ot-002",
        "employeeId": "emp-1001",
        "employeeName": "Rajesh Kumar",
        "employeeCode": "EMP001",
        "department": "Engineering",
        "attendanceDate": "2026-06-02",
        "overtimeMinutes": 90,
        "overtimeHours": 1.5,
        "otApprovalStatus": "pending",
        "otApprovedBy": null,
        "otRemarks": "Client demo preparation"
      },
      {
        "recordId": "ot-003",
        "employeeId": "emp-1001",
        "employeeName": "Rajesh Kumar",
        "employeeCode": "EMP001",
        "department": "Engineering",
        "attendanceDate": "2026-06-05",
        "overtimeMinutes": 180,
        "overtimeHours": 3,
        "otApprovalStatus": "pending",
        "otApprovedBy": null,
        "otRemarks": "Production deployment support"
      },
      {
        "recordId": "ot-004",
        "employeeId": "emp-1001",
        "employeeName": "Rajesh Kumar",
        "employeeCode": "EMP001",
        "department": "Engineering",
        "attendanceDate": "2026-06-08",
        "overtimeMinutes": 60,
        "overtimeHours": 1,
        "otApprovalStatus": "rejected",
        "otApprovedBy": "HOD-01",
        "otRemarks": "Not approved due to policy violation"
      },
      {
        "recordId": "ot-005",
        "employeeId": "emp-1001",
        "employeeName": "Rajesh Kumar",
        "employeeCode": "EMP001",
        "department": "Engineering",
        "attendanceDate": "2026-06-10",
        "overtimeMinutes": 150,
        "overtimeHours": 2.5,
        "otApprovalStatus": "approved",
        "otApprovedBy": "HOD-01",
        "otRemarks": "Critical bug fix"
      }
    ]
  },
  "timestamp": "2026-06-29T05:56:29.785Z"
}

export function OvertimeManagement() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [departmentId, setDepartmentId] = useState("");
  // const [statusFilter, setStatusFilter] = useState("pending");
  // const [dateRangeStart, setDateRangeStart] = useState(
  //   dayjs().startOf("month").format("YYYY-MM-DD")
  // );
  const [departments, setDepartments] = useState<Department[]>([]);

  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    loading: calculating,
    calculations: otCalculations,
    dialogOpen: otDialogOpen,
    params: otParams,
    setParams: setOtParams,
    setDialogOpen: setOtDialogOpen,
    calculateOvertime,
    resetCalculator,
  } = useOvertimeCalculator();

  const loadOvertime = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getOvertimeApprovalRequired({
        managerId: selectedEmployee?.id || undefined,
        departmentId: departmentId || undefined,
        dateRangeStart: dayjs().startOf("month").format("YYYY-MM-DD"),
      });
      const data = res?.data?.data ?? res?.data;
      // setRecords(Array.isArray(data) ? data : data?.content ?? []);
      setRecords(mockOvertimeData.data.items as OvertimeRecord[] || [])
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load overtime records", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [selectedEmployee, departmentId]);

  const fetchDepartments = async () => {
    try {
      const res: any = await departmentService.getActiveDepartments();
      setDepartments(Array.isArray(res.data?.content || res.data) ? (res.data?.content || res.data) : []);
    } catch {
      showSnackbar("Failed to load records", "error");
    }
  };

  useEffect(() => {
    loadOvertime();
    fetchDepartments();
  }, [loadOvertime]);

  const handleApprove = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await attendanceService.approveOvertime(selectedRecord.recordId, {
        status: "approved",
        remarks: approveRemarks,
        approvedBy: "",
      });
      showSnackbar("Overtime approved", "success");
      setDetailOpen(false);
      loadOvertime();
    } catch {
      showSnackbar("Failed to approve overtime", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    if (!approveRemarks.trim()) {
      showSnackbar("Remarks required for rejection", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await attendanceService.approveOvertime(selectedRecord.recordId, {
        status: "rejected",
        remarks: approveRemarks,
        approvedBy: "",
      });
      showSnackbar("Overtime rejected", "info");
      setDetailOpen(false);
      loadOvertime();
    } catch {
      showSnackbar("Failed to reject overtime", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setApproveRemarks("");
    setDetailOpen(true);
  };

  // async function handleCalculateOvertime() {
  //   setLoadingOt(true);
  //   showSpinner();
  //   try {
  //     const res: any = await attendanceService.calculateOvertime(otParams);
  //     const data = res?.data?.data ?? res?.data;
  //     setOtCalculations(Array.isArray(data) ? data : [data]);
  //     setOtDialogOpen(true);
  //     showSnackbar("Overtime calculation completed", "success");
  //   } catch (err: any) {
  //     showSnackbar(err?.response?.data?.message ?? "Failed to calculate overtime", "error");
  //   } finally {
  //     setLoadingOt(false);
  //     hideSpinner();
  //   }
  // }

  const handleOpenCalculator = () => {
    // Optionally pre-fill with current filters
    setOtParams({
      startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      employeeId: selectedEmployee?.id || "",
    });
    setOtDialogOpen(true);
  };

  const handleCalculationComplete = async () => {
    await calculateOvertime();
    // Optionally refresh the records after calculation
    loadOvertime();
  };

  const stats = {
    pending: records.filter(r => r.otApprovalStatus === "pending").length,
    approved: records.filter(r => r.otApprovalStatus === "approved").length,
    rejected: records.filter(r => r.otApprovalStatus === "rejected").length,
    totalHours: records.reduce((sum, r) => sum + r.overtimeHours, 0),
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header with Calculate Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[12px] font-semibold text-gray-800">Overtime Management</h2>
          <p className="text-[12px] text-gray-500">Manage and approve overtime requests</p>
        </div>
        <Button
          variant="contained"
          startIcon={<CalculateOutlined />}
          onClick={handleOpenCalculator}
          className="!bg-primary"
        >
          Calculate OT
        </Button>
      </div>
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterListOutlined className="text-gray-500" />
          <div className="w-[220px]">
            <EmployeeSelector
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              label="Select Employee"
              isManager={true}
            />
          </div>
          <FormControl className="!w-[220px]">
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              label="Department"
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadOvertime}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending Approval</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-xs text-gray-500">Approved</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-gray-500">Rejected</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.totalHours.toFixed(1)}h
          </div>
          <div className="text-xs text-gray-500">Total OT Hours</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className="max-h-[calc(100vh-420px)]">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["S No", "Employee", "Code", "Department", "Attendance Date", "Overtime Minutes", "OT Hours", "OT ApprovedBy", "otRemarks", "Status", "Actions"].map((h) => (
                  <TableCell key={h} className="!font-bold">{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <div className="py-6 text-gray-400"> Loading...</div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" >
                    <div className="py-6 text-gray-400">No overtime records found</div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, i) => (
                  <TableRow key={r.recordId} hover sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                    <TableCell>{r.employeeCode}</TableCell>
                    <TableCell>{r.department}</TableCell>

                    <TableCell className="whitespace-nowrap">
                      {dayjs(r.attendanceDate).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {r.overtimeMinutes.toFixed(1)}h
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {r.overtimeHours.toFixed(1)}h
                    </TableCell>
                    <TableCell>{r.otApprovedBy}</TableCell>
                    <TableCell>{r.otRemarks}</TableCell>

                    <TableCell>
                      <Chip
                        label={r.otApprovalStatus}
                        size="small"
                        color={
                          r.otApprovalStatus === "approved" ? "success" :
                            r.otApprovalStatus === "rejected" ? "error" : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openDetail(r)}>
                          <VisibilityOutlined fontSize="small" className="text-primary" />
                        </IconButton>
                      </Tooltip>
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
            onPageChange={(p) => setPage(p - 1)}
            onLimitChange={(l) => { setLimit(l); setPage(0); }}
          />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">Overtime Details</span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Employee", selectedRecord.employeeName],
                  ["Code", selectedRecord.employeeCode],
                  ["Department", selectedRecord.department],
                  ["Attendanc eDate", dayjs(selectedRecord.attendanceDate).format("DD MMM YYYY")],
                  // ["Shift", selectedRecord.shiftCode],
                  ["Overtime Minutes", `${selectedRecord.overtimeMinutes.toFixed(1)}h`],
                  ["Overtime Hours", `${selectedRecord.overtimeHours.toFixed(1)}h`],
                  ["OT Approved By", selectedRecord.otApprovedBy],
                  ["OT Remarks", selectedRecord.otRemarks],
                  ["Status", selectedRecord.otApprovalStatus],
                ].map(([label, value]) => (
                  <div key={label} className="bg-head rounded p-2">
                    <div className="text-gray-500 text-[12px]">{label}</div>
                    <div className="text-gray-800 text-[12px] font-medium">{value}</div>
                  </div>
                ))}
              </div>

              {selectedRecord.otApprovalStatus === "pending" && (
                <TextField
                  label={selectedRecord.otApprovalStatus === "pending" ? "Remarks (optional)" : "Remarks"}
                  fullWidth
                  multiline
                  rows={2}
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  placeholder={selectedRecord.otApprovalStatus === "pending" ? "Add remarks (optional)" : "Add remarks"}
                />
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => setDetailOpen(false)}
            disabled={submitting}
          >
            Close
          </Button>
          {selectedRecord?.otApprovalStatus === "pending" && (
            <>
              <Button
                variant="contained"
                className="!bg-red-600"
                onClick={handleReject}
                disabled={submitting}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                className="!bg-green-700"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Approve"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Add OT dialog */}
      {/* <Dialog open={otDialogOpen} onClose={() => setOtDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">Overtime Calculation Results</span>
          <IconButton size="small" onClick={() => setOtDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          {loadingOt ? (
            <div className="text-center py-8">Calculating...</div>
          ) : otCalculations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No overtime data found</div>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold">Employee</TableCell>
                    <TableCell className="!font-bold">Code</TableCell>
                    <TableCell className="!font-bold">Department</TableCell>
                    <TableCell className="!font-bold">Total OT (hrs)</TableCell>
                    <TableCell className="!font-bold">Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {otCalculations.map((ot, i) => (
                    <TableRow key={i}>
                      <TableCell>{ot.employeeName}</TableCell>
                      <TableCell>{ot.employeeCode}</TableCell>
                      <TableCell>{ot.department}</TableCell>
                      <TableCell>
                        <span className="text-orange-600 font-bold">{ot.totalOvertimeHours?.toFixed(1)}</span>
                      </TableCell>
                      <TableCell>{ot.overtimeDays || 0}</TableCell>
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
            onClick={() => setOtDialogOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog> */}
      <OvertimeCalculatorDialog
        open={otDialogOpen}
        onClose={() => {
          setOtDialogOpen(false);
          resetCalculator();
        }}
        params={otParams}
        setParams={setOtParams}
        calculations={otCalculations}
        loading={calculating}
        onCalculate={handleCalculationComplete}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
      />

    </div>
  );
}