import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { RefreshOutlined, BeachAccessOutlined } from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import { leaveService, type LeaveType } from "../../../services";

interface LeaveEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status?: string;
}

export function LeaveToday() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [leaves, setLeaves] = useState<LeaveEmployee[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadLeaves = async () => {
    showSpinner();
    try {
      const res: any = await attendanceService.getEmployeesOnLeaveToday({
        departmentId: departmentId || undefined,
        leaveType: leaveType || undefined,
      });
      const data = res?.data?.employees ?? res?.data;
      setLeaves(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar("Failed to load employees on leave", "error");
    } finally {
      hideSpinner();
    }
  };

  const fetchDepartments = async () => {
    try {
      const res: any = await departmentService.getActiveDepartments();
      setDepartments(
        Array.isArray(res.data?.content || res.data)
          ? res.data?.content || res.data
          : [],
      );
      const res1: any = await leaveService.getLeaveTypes();
      setLeaveTypes(
        Array.isArray(res1.data?.content || res1.data)
          ? res1.data?.content || res1.data
          : [],
      );
    } catch {}
  };

  useEffect(() => {
    loadLeaves();
    fetchDepartments();
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [departmentId, leaveType]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BeachAccessOutlined className="text-violet-500" />
          <span className="text-[12px] text-gray-800">
            Employees on Leave Today
          </span>
          <Chip label={leaves.length} size="small" className="!bg-violet-100 !text-violet-600" />
        </div>
        <div className="flex items-center gap-2">
          <FormControl className="!w-[160px]">
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentId}
              label="Department"
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.departmentName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className="!w-[150px]">
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={leaveType}
              label="Leave Type"
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {leaveTypes.map((d) => (
                <MenuItem key={d.id} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadLeaves}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <TableContainer className="max-h-[300px] border border-gray-200 rounded-md">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "S No",
                "Employee",
                "Code",
                "Department",
                "Leave Type",
                "Period",
              ].map((h) => (
                <TableCell key={h} className="!font-bold">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((l, i) => (
              <TableRow key={i} hover sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {l.employeeName}
                </TableCell>
                <TableCell>{l.employeeCode}</TableCell>
                <TableCell>{l.department}</TableCell>
                <TableCell>
                  <Chip label={l.leaveType} size="small" variant="outlined" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {dayjs(l.fromDate).format("DD MMM")} -{" "}
                  {dayjs(l.toDate).format("DD MMM")}
                </TableCell>
                {/* <TableCell>
                    <Chip
                      label={l.status}
                      size="small"
                      color={l.status === "approved" ? "success" : "warning"}
                    />
                  </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {leaves.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-[12px]">
            No employees on leave today
          </div>
        ) : null}
      </TableContainer>
    </div>
  );
}
