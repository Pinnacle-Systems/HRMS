import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField,
} from "@mui/material";
import { KeyboardArrowDownOutlined, KeyboardArrowRightOutlined } from "@mui/icons-material";
import { attendanceService } from "../../../services/modules/attendance";
import type { AbsenteeismRow } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { MONTHS, getCurrentMonthYear } from "../attendanceDashboard/const";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

const { month: curMonth, year: curYear } = getCurrentMonthYear();

export function AbsenteeismReport({ onBack }: Props) {
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
  const [minAbsentDays, setMinAbsentDays] = useState(1);
  const [rows, setRows] = useState<AbsenteeismRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const params = { month, year, departmentId: departmentId || undefined, minAbsentDays };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    setExpandedRow(null);
    try {
      const res: any = await attendanceService.getReportAbsenteeism({ ...params, page: p - 1, size: l } as any);
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
      title="Absenteeism Report"
      description={`Absence frequency, LOP days, and consecutive absence patterns — ${MONTHS[month - 1]} ${year}`}
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "absenteeism", params }}
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
          <FilterField label="Min Absent Days">
            <TextField type="number" value={minAbsentDays}
              onChange={e => setMinAbsentDays(Number(e.target.value))} style={{ width: 110 }} />
          </FilterField>
        </>
      }
    >
      <TableContainer className="max-h-[calc(100vh-400px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell />
              {["S No", "Emp Code", "Name", "Department", "Working Days", "Present", "Absent", "Leave", "LOP", "Consec. Absent", "Absent Rate"].map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <>
                <TableRow
                  key={r.employeeId || i}
                  hover
                  onClick={() => setExpandedRow(expandedRow === r.employeeId ? null : r.employeeId)}
                  sx={getRowColor(i)}
                >
                  <TableCell className="">
                    {r.absentDates?.length > 0
                      ? (expandedRow === r.employeeId
                        ? <KeyboardArrowDownOutlined fontSize="small" className="text-gray-400" />
                        : <KeyboardArrowRightOutlined fontSize="small" className="text-gray-400" />)
                      : null}
                  </TableCell>
                  <TableCell >{i + 1}</TableCell>
                  <TableCell >{r.employeeCode}</TableCell>
                  <TableCell className=" whitespace-nowrap">{r.employeeName}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className=" !text-center"><span className="text-gray-700">{r.totalWorkingDays}</span></TableCell>
                  <TableCell className=" !text-center !font-semibold"><span className="text-green-600">{r.presentDays}</span></TableCell>
                  <TableCell className=" !text-center font-semibold"><span className="text-red-600">{r.absentDays}</span></TableCell>
                  <TableCell className=" !text-center"><span className="text-violet-600">{r.leaveDays}</span></TableCell>
                  <TableCell className=" !text-center"><span className="text-red-500">{r.lopDays}</span></TableCell>
                  <TableCell className=" !text-center">
                    {r.consecutiveAbsences > 2
                      ? <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full !font-semibold">{r.consecutiveAbsences}</span>
                      : <span className="">{r.consecutiveAbsences}</span>}
                  </TableCell>
                  <TableCell className=" text-center">
                    <span className={`px-2 py-0.5 rounded-full font-semibold
                      ${r.absenteeismRate > 15 ? "bg-red-100 text-red-700"
                        : r.absenteeismRate > 8 ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"}`}>
                      {r.absenteeismRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>

                {/* Expanded absent dates */}
                {expandedRow === r.employeeId && r.absentDates?.length > 0 && (
                  <TableRow key={`${r.employeeId}-exp`}>
                    <TableCell colSpan={12} >
                      <div className="bg-red-50 !py-2 !px-4 flex items-center gap-2">
                        <div className="text-black">Absent Dates:</div>
                        <div className="flex flex-wrap gap-1">
                          {r.absentDates.map(d => (
                            <span key={d} className="bg-red-100 text-red-700 px-2 py-0.5 rounded ">
                              {dayjs(d).format("DD MMM")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
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
