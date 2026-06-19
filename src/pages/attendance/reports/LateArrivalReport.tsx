import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { LateArrivalRow } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField, inputCls } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { formatTime, formatMinutes } from "../attendanceDashboard/const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { selectSx } from "../../../const";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

export function LateArrivalReport({ onBack }: Props) {
  const { showSnackbar } = useUI();
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);
  const [minLateMinutes, setMinLateMinutes] = useState(1);
  const [rows, setRows] = useState<LateArrivalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const params = { fromDate, toDate, departmentId: departmentId || undefined, minLateMinutes };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportLateArrival({ ...params, page: p - 1, size: l });
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
      title="Late Arrival Report"
      description="Employees who arrived late, their late minutes, and frequency"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "late-arrivals", params }}
      filterPanel={
        <>
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
          <FilterField label="Department">
            <FormControl>
              <Select value={departmentId} onChange={e => setDepartmentId(e.target.value)} sx={selectSx}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterField>
          <FilterField label="Min Absent Days">
            <TextField type="number" value={minLateMinutes}
              onChange={e => setMinLateMinutes(Number(e.target.value))} style={{ width: 110 }} />
          </FilterField>
        </>
      }
    >
      <TableContainer className="max-h-[calc(100vh-400px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["S No", "Emp Code", "Name", "Department", "Date", "Shift", "Shift Start", "Check In", "Late By"].map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.employeeId}-${r.attendanceDate}`} sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{r.employeeCode}</TableCell>
                <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                <TableCell >{r.department}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {dayjs(r.attendanceDate).format("DD MMM YYYY, ddd")}
                </TableCell>
                <TableCell >{r.shiftCode}</TableCell>
                <TableCell>{formatTime(r.shiftStartTime)}</TableCell>
                <TableCell > <span className="text-amber-700 ">{formatTime(r.checkInTime)}</span></TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full font-semibold
                    ${r.lateMinutes > 30 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {formatMinutes(r.lateMinutes)}
                  </span>
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
