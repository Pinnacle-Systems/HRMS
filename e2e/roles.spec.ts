import { expect, test } from "@playwright/test";
import {
  createMockSession,
  seedAuthSession,
  type E2ERole,
} from "./helpers/auth";

type RoleScenario = {
  name: string;
  roles: E2ERole[];
  expectedDashboard: RegExp;
  workspaceLabel: string;
  visibleNav: string[];
};

const roleScenarios: RoleScenario[] = [
  {
    name: "ADMIN",
    roles: ["ADMIN"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "HR",
    roles: ["HR"],
    expectedDashboard: /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "MANAGER",
    roles: ["MANAGER"],
    expectedDashboard: /\/manager\/dashboard$/,
    workspaceLabel: "Manager Workspace",
    visibleNav: ["Home", "Leave"],
  },
  {
    name: "EMPLOYEE",
    roles: ["EMPLOYEE"],
    expectedDashboard: /\/employee\/dashboard$/,
    workspaceLabel: "Employee Portal",
    visibleNav: ["Home", "Leave"],
  },
  {
    name: "ADMIN_HR",
    roles: ["ADMIN", "HR"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "ADMIN_MANAGER",
    roles: ["ADMIN", "MANAGER"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "ADMIN_EMPLOYEE",
    roles: ["ADMIN", "EMPLOYEE"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "HR_MANAGER",
    roles: ["HR", "MANAGER"],
    expectedDashboard: /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "HR_EMPLOYEE",
    roles: ["HR", "EMPLOYEE"],
    expectedDashboard: /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "MANAGER_EMPLOYEE",
    roles: ["MANAGER", "EMPLOYEE"],
    expectedDashboard: /\/manager\/dashboard$/,
    workspaceLabel: "Manager Workspace",
    visibleNav: ["Home", "Leave"],
  },
  {
    name: "ADMIN_HR_MANAGER",
    roles: ["ADMIN", "HR", "MANAGER"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "ADMIN_HR_EMPLOYEE",
    roles: ["ADMIN", "HR", "EMPLOYEE"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "ADMIN_MANAGER_EMPLOYEE",
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "HR_MANAGER_EMPLOYEE",
    roles: ["HR", "MANAGER", "EMPLOYEE"],
    expectedDashboard: /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
  {
    name: "ADMIN_HR_MANAGER_EMPLOYEE",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    expectedDashboard: /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav: [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ],
  },
];

const allNavItems = [
  "Home",
  "Employees",
  "Leave",
  "Attendance",
  "Payroll",
  "Settings",
];

const protectedRoutes = [
  {
    path: "/admin/dashboard",
    content: "Welcome back, Admin!",
    allowedRoles: ["ADMIN"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/hr/dashboard",
    content: "Welcome back, Admin!",
    allowedRoles: ["HR"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/manager/dashboard",
    content: "Welcome back, Admin!",
    allowedRoles: ["MANAGER"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/employee/dashboard",
    content: "Welcome back, Admin!",
    allowedRoles: ["EMPLOYEE"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/employees",
    content: "Employees",
    allowedRoles: ["ADMIN", "HR"] as E2ERole[],
    requiredPermissions: ["EMPLOYEE_READ"],
  },
  {
    path: "/leaves/my-dashboard",
    content: "My Leave",
    allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/attendance/shifts",
    content: "Shift Management",
    allowedRoles: ["ADMIN", "HR"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/payroll",
    content: "Payroll",
    allowedRoles: ["ADMIN", "HR"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
  {
    path: "/settings",
    content: "Company Settings",
    allowedRoles: ["ADMIN", "HR"] as E2ERole[],
    requiredPermissions: [] as string[],
  },
];

function hasAnyRole(userRoles: E2ERole[], allowedRoles: E2ERole[]) {
  return allowedRoles.some((role) => userRoles.includes(role));
}

function hasPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
) {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
}

function getSettingsRedirectPath(roles: E2ERole[]) {
  return roles.includes("ADMIN")
    ? "/settings/general/company-settings"
    : "/settings/general/audit-logs";
}

function getExpectedRouteContent(
  route: { path: string; content: string },
  roles: E2ERole[],
) {
  if (route.path === "/settings") {
    return roles.includes("ADMIN") ? "Company Settings" : "Audit Logs";
  }
  return route.content;
}

test.describe("role and permission access matrix", () => {
  for (const scenario of roleScenarios) {
    test(`${scenario.name} uses highest-priority dashboard and combined nav`, async ({
      page,
    }) => {
      await seedAuthSession(
        page,
        createMockSession({
          roles: scenario.roles,
          permissions: ["EMPLOYEE_READ"],
          email: `${scenario.name.toLowerCase()}@company.com`,
          tenantId: "tenant-1",
          branchId: "branch-1",
          fiscalYearId: "fy-2026",
        }),
      );

      await page.goto("/");

      await expect(page).toHaveURL(scenario.expectedDashboard);
      await expect(page.getByText(scenario.workspaceLabel)).toBeVisible();

      await page.getByLabel("open drawer").click();

      for (const item of allNavItems) {
        //  const locator = item === "Payroll"
        //   ? page.getByRole("button", { name: "Payroll" }).or(page.getByText("Payroll", { exact: true }))
        //   : page.getByText(item, { exact: true });

        // const assertion = expect(locator.first());

        // if (scenario.visibleNav.includes(item)) {
        //   await assertion.toBeVisible();
        // } else {
        //   // For hidden items, check they don't exist
        //   await expect(page.getByText(item, { exact: true })).toHaveCount(0);
        // }

        const assertion = expect(page.getByText(item, { exact: true }));

        if (scenario.visibleNav.includes(item)) {
          await assertion.toBeVisible();
        } else {
          await assertion.toHaveCount(0);
        }
      }
    });
  }

  for (const scenario of roleScenarios) {
    for (const route of protectedRoutes) {
      test(`${scenario.name} ${route.path} route access`, async ({ page }) => {
        const permissions = ["EMPLOYEE_READ"];
        const isAllowed =
          hasAnyRole(scenario.roles, route.allowedRoles) &&
          hasPermissions(permissions, route.requiredPermissions);

        await seedAuthSession(
          page,
          createMockSession({
            roles: scenario.roles,
            permissions,
            email: `${scenario.name.toLowerCase()}@company.com`,
            tenantId: "tenant-1",
            branchId: "branch-1",
            fiscalYearId: "fy-2026",
          }),
        );

        await page.goto(route.path);

        if (isAllowed) {
          const expectedPath =
            route.path === "/settings"
              ? getSettingsRedirectPath(scenario.roles)
              : route.path;

          await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
          await expect(
            page
              .getByRole("main")
              .getByText(getExpectedRouteContent(route, scenario.roles))
              .first(),
          ).toBeVisible();
        } else {
          await expect(page).toHaveURL(/\/unauthorized$/);
          await expect(
            page.getByText("Unable to determine access"),
          ).toBeVisible();
        }
      });
    }
  }

  test("HR without employee permission cannot see or open employees", async ({
    page,
  }) => {
    await seedAuthSession(
      page,
      createMockSession({
        roles: ["HR"],
        permissions: [],
        email: "hr-no-permission@company.com",
        tenantId: "tenant-1",
        branchId: "branch-1",
        fiscalYearId: "fy-2026",
      }),
    );

    await page.goto("/hr/dashboard");
    await page.getByLabel("open drawer").click();

    await expect(page.getByText("Employees")).toHaveCount(0);

    await page.goto("/employees");
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByText("Unable to determine access")).toBeVisible();
  });
});
