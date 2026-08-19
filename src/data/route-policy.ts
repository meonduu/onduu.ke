// Publication gates from the definitive brief (15 August 2026), section 2 and
// the per-page "Publication gate" notes.
//
// The brief permits unapproved commercial copy to be either marked as draft or
// hidden from production. These routes are hidden: they stay reachable by
// direct URL for review, but are noindex and absent from navigation and the
// sitemap until the owner approves the employment, HOSTAFRICA and
// managed-agent boundaries.
//
// Legal routes are deliberately NOT in this list. They ship as marked drafts
// because the assessment and contact forms must link to a privacy notice.
// Regated on 18 August 2026 under the current strategy (docs/strategy/):
// Managed Website Operations describes a service with no operator, so it is
// archived behind a non-indexed preview gate rather than deleted; Results
// waits for approved evidence (Phase 6); the managed-service terms describe
// the gated service. Reachable by direct URL for review, noindex, absent
// from the sitemap and navigation.
//
// The legal routes are still marked as drafts on the pages themselves — that
// is separate from this gate and unaffected.
// Empty since 19 August 2026: the last two gated pages (Managed Website
// Operations and Results) were removed rather than left reachable. The
// mechanism stays, so a future page can be gated without rebuilding it.
export const GATED_ROUTES = new Set<string>([]);

export function isGated(route: string) {
  return GATED_ROUTES.has(route.replace(/^\/|\/$/g, ""));
}

export const SITE_URL = "https://onduu.ke";

// Turnstile site key for the "Onduu.ke" widget. Site keys are public by design
// — they are served to every visitor in the page. The matching secret lives
// only in the Worker's TURNSTILE_SECRET binding and is never in this repo.
//
// The real key is registered for onduu.ke only, so on localhost the widget
// fails with error 110200. The dev server therefore uses Cloudflare's official
// always-passing test key (dashboard-independent, valid on any hostname); its
// matching test secret is in .dev.vars. import.meta.env only exists under
// Vite, so plain-Node consumers (the tests) fall through to the real key.
const viteEnv = (import.meta as { env?: { DEV?: boolean } }).env;
export const TURNSTILE_SITE_KEY = viteEnv?.DEV
  ? "1x00000000000000000000AA"
  : "0x4AAAAAABgay5gLqOlJAaa7";
