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
// Emptied on 16 August 2026: the owner reviewed and approved Managed Website
// Operations, the Agent Workflow Pilot, the Infrastructure hub and its two
// child pages, and Results. All are now indexed, in the sitemap and linked
// from navigation.
//
// The legal routes are still marked as drafts on the pages themselves — that
// is separate from this gate and unaffected.
export const GATED_ROUTES = new Set<string>([]);

export function isGated(route: string) {
  return GATED_ROUTES.has(route.replace(/^\/|\/$/g, ""));
}

export const SITE_URL = "https://onduu.ke";

// Turnstile site key for the "Onduu.ke" widget. Site keys are public by design
// — they are served to every visitor in the page. The matching secret lives
// only in the Worker's TURNSTILE_SECRET binding and is never in this repo.
export const TURNSTILE_SITE_KEY = "0x4AAAAAABgay5gLqOlJAaa7";
