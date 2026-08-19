// Launch gate 2 (docs/specs/instant-scan.md §7): the abuse suite — the
// launch flag, rate limiting, result caching and the do-not-scan list.
import assert from "node:assert/strict";
import test from "node:test";
import { startWorker, fetchPath } from "./helpers/server.mjs";
import { isBlocked } from "../worker/scan/do-not-scan.ts";

// Force the launch flag off for this file's Worker, so the flag-off assertion
// holds even if a developer's gitignored .dev.vars sets SCAN_ENABLED=true.
await startWorker(["--var", "SCAN_ENABLED:false"]);
import {
  scanReference,
  withinScanRateLimit,
  findRecentScan,
  saveScan,
  isDomainBlocklisted,
  optOutDomain,
  SCANS_PER_HOUR,
  CACHE_TTL_MS,
} from "../worker/scan/store.ts";
import { runScan } from "../worker/scan/scan.ts";
import { logToolCheck } from "../worker/tool-log.ts";

/* ── the launch gate itself, through the real built Worker ── */

test("without SCAN_ENABLED the endpoint is indistinguishable from a missing route", async () => {
  const post = await fetchPath("/api/scan", "application/json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain: "example.co.ke" }),
  });
  assert.equal(post.status, 404, "POST must 404 while the flag is off");

  const get = await fetchPath("/api/scan", "application/json");
  assert.equal(get.status, 404, "GET must 404 while the flag is off");
});

/* ── an in-memory D1 stand-in for the store's queries ── */

function fakeDb() {
  const throttle = new Map();
  const scans = [];
  const blocklist = new Map();
  const checks = [];
  return {
    scans,
    throttle,
    blocklist,
    checks,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM scan_throttle")) return throttle.get(args[0]) ?? null;
              if (sql.includes("FROM scan_blocklist")) {
                // args are the candidate suffixes; hit if any is blocklisted.
                return args.some((d) => blocklist.has(d)) ? { 1: 1 } : null;
              }
              if (sql.includes("FROM scans")) {
                const [domain, cutoff] = args;
                const hit = scans
                  .filter((s) => s.domain === domain && s.created_at >= cutoff)
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                return hit ?? null;
              }
              throw new Error(`unexpected first(): ${sql}`);
            },
            async run() {
              if (sql.startsWith("INSERT INTO scan_throttle")) {
                throttle.set(args[0], { window_start: args[1], count: 1 });
              } else if (sql.includes("scan_throttle SET count")) {
                throttle.get(args[0]).count += 1;
              } else if (sql.startsWith("INSERT INTO scan_blocklist")) {
                blocklist.set(args[0], { created_at: args[1], note: args[2] });
                return { meta: { changes: 1 } };
              } else if (sql.startsWith("INSERT INTO tool_checks")) {
                checks.push({ tool: args[0], query: args[1], summary: args[2], detail: args[3] });
                return { meta: { changes: 1 } };
              } else if (sql.startsWith("DELETE FROM tool_checks")) {
                const [exact, likePattern, detailPattern] = args;
                const suffix = likePattern.replace(/^%/, "");
                const needle = detailPattern.replace(/^%/, "").replace(/%$/, "");
                const before = checks.length;
                for (let i = checks.length - 1; i >= 0; i--) {
                  const c = checks[i];
                  if (c.query === exact || c.query.endsWith(suffix) || (c.detail ?? "").includes(needle)) {
                    checks.splice(i, 1);
                  }
                }
                return { meta: { changes: before - checks.length } };
              } else if (sql.startsWith("DELETE FROM scans")) {
                const [exact, likePattern] = args;
                const suffix = likePattern.replace(/^%/, "");
                const before = scans.length;
                for (let i = scans.length - 1; i >= 0; i--) {
                  if (scans[i].domain === exact || scans[i].domain.endsWith(suffix)) scans.splice(i, 1);
                }
                return { meta: { changes: before - scans.length } };
              } else if (sql.startsWith("INSERT INTO scans")) {
                scans.push({
                  reference: args[0],
                  domain: args[1],
                  rubric_version: args[2],
                  observations: args[3],
                  signals: args[4],
                  score: args[5],
                  coverage: args[6],
                  created_at: args[7],
                });
              } else {
                throw new Error(`unexpected run(): ${sql}`);
              }
            },
          };
        },
      };
    },
  };
}

/* ── rate limiting ── */

test(`the rate limit allows ${SCANS_PER_HOUR} scans an hour, then refuses, then resets`, async () => {
  const db = fakeDb();
  const t0 = Date.parse("2026-08-18T10:00:00Z");
  for (let i = 0; i < SCANS_PER_HOUR; i++) {
    assert.equal(await withinScanRateLimit(db, "client-a", t0 + i * 1000), true, `scan ${i + 1} allowed`);
  }
  assert.equal(await withinScanRateLimit(db, "client-a", t0 + 6000), false, "sixth refused");
  assert.equal(await withinScanRateLimit(db, "client-b", t0 + 6000), true, "other clients unaffected");
  assert.equal(
    await withinScanRateLimit(db, "client-a", t0 + 61 * 60 * 1000),
    true,
    "window expiry resets the client",
  );
});

/* ── result caching ── */

test("a stored scan is served from cache inside the TTL and ignored after it", async () => {
  const db = fakeDb();
  const createdAt = "2026-08-18T10:00:00.000Z";
  await saveScan(db, {
    reference: "SC-260818-TEST",
    domain: "example.co.ke",
    rubricVersion: "psr-v1",
    observations: { domain: "example.co.ke", scannedAt: createdAt },
    signals: [],
    score: 77,
    coverage: 88,
    createdAt,
  });

  const withinTtl = Date.parse(createdAt) + CACHE_TTL_MS - 60_000;
  const hit = await findRecentScan(db, "example.co.ke", withinTtl);
  assert.ok(hit, "cache hit inside the TTL");
  assert.equal(hit.score, 77);
  assert.equal(hit.observations.domain, "example.co.ke", "observations survive the JSON round trip");

  const afterTtl = Date.parse(createdAt) + CACHE_TTL_MS + 60_000;
  assert.equal(await findRecentScan(db, "example.co.ke", afterTtl), null, "stale results are not served");
  assert.equal(await findRecentScan(db, "other.co.ke", withinTtl), null, "other domains never match");
});

test("a cached domain is answered without any collection or storage", async () => {
  const db = fakeDb();
  const now = new Date().toISOString();
  await saveScan(db, {
    reference: "SC-260818-CACH",
    domain: "cached.example",
    rubricVersion: "psr-v1",
    observations: { domain: "cached.example", scannedAt: now },
    signals: [],
    score: 50,
    coverage: 60,
    createdAt: now,
  });
  const before = db.scans.length;
  const outcome = await runScan("https://cached.example/whatever", db);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.body.cached, true);
  assert.equal(outcome.body.reference, "SC-260818-CACH");
  assert.equal(db.scans.length, before, "no new row was written");
});

/* ── the existence pre-flight ── */

// Stub the network so the pre-flight can be driven precisely: DoH answers
// NXDOMAIN, and RDAP answers whatever the case under test needs.
function stubNet({ rdapStatus = 404, rdapBody = { errorCode: 404 } } = {}) {
  const real = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const u = new URL(typeof input === "string" ? input : input.url);
    if (u.hostname === "cloudflare-dns.com") {
      const name = (u.searchParams.get("name") || "").toLowerCase();
      // RDAP hostnames must resolve for the guarded fetch's pre-flight.
      if (name.startsWith("rdap.")) return Response.json({ Status: 0, Answer: [{ name, type: 1, data: "197.248.1.1" }] });
      return Response.json({ Status: 3, Answer: [] });   // NXDOMAIN
    }
    if (u.hostname.startsWith("rdap."))
      return Response.json(rdapBody, { status: rdapStatus, headers: { "content-type": "application/rdap+json" } });
    return Response.json({}, { status: 404 });
  };
  return () => { globalThis.fetch = real; };
}

test("an unregistered domain is reported as such, never scored", async () => {
  // Reported 19 Aug 2026: example.ke came back 0/100 at 4% coverage, which
  // reads as a terrible domain rather than one that does not exist.
  const db = fakeDb();
  const restore = stubNet();
  try {
    const outcome = await runScan("example.ke", db);
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 404);
    assert.match(outcome.error, /is not registered/i);
    assert.equal(outcome.next.href, "/kedomains", "the visitor is sent somewhere useful");
    assert.equal(db.scans.length, 0, "nothing may be stored for a domain that does not exist");
  } finally { restore(); }
});

test("a reserved name says so, and is not scored either", async () => {
  const db = fakeDb();
  const restore = stubNet({
    rdapStatus: 200,
    rdapBody: {
      objectClassName: "domain",
      ldhName: "simba.ke",
      notices: [{ title: "Prohibited String", description: ["This domain is not allowed under registry policy (2306)."] }],
      variants: [{ relations: ["RESTRICTED_REGISTRATION"] }],
    },
  });
  try {
    const outcome = await runScan("simba.ke", db);
    assert.equal(outcome.ok, false);
    assert.match(outcome.error, /does not allow it to be registered/i);
    assert.equal(db.scans.length, 0);
  } finally { restore(); }
});

test("when the registry cannot be reached, the scan says so instead of scoring zero", async () => {
  const db = fakeDb();
  const restore = stubNet({ rdapStatus: 500, rdapBody: {} });
  try {
    const outcome = await runScan("unreachable.co.ke", db);
    assert.equal(outcome.ok, false);
    assert.match(outcome.error, /did not answer/i);
    assert.equal(db.scans.length, 0);
  } finally { restore(); }
});

/* ── input validation and the do-not-scan list ── */

test("invalid targets are refused before any database or network use", async () => {
  const db = {
    prepare() {
      throw new Error("db must not be touched");
    },
  };
  for (const bad of ["", "localhost", "127.0.0.1", "0x7f.1", "::1", "not a domain"]) {
    const outcome = await runScan(bad, db);
    assert.equal(outcome.ok, false, `should refuse: ${JSON.stringify(bad)}`);
    assert.equal(outcome.status, 400);
  }
});

test("the do-not-scan list blocks a domain and every subdomain of it", () => {
  const list = new Set(["blocked.co.ke"]);
  assert.equal(isBlocked("blocked.co.ke", list), true);
  assert.equal(isBlocked("www.blocked.co.ke", list), true);
  assert.equal(isBlocked("deep.sub.blocked.co.ke", list), true);
  assert.equal(isBlocked("notblocked.co.ke", list), false);
  assert.equal(isBlocked("blocked.co.ke.evil.example", list), false, "suffix tricks do not match");
});

test("opt-out records the domain in the blocklist and deletes its stored results", async () => {
  const db = fakeDb();
  const now = new Date().toISOString();
  for (const domain of ["optout.co.ke", "www.optout.co.ke", "keepme.co.ke"]) {
    await saveScan(db, {
      reference: "SC-260818-" + domain.slice(0, 4).toUpperCase(),
      domain,
      rubricVersion: "psr-v1",
      observations: { domain, scannedAt: now },
      signals: [],
      score: 70,
      coverage: 80,
      createdAt: now,
    });
  }

  const { deleted } = await optOutDomain(db, "optout.co.ke", "owner emailed 18 Aug");
  assert.equal(deleted, 2, "the domain and its subdomain result are both deleted");
  assert.equal(db.scans.filter((s) => s.domain.endsWith("optout.co.ke")).length, 0);
  assert.equal(db.scans.some((s) => s.domain === "keepme.co.ke"), true, "other domains untouched");
});

test("a blocklisted domain and its subdomains are refused before any scan", async () => {
  const db = fakeDb();
  await optOutDomain(db, "blocked.co.ke");

  assert.equal(await isDomainBlocklisted(db, "blocked.co.ke"), true);
  assert.equal(await isDomainBlocklisted(db, "www.blocked.co.ke"), true, "subdomains inherit the block");
  assert.equal(await isDomainBlocklisted(db, "notblocked.co.ke"), false);
  assert.equal(
    await isDomainBlocklisted(db, "blocked.co.ke.evil.example"),
    false,
    "suffix tricks do not match a blocklist entry",
  );

  const refused = await runScan("https://www.blocked.co.ke/", db);
  assert.equal(refused.ok, false);
  assert.equal(refused.status, 403);
});

/* ── references ── */

test("scan references are dated, well-formed and distinguishable from enquiries", () => {
  const ref = scanReference(new Date("2026-08-18T12:00:00Z"), () => 0.5);
  assert.match(ref, /^SC-260818-[A-Z0-9]{4}$/);
  const seen = new Set();
  for (let i = 0; i < 500; i++) seen.add(scanReference());
  assert.ok(seen.size > 450, "references are mostly unique");
});

/* ── opt-out covers everything stored about a domain ── */

test("opt-out deletes stored lookup results as well as scans", async () => {
  const db = fakeDb();
  const now = new Date().toISOString();
  await saveScan(db, {
    reference: "SC-260818-DEL1",
    domain: "leaveme.co.ke",
    rubricVersion: "psr-v1",
    observations: { domain: "leaveme.co.ke", scannedAt: now },
    signals: [],
    score: 60,
    coverage: 70,
    createdAt: now,
  });
  // A direct check of the domain, and a bare-name search that returned it.
  await logToolCheck(db, { tool: "email-security", query: "leaveme.co.ke", summary: "50/100 C" });
  await logToolCheck(db, {
    tool: "kedomains",
    query: "leaveme",
    summary: "leaveme.co.ke: registered",
    detail: [{ domain: "leaveme.co.ke", status: "registered" }],
  });
  await logToolCheck(db, { tool: "email-security", query: "unrelated.co.ke", summary: "90/100 A" });

  const { deleted, checksDeleted } = await optOutDomain(db, "leaveme.co.ke", "owner request");
  assert.equal(deleted, 1, "the scan result is deleted");
  assert.equal(checksDeleted, 2, "both the direct check and the bare-name search are deleted");
  assert.equal(db.checks.length, 1, "other domains' checks are untouched");
  assert.equal(db.checks[0].query, "unrelated.co.ke");
});

test("after opt-out, further lookups of that domain are not recorded", async () => {
  const db = fakeDb();
  await optOutDomain(db, "quiet.co.ke");
  await logToolCheck(db, { tool: "email-security", query: "quiet.co.ke", summary: "70/100 B" });
  await logToolCheck(db, {
    tool: "kedomains",
    query: "quiet",
    summary: "quiet.co.ke: registered",
    domains: ["quiet.co.ke", "quiet.ke"],
  });
  assert.equal(db.checks.length, 0, "nothing about an opted-out domain is kept");

  await logToolCheck(db, { tool: "email-security", query: "other.co.ke", summary: "80/100 B" });
  assert.equal(db.checks.length, 1, "unrelated domains are still recorded");
});
