import type {
  CompOffCredit,
  // CompOffCreditRequest,
  CompOffCreditStatus,
  Holiday,
  HolidayCalendar,
  // LeaveAccrualRunResult,
  LeaveBalance,
  LeaveDayType,
  LeavePolicyRule,
  LeavePolicyRuleType,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  // WorkCalendar,
} from "./leaveTypes";

export type LeaveRequestDateResponse = {
  id?: string;
  date?: string;
  leaveDate?: string;
  session?: string;
  sessionType?: string;
  dayType?: string;
  dayValue?: number;
  holiday?: boolean;
  weeklyOff?: boolean;
  calculatedLeaveDays?: number;
};

export type LeaveRequestApprovalResponse = {
  id?: string;
  approverId?: string;
  approverEmployeeId?: string;
  approverName?: string;
  approvalLevel?: number;
  status?: string;
  actionTaken?: string;
  remarks?: string;
  actionComments?: string;
  actedAt?: string;
  actionAt?: string;
};

export type LeaveRequestResponse = {
  id?: string;
  requestNumber?: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  location?: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  originalLeaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
  fromSession?: string;
  toSession?: string;
  totalDays?: number;
  appliedReason?: string;
  emergencyContactNumber?: string;
  currentStatus?: string;
  currentApproverId?: string;
  currentApproverName?: string;
  payrollTreatment: string;
  lop?: boolean;
  cancellationRequested?: boolean;
  submittedAt?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  dates?: LeaveRequestDateResponse[];
  approvals?: LeaveRequestApprovalResponse[];
};

export type LeaveTypeResponse = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  paid?: boolean;
  enabled?: boolean;
  active: boolean;
  color?: string;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  encashable: boolean;
  payrollTreatment: string;
  requiresAttachment: boolean;
  requiresHrVerification: boolean;
  // maxDaysPerRequest?: number;
  // requiresDocumentAfterDays?: number;
};

export type LeaveBalanceResponse = {
  employeeId?: string;
  employeeName?: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  leaveTypeName?: string;
  openingBalance?: number;
  accruedDays?: number;
  consumedDays?: number;
  pendingDays?: number;
  adjustedDays?: number;
  closingBalance?: number;
  year?: number;
};

export type HolidayResponse = {
  id?: string;
  holidayName?: string;
  name?: string;
  holidayDate?: string;
  date?: string;
  holidayType?: string;
  type?: string;
  holidayCalendarId?: string;
  calendarId?: string;
  holidayCalendarName?: string;
  calendarName?: string;
  branchName?: string;
  location?: string;
  locations?: string[];
  optionalHoliday?: boolean;
  optional?: boolean;
  active?: boolean;
};

export type HolidayCalendarResponse = {
  id?: string;
  calendarName?: string;
  name?: string;
  year?: number;
  branchId?: string;
  branchName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  locations?: string[];
  holidays?: HolidayResponse[];
};

export type WorkCalendarDayResponse = {
  id?: string;
  dayOfWeek?: string;
  workingType?: "OFF" | "FULL" | "HALF";
  workingHours?: number;
};

export type WorkCalendarResponse = {
  id?: string;
  calendarName?: string;
  days?: WorkCalendarDayResponse[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  branchName?: string;
  branchId?: string;
};

export type CompOffResponse = {
  id?: string;
  requestNumber?: string;
  employeeId?: string;
  employeeName?: string;
  workedDate?: string;
  sessionType?: string;
  creditDays?: number;
  expiryDate?: string;
  reason?: string;
  currentStatus?: string;
  approverId?: string;
  approverName?: string;
  leaveTypeId?: string;
  leaveTypeCode?: string;
  submittedAt?: string;
  actionedAt: string;
  actionedBy: string;
  actionComments: string;
};

export type LeavePolicyRuleResponse = {
  id?: string;
  leavePolicyId?: string;
  ruleType?: string;
  value?: number;
  unit?: string;
  condition?: string;
  description?: string;
  active?: boolean;
};

export type LeaveAccrualRunResponse = {
  runId?: string;
  id?: string;
  month?: string;
  employeesProcessed?: number;
  totalDaysAccrued?: number;
  errors?: string[];
  status?: string;
  runAt?: string;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function mapSession(value: unknown): LeaveDayType {
  const normalized = asString(value, "FULL_DAY").toUpperCase();
  if (normalized === "FIRST_HALF" || normalized === "SECOND_HALF") {
    return normalized;
  }
  return "FULL_DAY";
}

function mapLeaveStatus(value: unknown): LeaveRequestStatus {
  const normalized = asString(value, "PENDING").toUpperCase();
  const statuses: LeaveRequestStatus[] = [
    "DRAFT",
    "PENDING",
    "PENDING_HR_VERIFICATION",
    "APPROVED",
    "REJECTED",
    "WITHDRAWN",
    "CANCEL_REQUESTED",
    "CANCELLED",
    "CONVERTED_TO_LOP",
    "CLARIFICATION_REQUESTED"
  ];
  return statuses.includes(normalized as LeaveRequestStatus)
    ? (normalized as LeaveRequestStatus)
    : "PENDING";
}

function mapCompOffStatus(value: unknown): CompOffCredit["currentStatus"] {
  const normalized = asString(value, "PENDING").toUpperCase();
  if (normalized === "APPROVED" || normalized === "REJECTED") {
    return normalized;
  }
  return "PENDING";
}

function mapCreditStatus(value: unknown): CompOffCreditStatus {
  const normalized = asString(value, "PENDING").toUpperCase();
  if (normalized === "APPROVED") {
    return "AVAILABLE";
  }
  const statuses: CompOffCreditStatus[] = [
    "AVAILABLE",
    "PENDING",
    "AVAILED",
    "EXPIRED",
    "REJECTED",
  ];
  return statuses.includes(normalized as CompOffCreditStatus)
    ? (normalized as CompOffCreditStatus)
    : "PENDING";
}

function mapLeavePolicyRuleType(value: unknown): LeavePolicyRuleType {
  const normalized = asString(value, "ACCRUAL").toUpperCase();
  const types: LeavePolicyRuleType[] = [
    "ACCRUAL",
    "CARRY_FORWARD",
    "ENCASHMENT",
    "MIN_SERVICE",
    "MAX_CONSECUTIVE_DAYS",
    "NOTICE_PERIOD",
  ];
  return types.includes(normalized as LeavePolicyRuleType)
    ? (normalized as LeavePolicyRuleType)
    : "ACCRUAL";
}

// function mapAccrualRunStatus(value: unknown): LeaveAccrualRunResult["status"] {
//   const normalized = asString(value, "COMPLETED").toUpperCase();
//   if (normalized === "FAILED" || normalized === "PARTIAL") {
//     return normalized;
//   }
//   return "COMPLETED";
// }

function mapHolidayType(value: unknown): Holiday["holidayType"] {
  const normalized = asString(value, "PUBLIC").toUpperCase();
  const types: Holiday["holidayType"][] = [
    "PUBLIC",
    // "COMPANY",
    "OPTIONAL",
    "RESTRICTED",
    // "NATIONAL",
    // "REGIONAL",
    "FLOATING",
  ];
  return types.includes(normalized as Holiday["holidayType"])
    ? (normalized as Holiday["holidayType"])
    : "PUBLIC";
}

export function mapLeaveRequestResponseToViewModel(
  dto: LeaveRequestResponse,
): LeaveRequest {
  const fromSession = mapSession(dto.fromSession);
  const toSession = mapSession(dto.toSession);
  const totalDays = asNumber(dto.totalDays, 0);
  const dates = dto.dates ?? [];
  const approvals = dto.approvals ?? [];
  const firstRemark = approvals.find(
    (approval) => approval.actionComments || approval.remarks,
  );

  return {
    id: asString(dto.id),
    requestNumber: dto.requestNumber,
    employeeId: asString(dto.employeeId),
    employeeCode: asString(dto.employeeCode),
    employeeName: asString(dto.employeeName),
    department: asString(dto.department),
    location: asString(dto.location),
    managerId: asString(dto.currentApproverId),
    managerName: asString(dto.currentApproverName),
    leaveTypeId: asString(dto.leaveTypeId),
    leaveTypeCode: asString(dto.leaveTypeCode),
    leaveTypeName: asString(dto.leaveTypeName),
    fromDate: asString(dto.fromDate),
    toDate: asString(dto.toDate),
    fromSession,
    toSession,
    totalDays,
    dayType: fromSession,
    days: totalDays,
    reason: asString(dto.appliedReason),
    appliedReason: dto.appliedReason,
    status: mapLeaveStatus(dto.currentStatus),
    appliedOn: asString(dto.submittedAt ?? dto.createdAt),
    approverId: dto.currentApproverId,
    approverName: dto.currentApproverName,
    submittedAt: dto.submittedAt,
    approvedAt: dto.approvedAt,
    dates,
    approvals,
    approverRemarks: firstRemark?.actionComments ?? firstRemark?.remarks,
    currentStatus: dto.currentStatus as LeaveRequestStatus,
    payrollTreatment: dto.payrollTreatment
  };
}

export function mapLeaveTypeResponseToViewModel(
  dto: LeaveTypeResponse,
): LeaveType {
  return {
    id: asString(dto.id),
    code: asString(dto.code),
    name: asString(dto.name),
    description: asString(dto.description),
    paid: asBoolean(dto.paid, asBoolean(dto.paid, true)),
    active: asBoolean(dto.active, asBoolean(dto.active, true)),
    allowHalfDay: false,
    allowNegativeBalance: false,
    encashable: false,
    payrollTreatment: "PAID",
    requiresAttachment: false,
    requiresHrVerification: false,
    // color: asString(dto.color, "#e16a3d"),
    // maxDaysPerRequest: dto.maxDaysPerRequest,
    // requiresDocumentAfterDays: dto.requiresDocumentAfterDays,
  };
}

export function mapLeaveBalanceResponseToViewModel(
  dto: LeaveBalanceResponse,
): LeaveBalance {
  const leaveTypeCode = asString(dto.leaveTypeCode);
  const leaveTypeName = asString(dto.leaveTypeName);
  const accrued = asNumber(dto.accruedDays);
  const used = asNumber(dto.consumedDays);
  const available = asNumber(dto.closingBalance);

  return {
    employeeId: asString(dto.employeeId),
    employeeName: asString(dto.employeeName),
    leaveTypeId: asString(dto.leaveTypeId),
    code: leaveTypeCode,
    leaveTypeCode,
    name: leaveTypeName,
    leaveTypeName,
    opening: asNumber(dto.openingBalance),
    accrued,
    credited: accrued,
    used,
    availed: used,
    pending: asNumber(dto.pendingDays),
    adjusted: asNumber(dto.adjustedDays),
    available,
    balance: available,
    leaveYear: asNumber(dto.year, new Date().getFullYear()),
    accruedDays: asNumber(dto.accruedDays),
    closingBalance: available,
    consumedDays: asNumber(dto.consumedDays),
    openingBalance: asNumber(dto.openingBalance),
  };
}

export function mapHolidayResponseToViewModel(dto: HolidayResponse): Holiday {
  const branchName = asString(dto.branchName);
  const locations = dto.locations?.join(", ");
  return {
    id: asString(dto.id),
    holidayName: asString(dto.holidayName ?? dto.name),
    holidayDate: asString(dto.holidayDate ?? dto.date),
    holidayType:
      dto.optionalHoliday || dto.optional
        ? "PUBLIC"
        : mapHolidayType(dto.holidayType ?? dto.type),
    location: locations ?? branchName ?? asString(dto.location),
    holidayCalendarId: dto.holidayCalendarId ?? dto.calendarId,
    calendarName: dto.holidayCalendarName ?? dto.calendarName,
    active: asBoolean(dto.active, true),
    optionalHoliday: asBoolean(dto.optionalHoliday, true),
  };
}

export function mapHolidayCalendarResponseToViewModel(
  dto: HolidayCalendarResponse,
): HolidayCalendar {
  const branchName = asString(dto.branchName);
  return {
    id: asString(dto.id),
    calendarName: asString(dto.calendarName ?? dto.name),
    year: asNumber(dto.year, new Date().getFullYear()),
    locations: dto.locations ?? (branchName ? [branchName] : []),
    holidays: (dto.holidays ?? []).map(mapHolidayResponseToViewModel),
    branchId: dto.branchId,
    branchName: dto.branchName,
    active: asBoolean(dto.active, true),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// export function mapWorkCalendarResponseToViewModel(
//   dto: WorkCalendarResponse,
// ): WorkCalendar {
//   return {
//     id: asString(dto.id),
//     calendarName: asString(dto.calendarName),
//     branchName: asString(dto.branchName),
//     branchId: asString(dto.branchId),
//     days: dto.days  ?? [],
//     // weeklyOffs: dto.weeklyOffs ?? [],
//     // workingHoursPerDay: asNumber(dto.workingHoursPerDay),
//     active: asBoolean(dto.active, true),
//   };
// }

export function mapCompOffResponseToViewModel(
  dto: CompOffResponse,
): CompOffCredit {
  const sessionType = mapSession(dto.sessionType);
  const creditDays = asNumber(dto.creditDays);
  const approverName = dto.approverName;

  return {
    id: asString(dto.id),
    requestNumber: dto.requestNumber,
    employeeId: asString(dto.employeeId),
    employeeName: dto.employeeName,
    workedDate: asString(dto.workedDate),
    sessionType,
    // workedSession: sessionType,
    creditDays,
    requestedDays: creditDays,
    reason: asString(dto.reason),
    currentStatus: mapCompOffStatus(dto.currentStatus),
    submittedAt: asString(dto.submittedAt),
    approverId: dto.approverId,
    approverName,
    // approver: asString(approverName),
    leaveTypeId: dto.leaveTypeId,
    leaveTypeCode: dto.leaveTypeCode,
    actionedAt: dto.actionedAt,
    actionedBy: dto.actionedBy,
    actionComments: dto.actionComments,
    expiryDate: asString(dto.expiryDate),
  };
}

export function mapLeavePolicyRuleResponseToViewModel(
  dto: LeavePolicyRuleResponse,
): LeavePolicyRule {
  return {
    id: asString(dto.id),
    leavePolicyId: asString(dto.leavePolicyId),
    ruleType: mapLeavePolicyRuleType(dto.ruleType),
    value: dto.value,
    unit: dto.unit,
    condition: dto.condition,
    description: dto.description,
    active: asBoolean(dto.active, true),
  };
}

// export function mapLeaveAccrualRunResponseToViewModel(
//   dto: LeaveAccrualRunResponse,
// ): LeaveAccrualRunResult {
//   return {
//     runId: asString(dto.runId ?? dto.id),
//     month: asString(dto.month),
//     employeesProcessed: asNumber(dto.employeesProcessed),
//     totalDaysAccrued: asNumber(dto.totalDaysAccrued),
//     errors: dto.errors,
//     status: mapAccrualRunStatus(dto.status),
//     runAt: asString(dto.runAt),
//   };
// }

export function mapCompOffResponseToCreditViewModel(
  dto: CompOffResponse,
): CompOffCredit {
  const sessionType = mapSession(dto.sessionType);
  const creditDays = asNumber(dto.creditDays);

  return {
    id: asString(dto.id),
    requestNumber: dto.requestNumber,
    employeeId: asString(dto.employeeId),
    employeeName: dto.employeeName,
    workedDate: asString(dto.workedDate),
    sessionType,
    // workedSession: sessionType,
    creditDays,
    // creditedDays: creditDays,
    expiryDate: asString(dto.expiryDate),
    currentStatus: mapCreditStatus(dto.currentStatus),
    reason: asString(dto.reason),
    approverId: dto.approverId,
    approverName: dto.approverName,
    leaveTypeId: dto.leaveTypeId,
    leaveTypeCode: dto.leaveTypeCode,
    approvedBy: dto.approverName,
    actionedAt: dto.actionedAt,
    actionedBy: dto.actionedBy,
    actionComments: dto.actionComments,
    requestedDays: creditDays,
  };
}
