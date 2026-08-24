// e2e/review-path.spec.mjs
// Automated check of the admin side of the demo path (PRD 4.3, issues #153,
// #165): sign in as the admissions test account, find the application the
// student test just submitted using the queue search and status filter, move
// it to under review (which emails the student), then record an offer with a
// message (which emails the student again). Screenshots at every stage.
//
// Runs AFTER demo-path.spec.mjs: Playwright runs spec files alphabetically
// with workers=1, and review-path sorts after demo-path, so a freshly
// submitted Playwright Test Student application always exists.
//
// THE FILENAME IS LOAD-BEARING (#211). This file was briefly renamed to
// admin-path.spec.mjs, which sorts BEFORE demo-path - so it ran before the
// application it reviews had been created, and quietly reviewed a leftover
// from a previous run instead. When the leftovers ran out it hit the skip
// below, and a skip is reported separately from a failure, so nothing went
// red while the admin journey was not being tested at all.
//
// Do not rename this file to anything sorting before "demo-path" without
// giving it its own fixture first.
//
// Needs a dedicated admin test account (role admin + universityId set in the
// users document) passed in as env vars:
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD  (GitHub Actions secrets in CI)
// The test skips itself when they are missing. It only ever touches
// applications whose applicant name is Playwright Test Student. Side
// effects per run: one status email and one decision email to the test
// student inbox, plus their in-app notifications. No cleanup step (recorded
// limitation, same as the student spec).

import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

test.describe("UAAMS admin path", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set");

  test("sign in, find via search and filter, review, decide", async ({ page }) => {
    // 1. Sign in as the admissions officer
    await page.goto("/admin/login");
    await page.locator('input[autocomplete="email"]').fill(EMAIL);
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Admissions overview" })).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "e2e-results/06-admin-overview.png", fullPage: true });

    // 2. PRD 4.3.1 / #153: filter by status, then search by student name
    await page.getByRole("button", { name: /^Submitted \(/ }).click();
    await page.locator("#queue-search").fill("Playwright Test Student");
    const detailLinks = page.getByRole("link", { name: "View details" });
    await page.screenshot({ path: "e2e-results/07-admin-queue-filtered.png", fullPage: true });
    const matches = await detailLinks.count();
    test.skip(matches === 0, "No submitted Playwright Test Student application found - run the student spec first");

    // 3. Open the newest matching application
    await detailLinks.first().click();
    await expect(page.getByRole("heading", { name: "Application detail" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Playwright Test Student").first()).toBeVisible();

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
    // #231: recording a decision now asks for confirmation via the browser-native
    // confirm(). Playwright auto-DISMISSES native dialogs unless handled, which
    // would turn this click into a silent no-op and time out on the success
    // message. Accept exactly one dialog, registered before the click.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Record decision and send email" }).click();
    await expect(
      page.getByText("Decision recorded and the decision email was sent to the student.")
    ).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: "e2e-results/09-admin-decision-recorded.png", fullPage: true });

    // 6. The audit trail shows the decision and the email as sent
    await expect(page.getByText(/Latest decision email: Sent to the student/)).toBeVisible({ timeout: 30_000 });
  });
});
