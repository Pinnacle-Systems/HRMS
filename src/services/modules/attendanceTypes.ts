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
  | "missed_punch"
  | "missed_out"
  | "irregular";

export type AttendanceCategory = "regular" | "irregular" | "on_duty" | "leave";

export type CorrectionStatus = "pending" | "approved" | "rejected";

export type FinalisationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "locked";

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
  // status: AttendanceStatus | null;
  checkIn?: string;
  checkOut?: string;
  workedMinutes?: number;
  firstHalf: AttendanceStatus | null;
  secondHalf: AttendanceStatus | null;
  shiftCode: string;
  shiftEnd: string;
  shiftStart: string;
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
  totalMissedOut: number;
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
  skippedCount: number;
  errors: number;
  locked: boolean;
  message: string;
  employees: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    shiftCode: string;
  }[];
  skippedEmployees: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    reason: string;
  }[];
  summary: {
    employeesProcessed: number,
    employeesSkipped: number,
    recordsCalculated: number,
    present: number,
    absent: number,
    leave: number,
    weeklyOff: number,
    holidays: number,
    late: number,
    earlyOut: number,
    missedPunches: number,
    overtimeHours: number,
    errors: number
}
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

export type WorkerType = 'Staff' | 'Labour' | 'Both';

export interface ProcessAttendancePayload {
  fromDate: string;
  toDate: string;
  employeeIds?: string[];
  departmentId?: string;
  reprocess?: boolean;
  workerType?: WorkerType;
  lockReason?: string;
  lockedBy?: string;
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
  startDate: string;
  endDate: string;
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

export interface PayrollConsolidatedData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  totalWorkedHours: number;
  payableDays: number;
  lopDays: number;
  overtimeHours: number;
}

// ── Report Query Params ────────────────────────────────────────────────────

export interface MonthYearQuery {
  month: number;
  year: number;
  departmentId?: string;
  branchId?: string;
}
export interface DateRangeQuery {
  fromDate: string;
  toDate: string;
  departmentId?: string;
  branchId?: string;
  page?: number;
  size?: number;
}
export interface LateArrivalQuery extends DateRangeQuery {
  minLateMinutes?: number;
}
export interface OvertimeQuery extends DateRangeQuery {
  minOtMinutes?: number;
}
export interface LopQuery {
  startDate: string;
  endDate: string;
  departmentId?: string;
  branchId?: string;
  page?: number;
  size?: number;
}
export interface AbsenteeismQuery extends MonthYearQuery {
  minAbsentDays?: number;
}
export interface EmployeeHistoryQuery {
  employeeId: string;
  fromDate: string;
  toDate: string;
  page?: number;
  size?: number;
}
export interface LeaveUtilizationQuery extends MonthYearQuery {
  leaveTypeId?: string;
}
export interface PayrollConsolidated {
  employeeId?: string;
  startDate: string;
  endDate: string;
  includeOvertime?: boolean;
  includeLop?: boolean;
}

export interface OvertimeCalculateParams {
  employeeId: string;
  startDate: string;
  endDate: string;
  rateMultiplier?: boolean;
}

export interface OvertimeCalculationData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  startDate: string;
  endDate: string;
  totalOtMinutes: number;
  totalOtHours: number;
  rateMultiplierApplied: boolean;
  weightedOtHours: number;
  days: OvertimeDayData[];
}

export interface OvertimeDayData {
  date: string;
  otMinutes: number;
  otHours: number;
  dayType: string;
  multiplier: number;
  weightedHours: number;
}

export interface LopCalculateParams {
  employeeId: string;
  startDate: string;
  endDate: string;
}

export interface LopCalculationData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  lopDays: number;
  lopDates: string[];
}

export interface RemoteCheckinData {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime: string;
  shiftCode: string;
  shiftStart: string;
  shiftEnd: string;
  status: string;
  category: string;
  workedMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  checkInWithinGeofence: boolean;
  checkOutWithinGeofence: boolean;
  checkInPhotoUrl: string;
  checkOutPhotoUrl: string;
  remarks: string;
  checkinType: string;
  clientName: string;
  purpose: string;
  remoteApprovalStatus: string;
}

export interface RemoteCheckinApproveParams {
  comments: string;
}

export interface OvertimeApproveParams {
  status: string;
  approvedBy?: string;
  remarks: string;
}

export interface OvertimeApprovalData {
  recordId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  attendanceDate: string;
  overtimeMinutes: number;
  overtimeHours: number;
  otApprovalStatus: string;
  otApprovedBy: string;
  otRemarks: string;
}

export interface ShiftScheduleData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  days: ShiftDayData[];
}

export interface ShiftDayData {
  date: string;
  dayOfWeek: string;
  shiftCode: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  weeklyOff: boolean;
}

export interface ExportMonthlyParams {
  month: number;
  year: number;
  departmentId?: string;
  branchId?: string;
  exportFormat?: string;
}

export interface ExportData {
  fileUrl: string;
}

export interface LeaveTodayData {
  date: string;
  totalEmployees: number;
  employees: LeaveEmployeeData[];
}

export interface LeaveEmployeeData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
}

export interface DashboardSummaryData {
  date: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  today: DailySummaryData;
  periodSummary: PeriodSummaryData;
}

export interface DailySummaryData {
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

export interface PeriodSummaryData {
  totalEmployees: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLateDays: number;
  totalLeaveDays: number;
  attendancePercentage: number;
}

export interface CalendarHolidayData {
  holidays: HolidayData[];
}

export interface HolidayData {
  id: string;
  date: string;
  name: string;
  type: string;
  applicableDepartments: string[];
  optional: boolean;
}

export interface SendRemindersParams {
  recipientType: string;
  employeeIds?: string[];
  departmentId?: string;
  reminderMessage: string;
  sendVia?: string[];
}

export interface ReminderResponseData {
  id: string;
  recipientType: string;
  recipientCount: number;
  sendVia: string[];
  status: string;
  message: string;
}

export interface ImportPunchesParams {
  source: string;
  punches: PunchData[];
}

export interface PunchData {
  employeeId: string;
  employeeCode: string;
  timestamp: string;
  deviceId: string;
}

export interface ImportFileParams {
  format: string;
  source: string;
  type:string;
  startDate: string;
  endDate: string;
}

export interface ImportResponseData {
  source: string;
  totalPunches: number;
  daysImported: number;
  skipped: number;
  errors: number;
  rows: ImportRowData[];
}

export interface ImportRowData {
  employeeCode: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  message: string;
}

export interface BulkCheckinPayload {
  employeeIds: string[];
  checkinTime?: string;
  reason: string;
  markedBy: string;
  checkoutTime?: string;
}

export interface BulkCheckinResponseData {
  checkinTime: string;
  total: number;
  checkedIn: number;
  skipped: number;
  errors: number;
  results: BulkCheckinResultData[];
}

export interface BulkCheckinResultData {
  employeeCode: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  message: string;
}


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface LopSummaryRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  lopDates: string[];
}