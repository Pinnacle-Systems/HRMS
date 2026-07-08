import type { LeaveStatusMeta, LeaveStatusTone } from "./leaveStatusMeta";

export type HolidayTypeMeta = LeaveStatusMeta;

export const holidayTypeMeta: Record<string, HolidayTypeMeta> = {
  PUBLIC: { label: "Public Holiday", tone: "success" },
  NATIONAL: { label: "National Holiday", tone: "secondary" },
  COMPANY: { label: "Company Holiday", tone: "info" },
  OPTIONAL: { label: "Optional Holiday", tone: "default" },
  RESTRICTED: { label: "Restricted Holiday", tone: "error" },
  REGIONAL: { label: "Regional Holiday", tone: "warning" },
  FLOATING: { label: "Float Holiday", tone: "primary" },
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
