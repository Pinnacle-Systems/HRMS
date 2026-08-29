import { expect, test } from "@playwright/test";

import { loginAsAdmin, mockLogoutApi } from "./helpers/auth";

test.describe("mocked admin flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockLogoutApi(page);

    await page.route("**/api/payroll/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            totalEmployees: 150,
            netPayroll: 1250000,
            pendingApprovals: 3,
            totalCost: 1850000,

            processingStatus: [
              { label: "Submitted", count: 5 },
              { label: "Processing", count: 2 },
              { label: "Approved", count: 8 },
              { label: "Failed", count: 1 },
            ],

            upcomingPayrolls: [
              { period: "Feb 2026", status: "pending" },
              { period: "Mar 2026", status: "scheduled" },
            ],

            recentActivities: [
              {
                text: "Payroll processed for January",
                time: "2 hours ago",
                user: "Admin",
                type: "processed",
              },
            ],

            departmentWiseData: [
              {
                department: "Engineering",
                total: 450000,
              },
              {
                department: "Sales",
                total: 320000,
              },
            ],

            deductionComposition: [
              {
                name: "Tax",
                value: 150000,
              },
              {
                name: "Insurance",
                value: 45000,
              },
            ],

            monthlyTrend: [
              {
                month: "Jan",
                amount: 1200000,
              },
              {
                month: "Feb",
                amount: 1250000,
              },
            ],
          },
        }),
      });
    });
  });

  test("root redirects to the admin dashboard", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await expect(
      page.getByText("Welcome back, Admin!", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("admin can open primary workspaces", async ({ page }) => {
    // --------------------------------------------------
    // Admin Dashboard
    // --------------------------------------------------
    await page.goto("/admin/dashboard");

    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    // --------------------------------------------------
    // Employees
    // --------------------------------------------------
    await page.getByLabel("open drawer").click();

    await page.getByText("Employees", {
      exact: true,
    }).click();

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByText("Employee Management", {
        exact: true,
      }).first(),
    ).toBeVisible();

    // --------------------------------------------------
    // Get roles
    // --------------------------------------------------
    const roles = await page.evaluate(() => {
      const session = localStorage.getItem(
        "hrms.auth.session",
      );

      if (!session) {
        return [];
      }

      try {
        return JSON.parse(session).user?.roles ?? [];
      } catch {
        return [];
      }
    });

    // --------------------------------------------------
    // Leave
    // --------------------------------------------------
    await page.getByText("Leave", {
      exact: true,
    }).click();

    if (roles.includes("ADMIN")) {
      await page.getByText("Manager Approvals", {
        exact: true,
      }).click();

      await expect(page).toHaveURL(
        /\/leaves\/approvals$/,
      );

      await expect(
        page.getByText("Leave Approval Inbox", {
          exact: true,
        }).first(),
      ).toBeVisible();
    } else {
      await page.getByText("My Dashboard", {
        exact: true,
      }).click();

      await expect(page).toHaveURL(
        /\/leaves\/my-dashboard$/,
      );

      await expect(
        page.getByText("My Leave", {
          exact: true,
        }).first(),
      ).toBeVisible();
    }

    // --------------------------------------------------
    // Payroll
    // --------------------------------------------------
    await page.getByRole("button", {
      name: "Payroll",
    }).click();

    const payrollOperations =
      page.getByRole("button", {
        name: "PAYROLL OPERATIONS",
      });

    await expect(payrollOperations).toBeVisible();

    await payrollOperations.click();

    const dashboardButton =
      page.getByRole("button", {
        name: "Dashboard",
      });

    await expect(dashboardButton).toBeVisible();

    await dashboardButton.click();

    // --------------------------------------------------
    // Payroll Dashboard
    // --------------------------------------------------
    await expect(page).toHaveURL(/\/payroll$/);

    await expect(
      page.getByText("Payroll Dashboard", {
        exact: true,
      }).first(),
    ).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.locator("body"),
    ).toContainText(/Payroll|Dashboard/i);

    // --------------------------------------------------
    // Settings
    // --------------------------------------------------
    await page.getByText("Settings", {
      exact: true,
    }).click();

    await expect(page).toHaveURL(/\/settings/);

    // Make authorization failure explicit.
    const accessDenied = page.getByRole("heading", {
      name: "Unable to determine access",
    });

    await expect(accessDenied).not.toBeVisible({
      timeout: 5000,
    });

    // --------------------------------------------------
    // Company Settings
    // --------------------------------------------------
    await expect(
      page.getByText("Company Settings", {
        exact: true,
      }).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("logout clears the session and returns to login", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard");

    await page.getByLabel("Account").click();

    await page.getByRole("menuitem", {
      name: "Logout",
    }).click();

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("button", {
        name: "Sign in",
      }),
    ).toBeVisible();

    await expect(
      page.evaluate(() =>
        window.localStorage.getItem(
          "hrms.auth.session",
        ),
      ),
    ).resolves.toBeNull();
  });
});