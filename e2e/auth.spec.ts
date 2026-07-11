import { expect, test } from "@playwright/test";

function createJwt(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload))
    .toString("base64url");

  return `header.${encodedPayload}.signature`;
}

test.describe("public auth flow", () => {
  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("protected routes redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("multi-tenant login selects a company through the tenant API", async ({ page }) => {
    let selectedTenantId = "";
    let selectedSessionToken = "";

    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            multiTenant: true,
            email: "admin@company.com",
            sessionToken: "temporary-tenant-token",
            tenants: [
              { id: "tenant-1", name: "Tenant One" },
              { id: "tenant-2", name: "Tenant Two" },
            ],
          },
        }),
      });
    });

    await page.route("**/api/auth/login/select-tenant", async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as {
        tenantId: string;
      };
      const authorization = request.headers()["authorization"] ?? "";

      selectedTenantId = body.tenantId;
      selectedSessionToken = authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : authorization;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: createJwt({
              roles: ["ADMIN"],
              permissions: ["EMPLOYEE_READ"],
            }),
            refreshToken: "refresh-token",
            userId: "user-1",
            tenantId: body.tenantId,
            email: "admin@company.com",
            expiresIn: 3600,
          },
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@company.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/select-tenant$/);
    await expect(page.getByRole("heading", { name: "Select company" })).toBeVisible();

    await page.getByLabel("Company").selectOption("tenant-2");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText("Welcome back, Admin!")).toBeVisible();
    expect(selectedTenantId).toBe("tenant-2");
    expect(selectedSessionToken).toBe("temporary-tenant-token");
  });
});
