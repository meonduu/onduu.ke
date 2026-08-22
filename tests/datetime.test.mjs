import assert from "node:assert/strict";
import test from "node:test";

import { eatDateTime, eatDate } from "../src/lib/datetime.ts";

// Owner decision, 21 Aug 2026: one format sitewide — dd-mm-yyyy at hh:mm,
// 24-hour, East Africa Time.
//
// Before this, /scan called toLocaleString() with no arguments, so the
// same scan showed a different time to a Nairobi reader and a London one,
// and neither was labelled. The /go dashboard printed SQLite's raw UTC,
// three hours behind the owner reading it.

const SHAPE = /^\d{2}-\d{2}-\d{4} at \d{2}:\d{2}$/;

test("the format is dd-mm-yyyy at hh:mm, 24-hour", () => {
  assert.match(eatDateTime("2026-08-21T00:00:00Z"), SHAPE);
  assert.equal(eatDateTime("2026-08-21T00:00:00Z"), "21-08-2026 at 03:00", "UTC+3");
  // 24-hour: an afternoon time must not come back as "05:53 pm".
  assert.equal(eatDateTime("2026-08-21T14:53:00Z"), "21-08-2026 at 17:53");
  assert.doesNotMatch(eatDateTime("2026-08-21T14:53:00Z"), /am|pm/i);
});

test("the day rolls over at EAT midnight, not UTC midnight", () => {
  // 22:30 UTC is already tomorrow in Nairobi. Getting this wrong would
  // date an evening enquiry to the previous day.
  assert.equal(eatDateTime("2026-08-21T22:30:00Z"), "22-08-2026 at 01:30");
  assert.equal(eatDateTime("2026-08-21T20:59:00Z"), "21-08-2026 at 23:59");
});

test("a SQLite timestamp is read as UTC, not as local time", () => {
  // SQLite's datetime('now') writes "YYYY-MM-DD HH:MM:SS" with no zone
  // marker. Date.parse treats that as LOCAL time, which would shift every
  // stored value silently — so the parser adds the marker itself.
  assert.equal(eatDateTime("2026-08-21 14:53:29"), "21-08-2026 at 17:53");
  assert.equal(eatDateTime("2026-08-21 14:53:29"), eatDateTime("2026-08-21T14:53:29Z"));
});

test("a date without a time drops the time", () => {
  assert.equal(eatDate("2026-12-13T00:00:00Z"), "13-12-2026");
  assert.match(eatDate("2026-12-13T00:00:00Z"), /^\d{2}-\d{2}-\d{4}$/);
});

test("an unparseable value returns empty rather than Invalid Date", () => {
  // "Invalid Date" rendered into a page is worse than a blank cell.
  assert.equal(eatDateTime("not a date"), "");
  assert.equal(eatDate(""), "");
});

test("no client bundle formats a time in the browser's own zone", async () => {
  // Was "the /scan result timestamp is labelled EAT". The scan result
  // stopped printing a time on 22 Aug 2026 (owner removed the note that
  // carried it), so requiring Africa/Nairobi to appear in that bundle
  // became a requirement for a timestamp to exist — which is not what the
  // rule is. The rule is that a time shown to a visitor is EAT, never
  // whatever zone their laptop is set to. Stated as the prohibition, it
  // holds whether or not any given island prints a date.
  const { readFileSync, readdirSync } = await import("node:fs");
  const dir = "dist/client/_astro";
  const bundles = readdirSync(dir).filter((f) => f.endsWith(".js"));
  assert.ok(bundles.length, "no client bundles found — has the build layout changed?");
  for (const file of bundles) {
    const js = readFileSync(`${dir}/${file}`, "utf8");
    assert.doesNotMatch(js, /toLocaleString\(\)/, `${file} formats a date in the visitor's zone`);
    assert.doesNotMatch(js, /toLocaleDateString\(\)/, `${file} formats a date in the visitor's zone`);
    // And where a zone IS named, it must be the right one.
    const zones = [...js.matchAll(/timeZone:\s*"([^"]+)"/g)].map((m) => m[1]);
    for (const zone of zones) {
      assert.equal(zone, "Africa/Nairobi", `${file} formats in ${zone}`);
    }
  }
});

// Article dates were a second copy of the same fact: every entry carried
// an ISO `date` AND a hand-written `dateLabel` ("18 August 2026"). All
// twelve happened to agree when checked, but nothing enforced that — a
// corrected date with a stale label would have published a contradiction.
// The label is now derived, so the two cannot disagree.
test("article dates are derived, not duplicated", async () => {
  const { readFileSync } = await import("node:fs");
  const data = readFileSync("src/data/insights-data.ts", "utf8");
  assert.doesNotMatch(
    data,
    /dateLabel/,
    "dateLabel is a second copy of `date` — derive it with eatDate() instead",
  );

  const article = readFileSync("src/components/article.tsx", "utf8");
  assert.match(article, /eatDate\(/, "article dates must come from the shared formatter");
  // The machine-readable attribute stays ISO: feeds and search engines
  // parse that, not the visible text.
  assert.match(article, /dateTime=\{(article|a)\.date\}/, "the <time> attribute keeps the ISO date");
});
