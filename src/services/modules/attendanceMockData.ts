// /**
//  * ── ATTENDANCE MOCK DATA ─────────────────────────────────────────────────
//  * Single source of truth for every mock response used by attendanceService
//  * while the real backend endpoints are not ready.
//  *
//  * HOW TO REMOVE WHEN THE REAL API IS READY:
//  *   1. Set VITE_USE_MOCK_ATTENDANCE_SERVICE=false in .env (instantly switches
//  *      every attendanceService function back to calling the real API).
//  *   2. Once verified, delete this file and remove the `if (USE_MOCK_ATTENDANCE_SERVICE)`
//  *      guard blocks in attendance.ts (search for "USE_MOCK_ATTENDANCE_SERVICE").
//  * ───────────────────────────────────────────────────────────────────────
//  */
// import dayjs from "dayjs";
// import type {
//   AttendanceStatus,
//   AttendanceRecord,
//   CorrectionRequest,
//   CorrectionStatus,
//   AttendanceSummary,
//   DailyTrend,
//   DepartmentWiseSummary,
//   MusterRow,
//   MusterData,
//   EmployeeAttendanceInfo,
//   FinalisedPeriod,
//   FinalisationStatus,
//   ProcessResult,
//   MonthlySummaryRow,
//   LateArrivalRow,
//   OvertimeRow,
//   AbsenteeismRow,
//   IrregularPunchRow,
//   DepartmentWiseRow,
//   EmployeeHistoryRow,
//   LeaveUtilizationRow,
// } from "./attendance";

// // ── Generic helpers ──────────────────────────────────────────────────────

// export function mockResponse<T>(data: T, message = "Success") {
//   return {
//     success: true,
//     message,
//     data,
//     timestamp: new Date().toISOString(),
//   };
// }

// export function paginate<T>(items: T[], page = 0, size = 20) {
//   const start = page * size;
//   const content = items.slice(start, start + size);
//   return {
//     content,
//     totalElements: items.length,
//     totalPages: Math.ceil(items.length / size) || 1,
//     page,
//     size,
//   };
// }

// function asBlob(text: string) {
//   return new Blob([text], { type: "text/plain" });
// }

// // ── Employee roster (shared across all mocks) ───────────────────────────

// interface MockEmployee {
//   id: string;
//   code: string;
//   name: string;
//   department: string;
//   designation: string;
//   shiftCode: string;
//   shiftStart: string;
//   shiftEnd: string;
// }

// export const MOCK_EMPLOYEES: MockEmployee[] = [
//   { id: "emp-1", code: "EMP001", name: "Arun Kumar",    department: "Engineering", designation: "Software Engineer", shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-2", code: "EMP002", name: "Priya Sharma",  department: "Engineering", designation: "Senior Engineer",   shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-3", code: "EMP003", name: "Rahul Verma",   department: "Sales",       designation: "Sales Executive",   shiftCode: "EARLY", shiftStart: "08:00", shiftEnd: "17:00" },
//   { id: "emp-4", code: "EMP004", name: "Sneha Iyer",    department: "Sales",       designation: "Sales Manager",     shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-5", code: "EMP005", name: "Vikram Singh",  department: "HR",          designation: "HR Executive",      shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-6", code: "EMP006", name: "Anjali Nair",   department: "HR",          designation: "HR Manager",        shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-7", code: "EMP007", name: "Karthik Raj",   department: "Finance",     designation: "Accountant",        shiftCode: "GEN",   shiftStart: "09:00", shiftEnd: "18:00" },
//   { id: "emp-8", code: "EMP008", name: "Divya Menon",   department: "Finance",     designation: "Finance Manager",   shiftCode: "LATE",  shiftStart: "11:00", shiftEnd: "20:00" },
// ];

// const today = () => dayjs().format("YYYY-MM-DD");

// // Deterministic status pattern so the same employee/day always shows the same thing
// const STATUS_CYCLE: AttendanceStatus[] = ["present", "present", "late", "present", "absent", "present", "on_duty"];
// function statusFor(empIndex: number, dayIndex: number): AttendanceStatus {
//   return STATUS_CYCLE[(empIndex + dayIndex) % STATUS_CYCLE.length];
// }

// function punchTimesFor(emp: MockEmployee, status: AttendanceStatus, dateStr: string) {
//   if (["absent", "leave", "holiday", "weekly_off"].includes(status)) {
//     return { checkInTime: null as string | null, checkOutTime: null as string | null };
//   }
//   const lateMin = status === "late" ? 25 : 0;
//   const checkIn = dayjs(`${dateStr} ${emp.shiftStart}`).add(lateMin, "minute").toISOString();
//   const checkOut = dayjs(`${dateStr} ${emp.shiftEnd}`).add(status === "on_duty" ? -60 : 10, "minute").toISOString();
//   return { checkInTime: checkIn, checkOutTime: checkOut };
// }

// // ── Daily Register / Today summary / Holidays ───────────────────────────

// // Mutable so checkIn()/checkOut() mocks can reflect live edits during testing
// const registerOverrides = new Map<string, { checkInTime?: string | null; checkOutTime?: string | null; status?: AttendanceStatus }>();

// export function getMockRegister(params?: {
//   date?: string; departmentId?: string; branchId?: string; status?: string; page?: number; size?: number;
// }) {
//   const dateStr = params?.date ?? today();
//   const d = dayjs(dateStr);
//   const isWeeklyOff = d.day() === 0;

//   let rows = MOCK_EMPLOYEES.map((emp, i) => {
//     const key = `${emp.id}_${dateStr}`;
//     const baseStatus: AttendanceStatus = isWeeklyOff ? "weekly_off" : statusFor(i, d.date());
//     const override = registerOverrides.get(key);
//     const status = override?.status ?? baseStatus;
//     const punches = punchTimesFor(emp, status, dateStr);

//     return {
//       employeeId: emp.id,
//       employeeName: emp.name,
//       employeeCode: emp.code,
//       department: emp.department,
//       designation: emp.designation,
//       shiftCode: emp.shiftCode,
//       shiftStart: dayjs(`${dateStr} ${emp.shiftStart}`).toISOString(),
//       shiftEnd: dayjs(`${dateStr} ${emp.shiftEnd}`).toISOString(),
//       checkInTime: override?.checkInTime !== undefined ? override.checkInTime : punches.checkInTime,
//       checkOutTime: override?.checkOutTime !== undefined ? override.checkOutTime : punches.checkOutTime,
//       status,
//       workedMinutes: status === "present" || status === "late" ? 480 : 0,
//       lateMinutes: status === "late" ? 25 : 0,
//     };
//   });

//   if (params?.departmentId) rows = rows.filter(r => r.department === params.departmentId);
//   if (params?.status) rows = rows.filter(r => r.status === params.status);

//   return paginate(rows, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockToday(params?: { date?: string }) {
//   const { content } = getMockRegister({ date: params?.date, size: 1000 });
//   const present = content.filter(r => ["present", "checked_in", "checked_out"].includes(r.status)).length;
//   const late = content.filter(r => r.status === "late").length;
//   const absent = content.filter(r => r.status === "absent").length;
//   const onLeave = content.filter(r => r.status === "leave").length;
//   const onDuty = content.filter(r => r.status === "on_duty").length;
//   const checkedIn = content.filter(r => r.checkInTime).length;

//   return {
//     date: params?.date ?? today(),
//     totalEmployees: content.length,
//     present,
//     absent,
//     late,
//     onLeave,
//     onDuty,
//     checkedIn,
//     notYetIn: content.length - checkedIn,
//     attendancePercentage: content.length ? Math.round(((present + late + onDuty) / content.length) * 1000) / 10 : 0,
//   };
// }

// export function getMockHolidays(params?: { year?: number; month?: number }) {
//   const year = params?.year ?? dayjs().year();
//   return [
//     { date: `${year}-01-26`, name: "Republic Day", type: "National" },
//     { date: `${year}-03-29`, name: "Holi", type: "Festival" },
//     { date: `${year}-08-15`, name: "Independence Day", type: "National" },
//     { date: `${year}-10-02`, name: "Gandhi Jayanti", type: "National" },
//     { date: `${year}-11-01`, name: "Diwali", type: "Festival" },
//     { date: `${year}-12-25`, name: "Christmas", type: "Festival" },
//   ];
// }

// // ── Check-in / Check-out / Daily Status / Bulk Process (mutations) ──────

// export function mockCheckIn(payload: { employeeId: string; checkInTime: string }) {
//   const key = `${payload.employeeId}_${dayjs(payload.checkInTime).format("YYYY-MM-DD")}`;
//   registerOverrides.set(key, { ...registerOverrides.get(key), checkInTime: payload.checkInTime, status: "checked_in" });
//   return { employeeId: payload.employeeId, checkInTime: payload.checkInTime, status: "checked_in" as AttendanceStatus };
// }

// export function mockCheckOut(payload: { employeeId: string; checkOutTime: string }) {
//   const key = `${payload.employeeId}_${dayjs(payload.checkOutTime).format("YYYY-MM-DD")}`;
//   registerOverrides.set(key, { ...registerOverrides.get(key), checkOutTime: payload.checkOutTime, status: "checked_out" });
//   return { employeeId: payload.employeeId, checkOutTime: payload.checkOutTime, status: "checked_out" as AttendanceStatus };
// }

// export function postMockDailyStatus(payload: { processDate: string; employeeIds: string[] }) {
//   return {
//     processDate: payload.processDate,
//     totalEmployees: payload.employeeIds.length,
//     employees: payload.employeeIds.map(id => {
//       const emp = MOCK_EMPLOYEES.find(e => e.id === id);
//       return {
//         employeeId: id,
//         employeeName: emp?.name ?? "Unknown",
//         employeeCode: emp?.code ?? "—",
//         status: "present" as AttendanceStatus,
//         checkInTime: dayjs(`${payload.processDate} ${emp?.shiftStart ?? "09:00"}`).toISOString(),
//         checkOutTime: dayjs(`${payload.processDate} ${emp?.shiftEnd ?? "18:00"}`).toISOString(),
//         shiftCode: emp?.shiftCode ?? "GEN",
//       };
//     }),
//   };
// }

// export function postMockProcessResult(payload: { fromDate: string; toDate: string; employeeIds?: string[] }): ProcessResult {
//   const targets = payload.employeeIds?.length
//     ? MOCK_EMPLOYEES.filter(e => payload.employeeIds!.includes(e.id))
//     : MOCK_EMPLOYEES;

//   return {
//     processDate: payload.fromDate,
//     totalEmployees: targets.length,
//     processed: targets.length,
//     skipped: 0,
//     errors: 0,
//     employees: targets.map((emp, i) => {
//       const status = statusFor(i, dayjs(payload.fromDate).date());
//       const punches = punchTimesFor(emp, status, payload.fromDate);
//       return {
//         employeeId: emp.id,
//         employeeName: emp.name,
//         employeeCode: emp.code,
//         status,
//         checkInTime: punches.checkInTime ?? undefined,
//         checkOutTime: punches.checkOutTime ?? undefined,
//         shiftCode: emp.shiftCode,
//       };
//     }),
//   };
// }

// // ── Corrections (mutable store so approve/reject persists in-session) ───

// export const mockCorrectionsStore: CorrectionRequest[] = [
//   {
//     id: "corr-1",
//     employeeId: "emp-1",
//     employeeName: "Arun Kumar",
//     employeeCode: "EMP001",
//     attendanceDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
//     currentCheckIn: dayjs().subtract(2, "day").hour(9).minute(45).toISOString(),
//     currentCheckOut: dayjs().subtract(2, "day").hour(18).minute(0).toISOString(),
//     requestedCheckIn: dayjs().subtract(2, "day").hour(9).minute(0).toISOString(),
//     requestedCheckOut: dayjs().subtract(2, "day").hour(18).minute(0).toISOString(),
//     reason: "Biometric device did not register my actual check-in time.",
//     source: "employee_app",
//     status: "pending",
//     requestedBy: "emp-1",
//     createdAt: dayjs().subtract(1, "day").toISOString(),
//   },
//   {
//     id: "corr-2",
//     employeeId: "emp-3",
//     employeeName: "Rahul Verma",
//     employeeCode: "EMP003",
//     attendanceDate: dayjs().subtract(3, "day").format("YYYY-MM-DD"),
//     currentCheckIn: null,
//     currentCheckOut: dayjs().subtract(3, "day").hour(17).minute(10).toISOString(),
//     requestedCheckIn: dayjs().subtract(3, "day").hour(8).minute(5).toISOString(),
//     requestedCheckOut: dayjs().subtract(3, "day").hour(17).minute(10).toISOString(),
//     reason: "Was on field visit, missed punching in at office gate.",
//     source: "manual",
//     status: "approved",
//     requestedBy: "emp-3",
//     approverRemarks: "Verified with field visit log.",
//     approvedBy: "emp-4",
//     decidedAt: dayjs().subtract(2, "day").toISOString(),
//     createdAt: dayjs().subtract(3, "day").toISOString(),
//   },
//   {
//     id: "corr-3",
//     employeeId: "emp-6",
//     employeeName: "Anjali Nair",
//     employeeCode: "EMP006",
//     attendanceDate: dayjs().subtract(4, "day").format("YYYY-MM-DD"),
//     currentCheckIn: dayjs().subtract(4, "day").hour(9).minute(50).toISOString(),
//     currentCheckOut: dayjs().subtract(4, "day").hour(17).minute(20).toISOString(),
//     requestedCheckIn: dayjs().subtract(4, "day").hour(9).minute(0).toISOString(),
//     requestedCheckOut: dayjs().subtract(4, "day").hour(18).minute(0).toISOString(),
//     reason: "System logged wrong shift timing for that day.",
//     source: "employee_app",
//     status: "rejected",
//     requestedBy: "emp-6",
//     approverRemarks: "No supporting evidence of shift change provided.",
//     approvedBy: "emp-4",
//     decidedAt: dayjs().subtract(3, "day").toISOString(),
//     createdAt: dayjs().subtract(4, "day").toISOString(),
//   },
// ];

// export function getMockCorrections(params?: { status?: string; employeeId?: string; page?: number; limit?: number }) {
//   let rows = [...mockCorrectionsStore];
//   if (params?.status) rows = rows.filter(r => r.status === params.status);
//   if (params?.employeeId) rows = rows.filter(r => r.employeeId === params.employeeId);
//   return paginate(rows, params?.page ?? 0, params?.limit ?? 20);
// }

// export function getMockCorrectionById(id: string) {
//   return mockCorrectionsStore.find(c => c.id === id) ?? null;
// }

// export function postMockRequestCorrection(payload: Partial<CorrectionRequest> & { employeeId: string }) {
//   const emp = MOCK_EMPLOYEES.find(e => e.id === payload.employeeId);
//   const created: CorrectionRequest = {
//     id: `corr-${mockCorrectionsStore.length + 1}`,
//     employeeId: payload.employeeId,
//     employeeName: emp?.name ?? "Unknown",
//     employeeCode: emp?.code ?? "—",
//     attendanceDate: payload.attendanceDate ?? today(),
//     currentCheckIn: payload.currentCheckIn ?? null,
//     currentCheckOut: payload.currentCheckOut ?? null,
//     requestedCheckIn: payload.requestedCheckIn ?? "",
//     requestedCheckOut: payload.requestedCheckOut ?? "",
//     reason: payload.reason ?? "",
//     source: "employee_app",
//     status: "pending" as CorrectionStatus,
//     requestedBy: payload.employeeId,
//     createdAt: new Date().toISOString(),
//   };
//   mockCorrectionsStore.unshift(created);
//   return created;
// }

// export function postMockApproveCorrection(id: string, payload: { status: CorrectionStatus; approverRemarks: string; approvedBy: string }) {
//   const idx = mockCorrectionsStore.findIndex(c => c.id === id);
//   if (idx === -1) throw new Error("Correction not found");
//   mockCorrectionsStore[idx] = {
//     ...mockCorrectionsStore[idx],
//     status: payload.status,
//     approverRemarks: payload.approverRemarks,
//     approvedBy: payload.approvedBy,
//     decidedAt: new Date().toISOString(),
//   };
//   return mockCorrectionsStore[idx];
// }

// // ── Summary / Trends / Department-wise (Summary tab) ─────────────────────

// export function getMockSummary(params?: { date?: string }) {
//   const todaySummary = getMockToday({ date: params?.date });

//   const summary: AttendanceSummary = {
//     date: todaySummary.date,
//     totalEmployees: todaySummary.totalEmployees,
//     present: todaySummary.present,
//     absent: todaySummary.absent,
//     late: todaySummary.late,
//     earlyOut: 1,
//     onDuty: todaySummary.onDuty,
//     onLeave: todaySummary.onLeave,
//     permission: 0,
//     overtime: 2,
//     holiday: 0,
//     weeklyOff: dayjs(todaySummary.date).day() === 0 ? todaySummary.totalEmployees : 0,
//     halfDay: 0,
//     irregular: 0,
//     attendancePercentage: todaySummary.attendancePercentage,
//   };

//   const trends: DailyTrend[] = Array.from({ length: 7 }, (_, i) => {
//     const d = dayjs(todaySummary.date).subtract(6 - i, "day");
//     const { content } = getMockRegister({ date: d.format("YYYY-MM-DD"), size: 1000 });
//     return {
//       date: d.format("YYYY-MM-DD"),
//       present: content.filter(r => ["present", "checked_in", "checked_out", "late"].includes(r.status)).length,
//       absent: content.filter(r => r.status === "absent").length,
//       late: content.filter(r => r.status === "late").length,
//     };
//   });

//   const departments = Array.from(new Set(MOCK_EMPLOYEES.map(e => e.department)));
//   const departmentWise: DepartmentWiseSummary[] = departments.map(dept => {
//     const deptEmployees = MOCK_EMPLOYEES.filter(e => e.department === dept);
//     const { content } = getMockRegister({ date: todaySummary.date, departmentId: dept, size: 1000 });
//     const present = content.filter(r => ["present", "checked_in", "checked_out", "late", "on_duty"].includes(r.status)).length;
//     return {
//       department: dept,
//       total: deptEmployees.length,
//       present,
//       absent: deptEmployees.length - present,
//       attendancePercentage: deptEmployees.length ? Math.round((present / deptEmployees.length) * 1000) / 10 : 0,
//     };
//   });

//   return { summary, trends, departmentWise };
// }

// // ── Detailed records / Employee attendance history ──────────────────────

// function buildAttendanceRecords(fromDate: string, toDate: string, employeeFilter?: string): AttendanceRecord[] {
//   const start = dayjs(fromDate);
//   const end = dayjs(toDate);
//   const days = Math.max(end.diff(start, "day") + 1, 1);
//   const records: AttendanceRecord[] = [];

//   MOCK_EMPLOYEES.forEach((emp, ei) => {
//     if (employeeFilter && emp.id !== employeeFilter) return;
//     for (let i = 0; i < days; i++) {
//       const d = start.add(i, "day");
//       const dateStr = d.format("YYYY-MM-DD");
//       const status: AttendanceStatus = d.day() === 0 ? "weekly_off" : statusFor(ei, d.date());
//       const punches = punchTimesFor(emp, status, dateStr);
//       records.push({
//         id: `att-${emp.id}-${dateStr}`,
//         employeeId: emp.id,
//         employeeName: emp.name,
//         employeeCode: emp.code,
//         department: emp.department,
//         designation: emp.designation,
//         attendanceDate: dateStr,
//         checkInTime: punches.checkInTime,
//         checkOutTime: punches.checkOutTime,
//         shiftCode: emp.shiftCode,
//         shiftStart: emp.shiftStart,
//         shiftEnd: emp.shiftEnd,
//         status,
//         category: status === "on_duty" ? "on_duty" : status === "leave" ? "leave" : "regular",
//         workedMinutes: punches.checkInTime ? 480 : 0,
//         lateMinutes: status === "late" ? 25 : 0,
//         earlyOutMinutes: status === "on_duty" ? 60 : 0,
//         overtimeMinutes: ei % 3 === 0 && status === "present" ? 45 : 0,
//         checkInWithinGeofence: true,
//         checkOutWithinGeofence: true,
//         remarks: status === "absent" ? "No punch recorded" : undefined,
//       });
//     }
//   });

//   return records.sort((a, b) => (a.attendanceDate < b.attendanceDate ? 1 : -1));
// }

// export function getMockDetailed(params?: {
//   fromDate?: string; toDate?: string; departmentId?: string; status?: string; search?: string; page?: number; size?: number;
// }) {
//   const fromDate = params?.fromDate ?? dayjs().subtract(6, "day").format("YYYY-MM-DD");
//   const toDate = params?.toDate ?? today();
//   let rows = buildAttendanceRecords(fromDate, toDate, params?.search);
//   if (params?.departmentId) rows = rows.filter(r => r.department === params.departmentId);
//   if (params?.status) rows = rows.filter(r => r.status === params.status);
//   return paginate(rows, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockEmployeeAttendance(employeeId: string, params?: { fromDate?: string; toDate?: string }) {
//   const fromDate = params?.fromDate ?? dayjs().subtract(29, "day").format("YYYY-MM-DD");
//   const toDate = params?.toDate ?? today();
//   return buildAttendanceRecords(fromDate, toDate, employeeId);
// }

// // ── Muster / Monthly Register ─────────────────────────────────────────────

// export function getMockMuster(params: { month: number; year: number; departmentId?: string }): MusterData {
//   const daysInMonth = dayjs(`${params.year}-${params.month}-01`).daysInMonth();
//   const employees = MOCK_EMPLOYEES
//     .filter(e => !params.departmentId || e.department === params.departmentId)
//     .map((emp, ei): MusterRow => {
//       let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalLate = 0, totalOT = 0;
//       const attendance = Array.from({ length: daysInMonth }, (_, dayIdx) => {
//         const day = dayIdx + 1;
//         const dateStr = `${params.year}-${String(params.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//         const isWeeklyOff = dayjs(dateStr).day() === 0;
//         const status: AttendanceStatus = isWeeklyOff ? "weekly_off" : statusFor(ei, day);
//         const punches = punchTimesFor(emp, status, dateStr);

//         if (["present", "checked_in", "checked_out", "late", "on_duty"].includes(status)) totalPresent++;
//         if (status === "absent") totalAbsent++;
//         if (status === "leave") totalLeave++;
//         if (status === "late") totalLate++;
//         if (!isWeeklyOff && ei % 3 === 0 && status === "present") totalOT += 45;

//         return {
//           date: dateStr,
//           status,
//           checkIn: punches.checkInTime ? dayjs(punches.checkInTime).format("HH:mm") : undefined,
//           checkOut: punches.checkOutTime ? dayjs(punches.checkOutTime).format("HH:mm") : undefined,
//           workedMinutes: punches.checkInTime ? 480 : 0,
//         };
//       });

//       return {
//         employeeId: emp.id,
//         employeeName: emp.name,
//         employeeCode: emp.code,
//         department: emp.department,
//         designation: emp.designation,
//         attendance,
//         totalPresent,
//         totalAbsent,
//         totalLeave,
//         totalOT,
//         totalLate,
//         attendancePercentage: Math.round((totalPresent / (daysInMonth - 4)) * 1000) / 10,
//       };
//     });

//   const holidays = getMockHolidays({ year: params.year })
//     .filter(h => dayjs(h.date).month() + 1 === params.month)
//     .map(h => h.date);
//   const weeklyOffs = Array.from({ length: daysInMonth }, (_, i) => i + 1)
//     .map(day => `${params.year}-${String(params.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
//     .filter(dateStr => dayjs(dateStr).day() === 0);

//   return {
//     month: params.month,
//     year: params.year,
//     workingDays: daysInMonth - weeklyOffs.length - holidays.length,
//     holidays,
//     weeklyOffs,
//     employees,
//   };
// }

// export function getMockMonthlyRegister(params: { month: number; year: number; departmentId?: string }) {
//   const muster = getMockMuster(params);
//   return muster.employees.map(emp => ({
//     employeeId: emp.employeeId,
//     employeeCode: emp.employeeCode,
//     employeeName: emp.employeeName,
//     department: emp.department,
//     designation: emp.designation,
//     shiftCode: MOCK_EMPLOYEES.find(e => e.id === emp.employeeId)?.shiftCode ?? "GEN",
//     totalPresent: emp.totalPresent,
//     totalAbsent: emp.totalAbsent,
//     totalLate: emp.totalLate,
//     totalLeave: emp.totalLeave,
//     totalOnDuty: emp.attendance.filter(a => a.status === "on_duty").length,
//     totalHalfDay: emp.attendance.filter(a => a.status === "half_day").length,
//     totalOT: emp.totalOT,
//     attendancePercentage: emp.attendancePercentage,
//     status: emp.attendancePercentage >= 90 ? "present" : emp.attendancePercentage >= 75 ? "late" : "absent",
//   }));
// }

// // ── Attendance Info (Employee View) ──────────────────────────────────────

// export function getMockAttendanceInfo(employeeId: string): EmployeeAttendanceInfo | null {
//   const emp = MOCK_EMPLOYEES.find(e => e.id === employeeId);
//   if (!emp) return null;
//   const todayRow = getMockRegister({ date: today() }).content.find(r => r.employeeId === employeeId);
//   const pendingCorrections = mockCorrectionsStore.filter(c => c.employeeId === employeeId && c.status === "pending").length;

//   return {
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     designation: emp.designation,
//     shiftCode: emp.shiftCode,
//     shiftName: `${emp.shiftCode} Shift`,
//     shiftStart: emp.shiftStart,
//     shiftEnd: emp.shiftEnd,
//     weeklyOff: ["Sunday"],
//     todayStatus: todayRow?.status ?? "absent",
//     todayCheckIn: todayRow?.checkInTime ?? undefined,
//     todayCheckOut: todayRow?.checkOutTime ?? undefined,
//     workedMinutesToday: todayRow?.workedMinutes ?? 0,
//     pendingCorrections,
//     pendingLeaves: 0,
//   };
// }

// // ── Finalised periods (mutable store) ─────────────────────────────────────

// // export const mockFinalisedPeriodsStore: FinalisedPeriod[] = [
// //   {
// //     id: "period-1",
// //     month: dayjs().subtract(1, "month").month() + 1,
// //     year: dayjs().subtract(1, "month").year(),
// //     periodLabel: dayjs().subtract(1, "month").format("MMMM YYYY"),
// //     status: "locked",
// //     totalEmployees: MOCK_EMPLOYEES.length,
// //     totalPresentDays: 180,
// //     totalAbsentDays: 12,
// //     totalLeaveDays: 8,
// //     totalOTHours: 24,
// //     finalisedBy: "Anjali Nair",
// //     finalisedAt: dayjs().subtract(1, "month").endOf("month").toISOString(),
// //     createdAt: dayjs().subtract(1, "month").endOf("month").toISOString(),
// //   },
// // ];

// // export function getMockFinalisedPeriods(params?: { year?: number }) {
// //   const year = params?.year ?? dayjs().year();
// //   return mockFinalisedPeriodsStore.filter(p => p.year === year);
// // }

// export function postMockFinalise(payload: { month: number; year: number; remarks?: string }) {
//   const periodLabel = dayjs(`${payload.year}-${payload.month}-01`).format("MMMM YYYY");
//   const idx = mockFinalisedPeriodsStore.findIndex(p => p.month === payload.month && p.year === payload.year);
//   const entry: FinalisedPeriod = {
//     id: idx >= 0 ? mockFinalisedPeriodsStore[idx].id : `period-${mockFinalisedPeriodsStore.length + 1}`,
//     month: payload.month,
//     year: payload.year,
//     periodLabel,
//     status: "locked" as FinalisationStatus,
//     totalEmployees: MOCK_EMPLOYEES.length,
//     totalPresentDays: 182,
//     totalAbsentDays: 10,
//     totalLeaveDays: 6,
//     totalOTHours: 30,
//     finalisedBy: "Admin User",
//     finalisedAt: new Date().toISOString(),
//     createdAt: idx >= 0 ? mockFinalisedPeriodsStore[idx].createdAt : new Date().toISOString(),
//   };
//   if (idx >= 0) mockFinalisedPeriodsStore[idx] = entry;
//   else mockFinalisedPeriodsStore.push(entry);
//   return entry;
// }

// export function postMockUnlock(payload: { periodId: string }) {
//   const idx = mockFinalisedPeriodsStore.findIndex(p => p.id === payload.periodId);
//   if (idx === -1) throw new Error("Period not found");
//   mockFinalisedPeriodsStore[idx] = { ...mockFinalisedPeriodsStore[idx], status: "draft" };
//   return mockFinalisedPeriodsStore[idx];
// }

// // ── Reports ────────────────────────────────────────────────────────────

// export function getMockReportMonthlySummary(params?: { departmentId?: string; page?: number; size?: number }): { content: MonthlySummaryRow[]; totalElements: number; totalPages: number; page: number; size: number } {
//   let rows: MonthlySummaryRow[] = MOCK_EMPLOYEES.map((emp, i) => ({
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     designation: emp.designation,
//     presentDays: 22 - (i % 4),
//     absentDays: i % 4,
//     lateDays: i % 3,
//     earlyOutDays: i % 2,
//     halfDays: i === 2 ? 1 : 0,
//     leaveDays: i % 5,
//     onDutyDays: i % 3 === 0 ? 2 : 0,
//     permissionDays: i % 4 === 0 ? 1 : 0,
//     otHours: 4 + i * 1.5,
//     totalWorkedHours: 176 - i * 2,
//     attendancePercentage: 96 - i * 3.5,
//     lossOfPayDays: i % 4 === 3 ? 1 : 0,
//   }));
//   if (params?.departmentId) rows = rows.filter(r => MOCK_EMPLOYEES.find(e => e.id === r.employeeId)?.department === params.departmentId);
//   return paginate(rows, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockReportLateArrival(params?: { departmentId?: string; minLateMinutes?: number; page?: number; size?: number }) {
//   const rows: LateArrivalRow[] = MOCK_EMPLOYEES.filter((_, i) => i % 2 === 0).map((emp, i) => ({
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     attendanceDate: dayjs().subtract(i + 1, "day").format("YYYY-MM-DD"),
//     shiftCode: emp.shiftCode,
//     shiftStartTime: dayjs().subtract(i + 1, "day").hour(9).minute(0).toISOString(),
//     checkInTime: dayjs().subtract(i + 1, "day").hour(9).minute(20 + i * 10).toISOString(),
//     lateMinutes: 20 + i * 10,
//   }));
//   const filtered = rows.filter(r => (params?.minLateMinutes ?? 0) <= r.lateMinutes);
//   return paginate(filtered, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockReportOvertime(params?: { minOtMinutes?: number; page?: number; size?: number }) {
//   const rows: OvertimeRow[] = MOCK_EMPLOYEES.filter((_, i) => i % 3 === 0).map((emp, i) => ({
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     attendanceDate: dayjs().subtract(i + 1, "day").format("YYYY-MM-DD"),
//     shiftCode: emp.shiftCode,
//     shiftEndTime: dayjs().subtract(i + 1, "day").hour(18).minute(0).toISOString(),
//     checkOutTime: dayjs().subtract(i + 1, "day").hour(19).minute(30 + i * 10).toISOString(),
//     overtimeMinutes: 90 + i * 20,
//   }));
//   const filtered = rows.filter(r => (params?.minOtMinutes ?? 0) <= r.overtimeMinutes);
//   return paginate(filtered, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockReportAbsenteeism(params?: { minAbsentDays?: number; page?: number; size?: number }) {
//   const rows: AbsenteeismRow[] = MOCK_EMPLOYEES.map((emp, i) => ({
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     totalWorkingDays: 22,
//     presentDays: 22 - (i % 5),
//     absentDays: i % 5,
//     leaveDays: i % 3,
//     lopDays: i % 5 > 2 ? 1 : 0,
//     absenteeismRate: ((i % 5) / 22) * 100,
//     consecutiveAbsences: i % 5 >= 3 ? 3 : i % 5,
//     absentDates: Array.from({ length: i % 5 }, (_, d) => dayjs().subtract(d + 1, "day").format("YYYY-MM-DD")),
//   }));
//   const filtered = rows.filter(r => r.absentDays >= (params?.minAbsentDays ?? 0));
//   return paginate(filtered, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockReportIrregularPunch(params?: { page?: number; size?: number }) {
//   const patterns: Array<"check_in" | "check_out" | "both"> = ["check_in", "check_out", "both"];
//   const rows: IrregularPunchRow[] = MOCK_EMPLOYEES.filter((_, i) => i % 2 === 1).map((emp, i) => ({
//     employeeId: emp.id,
//     employeeName: emp.name,
//     employeeCode: emp.code,
//     department: emp.department,
//     attendanceDate: dayjs().subtract(i + 1, "day").format("YYYY-MM-DD"),
//     checkInTime: patterns[i % 3] === "check_in" || patterns[i % 3] === "both" ? null : dayjs().subtract(i + 1, "day").hour(9).toISOString(),
//     checkOutTime: patterns[i % 3] === "check_out" || patterns[i % 3] === "both" ? null : dayjs().subtract(i + 1, "day").hour(18).toISOString(),
//     missingPunch: patterns[i % 3],
//     shiftCode: emp.shiftCode,
//   }));
//   return paginate(rows, params?.page ?? 0, params?.size ?? 20);
// }

// export function getMockReportDepartmentWise(): DepartmentWiseRow[] {
//   const departments = Array.from(new Set(MOCK_EMPLOYEES.map(e => e.department)));
//   return departments.map((dept, i) => {
//     const count = MOCK_EMPLOYEES.filter(e => e.department === dept).length;
//     return {
//       department: dept,
//       totalEmployees: count,
//       totalWorkingDays: 22,
//       totalPresentDays: count * (20 - i),
//       totalAbsentDays: count * (i + 1),
//       totalLateDays: count * i,
//       totalOtHours: 10 + i * 5,
//       averageAttendance: 95 - i * 4,
//     };
//   });
// }

// export function getMockReportEmployeeHistory(params: { employeeId: string; fromDate: string; toDate: string; page?: number; size?: number }) {
//   const records = buildAttendanceRecords(params.fromDate, params.toDate, params.employeeId);
//   const rows: EmployeeHistoryRow[] = records.map(r => ({
//     attendanceDate: r.attendanceDate,
//     dayOfWeek: dayjs(r.attendanceDate).format("ddd"),
//     checkInTime: r.checkInTime,
//     checkOutTime: r.checkOutTime,
//     shiftCode: r.shiftCode,
//     status: r.status,
//     workedMinutes: r.workedMinutes,
//     lateMinutes: r.lateMinutes,
//     earlyOutMinutes: r.earlyOutMinutes,
//     overtimeMinutes: r.overtimeMinutes,
//     remarks: r.remarks,
//   }));
//   return paginate(rows, params.page ?? 0, params.size ?? 31);
// }

// export function getMockReportLeaveUtilization(params?: { leaveTypeId?: string; departmentId?: string; page?: number; size?: number }) {
//   const leaveTypes = ["Earned Leave", "Sick Leave", "Casual Leave"];
//   const rows: LeaveUtilizationRow[] = MOCK_EMPLOYEES.flatMap((emp, i) =>
//     leaveTypes.map((lt, li) => ({
//       employeeId: emp.id,
//       employeeName: emp.name,
//       employeeCode: emp.code,
//       department: emp.department,
//       leaveType: lt,
//       openingBalance: 12 - li * 2,
//       accrued: 1,
//       taken: (i + li) % 4,
//       encashed: li === 0 && i % 4 === 0 ? 1 : 0,
//       lapsed: li === 2 && i % 5 === 0 ? 1 : 0,
//       closingBalance: 12 - li * 2 - ((i + li) % 4),
//     }))
//   );
//   let filtered = rows;
//   if (params?.departmentId) filtered = filtered.filter(r => MOCK_EMPLOYEES.find(e => e.id === r.employeeId)?.department === params.departmentId);
//   return paginate(filtered, params?.page ?? 0, params?.size ?? 20);
// }

// export function mockExportReport(type: string, format: string) {
//   return asBlob(`Mock export for report "${type}" in ${format} format.\nGenerated at ${new Date().toISOString()}`);
// }
