import { describe, expect, it } from "vitest";
import type { AppRole } from "../../src/auth/authTypes";
import {
  getLeaveRouteById,
  getLeaveRouteByPath,
  getLeaveRouteGroupAllowedRoles,
  getVisibleLeaveRoutes,
  leaveRoutes,
} from "../../src/pages/leave/leaveRoutes";

function user(roles: AppRole[], permissions: string[] = []) {
  return { roles, permissions };
}

describe("leaveRoutes", () => {
  it("finds routes by path and id", () => {
    expect(getLeaveRouteByPath("/leaves/my-requests")?.id).toBe("myRequests");
    expect(getLeaveRouteById("managerApprovals")?.path).toBe("/leaves/approvals");
  });

  it("filters visible routes by group", () => {
    const routes = getVisibleLeaveRoutes(user(["MANAGER"]), "manager");

    expect(routes.map((route) => route.id)).toEqual([
      "managerApprovals",
      "teamCalendar",
      "teamSummary",
    ]);
  });

  it("respects role metadata", () => {
    const employeeRoutes = getVisibleLeaveRoutes(user(["EMPLOYEE"]));
    const managerRoutes = getVisibleLeaveRoutes(user(["MANAGER"]));

    expect(employeeRoutes.some((route) => route.id === "managerApprovals")).toBe(false);
    expect(managerRoutes.some((route) => route.id === "managerApprovals")).toBe(true);
  });

  it("keeps placeholder routes identified in metadata", () => {
    expect(getLeaveRouteById("teamCalendar")?.isImplemented).toBe(false);
    expect(getLeaveRouteById("myDashboard")?.isImplemented).toBe(true);
  });

  it("keeps important paths unchanged", () => {
    expect(leaveRoutes.map((route) => route.path)).toContain("/leaves/my-dashboard");
    expect(leaveRoutes.map((route) => route.path)).toContain("/leaves/comp-offs");
    expect(leaveRoutes.map((route) => route.path)).toContain("/leaves/admin/workflows");
  });
});

describe("getLeaveRouteGroupAllowedRoles", () => {
  it("returns the same roles as the previous hardcoded employee group array", () => {
    const roles = getLeaveRouteGroupAllowedRoles("employee");
    expect(roles.sort()).toEqual(["ADMIN", "EMPLOYEE", "HR", "MANAGER"].sort());
  });

  it("returns the same roles as the previous hardcoded manager group array", () => {
    const roles = getLeaveRouteGroupAllowedRoles("manager");
    expect(roles.sort()).toEqual(["ADMIN", "MANAGER"].sort());
  });

  it("returns the same roles as the previous hardcoded hr group array", () => {
    const roles = getLeaveRouteGroupAllowedRoles("hr");
    expect(roles.sort()).toEqual(["ADMIN", "HR"].sort());
  });

  it("returns the same roles as the previous hardcoded admin group array", () => {
    const roles = getLeaveRouteGroupAllowedRoles("admin");
    expect(roles.sort()).toEqual(["ADMIN"].sort());
  });

  it("returns no duplicate roles in any group", () => {
    const groups = ["employee", "manager", "hr", "admin"] as const;
    for (const group of groups) {
      const roles = getLeaveRouteGroupAllowedRoles(group);
      expect(roles.length).toBe(new Set(roles).size);
    }
  });
});
