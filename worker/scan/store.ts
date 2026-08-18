/**
 * Persistence for scan results: the 24-hour result cache (spec §6 —
 * repeated scans of one domain serve the stored result rather than
 * re-fetching a third party) and the per-client rate limit, mirroring the
 * submission_throttle pattern.
 */
import type { Observations } from "./collect.ts";
import type { SignalResult } from "./rubric.ts";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // owner decision #1
export const SCANS_PER_HOUR = 5;

export interface StoredScan {
  reference: string;
  domain: string;
  rubricVersion: string;
  observations: Observations;
  signals: SignalResult[];
  score: number;
  coverage: number;
  createdAt: string;
}

/** SC-YYMMDD-XXXX, same shape as enquiry references but distinguishable. */
export function scanReference(now = new Date(), random = Math.random): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(random() * alphabet.length)];
  return `SC-${d}-${suffix}`;
}

export async function findRecentScan(
  db: D1Database,
  domain: string,
  now = Date.now(),
): Promise<StoredScan | null> {
  const cutoff = new Date(now - CACHE_TTL_MS).toISOString();
  const row = await db
    .prepare(
      "SELECT reference, domain, rubric_version, observations, signals, score, coverage, created_at" +
        " FROM scans WHERE domain = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(domain, cutoff)
    .first<{
      reference: string;
      domain: string;
      rubric_version: string;
      observations: string;
      signals: string;
      score: number;
      coverage: number;
      created_at: string;
    }>();
  if (!row) return null;
  return {
    reference: row.reference,
    domain: row.domain,
    rubricVersion: row.rubric_version,
    observations: JSON.parse(row.observations) as Observations,
    signals: JSON.parse(row.signals) as SignalResult[],
    score: row.score,
    coverage: row.coverage,
    createdAt: row.created_at,
  };
}

export async function saveScan(db: D1Database, scan: StoredScan): Promise<void> {
  await db
    .prepare(
      "INSERT INTO scans (reference, domain, rubric_version, observations, signals, score, coverage, created_at)" +
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      scan.reference,
      scan.domain,
      scan.rubricVersion,
      JSON.stringify(scan.observations),
      JSON.stringify(scan.signals),
      scan.score,
      scan.coverage,
      scan.createdAt,
    )
    .run();
}

/** Same sliding-window shape as submissions' withinRateLimit. */
export async function withinScanRateLimit(
  db: D1Database,
  clientKey: string,
  now = Date.now(),
): Promise<boolean> {
  const windowStart = new Date(now - 60 * 60 * 1000).toISOString();
  const row = await db
    .prepare("SELECT count, window_start FROM scan_throttle WHERE client_key = ?")
    .bind(clientKey)
    .first<{ count: number; window_start: string }>();

  if (!row || row.window_start < windowStart) {
    await db
      .prepare(
        "INSERT INTO scan_throttle (client_key, window_start, count) VALUES (?, ?, 1)" +
          " ON CONFLICT(client_key) DO UPDATE SET window_start = excluded.window_start, count = 1",
      )
      .bind(clientKey, new Date(now).toISOString())
      .run();
    return true;
  }

  if (row.count >= SCANS_PER_HOUR) return false;

  await db.prepare("UPDATE scan_throttle SET count = count + 1 WHERE client_key = ?").bind(clientKey).run();
  return true;
}
