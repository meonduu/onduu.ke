// Launch gate 3 (docs/specs/instant-scan.md §7): the scoring-replay suite.
// Signals must be a pure function of Observations, scoring a pure function
// of signals, and a JSON round trip of stored observations must reproduce
// both byte-for-byte. Entirely offline.
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSignals } from "../worker/scan/signals.ts";
import { scoreSignals, RUBRICS, CURRENT_RUBRIC } from "../worker/scan/rubric.ts";

/** A fully observable, all-healthy set of observations. */
function healthyObservations() {
  const page = {
    fetched: true,
    finalUrl: "https://example.co.ke/",
    status: 200,
    timingMs: 300,
    bodyBytes: 45 * 1024,
    contentLength: 40 * 1024,
    truncated: false,
    chain: [],
    headers: {
      "content-type": "text/html; charset=utf-8",
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    },
    title: "Example Ltd — clarity for Kenyan businesses",
    metaDescription: true,
    viewport: true,
    h1Count: 1,
    hasContactPath: true,
    hasJsonLd: true,
    jsonLdParses: true,
  };
  return {
    domain: "example.co.ke",
    scannedAt: "2026-08-18T10:00:00.000Z",
    rdap: {
      fetched: true,
      expiryDate: "2027-06-01T00:00:00Z",
      eppStatuses: ["clientTransferProhibited"],
      registrar: "Example Registrar",
    },
    dns: { nsHosts: ["ns1.cloudflare.com", "ns2.cloudflare.com"], dsPresent: true },
    homepage: page,
    httpProbe: {
      ...page,
      chain: [{ url: "http://example.co.ke/", status: 301, location: "https://example.co.ke/" }],
    },
    twin: { host: "www.example.co.ke", page: { ...page } },
    robots: { ...page, headers: { "content-type": "text/plain" }, looksLikeRobots: true },
    sitemap: { ...page, headers: { "content-type": "application/xml" }, looksLikeSitemap: true },
    missingProbe: { ...page, status: 404 },
    email: {
      fetched: true,
      result: {
        ok: true,
        provider: "Google Workspace",
        mailConfigured: true,
        checks: {
          spf: { status: "pass", detail: "One SPF record ending -all." },
          dkim: { status: "pass", detail: "A DKIM key was found.", record: "v=DKIM1;" },
          dmarc: { status: "pass", detail: "p=reject is published." },
          mx: { status: "pass", detail: "Mail is delivered.", record: "1 aspmx.l.google.com" },
        },
      },
    },
  };
}

test("psr-v1 weights sum to exactly 100", () => {
  const total = Object.values(RUBRICS[CURRENT_RUBRIC].weights).reduce((s, w) => s + w.weight, 0);
  assert.equal(total, 100);
});

test("a fully healthy domain scores 100 at 100% coverage, over all 24 signals", () => {
  const signals = evaluateSignals(healthyObservations());
  assert.equal(signals.length, 24);
  assert.equal(new Set(signals.map((s) => s.id)).size, 24, "signal ids are unique");
  for (const s of signals) assert.equal(s.status, "pass", `${s.id} should pass: ${s.evidence}`);
  const { score, coverage } = scoreSignals(signals);
  assert.equal(score, 100);
  assert.equal(coverage, 100);
});

test("every signal id maps to a rubric weight and vice versa", () => {
  const signals = evaluateSignals(healthyObservations());
  const rubricIds = new Set(Object.keys(RUBRICS[CURRENT_RUBRIC].weights));
  for (const s of signals) assert.ok(rubricIds.has(s.id), `unknown signal: ${s.id}`);
  assert.equal(signals.length, rubricIds.size, "every rubric row is evaluated");
});

test("unobservable signals leave both the score and the coverage (rule 2)", () => {
  const obs = healthyObservations();
  // DKIM selectors not found → /check reports "info" → unobservable.
  obs.email.result.checks.dkim = { status: "info", detail: "No DKIM key found at common selectors." };
  const signals = evaluateSignals(obs);
  const dkim = signals.find((s) => s.id === "dkim");
  assert.equal(dkim.status, "unobservable");

  const { score, coverage } = scoreSignals(signals);
  assert.equal(score, 100, "everything observed still passes, so the score stays 100");
  assert.equal(coverage, 96, "coverage drops by exactly DKIM's weight (4)");
});

test("failures and warnings move the score deterministically", () => {
  const obs = healthyObservations();
  obs.email.result.checks.dmarc = { status: "fail", detail: "No DMARC record." }; // weight 8 → 0
  obs.homepage.timingMs = 1200; // ttfb warn, weight 4 → 2
  const { score, coverage } = scoreSignals(evaluateSignals(obs));
  // 100 - 8 - 2 = 90 points of 100 observed weight.
  assert.equal(score, 90);
  assert.equal(coverage, 100);
});

test("an unreachable site keeps DNS-side observations and never fakes web signals", () => {
  const obs = healthyObservations();
  const dead = { fetched: false, error: "unresolvable", chain: [], headers: {} };
  obs.homepage = dead;
  obs.httpProbe = dead;
  obs.twin.page = dead;
  obs.robots = dead;
  obs.sitemap = dead;
  obs.missingProbe = dead;
  const signals = evaluateSignals(obs);
  const web = signals.filter((s) =>
    ["https-certificate", "http-to-https", "apex-www-coherence", "hsts", "security-headers", "title-meta", "ttfb-band", "html-weight", "viewport", "contact-path", "single-h1", "missing-page-handling", "structured-data", "robots", "sitemap"].includes(s.id),
  );
  for (const s of web) assert.equal(s.status, "unobservable", `${s.id} must be unobservable, not a fail`);
  const { score, coverage } = scoreSignals(signals);
  // Control (20) + Resilience (25) stay observable; all 55 weight-points of
  // web-fetch signals drop out.
  assert.equal(coverage, 45, "coverage collapses honestly to the DNS-side weight");
  assert.equal(score, 100, "what remains observable (DNS, email) still passes");
});

test("REPLAY: a JSON round trip of observations reproduces signals and score byte-for-byte", () => {
  const original = healthyObservations();
  original.email.result.checks.dmarc = { status: "warn", detail: "p=none only." };
  original.homepage.h1Count = 3;

  const firstSignals = evaluateSignals(original);
  const firstScore = scoreSignals(firstSignals);

  // Simulate store → retrieve: what D1 holds is JSON text.
  const restored = JSON.parse(JSON.stringify(original));
  const replaySignals = evaluateSignals(restored);
  const replayScore = scoreSignals(replaySignals);

  assert.equal(JSON.stringify(replaySignals), JSON.stringify(firstSignals));
  assert.equal(JSON.stringify(replayScore), JSON.stringify(firstScore));
});

test("scoring a stored signal set reproduces the stored score without observations", () => {
  const signals = evaluateSignals(healthyObservations());
  const first = scoreSignals(signals);
  const restored = JSON.parse(JSON.stringify(signals));
  assert.deepEqual(scoreSignals(restored), first);
});

test("unknown rubric versions and unknown signals are hard errors, never silent", () => {
  const signals = evaluateSignals(healthyObservations());
  assert.throws(() => scoreSignals(signals, "psr-v999"), /unknown rubric/);
  assert.throws(
    () => scoreSignals([...signals, { ...signals[0], id: "made-up" }]),
    /not in rubric/,
  );
});
