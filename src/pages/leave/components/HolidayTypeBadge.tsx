import { Chip } from "@mui/material";
import type { LeaveStatusTone } from "../leaveStatusMeta";
import { getHolidayTypeMeta } from "../holidayTypeMeta";

type HolidayTypeBadgeProps = {
  type: string;
  size?: "small" | "medium";
};

const toneClasses: Record<LeaveStatusTone, string> = {
  default: "!bg-gray-100 !text-gray-800",
  neutral: "!bg-gray-100 !text-gray-700",
  info: "!bg-primary-50 !text-primary",
  success: "!bg-green-50 !text-green-700",
  warning: "!bg-yellow-50 !text-yellow-700",
  error: "!bg-red-50 !text-red-700",
};

export default function HolidayTypeBadge({
  type,
  size = "small",
}: HolidayTypeBadgeProps) {
  const meta = getHolidayTypeMeta(type);

  return (
    <Chip
      size={size}
      label={meta.label}
      className={toneClasses[meta.tone]}
    />
  );
}
