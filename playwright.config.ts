import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const useDevServer = process.env.PW_USE_DEV_SERVER === "1";
const localChromiumUse =
  !isCI && process.env.PW_USE_CHROME === "1" ? { channel: "chrome" as const } : {};

/**
 * Playwright config for Phuzzle E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./src/app",
  testMatch: "**/*.e2e.spec.ts",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: 4,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    navigationTimeout: 60_000,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...localChromiumUse } },
    {
      name: "chromium-tz-la",
      use: {
        ...devices["Desktop Chrome"],
        ...localChromiumUse,
        timezoneId: "America/Los_Angeles",
      },
    },
    {
      name: "chromium-tz-auckland",
      use: {
        ...devices["Desktop Chrome"],
        ...localChromiumUse,
        timezoneId: "Pacific/Auckland",
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    /** Microsoft Edge (Chromium). Install: `npx playwright install msedge` */
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "webkit-iphone-responsive",
      testMatch: "**/*.responsive.e2e.spec.ts",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      name: "webkit-ipad-responsive",
      testMatch: "**/*.responsive.e2e.spec.ts",
      use: { ...devices["iPad Pro 11"], browserName: "webkit" },
    },
    {
      name: "chromium-android-tablet-responsive",
      testMatch: "**/*.responsive.e2e.spec.ts",
      use: {
        browserName: "chromium",
        ...localChromiumUse,
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: useDevServer
      ? "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort"
      : "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    // In local development, reuse an already running Phuzzle server if one exists
    // so Playwright can still run while we iterate in parallel. CI still launches
    // a clean server for isolation.
    reuseExistingServer: !isCI,
    timeout: 300000,
  },
});
