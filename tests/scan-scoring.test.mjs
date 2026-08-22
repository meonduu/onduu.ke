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
    dns: { nsHosts: ["ns1.cloudflare.com", "ns2.cloudflare.com"], dsPresent: true, dnskeyPresent: true },
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

test("a fully healthy domain scores 100 at 100% coverage, over all 21 signals", () => {
  const signals = evaluateSignals(healthyObservations());
  // 21 since psr-v3 (22 Aug 2026): spf, dkim, dmarc and mx became one
  // "email-auth" row at their combined weight, so Resilience's share of
  // the score is unchanged and only the row count moved.
  assert.equal(signals.length, 21);
  assert.equal(new Set(signals.map((s) => s.id)).size, 21, "signal ids are unique");
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

test("one unknowable email record does not make the whole row unobservable", () => {
  const obs = healthyObservations();
  // DKIM selectors not found → /check reports "info". Under psr-v2 that
  // made a 4-point signal unobservable and cost 4 points of coverage. As
  // one row, throwing away three good observations because a fourth
  // could not be made would be the wrong trade: the row stays observed,
  // says which record could not be determined, and passes on the three
  // that could.
  obs.email.result.checks.dkim = { status: "info", detail: "No DKIM key found at common selectors." };
  const signals = evaluateSignals(obs);
  const email = signals.find((s) => s.id === "email-auth");
  assert.equal(email.status, "pass");
  assert.match(email.evidence, /3 of 4 records in order/);
  assert.match(email.evidence, /DKIM not determinable from outside/);

  const { score, coverage } = scoreSignals(signals);
  assert.equal(score, 100);
  assert.equal(coverage, 100);
});

test("only when every email record is unknowable does the row leave the score (rule 2)", () => {
  const obs = healthyObservations();
  for (const k of ["spf", "dkim", "dmarc", "mx"]) obs.email.result.checks[k] = { status: "info", detail: "x" };
  const signals = evaluateSignals(obs);
  assert.equal(signals.find((s) => s.id === "email-auth").status, "unobservable");
  const { score, coverage } = scoreSignals(signals);
  assert.equal(score, 100, "what remains observable still passes");
  assert.equal(coverage, 78, "coverage drops by the row's full weight (22)");
});

test("failures and warnings move the score deterministically", () => {
  const obs = healthyObservations();
  obs.email.result.checks.dmarc = { status: "fail", detail: "No DMARC record." };
  obs.homepage.timingMs = 1200; // ttfb warn, weight 4 → 2
  const { score, coverage } = scoreSignals(evaluateSignals(obs));
  // Under psr-v2 a missing DMARC cost its own 8 points. Under psr-v3 it
  // fails the whole 22-point email row, because the row's verdict is the
  // worst of the four — which is also how a receiver treats the records.
  // A domain with no DMARC can be spoofed whatever SPF and DKIM say, so
  // keeping 14 points for tidy housekeeping around the hole was the
  // lenient reading. 100 - 22 - 2 = 76.
  assert.equal(score, 76);
  assert.equal(coverage, 100);
});

test("the email row grades pass, warn and fail like the single records it replaced", () => {
  const at = (dmarc) => {
    const obs = healthyObservations();
    obs.email.result.checks.dmarc = { status: dmarc, detail: "x" };
    return scoreSignals(evaluateSignals(obs)).score;
  };
  assert.equal(at("pass"), 100);
  assert.equal(at("warn"), 89, "warn earns half the row's weight: 100 - 11");
  assert.equal(at("fail"), 78, "fail earns none of it: 100 - 22");
});

test("the email row names spoofability when the tool reports it", () => {
  const obs = healthyObservations();
  obs.email.result.checks.dmarc = { status: "fail", detail: "x" };
  obs.email.result.spoofable = true;
  const email = evaluateSignals(obs).find((s) => s.id === "email-auth");
  assert.match(email.evidence, /can currently be forged/);
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

/* ── DNSSEC, aligned with /dns (owner decision, 22 Aug 2026) ─────────── */

test("the scan grades DNSSEC in three ways, matching the DNS checker", () => {
  // Until psr-v4 the scan graded on DS alone: no DS was "MISSING" in red,
  // and a broken chain — DS at the registry, no keys in the zone — was
  // called a pass. So /scan showed red for the safe-but-unsigned case and
  // green for the one that makes resolvers reject the domain. Both ends
  // were wrong, and no test noticed, because the only fixture had DS
  // present. These cover all four outcomes.
  const dnssecOf = (dns) => {
    const obs = healthyObservations();
    obs.dns = { ...obs.dns, ...dns };
    return evaluateSignals(obs).find((s) => s.id === "dnssec");
  };

  assert.equal(dnssecOf({ dsPresent: true, dnskeyPresent: true }).status, "pass");

  // Unsigned: an advisory, never red. The domain works, and most domains
  // in this market do not sign.
  const absent = dnssecOf({ dsPresent: false, dnskeyPresent: false });
  assert.equal(absent.status, "warn");
  assert.match(absent.evidence, /not enabled/);
  assert.doesNotMatch(absent.evidence, /No DS record/, "the old red wording must not survive the grade change");

  // Broken chain: the one that genuinely breaks resolution.
  const broken = dnssecOf({ dsPresent: true, dnskeyPresent: false });
  assert.equal(broken.status, "fail");
  assert.match(broken.evidence, /reject this domain/);

  // A failed query is still unobservable, not a verdict either way.
  assert.equal(dnssecOf({ dsPresent: null, dnskeyPresent: null }).status, "unobservable");
});

test("an unsigned domain scores above one with a broken chain", () => {
  // The point of the split: half credit for unsigned, none for broken.
  // dnssec carries weight 4, so the gap is 2 points on a 100 scale.
  const scoreWith = (dns) => {
    const obs = healthyObservations();
    obs.dns = { ...obs.dns, ...dns };
    return scoreSignals(evaluateSignals(obs)).score;
  };
  const signed = scoreWith({ dsPresent: true, dnskeyPresent: true });
  const unsigned = scoreWith({ dsPresent: false, dnskeyPresent: false });
  const broken = scoreWith({ dsPresent: true, dnskeyPresent: false });

  assert.equal(signed, 100);
  assert.equal(unsigned, 98, "half of the 4-point dnssec weight");
  assert.equal(broken, 96, "none of it");
  assert.ok(unsigned > broken, "an unsigned domain must not score below a broken chain");
});

test("the rubric version bumped so cached scans re-run under the new grading", () => {
  // Same weights as psr-v3; the version exists because the same domain now
  // scores differently. A cached v3 result must not be served under v4.
  assert.equal(CURRENT_RUBRIC, "psr-v4");
  assert.deepEqual(RUBRICS["psr-v4"].weights, RUBRICS["psr-v3"].weights);
});

/* ── a 52x is an absence of evidence, not a failure ──────────────────── */

test("a Cloudflare origin error reports unobservable, never MISSING", () => {
  // Found 22 Aug 2026 by scanning onduu.ke on production. It runs as a
  // Worker with no origin behind it, so the scan fetched its own zone, got
  // 522, and reported eleven signals as MISSING — no title, no h1, no
  // robots.txt, a 0 KiB homepage — about a site serving perfectly to
  // everyone else. Written for any 52x, not for our own domain: a
  // customer's site can 52x mid-scan and deserves the same answer.
  const obs = healthyObservations();
  const dead = (page) => ({ ...page, status: 522, bodyBytes: 0, title: null, h1Count: 0,
    metaDescription: false, viewport: false, hasContactPath: false, hasJsonLd: false, jsonLdParses: false });
  obs.homepage = dead(obs.homepage);
  obs.httpProbe = dead(obs.httpProbe);
  obs.twin = { ...obs.twin, page: dead(obs.twin.page) };
  obs.missingProbe = dead(obs.missingProbe);
  obs.robots = { ...dead(obs.robots), looksLikeRobots: undefined };
  obs.sitemap = { ...dead(obs.sitemap), looksLikeSitemap: undefined };

  const signals = evaluateSignals(obs);
  const wrongly = signals.filter((s) => s.status === "fail").map((s) => `${s.id}: ${s.evidence}`);
  assert.deepEqual(wrongly, [], "a 52x must not produce a single failure");

  // The content signals go unobservable and say why, naming the status.
  for (const id of ["title-meta", "single-h1", "viewport", "contact-path", "robots", "sitemap", "structured-data"]) {
    const s = signals.find((x) => x.id === id);
    assert.equal(s.status, "unobservable", `${id} should be unobservable on a 522`);
    assert.match(s.evidence, /522/, `${id} should name the status it got`);
  }

  // DNS- and registry-side signals are untouched: they never needed the page.
  assert.equal(signals.find((s) => s.id === "dnssec").status, "pass");
  assert.equal(signals.find((s) => s.id === "expiry-buffer").status, "pass");
});

test("HTTPS does not pass while the site is answering with an error", () => {
  // It used to pass on any status, so a green badge sat beside "status 522".
  // TLS negotiating is not the same as the site serving.
  const withStatus = (status) => {
    const obs = healthyObservations();
    obs.homepage = { ...obs.homepage, status };
    return evaluateSignals(obs).find((s) => s.id === "https-certificate");
  };
  assert.equal(withStatus(200).status, "pass");
  assert.equal(withStatus(301).status, "pass");
  assert.equal(withStatus(522).status, "unobservable");
  assert.match(withStatus(522).evidence, /522/);
  assert.equal(withStatus(503).status, "unobservable");
});
