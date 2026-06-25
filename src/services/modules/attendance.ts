import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
// import * as Mock from "./attendanceMockData";

/**
 * ── MOCK MODE ────────────────────────────────────────────────────────────
 * Set VITE_USE_MOCK_ATTENDANCE_SERVICE=true in .env to serve every
 * attendanceService call from in-memory mock data (see attendanceMockData.ts)
 * instead of hitting the real backend. Flip it to false the moment the real
 * endpoints are ready — no other code changes are needed.
 *
 * To permanently remove mocking later: set the flag to false, verify the app
 * end-to-end, then delete attendanceMockData.ts and strip the
 * `if (USE_MOCK_ATTENDANCE_SERVICE) { ... }` blocks below.
 * ────────────────────────────────────────────────────────────────────────
 */
export const USE_MOCK_ATTENDANCE_SERVICE =
  import.meta.env.VITE_USE_MOCK_ATTENDANCE_SERVICE === "true";

// ── Enums ──────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | "checked_in"
  | "checked_out"
  | "absent"
  | "present"
  | "late"
  | "half_day"
  | "on_duty"
  | "leave"
  | "permission"
  | "holiday"
  | "weekly_off"
  | "irregular";

export type AttendanceCategory = "regular" | "irregular" | "on_duty" | "leave";

export type CorrectionStatus = "pending" | "approved" | "rejected";

export type FinalisationStatus = "draft" | "pending_approval" | "approved" | "locked";

// ── Core Models ────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department?: string;
  designation?: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  shiftCode: string;
  shiftStart?: string;
  shiftEnd?: string;
  status: AttendanceStatus;
  category?: AttendanceCategory;
  workedMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  checkInWithinGeofence: boolean;
  checkOutWithinGeofence: boolean;
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
  remarks?: string;
  processedBy?: string;
  processedAt?: string;
  finalised?: boolean;
  finalisedBy?: string;
  finalisedAt?: string;
}

export interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  attendanceDate: string;
  currentCheckIn: string | null;
  currentCheckOut: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  supportingDocument?: string;
  source?: string;
  status: CorrectionStatus;
  requestedBy: string;
  approverRemarks?: string;
  approvedBy?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  earlyOut: number;
  onDuty: number;
  onLeave: number;
  permission: number;
  overtime: number;
  holiday: number;
  weeklyOff: number;
  halfDay: number;
  irregular: number;
  attendancePercentage: number;
}

export interface DailyTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface DepartmentWiseSummary {
  department: string;
  total: number;
  present: number;
  absent: number;
  attendancePercentage: number;
}

export interface MusterCell {
  date: string;
  status: AttendanceStatus | null;
  checkIn?: string;
  checkOut?: string;
  workedMinutes?: number;
}

export interface MusterRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  attendance: MusterCell[];
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalOT: number;
  totalLate: number;
  attendancePercentage: number;
}

export interface MusterData {
  month: number;
  year: number;
  workingDays: number;
  holidays: string[];
  weeklyOffs: string[];
  employees: MusterRow[];
}

export interface EmployeeAttendanceInfo {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftCode: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  weeklyOff: string[];
  todayStatus: AttendanceStatus;
  todayCheckIn?: string;
  todayCheckOut?: string;
  workedMinutesToday: number;
  pendingCorrections: number;
  pendingLeaves: number;
}

export interface FinalisedPeriod {
  id: string;
  month: number;
  year: number;
  periodLabel: string;
  status: FinalisationStatus;
  totalEmployees: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  totalOTHours: number;
  finalisedBy?: string;
  finalisedAt?: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

export interface ProcessResult {
  processDate: string;
  totalEmployees: number;
  processed: number;
  skipped: number;
  errors: number;
  employees: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    shiftCode: string;
  }[];
}

export interface DailyStatusEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  status: AttendanceStatus;
  checkInTime: string;
  checkOutTime: string;
  shiftCode: string;
}

export interface DailyStatusData {
  processDate: string;
  totalEmployees: number;
  employees: DailyStatusEmployee[];
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface DailyStatusPayload {
  processDate: string;
  employeeIds: string[];
}

export interface CorrectionApprovePayload {
  status: CorrectionStatus;
  approverRemarks: string;
  approvedBy: string;
}

export interface CorrectionRequestPayload {
  employeeId: string;
  attendanceDate: string;
  currentCheckIn: string | null;
  currentCheckOut: string | null;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  supportingDocument?: string;
}

export interface CheckInPayload {
  employeeId: string;
  checkInTime: string;
  reason?: string;
  markedBy?: string;
  remarks?: string;
}

export interface CheckOutPayload {
  employeeId: string;
  checkOutTime: string;
  reason?: string;
  markedBy?: string;
  remarks?: string;
}

export interface ProcessAttendancePayload {
  fromDate: string;
  toDate: string;
  employeeIds?: string[];
  departmentId?: string;
  reprocess?: boolean;
}

export interface BulkProcessPayload {
  processDate: string;
  employeeIds: string[];
  reprocess?: boolean;
}

export interface FinalisePayload {
  month: number;
  year: number;
  remarks?: string;
  approvedBy?: string;
  status?: string;
}

export interface UnlockPayload {
  periodId: string;
  reason: string;
  unlockedBy: string;
}
export interface LockPayload {
  startDate: string,
  endDate: string,
  reason: string;
  lockedBy: string;
}

// ── Query Params ───────────────────────────────────────────────────────────

export interface AttendanceDetailedQuery {
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  shiftCode?: string;
  status?: AttendanceStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface MusterQuery {
  month: number;
  year: number;
  departmentId?: string;
  branchId?: string;
}

export interface SummaryQuery {
  date?: string;
  departmentId?: string;
  branchId?: string;
}

// ── Report Models ──────────────────────────────────────────────────────────

export interface MonthlySummaryRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyOutDays: number;
  halfDays: number;
  leaveDays: number;
  onDutyDays: number;
  permissionDays: number;
  otHours: number;
  totalWorkedHours: number;
  attendancePercentage: number;
  lossOfPayDays: number;
}

export interface LateArrivalRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  attendanceDate: string;
  shiftCode: string;
  shiftStartTime: string;
  checkInTime: string;
  lateMinutes: number;
}

export interface OvertimeRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  attendanceDate: string;
  shiftCode: string;
  shiftEndTime: string;
  checkOutTime: string;
  overtimeMinutes: number;
}

export interface AbsenteeismRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lopDays: number;
  absenteeismRate: number;
  consecutiveAbsences: number;
  absentDates: string[];
}

export interface IrregularPunchRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  missingPunch: "check_in" | "check_out" | "both";
  shiftCode: string;
}

export interface DepartmentWiseRow {
  department: string;
  totalEmployees: number;
  totalWorkingDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLateDays: number;
  totalOtHours: number;
  averageAttendance: number;
}

export interface EmployeeHistoryRow {
  attendanceDate: string;
  dayOfWeek: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  shiftCode: string;
  status: AttendanceStatus;
  workedMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  remarks?: string;
}

export interface LeaveUtilizationRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  openingBalance: number;
  accrued: number;
  taken: number;
  encashed: number;
  lapsed: number;
  closingBalance: number;
}

// ── Report Query Params ────────────────────────────────────────────────────

export interface MonthYearQuery { month: number; year: number; departmentId?: string; branchId?: string; }
export interface DateRangeQuery { fromDate: string; toDate: string; departmentId?: string; branchId?: string; page?: number; size?: number; }
export interface LateArrivalQuery extends DateRangeQuery { minLateMinutes?: number; }
export interface OvertimeQuery extends DateRangeQuery { minOtMinutes?: number; }
export interface AbsenteeismQuery extends MonthYearQuery { minAbsentDays?: number; }
export interface EmployeeHistoryQuery { employeeId: string; fromDate: string; toDate: string; page?: number; size?: number; }
export interface LeaveUtilizationQuery extends MonthYearQuery { leaveTypeId?: string; }

// ── Service ────────────────────────────────────────────────────────────────

export const attendanceService = {
  // ── GET ──
  async getToday(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockToday(params), "Today's attendance loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_TODAY, { params });
  },

  async getSummary(params?: SummaryQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockSummary(params), "Summary loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_SUMMARY, { params });
  },

  async getDetailed(params?: AttendanceDetailedQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockDetailed(params), "Attendance records loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_DETAILED, { params });
  },

  async getEmployeeAttendance(employeeId: string, params?: { fromDate?: string; toDate?: string }) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockEmployeeAttendance(employeeId, params), "Employee attendance loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_EMPLOYEE_ATTENDANCE(employeeId), { params });
  },

  async getRegister(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockRegister(params), "Daily register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_REGISTER, { params });
  },

  async getMuster(params: MusterQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockMuster(params), "Muster register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_MUSTER, { params });
  },

  async getMonthlyRegister(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockMonthlyRegister(params as any), "Monthly register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_MONTHLY_REGISTER, { params });
  },

  async getAttendanceInfo(employeeId: string) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockAttendanceInfo(employeeId), "Attendance info loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_ATTENDANCE_INFO(employeeId));
  },

  async getHolidays(params?: { year?: number; month?: number }) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockHolidays(params), "Holidays loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_HOLIDAYS, { params });
  },

  async getCorrections(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockCorrections(params), "Correction requests loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_CORRECTIONS, { params });
  },

  async getCorrectionById(id: string) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockCorrectionById(id), "Correction request loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_CORRECTIONS_BYID(id));
  },

  async getFinalisedPeriods(params?: { year?: number }) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockFinalisedPeriods(params), "Finalised periods loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_FINALISED, { params });
  },

  // ── POST ──
  async postDailyStatus(payload: DailyStatusPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockDailyStatus(payload), "Daily status posted");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_DAILY_STATUS, payload);
  },

  async checkIn(payload: CheckInPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.mockCheckIn(payload), "Check-in recorded");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CHECKIN, payload);
  },

  async checkOut(payload: CheckOutPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.mockCheckOut(payload), "Check-out recorded");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CHECKOUT, payload);
  },

  async requestCorrection(payload: CorrectionRequestPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockRequestCorrection(payload), "Correction request submitted");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CORRECTION_REQ, payload);
  },

  async approveCorrection(id: string, payload: CorrectionApprovePayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockApproveCorrection(id, payload), "Correction request updated");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CORRECTION_APPROVE(id), payload);
  },

  async processAttendance(payload: ProcessAttendancePayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockProcessResult(payload), "Attendance processed");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_PROCESS, payload);
  },

  async bulkProcess(payload: BulkProcessPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(
    //     Mock.postMockProcessResult({ fromDate: payload.processDate, toDate: payload.processDate, employeeIds: payload.employeeIds }),
    //     "Bulk attendance processed"
    //   );
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_BULK_PROCESS, payload);
  },

  async finalise(payload: FinalisePayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockFinalise(payload), "Period finalised");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_FINALISE, payload);
  },

  async unlock(payload: UnlockPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockUnlock(payload), "Period unlocked");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_UNLOCK, payload);
  },

   async lock(payload: LockPayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_LOCK, payload);
  },

   async getAllLocks() {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_LOCKS);
  },

  // ── Reports ──
  async getReportMonthlySummary(params: MonthYearQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportMonthlySummary(params as any), "Monthly summary report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_MONTHLY_SUMMARY, { params });
  },

  async getReportLateArrival(params: LateArrivalQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportLateArrival(params as any), "Late arrival report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_LATE_ARRIVAL, { params });
  },

  async getReportOvertime(params: OvertimeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportOvertime(params as any), "Overtime report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_OVERTIME, { params });
  },

  async getReportAbsenteeism(params: AbsenteeismQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportAbsenteeism(params as any), "Absenteeism report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_ABSENTEEISM, { params });
  },

  async getReportIrregularPunch(params: DateRangeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportIrregularPunch(params as any), "Irregular punch report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_IRREGULAR_PUNCH, { params });
  },

  async getReportDepartmentWise(params: DateRangeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportDepartmentWise(), "Department-wise report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_DEPARTMENT_WISE, { params });
  },

  async getReportEmployeeHistory(params: EmployeeHistoryQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportEmployeeHistory(params), "Employee history report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_EMPLOYEE_HISTORY, { params });
  },

  async getReportLeaveUtilization(params: LeaveUtilizationQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportLeaveUtilization(params as any), "Leave utilization report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_LEAVE_UTILIZATION, { params });
  },

  async exportReport(type: string, format: "excel" | "pdf" | "csv", params: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return { data: Mock.mockExportReport(type, format) };
    // }
    return apiService.get<{ success: boolean; message: string; data: { fileUrl: string } }>(
      API_ENDPOINTS.ATTENDANCE.REPORT_EXPORT(type, format),
      { params }
    );
  },
};
