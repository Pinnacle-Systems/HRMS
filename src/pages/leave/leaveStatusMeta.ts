import type { LeaveRequestStatus } from "../../services/modules/leaveTypes";

export type LeaveStatusTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "secondary"
  | "neutral";

export type LeaveStatusMeta = {
  label: string;
  tone: LeaveStatusTone;
};

export const leaveRequestStatusOptions: LeaveRequestStatus[] = [
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

export const leaveStatusMeta: Record<string, LeaveStatusMeta> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING: { label: "Pending Manager Approval", tone: "info" },
  PENDING_HR_VERIFICATION: {
    label: "Pending HR Verification",
    tone: "info",
  },
  APPROVED: { label: "Approved", tone: "success" },
  PARTIALLY_APPROVED: { label: "Partially Approved", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "error" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
  CANCEL_REQUESTED: { label: "Cancellation Requested", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  CONVERTED_TO_LOP: { label: "Converted to LOP", tone: "error" },
  CLARIFICATION_REQUESTED: { label: "Clarification Request", tone: "warning" }
};

function formatUnknownStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getLeaveStatusMeta(status: string): LeaveStatusMeta {
  return (
    leaveStatusMeta[status] ?? {
      label: formatUnknownStatus(status || "Unknown"),
      tone: "default",
    }
  );
}
