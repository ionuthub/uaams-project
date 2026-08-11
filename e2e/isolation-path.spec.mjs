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
      const targetId = new URL(targetUrl).pathname.split("/").filter(Boolean).pop();
      await pageA.screenshot({
        path: "e2e-results/10-isolation-university-a-can-see.png",
        fullPage: true,
      });

      // ---- University B: must not see it in the queue ----
      await signInAsAdmin(pageB, B_EMAIL, B_PASSWORD);
      // Searched by application ID, not by applicant name. A name search asserts
      // "university B has nobody called this", which is a claim about B's OWN
      // data - it broke the moment B legitimately held applications from a
      // student of that name, which is exactly what runs #13-#17 created while
      // demo-path was submitting to the wrong university (#25). The ID belongs
      // to the one application created at A, so this asserts the thing that
      // actually matters and stays true however much history either queue holds.
      const searchBox = pageB.locator("#queue-search");
      // The search control only renders when the queue is non-empty, so an
      // empty queue is itself a pass rather than a timeout.
      if (await searchBox.count()) {
        await searchBox.fill(targetId);
      }
      await pageB.screenshot({
        path: "e2e-results/11-isolation-university-b-queue-empty.png",
        fullPage: true,
      });

      // University A's application is not present in university B's queue.
      await expect(pageB.getByText(targetId)).toHaveCount(0);

      // ---- University B: must not reach it by guessing the address ----
      // The interface guard is a courtesy; the Firestore rules are the real
      // boundary. Either way the applicant's data must not appear.
      await pageB.goto(targetUrl, { waitUntil: "domcontentloaded" });
      // Deliberately NOT networkidle. Firestore holds a long-lived connection
      // open, so the network never goes quiet and this waited until the 180s
      // test timeout - it took 1.7m in run #19 and blew the cap in #22.
      // Waiting for the page's own loading indicator to clear is faster and a
      // truer signal that the screen has settled on its final state. If the
      // indicator is absent this passes immediately, which is harmless: the
      // assertion below is what actually proves anything.
      await expect(pageB.locator('[role="status"]')).toHaveCount(0, { timeout: 60_000 });
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
