// Color palettes
// export const CHART_COLORS = [
//   "#3b82f6",
//   "#8b5cf6",
//   "#ec4899",
//   "#ef4444",
//   "#f59e0b",
//   "#10b981",
//   "#06b6d4",
//   "#6366f1",
//   "#f472b6",
//   "#34d399",
//   "#fbbf24",
//   "#60a5fa",
// ];

export const CHART_COLORS_LIGHT = [
  "#93c5fd",
  "#c4b5fd",
  "#f9a8d4",
  "#fca5a5",
  "#fcd34d",
  "#6ee7b7",
  "#67e8f9",
  "#a5b4fc",
];

// Types
export type LeaveUsageItem = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  requestCount: number;
  totalDays: number;
};

export type PendingApprovalItem = {
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: string;
  currentApproverId: string | null;
  approverName: string | null;
  submittedAt: string;
};

export type LopReportItem = {
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  lopDays: number;
  payrollTreatment: string;
  status: string;
};

export type BalanceReportItem = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  leaveYear: number;
  openingBalance: number;
  accruedDays: number;
  consumedDays: number;
  closingBalance: number;
};

export type CompOffReportItem = {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  creditDays: number;
  status: string;
  approverName: string;
  expiryDate: string;
  leaveTypeName: string;
  requestNumber: string;
  sessionType: string;
  submittedAt: string;
  workedDate: string;
};

export type ReportFilter = {
  from?: string;
  to?: string;
  year?: number;
  employeeId?: string;
  status?: string;
  leaveType?: string;
};

export type ReportType =
  | "LEAVE_USAGE"
  | "LEAVE_PENDING_APPROVALS"
  | "LEAVE_LOP"
  | "LEAVE_COMP_OFFS"
  | "LEAVE_BALANCE";