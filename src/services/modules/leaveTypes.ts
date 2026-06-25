import type { ApiResponse } from "../../auth/authTypes";

export type LeaveRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "PENDING_HR_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "CONVERTED_TO_LOP";

export type LeaveDayType = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

export type LeaveType = {
  id: string;
  code: string;
  name: string;
  description: string;
  paid: boolean;
  active: boolean;
  // color: string;
  // maxDaysPerRequest?: number;
  // requiresDocumentAfterDays?: number;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  encashable: boolean;
  payrollTreatment: string;
  requiresAttachment: boolean;
  requiresHrVerification: boolean;
};

export type LeaveRequest = {
  id: string;
  requestNumber?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  location: string;
  managerId: string;
  managerName: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  fromSession?: LeaveDayType;
  toSession?: LeaveDayType;
  totalDays?: number;
  dayType: LeaveDayType;
  days: number;
  reason: string;
  appliedReason?: string;
  emergencyContactNumber?: string;
  status: LeaveRequestStatus;
  appliedOn: string;
  approverId?: string;
  approverName?: string;
  submittedAt?: string;
  approvedAt?: string;
  dates?: any[];
  approvals?: any[];
  approverRemarks?: string;
  payrollTreatment?: string;
  lop?: string;
  createdAt?: string;
  updatedAt?: string;
  cancellationRequested?: string;
  currentStatus: string;
};

export type LeaveBalance = {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  code?: string;
  leaveTypeCode: string;
  name?: string;
  leaveTypeName: string;
  opening: number;
  accrued?: number;
  credited: number;
  used?: number;
  availed: number;
  pending: number;
  adjusted: number;
  available?: number;
  balance: number;
  leaveYear: number;
  accruedDays: number;
  closingBalance: number;
  consumedDays: number;
  openingBalance: number;
};

export type LeaveLedgerEntry = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  transactionDate: string;
  transactionType: "CREDIT" | "DEBIT" | "ADJUSTMENT" | "LAPSE" | "ACCRUAL";
  days: number;
  referenceKey?: string;
  remarks: string;
  balanceAfterTransaction: number;
  creditDays: number;
  debitDays: number;
  leaveTypeCode: string;
  notes: string;
};

export type LeaveAdjustmentPayload = {
  leaveTypeId: string;
  leaveYear: number;
  days: number;
  notes: string;
};

export type LeaveCalculationRequest = {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  fromSession?: LeaveDayType;
  toSession?: LeaveDayType;
  leaveYear?: number;
};

export type LeaveCalculationResult = {
  days: number;
  workingDays: number;
  holidays: string[];
  weeklyOffs: string[];
  availableBalance: number;
  lopDays: number;
  currentBalance: string;
  insufficientBalance: string;
  balanceAfter: number;
  potentialLop: number;
  calendarDays: number;
  excludedWeekends: any[];
  excludedHolidays: any[];
  calculatedDays: number;
  warnings: any[];
  payrollTreatment: string;
  policyApplied: Record<string, unknown>;
  dayBreakdown: any[];
};

export type Holiday = {
  id: string;
  holidayName: string;
  holidayDate: string;
  holidayType:
    | "PUBLIC"
    | "COMPANY"
    | "OPTIONAL"
    | "RESTRICTED"
    | "NATIONAL"
    | "REGIONAL";
  location: string;
  holidayCalendarId?: string;
  calendarName?: string;
  active?: boolean;
  optionalHoliday: boolean
};

export type HolidayCalendar = {
  id: string;
  calendarName: string;
  year: number;
  locations: string[];
  holidays: Holiday[];
  branchId?: string;
  branchName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Holidays = {
  id: string;
  holidayCalendarId: string;
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  optionalHoliday: boolean;
  active: boolean;
};

export type TeamCalendarEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  status: LeaveRequestStatus;
};

export type LeavePolicy = {
  id: string;
  name: string;
  leaveTypeId: string;
  appliesTo: string;
  accrualFrequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  annualEntitlement: number;
  carryForwardLimit: number;
  encashable: boolean;
  active: boolean;
};

export type WorkCalendarDay = {
  id: string;
  dayOfWeek: string;
  workingType: "OFF" | "FULL" | "HALF";
  workingHours?: number;
};

export type WorkCalendar = {
  id: string;
  calendarName: string;
  branchName: string;
  branchId: string;
  days: WorkCalendarDay[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PayrollLeaveInput = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  month: string;
  lopDays: number;
  paidLeaveDays: number;
  compOffDays: number;
  remarks: string;
};

export type CompOffCreditStatus =
  | "AVAILABLE"
  | "PENDING"
  | "AVAILED"
  | "EXPIRED"
  | "APPROVED"
  | "REJECTED";

export type CompOffCredit = {
  id: string;
  requestNumber?: string;
  employeeId: string;
  employeeName?: string;
  workedDate: string;
  sessionType?: LeaveDayType;
  // workedSession: LeaveDayType;
  creditDays: number;
  // creditedDays: number;
  expiryDate: string;
  currentStatus: CompOffCreditStatus;
  reason: string;
  approverId?: string;
  approverName?: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  approvedBy?: string;
  requestedDays: number;
  submittedAt?: string;
  actionedAt: string;
  actionedBy: string;
  actionComments: string;
};

// export type CompOffCreditRequest = {
//   id: string;
//   requestNumber?: string;
//   employeeId: string;
//   employeeName?: string;
//   workedDate: string;
//   sessionType?: LeaveDayType;
//   workedSession: LeaveDayType;
//   creditDays?: number;
//   requestedDays: number;
//   reason: string;
//   status: "PENDING" | "APPROVED" | "REJECTED";
//   submittedOn: string;
//   approverId?: string;
//   approverName?: string;
//   approver: string;
//   leaveTypeId?: string;
//   leaveTypeCode?: string;
// };

export type CompOffCreditRequestPayload = {
  // employeeId: string;
  workedDate: string;
  sessionType: LeaveDayType;
  creditDays?: number;
  expiryDate?: string;
  reason: string;
  approverId?: string;
  leaveTypeId?: string;
  // attachment?: File | string;
};

export type LeavePolicyRuleType =
  | "ACCRUAL"
  | "CARRY_FORWARD"
  | "ENCASHMENT"
  | "MIN_SERVICE"
  | "MAX_CONSECUTIVE_DAYS"
  | "NOTICE_PERIOD";

export type LeavePolicyRule = {
  id: string;
  leavePolicyId: string;
  ruleType: LeavePolicyRuleType;
  value?: number;
  unit?: string;
  condition?: string;
  description?: string;
  active: boolean;
};

export type HolidayImportResult = {
  id: string;
  fileName: string;
  calendarId?: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: string[];
  importedAt: string;
  importedBy?: string;
};

export type PayrollLeaveSummary = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  month: string;
  totalLopDays: number;
  totalPaidLeaveDays: number;
  totalCompOffDays: number;
  totalEncashedDays: number;
};

export type LeaveAccrualRunRequest = {
  leaveTypeId?: string;
  // month: string;
  dryRun?: boolean;
  runDate: string; // Format: YYYY-MM-DD
};

export type LeaveAccrualRunResult = {
  // runId: string;
  // month: string;
  // employeesProcessed: number;
  // totalDaysAccrued: number;
  // errors?: string[];
  // status: "COMPLETED" | "FAILED" | "PARTIAL";
  // runAt: string;
  tenantsProcessed: number;
  tenantsFailed: number;
  totalCredited: number;
  totalSkipped: number;
  success: boolean;
  timestamp?: string;
};

export type EmpOperationalListEntry = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department?: string;
  eventDate: string;
  meta?: string;
};

export type LeaveListParams = {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  employeeId?: string;
  managerId?: string;
  departmentId?: string;
  status?: LeaveRequestStatus;
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
  leaveYear?: number;
  includeDisabled?: boolean;
  calendarId?: string;
  limit?: number;
  from?: string;
  to?: string;
  daysAhead?: number;
  days?: number;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type LeaveApiResponse<T> = ApiResponse<T>;
