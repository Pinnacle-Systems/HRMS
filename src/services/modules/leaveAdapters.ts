import type {
  CompOffCredit,
  CompOffCreditRequest,
  CompOffCreditStatus,
  Holiday,
  HolidayCalendar,
  LeaveBalance,
  LeaveDayType,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  WorkCalendar,
} from "./leaveTypes";

export type LeaveRequestDateResponse = {
  id?: string;
  date?: string;
  session?: string;
  dayType?: string;
  dayValue?: number;
};

export type LeaveRequestApprovalResponse = {
  id?: string;
  approverId?: string;
  approverName?: string;
  status?: string;
  remarks?: string;
  actedAt?: string;
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
  fromDate?: string;
  toDate?: string;
  fromSession?: string;
  toSession?: string;
  totalDays?: number;
  appliedReason?: string;
  currentStatus?: string;
  currentApproverId?: string;
  currentApproverName?: string;
  submittedAt?: string;
  approvedAt?: string;
  dates?: LeaveRequestDateResponse[];
  approvals?: LeaveRequestApprovalResponse[];
};

export type LeaveTypeResponse = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  paid?: boolean;
  isPaid?: boolean;
  enabled?: boolean;
  active?: boolean;
  color?: string;
  maxDaysPerRequest?: number;
  requiresDocumentAfterDays?: number;
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
  name?: string;
  date?: string;
  type?: string;
  location?: string;
  locations?: string[];
};

export type HolidayCalendarResponse = {
  id?: string;
  name?: string;
  year?: number;
  locations?: string[];
  holidays?: HolidayResponse[];
};

export type WorkCalendarResponse = {
  id?: string;
  name?: string;
  locations?: string[];
  weeklyOffs?: string[];
  workingHoursPerDay?: number;
  active?: boolean;
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
  ];
  return statuses.includes(normalized as LeaveRequestStatus)
    ? (normalized as LeaveRequestStatus)
    : "PENDING";
}

function mapCompOffStatus(value: unknown): CompOffCreditRequest["status"] {
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

function mapHolidayType(value: unknown): Holiday["type"] {
  const normalized = asString(value, "PUBLIC").toUpperCase();
  const types: Holiday["type"][] = [
    "PUBLIC",
    "COMPANY",
    "OPTIONAL",
    "RESTRICTED",
    "NATIONAL",
    "REGIONAL",
  ];
  return types.includes(normalized as Holiday["type"])
    ? (normalized as Holiday["type"])
    : "PUBLIC";
}

export function mapLeaveRequestResponseToViewModel(
  dto: LeaveRequestResponse,
): LeaveRequest {
  const fromSession = mapSession(dto.fromSession);
  const toSession = mapSession(dto.toSession);
  const totalDays = asNumber(dto.totalDays, 0);

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
    appliedOn: asString(dto.submittedAt),
    approverId: dto.currentApproverId,
    approverName: dto.currentApproverName,
    submittedAt: dto.submittedAt,
    approvedAt: dto.approvedAt,
    dates: dto.dates ?? [],
    approvals: dto.approvals ?? [],
    approverRemarks: dto.approvals?.find((approval) => approval.remarks)?.remarks,
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
    paid: asBoolean(dto.paid, asBoolean(dto.isPaid, true)),
    enabled: asBoolean(dto.enabled, asBoolean(dto.active, true)),
    color: asString(dto.color, "#e16a3d"),
    maxDaysPerRequest: dto.maxDaysPerRequest,
    requiresDocumentAfterDays: dto.requiresDocumentAfterDays,
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
    year: asNumber(dto.year, new Date().getFullYear()),
  };
}

export function mapHolidayResponseToViewModel(dto: HolidayResponse): Holiday {
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    date: asString(dto.date),
    type: mapHolidayType(dto.type),
    location: dto.locations?.join(", ") ?? asString(dto.location),
  };
}

export function mapHolidayCalendarResponseToViewModel(
  dto: HolidayCalendarResponse,
): HolidayCalendar {
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    year: asNumber(dto.year, new Date().getFullYear()),
    locations: dto.locations ?? [],
    holidays: (dto.holidays ?? []).map(mapHolidayResponseToViewModel),
  };
}

export function mapWorkCalendarResponseToViewModel(
  dto: WorkCalendarResponse,
): WorkCalendar {
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    locations: dto.locations ?? [],
    weeklyOffs: dto.weeklyOffs ?? [],
    workingHoursPerDay: asNumber(dto.workingHoursPerDay),
    active: asBoolean(dto.active, true),
  };
}

export function mapCompOffResponseToViewModel(
  dto: CompOffResponse,
): CompOffCreditRequest {
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
    workedSession: sessionType,
    creditDays,
    requestedDays: creditDays,
    reason: asString(dto.reason),
    status: mapCompOffStatus(dto.currentStatus),
    submittedOn: asString(dto.submittedAt),
    approverId: dto.approverId,
    approverName,
    approver: asString(approverName),
    leaveTypeId: dto.leaveTypeId,
    leaveTypeCode: dto.leaveTypeCode,
  };
}

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
    workedSession: sessionType,
    creditDays,
    creditedDays: creditDays,
    expiryDate: asString(dto.expiryDate),
    status: mapCreditStatus(dto.currentStatus),
    reason: asString(dto.reason),
    approverId: dto.approverId,
    approverName: dto.approverName,
    leaveTypeId: dto.leaveTypeId,
    leaveTypeCode: dto.leaveTypeCode,
    approvedBy: dto.approverName,
  };
}
