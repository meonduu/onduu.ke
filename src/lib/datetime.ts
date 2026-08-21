/**
 * One date format for the whole site: `dd-mm-yyyy at hh:mm`, 24-hour, in
 * East Africa Time.
 *
 * Owner decision, 21 Aug 2026. Before this, /scan called
 * `toLocaleString()` with no arguments, so the timestamp was rendered in
 * whatever locale and timezone the visitor's browser happened to have —
 * a Nairobi reader and a London reader saw different times for the same
 * scan, and neither was labelled. The /go dashboard printed SQLite's raw
 * UTC `YYYY-MM-DD HH:MM:SS`, three hours behind the owner reading it.
 *
 * EAT is UTC+3 year-round: Kenya has never observed daylight saving, so
 * there is no transition to get wrong. The timezone is still named rather
 * than hard-coded as +3, so the platform does the arithmetic.
 */
const EAT = "Africa/Nairobi";

function parts(value: Date | string) {
  // SQLite writes "YYYY-MM-DD HH:MM:SS" with no zone marker, and it is
  // always UTC (datetime('now')). Date.parse would read that as LOCAL
  // time, silently shifting it, so the marker is added explicitly.
  const date =
    value instanceof Date
      ? value
      : new Date(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value) ? `${value.replace(" ", "T")}Z` : value);
  if (Number.isNaN(date.getTime())) return null;

  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: EAT,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  return { d: get("day"), m: get("month"), y: get("year"), hh: get("hour"), mm: get("minute") };
}

/** `dd-mm-yyyy at hh:mm` in EAT, or "" when the value is not a date. */
export function eatDateTime(value: Date | string): string {
  const p = parts(value);
  return p ? `${p.d}-${p.m}-${p.y} at ${p.hh}:${p.mm}` : "";
}

/** `dd-mm-yyyy` in EAT, for values with no meaningful time of day. */
export function eatDate(value: Date | string): string {
  const p = parts(value);
  return p ? `${p.d}-${p.m}-${p.y}` : "";
}
