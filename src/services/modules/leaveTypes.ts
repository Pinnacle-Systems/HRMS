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
  enabled: boolean;
  color: string;
  maxDaysPerRequest?: number;
  requiresDocumentAfterDays?: number;
};

export type LeaveRequest = {
  id: string;
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
  dayType: LeaveDayType;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  appliedOn: string;
  approverRemarks?: string;
};

export type LeaveBalance = {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  opening: number;
  credited: number;
  availed: number;
  pending: number;
  adjusted: number;
  balance: number;
  year: number;
};

export type LeaveLedgerEntry = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  transactionDate: string;
  transactionType: "CREDIT" | "DEBIT" | "ADJUSTMENT" | "LAPSE";
  days: number;
  referenceId?: string;
  remarks: string;
};

export type LeaveAdjustmentPayload = {
  leaveTypeId: string;
  days: number;
  reason: string;
};

export type LeaveCalculationRequest = {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  dayType?: LeaveDayType;
  fromSession?: LeaveDayType;
  toSession?: LeaveDayType;
};

export type LeaveCalculationResult = {
  days: number;
  workingDays: number;
  holidays: string[];
  weeklyOffs: string[];
  availableBalance: number;
  lopDays: number;
};

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: "PUBLIC" | "COMPANY" | "OPTIONAL" | "RESTRICTED" | "NATIONAL" | "REGIONAL";
  location: string;
};

export type HolidayCalendar = {
  id: string;
  name: string;
  year: number;
  locations: string[];
  holidays: Holiday[];
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

export type WorkCalendar = {
  id: string;
  name: string;
  locations: string[];
  weeklyOffs: string[];
  workingHoursPerDay: number;
  active: boolean;
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

export type CompOffCreditStatus = "AVAILABLE" | "PENDING" | "AVAILED" | "EXPIRED" | "REJECTED";

export type CompOffCredit = {
  id: string;
  employeeId: string;
  workedDate: string;
  workedSession: LeaveDayType;
  creditedDays: number;
  expiryDate: string;
  status: CompOffCreditStatus;
  reason: string;
  approvedBy?: string;
};

export type CompOffCreditRequest = {
  id: string;
  employeeId: string;
  workedDate: string;
  workedSession: LeaveDayType;
  requestedDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedOn: string;
  approver: string;
};

export type CompOffCreditRequestPayload = {
  employeeId: string;
  workedDate: string;
  workedSession: LeaveDayType;
  reason: string;
  attachment?: File | string;
};

export type LeaveListParams = {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  employeeId?: string;
  status?: LeaveRequestStatus;
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type LeaveApiResponse<T> = ApiResponse<T>;
