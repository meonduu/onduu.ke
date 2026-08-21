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

test("the /scan result timestamp is labelled EAT in the rendered bundle", async () => {
  // The formatter runs in the browser there, so this checks the built
  // client bundle rather than the server response.
  const { readFileSync, readdirSync } = await import("node:fs");
  const dir = "dist/client/_astro";
  const scan = readdirSync(dir).find((f) => f.startsWith("scan-form") && f.endsWith(".js"));
  assert.ok(scan, "scan-form bundle not found — has the island been renamed?");
  const js = readFileSync(`${dir}/${scan}`, "utf8");
  assert.match(js, /Africa\/Nairobi/, "the scan result must format in EAT");
  assert.doesNotMatch(js, /toLocaleString\(\)/, "the unqualified toLocaleString must be gone");
});
