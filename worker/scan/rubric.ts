/**
 * Scoring rubrics for the Instant Public Readiness Scan.
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
  | "agent-readiness";

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

  robots: { dimension: "agent-readiness", weight: 4 },
  sitemap: { dimension: "agent-readiness", weight: 4 },
  "structured-data": { dimension: "agent-readiness", weight: 2 },
};

export interface Rubric {
  version: string;
  weights: Record<string, { dimension: Dimension; weight: number }>;
}

export const RUBRICS: Record<string, Rubric> = {
  "psr-v1": { version: "psr-v1", weights: PSR_V1_WEIGHTS },
};

export const CURRENT_RUBRIC = "psr-v1";

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
