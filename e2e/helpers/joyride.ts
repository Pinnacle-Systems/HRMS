import { Page } from "@playwright/test";

/**
 * Force-removes the React Joyride portal whenever it mounts.
 * Must be registered BEFORE the first page.goto / login.
 */
export async function disableJoyride(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("hrms-guided-tour-completed", "true");
  });
}