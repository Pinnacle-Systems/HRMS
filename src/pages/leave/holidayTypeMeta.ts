import type { LeaveStatusMeta, LeaveStatusTone } from "./leaveStatusMeta";

export type HolidayTypeMeta = LeaveStatusMeta;

export const holidayTypeMeta: Record<string, HolidayTypeMeta> = {
  PUBLIC: { label: "Public Holiday", tone: "success" },
  NATIONAL: { label: "Public Holiday", tone: "success" },
  COMPANY: { label: "Company Holiday", tone: "info" },
  OPTIONAL: { label: "Optional Holiday", tone: "info" },
  RESTRICTED: { label: "Restricted Holiday", tone: "warning" },
  REGIONAL: { label: "Restricted Holiday", tone: "warning" },
};

function formatUnknownType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getHolidayTypeMeta(type: string): HolidayTypeMeta {
  return (
    holidayTypeMeta[type] ?? {
      label: formatUnknownType(type || "Unknown"),
      tone: "default" as LeaveStatusTone,
    }
  );
}
