// scripts/smoke.mjs
// Post-deploy boot smoke check. Given a deployed URL, fetch the served page and
// its client chunks and assert the Firebase config was inlined into the bundle.
//
// This catches the class of failure where the app builds and deploys fine but
// cannot boot in the browser because NEXT_PUBLIC_FIREBASE_* values were missing
// at build time, or were read dynamically (process.env[key]) and therefore not
// inlined by Next.js into the client bundle.
//
// Usage: node scripts/smoke.mjs <deployedUrl>
// Exit 0 = healthy, 1 = boot failure, 2 = usage/inconclusive.

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error("smoke: no deployment URL provided");
  process.exit(2);
}
const base = rawUrl.replace(/\/+$/, "");

function fail(message) {
  console.error(`Smoke check FAILED: ${message}`);
  process.exit(1);
}

const pageResponse = await fetch(`${base}/`, { redirect: "follow" });
if (!pageResponse.ok) {
  fail(`homepage returned HTTP ${pageResponse.status}`);
}
const html = await pageResponse.text();

const chunkPaths = new Set();
for (const match of html.matchAll(/\/_next\/static\/chunks\/[^"\x27\s>]+?\.js/g)) {
  chunkPaths.add(match[0]);
}
if (chunkPaths.size === 0) {
  fail("no Next.js client chunks were referenced by the served page");
}

let firebaseConfigInlined = false;
for (const chunkPath of chunkPaths) {
  const chunkResponse = await fetch(`${base}${chunkPath}`);
  if (!chunkResponse.ok) continue;
  const chunk = await chunkResponse.text();
  // authDomain is "<projectId>.firebaseapp.com"; it only appears in the bundle
  // when the config was actually inlined at build time.
  if (chunk.includes(".firebaseapp.com")) {
    firebaseConfigInlined = true;
    break;
  }
}

if (!firebaseConfigInlined) {
  fail(
    "Firebase config was not inlined into the client bundle (no *.firebaseapp.com found). " +
      "The NEXT_PUBLIC_FIREBASE_* variables were missing at build time, or are read " +
      "dynamically (process.env[key]) instead of statically, so Firebase cannot " +
      "initialise in the browser and login will fail."
  );
}

console.log(`Smoke check passed: ${base} served and Firebase config is inlined.`);
