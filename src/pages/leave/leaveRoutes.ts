import type { AppRole } from "../../auth/authTypes";

export type LeaveRouteGroup = "employee" | "manager" | "hr" | "admin";

export type LeaveRouteConfig = {
  path: string;
  label: string;
  description: string;
  group: LeaveRouteGroup;
  roles: AppRole[];
};

export const leaveRoutes: LeaveRouteConfig[] = [
  {
    path: "/leaves/my-dashboard",
    label: "My Dashboard",
    description: "Employee leave balances, recent requests, and quick actions will appear here.",
    group: "employee",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/leaves/apply",
    label: "Apply Leave",
    description: "The leave application form shell will live here.",
    group: "employee",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/leaves/my-requests",
    label: "My Requests",
    description: "A personal leave request list and status tracker will appear here.",
    group: "employee",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/leaves/holiday-calendar",
    label: "Holiday Calendar",
    description: "Published holidays and calendar filters will appear here.",
    group: "employee",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/leaves/comp-offs",
    label: "Comp Offs",
    description: "Comp-off balance and request placeholders will appear here.",
    group: "employee",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    path: "/leaves/approvals",
    label: "Approvals",
    description: "Manager approval queues will appear here.",
    group: "manager",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/leaves/team-calendar",
    label: "Team Calendar",
    description: "Team leave visibility and calendar overlays will appear here.",
    group: "manager",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/leaves/team-summary",
    label: "Team Summary",
    description: "Team leave summaries and trends will appear here.",
    group: "manager",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    path: "/leaves/hr/requests",
    label: "HR Requests",
    description: "HR-wide leave request administration will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/hr/balances",
    label: "HR Balances",
    description: "Leave balance review and correction tools will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/hr/adjustments",
    label: "Adjustments",
    description: "Manual leave adjustment workflows will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/hr/lop-review",
    label: "LOP Review",
    description: "Loss-of-pay review queues will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/hr/payroll-inputs",
    label: "Payroll Inputs",
    description: "Leave-related payroll input exports and checks will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/hr/reports",
    label: "Reports",
    description: "HR leave reports and download actions will appear here.",
    group: "hr",
    roles: ["ADMIN", "HR"],
  },
  {
    path: "/leaves/admin/leave-types",
    label: "Leave Types",
    description: "Admin leave type setup will appear here.",
    group: "admin",
    roles: ["ADMIN"],
  },
  {
    path: "/leaves/admin/policies",
    label: "Policies",
    description: "Leave policy configuration shells will appear here.",
    group: "admin",
    roles: ["ADMIN"],
  },
  {
    path: "/leaves/admin/holiday-calendars",
    label: "Holiday Calendars",
    description: "Holiday calendar configuration will appear here.",
    group: "admin",
    roles: ["ADMIN"],
  },
  {
    path: "/leaves/admin/work-calendars",
    label: "Work Calendars",
    description: "Work calendar setup and assignment shells will appear here.",
    group: "admin",
    roles: ["ADMIN"],
  },
  {
    path: "/leaves/admin/workflows",
    label: "Workflows",
    description: "Leave approval workflow configuration will appear here.",
    group: "admin",
    roles: ["ADMIN"],
  },
];

export const leaveGroupLabels: Record<LeaveRouteGroup, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
  admin: "Admin",
};
