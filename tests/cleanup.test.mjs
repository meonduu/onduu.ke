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
    throttle_deleted INTEGER NOT NULL DEFAULT 0, optout_deleted INTEGER NOT NULL DEFAULT 0,
    redacted INTEGER NOT NULL DEFAULT 0, submissions_deleted INTEGER NOT NULL DEFAULT 0)`);
  raw.exec(`CREATE TABLE submissions (
    reference TEXT PRIMARY KEY, kind TEXT NOT NULL, full_name TEXT, business_email TEXT, company TEXT,
    trigger_now TEXT, business_result TEXT, current_manager TEXT, consequence_six_months TEXT,
    consent_text TEXT NOT NULL, consent_version TEXT NOT NULL,
    created_at TEXT NOT NULL, last_contact_at TEXT, redacted_at TEXT)`);
  raw.exec(`CREATE TABLE consent_records (
    reference TEXT PRIMARY KEY, kind TEXT NOT NULL, consent_version TEXT NOT NULL,
    consent_text TEXT NOT NULL, consented_at TEXT NOT NULL, submission_deleted_at TEXT NOT NULL)`);
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
          async all() {
            return { results: stmt.all(...args) };
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
  assert.deepEqual(r, { throttleDeleted: 0, optoutDeleted: 0, redacted: 0, submissionsDeleted: 0 });
});

test("the scope is exactly what was decided, and nothing else", async () => {
  // The owner's decision as an executable boundary. Enquiries came into
  // scope on 22 Aug 2026 with agreed periods; everything below stayed out
  // because how long to keep it is still an open question. A future edit
  // that widens this fails here and sends the decision back.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../worker/cleanup.ts", import.meta.url), "utf8");
  const deletes = [...new Set([...src.matchAll(/DELETE FROM (\w+)/g)].map((m) => m[1]))].sort();
  assert.deepEqual(
    deletes,
    ["cleanup_runs", "do_not_scan_requests", "submissions"],
    "throttle tables come from a fixed list; nothing beyond these may be deleted from",
  );
  for (const untouched of [
    "page_views", "events", "scans", "tool_checks", "scan_blocklist", "consent_records",
  ]) {
    assert.doesNotMatch(src, new RegExp(`DELETE FROM ${untouched}\\b`), `${untouched} must never be swept`);
  }
  // consent_records is the trail that outlives the person; deleting from
  // it would defeat the whole design.
  assert.match(src, /INSERT INTO consent_records/, "the consent trail must be written before a deletion");
});

test("one isolate sweeps at most once every six hours", async () => {
  resetCleanupTimer();
  assert.equal(cleanupIsDue(NOW), true, "first request in a fresh isolate");
  assert.equal(cleanupIsDue(NOW + 1000), false, "a second request moments later must not sweep again");
  assert.equal(cleanupIsDue(NOW + 5 * HOUR), false);
  assert.equal(cleanupIsDue(NOW + 7 * HOUR), true, "due again after the interval");
});

/* ── enquiry retention (owner, 22 Aug 2026) ──────────────────────────── */

const MONTH = 30 * DAY;

function enquiry(d, ref, ageMs, lastContactMs) {
  d.raw
    .prepare("INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)")
    .run(
      ref, "fitness", "A Person", `${ref}@example.co.ke`, "Example Ltd",
      "our backups were never tested", "more enquiries", "a developer who left", "we lose the site",
      "I agree to the privacy notice", "2026-08-15",
      iso(NOW - ageMs), lastContactMs === undefined ? null : iso(NOW - lastContactMs),
    );
}

test("free text is cleared at 12 months; the enquiry itself stays", async () => {
  const d = db();
  enquiry(d, "old", 13 * MONTH);
  enquiry(d, "recent", 3 * MONTH);
  const r = await runCleanup(d, NOW);

  assert.equal(r.redacted, 1);
  const old = d.raw.prepare("SELECT * FROM submissions WHERE reference='old'").get();
  assert.ok(old, "the enquiry is not deleted at 12 months, only cleared");
  assert.equal(old.trigger_now, null, "the most revealing field must be gone");
  assert.equal(old.consequence_six_months, null);
  assert.equal(old.full_name, "A Person", "who they are survives to 24 months");
  assert.equal(old.business_email, "old@example.co.ke");
  assert.ok(old.redacted_at, "the clearing is recorded");

  const recent = d.raw.prepare("SELECT trigger_now FROM submissions WHERE reference='recent'").get();
  assert.equal(recent.trigger_now, "our backups were never tested", "a 3-month-old enquiry is untouched");
});

test("an enquiry is not redacted twice", async () => {
  const d = db();
  enquiry(d, "old", 13 * MONTH);
  await runCleanup(d, NOW);
  const second = await runCleanup(d, NOW);
  assert.equal(second.redacted, 0, "redacted_at must stop it being counted again");
});

test("at 24 months the enquiry goes and the consent record remains, without a person in it", async () => {
  const d = db();
  enquiry(d, "ancient", 25 * MONTH);
  const r = await runCleanup(d, NOW);

  assert.equal(r.submissionsDeleted, 1);
  assert.equal(d.count("submissions"), 0);

  const consent = d.raw.prepare("SELECT * FROM consent_records WHERE reference='ancient'").get();
  assert.ok(consent, "the proof that consent was given must outlive the data");
  assert.equal(consent.consent_version, "2026-08-15");
  assert.equal(consent.kind, "fitness");
  // The whole point: nothing here identifies anyone.
  const values = Object.values(consent).join(" ");
  for (const personal of ["A Person", "ancient@example.co.ke", "Example Ltd", "backups"]) {
    assert.ok(!values.includes(personal), `consent record must not carry ${personal}`);
  }
});

test("the clock runs from the last contact, not the form", async () => {
  const d = db();
  // Submitted two years ago, but they wrote again last month: still live.
  enquiry(d, "revived", 25 * MONTH, 1 * MONTH);
  const r = await runCleanup(d, NOW);
  assert.equal(r.submissionsDeleted, 0, "a recent exchange must restart the clock");
  assert.equal(r.redacted, 0, "and the 12-month clock too");
  assert.ok(d.raw.prepare("SELECT 1 FROM submissions WHERE reference='revived'").get());
});

test("an enquiry is never deleted without its consent record being written first", async () => {
  // If the consent insert fails, the enquiry must stay. The reverse order
  // would destroy both the enquiry and the proof consent was ever given.
  const d = db();
  enquiry(d, "ancient", 25 * MONTH);
  d.raw.exec("DROP TABLE consent_records");
  const r = await runCleanup(d, NOW);
  assert.equal(r.submissionsDeleted, 0, "no consent record means no deletion");
  assert.equal(d.count("submissions"), 1, "the enquiry must survive the failure");
});

test("the run records both new tiers", async () => {
  const d = db();
  enquiry(d, "old", 13 * MONTH);
  enquiry(d, "ancient", 25 * MONTH);
  await runCleanup(d, NOW);
  const row = d.raw.prepare("SELECT redacted, submissions_deleted FROM cleanup_runs").get();
  assert.equal(row.redacted, 1);
  assert.equal(row.submissions_deleted, 1);
});
