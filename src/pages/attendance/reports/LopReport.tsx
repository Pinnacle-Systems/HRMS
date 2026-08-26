import { useState, useEffect } from "react";
import {
  FormControl,
  MenuItem,
  Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { attendanceService } from "../../../services/modules/attendance";
// import { GlobalPagination } from "../../../components/GlobalPagination";
import { ReportLayout, FilterField } from "./ReportLayout";
import { useUI } from "../../../context/Snackbar";
import { departmentService } from "../../../services/modules/department";
import type { Department } from "../../employees/type";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../../const";
import { getRowColor } from "../../const";
import type { LopSummaryRow } from "../../../services/modules/attendanceTypes";

interface Props { onBack: () => void }

export function LopReport({ onBack }: Props) {
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

  const [rows, setRows] = useState<LopSummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, _setLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  // Running totals
  const totalEmployees = rows.length;
  const totalLopDays = rows.reduce((s, r) => s + (r.lopDays || 0), 0);
  const totalWorkingDays = rows.reduce((s, r) => s + (r.workingDays || 0), 0);
  const employeesWithLop = rows.filter(r => r.lopDays > 0).length;

  const params = { startDate: fromDate, endDate: toDate, departmentId: departmentId || undefined };

  async function generate(p = page, l = limit) {
    setGenerating(true);
    try {
      const res: any = await attendanceService.getReportLop({ 
        ...params, 
        page: p - 1, 
        size: l 
      });
      const data = res?.data?.employees ?? res?.data;
      setRows(Array.isArray(data) ? data : data?.content ?? []);
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch (error) {
      console.error('Error generating LOP report:', error);
      showSnackbar("Failed to generate LOP report", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Effect to load initial data
  useEffect(() => {
    generate(1, limit);
  }, [fromDate, toDate, departmentId]);

  return (
    <ReportLayout
      title="Loss of Pay (LOP) Report"
      description="Employee-wise loss of pay days summary with LOP dates list"
      onBack={onBack}
      onGenerate={() => { setPage(1); generate(1, limit); }}
      generating={generating}
      hasData={rows.length > 0}
      totalRecords={total}
      exportConfig={{ reportType: "lop", params }}
      filterPanel={
        <>
          <FilterField label="From Date">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={fromDate ? dayjs(fromDate) : null}
                onChange={(newValue) => { 
                  setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); 
                }}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </FilterField>
          <FilterField label="To Date">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={toDate ? dayjs(toDate) : null}
                onChange={(newValue) => { 
                  setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""); 
                }}
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </FilterField>
          <FilterField label="Department">
            <FormControl className="!w-[250px]">
              <Select 
                value={departmentId} 
                onChange={e => setDepartmentId(e.target.value)} 
                sx={selectSx}
              >
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
      {/* LOP Summary Banner */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-6 p-3 bg-red-50 border-b border-gray-200">
          <div className="text-[12px]">
            <span className="text-gray-500">Total Employees: </span>
            <span className="font-bold text-gray-800">{totalEmployees}</span>
          </div>
          <div className="text-[12px]">
            <span className="text-gray-500">Total Working Days: </span>
            <span className="font-bold text-gray-800">{totalWorkingDays}</span>
          </div>
          <div className="text-[12px]">
            <span className="text-gray-500">Total LOP Days: </span>
            <span className="font-bold text-red-600">{totalLopDays}</span>
          </div>
          <div className="text-[12px]">
            <span className="text-gray-500">Employees with LOP: </span>
            <span className="font-bold text-red-600">{employeesWithLop}</span>
          </div>
          <div className="text-[12px]">
            <span className="text-gray-500">Avg LOP per Employee: </span>
            <span className="font-semibold text-red-600">
              {totalEmployees > 0 ? (totalLopDays / totalEmployees).toFixed(1) : 0}
            </span>
          </div>
        </div>
      )}

      <TableContainer className="max-h-[calc(100vh-425px)]">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["S No", "Emp Code", "Employee Name", "Department", 
                "Working Days", "Present Days", "LOP Days", 
                "LOP Dates", "Attendance %"].map(h => (
                <TableCell key={h} className="!font-bold whitespace-nowrap">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => {
              const attendancePercentage = r.workingDays > 0 
                ? ((r.presentDays / r.workingDays) * 100) 
                : 0;
              
              return (
                <TableRow 
                  key={r.employeeId} 
                  sx={getRowColor(i)}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{r.employeeCode}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.employeeName}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className="text-center">{r.workingDays}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">
                    <span className="text-green-700 bg-green-200 px-2 font-semibold py-0.5 rounded-full">{r.presentDays}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded-full font-semibold
                      ${r.lopDays >= 5 ? "bg-red-200 text-red-700" : 
                        r.lopDays >= 3 ? "bg-amber-200 text-amber-700" : 
                        r.lopDays > 0 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-green-100 text-green-700"}`}
                    >
                      {r.lopDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {r.lopDates && r.lopDates.length > 0 ? (
                        r.lopDates.map((date, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded whitespace-nowrap"
                          >
                            {dayjs(date).format("DD MMM")}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No LOP days</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${attendancePercentage >= 90 ? "bg-green-100 text-green-700" : 
                        attendancePercentage >= 75 ? "bg-amber-100 text-amber-700" : 
                        "bg-red-100 text-red-700"}`}
                    >
                      {attendancePercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* <GlobalPagination
        total={total} 
        page={page} 
        limit={limit}
        onPageChange={p => { setPage(p); generate(p, limit); }}
        onLimitChange={l => { setLimit(l); setPage(1); generate(1, l); }}
      /> */}
    </ReportLayout>
  );
}