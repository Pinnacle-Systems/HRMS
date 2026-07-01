import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { OvertimeRow } from "../../../services/modules/attendanceTypes";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { formatTime, formatMinutes } from "../const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

export function OvertimeReport({ onBack }: Props) {
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
  const [minOtMinutes, setMinOtMinutes] = useState(30);
  const [rows, setRows] = useState<OvertimeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  // Running totals
  const totalOtMinutes = rows.reduce((s, r) => s + r.overtimeMinutes, 0);

  const params = { fromDate, toDate, departmentId: departmentId || undefined, minOtMinutes };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportOvertime({ ...params, page: p - 1, size: l });
      const data = res?.data?.employees ?? res?.data;
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
      title="Overtime Report"
      description="Employee overtime hours by date range with shift-based calculation"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "overtime", params }}
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
          <FilterField label="Min OT (min)">
            <TextField type="number" value={minOtMinutes}
              onChange={e => setMinOtMinutes(Number(e.target.value))} style={{ width: 110 }} />
          </FilterField>
        </>
      }
    >
      {/* OT Summary Banner */}
      {rows.length > 0 && (
        <div className="flex gap-4 p-3 bg-primary-50 border-b border-gray-200">
          <div className="text-[12px]">
            <span className="text-gray-500">Total OT Hours: </span>
            <span className="font-bold text-primary">{(totalOtMinutes / 60).toFixed(1)} hrs</span>
          </div>
          <div className="text-[12px]">
            <span className="text-gray-500">Avg OT per record: </span>
            <span className="font-semibold text-primary">
              {rows.length > 0 ? (totalOtMinutes / rows.length / 60).toFixed(1) : 0} hrs
            </span>
          </div>
        </div>
      )}
      <TableContainer className="max-h-[calc(100vh-420px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["S No", "Emp Code", "Name", "Department", "Date", "Shift", "Shift End", "Check Out", "OT Duration"].map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.employeeId}-${r.attendanceDate}`} sx={getRowColor(i)}>
                <TableCell >{i + 1}</TableCell>
                <TableCell >{r.employeeCode}</TableCell>
                <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                <TableCell >{r.department}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {dayjs(r.attendanceDate).format("DD MMM YYYY, ddd")}
                </TableCell>
                <TableCell >{r.shiftCode}</TableCell>
                <TableCell >{formatTime(r.shiftEndTime)}</TableCell>
                <TableCell className="!font-semibold"><span className="text-orange-700 ">{formatTime(r.checkOutTime)}</span></TableCell>
                <TableCell >
                  <span className={`px-2 py-0.5 rounded-full font-semibold
                    ${r.overtimeMinutes >= 120 ? "bg-orange-100 text-orange-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {formatMinutes(r.overtimeMinutes)}
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
