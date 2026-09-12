import { Page } from "@playwright/test";

/**
 * Force-removes the React Joyride portal whenever it mounts.
 * Must be registered BEFORE the first page.goto / login.
 */
export async function disableJoyride(page: Page) {
  await page.addInitScript(() => {
    const strip = () => {
      document
        .querySelectorAll("#react-joyride-portal")
        .forEach((el) => el.remove());
    };

    // Remove once DOM is ready, then keep removing on every mount.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", strip, { once: true });
    } else {
      strip();
    }

    new MutationObserver(strip).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}