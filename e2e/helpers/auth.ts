import type { Page } from "@playwright/test";

const AUTH_STORAGE_KEY = "hrms.auth.session";

export type E2ERole =
  | "ADMIN"
  | "HR"
  | "MANAGER"
  | "EMPLOYEE"
  | "ESS";

const ADMIN_PERMISSIONS = [
  // Employee
  "EMPLOYEE_READ",
  "EMPLOYEE_WRITE",

  // Payroll
  "PAYROLL_READ",
  "PAYROLL_WRITE",

  // Reports
  "REPORT_READ",

  // Settings
  "SETTINGS_READ",
  "SETTINGS_WRITE",

  // Company settings
  "COMPANY_SETTINGS_READ",
  "COMPANY_SETTINGS_WRITE",

  // Onboarding
  // "ONBOARDING_READ",
  // "ONBOARDING_WRITE",
  // "EMPLOYEE_ONBOARDING_READ",
  // "EMPLOYEE_ONBOARDING_WRITE",

  // Also keep lowercase variants in case
  // the onboarding module checks these names.
  // "onboarding:read",
  // "onboarding:write",
  // "employee:read",
  // "employee:write",
];

type MockSessionOptions = {
  roles?: E2ERole[];
  permissions?: string[];
  email?: string;
  tenantId?: string;
  branchId?: string;
  fiscalYearId?: string;
};

export function createMockSession({
  roles = ["ADMIN"],
  permissions = ADMIN_PERMISSIONS,
  email = "admin@company.com",
  tenantId = "tenant-1",
  branchId = "branch-1",
  fiscalYearId = "fy-2026",
}: MockSessionOptions = {}) {
  return {
    accessToken: "e2e-access-token",
    refreshToken: "e2e-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    expiresAt: Date.now() + 3600 * 1000,

    tenantId,
    branchId,
    fiscalYearId,

    user: {
      userId: "user-1",
      id: "user-1",

      tenantId,
      branchId,
      fiscalYearId,

      email,

      roles,
      rawRoles: roles,

      permissions,
    },

    company: {
      companyId: "company-1",
      companyName: "Test Company",
      logoUrl: "",
    },
  };
}

export function createMockAdminSession() {
  return createMockSession({
    roles: ["ADMIN"],
    permissions: ADMIN_PERMISSIONS,
  });
}

export async function mockLogoutApi(page: Page) {
  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
      }),
    });
  });
}

export async function mockAllApis(page: Page) {
  /*
   * IMPORTANT:
   * Register the generic fallback first.
   * Specific routes below can override it.
   */

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    },
  );

  // --------------------------------------------------
  // AUTH SESSION
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/auth/session",
    async (route) => {
      const session = createMockAdminSession();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            authenticated: true,

            user: {
              ...session.user,
            },

            accessToken: session.accessToken,
            refreshToken: session.refreshToken,

            tenantId: session.tenantId,
            branchId: session.branchId,
            fiscalYearId: session.fiscalYearId,
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // AUTH ME
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/auth/me**",
    async (route) => {
      const session = createMockAdminSession();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "user-1",
            userId: "user-1",
            email: session.user.email,

            roles: ["ADMIN"],
            rawRoles: ["ADMIN"],

            permissions: ADMIN_PERMISSIONS,

            tenantId: session.tenantId,
            branchId: session.branchId,
            fiscalYearId: session.fiscalYearId,
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // PERMISSIONS
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/permissions**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            permissions: ADMIN_PERMISSIONS,
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // AUTH CONTEXT
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/auth/context**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            branchAssociated: true,

            assignedBranchId: "branch-1",

            branches: [
              {
                id: "branch-1",
                name: "Main Branch",
              },
            ],

            fiscalYears: [
              {
                id: "fy-2026",
                label: "2026",
                active: true,
              },
            ],

            activeFiscalYearId: "fy-2026",

            tenantId: "tenant-1",
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // PROFILE
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/auth/profile",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "emp-100",
            employeeId: "emp-100",
            userId: "user-1",
            email: "admin@company.com",

            employee: {
              id: "emp-100",
              employeeId: "emp-100",
              userId: "user-1",
            },
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // REFRESH TOKEN
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/auth/refresh-token",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: "e2e-access-token",
            refreshToken: "e2e-refresh-token",
            expiresIn: 3600,

            tenantId: "tenant-1",
            branchId: "branch-1",
            fiscalYearId: "fy-2026",
          },
        }),
      });
    },
  );

  // --------------------------------------------------
  // COMPANY SETTINGS
  // --------------------------------------------------

  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/org/company/**",
    async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "3ddb07c5-45ab-4ab5-ba45-e3f3f6874e14",
              companyName: "VibeHR Solutions",
              companyAddress: "123 Main Street",
              email: "info@vibehr.com",
              phoneNo: "9876543210",
              gstNo: "22AAAAA1234F1ZO",
              companyType: "Head Office",
              countryId: "country-1",
              stateId: "state-1",
              cityId: "city-1",
              pincode: "400001",
            },
          }),
        });

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Company settings saved successfully!",
          data: {},
        }),
      });
    },
  );
}

export async function loginAsAdmin(page: Page) {
  const session = createMockAdminSession();

  await seedAuthSession(page, session);

  return session;
}

export async function seedAuthSession(
  page: Page,
  session = createMockAdminSession(),
) {
  // Register routes before navigation.
  await mockAllApis(page);

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    {
      key: AUTH_STORAGE_KEY,
      value: session,
    },
  );

  return session;
}