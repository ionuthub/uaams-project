// e2e/demo-path.spec.mjs
// End-to-end test of the acceptance demo path (issue #25 backbone):
// sign in -> fill the full PRD application form -> upload the three
// mandatory documents -> submit -> confirm the dashboard shows Submitted.
// Runs against production by default; every step is screenshotted so a
// green run leaves its own evidence trail in the CI artifacts.
//
// Needs a VERIFIED test student account passed in as env vars:
//   E2E_EMAIL, E2E_PASSWORD  (GitHub Actions secrets in CI)
// The test skips itself when they are missing rather than failing.
// Known limitation (recorded in the test plan): each run creates a real
// submitted application for the test account; there is no cleanup step.

import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";

// Tiny valid PNG generated at runtime so no binary fixtures live in git.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test.describe("UAAMS demo path", () => {
  test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL and E2E_PASSWORD are not set");

  let fixture;
  test.beforeAll(() => {
    fixture = path.join(os.tmpdir(), "uaams-e2e-doc.png");
    fs.writeFileSync(fixture, Buffer.from(PNG_BASE64, "base64"));
  });

  test("sign in, apply, upload required documents, submit", async ({ page }) => {
    // 1. Sign in
    await page.goto("/login");
    await page.locator('input[autocomplete="email"]').fill(EMAIL);
    await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/student", { timeout: 30_000 });
    await page.screenshot({ path: "e2e-results/01-signed-in.png", fullPage: true });

    // 2. Open the application form
    await page.goto("/apply");
    await expect(page.getByRole("heading", { name: "Apply to a university" })).toBeVisible({ timeout: 30_000 });

    // 3. Fill every PRD 4.2.3 field
    const uni = page.locator("#universityId");
    await expect(uni.locator("option")).not.toHaveCount(1, { timeout: 30_000 });
    await uni.selectOption({ index: 1 });
    await page.locator("#studyLevel").selectOption("Bachelors");
    await page.locator("#apply-intake").selectOption("September 2026");
    const fields = {
      "Course name": "BSc Computer Science",
      "Full name": "Playwright Test Student",
      "Nationality": "Romanian",
      "Phone": "07000000000",
      "Passport number": "E2E123456",
      "Address": "1 Test Street, Southampton",
      "Previous qualification": "A Levels",
      "Institution name": "Test College",
      "Graduation year": "2024",
      "GPA / Grade": "AAB",
    };
    for (const [label, value] of Object.entries(fields)) {
      await page.getByLabel(label, { exact: true }).fill(value);
    }
    await page.getByLabel("Date of birth").fill("2003-05-14");
    await page.locator("#personalStatement").fill(
      "Automated end-to-end check of the UAAMS demo path. This application was created by the Playwright regression test."
    );
    await page.screenshot({ path: "e2e-results/02-form-filled.png", fullPage: true });

    // 4. Upload the three mandatory documents (PRD 4.2.3 / issue #152)
    const docsSection = page.locator("section", { has: page.getByRole("heading", { name: "4. Supporting documents" }) });
    const cards = docsSection.locator("div.my-3");
    for (let i = 0; i < 3; i += 1) {
      const card = cards.nth(i);
      await card.locator('input[type="file"]').setInputFiles(fixture);
      await card.getByRole("button", { name: /Upload|Replace/ }).click();
      await expect(card.getByText("Attached")).toBeVisible({ timeout: 60_000 });
    }
    await page.screenshot({ path: "e2e-results/03-documents-attached.png", fullPage: true });

    // 5. Submit
    const submit = page.getByRole("button", { name: "Submit application" });
    await expect(submit).toBeEnabled({ timeout: 15_000 });
    await submit.click();
    await expect(page.getByText("Application submitted successfully.")).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: "e2e-results/05-submitted-confirmation.png", fullPage: true });

    // 6. Dashboard shows the submitted application
    await page.waitForURL("**/student", { timeout: 30_000 });
    await expect(page.getByText("Submitted").first()).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "e2e-results/04-dashboard-submitted.png", fullPage: true });
  });
});
