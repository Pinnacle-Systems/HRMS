import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
import type { LeaveUtilizationRow } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField, inputCls } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { MONTHS, getCurrentMonthYear } from "../attendanceDashboard/const";
import { departmentService } from "../../../services/modules/department";
import { leaveService } from "../../../services/modules/leave";
import type { Department } from "../../employees/type";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";

interface Props { onBack: () => void }

const { month: curMonth, year: curYear } = getCurrentMonthYear();

export function LeaveUtilizationReport({ onBack }: Props) {
  const { showSnackbar } = useUI();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [departmentId, setDepartmentId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    departmentService.getActiveDepartments().then((res: any) => {
      const data = res.data?.content || res.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    }).catch(() => { });

    leaveService.getLeaveTypes().then((res: any) => {
      const data = res.data?.data?.content ?? res.data?.content ?? res.data ?? [];
      setLeaveTypes(Array.isArray(data) ? data : []);
    }).catch(() => { });
  }, []);
  const [rows, setRows] = useState<LeaveUtilizationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const params = {
    month, year,
    departmentId: departmentId || undefined,
    leaveTypeId: leaveTypeId || undefined,
  };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportLeaveUtilization({ ...params, page: p - 1, size: l } as any);
      const data = res?.data?.data ?? res?.data;
      setRows(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Aggregate totals
  const totals = rows.reduce(
    (acc, r) => ({
      accrued: acc.accrued + r.accrued,
      taken: acc.taken + r.taken,
      encashed: acc.encashed + r.encashed,
      lapsed: acc.lapsed + r.lapsed,
      closing: acc.closing + r.closingBalance,
    }),
    { accrued: 0, taken: 0, encashed: 0, lapsed: 0, closing: 0 }
  );

  return (
    <ReportLayout
      title="Leave Utilization Report"
      description="Leave balance, accruals, taken, encashed, and lapsed by employee and leave type"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "leave-utilization", params }}
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
          <FilterField label="Leave Type">
            <FormControl>
              <Select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} sx={selectSx}>
                <MenuItem value="">All Types</MenuItem>
                {leaveTypes.map((lv) => (
                  <MenuItem key={lv.id} value={lv.id}>{lv.name}</MenuItem>
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
              {["S No", "Emp Code", "Name", "Department", "Leave Type", "Opening", "Accrued", "Taken", "Encashed", "Lapsed", "Closing Balance"].map(h => (
                <TableCell key={h} className="bg-gray-50 text-gray-600 font-semibold text-xs whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.employeeId}-${r.leaveType}`} hover sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{r.employeeCode}</TableCell>
                <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell>
                  <span className="text-violet-700">
                    {r.leaveType}
                  </span>
                </TableCell>
                <TableCell className="!text-center"><span className="text-gray-600">
                  {r.openingBalance}
                </span></TableCell>
                <TableCell className="!text-center"><span className="text-blue-600">
                  +{r.accrued}
                </span></TableCell>
                <TableCell className="!text-center !font-bold"><span className="text-red-500 ">
                  -{r.taken}
                </span></TableCell>
                <TableCell className="!text-center">
                  <span className="text-amber-600">{r.encashed > 0 ? `-${r.encashed}` : "-"}</span>
                </TableCell>
                <TableCell className="!text-center">
                  <span className="text-gray-400">{r.lapsed > 0 ? `-${r.lapsed}` : "="}</span>
                </TableCell>
                <TableCell className="!text-center">
                  <span className={`px-2 py-0.5 rounded-full font-bold
                    ${r.closingBalance > 5 ? "bg-green-100 text-green-700"
                      : r.closingBalance > 0 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"}`}>
                    {r.closingBalance}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {/* Totals row */}
            {rows.length > 0 && (
              <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                <TableCell colSpan={5} className="!font-bold text-gray-700 px-3 py-2">Totals</TableCell>
                <TableCell className="!text-center !font-bold text-gray-600">—</TableCell>
                <TableCell className="!text-center !font-bold"><span className="text-blue-700">+{totals.accrued}</span></TableCell>
                <TableCell className="!text-center !font-bold"><span className="text-red-600">-{totals.taken}</span></TableCell>
                <TableCell className="!text-center !font-bold">
                  <span className="text-amber-600">{totals.encashed > 0 ? `-${totals.encashed}` : "—"}</span>
                </TableCell>
                <TableCell className="!text-center !font-bold text-gray-400">
                  {totals.lapsed > 0 ? `-${totals.lapsed}` : "—"}
                </TableCell>
                <TableCell className="!text-center !font-bold text-gray-700">{totals.closing}</TableCell>
              </TableRow>
            )}
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
