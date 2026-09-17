import test from "node:test";
import assert from "node:assert/strict";
import { formatReference, applicationReference, matchesApplicationSearch } from "../lib/application-reference.mjs";
import { referenceResponse } from "../lib/application-reference-server.mjs";

test("readable references retain all digits and reject invalid counters", () => {
  assert.equal(formatReference(2026, 142), "APP-2026-00142");
  assert.equal(formatReference(2026, 100000), "APP-2026-100000");
  for (const count of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatReference(2026, count));
  }
});

test("search accepts readable reference, legacy ID and applicant name", () => {
  const application = { id: "pfaXhvbmmk55N8mwb1Xm", referenceNumber: "APP-2026-00142", form: { fullName: "Playwright Test Student" } };
  assert.equal(applicationReference(application), "APP-2026-00142");
  for (const query of [" app-2026-00142 ", "pfaxhvb", "TEST student"]) assert.ok(matchesApplicationSearch(application, query));
  assert.equal(matchesApplicationSearch(application, "APP-2026-00143"), false);
  assert.equal(applicationReference({ id: "legacy" }), "legacy");
});

const request = (body, token = "valid") => new Request("http://localhost/api/applications/references", {
  method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body),
});

test("reference endpoint rejects missing/invalid tokens and unverified accounts", async () => {
  const deps = { getAuth: () => ({ verifyIdToken: async () => { throw new Error("bad token"); } }), getDb: () => ({}) };
  assert.equal((await referenceResponse(request({ applicationIds: ["one"] }, ""), deps)).status, 401);
  assert.equal((await referenceResponse(request({ applicationIds: ["one"] }), deps)).status, 401);
  deps.getAuth = () => ({ verifyIdToken: async () => ({ uid: "test", email_verified: false }) });
  assert.equal((await referenceResponse(request({ applicationIds: ["one"] }), deps)).status, 403);
});

test("reference endpoint bounds batch size and refuses invalid document paths", async () => {
  for (const ids of [[], ["a/b"], [null], Array.from({ length: 21 }, (_, i) => `app${i}`)]) {
    assert.equal((await referenceResponse(request({ applicationIds: ids }), {})).status, 400);
  }
  assert.equal((await referenceResponse(request({ applicationIds: ["one"] }), {
    getAuth: () => { throw new Error("missing configuration"); },
  })).status, 503);
});
