import assert from "node:assert/strict";
import test from "node:test";
import { throttleDb, brokenDb } from "./helpers/throttle-db.mjs";
import {
  EVENT_NAMES,
  ENGAGED_MS_CAP,
  EVENTS_PER_MINUTE,
  MAX_BATCH,
  clampEngaged,
  parseEvents,
  sanitiseLabel,
  sanitisePath,
  sanitiseSession,
  withinEventRateLimit,
} from "../worker/events.ts";
import {
  IDLE_AFTER_MS,
  activity,
  flush,
  makeTimer,
  pause,
  resume,
} from "../src/components/analytics.ts";
import { startWorker, fetchPath } from "./helpers/server.mjs";

const facts = { ownHost: "onduu.ke", country: "KE", userAgent: "Mozilla/5.0 (Macintosh)" };
const ev = (extra = {}) => ({ name: "page_view", path: "/dns", ...extra });

/* ── sanitisation ────────────────────────────────────────────────────── */

test("path keeps the pathname and drops query and fragment", () => {
  assert.equal(sanitisePath("/scan?domain=example.co.ke&token=x"), "/scan");
  assert.equal(sanitisePath("/insights#section-2"), "/insights");
  assert.equal(sanitisePath("/"), "/");
});

test("path rejects non-strings, relative paths and control characters", () => {
  for (const bad of [null, 7, "", "scan", "https://onduu.ke/scan", "/a\u0000b", "/ą"]) {
    assert.equal(sanitisePath(bad), null, JSON.stringify(bad));
  }
});

test("path is capped at 300 characters", () => {
  assert.equal(sanitisePath("/" + "a".repeat(400))?.length, 300);
});

test("label allows the documented shape and nothing else", () => {
  assert.equal(sanitiseLabel("request-demo"), "request-demo");
  assert.equal(sanitiseLabel("hero CTA v2.1"), "hero CTA v2.1");
  assert.equal(sanitiseLabel(undefined), null);
  for (const bad of ["", "a".repeat(81), "<script>", "x@y", 42]) {
    assert.equal(sanitiseLabel(bad), null, JSON.stringify(bad));
  }
});

test("session id must look like the tracker's uuid", () => {
  assert.equal(sanitiseSession("3f2a-bad-c0ffee1"), "3f2a-bad-c0ffee1");
  assert.equal(sanitiseSession("nope!"), null);
  assert.equal(sanitiseSession("abc"), null);
});

test("engaged time is clamped to one heartbeat's worth", () => {
  assert.equal(clampEngaged(4_000), 4_000);
  assert.equal(clampEngaged(9_999_999), ENGAGED_MS_CAP);
  for (const bad of [-5, Number.NaN, Infinity, "4000", undefined]) {
    assert.equal(clampEngaged(bad), 0, String(bad));
  }
});

/* ── batch validation ────────────────────────────────────────────────── */

test("a valid batch is normalised from request facts, not the body", () => {
  const { rows, rejected } = parseEvents(
    {
      events: [
        ev({ referrer: "https://google.com/search?q=x", session: "0f9d3a7c-ok" }),
        ev({ name: "engagement", engaged_ms: 12_345 }),
      ],
    },
    facts,
  );
  assert.equal(rejected, 0);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].referrer_host, "google.com");
  assert.equal(rows[0].country, "KE");
  assert.equal(rows[0].device, "desktop");
  assert.equal(rows[0].engaged_ms, 0); // only engagement/page_exit carry time
  assert.equal(rows[1].engaged_ms, 12_345);
});

test("internal referrers are not a source", () => {
  const { rows } = parseEvents({ events: [ev({ referrer: "https://onduu.ke/dns" })] }, facts);
  assert.equal(rows[0].referrer_host, null);
});

test("unknown event names and bad paths reject without blocking the rest", () => {
  const { rows, rejected } = parseEvents(
    { events: [ev(), ev({ name: "keystroke" }), ev({ path: "not-a-path" })] },
    facts,
  );
  assert.equal(rows.length, 1);
  assert.equal(rejected, 2);
});

test("a bad label rejects the event visibly instead of blanking it", () => {
  const { rows, rejected } = parseEvents({ events: [ev({ label: "<img onerror>" })] }, facts);
  assert.equal(rows.length, 0);
  assert.equal(rejected, 1);
});

test("oversized and shapeless batches reject as a whole", () => {
  assert.equal(parseEvents({ events: Array(MAX_BATCH + 1).fill(ev()) }, facts).rows.length, 0);
  assert.equal(parseEvents({}, facts).rejected, 1);
  assert.equal(parseEvents([], facts).rejected, 1);
});

test("every allowlisted name is accepted", () => {
  for (const name of EVENT_NAMES) {
    assert.equal(parseEvents({ events: [ev({ name })] }, facts).rows.length, 1, name);
  }
});

/* ── rate limit ──────────────────────────────────────────────────────── */

// Real SQLite (tests/helpers/throttle-db.mjs) since the limiter became a
// single atomic upsert; the old stub modelled the read-then-write shape.

test("sliding window admits a burst, blocks the excess, resets next window", async () => {
  const db = throttleDb("event_throttle");
  const t0 = Date.parse("2026-08-19T12:00:00Z");
  for (let i = 0; i < EVENTS_PER_MINUTE; i++) {
    assert.equal(await withinEventRateLimit(db, "k", t0 + i * 100), true, `event ${i}`);
  }
  assert.equal(await withinEventRateLimit(db, "k", t0 + 59_000), false);
  assert.equal(await withinEventRateLimit(db, "k", t0 + 61_000), true);
});

test("rate limiting fails open when the table is missing", async () => {
  // Analytics is the one surface that fails open — see the comment in
  // worker/events.ts. The enquiry, opt-out and scan limiters must not.
  assert.equal(await withinEventRateLimit(brokenDb("no such table: event_throttle"), "k"), true);
});

/* ── engaged-time timer ──────────────────────────────────────────────── */

test("engaged time accumulates only while running", () => {
  let t = makeTimer(0);
  t = pause(t, 5_000);
  t = resume(t, 60_000);
  const { delta } = flush(activity(t, 62_000), 62_000);
  assert.equal(delta, 7_000); // 0-5s counted, 5-60s paused, 60-62s counted
});

test("double pause and double resume are safe", () => {
  let t = makeTimer(0);
  t = pause(t, 1_000);
  t = pause(t, 9_000);
  assert.equal(flush(t, 10_000).delta, 1_000);
  t = resume(t, 10_000);
  t = resume(t, 11_000);
  assert.equal(flush(t, 12_000).delta, 1_000 + 2_000);
});

test("idle time does not count and activity wakes the timer", () => {
  let t = makeTimer(0);
  t = activity(t, 1_000);
  // Nothing for far longer than the idle threshold…
  const idleEnd = 1_000 + IDLE_AFTER_MS;
  const { delta } = flush(t, idleEnd + 300_000);
  assert.equal(delta, idleEnd); // counting stopped at lastActivity + threshold
  // …then a wake restarts counting from the wake, not the gap.
  let w = activity(makeTimer(0), 0);
  w = activity(w, IDLE_AFTER_MS + 100_000);
  assert.equal(flush(w, IDLE_AFTER_MS + 101_000).delta, IDLE_AFTER_MS + 1_000);
});

test("flush resets the accumulator but keeps counting", () => {
  let t = makeTimer(0);
  const first = flush(t, 4_000);
  assert.equal(first.delta, 4_000);
  assert.equal(flush(first.timer, 6_000).delta, 2_000);
});

/* ── endpoint behaviour (real worker) ────────────────────────────────── */

test("the event endpoint enforces method, type, shape and privacy signals", async () => {
  const base = await startWorker();
  // Browsers send Origin on every POST; Astro's own CSRF check 403s a
  // cross-origin form-shaped POST before the handler runs.
  const post = ({ headers = {}, ...init } = {}) =>
    fetchPath("/api/event", "application/json", {
      method: "POST",
      headers: { "content-type": "application/json", origin: base, ...headers },
      body: JSON.stringify({ events: [ev()] }),
      ...init,
    });

  assert.equal((await fetchPath("/api/event")).status, 405);
  assert.equal((await post({ headers: { "content-type": "text/plain" } })).status, 415);
  assert.equal((await post({ body: "{broken" })).status, 400);
  assert.equal((await post({ body: JSON.stringify({ nope: true }) })).status, 400);
  assert.equal((await post({ headers: { origin: "https://evil.example" } })).status, 403);
  assert.equal((await post({ headers: { "sec-gpc": "1" } })).status, 204);
  assert.equal((await post({ headers: { dnt: "1" } })).status, 204);
  assert.equal((await post({ body: JSON.stringify({ events: [ev()] }).padEnd(9_000, " ") })).status, 413);
  assert.equal((await post()).status, 204);
});
