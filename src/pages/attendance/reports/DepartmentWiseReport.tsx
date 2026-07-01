import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { attendanceService } from "../../../services/modules/attendance";
import type { DepartmentWiseRow } from "../../../services/modules/attendanceTypes";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

export function DepartmentWiseReport({ onBack }: Props) {
  const { showSnackbar } = useUI();
  const [fromDate, setFromDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState<DepartmentWiseRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const params = { fromDate, toDate };

  async function generate() {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportDepartmentWise(params);
      const data = res?.data?.departments ?? res?.data;
      setRows(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ReportLayout
      title="Department-wise Attendance Report"
      description="Aggregated attendance metrics grouped by department"
      onBack={onBack}
      onGenerate={generate}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={rows.length}
      exportConfig={{ reportType: "department-wise", params }}
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
        </>
      }
    >
      {/* View toggle */}
      {rows.length > 0 && (
        <div className="flex gap-2 p-3 border-b border-gray-200">
          {(["table", "chart"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors
                ${viewMode === v ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {v}
            </button>
          ))}
        </div>
      )}

      {viewMode === "chart" && rows.length > 0 ? (
        <div className="p-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows} barSize={20} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
              <Bar dataKey="totalPresentDays" fill="#10d3a2" name="Present Days" radius={[2, 2, 0, 0]} />
              <Bar dataKey="totalAbsentDays" fill="#e66262" name="Absent Days" radius={[2, 2, 0, 0]} />
              <Bar dataKey="totalLateDays" fill="#f1aa30" name="Late Days" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <TableContainer className="max-h-[calc(100vh-400px)]">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {["S No","Department", "Employees", "Working Days", "Present Days", "Absent Days", "Late Days", "OT Hours", "Avg Attendance %"].map(h => (
                  <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.department} sx={getRowColor(i)}>
                  <TableCell>{i+1}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className="!text-center">{r.totalEmployees}</TableCell>
                  <TableCell className="!text-center">{r.totalWorkingDays}</TableCell>
                  <TableCell className="!text-center !font-semibold"><span className="text-green-600">{r.totalPresentDays}</span></TableCell>
                  <TableCell className="!text-center !font-semibold"><span className="text-red-500">{r.totalAbsentDays}</span></TableCell>
                  <TableCell className="!text-center"><span className="text-amber-600">{r.totalLateDays}</span></TableCell>
                  <TableCell className="!text-center"><span className="text-orange-600">{r.totalOtHours.toFixed(1)}</span></TableCell>
                  <TableCell className="!text-center">
                    <span className={`px-2 py-0.5 rounded-full font-semibold
                      ${r.averageAttendance >= 90 ? "bg-green-100 text-green-700"
                        : r.averageAttendance >= 75 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"}`}>
                      {r.averageAttendance.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                <TableCell></TableCell>
                <TableCell className="text-gray-700">Total</TableCell>
                <TableCell className="!text-center !font-bold">{rows.reduce((s, r) => s + r.totalEmployees, 0)}</TableCell>
                <TableCell className="!text-center !font-bold">—</TableCell>
                <TableCell className="!text-center !font-bold text-green-700"><span className="text-green-700">{rows.reduce((s, r) => s + r.totalPresentDays, 0)}</span></TableCell>
                <TableCell className="!text-center !font-bold text-red-600"><span className="text-red-600">{rows.reduce((s, r) => s + r.totalAbsentDays, 0)}</span></TableCell>
                <TableCell className="!text-center !font-bold text-amber-700"><span className="text-amber-700">{rows.reduce((s, r) => s + r.totalLateDays, 0)}</span></TableCell>
                <TableCell className="!text-center !font-bold text-orange-600"><span className="text-orange-600">{rows.reduce((s, r) => s + r.totalOtHours, 0).toFixed(1)}</span></TableCell>
                <TableCell className="!text-center !font-bold">
                  {rows.length > 0 ? (rows.reduce((s, r) => s + r.averageAttendance, 0) / rows.length).toFixed(1) : 0}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </ReportLayout>
  );
}
