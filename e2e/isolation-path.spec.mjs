// e2e/isolation-path.spec.mjs
// Cross-university isolation (PRD section 7 "support multiple universities",
// issues #25 and #193).
//
// WHY THIS EXISTS
// University scoping is the core security guarantee of the admin side: an
// admissions officer must only ever see applications for their own
// institution. Until a second university was seeded (#199) that guarantee was
// unfalsifiable - with one institution there is no other university to be
// refused from, so the rule could only be asserted by reading it. Silvana
// recorded it honestly as "not testable" rather than claiming a pass.
//
// This spec turns that into a real result, on every release rather than once.
//
// Runs after demo-path.spec.mjs (Playwright runs spec files alphabetically
// with workers=1), so a freshly submitted Playwright Test Student application
// exists at the first university.
//
// Needs BOTH admin accounts, at DIFFERENT universities:
//   E2E_ADMIN_EMAIL,  E2E_ADMIN_PASSWORD   - university A (Solent)
//   E2E_ADMIN2_EMAIL, E2E_ADMIN2_PASSWORD  - university B (Portsmouth)
// Skips itself when any are missing, so the suite stays green before the
// second university is seeded.
//
// Read-only: this spec never changes a status or records a decision. It only
// looks, and asserts that it cannot see.

import { test, expect } from "@playwright/test";

const A_EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const A_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";
const B_EMAIL = process.env.E2E_ADMIN2_EMAIL || "";
const B_PASSWORD = process.env.E2E_ADMIN2_PASSWORD || "";

const APPLICANT = "Playwright Test Student";

async function signInAsAdmin(page, email, password) {
  await page.goto("/admin/login");
  await page.locator('input[autocomplete="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Admissions overview" })).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Cross-university isolation", () => {
  test.skip(
    !A_EMAIL || !A_PASSWORD || !B_EMAIL || !B_PASSWORD,
    "Both admin accounts are required: E2E_ADMIN_EMAIL/PASSWORD and E2E_ADMIN2_EMAIL/PASSWORD"
  );

  test("an admin cannot see another university's applications", async ({ browser }) => {
    // Separate browser contexts rather than signing out between roles: no
    // shared cookies or storage, so university B genuinely starts from
    // nothing rather than inheriting A's session.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // ---- University A: find an application that really exists ----
      await signInAsAdmin(pageA, A_EMAIL, A_PASSWORD);
      await pageA.locator("#queue-search").fill(APPLICANT);

      const detailLinks = pageA.getByRole("link", { name: "View details" });
      const matches = await detailLinks.count();
      test.skip(
        matches === 0,
        `No ${APPLICANT} application at university A - run the student spec first`
      );

      await detailLinks.first().click();
      await expect(pageA.getByRole("heading", { name: "Application detail" })).toBeVisible({
        timeout: 30_000,
      });
      await expect(pageA.getByText(APPLICANT).first()).toBeVisible({ timeout: 30_000 });

      // The exact address of a real application belonging to university A.
      const targetUrl = pageA.url();
      await pageA.screenshot({
        path: "e2e-results/10-isolation-university-a-can-see.png",
        fullPage: true,
      });

      // ---- University B: must not see it in the queue ----
      await signInAsAdmin(pageB, B_EMAIL, B_PASSWORD);
      // Let this university's own queue finish loading first, otherwise the
      // assertion below can pass or fail on timing rather than on isolation.
      await pageB.waitForLoadState("networkidle");
      await pageB.locator("#queue-search").fill(APPLICANT);
      await pageB.screenshot({
        path: "e2e-results/11-isolation-university-b-queue-empty.png",
        fullPage: true,
      });

      // The property that matters is that the other university's applicant
      // does not appear - NOT that the search box returned zero rows. The
      // first version asserted the latter, which tests the search feature and
      // fails against a queue that legitimately holds this university's own
      // applications.
      await expect(pageB.getByText(APPLICANT)).toHaveCount(0);

      // ---- University B: must not reach it by guessing the address ----
      // The interface guard is a courtesy; the Firestore rules are the real
      // boundary. Either way the applicant's data must not appear.
      await pageB.goto(targetUrl);
      await pageB.waitForLoadState("networkidle");
      await pageB.screenshot({
        path: "e2e-results/12-isolation-university-b-direct-url-refused.png",
        fullPage: true,
      });

      // The assertion that matters: none of the other university's applicant
      // data is on the page. Deliberately not asserting on the wording of the
      // refusal, so this stays true if the copy changes.
      await expect(pageB.getByText(APPLICANT)).toHaveCount(0);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
