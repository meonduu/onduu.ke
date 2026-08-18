/**
 * Orchestrator for the Instant Public Readiness Scan: validate the target,
 * apply the do-not-scan list, collect observations within one shared
 * budget, evaluate signals, score, store, and shape the visitor-facing
 * result. Launch remains gated (spec §7) — this module has no route of its
 * own and is reachable only through the flag-guarded endpoint.
 */
import { makeBudget, normaliseHost, isScannableHost } from "./net.ts";
import { collectObservations } from "./collect.ts";
import { evaluateSignals } from "./signals.ts";
import { scoreSignals, CURRENT_RUBRIC, type SignalResult } from "./rubric.ts";
import { isBlocked } from "./do-not-scan.ts";
import { findRecentScan, saveScan, scanReference, type StoredScan } from "./store.ts";

/** Whole-job limits: wall clock and outbound request count (spec §5). */
const WALL_MS = 20_000;
const SUBREQUESTS = 40;

export interface ScanResponseBody {
  ok: true;
  reference: string;
  domain: string;
  scannedAt: string;
  cached: boolean;
  rubricVersion: string;
  /** Public Signal Score — explicitly not a Digital Readiness Score. */
  publicSignalScore: number;
  evidenceCoverage: number;
  signals: SignalResult[];
  notObserved: { label: string; note: string }[];
  statement: string;
}

export type ScanOutcome =
  | { ok: true; body: ScanResponseBody }
  | { ok: false; status: number; error: string };

const STATEMENT =
  "Public observations only, made at the time shown. This is a Public Signal Score, not a " +
  "Digital Readiness Score: items marked as not publicly observable neither helped nor hurt " +
  "the score. A Verified Digital Readiness Score requires customer evidence, human review " +
  "and separately authorised tests.";

function shape(stored: StoredScan, cached: boolean): ScanResponseBody {
  return {
    ok: true,
    reference: stored.reference,
    domain: stored.domain,
    scannedAt: stored.createdAt,
    cached,
    rubricVersion: stored.rubricVersion,
    publicSignalScore: stored.score,
    evidenceCoverage: stored.coverage,
    signals: stored.signals,
    notObserved: stored.signals
      .filter((s) => s.status === "unobservable")
      .map((s) => ({ label: s.label, note: s.evidence })),
    statement: STATEMENT,
  };
}

export async function runScan(rawInput: string, db: D1Database): Promise<ScanOutcome> {
  const domain = normaliseHost(rawInput);
  if (!domain || !isScannableHost(domain)) {
    return { ok: false, status: 400, error: "Please enter a valid public domain name, like yourbusiness.co.ke." };
  }
  if (isBlocked(domain)) {
    return { ok: false, status: 403, error: "This domain has asked not to be scanned." };
  }

  const cached = await findRecentScan(db, domain);
  if (cached) return { ok: true, body: shape(cached, true) };

  const budget = makeBudget(WALL_MS, SUBREQUESTS);
  const observations = await collectObservations(domain, budget);
  const signals = evaluateSignals(observations);
  const { score, coverage } = scoreSignals(signals, CURRENT_RUBRIC);

  const stored: StoredScan = {
    reference: scanReference(),
    domain,
    rubricVersion: CURRENT_RUBRIC,
    observations,
    signals,
    score,
    coverage,
    createdAt: observations.scannedAt,
  };
  await saveScan(db, stored);
  return { ok: true, body: shape(stored, false) };
}
