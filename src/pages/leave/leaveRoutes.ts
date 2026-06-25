import type { AppRole, AuthUser } from "../../auth/authTypes";

export type LeaveRouteGroup = "employee" | "manager" | "hr" | "admin";

export type LeaveRouteId =
  | "myDashboard"
  | "apply"
  | "myRequests"
  | "hrUpcomingEvents"
  | "holidayCalendar"
  | "compOffs"
  | "managerApprovals"
  | "teamCalendar"
  | "teamSummary"
  | "hrRequests"
  | "hrBalances"
  | "hrAdjustments"
  | "hrLopReview"
  | "hrPayrollInputs"
  | "hrReports"
  | "adminLeaveTypes"
  | "adminPolicies"
  | "adminHolidayCalendars"
  | "adminWorkCalendars"
  | "adminWorkflows";

export type LeaveRouteConfig = {
  id: LeaveRouteId;
  path: string;
  label: string;
  title?: string;
  description: string;
  group: LeaveRouteGroup;
  allowedRoles: AppRole[];
  requiredPermissions?: string[];
  isImplemented: boolean;
};

export const leaveRoutes: LeaveRouteConfig[] = [
  {
    id: "myDashboard",
    path: "/leaves/my-dashboard",
    label: "My Dashboard",
    title: "My Leave",
    description: "Employee leave balances, recent requests, and quick actions will appear here.",
    group: "employee",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    isImplemented: true,
  },
  {
    id: "apply",
    path: "/leaves/apply",
    label: "Apply Leave",
    description: "The leave application form shell will live here.",
    group: "employee",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    isImplemented: true,
  },
  {
    id: "myRequests",
    path: "/leaves/my-requests",
    label: "My Requests",
    title: "My Leave Requests",
    description: "A personal leave request list and status tracker will appear here.",
    group: "employee",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    isImplemented: true,
  },
  {
    id: "holidayCalendar",
    path: "/leaves/holiday-calendar",
    label: "Holiday Calendar",
    description: "Published holidays and calendar filters will appear here.",
    group: "employee",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    isImplemented: true,
  },
  {
    id: "compOffs",
    path: "/leaves/comp-offs",
    label: "Comp Offs",
    description: "Comp-off balance and request placeholders will appear here.",
    group: "employee",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    isImplemented: true,
  },
  {
    id: "managerApprovals",
    path: "/leaves/approvals",
    label: "Approvals",
    title: "Leave Approval Inbox",
    description: "Manager approval queues will appear here.",
    group: "manager",
    allowedRoles: ["ADMIN", "MANAGER"],
    isImplemented: true,
  },
  {
    id: "teamCalendar",
    path: "/leaves/team-calendar",
    label: "Team Calendar",
    description: "Team leave visibility and calendar overlays will appear here.",
    group: "manager",
    allowedRoles: ["ADMIN", "MANAGER"],
    isImplemented: true,
  },
  {
    id: "teamSummary",
    path: "/leaves/team-summary",
    label: "Team Summary",
    description: "Team leave summaries and trends will appear here.",
    group: "manager",
    allowedRoles: ["ADMIN", "MANAGER"],
    isImplemented: true,
  },
  {
    id: "hrRequests",
    path: "/leaves/hr/requests",
    label: "HR Requests",
    description: "HR-wide leave request administration will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrBalances",
    path: "/leaves/hr/balances",
    label: "HR Balances",
    description: "Leave balance review and correction tools will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrAdjustments",
    path: "/leaves/hr/adjustments",
    label: "Adjustments",
    description: "Manual leave adjustment workflows will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrLopReview",
    path: "/leaves/hr/lop-review",
    label: "LOP Review",
    description: "Loss-of-pay review queues will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrPayrollInputs",
    path: "/leaves/hr/payroll-inputs",
    label: "Payroll Inputs",
    description: "Leave-related payroll input exports and checks will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrReports",
    path: "/leaves/hr/reports",
    label: "Reports",
    description: "HR leave reports and download actions will appear here.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "hrUpcomingEvents",
    path: "/leaves/hr/upcoming-events",
    label: "Upcoming Events",
    description: "View your upcoming approved leaves and company holidays in one place.",
    group: "hr",
    allowedRoles: ["ADMIN", "HR"],
    isImplemented: true,
  },
  {
    id: "adminLeaveTypes",
    path: "/leaves/admin/leave-types",
    label: "Leave Types",
    description: "Admin leave type setup will appear here.",
    group: "admin",
    allowedRoles: ["ADMIN"],
    isImplemented: true,
  },
  // {
  //   id: "adminPolicies",
  //   path: "/leaves/admin/policies",
  //   label: "Policies",
  //   description: "Leave policy configuration shells will appear here.",
  //   group: "admin",
  //   allowedRoles: ["ADMIN"],
  //   isImplemented: true,
  // },
  {
    id: "adminHolidayCalendars",
    path: "/leaves/admin/holiday-calendars",
    label: "Holiday Calendars",
    description: "Holiday calendar configuration will appear here.",
    group: "admin",
    allowedRoles: ["ADMIN"],
    isImplemented: true,
  },
  {
    id: "adminWorkCalendars",
    path: "/leaves/admin/work-calendars",
    label: "Work Calendars",
    description: "Work calendar setup and assignment shells will appear here.",
    group: "admin",
    allowedRoles: ["ADMIN"],
    isImplemented: true,
  },
  {
    id: "adminWorkflows",
    path: "/leaves/admin/workflows",
    label: "Workflows",
    description: "Leave approval workflow configuration will appear here.",
    group: "admin",
    allowedRoles: ["ADMIN"],
    isImplemented: true,
  },
];

export const leaveGroupLabels: Record<LeaveRouteGroup, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
  admin: "Admin",
};

export function getLeaveRouteByPath(path: string) {
  return leaveRoutes.find((route) => route.path === path);
}

export function getLeaveRouteById(id: LeaveRouteId) {
  return leaveRoutes.find((route) => route.id === id);
}

export function getLeaveRoutesByGroup(group: LeaveRouteGroup) {
  return leaveRoutes.filter((route) => route.group === group);
}

export function isLeaveRouteVisibleForUser(
  route: LeaveRouteConfig,
  user?: Pick<AuthUser, "roles" | "permissions"> | null,
) {
  if (!user) return false;

  const hasRole = route.allowedRoles.some((role) => user.roles.includes(role));
  const hasPermission =
    !route.requiredPermissions?.length ||
    route.requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

  return hasRole && hasPermission;
}

export function getVisibleLeaveRoutes(
  user?: Pick<AuthUser, "roles" | "permissions"> | null,
  group?: LeaveRouteGroup,
) {
  return leaveRoutes.filter(
    (route) =>
      (!group || route.group === group) &&
      isLeaveRouteVisibleForUser(route, user),
  );
}

export function getLeaveRouteGroupAllowedRoles(group: LeaveRouteGroup): AppRole[] {
  return Array.from(
    new Set(getLeaveRoutesByGroup(group).flatMap((route) => route.allowedRoles)),
  );
}
