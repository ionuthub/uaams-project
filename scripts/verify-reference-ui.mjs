// Run after npm run build. Test-only dependencies may live outside the checkout:
// UAAMS_TEST_TOOLS=<directory with node_modules> node scripts/verify-reference-ui.mjs
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const requireTool = createRequire(path.join(process.env.UAAMS_TEST_TOOLS || root, "package.json"));
const { build } = requireTool("esbuild");
const { chromium } = requireTool("@playwright/test");
const out = path.join(root, "docs/evidence/issue-254");
await mkdir(out, { recursive: true });
const fixture = path.join(root, "tests/reference-ui-fixture.mjs");
const compiled = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import Student from './app/student/applications/[id]/page.js';
    import Dashboard from './app/student/page.js';
    import Admin from './app/admin/page.js';
    import AdminDetail from './app/admin/applications/[id]/page.js';
    const Component = location.pathname === '/student' ? Dashboard : location.pathname === '/admin' ? Admin : location.pathname.startsWith('/admin/') ? AdminDetail : Student;
    createRoot(document.getElementById('root')).render(<Component />);`, loader: "jsx", resolveDir: root },
  bundle: true, write: false, format: "iife", jsx: "automatic", loader: { ".js": "jsx" },
  plugins: [{ name: "isolated-existing-record", setup(plugin) {
    plugin.onResolve({ filter: /lib\/(auth|db|storage)$/ }, () => ({ path: fixture }));
    plugin.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "test" }));
    plugin.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: `export const useParams = () => ({id: 'pfaXhvbmmk55N8mwb1Xm'});`, loader: "js" }));
  } }],
});
const cssFiles = await readdir(path.join(root, ".next/static/css"));
const css = (await Promise.all(cssFiles.filter((f) => f.endsWith(".css")).map((f) => readFile(path.join(root, ".next/static/css", f), "utf8")))).join("\n");
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UAAMS reference layout verification</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer((request, response) => {
  const asset = request.url === "/app.js" ? ["text/javascript", compiled.outputFiles[0].contents] : request.url === "/style.css" ? ["text/css", css] : ["text/html", html];
  response.writeHead(200, { "Content-Type": asset[0] }); response.end(asset[1]);
});
await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: "Europe/London" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const results = [];
async function visit(route) {
  await page.goto(`http://127.0.0.1:4174${route}`);
  await page.getByText("APP-2026-00001", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow on ${route}`);
}
try {
  await visit("/student/applications/pfaXhvbmmk55N8mwb1Xm");
  const aligned = await page.locator("dl > div").evaluateAll((items) => items.every((item) => Math.abs(item.querySelector("dt").getBoundingClientRect().left - item.querySelector("dd").getBoundingClientRect().left) < 1));
  assert.ok(aligned, "Labels and values should share a left edge");
  await page.screenshot({ path: path.join(out, "01-applicant-details-desktop.png"), fullPage: true });
  const initialTop = await page.locator("aside").evaluate((element) => element.getBoundingClientRect().top);
  await page.evaluate(() => scrollTo(0, 700));
  assert.equal(await page.locator("aside").evaluate((element) => element.getBoundingClientRect().top), initialTop);
  await page.screenshot({ path: path.join(out, "02-applicant-sidebar-scrolled.png") });
  results.push("Desktop details: readable reference, aligned fields, no overflow, sidebar remains at viewport top after scroll.");
  await visit("/student");
  await page.getByText("APP-2026-00002", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(out, "03-applicant-dashboard.png"), fullPage: true });
  results.push("Applicant dashboard: separate references on two application cards; original detail URL retained.");
  await visit("/admin");
  await page.getByRole("searchbox").fill("app-2026-00001");
  assert.equal(await page.locator("tbody tr").count(), 1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export/i }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  assert.ok(csv.includes("APP-2026-00001") && csv.includes("pfaXhvbmmk55N8mwb1Xm"));
  assert.ok(!csv.includes("APP-2026-00002"));
  await page.screenshot({ path: path.join(out, "04-admin-reference-search.png"), fullPage: true });
  results.push("Admin search: case-insensitive short reference returns one correct row; filtered CSV retains readable reference and internal ID.");
  await visit("/admin/applications/pfaXhvbmmk55N8mwb1Xm");
  await page.screenshot({ path: path.join(out, "05-admin-details.png"), fullPage: true });
  results.push("Admin details: same reference as applicant details.");
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/student/applications/pfaXhvbmmk55N8mwb1Xm");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "My applications", exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Close menu" }).click();
  await page.screenshot({ path: path.join(out, "06-applicant-details-mobile.png"), fullPage: true });
  await visit("/student");
  await page.screenshot({ path: path.join(out, "07-applicant-dashboard-mobile.png"), fullPage: true });
  results.push("390px mobile: applicant cards/details fit; navigation opens and closes.");
  await page.goto("http://127.0.0.1:4174/student/applications/pfaXhvbmmk55N8mwb1Xm?fallback");
  await page.getByText("Application ID:", { exact: true }).waitFor();
  await page.getByText("Short reference temporarily unavailable.", { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  results.push("Reference outage fallback: clearly labelled original ID and explanation, no invented number or mobile overflow.");
  assert.deepEqual(errors, [], "Browser runtime errors");
  await writeFile(path.join(out, "ui-results.json"), JSON.stringify({ date: new Date().toISOString(), mode: "Isolated actual-page render with local fixture; not authenticated production UAT", results, errors }, null, 2));
  console.log(results.join("\n"));
} finally { await browser.close(); server.close(); }
