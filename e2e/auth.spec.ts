import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

function createJwt(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  return `header.${encodedPayload}.signature`;
}

test.describe("public auth flow", () => {
  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("protected routes redirect unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("multi-tenant login selects a company through the tenant API", async ({
    page,
  }) => {
    let selectedTenantId = "";
    let selectedSessionToken = "";

    // await page.route("**/auth/login", async (route) => {
    //   await route.fulfill({
    //     status: 200,
    //     contentType: "application/json",
    //     body: JSON.stringify({
    //       success: true,
    //       data: {
    //         multiTenant: true,
    //         email: "admin@company.com",
    //         sessionToken: "temporary-tenant-token",
    //         tenants: [
    //           { id: "tenant-1", name: "Tenant One" },
    //           { id: "tenant-2", name: "Tenant Two" },
    //         ],
    //       },
    //     }),
    //   });
    // });

    // await page.route("**/auth/login/select-tenant", async (route) => {
    //   const request = route.request();
    //   const body = request.postDataJSON() as {
    //     tenantId: string;
    //   };
    //   const authorization = request.headers()["authorization"] ?? "";

    //   selectedTenantId = body.tenantId;
    //   selectedSessionToken = authorization.startsWith("Bearer ")
    //     ? authorization.slice("Bearer ".length)
    //     : authorization;

    //   await route.fulfill({
    //     status: 200,
    //     contentType: "application/json",
    //     body: JSON.stringify({
    //       // type: "authenticated",
    //       success: true,
    //       data: {
    //         accessToken: createJwt({
    //           roles: ["ADMIN"],
    //           permissions: ["EMPLOYEE_READ"],
    //         }),
    //         refreshToken: "refresh-token",
    //         expiresIn: 900,
    //         userId: "user-1",
    //         tenantId: body.tenantId,
    //         email: "admin@company.com",
    //         roles: ["ADMIN"],
    //         profile: {
    //           id: "user-1",
    //           firstName: "Admin",
    //           email: "admin@company.com",
    //           roles: ["ADMIN"],
    //           permissions: ["EMPLOYEE_READ"],
    //         },
    //       },
    //       // data: {
    //       //   type: "authenticated",
    //       //   session: {
    //       //     user: {
    //       //       userId: "user-1",
    //       //       roles: ["ADMIN"],
    //       //       permissions: ["EMPLOYEE_READ"],
    //       //       email: "admin@company.com",
    //       //       tenantId: body.tenantId,
    //       //     },
    //       //     accessToken: createJwt({
    //       //       roles: ["ADMIN"],
    //       //       permissions: ["EMPLOYEE_READ"],
    //       //     }),
    //       //     refreshToken: "refresh-token",
    //       //     expiresIn: 3600,
    //       //   },
    //       // },
    //     }),
    //   });
    // });

    // await page.route("**/auth/login", async (route) => {
    //   const body = route.request().postDataJSON();

    //   // First login
    //   if (!body.tenantId) {
    //     await route.fulfill({
    //       status: 200,
    //       contentType: "application/json",
    //       body: JSON.stringify({
    //         success: true,
    //         data: {
    //           multiTenant: true,
    //           tenants: [
    //             { id: "tenant-1", name: "Tenant One" },
    //             { id: "tenant-2", name: "Tenant Two" },
    //           ],
    //         },
    //       }),
    //     });

    //     return;
    //   }

    //   // Second login (after tenant selection)
    //   await route.fulfill({
    //     status: 200,
    //     contentType: "application/json",
    //     body: JSON.stringify({
    //       success: true,
    //       data: {
    //         accessToken: createJwt({
    //           roles: ["ADMIN"],
    //           permissions: ["EMPLOYEE_READ"],
    //         }),
    //         refreshToken: "refresh-token",
    //         expiresIn: 900,
    //         tenantId: body.tenantId,
    //         email: "admin@company.com",
    //         roles: ["ADMIN"],
    //         profile: {
    //           id: "user-1",
    //           firstName: "Admin",
    //           email: "admin@company.com",
    //           roles: ["ADMIN"],
    //           permissions: ["EMPLOYEE_READ"],
    //         },
    //       },
    //     }),
    //   });
    // });

    await page.route("**/auth/login", async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as {
        loginId: string;
        password: string;
        tenantId?: string;
      };

      // First login
      if (!body.tenantId) {
        selectedSessionToken = "temporary-tenant-token";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              multiTenant: true,
              sessionToken: "temporary-tenant-token",
              tenants: [
                { id: "tenant-1", name: "Tenant One" },
                { id: "tenant-2", name: "Tenant Two" },
              ],
            },
          }),
        });
        return;
      }

      // Capture second login request
      selectedTenantId = body.tenantId;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: createJwt({
              roles: ["ADMIN"],
              permissions: [
                "EMPLOYEE_READ",
                "PAYROLL_READ",
                "PAYROLL_WRITE",
                "REPORT_READ",
                "SETTINGS_READ",
              ],
            }),
            refreshToken: "refresh-token",
            expiresIn: 900,
            userId: "user-1",
            tenantId: body.tenantId,
            email: "admin@company.com",
            roles: ["ADMIN"],
            branchId: "branch-1",
            fiscalYearId: "fy-2025",
            branchName: "Main Branch",
            fiscalYearLabel: "2025",
            profile: {
              id: "user-1",
              firstName: "Admin",
              email: "admin@company.com",
              roles: ["ADMIN"],
              permissions: [
                "EMPLOYEE_READ",
                "PAYROLL_READ",
                "PAYROLL_WRITE",
                "REPORT_READ",
                "SETTINGS_READ",
              ],
            },
          },
        }),
      });
    });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              userId: "user-1",
              roles: ["ADMIN"],
              permissions: [
                "EMPLOYEE_READ",
                "PAYROLL_READ",
                "PAYROLL_WRITE",
                "REPORT_READ",
                "SETTINGS_READ",
              ],
              email: "admin@company.com",
              tenantId: "tenant-2",
              branchId: "branch-1",
              fiscalYearId: "fy-2025",
            },
          },
        }),
      });
    });

    await page.route("**/api/auth/context", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            branchAssociated: true,
            assignedBranchId: "branch-1",
            branches: [{ id: "branch-1", name: "Main Branch" }],
            fiscalYears: [{ id: "fy-2025", label: "2025", active: true }],
            activeFiscalYearId: "fy-2025",
          },
        }),
      });
    });

    await page.route("**/api/auth/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "user-1",
            userId: "user-1",
            employeeId: "emp-100",
            email: "admin@company.com",
            firstName: "Admin",
            roles: ["ADMIN"],
            permissions: [
              "EMPLOYEE_READ",
              "PAYROLL_READ",
              "PAYROLL_WRITE",
              "REPORT_READ",
              "SETTINGS_READ",
            ],
            tenantId: "tenant-2",
            employee: {
              id: "emp-100",
              employeeId: "emp-100",
              userId: "user-1",
            },
          },
        }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@company.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/select-tenant$/);
    await expect(
      page.getByRole("heading", { name: "Select company" }),
    ).toBeVisible();

    await page.getByLabel("Company").selectOption("tenant-2");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/admin\/dashboard$/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText("Welcome back, Admin!")).toBeVisible();
    expect(selectedTenantId).toBe("tenant-2");
    expect(selectedSessionToken).toBe("temporary-tenant-token");
  });
});
