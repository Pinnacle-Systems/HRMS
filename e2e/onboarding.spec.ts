import { expect, test } from "@playwright/test";

import {
  createMockSession,
  seedAuthSession,
} from "./helpers/auth";

test.describe("mocked onboarding contract flow", () => {
  test.beforeEach(async ({ page }) => {
    // --------------------------------------------------
    // Mock authenticated ADMIN session
    // --------------------------------------------------
    const session = createMockSession({
      roles: ["ADMIN"],
      permissions: [
        "EMPLOYEE_READ",
        "EMPLOYEE_WRITE",

        // Keep any other permissions required by your app
        "PAYROLL_READ",
        "ATTENDANCE_READ",
        "LEAVE_READ",
      ],
    });

    await seedAuthSession(page, session);

    // --------------------------------------------------
    // Mock employees API
    // --------------------------------------------------
    await page.route("**/api/employees**", async (route) => {
      const request = route.request();

      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "employee-1",
                employeeId: "E-001",
                firstName: "Ava",
                lastName: "Patel",
                email: "ava@company.com",
              },
            ],
          }),
        });

        return;
      }

      await route.continue();
    });

    // --------------------------------------------------
    // Mock onboarding APIs
    // --------------------------------------------------
    let assignPayload: unknown = undefined;
    let welcomePayload: unknown = undefined;

    await page.route("**/api/onboarding/**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = request.url();

      // ------------------------------------------------
      // GET onboarding assignments
      // ------------------------------------------------
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "assignment-1",
                employeeId: "employee-1",
                checklistId: "checklist-1",
                status: "IN_PROGRESS",
                progress: 0,
                assignedAt: "2026-05-19T10:00:00.000Z",
                welcomeEmailSent: false,
              },
            ],
          }),
        });

        return;
      }

      // ------------------------------------------------
      // POST assign onboarding
      // ------------------------------------------------
      if (
        method === "POST" &&
        /\/assign/i.test(url)
      ) {
        assignPayload = request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "assignment-1",
              employeeId: "employee-1",
              checklistId: "checklist-1",
              status: "IN_PROGRESS",
            },
          }),
        });

        return;
      }

      // ------------------------------------------------
      // POST welcome email
      // ------------------------------------------------
      if (
        method === "POST" &&
        /welcome/i.test(url)
      ) {
        welcomePayload = request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
          }),
        });

        return;
      }

      await route.continue();
    });

    // --------------------------------------------------
    // Mock checklist API
    // --------------------------------------------------
    await page.route("**/api/checklists**", async (route) => {
      const request = route.request();

      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "checklist-1",
                name: "HR Documentation",
                tasks: [],
              },
            ],
          }),
        });

        return;
      }

      await route.continue();
    });

    // --------------------------------------------------
    // Navigate
    // --------------------------------------------------
    await page.goto(
      "/settings/employee/onboarding-process?tab=assign"
    );

    // --------------------------------------------------
    // Verify we were NOT redirected
    // --------------------------------------------------
    await expect(page).toHaveURL(
      /\/settings\/employee\/onboarding-process\?tab=assign$/
    );

    // --------------------------------------------------
    // Wait for page
    // --------------------------------------------------
    await expect(
      page.getByText("Assign Onboarding", {
        exact: true,
      }).first()
    ).toBeVisible({
      timeout: 15000,
    });

    // --------------------------------------------------
    // Authorization error should not exist
    // --------------------------------------------------
    await expect(
      page.getByRole("heading", {
        name: "Unable to determine access",
      })
    ).toHaveCount(0);

    // --------------------------------------------------
    // Verify onboarding page
    // --------------------------------------------------
    await expect(
      page.getByText(
        "Manage employee onboarding assignments",
        {
          exact: true,
        }
      )
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Assign New Onboarding",
      })
    ).toBeVisible();

    // --------------------------------------------------
    // Open Assign dialog
    // --------------------------------------------------
    await page
      .getByRole("button", {
        name: "Assign New Onboarding",
      })
      .click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByRole("heading", {
        name: "Assign New Onboarding",
      })
    ).toBeVisible();

    // --------------------------------------------------
    // Select employee
    // --------------------------------------------------
    const employeeInput = dialog.locator(
      'input[placeholder="Search multiple employees..."]'
    );

    await expect(employeeInput).toBeVisible();

    await employeeInput.fill("Ava");

    const employeeOption = page.getByRole("option", {
      name: /Ava Patel/i,
    });

    await expect(employeeOption).toBeVisible();

    await employeeOption.click();

    // Verify employee selected
    await expect(
      dialog.getByText("Ava Patel", {
        exact: true,
      }).first()
    ).toBeVisible();

    // --------------------------------------------------
    // Select checklist
    // --------------------------------------------------
    const checklistSelect = dialog.getByLabel(
      "Select Checklists"
    );

    await expect(checklistSelect).toBeVisible();

    await checklistSelect.click();

    const checklistOption = page.getByRole("option", {
      name: /HR Documentation/i,
    });

    await expect(checklistOption).toBeVisible();

    await checklistOption.click();

    // --------------------------------------------------
    // IMPORTANT:
    // Verify checklist is selected
    // --------------------------------------------------
    await expect(
      checklistSelect.getByText("HR Documentation", {
        exact: false,
      })
    ).toBeVisible();

    // Close any remaining dropdown/listbox
    await page.keyboard.press("Escape");

    // --------------------------------------------------
    // Assign button
    // --------------------------------------------------
    const assignButton = dialog.getByRole("button", {
      name: /Assign to 1 Employee with 1 Checklist/i,
    });

    await expect(assignButton).toBeVisible({
      timeout: 10000,
    });

    await expect(assignButton).toBeEnabled();

    await assignButton.click();

    // --------------------------------------------------
    // Validate Assign API payload
    // --------------------------------------------------
    await expect
      .poll(
        () => assignPayload,
        {
          timeout: 10000,
        }
      )
      .toEqual({
        employeeIds: ["employee-1"],
        checklistIds: ["checklist-1"],
        startDate: expect.any(String),
      });

    // --------------------------------------------------
    // Wait for table
    // --------------------------------------------------
    const employeeRow = page
      .getByRole("row")
      .filter({
        hasText: "Ava Patel",
      });

    await expect(employeeRow).toBeVisible({
      timeout: 10000,
    });

    // --------------------------------------------------
    // Send Welcome Email
    // --------------------------------------------------
    const sendWelcomeButton = employeeRow.getByRole(
      "button",
      {
        name: "Send Welcome Email",
      }
    );

    await expect(sendWelcomeButton).toBeVisible();

    await expect(sendWelcomeButton).toBeEnabled();

    await sendWelcomeButton.click();

    // --------------------------------------------------
    // Validate Welcome API
    // --------------------------------------------------
    await expect
      .poll(
        () => welcomePayload,
        {
          timeout: 10000,
        }
      )
      .toEqual({
        employeeIds: ["employee-1"],
      });
  });
});