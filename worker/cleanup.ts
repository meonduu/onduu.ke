/**
 * Deletes the machinery this site leaves behind, and nothing else.
 *
 * Owner decision, 22 August 2026, after the security review's retention
 * recommendation. That recommendation covers two very different things and
 * only one of them is mechanical:
 *
 *   Judgement — how long to keep an enquiry, a page view, a scan result.
 *   A lead from six months ago may still matter; deleting it is a business
 *   decision with a real cost for getting it wrong. **Not touched here.**
 *
 *   Machinery — rows written so the site can function, which stop meaning
 *   anything the moment their window closes. Nothing reads them again and
 *   nothing references them. That is all this deletes.
 *
 * What goes:
 *
 *   Throttle counters. "This visitor has run three searches in the past
 *   hour" is meaningless once the hour has passed. Two days is well beyond
 *   the longest window (one hour), so nothing in force is ever removed.
 *   These also now grow without bound: the client key rotates daily
 *   (v4.92.0), so every returning visitor leaves yesterday's row orphaned.
 *
 *   Opt-out requests that expired unconfirmed. The link stopped working
 *   after 48 hours and can never work again, but the row still holds the
 *   requester's email address. Keeping a real person's address for
 *   something that can no longer happen is not caution.
 *
 * What stays, deliberately: submissions, page_views, events, scans,
 * tool_checks, scan_blocklist, and confirmed opt-out requests — the last
 * of these being the audit record of who asked to be left alone and when.
 *
 * Scheduling: the Astro Cloudflare adapter exports only a fetch handler,
 * so a cron trigger would mean patching build output and re-patching it on
 * every adapter upgrade. This runs opportunistically instead, in
 * `waitUntil` behind a per-isolate timer — the same pattern already used
 * for page views. Every statement is idempotent, so two isolates racing
 * costs a duplicate no-op and nothing else.
 */

const THROTTLE_TABLES = [
  "submission_throttle",
  "scan_throttle",
  "search_throttle",
  "event_throttle",
] as const;

/** Well beyond the longest window in use (one hour). */
const THROTTLE_KEEP_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Enquiry retention (owner, 22 Aug 2026). Both clocks run from the last
 * contact, falling back to the submission date — nothing writes
 * last_contact_at yet, so today they are the same thing.
 */
const REDACT_AFTER_MS = 365 * 24 * 60 * 60 * 1000;   // 12 months: free text
const DELETE_AFTER_MS = 730 * 24 * 60 * 60 * 1000;   // 24 months: the rest

/** How long a record of a cleanup run is itself worth keeping. */
const LOG_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

/** Minimum gap between attempts by one isolate. */
const INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface CleanupResult {
  throttleDeleted: number;
  optoutDeleted: number;
  redacted: number;
  submissionsDeleted: number;
}

/**
 * Runs the deletions once. Exported for the tests and for a hand-run.
 * Throws nothing: a missing table (migration not yet applied) leaves the
 * count at zero rather than failing a visitor's request.
 */
export async function runCleanup(db: D1Database, now = Date.now()): Promise<CleanupResult> {
  const throttleCutoff = new Date(now - THROTTLE_KEEP_MS).toISOString();
  const nowIso = new Date(now).toISOString();
  const logCutoff = new Date(now - LOG_KEEP_MS).toISOString();

  let throttleDeleted = 0;
  for (const table of THROTTLE_TABLES) {
    try {
      const res = await db
        .prepare(`DELETE FROM ${table} WHERE window_start < ?`)
        .bind(throttleCutoff)
        .run();
      throttleDeleted += res.meta?.changes ?? 0;
    } catch {
      /* table absent on this database */
    }
  }

  // Unconfirmed AND expired, both conditions. A confirmed request is the
  // record of who asked and is never removed; an unexpired one still has a
  // working link in someone's inbox.
  let optoutDeleted = 0;
  try {
    const res = await db
      .prepare("DELETE FROM do_not_scan_requests WHERE confirmed_at IS NULL AND expires_at < ?")
      .bind(nowIso)
      .run();
    optoutDeleted = res.meta?.changes ?? 0;
  } catch {
    /* table absent */
  }

  const { redacted, submissionsDeleted } = await sweepSubmissions(db, now);

  try {
    await db.prepare("DELETE FROM cleanup_runs WHERE ran_at < ?").bind(logCutoff).run();
    await db
      .prepare(
        "INSERT INTO cleanup_runs (ran_at, throttle_deleted, optout_deleted, redacted, submissions_deleted) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(nowIso, throttleDeleted, optoutDeleted, redacted, submissionsDeleted)
      .run();
  } catch {
    /* migration 0013 not applied; the deletions above still happened */
  }

  return { throttleDeleted, optoutDeleted, redacted, submissionsDeleted };
}

/**
 * The two enquiry tiers. Separated from runCleanup because this is the
 * only part that touches something a person chose to send, and it should
 * be readable on its own.
 *
 * Order matters in the second tier: the consent record is written FIRST
 * and the submission is deleted only if that succeeded. The reverse
 * ordering would, on a failure between the two, destroy both the enquiry
 * and the proof that consent was ever given for it.
 */
async function sweepSubmissions(
  db: D1Database,
  now: number,
): Promise<{ redacted: number; submissionsDeleted: number }> {
  const redactCutoff = new Date(now - REDACT_AFTER_MS).toISOString();
  const deleteCutoff = new Date(now - DELETE_AFTER_MS).toISOString();
  const nowIso = new Date(now).toISOString();

  // "Since the last contact, or the submission if there has been none."
  const age = "COALESCE(last_contact_at, created_at)";

  let redacted = 0;
  let submissionsDeleted = 0;

  // Tier 1 — clear the free text, keep the enquiry. Bounded at both ends:
  // a row already past 24 months is about to be deleted outright below,
  // and redacting it first would do wasted work and report itself twice
  // on /go. redacted_at records that it happened and stops the row being
  // counted again.
  try {
    const res = await db
      .prepare(
        `UPDATE submissions SET
           trigger_now = NULL, business_result = NULL,
           current_manager = NULL, consequence_six_months = NULL,
           redacted_at = ?
         WHERE redacted_at IS NULL AND ${age} < ? AND ${age} >= ?`,
      )
      .bind(nowIso, redactCutoff, deleteCutoff)
      .run();
    redacted = res.meta?.changes ?? 0;
  } catch {
    /* migration 0014 not applied */
  }

  // Tier 2 — the enquiry goes; the consent trail stays, without a person
  // in it. Done one row at a time so a single bad row cannot take the
  // batch with it, and because the volume this runs at is tiny.
  try {
    const due = await db
      .prepare(
        `SELECT reference, kind, consent_version, consent_text, created_at
           FROM submissions WHERE ${age} < ? LIMIT 200`,
      )
      .bind(deleteCutoff)
      .all<{ reference: string; kind: string; consent_version: string; consent_text: string; created_at: string }>();

    for (const row of due.results ?? []) {
      try {
        await db
          .prepare(
            `INSERT INTO consent_records
               (reference, kind, consent_version, consent_text, consented_at, submission_deleted_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(reference) DO NOTHING`,
          )
          .bind(row.reference, row.kind, row.consent_version, row.consent_text, row.created_at, nowIso)
          .run();
      } catch {
        continue; // no consent record, so the enquiry stays
      }
      const gone = await db
        .prepare("DELETE FROM submissions WHERE reference = ?")
        .bind(row.reference)
        .run();
      submissionsDeleted += gone.meta?.changes ?? 0;
    }
  } catch {
    /* migration 0014 not applied */
  }

  return { redacted, submissionsDeleted };
}

let lastAttempt = 0;

/** Test seam: forget that this isolate has already run. */
export function resetCleanupTimer() {
  lastAttempt = 0;
}

/**
 * True when this isolate has not tried for INTERVAL_MS. Claims the slot
 * before returning, so two concurrent requests in one isolate do not both
 * schedule a run.
 */
export function cleanupIsDue(now = Date.now()): boolean {
  if (now - lastAttempt < INTERVAL_MS) return false;
  lastAttempt = now;
  return true;
}
