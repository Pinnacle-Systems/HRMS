import type { ApiTime } from "../services/modules/permissionRequests";

export const formatDate = (
  date: string | Date | null | undefined,
) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatMinutes = (timeUnit: any, minutes?: number | null): string => {
  if (minutes == null) return "-";
  if (timeUnit === "min") return String(minutes);

  const total = Math.abs(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const sign = minutes < 0 ? "-" : "";

  // if (h === 0) return `${sign}${m}m`;
  // if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
};

export const formatApiTime = (value: ApiTime) => {
  if (typeof value === "string") return value.slice(0, 5);
  if (typeof value.hour !== "number" || typeof value.minute !== "number") return "";
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
};