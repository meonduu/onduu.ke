import assert from "node:assert/strict";
import test from "node:test";
import { validate, reference } from "../worker/submissions.ts";

const valid = {
  full_name: "Jane Wanjiru",
  business_email: "jane@example.co.ke",
  company: "Example Ltd",
  consent: true,
};

test("accepts a minimal valid readiness request", () => {
  const result = validate("readiness", valid);
  assert.equal(result.ok, true);
});

test("rejects an unknown form kind", () => {
  assert.equal(validate("nonsense", valid).ok, false);
});

test("requires name, business email, company and consent", () => {
  for (const missing of ["full_name", "business_email", "company"]) {
    const body = { ...valid, [missing]: "" };
    const result = validate("readiness", body);
    assert.equal(result.ok, false, `${missing} should be required`);
    assert.ok(result.errors[missing], `${missing} should report an error`);
  }
  const noConsent = validate("readiness", { ...valid, consent: false });
  assert.equal(noConsent.ok, false);
  assert.ok(noConsent.errors.consent);
});

test("rejects malformed email addresses", () => {
  for (const bad of ["jane", "jane@", "@example.ke", "jane example.ke", "jane@example"]) {
    const result = validate("readiness", { ...valid, business_email: bad });
    assert.equal(result.ok, false, `should reject: ${bad}`);
    assert.ok(result.errors.business_email);
  }
});

test("rejects non-http website URLs but allows bare domains", () => {
  const bad = validate("readiness", { ...valid, website_url: "javascript:alert(1)" });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.website_url);

  assert.equal(validate("readiness", { ...valid, website_url: "example.co.ke" }).ok, true);
  assert.equal(validate("readiness", { ...valid, website_url: "https://example.co.ke" }).ok, true);
});

test("enforces the allowlist on primary concern and enquiry type", () => {
  const badConcern = validate("readiness", { ...valid, primary_concern: "everything" });
  assert.equal(badConcern.ok, false);
  assert.ok(badConcern.errors.primary_concern);

  assert.equal(validate("readiness", { ...valid, primary_concern: "leads" }).ok, true);

  const badType = validate("contact", {
    ...valid,
    business_result: "More qualified enquiries.",
    enquiry_type: "something else",
  });
  assert.equal(badType.ok, false);
  assert.ok(badType.errors.enquiry_type);
});

test("contact requires the business result the brief asks for", () => {
  const missing = validate("contact", valid);
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.business_result);

  const provided = validate("contact", { ...valid, business_result: "More qualified enquiries." });
  assert.equal(provided.ok, true);
});

test("enforces field length limits rather than silently truncating", () => {
  const result = validate("readiness", { ...valid, full_name: "a".repeat(500) });
  assert.equal(result.ok, false);
  assert.match(result.errors.full_name, /under \d+ characters/);
});

test("trims surrounding whitespace", () => {
  const result = validate("readiness", { ...valid, full_name: "  Jane Wanjiru  " });
  assert.equal(result.ok, true);
  assert.equal(result.data.full_name, "Jane Wanjiru");
});

test("references are unique, dated and safe to quote", () => {
  const now = new Date("2026-08-15T12:00:00Z");
  const ref = reference(now, () => 0.5);
  assert.match(ref, /^ON-260815-[0-9A-Z]{4}$/);

  const seen = new Set();
  for (let i = 0; i < 500; i++) seen.add(reference());
  assert.ok(seen.size > 450, `expected mostly unique references, got ${seen.size}/500`);
});
