/**
 * Orchestrator for the Instant Public Fitness Scan: validate the target,
 * apply the do-not-scan list, collect observations within one shared
 * budget, evaluate signals, score, store, and shape the visitor-facing
 * result. Launch remains gated (spec §7) — this module has no route of its
 * own and is reachable only through the flag-guarded endpoint.
 */
import { type Budget, makeBudget, normaliseHost, isScannableHost, dohQuery } from "./net.ts";
import { collectRdap } from "./collect.ts";
import { collectObservations } from "./collect.ts";
import { evaluateSignals } from "./signals.ts";
import { scoreSignals, CURRENT_RUBRIC, type SignalResult } from "./rubric.ts";
import { isBlocked } from "./do-not-scan.ts";
import {
  findRecentScan,
  isDomainBlocklisted,
  saveScan,
  scanReference,
  type StoredScan,
} from "./store.ts";

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
  /** Public Signal Score — explicitly not a Digital Fitness Score. */
  publicSignalScore: number;
  evidenceCoverage: number;
  signals: SignalResult[];
  notObserved: { label: string; note: string }[];
  statement: string;
}

export type ScanOutcome =
  | { ok: true; body: ScanResponseBody }
  | { ok: false; status: number; error: string; next?: { label: string; href: string } };

const STATEMENT =
  "Public observations only, made at the time shown. This is a Public Signal Score, not a " +
  "Digital Fitness Score: items marked as not publicly observable neither helped nor hurt " +
  "the score. A Verified Digital Fitness Score requires customer evidence, human review " +
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


/**
 * Is there anything here to scan?
 *
 * A name that is not registered has no records to observe, so scoring it
 * produced a meaningless 0/100 at 4% coverage that read as "this domain is
 * terrible" rather than "this domain does not exist" (reported 19 Aug 2026
 * for example.ke). DNS alone cannot answer it: a registered domain with no
 * nameservers also returns NXDOMAIN, so the registry is asked as well.
 */
async function preflight(
  domain: string,
  budget: Budget,
): Promise<{ scannable: true } | { scannable: false; error: string; next?: { label: string; href: string } }> {
  const [ns, a] = await Promise.all([
    dohQuery(domain, "NS", budget),
    dohQuery(domain, "A", budget),
  ]);
  const resolves =
    (ns?.Answer?.length ?? 0) > 0 || (a?.Answer?.length ?? 0) > 0 || ns?.Status === 0 || a?.Status === 0;
  if (resolves) return { scannable: true };

  // Nothing in DNS. Ask the registry before concluding anything.
  const rdap = await collectRdap(domain, budget);
  if (rdap.fetched && rdap.registered === false) {
    return {
      scannable: false,
      error: `${domain} is not registered, and the registry does not allow it to be registered${rdap.reservedNote ? `: ${rdap.reservedNote.toLowerCase()}` : ""}. There is nothing to scan.`,
      next: { label: "Search Kenyan domains", href: "/kedomains" },
    };
  }
  if (rdap.fetched) return { scannable: true }; // registered, simply not pointing anywhere yet
  if (rdap.error === "rdap-not-found") {
    return {
      scannable: false,
      error: `${domain} is not registered, so there is nothing to scan yet. If you are thinking of using this name, check whether it is still available.`,
      next: { label: "Check availability", href: "/kedomains" },
    };
  }
  // The registry did not answer. Say so rather than scoring an absence.
  return {
    scannable: false,
    error: `${domain} does not resolve, and the registry did not answer just now, so this scan cannot tell you whether the domain exists. Try again in a moment.`,
  };
}

export async function runScan(rawInput: string, db: D1Database): Promise<ScanOutcome> {
  const domain = normaliseHost(rawInput);
  if (!domain || !isScannableHost(domain)) {
    return { ok: false, status: 400, error: "Please enter a valid public domain name, like yourbusiness.co.ke." };
  }
  // Two opt-out layers, both checked before any network request: the
  // code-level list for permanent exclusions, and the runtime blocklist table
  // a domain owner's opt-out writes to.
  if (isBlocked(domain) || (await isDomainBlocklisted(db, domain))) {
    return { ok: false, status: 403, error: "This domain has asked not to be scanned." };
  }

  const cached = await findRecentScan(db, domain);
  if (cached) return { ok: true, body: shape(cached, true) };

  const budget = makeBudget(WALL_MS, SUBREQUESTS);

  // Nothing is scored until we know the domain exists.
  const exists = await preflight(domain, budget);
  if (!exists.scannable) {
    return { ok: false, status: 404, error: exists.error, next: exists.next };
  }

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
