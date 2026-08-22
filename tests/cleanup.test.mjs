import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runCleanup, cleanupIsDue, resetCleanupTimer } from "../worker/cleanup.ts";

// Owner decision, 22 August 2026: the narrow half of the security
// review's retention recommendation. This is deletion code running
// unattended against production, so most of what follows checks what
// SURVIVES rather than what goes. A cleanup that removes too much is a
// far worse outcome than one that removes too little, and the difference
// is invisible until someone looks for a row that is no longer there.

const iso = (ms) => new Date(ms).toISOString();
const NOW = Date.parse("2026-08-22T12:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function db() {
  const raw = new DatabaseSync(":memory:");
  for (const t of ["submission_throttle", "scan_throttle", "search_throttle", "event_throttle"]) {
    raw.exec(`CREATE TABLE ${t} (client_key TEXT PRIMARY KEY, window_start TEXT NOT NULL, count INTEGER NOT NULL)`);
  }
  raw.exec(`CREATE TABLE do_not_scan_requests (
    reference TEXT PRIMARY KEY, domain TEXT NOT NULL, email TEXT NOT NULL, note TEXT,
    token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, confirmed_at TEXT)`);
  raw.exec(`CREATE TABLE cleanup_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ran_at TEXT NOT NULL,
    throttle_deleted INTEGER NOT NULL DEFAULT 0, optout_deleted INTEGER NOT NULL DEFAULT 0)`);
  return {
    raw,
    count: (t) => raw.prepare(`SELECT count(*) AS n FROM ${t}`).get().n,
    prepare(sql) {
      const stmt = raw.prepare(sql);
      return {
        bind: (...args) => ({
          async run() {
            const r = stmt.run(...args);
            return { meta: { changes: r.changes } };
          },
          async first() {
            return stmt.get(...args) ?? null;
          },
        }),
      };
    },
  };
}

function seed(d) {
  const put = (table, key, when) =>
    d.raw.prepare(`INSERT INTO ${table} VALUES (?, ?, 1)`).run(key, iso(when));

  put("scan_throttle", "stale", NOW - 5 * DAY);      // long past its window
  put("scan_throttle", "yesterday", NOW - 26 * HOUR); // orphaned by the daily key, but inside the keep window
  put("scan_throttle", "live", NOW - 10 * 60_000);    // a counter in force right now
  put("search_throttle", "stale", NOW - 3 * DAY);
  put("event_throttle", "live", NOW - 30_000);

  const req = (ref, expires, confirmed) =>
    d.raw
      .prepare("INSERT INTO do_not_scan_requests VALUES (?,?,?,?,?,?,?,?)")
      .run(ref, `${ref}.co.ke`, `me@${ref}.co.ke`, null, `hash-${ref}`, iso(NOW - 3 * DAY), iso(expires), confirmed);

  req("dead", NOW - HOUR, null);          // expired, never confirmed → goes
  req("pending", NOW + 24 * HOUR, null);  // link still works → stays
  req("confirmed", NOW - 10 * DAY, iso(NOW - 10 * DAY)); // long expired BUT confirmed → stays
  return d;
}

test("spent throttle counters go, and counters in force stay", async () => {
  const d = seed(db());
  const r = await runCleanup(d, NOW);

  assert.equal(r.throttleDeleted, 2, "only the two beyond the keep window");
  const remaining = d.raw.prepare("SELECT client_key FROM scan_throttle ORDER BY client_key").all().map((x) => x.client_key);
  assert.deepEqual(remaining, ["live", "yesterday"], "a live counter and a recent orphan must both survive");
  assert.equal(d.count("event_throttle"), 1, "a counter from 30 seconds ago is in force");
  assert.equal(d.count("search_throttle"), 0);
});

test("a confirmed opt-out request is never deleted, however old", async () => {
  // This is the audit record of who asked to be left alone. It is ten days
  // past its expiry and must still be there.
  const d = seed(db());
  await runCleanup(d, NOW);
  const rows = d.raw.prepare("SELECT reference FROM do_not_scan_requests ORDER BY reference").all().map((r) => r.reference);
  assert.deepEqual(rows, ["confirmed", "pending"], "only the expired-and-unconfirmed one goes");
});

test("a request whose link still works is never deleted", async () => {
  const d = seed(db());
  await runCleanup(d, NOW);
  const pending = d.raw.prepare("SELECT expires_at FROM do_not_scan_requests WHERE reference = 'pending'").get();
  assert.ok(pending, "an unexpired request still has a working link in someone's inbox");
});

test("only the expired unconfirmed request is removed, and it is counted", async () => {
  const d = seed(db());
  const r = await runCleanup(d, NOW);
  assert.equal(r.optoutDeleted, 1);
  assert.equal(d.raw.prepare("SELECT count(*) AS n FROM do_not_scan_requests WHERE reference='dead'").get().n, 0);
});

test("each run is recorded, and the log prunes itself", async () => {
  const d = seed(db());
  d.raw.prepare("INSERT INTO cleanup_runs (ran_at, throttle_deleted, optout_deleted) VALUES (?,0,0)").run(iso(NOW - 40 * DAY));
  await runCleanup(d, NOW);
  const rows = d.raw.prepare("SELECT ran_at, throttle_deleted, optout_deleted FROM cleanup_runs").all();
  assert.equal(rows.length, 1, "the 40-day-old entry is pruned, this run is added");
  assert.equal(rows[0].throttle_deleted, 2);
  assert.equal(rows[0].optout_deleted, 1);
});

test("running twice deletes nothing the second time", async () => {
  const d = seed(db());
  await runCleanup(d, NOW);
  const second = await runCleanup(d, NOW);
  assert.deepEqual(
    { t: second.throttleDeleted, o: second.optoutDeleted },
    { t: 0, o: 0 },
    "idempotent, so two isolates racing costs a no-op",
  );
});

test("a database missing the tables is survived, not thrown from", async () => {
  // Before migrations 0012/0013 on a given environment. A visitor's
  // request must not fail because a sweep could not run.
  const bare = { prepare() { throw new Error("no such table"); } };
  const r = await runCleanup(bare, NOW);
  assert.deepEqual(r, { throttleDeleted: 0, optoutDeleted: 0 });
});

test("it touches nothing anyone sent", async () => {
  // The scope line from the owner's decision, as a test. If a future edit
  // adds a table here, this fails and the decision gets revisited.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../worker/cleanup.ts", import.meta.url), "utf8");
  const deletes = [...src.matchAll(/DELETE FROM (\w+)/g)].map((m) => m[1]);
  assert.deepEqual(
    [...new Set(deletes)].sort(),
    ["cleanup_runs", "do_not_scan_requests"],
    "throttle tables are interpolated from a fixed list; nothing else may be deleted from",
  );
  for (const protectedTable of ["submissions", "page_views", "events", "scans", "tool_checks", "scan_blocklist"]) {
    assert.doesNotMatch(src, new RegExp(`DELETE FROM ${protectedTable}\\b`), `${protectedTable} must never be swept`);
  }
});

test("one isolate sweeps at most once every six hours", async () => {
  resetCleanupTimer();
  assert.equal(cleanupIsDue(NOW), true, "first request in a fresh isolate");
  assert.equal(cleanupIsDue(NOW + 1000), false, "a second request moments later must not sweep again");
  assert.equal(cleanupIsDue(NOW + 5 * HOUR), false);
  assert.equal(cleanupIsDue(NOW + 7 * HOUR), true, "due again after the interval");
});
