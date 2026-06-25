import { chromium } from "@playwright/test";

const routes = [
  ["ADMIN", "/leaves/admin/leave-types"],
  ["ADMIN", "/leaves/admin/work-calendars"],
  ["ADMIN", "/leaves/admin/policies"],
  ["ADMIN", "/leaves/admin/holiday-calendars"],
  ["ADMIN", "/leaves/admin/workflows"],
  ["HR", "/leaves/hr/requests"],
  ["HR", "/leaves/hr/balances"],
  ["HR", "/leaves/hr/adjustments"],
  ["HR", "/leaves/hr/lop-review"],
  ["HR", "/leaves/hr/payroll-inputs"],
  ["HR", "/leaves/hr/reports"],
  ["MANAGER", "/leaves/team-summary"],
  ["MANAGER", "/leaves/team-calendar"],
];

const session = (roles) => ({
  accessToken: "fake-token",
  refreshToken: "fake-refresh",
  tokenType: "Bearer",
  expiresIn: 3600,
  expiresAt: Date.now() + 3600 * 1000,
  user: {
    userId: "emp-100",
    tenantId: "tenant-1",
    email: "test@example.com",
    roles,
    rawRoles: roles,
    permissions: [],
  },
});

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:5183/login");

let anyError = false;

for (const [role, path] of routes) {
  await page.evaluate((sess) => {
    localStorage.setItem("hrms.auth.session", JSON.stringify(sess));
  }, session([role, "ADMIN"]));

  const errors = [];
  page.removeAllListeners("console");
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(`http://localhost:5183${path}`, { waitUntil: "networkidle" });
  try {
    await page.waitForFunction(
      () => !document.body.textContent?.includes("Loading..."),
      { timeout: 15000 },
    );
  } catch {
    // leave as-is; screenshot will show the stuck state
  }
  await page.waitForTimeout(500);

  const bodyText = await page.textContent("body");
  const hasUnauthorized = bodyText?.includes("Unauthorized") || page.url().includes("unauthorized");
  const screenshotPath = `/tmp/screenshot-${path.replace(/\//g, "_")}.png`;
  await page.screenshot({ path: screenshotPath });

  console.log(`\n=== ${path} (role=${role}) ===`);
  console.log("URL:", page.url());
  console.log("Unauthorized redirect:", hasUnauthorized);
  console.log("Console errors:", errors.length ? errors : "none");
  console.log("Screenshot:", screenshotPath);
  if (errors.length || hasUnauthorized) anyError = true;
}

await browser.close();
process.exit(anyError ? 1 : 0);
