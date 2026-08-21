import assert from "node:assert/strict";
import test from "node:test";
import { validate, reference, normaliseKind } from "../worker/submissions.ts";

const valid = {
  full_name: "Jane Wanjiru",
  business_email: "jane@example.co.ke",
  company: "Example Ltd",
  consent: true,
};

test("accepts a minimal valid fitness request", () => {
  const result = validate("fitness", valid);
  assert.equal(result.ok, true);
});

test("rejects an unknown form kind", () => {
  assert.equal(validate("nonsense", valid).ok, false);
});

// The Digital Fitness rename (20 Aug 2026) changed this form's kind from
// "readiness" to "fitness". A visitor whose tab predates the deploy still
// posts the old value; rejecting it would lose a real enquiry for a reason
// they could neither see nor fix.
test("still accepts the pre-rename form kind", () => {
  assert.equal(validate("readiness", valid).ok, true);
  assert.equal(normaliseKind("readiness"), "fitness", "the legacy value is stored as the new one");
  assert.equal(normaliseKind("contact"), "contact", "other kinds are untouched");
  assert.equal(normaliseKind("nonsense"), "nonsense", "normalising is not validating");
});

test("requires name, business email, company and consent", () => {
  for (const missing of ["full_name", "business_email", "company"]) {
    const body = { ...valid, [missing]: "" };
    const result = validate("fitness", body);
    assert.equal(result.ok, false, `${missing} should be required`);
    assert.ok(result.errors[missing], `${missing} should report an error`);
  }
  const noConsent = validate("fitness", { ...valid, consent: false });
  assert.equal(noConsent.ok, false);
  assert.ok(noConsent.errors.consent);
});

test("rejects malformed email addresses", () => {
  for (const bad of ["jane", "jane@", "@example.ke", "jane example.ke", "jane@example"]) {
    const result = validate("fitness", { ...valid, business_email: bad });
    assert.equal(result.ok, false, `should reject: ${bad}`);
    assert.ok(result.errors.business_email);
  }
});

test("rejects non-http website URLs but allows bare domains", () => {
  const bad = validate("fitness", { ...valid, website_url: "javascript:alert(1)" });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.website_url);

  assert.equal(validate("fitness", { ...valid, website_url: "example.co.ke" }).ok, true);
  assert.equal(validate("fitness", { ...valid, website_url: "https://example.co.ke" }).ok, true);
});

test("enforces the allowlist on primary concern and enquiry type", () => {
  const badConcern = validate("fitness", { ...valid, primary_concern: "everything" });
  assert.equal(badConcern.ok, false);
  assert.ok(badConcern.errors.primary_concern);

  assert.equal(
    validate("fitness", { ...valid, primary_concern: "Not enough enquiries reaching us" }).ok,
    true,
  );

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
  const result = validate("fitness", { ...valid, full_name: "a".repeat(500) });
  assert.equal(result.ok, false);
  assert.match(result.errors.full_name, /under \d+ characters/);
});

test("trims surrounding whitespace", () => {
  const result = validate("fitness", { ...valid, full_name: "  Jane Wanjiru  " });
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

test("attribution fields are accepted and length-capped", () => {
  const result = validate("fitness", {
    ...valid,
    referrer: "https://www.linkedin.com/feed/",
    landing_path: "/insights/ai-in-kenya-is-about-workflow",
    submitted_from: "/digital-fitness",
    utm_source: "linkedin",
    utm_medium: "social",
    utm_campaign: "august-domains",
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.utm_source, "linkedin");
  assert.equal(result.data.referrer, "https://www.linkedin.com/feed/");

  const long = validate("fitness", { ...valid, utm_source: "x".repeat(400) });
  assert.equal(long.ok, false, "an oversized utm must be rejected, not stored");
});

test("a malformed referrer is dropped rather than failing the form", () => {
  // Attribution is context, not something the visitor typed. A junk value must
  // never block a real enquiry.
  const result = validate("fitness", {
    ...valid,
    referrer: "javascript:alert(1)",
    landing_path: "not-a-path",
  });
  assert.equal(result.ok, true, "a bad referrer must not fail the submission");
  assert.equal(result.data.referrer, "");
  assert.equal(result.data.landing_path, "");
});

test("attribution is never required", () => {
  const result = validate("fitness", valid);
  assert.equal(result.ok, true);
  assert.equal(result.data.utm_source, "");
});
