import { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { MonthlySummaryRow } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { MONTHS, getCurrentMonthYear } from "../attendanceDashboard/const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import { getRowColor } from "../../const";
import { selectSx } from "../../../const";

interface Props { onBack: () => void }

const { month: curMonth, year: curYear } = getCurrentMonthYear();

export function MonthlySummaryReport({ onBack }: Props) {
  const { showSnackbar } = useUI();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);
  const [rows, setRows] = useState<MonthlySummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const params = { month, year, departmentId: departmentId || undefined };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportMonthlySummary({ ...params, page: p - 1, size: l } as any);
      const data = res?.data?.data ?? res?.data;
      setRows(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  }

  const headers = [
    "S No", "Emp Code", "Name", "Department", "Designation",
    "Present", "Absent", "Late", "Early Out", "Half Day",
    "Leave", "On Duty", "Permission", "OT (h)", "Worked (h)", "LOP", "Att %",
  ];

  return (
    <ReportLayout
      title="Monthly Attendance Summary"
      description={`Employee-wise attendance roll-up for ${MONTHS[month - 1]} ${year}`}
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "monthly-summary", params }}
      filterPanel={
        <>
          <FilterField label="Month">
            <FormControl>
              <Select value={month} onChange={e => setMonth(Number(e.target.value))} sx={selectSx}>
                {MONTHS.map((m, i) => (
                  <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterField>
          <FilterField label="Year">
            <FormControl>
              <Select value={year} onChange={e => setYear(Number(e.target.value))} sx={selectSx}>
                {[curYear - 1, curYear, curYear + 1].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
      <TableContainer className="max-h-[calc(100vh-420px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.employeeId} sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{r.employeeCode}</TableCell>
                <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell>{r.designation}</TableCell>
                <TableCell className="!text-center !font-bold"><span className="!text-green-600">{r.presentDays}</span></TableCell>
                <TableCell className="!text-center !font-semibold"><span className="!text-red-500">{r.absentDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-amber-600">{r.lateDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-pink-600">{r.earlyOutDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-purple-600">{r.halfDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-violet-600">{r.leaveDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-cyan-600">{r.onDutyDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-orange-500">{r.permissionDays}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-orange-600">{r.otHours.toFixed(1)}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-gray-700">{r.totalWorkedHours.toFixed(1)}</span></TableCell>
                <TableCell className="!text-center"><span className="!text-red-600">{r.lossOfPayDays}</span></TableCell>
                <TableCell className="!text-center">
                  <span className={`px-2 py-0.5 rounded-full font-semibold
                    ${r.attendancePercentage >= 90 ? "bg-green-100 text-green-700"
                      : r.attendancePercentage >= 75 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"}`}>
                    {r.attendancePercentage.toFixed(1)}%
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
