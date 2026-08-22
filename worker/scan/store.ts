/**
 * Persistence for scan results: the 24-hour result cache (spec §6 —
 * repeated scans of one domain serve the stored result rather than
 * re-fetching a third party) and the per-client rate limit, mirroring the
 * submission_throttle pattern.
 */
import { withinLimit } from "../rate-limit.ts";
import type { Observations } from "./collect.ts";
import { CURRENT_RUBRIC, type SignalResult } from "./rubric.ts";

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
        " FROM scans WHERE domain = ? AND created_at >= ? AND rubric_version = ?" +
        " ORDER BY created_at DESC LIMIT 1",
    )
    .bind(domain, cutoff, CURRENT_RUBRIC)
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

/** The domain and each of its parent suffixes, longest-registrable-first. */
function domainSuffixes(domain: string): string[] {
  const labels = domain.toLowerCase().split(".");
  const out: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) out.push(labels.slice(i).join("."));
  return out;
}

/**
 * True when the domain, or any parent of it, is in the opt-out log. A block on
 * "example.co.ke" therefore also blocks "www.example.co.ke".
 */
export async function isDomainBlocklisted(db: D1Database, domain: string): Promise<boolean> {
  const candidates = domainSuffixes(domain);
  if (candidates.length === 0) return false;
  const placeholders = candidates.map(() => "?").join(",");
  const row = await db
    .prepare(`SELECT 1 FROM scan_blocklist WHERE domain IN (${placeholders}) LIMIT 1`)
    .bind(...candidates)
    .first();
  return row != null;
}

/**
 * The owner opt-out action: record the domain in the blocklist and delete
 * everything stored about it — scan results AND lookup-tool results (email
 * checker and domain search, migration 0006) — for the domain and its
 * subdomains. Idempotent.
 *
 * The blocklist then does double duty: it refuses future scans outright, and
 * stops future lookups being recorded (worker/tool-log.ts). The lookups
 * themselves keep working, because they read only the public DNS and registry
 * records any WHOIS tool can read; what the owner opted out of is Onduu
 * keeping a record.
 */
export async function optOutDomain(
  db: D1Database,
  domain: string,
  note: string | null = null,
  now = new Date(),
): Promise<{ deleted: number; checksDeleted: number }> {
  const bare = domain.toLowerCase();
  await db
    .prepare(
      "INSERT INTO scan_blocklist (domain, created_at, note) VALUES (?, ?, ?)" +
        " ON CONFLICT(domain) DO UPDATE SET created_at = excluded.created_at, note = excluded.note",
    )
    .bind(bare, now.toISOString(), note)
    .run();

  const scansRes = await db
    .prepare("DELETE FROM scans WHERE domain = ? OR domain LIKE ?")
    .bind(bare, `%.${bare}`)
    .run();

  // Lookup rows are keyed by what the visitor typed, which may be a bare
  // name ("zero") whose results included the domain — so the stored detail
  // is matched too.
  let checksDeleted = 0;
  try {
    const checksRes = await db
      .prepare("DELETE FROM tool_checks WHERE query = ? OR query LIKE ? OR detail LIKE ?")
      .bind(bare, `%.${bare}`, `%"${bare}"%`)
      .run();
    checksDeleted = checksRes.meta?.changes ?? 0;
  } catch {
    /* tool_checks arrived in migration 0006; absent on an older database */
  }

  return { deleted: scansRes.meta?.changes ?? 0, checksDeleted };
}

/** Same sliding-window shape as submissions' withinRateLimit. */
export async function withinScanRateLimit(
  db: D1Database,
  clientKey: string,
  now = Date.now(),
): Promise<boolean> {
  return withinLimit(db, "scan_throttle", clientKey, SCANS_PER_HOUR, 60 * 60 * 1000, now);
}
