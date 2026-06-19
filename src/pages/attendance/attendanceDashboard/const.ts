import type { AttendanceStatus } from "../../../services/modules/attendance";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  checked_in: "Checked In",
  checked_out: "Checked Out",
  absent: "Absent",
  present: "Present",
  late: "Late",
  half_day: "Half Day",
  on_duty: "On Duty",
  leave: "On Leave",
  permission: "Permission",
  holiday: "Holiday",
  weekly_off: "Weekly Off",
  irregular: "Irregular",
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  checked_in: "#22c55e",
  checked_out: "#3b82f6",
  absent: "#e66262",
  present: "#10d3a2",
  late: "#f1aa30",
  half_day: "#a855f7",
  on_duty: "#44bacf",
  leave: "#8b5cf6",
  permission: "#f97316",
  holiday: "#64748b",
  weekly_off: "#94a3b8",
  irregular: "#ec4899",
};

export const ATTENDANCE_STATUS_BG: Record<AttendanceStatus, string> = {
  checked_in: "bg-green-100 text-green-700",
  checked_out: "bg-blue-100 text-blue-700",
  absent: "bg-red-100 text-red-700",
  present: "bg-green-100 text-green-700",
  late: "bg-amber-100 text-amber-700",
  half_day: "bg-purple-100 text-purple-700",
  on_duty: "bg-cyan-100 text-cyan-700",
  leave: "bg-violet-100 text-violet-700",
  permission: "bg-orange-100 text-orange-700",
  holiday: "bg-slate-100 text-slate-600",
  weekly_off: "bg-gray-100 text-gray-500",
  irregular: "bg-pink-100 text-pink-700",
};

export const MUSTER_STATUS_CELL: Record<string, string> = {
  present: "bg-green-500 text-white",
  checked_in: "bg-green-500 text-white",
  checked_out: "bg-blue-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-400 text-white",
  half_day: "bg-purple-400 text-white",
  on_duty: "bg-cyan-500 text-white",
  leave: "bg-violet-400 text-white",
  permission: "bg-orange-400 text-white",
  holiday: "bg-slate-300 text-slate-700",
  weekly_off: "bg-gray-200 text-gray-500",
  irregular: "bg-pink-400 text-white",
};

export const MUSTER_STATUS_ABBR: Record<string, string> = {
  present: "P",
  checked_in: "P",
  checked_out: "P",
  absent: "A",
  late: "L",
  half_day: "H",
  on_duty: "OD",
  leave: "LV",
  permission: "PM",
  holiday: "HO",
  weekly_off: "WO",
  irregular: "IR",
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "on_duty", label: "On Duty" },
  { value: "leave", label: "On Leave" },
  { value: "permission", label: "Permission" },
  { value: "holiday", label: "Holiday" },
  { value: "weekly_off", label: "Weekly Off" },
  { value: "irregular", label: "Irregular" },
];

export function formatMinutes(minutes: number): string {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export const FINALISATON_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  locked: "Locked",
};

export const FINALISATION_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  locked: "bg-blue-100 text-blue-700",
};
