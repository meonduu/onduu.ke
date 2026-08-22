/**
 * Scoring rubrics for the Instant Public Fitness Scan.
 *
 * The rubric is versioned by design (docs/specs/instant-scan.md §3): every
 * stored result names the rubric it was scored under, and recomputing a score
 * from stored signals must reproduce it exactly, on any rubric version in
 * this file. Never edit a published rubric in place — add a new version.
 */

export type SignalStatus = "pass" | "warn" | "fail" | "unobservable";

export type Dimension =
  | "control"
  | "trust"
  | "speed"
  | "conversion"
  | "resilience"
  | "agent-fitness";

export interface SignalResult {
  id: string;
  dimension: Dimension;
  label: string;
  status: SignalStatus;
  /** What was actually observed — shown to the visitor verbatim. */
  evidence: string;
  /** The honest boundary of the observation. */
  limitation: string;
}

/** Weights for rubric psr-v1 (docs/specs/instant-scan.md §9). Sum: 100. */
const PSR_V1_WEIGHTS: Record<string, { dimension: Dimension; weight: number }> = {
  "expiry-buffer": { dimension: "control", weight: 6 },
  "transfer-lock": { dimension: "control", weight: 5 },
  dnssec: { dimension: "control", weight: 4 },
  "ns-redundancy": { dimension: "control", weight: 5 },

  "https-certificate": { dimension: "trust", weight: 6 },
  "http-to-https": { dimension: "trust", weight: 4 },
  "apex-www-coherence": { dimension: "trust", weight: 3 },
  hsts: { dimension: "trust", weight: 2 },
  "security-headers": { dimension: "trust", weight: 2 },
  "title-meta": { dimension: "trust", weight: 3 },

  "ttfb-band": { dimension: "speed", weight: 4 },
  "html-weight": { dimension: "speed", weight: 3 },
  viewport: { dimension: "speed", weight: 3 },

  "contact-path": { dimension: "conversion", weight: 8 },
  "missing-page-handling": { dimension: "conversion", weight: 4 },
  "single-h1": { dimension: "conversion", weight: 3 },

  spf: { dimension: "resilience", weight: 6 },
  dkim: { dimension: "resilience", weight: 4 },
  dmarc: { dimension: "resilience", weight: 8 },
  mx: { dimension: "resilience", weight: 4 },
  "dns-diversity": { dimension: "resilience", weight: 3 },

  robots: { dimension: "agent-fitness", weight: 4 },
  sitemap: { dimension: "agent-fitness", weight: 4 },
  "structured-data": { dimension: "agent-fitness", weight: 2 },
};

export interface Rubric {
  version: string;
  weights: Record<string, { dimension: Dimension; weight: number }>;
}

// psr-v3: the four email signals (spf 6, dkim 4, dmarc 8, mx 4) become one
// "email-auth" signal at their combined weight of 22, so Resilience's share
// of the score is unchanged and only its row count moves. Owner decision,
// 22 Aug 2026: those four rows were the /email-security result copied
// verbatim onto the scan, and the scan is the overview — it should say
// "email authentication: 3 of 4 in order, go deeper here", not repeat the
// deep tool's output. Anything in PSR_V1_WEIGHTS that is not an email key
// is carried over as-is.
const PSR_V3_WEIGHTS: Record<string, { dimension: Dimension; weight: number }> = {
  ...Object.fromEntries(
    Object.entries(PSR_V1_WEIGHTS).filter(([k]) => !["spf", "dkim", "dmarc", "mx"].includes(k)),
  ),
  "email-auth": { dimension: "resilience", weight: 22 },
};

export const RUBRICS: Record<string, Rubric> = {
  "psr-v1": { version: "psr-v1", weights: PSR_V1_WEIGHTS },
  "psr-v2": { version: "psr-v2", weights: PSR_V1_WEIGHTS },
  "psr-v3": { version: "psr-v3", weights: PSR_V3_WEIGHTS },
};

// psr-v2 is psr-v1 with one dimension renamed: agent-readiness became
// agent-fitness in the 20 August 2026 terminology change. No weight and no
// signal changed, so a v1 and a v2 scan of the same domain score
// identically — but the dimension keys differ, so a stored v1 result cannot
// be replayed through v2 labelling without printing a raw id to a visitor.
// The version is therefore bumped and the cache lookup pinned to it below,
// which retires v1 rows within the normal cache window instead of
// rewriting stored history.
export const CURRENT_RUBRIC = "psr-v3";

const POINTS: Record<Exclude<SignalStatus, "unobservable">, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
};

export interface ScoreResult {
  rubricVersion: string;
  /** Public Signal Score, 0–100 over observed signals only. */
  score: number;
  /** Share of the full public rubric that was observable, as a percentage. */
  coverage: number;
  observedWeight: number;
  totalWeight: number;
}

/**
 * Deterministic scoring. Unobservable signals leave both the numerator and
 * the denominator (spec §3) — they are never a pass or a failure. Integer
 * arithmetic on weight×points (points are halves, so ×2 keeps it exact),
 * so replay reproduces scores byte-for-byte with no float drift.
 */
export function scoreSignals(
  signals: SignalResult[],
  rubricVersion: string = CURRENT_RUBRIC,
): ScoreResult {
  const rubric = RUBRICS[rubricVersion];
  if (!rubric) throw new Error(`unknown rubric: ${rubricVersion}`);

  let totalWeight = 0;
  for (const { weight } of Object.values(rubric.weights)) totalWeight += weight;

  let observedWeight = 0;
  let earnedHalves = 0; // Σ points×weight ×2, kept integral
  for (const signal of signals) {
    const entry = rubric.weights[signal.id];
    if (!entry) throw new Error(`signal not in rubric ${rubricVersion}: ${signal.id}`);
    if (signal.status === "unobservable") continue;
    observedWeight += entry.weight;
    earnedHalves += POINTS[signal.status] * 2 * entry.weight;
  }

  const score = observedWeight === 0 ? 0 : Math.round((earnedHalves * 100) / (2 * observedWeight));
  const coverage = Math.round((observedWeight * 100) / totalWeight);
  return { rubricVersion, score, coverage, observedWeight, totalWeight };
}
