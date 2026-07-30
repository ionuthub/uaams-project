// e2e/admin-path.spec.mjs
// Automated check of the admin side of the demo path (PRD 4.3, issues #153,
// #165): sign in as the admissions test account, find the application the
// student test just submitted using the queue search and status filter, move
// it to under review (which emails the student), then record an offer with a
// message (which emails the student again). Screenshots at every stage.
//
// Runs AFTER demo-path.spec.mjs (alphabetical order, workers=1 in the
// config), so a freshly submitted E2E Test Student application exists.
//
// Needs a dedicated admin test account (role admin + universityId set in the
// users document) passed in as env vars:
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD  (GitHub Actions secrets in CI)
// The test skips itself when they are missing. It only ever touches
// applications whose applicant name is E2E Test Student.
// Side effects per run: one status email and one decision email to the test
// student inbox, plus their in-app notifications. No cleanup step (recorded
// limitation, same as the student spec).

import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

test.describe("UAAMS admin path", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set");

  test("sign in, find via search and filter, review, decide", async ({ page }) => {
    // 1. Sign in as the admissions officer
    await page.goto("/login");
    await page.locator('input[autocomplete="email"]').fill(EMAIL);
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Admissions overview" })).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "e2e-results/06-admin-overview.png", fullPage: true });

    // 2. PRD 4.3.1 / #153: filter by status, then search by student name
    await page.getByRole("button", { name: /^Submitted \(/ }).click();
    await page.locator("#queue-search").fill("E2E Test Student");
    const detailLinks = page.getByRole("link", { name: "View details" });
    await page.screenshot({ path: "e2e-results/07-admin-queue-filtered.png", fullPage: true });
    const matches = await detailLinks.count();
    test.skip(matches === 0, "No submitted E2E Test Student application found - run the student spec first");

    // 3. Open the newest matching application
    await detailLinks.first().click();
    await expect(page.getByRole("heading", { name: "Application detail" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("E2E Test Student").first()).toBeVisible();

    // 4. PRD 4.3.2 / #165: move to under review, status email to the student
    await page.getByRole("button", { name: "Move to under review" }).click();
    await expect(
      page.getByText("Application moved to under review and the student was emailed.")
    ).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: "e2e-results/08-admin-under-review.png", fullPage: true });

    // 5. PRD 4.3.3: record an offer with a message, decision email sent
    await page.getByLabel("Offer a place").check();
    await page.locator("#decision-message").fill(
      "Automated regression decision. This offer was recorded by the Playwright admin-path test."
    );
    await page.getByRole("button", { name: "Record decision and send email" }).click();
    await expect(
      page.getByText("Decision recorded and the decision email was sent to the student.")
    ).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: "e2e-results/09-admin-decision-recorded.png", fullPage: true });

    // 6. The audit trail shows the decision and the email as sent
    await expect(page.getByText(/Latest decision email: Sent to the student/)).toBeVisible({ timeout: 30_000 });
  });
});
