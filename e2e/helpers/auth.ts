import type { Page } from "@playwright/test";

const AUTH_STORAGE_KEY = "hrms.auth.session";

export type E2ERole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

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
  permissions = [
    "EMPLOYEE_READ",
    "PAYROLL_READ",
    "PAYROLL_WRITE",
    "REPORT_READ",
    "SETTINGS_READ",
  ],
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
    tenantId,
    branchId,
    fiscalYearId,
    expiresAt: Date.now() + 3600 * 1000,
    user: {
      userId: "user-1",
      tenantId: "tenant-1",
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
  return createMockSession();
}

// export async function mockLogoutApi(page: Page) {
//   await page.route("**/api/auth/logout", async (route) => {
//     await route.fulfill({
//       status: 200,
//       contentType: "application/json",
//       body: JSON.stringify({ success: true }),
//     });
//   });
// }

export async function mockAllApis(page: Page) {
  // 1. Generic catch-all for all API requests
  await page.route(
    "https://pnc-hr.auvitapps.com:7091/api/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    },
  );

  // 2. Mock profile API specifically so getProfile returns a valid structure
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

  // 3. Mock refresh token API
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
            expiresIn: 3600,
          },
        }),
      });
    },
  );

  // 4. Mock company settings API
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
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Company settings saved successfully!",
            data: {},
          }),
        });
      }
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
  session = createMockSession(),
) {
  await mockAllApis(page);

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: AUTH_STORAGE_KEY, value: session },
  );

  return session;
}
