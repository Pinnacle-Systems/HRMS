import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

export type DataStateType = "loading" | "empty" | "error";

export type DataStateProps = {
  type: DataStateType;
  title?: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
};

const defaultTitles: Record<DataStateType, string> = {
  loading: "Loading...",
  empty: "No records found.",
  error: "Something went wrong.",
};

const toneClasses: Record<DataStateType, string> = {
  loading: "border-gray-300 bg-gray-50 text-gray-500",
  empty: "border-gray-200 bg-white text-gray-500",
  error: "border-red-200 bg-red-50 text-red-700",
};

export default function DataState({
  type,
  title,
  message,
  action,
  compact = false,
}: DataStateProps) {
  const displayTitle = title ?? defaultTitles[type];
  const paddingClass = compact ? "py-6 px-3" : "p-5";

  return (
    <Box
      className={`w-full text-center bg-white-50 text-[12px] ${paddingClass} ${toneClasses[type]} ${
        compact ? "" : "border rounded-lg"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        {type === "loading" && (
          <CircularProgress size={compact ? 18 : 22} color="inherit" />
        )}
        <div>{displayTitle}</div>
        {message && <div className="text-[12px] opacity-80">{message}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </Box>
  );
}
