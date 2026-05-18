import type { LeaveRequestStatus } from "../../services/modules/leaveTypes";

export const DEFAULT_COMP_OFF_VALIDITY_DAYS = 90;

export type LeaveRequestRuleInput = {
  id?: string;
  status?: LeaveRequestStatus | string;
  fromDate?: string;
  toDate?: string;
};

export type LeaveAttachmentRuleInput = {
  leaveTypeCode?: string;
  leaveTypeName?: string;
  totalDays?: number;
  requiresDocumentAfterDays?: number;
};

function toLocalDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateOnlyString(value: string | Date) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateForApi(value: string | Date) {
  return toDateOnlyString(value);
}

export function canWithdrawLeave(request?: LeaveRequestRuleInput | null) {
  return request?.status === "PENDING";
}

export function canRequestCancellation(
  request?: LeaveRequestRuleInput | null,
  today = new Date(),
) {
  if (request?.status !== "APPROVED" || !request.fromDate) {
    return false;
  }

  return new Date(request.fromDate) >= startOfDay(today);
}

export function isUpcomingApprovedLeave(
  request: LeaveRequestRuleInput,
  today = new Date(),
) {
  return canRequestCancellation(request, today);
}

export function requiresLeaveAttachment({
  leaveTypeCode,
  totalDays,
  requiresDocumentAfterDays,
}: LeaveAttachmentRuleInput) {
  return (
    leaveTypeCode === "SL" &&
    totalDays !== undefined &&
    requiresDocumentAfterDays !== undefined &&
    totalDays > requiresDocumentAfterDays
  );
}

export function calculateCompOffExpiryDate(
  earnedDate: string | Date,
  validityDays = DEFAULT_COMP_OFF_VALIDITY_DAYS,
) {
  const expiryDate = toLocalDate(earnedDate);
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  return expiryDate;
}

function dateRangesOverlap(left: LeaveRequestRuleInput, right: LeaveRequestRuleInput) {
  if (!left.fromDate || !left.toDate || !right.fromDate || !right.toDate) {
    return false;
  }

  return left.fromDate <= right.toDate && left.toDate >= right.fromDate;
}

export function getTeamOverlap<TRequest extends LeaveRequestRuleInput>(
  request: LeaveRequestRuleInput,
  teamRequests: TRequest[],
) {
  return teamRequests.filter(
    (item) =>
      item.id !== request.id &&
      item.status !== "REJECTED" &&
      item.status !== "CANCELLED" &&
      dateRangesOverlap(item, request),
  );
}
