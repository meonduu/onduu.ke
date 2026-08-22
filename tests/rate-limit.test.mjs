import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { clientKeyOf, withinLimit } from "../worker/rate-limit.ts";

// Security review, 22 August 2026 (OWASP A04, A10). Two defects, both
// present in all five copies of this logic before it was consolidated:
//
//   1. The limit was SELECT-then-UPDATE. Concurrent requests all read the
//      same count, all decided they were under the ceiling, and all
//      proceeded — so the limit held against ordinary traffic and folded
//      against the only kind it exists to stop.
//   2. The client key was an unkeyed SHA-256 of the address truncated to
//      64 bits. IPv4 is 2^32: the whole space can be walked against a
//      stored hash. The register called those rows "pseudonymous", so the
//      weakness also made a published claim untrue.

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/* ── the key ─────────────────────────────────────────────────────────── */

const req = (ip) => new Request("https://onduu.ke/", { headers: { "cf-connecting-ip": ip } });

test("the keyed identifier cannot be reproduced without the secret", async () => {
  const ip = "41.90.64.7";
  const withSecret = await clientKeyOf(req(ip), "submission", "s3cret");
  const unkeyed = await clientKeyOf(req(ip), "submission");
  const otherSecret = await clientKeyOf(req(ip), "submission", "different");

  assert.notEqual(withSecret, unkeyed, "the secret must change the output");
  assert.notEqual(withSecret, otherSecret, "a different key must give a different identifier");
  assert.match(withSecret, /^[0-9a-f]{32}$/, "128 bits of hex");

  // The point of the change: knowing the address is no longer enough to
  // recognise its rows. An attacker holding the database and the whole
  // IPv4 space still cannot map one to the other.
  const guessedByBruteForce = await clientKeyOf(req(ip), "submission");
  assert.notEqual(guessedByBruteForce, withSecret);
});

test("the same visitor is unlinkable across the four counters", async () => {
  const ip = "41.90.64.7";
  const keys = await Promise.all(
    ["submission", "scan", "search", "event"].map((p) => clientKeyOf(req(ip), p, "s3cret")),
  );
  assert.equal(new Set(keys).size, 4, "each purpose must derive a distinct identifier");
});

test("identifiers expire by construction, on a daily bucket", async () => {
  const ip = "41.90.64.7";
  const today = await clientKeyOf(req(ip), "scan", "s3cret");
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 25 * 60 * 60 * 1000;
    const tomorrow = await clientKeyOf(req(ip), "scan", "s3cret");
    assert.notEqual(today, tomorrow, "yesterday's identifier must stop matching");
  } finally {
    Date.now = realNow;
  }
});

test("different addresses never collide", async () => {
  const keys = await Promise.all(
    ["41.90.64.7", "41.90.64.8", "197.248.1.1"].map((ip) => clientKeyOf(req(ip), "search", "s3cret")),
  );
  assert.equal(new Set(keys).size, 3);
});

/* ── the limit ───────────────────────────────────────────────────────── */

// Real SQLite, in process. Not a hand-written stand-in: the defect was
// about what the database does when two writers arrive together, and a
// fake would only reproduce whatever I assumed about that. node:sqlite is
// the same engine D1 runs, so the upsert semantics under test are the
// real ones.
function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE scan_throttle (client_key TEXT PRIMARY KEY,
           window_start TEXT NOT NULL, count INTEGER NOT NULL)`);
  return {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return { bind: (...args) => ({ async first() { return stmt.get(...args) ?? null; } }) };
    },
  };
}

test("the ceiling holds against requests that arrive together", async () => {
  // The regression test for the real defect. Twenty concurrent calls
  // against a limit of five: the read-then-write version admitted most of
  // them, because every one read the same count before any had written.
  const db = d1();
  const results = await Promise.all(
    Array.from({ length: 20 }, () => withinLimit(db, "scan_throttle", "concurrent", 5, 60_000)),
  );
  const admitted = results.filter(Boolean).length;
  assert.equal(admitted, 5, `exactly the ceiling must be admitted, got ${admitted}`);
});

test("the window rolls over, and refusals keep counting", async () => {
  const db = d1();
  const t0 = Date.parse("2026-08-22T10:00:00Z");
  for (let i = 0; i < 5; i++) {
    assert.equal(await withinLimit(db, "scan_throttle", "roll", 5, 60_000, t0 + i), true);
  }
  assert.equal(await withinLimit(db, "scan_throttle", "roll", 5, 60_000, t0 + 10), false);
  // Refused requests still increment, so sustained abuse cannot idle its
  // way back under the line before the window has actually passed.
  assert.equal(await withinLimit(db, "scan_throttle", "roll", 5, 60_000, t0 + 20), false);
  assert.equal(
    await withinLimit(db, "scan_throttle", "roll", 5, 60_000, t0 + 61_000),
    true,
    "a fresh window must admit again",
  );
});

test("one visitor's ceiling is not another's", async () => {
  const db = d1();
  for (let i = 0; i < 5; i++) await withinLimit(db, "scan_throttle", "a", 5, 60_000);
  assert.equal(await withinLimit(db, "scan_throttle", "a", 5, 60_000), false);
  assert.equal(await withinLimit(db, "scan_throttle", "b", 5, 60_000), true);
});

/* ── no copies left behind ───────────────────────────────────────────── */

test("no read-then-write limiter survives anywhere in the worker", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".ts")) {
        const src = readFileSync(p, "utf8");
        if (/SELECT count, window_start/.test(src)) offenders.push(p);
      }
    }
  };
  walk(join(ROOT, "worker"));
  assert.deepEqual(offenders, [], `these still read a counter before writing it:\n${offenders.join("\n")}`);
});
