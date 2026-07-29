// e2e/playwright.config.mjs
// Browser automation tests for the live demo path (PRD 10: integration and
// UAT support). Run with: npx playwright test -c e2e/playwright.config.mjs
// Requires E2E_EMAIL and E2E_PASSWORD (a verified test student account);
// the spec skips itself politely when they are absent so CI stays honest.

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 180_000,
  retries: 0,
  outputDir: "../e2e-results",
  reporter: [["list"], ["html", { outputFolder: "../e2e-report", open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://www.uaams.website",
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
