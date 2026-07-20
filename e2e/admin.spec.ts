import { expect, test } from "@playwright/test";
import { loginAsAdmin, mockLogoutApi } from "./helpers/auth";

test.describe("mocked admin flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockLogoutApi(page);
  });

  test("root redirects to the admin dashboard", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText("Welcome back, Admin!")).toBeVisible();
  });

  test("admin can open primary workspaces", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.getByLabel("open drawer").click();

    await page.getByText("Employees").click();
    await expect(page).toHaveURL(/\/employees$/);
    await expect(page.getByText("Employee Management").first()).toBeVisible();
    await page.getByText("Employee Management").first().hover(); // Dismiss tooltips

    // Leave - Role-based navigation
    const roles = await page.evaluate(() => {
      const session = localStorage.getItem("hrms.auth.session");
      return session ? JSON.parse(session).user?.roles : [];
    });

    await page.getByText("Leave").click();

    if (roles?.includes("ADMIN")) {
      await page.getByText("Manager Approvals").click();
      await expect(page).toHaveURL(/\/leaves\/approvals$/);
      await expect(page.getByText("Leave Approval Inbox").first()).toBeVisible();
    } else {
      await page.getByText("My Dashboard").click();
      await expect(page).toHaveURL(/\/leaves\/my-dashboard$/);
      await expect(page.getByText("My Leave").first()).toBeVisible();
    }
    // await expect(page).toHaveURL(/\/leaves\/my-dashboard$/);
    // await expect(page.getByText("My Leave").first()).toBeVisible();
    // await page.getByText("My Leave").first().hover(); // Dismiss tooltips

   await page.getByRole("button", { name: "Payroll" }).click();

  // Wait for PAYROLL OPERATIONS to be visible
  await page.getByRole("button", { name: "PAYROLL OPERATIONS" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "PAYROLL OPERATIONS" }).click();

  // Wait for the expansion to complete - check for any child item
  await page.getByRole("button", { name: "Dashboard" }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Dashboard" }).click();

    await expect(page).toHaveURL(/\/payroll$/);
    await expect(page.getByRole("heading", { name: "Payroll Dashboard" })).toBeVisible();

    // await page.getByRole("button", { name: "Payroll" }).click();
    // await page.getByRole("button", { name: "Dashboard" }).waitFor({ state: "visible" });
    // await page.getByRole("button", { name: "Dashboard" }).click();
    // await expect(page).toHaveURL(/\/payroll$/);
    // await expect(page.getByRole("heading", { name: "Payroll Dashboard" })).toBeVisible();
    // await page.getByRole("heading", { name: "Payroll Dashboard" }).hover();

    // await page.getByText("Payroll", { exact: true }).click();
    // await expect(page).toHaveURL(/\/payroll$/);
    // await expect(page.getByRole("heading", { name: "Payroll Dashboard" })).toBeVisible();
    // await page.getByRole("heading", { name: "Payroll Dashboard" }).hover(); // Dismiss tooltips

    await page.getByText("Settings", { exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByText("Company Settings").first()).toBeVisible();
  });

  // test("company settings can be saved", async ({ page }) => {
  //   await page.goto("/settings");

  //   await page.getByLabel("Company Name").fill("VibeHR");

  //   await page
  //     .getByRole("textbox", { name: "Address", exact: true })
  //     .fill("Chennai");

  //   await page.getByLabel("Phone Number").first().fill("9876543210");
  //   await page.getByLabel("Email Address").first().fill("admin@vibehr.com");
  //   await page.getByLabel("GST Number").fill("22AAAAA0000A1ZA");
  //   await page.getByLabel("Currency").fill("");
  //   await page.getByRole("button", { name: "Save Changes" }).click();
  //   await expect(
  //     page.getByText("Company settings saved successfully!"),
  //   ).toBeVisible();
  // });

  test("logout clears the session and returns to login", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await page.getByLabel("Account").click();
    await page.getByRole("menuitem", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(
      page.evaluate(() => window.localStorage.getItem("hrms.auth.session")),
    ).resolves.toBeNull();
  });
});
