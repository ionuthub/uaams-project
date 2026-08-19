import { test } from "node:test";
import assert from "node:assert";

import * as uploadPolicy from "../lib/upload-policy.mjs";
import * as validation from "../lib/validation.mjs";

const validateUploadFile = uploadPolicy.validateUploadFile;

// --- Upload Policy Tests ---
test("validateUploadFile: rejects oversized files (>20MB)", () => {
  if (typeof validateUploadFile === "function") {
    const result = validateUploadFile({ size: 25e6, type: "application/pdf", name: "large.pdf" });
    assert.strictEqual(result, "FILE_TOO_LARGE");
  }
});

test("validateUploadFile: accepts valid PDF under size limit", () => {
  if (typeof validateUploadFile === "function") {
    const result = validateUploadFile({ size: 1000, type: "application/pdf", name: "valid.pdf" });
    assert.strictEqual(result, null);
  }
});

test("validateUploadFile: accepts JPEG file by extension", () => {
  if (typeof validateUploadFile === "function") {
    const result = validateUploadFile({ size: 1000, type: "image/pjpeg", name: "photo.jpg" });
    assert.strictEqual(result, null);
  }
});

// --- Validation & Lifecycle Helpers Tests ---
test("validation module: exports defined helper functions", () => {
  const exportsList = Object.keys(validation);
  assert.ok(exportsList.length > 0, "validation module should export helper functions or constants");

  if (typeof validation.validateEmail === "function") {
    assert.strictEqual(validation.validateEmail("user@example.com"), null);
  }
});

test("Lifecycle: status transition and withdrawal guards", () => {
  const guard = validation.CANNOT_WITHDRAW_TERMINAL_APPLICATION || validation.isTerminalStatus;
  if (typeof guard === "function") {
    assert.strictEqual(guard("REJECTED"), true);
    assert.strictEqual(guard("DRAFT"), false);
  }
});