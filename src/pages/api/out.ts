// First-party outbound-click counting (strategy measure: "approved
// HOSTAFRICA-path clicks"). Accepts a route name from a fixed allowlist and
// records it as a synthetic page view — same table, same privacy posture:
// no IP, no user-agent, no identifier, nothing stored on the device.
//
// Hardened 22 August 2026 after a security review. This endpoint had no
// origin check, no content-type check and no rate limit, so anyone could
// POST to it from anywhere, repeatedly. Nothing leaks that way, but the
// number it feeds is the one the strategy uses to judge how much demand
// this site routes onward — a figure read on /go/routing to make decisions
// — and a metric anyone can inflate is worse than no metric, because it
// still looks like evidence.
//
// A determined forger with many addresses is still not stopped by any of
// this; the durable fix is a server-controlled redirect, where the only
// way to be counted is to actually be sent onward. That is a change to how
// outbound links work and is deliberately not made here.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { recordPageView } from "../../../worker/pageviews";
import { readJsonLimited, BODY_LIMITS } from "../../../worker/body-limit";
import { clientKeyOf, withinLimit } from "../../../worker/rate-limit";

const ALLOWED = new Set(["hostafrica-domains", "hostafrica-infrastructure"]);

// A visitor clicking outward more than this in an hour is not a visitor.
const CLICKS_PER_HOUR = 20;

export const POST: APIRoute = async ({ request, locals }) => {
  const e = env as { onduu_leads?: D1Database; CLIENT_KEY_SECRET?: string };

  // A WRONG origin is refused; a MISSING one is allowed. That distinction
  // is not a softening — the caller is navigator.sendBeacon, and a
  // same-origin beacon may send no Origin header at all, so demanding one
  // would silently stop counting real clicks while looking stricter.
  // /api/event carries the same rule for the same reason. Hosts are
  // compared exactly: a prefix match would accept onduu.ke.example.com.
  const origin = request.headers.get("origin");
  if (origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === new URL(request.url).host;
    } catch {
      sameHost = false; // an unparseable Origin is not our page
    }
    if (!sameHost) return new Response(null, { status: 403 });
  }

  // A form-encoded or text/plain POST is a cross-site request that never
  // needed a preflight. Requiring JSON means the browser had to ask
  // permission first, and our own fetch already sends it.
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415 });
  }

  const parsed = await readJsonLimited(request, BODY_LIMITS.out);
  if (!parsed.ok) return new Response(null, { status: parsed.reason === "too_large" ? 413 : 400 });

  const route = String((parsed.value as { route?: unknown } | null)?.route ?? "");
  if (!ALLOWED.has(route)) return new Response(null, { status: 204 });

  if (e.onduu_leads) {
    try {
      const key = await clientKeyOf(request, "out", e.CLIENT_KEY_SECRET);
      if (!(await withinLimit(e.onduu_leads, "event_throttle", key, CLICKS_PER_HOUR, 3_600_000))) {
        return new Response(null, { status: 429 });
      }
    } catch {
      // Fails open, like the engagement tracker it shares a table with:
      // this is a counter, and an unreachable counter must not break a
      // visitor's journey to HOSTAFRICA. The "out" purpose gives it its
      // own key space, so it never spends the events budget.
    }
  }

  const synthetic = new Request(`https://onduu.ke/outbound/${route}`, {
    headers: request.headers,
  });
  locals.cfContext.waitUntil(recordPageView(synthetic, env as never));
  return new Response(null, { status: 204 });
};

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
