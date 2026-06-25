import type { ReactNode } from "react";
import { Paper } from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import LeaveTabs from "./LeaveTabs";
import { leaveGroupLabels, type LeaveRouteGroup } from "../leaveRoutes";

type LeavePageShellProps = {
  group: LeaveRouteGroup;
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
  group,
  title,
  breadcrumbLabel,
  subtitle,
  actions,
  children,
  contentClassName = "p-3 !pb-0 space-y-3 mx-auto h-[calc(100vh-180px)] overflow-auto",
  paperClassName = "border border-gray-300 !bg-white overflow-hidden",
  titleClassName = "text-[12px] font-bold text-gray-800",
}: LeavePageShellProps) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 min-w-0 mb-4">
        <div className="text-gray-500 text-[12px] flex flex-wrap items-center gap-1 min-w-0">
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
        <LeaveTabs group={group} />

        <div className={contentClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className={titleClassName}>{title}</div>
              {subtitle && (
                <div className="text-[10px] text-gray-500">{subtitle}</div>
              )}
            </div>
            <div>
              {actions}
            </div>
          </div>

          {children}
        </div>
      </Paper>
    </div>
  );
}
