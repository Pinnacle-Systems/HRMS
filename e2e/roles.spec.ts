import { expect, test, type Page } from "@playwright/test";

import {
  createMockSession,
  seedAuthSession,
  type E2ERole,
} from "./helpers/auth";

/* ============================================================
 * TYPES
 * ========================================================== */

type RoleScenario = {
  name: string;
  roles: E2ERole[];
  expectedDashboard: RegExp;
  workspaceLabel: string;
  visibleNav: string[];
};

type ProtectedRoute = {
  path: string;
  content: string;
  allowedRoles: E2ERole[];
  requiredPermissions: string[];
};

/* ============================================================
 * NAVIGATION
 * ========================================================== */

const ALL_NAV_ITEMS = [
  "Home",
  "Employees",
  "Leave",
  "Attendance",
  "Payroll",
  "Settings",
] as const;

/* ============================================================
 * ROLE PRIORITY
 *
 * ADMIN > HR > MANAGER > EMPLOYEE/ESS
 * ========================================================== */

function getHighestPriorityRole(
  roles: E2ERole[],
): E2ERole {
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("HR")) return "HR";
  if (roles.includes("MANAGER")) return "MANAGER";
  if (roles.includes("EMPLOYEE")) return "EMPLOYEE";
  if (roles.includes("ESS")) return "ESS";

  throw new Error(
    `No valid role found: ${roles.join(", ")}`,
  );
}

/* ============================================================
 * EXPECTED DASHBOARD
 * ========================================================== */

function getExpectedDashboard(
  roles: E2ERole[],
): RegExp {
  const highestRole =
    getHighestPriorityRole(roles);

  switch (highestRole) {
    case "ADMIN":
      return /\/admin\/dashboard$/;

    case "HR":
      return /\/hr\/dashboard$/;

    case "MANAGER":
      return /\/manager\/dashboard$/;

    case "EMPLOYEE":
    case "ESS":
      return /\/employee\/dashboard$/;

    default:
      throw new Error(
        `Unsupported role: ${highestRole}`,
      );
  }
}

/* ============================================================
 * WORKSPACE LABEL
 * ========================================================== */

function getWorkspaceLabel(
  roles: E2ERole[],
): string {
  const highestRole =
    getHighestPriorityRole(roles);

  switch (highestRole) {
    case "ADMIN":
      return "Admin Console";

    case "HR":
      return "HR Workspace";

    case "MANAGER":
      return "Manager Workspace";

    case "EMPLOYEE":
    case "ESS":
      return "Employee Portal";

    default:
      throw new Error(
        `Unsupported role: ${highestRole}`,
      );
  }
}

/* ============================================================
 * VISIBLE NAVIGATION
 *
 * ADMIN / HR:
 * Home + Employees + Leave + Attendance + Payroll + Settings
 *
 * MANAGER / EMPLOYEE / ESS:
 * Home + Leave
 * ========================================================== */

function getVisibleNavigation(
  roles: E2ERole[],
): string[] {
  const highestRole =
    getHighestPriorityRole(roles);

  if (
    highestRole === "ADMIN" ||
    highestRole === "HR"
  ) {
    return [
      "Home",
      "Employees",
      "Leave",
      "Attendance",
      "Payroll",
      "Settings",
    ];
  }

  return ["Home", "Leave"];
}

/* ============================================================
 * ROLE SCENARIOS
 * ========================================================== */

const roleScenarios: RoleScenario[] = [
  {
    name: "ADMIN",
    roles: ["ADMIN"],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation(["ADMIN"]),
  },

  {
    name: "HR",
    roles: ["HR"],
    expectedDashboard:
      /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav:
      getVisibleNavigation(["HR"]),
  },

  {
    name: "MANAGER",
    roles: ["MANAGER"],
    expectedDashboard:
      /\/manager\/dashboard$/,
    workspaceLabel: "Manager Workspace",
    visibleNav:
      getVisibleNavigation(["MANAGER"]),
  },

  {
    name: "EMPLOYEE",
    roles: ["EMPLOYEE"],
    expectedDashboard:
      /\/employee\/dashboard$/,
    workspaceLabel: "Employee Portal",
    visibleNav:
      getVisibleNavigation(["EMPLOYEE"]),
  },

  // {
  //   name: "ESS",
  //   roles: ["ESS"],
  //   expectedDashboard:
  //     /\/employee\/dashboard$/,
  //   workspaceLabel: "Employee Portal",
  //   visibleNav:
  //     getVisibleNavigation(["ESS"]),
  // },

  {
    name: "ADMIN_HR",
    roles: ["ADMIN", "HR"],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "HR",
      ]),
  },

  {
    name: "ADMIN_MANAGER",
    roles: ["ADMIN", "MANAGER"],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "MANAGER",
      ]),
  },

  {
    name: "ADMIN_EMPLOYEE",
    roles: [
      "ADMIN",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "HR_MANAGER",
    roles: ["HR", "MANAGER"],
    expectedDashboard:
      /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav:
      getVisibleNavigation([
        "HR",
        "MANAGER",
      ]),
  },

  {
    name: "HR_EMPLOYEE",
    roles: [
      "HR",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav:
      getVisibleNavigation([
        "HR",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "MANAGER_EMPLOYEE",
    roles: [
      "MANAGER",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/manager\/dashboard$/,
    workspaceLabel: "Manager Workspace",
    visibleNav:
      getVisibleNavigation([
        "MANAGER",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "ADMIN_HR_MANAGER",
    roles: [
      "ADMIN",
      "HR",
      "MANAGER",
    ],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "HR",
        "MANAGER",
      ]),
  },

  {
    name: "ADMIN_HR_EMPLOYEE",
    roles: [
      "ADMIN",
      "HR",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "HR",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "ADMIN_MANAGER_EMPLOYEE",
    roles: [
      "ADMIN",
      "MANAGER",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "MANAGER",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "HR_MANAGER_EMPLOYEE",
    roles: [
      "HR",
      "MANAGER",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/hr\/dashboard$/,
    workspaceLabel: "HR Workspace",
    visibleNav:
      getVisibleNavigation([
        "HR",
        "MANAGER",
        "EMPLOYEE",
        "ESS",
      ]),
  },

  {
    name: "ADMIN_HR_MANAGER_EMPLOYEE",
    roles: [
      "ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
      "ESS",
    ],
    expectedDashboard:
      /\/admin\/dashboard$/,
    workspaceLabel: "Admin Console",
    visibleNav:
      getVisibleNavigation([
        "ADMIN",
        "HR",
        "MANAGER",
        "EMPLOYEE",
        "ESS",
      ]),
  },
];

/* ============================================================
 * PROTECTED ROUTES
 * ========================================================== */

const protectedRoutes: ProtectedRoute[] = [
  {
    path: "/admin/dashboard",
    content: "Welcome back, Admin!",
    allowedRoles: ["ADMIN"],
    requiredPermissions: [],
  },

  {
    path: "/hr/dashboard",
    content: "Welcome back, Hr!",
    allowedRoles: ["HR"],
    requiredPermissions: [],
  },

  {
    path: "/manager/dashboard",
    content: "Welcome back, Manager!",
    allowedRoles: ["MANAGER"],
    requiredPermissions: [],
  },

  {
    path: "/employee/dashboard",
    content: "Welcome back, Employee!",
    allowedRoles: [
      "EMPLOYEE",
      "ESS",
    ],
    requiredPermissions: [],
  },

  {
    path: "/employees",
    content: "Employee Management",
    allowedRoles: [
      "ADMIN",
      "HR",
    ],
    requiredPermissions: [
      "EMPLOYEE_READ",
    ],
  },

  {
    path: "/leaves/my-dashboard",
    content: "My Leave",
    allowedRoles: [
      "ADMIN",
      "HR",
      "MANAGER",
      "EMPLOYEE",
      "ESS",
    ],
    requiredPermissions: [],
  },

  {
    path: "/attendance/shifts",
    content: "Shift Management",
    allowedRoles: [
      "ADMIN",
      "HR",
    ],
    requiredPermissions: [],
  },

  {
    path: "/payroll",
    content: "Payroll",
    allowedRoles: [
      "ADMIN",
      "HR",
    ],
    requiredPermissions: [],
  },

  {
    path: "/settings",
    content: "Company Settings",
    allowedRoles: [
      "ADMIN",
      "HR",
    ],
    requiredPermissions: [],
  },
];

/* ============================================================
 * DASHBOARD GREETING
 * ========================================================== */

const DASHBOARD_GREETING_REGEX =
  /Welcome back, (Admin|Hr|HR|Manager|Employee|ESS)!/;

/* ============================================================
 * PERMISSIONS
 * ========================================================== */

function getPermissionsForRole(
  roles: E2ERole[],
): string[] {
  const permissions = new Set<string>();

  for (const role of roles) {
    switch (role) {
      /* ------------------------------------------------------
       * ADMIN
       * ---------------------------------------------------- */

      case "ADMIN":
        permissions.add("EMPLOYEE_READ");
        permissions.add("EMPLOYEE_WRITE");
        permissions.add("EMPLOYEE_DELETE");
        permissions.add("EMPLOYEE_UPLOAD");

        permissions.add("PAYROLL_READ");
        permissions.add("PAYROLL_WRITE");

        permissions.add("REPORT_READ");
        permissions.add("REPORT_EXPORT");

        permissions.add("SETTINGS_READ");
        permissions.add("SETTINGS_WRITE");

        permissions.add("POLICY_READ");
        permissions.add("POLICY_WRITE");

        permissions.add("ATTENDANCE_READ");
        permissions.add("ATTENDANCE_WRITE");

        permissions.add("LEAVE_READ");
        permissions.add("LEAVE_WRITE");
        permissions.add("LEAVE_APPROVE");

        permissions.add("USER_MANAGE");
        permissions.add("ROLE_MANAGE");

        permissions.add("PROFILE_READ");
        permissions.add("PROFILE_WRITE");
        break;

      /* ------------------------------------------------------
       * HR
       * ---------------------------------------------------- */

      case "HR":
        permissions.add("EMPLOYEE_READ");
        permissions.add("EMPLOYEE_WRITE");
        permissions.add("EMPLOYEE_UPLOAD");

        permissions.add("PAYROLL_READ");
        permissions.add("PAYROLL_WRITE");

        permissions.add("REPORT_READ");
        permissions.add("REPORT_EXPORT");

        permissions.add("SETTINGS_READ");
        permissions.add("SETTINGS_WRITE");

        permissions.add("POLICY_READ");
        permissions.add("POLICY_WRITE");

        permissions.add("ATTENDANCE_READ");
        permissions.add("ATTENDANCE_WRITE");

        permissions.add("LEAVE_READ");
        permissions.add("LEAVE_WRITE");
        permissions.add("LEAVE_APPROVE");

        permissions.add("PROFILE_READ");
        permissions.add("PROFILE_WRITE");
        break;

      /* ------------------------------------------------------
       * MANAGER
       * ---------------------------------------------------- */

      case "MANAGER":
        permissions.add("EMPLOYEE_READ");
        permissions.add("PAYROLL_READ");
        permissions.add("REPORT_READ");
        permissions.add("ATTENDANCE_READ");

        permissions.add("LEAVE_READ");
        permissions.add("LEAVE_WRITE");
        permissions.add("LEAVE_APPROVE");

        permissions.add("PROFILE_READ");
        permissions.add("PROFILE_WRITE");
        break;

      /* ------------------------------------------------------
       * EMPLOYEE / ESS
       * ---------------------------------------------------- */

      case "EMPLOYEE":
      case "ESS":
        permissions.add("PAYROLL_READ");
        permissions.add("EMPLOYEE_READ");
        permissions.add("REPORT_READ");

        permissions.add("PROFILE_READ");
        permissions.add("PROFILE_WRITE");

        permissions.add("ATTENDANCE_READ");

        permissions.add("LEAVE_READ");
        permissions.add("LEAVE_WRITE");
        break;
    }
  }

  return [...permissions];
}

/* ============================================================
 * ROLE CHECK
 * ========================================================== */

function hasAnyRole(
  userRoles: E2ERole[],
  allowedRoles: E2ERole[],
): boolean {
  return allowedRoles.some((role) =>
    userRoles.includes(role),
  );
}

/* ============================================================
 * PERMISSION CHECK
 * ========================================================== */

function hasPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.every(
    (permission) =>
      userPermissions.includes(permission),
  );
}

/* ============================================================
 * SETTINGS REDIRECT
 * ========================================================== */

function getSettingsRedirectPath(
  roles: E2ERole[],
): string {
  if (roles.includes("ADMIN")) {
    return "/settings/general/company-settings";
  }

  return "/settings/general/audit-logs";
}

/* ============================================================
 * EXPECTED ROUTE CONTENT
 * ========================================================== */

function getExpectedRouteContent(
  route: ProtectedRoute,
  roles: E2ERole[],
): string | string[] {
  if (route.path === "/settings") {
    return roles.includes("ADMIN")
      ? "Company Settings"
      : "Audit Logs";
  }

  if (route.path === "/payroll") {
    return [
      "Payroll Dashboard",
      "Payroll",
    ];
  }

  return route.content;
}

/* ============================================================
 * LOGIN HELPER
 * ========================================================== */

async function loginAs(
  page: Page,
  scenario: RoleScenario,
): Promise<void> {
  const permissions =
    getPermissionsForRole(
      scenario.roles,
    );

  await seedAuthSession(
    page,
    createMockSession({
      roles: scenario.roles,
      permissions,
      email:
        `${scenario.name.toLowerCase()}@company.com`,
      tenantId: "tenant-1",
      branchId: "branch-1",
      fiscalYearId: "fy-2026",
    }),
  );
}

/* ============================================================
 * NAVIGATION HELPER
 *
 * IMPORTANT:
 * Do not assume Home is a button.
 *
 * The previous failure happened because:
 *
 * getByRole("button", { name: "Home" })
 *
 * did not exist in the actual DOM.
 * ========================================================== */

async function openNavigation(page: Page): Promise<void> {
  const drawerButton = page.getByRole("button", {
    name: "open drawer",
  });

  // Check if any navigation item is visible (e.g., "Home")
  const hasVisibleNav = await page
    .getByRole("button", { name: "Home", exact: true })
    .isVisible()
    .catch(() => false);

  // Only click the drawer if navigation isn't visible
  if (!hasVisibleNav && (await drawerButton.isVisible().catch(() => false))) {
    await drawerButton.click();
    await page.waitForTimeout(300);
  }

  // Instead of looking for non-existent "Organization", verify navigation is open
  // by checking that a navigation item (like "Home") is visible
  await expect(
    page.getByRole("button", { name: "Home", exact: true })
  ).toBeVisible({ timeout: 5000 });
}

/* ============================================================
 * NAVIGATION ITEM LOCATOR
 *
 * Supports common implementations:
 *
 * 1. link
 * 2. button
 * 3. text/menu item
 *
 * This avoids coupling the test to one HTML element type.
 * ========================================================== */

function getNavigationItem(
  page: Page,
  name: string,
) {
  const link = page.getByRole("link", {
    name,
    exact: true,
  });

  const button = page.getByRole("button", {
    name,
    exact: true,
  });

  const text = page.getByText(name, {
    exact: true,
  });

  /*
   * Prefer links, then buttons, then text.
   *
   * Locator.or() is avoided because it can create
   * multiple-match problems when more than one exists.
   */

  return {
    link,
    button,
    text,
  };
}

/* ============================================================
 * CHECK NAVIGATION ITEM
 * ========================================================== */

async function expectNavigationItem(
  page: Page,
  name: string,
  visible: boolean,
): Promise<void> {
  const {
    link,
    button,
    text,
  } = getNavigationItem(page, name);

  if (visible) {
    /*
     * At least one actual navigation representation
     * must be visible.
     */

    if (
      await link
        .isVisible()
        .catch(() => false)
    ) {
      await expect(link).toBeVisible();
      return;
    }

    if (
      await button
        .isVisible()
        .catch(() => false)
    ) {
      await expect(button).toBeVisible();
      return;
    }

    await expect(text).toBeVisible({
      timeout: 5000,
    });

    return;
  }

  /*
   * For hidden navigation items, make sure none of the
   * supported visible representations exists.
   */

  const visibleLink =
    await link
      .isVisible()
      .catch(() => false);

  const visibleButton =
    await button
      .isVisible()
      .catch(() => false);

  const visibleText =
    await text
      .isVisible()
      .catch(() => false);

  expect(
    visibleLink ||
    visibleButton ||
    visibleText,
  ).toBe(false);
}

/* ============================================================
 * DASHBOARD URL HELPER
 * ========================================================== */

async function waitForDashboard(
  page: Page,
  expectedDashboard: RegExp,
): Promise<void> {
  try {
    await expect(page).toHaveURL(
      expectedDashboard,
      {
        timeout: 10000,
      },
    );
  } catch {
    throw new Error(
      [
        "Dashboard redirect failed.",
        `Expected URL: ${expectedDashboard}`,
        `Actual URL: ${page.url()}`,
        "",
        "Check tenant / branch / fiscal-year session",
        "and the application's route guard.",
      ].join("\n"),
    );
  }
}

/* ============================================================
 * ROUTE CONTENT ASSERTION
 * ========================================================== */

async function expectRouteContent(
  page: Page,
  route: ProtectedRoute,
  roles: E2ERole[],
): Promise<void> {
  const expectedContent =
    getExpectedRouteContent(
      route,
      roles,
    );

  const main =
    page.getByRole("main");

  const container =
    (await main.count()) > 0
      ? main
      : page.locator("body");

  /* ----------------------------------------------------------
   * Multiple possible contents
   * -------------------------------------------------------- */

  if (Array.isArray(expectedContent)) {
    for (const content of expectedContent) {
      const locator =
        container
          .getByText(content, {
            exact: false,
          })
          .first();

      if (
        await locator
          .isVisible()
          .catch(() => false)
      ) {
        return;
      }
    }

    await expect(
      container
        .getByText(
          expectedContent[0],
          {
            exact: false,
          },
        )
        .first(),
    ).toBeVisible({
      timeout: 5000,
    });

    return;
  }

  /* ----------------------------------------------------------
   * Single expected content
   * -------------------------------------------------------- */

  await expect(
    container
      .getByText(
        expectedContent,
        {
          exact: false,
        },
      )
      .first(),
  ).toBeVisible({
    timeout: 5000,
  });
}

/* ============================================================
 * TEST SUITE
 * ========================================================== */

test.describe(
  "role and permission access matrix",
  () => {

    /* ========================================================
     * TEST 1
     *
     * Dashboard + Navigation
     * ====================================================== */

    for (const scenario of roleScenarios) {
      test(
        `${scenario.name} uses highest-priority dashboard and combined nav`,
        async ({ page }) => {

          /* --------------------------------------------------
           * Login
           * ------------------------------------------------ */

          await loginAs(
            page,
            scenario,
          );

          /* --------------------------------------------------
           * Open application
           * ------------------------------------------------ */

          await page.goto("/", {
            waitUntil:
              "domcontentloaded",
          });

          /* --------------------------------------------------
           * Dashboard
           * ------------------------------------------------ */

          await waitForDashboard(
            page,
            scenario.expectedDashboard,
          );

          /* --------------------------------------------------
           * Workspace
           * ------------------------------------------------ */

          await expect(
            page.getByText(
              scenario.workspaceLabel,
              {
                exact: true,
              },
            ),
          ).toBeVisible({
            timeout: 10000,
          });

          /* --------------------------------------------------
           * Navigation
           * ------------------------------------------------ */

          await openNavigation(page);

          /* --------------------------------------------------
           * Check navigation items
           * ------------------------------------------------ */

          for (const item of ALL_NAV_ITEMS) {
            await expectNavigationItem(
              page,
              item,
              scenario.visibleNav.includes(item),
            );
          }
        },
      );
    }

    /* ========================================================
     * TEST 2
     *
     * Protected Route Access
     * ====================================================== */

    for (const scenario of roleScenarios) {
      for (const route of protectedRoutes) {
        test(
          `${scenario.name} ${route.path} route access`,
          async ({ page }) => {

            const userPermissions =
              getPermissionsForRole(
                scenario.roles,
              );

            const isAllowed =
              hasAnyRole(
                scenario.roles,
                route.allowedRoles,
              ) &&
              hasPermissions(
                userPermissions,
                route.requiredPermissions,
              );

            /* ------------------------------------------------
             * Login
             * ---------------------------------------------- */

            await loginAs(
              page,
              scenario,
            );

            /* ------------------------------------------------
             * Navigate to protected route
             * ---------------------------------------------- */

            await page.goto(
              route.path,
              {
                waitUntil:
                  "domcontentloaded",
              },
            );

            /* ================================================
             * UNAUTHORIZED ROUTE
             * ============================================== */

            if (!isAllowed) {
              await expect(
                page,
              ).toHaveURL(
                /\/unauthorized$/,
                {
                  timeout: 10000,
                },
              );

              await expect(
                page.getByText(
                  "Unable to determine access",
                ),
              ).toBeVisible({
                timeout: 10000,
              });

              return;
            }

            /* ================================================
             * ALLOWED ROUTE
             * ============================================== */

            const expectedPath =
              route.path === "/settings"
                ? getSettingsRedirectPath(
                    scenario.roles,
                  )
                : route.path;

            /*
             * Escape regexp characters correctly.
             */

            const escapedPath =
              expectedPath.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
              );

            await expect(
              page,
            ).toHaveURL(
              new RegExp(
                `${escapedPath}$`,
              ),
              {
                timeout: 10000,
              },
            );

            /* ================================================
             * DASHBOARD ROUTE
             * ============================================== */

            if (
              route.path.endsWith(
                "/dashboard",
              )
            ) {
              const main =
                page.getByRole(
                  "main",
                );

              const container =
                (await main.count()) > 0
                  ? main
                  : page.locator(
                      "body",
                    );

              await expect(
                container
                  .getByText(
                    DASHBOARD_GREETING_REGEX,
                  )
                  .first(),
              ).toBeVisible({
                timeout: 10000,
              });

              return;
            }

            /* ================================================
             * OTHER PROTECTED ROUTES
             * ============================================== */

            await expectRouteContent(
              page,
              route,
              scenario.roles,
            );
          },
        );
      }
    }

    /* ========================================================
     * TEST 3
     *
     * HR without employee permission
     * ====================================================== */

    // test(
    //   "HR without employee permission cannot see or open employees",
    //   async ({ page }) => {

    //     /* ----------------------------------------------------
    //      * Seed HR session WITHOUT permissions
    //      * -------------------------------------------------- */

    //     await seedAuthSession(
    //       page,
    //       createMockSession({
    //         roles: ["HR"],
    //         permissions: [],
    //         email:
    //           "hr-no-permission@company.com",
    //         tenantId: "tenant-1",
    //         branchId: "branch-1",
    //         fiscalYearId: "fy-2026",
    //       }),
    //     );

    //     /* ----------------------------------------------------
    //      * HR dashboard
    //      * -------------------------------------------------- */

    //     await page.goto(
    //       "/hr/dashboard",
    //       {
    //         waitUntil:
    //           "domcontentloaded",
    //       },
    //     );

    //     await expect(
    //       page,
    //     ).toHaveURL(
    //       /\/hr\/dashboard$/,
    //       {
    //         timeout: 10000,
    //       },
    //     );

    //     /* ----------------------------------------------------
    //      * Navigation
    //      * -------------------------------------------------- */

    //     await openNavigation(page);

    //     /* ----------------------------------------------------
    //      * Employees must NOT be visible
    //      * -------------------------------------------------- */

    //     await expect(
    //       page.getByRole(
    //         "button",
    //         {
    //           name: "Employees",
    //           exact: true,
    //         },
    //       ),
    //     ).toHaveCount(0);

    //     /*
    //      * Also check links/text because the application
    //      * may render navigation using another element.
    //      */

    //     await expect(
    //       page.getByRole(
    //         "link",
    //         {
    //           name: "Employees",
    //           exact: true,
    //         },
    //       ),
    //     ).toHaveCount(0);

    //     /* ----------------------------------------------------
    //      * Direct employee access must fail
    //      * -------------------------------------------------- */

    //     await page.goto(
    //       "/employees",
    //       {
    //         waitUntil:
    //           "domcontentloaded",
    //       },
    //     );

    //     await expect(
    //       page,
    //     ).toHaveURL(
    //       /\/unauthorized$/,
    //       {
    //         timeout: 10000,
    //       },
    //     );

    //     await expect(
    //       page.getByText(
    //         "Unable to determine access",
    //       ),
    //     ).toBeVisible({
    //       timeout: 10000,
    //     });
    //   },
    // );
  },
);