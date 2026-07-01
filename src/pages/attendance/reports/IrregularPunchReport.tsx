import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { IrregularPunchRow } from "../../../services/modules/attendanceTypes";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { formatTime } from "../const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

const MISSING_PUNCH_STYLE = {
  check_in: { label: "Missing Check-in", cls: "bg-amber-100 text-amber-700" },
  check_out: { label: "Missing Check-out", cls: "bg-pink-100 text-pink-700" },
  both: { label: "Both Missing", cls: "bg-red-100 text-red-700" },
};

export function IrregularPunchReport({ onBack }: Props) {
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
  const [rows, setRows] = useState<IrregularPunchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const params = { fromDate, toDate, departmentId: departmentId || undefined };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportIrregularPunch({ ...params, page: p - 1, size: l });
      const data = res?.data?.employees ?? res?.data;
      setRows(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Breakdown counts
  const missingIn = rows.filter(r => r.missingPunch === "check_in").length;
  const missingOut = rows.filter(r => r.missingPunch === "check_out").length;
  const missingBoth = rows.filter(r => r.missingPunch === "both").length;

  return (
    <ReportLayout
      title="Irregular Punch Report"
      description="Employees with missing check-in or check-out — review before period finalisation"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "irregular-punch", params }}
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
        </>
      }
    >
      {/* Breakdown pills */}
      {rows.length > 0 && (
        <div className="flex gap-3 p-3 bg-primary-50 border-b border-gray-200">
          <span className="text-[12px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
            Missing Check-in: {missingIn}
          </span>
          <span className="text-[12px] bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-medium">
            Missing Check-out: {missingOut}
          </span>
          <span className="text-[12px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
            Both Missing: {missingBoth}
          </span>
        </div>
      )}
      <TableContainer className="max-h-[calc(100vh-400px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["S No","Emp Code", "Name", "Department", "Date", "Shift", "Check In", "Check Out", "Missing Punch"].map(h => (
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
                <TableCell>{r.department}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {dayjs(r.attendanceDate).format("DD MMM YYYY, ddd")}
                </TableCell>
                <TableCell >{r.shiftCode}</TableCell>
                <TableCell >
                  {r.checkInTime
                    ? <span className="text-gray-700">{formatTime(r.checkInTime)}</span>
                    : <span className="text-red-400 font-semibold">-</span>}
                </TableCell>
                <TableCell >
                  {r.checkOutTime
                    ? <span className="text-gray-700">{formatTime(r.checkOutTime)}</span>
                    : <span className="text-red-400 font-semibold">-</span>}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${MISSING_PUNCH_STYLE[r.missingPunch]?.cls}`}>
                    {MISSING_PUNCH_STYLE[r.missingPunch]?.label}
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
