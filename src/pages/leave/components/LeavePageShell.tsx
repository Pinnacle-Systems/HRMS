import type { ReactNode } from "react";
import { Paper } from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import LeaveTabs from "./LeaveTabs";
import { leaveGroupLabels, type LeaveRouteGroup } from "../leaveRoutes";

type LeavePageShellProps = {
  group?: LeaveRouteGroup;
  title: string;
  breadcrumbLabel?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  paperClassName?: string;
  titleClassName?: string;
};

export default function LeavePageShell({
  group = "employee",
  title,
  breadcrumbLabel,
  subtitle,
  actions,
  children,
  contentClassName = "p-3 space-y-3",
  paperClassName = "border border-gray-300 !bg-white overflow-hidden",
  titleClassName = "text-xl font-semibold text-gray-800",
}: LeavePageShellProps) {
  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1 min-w-0">
          Leave
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {leaveGroupLabels[group]}
          </span>
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-gray-800 font-medium">
            {breadcrumbLabel ?? title}
          </span>
        </div>
      </div>

      <Paper elevation={0} className={paperClassName}>
        <LeaveTabs />

        <div className={contentClassName}>
          <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className={titleClassName}>{title}</div>
              {subtitle && (
                <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
              )}
            </div>
            {actions}
          </div>

          {children}
        </div>
      </Paper>
    </div>
  );
}
