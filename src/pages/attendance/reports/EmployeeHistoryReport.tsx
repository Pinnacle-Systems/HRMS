import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { EmployeeHistoryRow, AttendanceStatus } from "../../../services/modules/attendanceTypes";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_BG,
  formatTime, formatMinutes,
} from "../const";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

export function EmployeeHistoryReport({ onBack }: Props) {
  const { showSnackbar } = useUI();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState<EmployeeHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const employeeId = selectedEmployee?.id ?? '';
  const params = { employeeId, fromDate, toDate };

  const summary = {
    present: rows.filter(r => ["present", "checked_in", "checked_out"].includes(r.status)).length,
    absent: rows.filter(r => r.status === "absent").length,
    late: rows.filter(r => r.status === "late").length,
    leave: rows.filter(r => r.status === "leave").length,
    totalOtMinutes: rows.reduce((s, r) => s + r.overtimeMinutes, 0),
    totalWorkedMinutes: rows.reduce((s, r) => s + r.workedMinutes, 0),
  };

  async function generate(p = page, l = limit) {
    if (!employeeId) { showSnackbar("Please select an employee", "warning"); return; }
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportEmployeeHistory({ employeeId, fromDate, toDate, page: p - 1, size: l });
      const data = res?.data?.data ?? res?.data;
      setRows(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ReportLayout
      title="Employee Attendance History"
      description="Full date-wise attendance log for a single employee over selected date range"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "employee-history", params }}
      filterPanel={
        <>
          <FilterField label="">
            <div style={{ width: 250 }}>
              <EmployeeSelector
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                label="Select Employee"
              />
            </div>
          </FilterField>
          <FilterField label="From Date">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(newValue) => { setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); }}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}>

              </DatePicker>
            </LocalizationProvider>
          </FilterField>
          <FilterField label="To Date">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={toDate ? dayjs(toDate) : null}
                onChange={(newValue) => { setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); }}
                maxDate={new Date() ? dayjs(new Date()) : undefined}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}>

              </DatePicker>
            </LocalizationProvider>
          </FilterField>
        </>
      }
    >
      {rows.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 border-b border-gray-200 bg-white-50">
          {[
            { label: "Present", value: summary.present, cls: "text-green-600" },
            { label: "Absent", value: summary.absent, cls: "text-red-500" },
            { label: "Late", value: summary.late, cls: "text-amber-600" },
            { label: "Leave", value: summary.leave, cls: "text-violet-600" },
            { label: "Total OT", value: formatMinutes(summary.totalOtMinutes), cls: "text-orange-600" },
            { label: "Total Worked", value: formatMinutes(summary.totalWorkedMinutes), cls: "text-blue-600" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="text-center">
              <div className={`text-lg font-bold ${cls}`}>{value}</div>
              <div className="text-[12px] text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <TableContainer className="max-h-[calc(100vh-490px)]">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {["S No","Date", "Day", "Shift", "Check In", "Check Out", "Worked", "Late", "Early Out", "OT", "Status", "Remarks"].map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.attendanceDate}  sx={getRowColor(i)}
                className={`${r.status === "holiday" || r.status === "weekly_off" ? "opacity-60" : ""}`}>
                  <TableCell>{i+1}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {dayjs(r.attendanceDate).format("DD MMM YYYY")}
                </TableCell>
                <TableCell>{r.dayOfWeek}</TableCell>
                <TableCell>{r.shiftCode}</TableCell>
                <TableCell>{r.checkInTime ? formatTime(r.checkInTime) : '-'}</TableCell>
                <TableCell>{r.checkOutTime ? formatTime(r.checkOutTime) : '-'}</TableCell>
                <TableCell>{r.workedMinutes ? formatMinutes(r.workedMinutes) : "-"}</TableCell>
                <TableCell>
                  {r.lateMinutes > 0 ? <span className="text-amber-600">{formatMinutes(r.lateMinutes)}</span> : "-"}
                </TableCell>
                <TableCell>
                  {r.earlyOutMinutes > 0 ? <span className="text-pink-600">{formatMinutes(r.earlyOutMinutes)}</span> : "-"}
                </TableCell>
                <TableCell>
                  {r.overtimeMinutes > 0 ? <span className="text-orange-600">{formatMinutes(r.overtimeMinutes)}</span> : "-"}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full whitespace-nowrap
                    ${ATTENDANCE_STATUS_BG[r.status as AttendanceStatus] ?? "bg-gray-100 text-gray-600"}`}>
                    {ATTENDANCE_STATUS_LABELS[r.status as AttendanceStatus] ?? r.status}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500 max-w-[120px] truncate" title={r.remarks}>
                  {r.remarks || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <GlobalPagination
        total={total} page={page} limit={limit}
        onPageChange={p => { setPage(p); generate(p, limit); }}
        onLimitChange={l => { setLimit(l); setPage(1); generate(1, l); }}
      />
    </ReportLayout>
  );
}
