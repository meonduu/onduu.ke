import { withinLimit } from "./rate-limit.ts";
/**
 * Client engagement events: validation, sanitisation and recording.
 *
 * The browser is never trusted. Everything a page sends passes the
 * allowlists below or is counted as rejected and dropped — payloads of
 * rejected events are never stored. Country and device come from the
 * request, not the body; query strings and fragments never survive
 * sanitisation. See migrations/0007_analytics_events.sql for what a stored
 * row can and cannot say about a person.
 */
import { deviceFrom, referrerHost } from "./pageviews.ts";

export const EVENT_NAMES = new Set([
  "page_view",
  "page_exit",
  "engagement",
  "click",
  "conversion",
  "download",
  "outbound_link",
]);

export const MAX_BATCH = 10;
/** @deprecated The body ceiling moved to BODY_LIMITS.event in
 *  worker/body-limit.ts (22 Aug 2026), which enforces it before reading
 *  rather than after. Kept only for tests that still name it. */
export const MAX_BODY_BYTES = 8_192;
/** One heartbeat's worth of engaged time, with slack for a slow flush. */
export const ENGAGED_MS_CAP = 120_000;
export const EVENTS_PER_MINUTE = 60;

const PATH_RE = /^\/[\x20-\x7e]*$/;
const LABEL_RE = /^[\w./ -]{1,80}$/;
const SESSION_RE = /^[0-9a-f-]{8,40}$/i;

/** Pathname only: query and fragment stripped, printable ASCII, capped. */
export function sanitisePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const path = value.split(/[?#]/, 1)[0].slice(0, 300);
  return PATH_RE.test(path) ? path : null;
}

export function sanitiseLabel(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === "string" && LABEL_RE.test(value) ? value : null;
}

export function sanitiseSession(value: unknown): string | null {
  return typeof value === "string" && SESSION_RE.test(value) ? value : null;
}

export function clampEngaged(value: unknown): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n), ENGAGED_MS_CAP);
}

export interface EventRow {
  event_name: string;
  path: string;
  label: string | null;
  session_id: string | null;
  referrer_host: string | null;
  country: string | null;
  device: string;
  engaged_ms: number;
}

export interface RequestFacts {
  ownHost: string;
  country: string | null;
  userAgent: string;
}

/**
 * Validate a request body against the allowlists. Returns the rows worth
 * keeping and the count of rejected events (for the coverage panel).
 * A body that is not `{ events: [...] }` rejects as a whole.
 */
export function parseEvents(
  body: unknown,
  facts: RequestFacts,
): { rows: EventRow[]; rejected: number } {
  const list = (body as { events?: unknown })?.events;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_BATCH) {
    return { rows: [], rejected: Array.isArray(list) ? list.length || 1 : 1 };
  }
  const device = deviceFrom(facts.userAgent);
  const rows: EventRow[] = [];
  let rejected = 0;
  for (const item of list) {
    const e = item as Record<string, unknown>;
    const name = typeof e?.name === "string" ? e.name : "";
    const path = sanitisePath(e?.path);
    // A label that fails the allowlist rejects the event rather than being
    // silently blanked, so a coverage drop is visible instead of a mystery.
    const label = sanitiseLabel(e?.label);
    if (!EVENT_NAMES.has(name) || !path || (e?.label != null && label === null)) {
      rejected++;
      continue;
    }
    rows.push({
      event_name: name,
      path,
      label,
      session_id: sanitiseSession(e?.session),
      referrer_host:
        typeof e?.referrer === "string" ? referrerHost(e.referrer, facts.ownHost) : null,
      country: facts.country?.slice(0, 4) ?? null,
      device,
      engaged_ms: name === "engagement" || name === "page_exit" ? clampEngaged(e?.engaged_ms) : 0,
    });
  }
  return { rows, rejected };
}

/** Same sliding-window shape as submissions' and scans' throttles. */
export async function withinEventRateLimit(
  db: D1Database,
  clientKey: string,
  now = Date.now(),
): Promise<boolean> {
  try {
    return await withinLimit(db, "event_throttle", clientKey, EVENTS_PER_MINUTE, 60 * 1000, now);
  } catch {
    // Fail open, and only here. Engagement measurement is best-effort: an
    // unreachable counter must not cost a page view, and there is nothing
    // to abuse but a statistics table. The enquiry, opt-out and scan
    // limiters deliberately do the opposite and let the error reach the
    // caller, because those write state or send mail (security review,
    // 22 Aug 2026, A10).
    return true;
  }
}

export async function recordEvents(db: D1Database, rows: EventRow[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    "INSERT INTO events (event_name, path, label, session_id, referrer_host, country, device, engaged_ms)" +
      " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  try {
    await db.batch(
      rows.map((r) =>
        stmt.bind(
          r.event_name,
          r.path,
          r.label,
          r.session_id,
          r.referrer_host,
          r.country,
          r.device,
          r.engaged_ms,
        ),
      ),
    );
  } catch {
    // Recording must never surface to the visitor.
  }
}

export async function bumpHealth(db: D1Database, received: number, rejected: number): Promise<void> {
  if (received === 0 && rejected === 0) return;
  try {
    await db
      .prepare(
        "INSERT INTO event_health (day, received, rejected) VALUES (date('now'), ?, ?)" +
          " ON CONFLICT(day) DO UPDATE SET received = received + excluded.received," +
          " rejected = rejected + excluded.rejected",
      )
      .bind(received, rejected)
      .run();
  } catch {
    // Same posture as recordEvents.
  }
}
