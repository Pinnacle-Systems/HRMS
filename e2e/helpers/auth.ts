import type { Page } from "@playwright/test";

const AUTH_STORAGE_KEY = "hrms.auth.session";

export function createMockAdminSession() {
  return {
    accessToken: "e2e-access-token",
    refreshToken: "e2e-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    expiresAt: Date.now() + 3600 * 1000,
    user: {
      userId: "user-1",
      tenantId: "tenant-1",
      email: "admin@company.com",
      roles: ["ADMIN"],
      rawRoles: ["ADMIN"],
      permissions: ["EMPLOYEE_READ"],
    },
  };
}

export async function mockLogoutApi(page: Page) {
  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

export async function loginAsAdmin(page: Page) {
  const session = createMockAdminSession();

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: AUTH_STORAGE_KEY, value: session },
  );

  return session;
}
