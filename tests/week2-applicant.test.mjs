import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_UPLOAD_BYTES,
  validateUploadFile,
} from "../lib/upload-policy.mjs";
import {
  APPLICATION_STATUS_CONFIG,
  getApplicationStatusConfig,
} from "../lib/application-statuses.mjs";

test("accepts each permitted Week 2 upload type at the 10 MB boundary", () => {
  for (const type of ["application/pdf", "image/jpeg", "image/png"]) {
    assert.equal(validateUploadFile({ size: MAX_UPLOAD_BYTES, type }), null);
  }
});

test("rejects missing, oversized and unsupported uploads", () => {
  assert.equal(validateUploadFile(null), "NO_FILE");
  assert.equal(
    validateUploadFile({ size: MAX_UPLOAD_BYTES + 1, type: "application/pdf" }),
    "FILE_TOO_LARGE"
  );
  assert.equal(
    validateUploadFile({ size: 100, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    "INVALID_TYPE"
  );
});

test("provides readable text for every Week 2 application status", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(APPLICATION_STATUS_CONFIG).map(([status, config]) => [
        status,
        config.label,
      ])
    ),
    {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under review",
      offer: "Offer",
      rejected: "Rejected",
    }
  );
});

test("uses an honest text fallback for an unknown application status", () => {
  assert.deepEqual(getApplicationStatusConfig("withdrawn"), {
    label: "withdrawn",
    className: "badgeDefault",
  });
  assert.deepEqual(getApplicationStatusConfig(null), {
    label: "Unknown",
    className: "badgeDefault",
  });
});
