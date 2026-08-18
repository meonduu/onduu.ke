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
  return {
    scans,
    throttle,
    blocklist,
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
