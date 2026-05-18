import type { LeaveStatusMeta, LeaveStatusTone } from "./leaveStatusMeta";

export type { LeaveStatusTone };

export const compOffStatusMeta: Record<string, LeaveStatusMeta> = {
  AVAILABLE: { label: "Available", tone: "success" },
  AVAILED: { label: "Availed", tone: "info" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  PENDING: { label: "Pending", tone: "info" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "error" },
};

function formatUnknownStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCompOffStatusMeta(status: string): LeaveStatusMeta {
  return (
    compOffStatusMeta[status] ?? {
      label: formatUnknownStatus(status || "Unknown"),
      tone: "default" as LeaveStatusTone,
    }
  );
}
