import { expect, test } from "@playwright/test";
import { loginAsAdmin, mockLogoutApi } from "./helpers/auth";

test.describe("mocked onboarding contract flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockLogoutApi(page);
  });

  test("assign and welcome use Swagger payload shapes", async ({ page }) => {
    let assignPayload: unknown;
    let welcomePayload: unknown;

    // Mock authorization/permissions endpoint if it exists
    await page.route("**/api/auth/me**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "admin-1",
            email: "admin@example.com",
            roles: ["ADMIN"],
            permissions: ["onboarding:read", "onboarding:write", "employee:read"],
          },
        }),
      });
    });

    // Mock user permissions
    await page.route("**/api/permissions**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            permissions: ["onboarding:read", "onboarding:write", "employee:read"],
          },
        }),
      });
    });

    await page.route("**/api/onboarding/checklist**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            content: [
              {
                id: "checklist-1",
                name: "Engineering onboarding",
                active: true,
                tasks: [],
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/employees**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            content: [
              {
                id: "employee-1",
                name: "Ava Patel",
                employeeId: "E-001",
                designation: "Engineer",
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/onboarding/assignments**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            content: [
              {
                id: "assignment-1",
                employeeId: "employee-1",
                employeeName: "Ava Patel",
                checklistId: "checklist-1",
                checklistName: "Engineering onboarding",
                status: "In Progress",
                progress: 0,
                startDate: "2026-05-19",
                expectedEndDate: "2026-05-30",
              },
            ],
          },
        }),
      });
    });

    await page.route("**/api/onboarding/assign", async (route) => {
      assignPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "assignment-1" } }),
      });
    });

    await page.route("**/api/onboarding/send-welcome", async (route) => {
      welcomePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    });

    // Navigate and wait for network to settle
    await page.goto("/settings/employee/onboarding-process?tab=assign");
    await page.waitForLoadState("networkidle");

    // Check that we're not on the error page
    await expect(page.locator('h1:has-text("Unable to determine access")')).not.toBeVisible();

    // Now verify the expected content
    await expect(page.getByText("Assign Onboarding").first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Assign New Onboarding" }).click();
    await page.getByRole("combobox", { name: "Select Employee" }).click();
    await page.getByRole("option", { name: /Ava Patel/ }).click();
    await page.getByRole("combobox", { name: "Select Checklist" }).click();
    await page.getByRole("option", { name: /Engineering onboarding/ }).click();
    await page.getByRole("button", { name: "Assign" }).click();

    await expect
      .poll(() => assignPayload)
      .toEqual({ employeeId: "employee-1", checklistIds: ["checklist-1"] });

    await page.getByLabel("Send welcome to Ava Patel").first().click();

    await expect
      .poll(() => welcomePayload)
      .toEqual({ employeeIds: ["employee-1"] });
  });
});