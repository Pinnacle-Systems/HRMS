import type { ReactNode } from "react";
import { Button } from "@mui/material";

type LeaveFilterBarProps = {
  children: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  actions?: ReactNode;
  className?: string;
  gridClassName?: string;
};

export default function LeaveFilterBar({
  children,
  onReset,
  resetLabel = "Reset",
  actions,
  className = "p-3 pt-6",
  gridClassName = "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3",
}: LeaveFilterBarProps) {
  return (
    <div className={`border border-gray-300 rounded-lg bg-white-50 ${className}`}>
      <div className={gridClassName}>{children}</div>
      {(onReset || actions) && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {actions}
          {onReset && (
            <Button
              variant="outlined"
              size="small"
              className="!text-gray-800 !border-gray-300"
              onClick={onReset}
            >
              {resetLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
