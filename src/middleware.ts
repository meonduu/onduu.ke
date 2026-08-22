// Request/response wiring that lived in worker/index.ts under vinext.
// The worker modules themselves are unchanged; only the mounting moved.
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { clearStaleCookies } from "../worker/stale-cookies";
import { withSecurityHeaders } from "../worker/security-headers";
import { recordPageView, shouldRecord } from "../worker/pageviews";
import { cleanupIsDue, runCleanup } from "../worker/cleanup";

// Route history, each old URL 301ing to its successor: the checker began
// life at /email-security (v8.8), moved to /check in the rebuild, and moved
// back to /email-security on 18 Aug 2026 (owner rename, with /domains →
// /kedomains, reversed again on 21 Aug 2026). The /solutions and /infrastructure trees were removed by the
// 18 August 2026 strategy (docs/strategy/): delivery offers became guides
// and paths.
const REDIRECTS: Record<string, string> = {
  "/email-security/glossary": "/email-security",
  "/check": "/email-security",
  // Renamed back to /domains on the owner's instruction, 21 Aug 2026
  // (v4.85.0). This line pointed the other way from 18 Aug: /domains →
  // /kedomains. Both directions must never exist at once — that is an
  // infinite redirect, and it would take the tool down for everyone.
  "/kedomains": "/domains",
  // Digital Readiness became Digital Fitness on the owner's instruction,
  // 20 August 2026. /readiness carried the primary CTA from launch and is
  // the most-linked route on the site, so this redirect is load-bearing:
  // every header, hero and footer link published before the rename points
  // at it, as do the sitemap entries search engines already hold.
  "/readiness": "/digital-fitness",
  "/paths": "/digital-fitness",
  "/solutions": "/digital-fitness",
  "/solutions/digital-revenue-risk-review": "/digital-fitness",
  "/solutions/website-revenue-system": "/guides/website-revenue-system",
  "/solutions/agent-workflow-pilot": "/guides/agents-on-vps",
  "/infrastructure": "/paths/hostafrica-infrastructure",
  "/infrastructure/kenyan-vps-data-location": "/guides/kenyan-vps",
  "/infrastructure/buzz-agent-collaboration": "/guides/agents-on-vps",
  // The Buzz guide (v4.45.0) was removed on the owner's instruction,
  // 20 August 2026; supervised agents is the nearest surviving ground.
  "/guides/buzz-workspaces": "/guides/agents-on-vps",
  // Labs removed 19 Aug 2026 (owner): its ground is covered by the guides
  // and the free tools, so inbound links land on the guides index.
  "/labs": "/guides",
  // Managed service terms removed 19 Aug 2026 (owner); the assessment terms
  // are the live terms document.
  "/legal/managed-service-terms": "/legal/assessment-terms",
  // The last two gated pages, removed 19 Aug 2026 (owner). Ongoing website
  // work is now an independent-provider route; published evidence lives in
  // Insights.
  "/managed-website-operations": "/paths/website-and-digital-marketing",
  "/results": "/insights",
};

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const redirectTo = REDIRECTS[url.pathname.replace(/\/$/, "")];
  if (redirectTo) return Response.redirect(new URL(redirectTo, url).toString(), 301);

  const response = await next();

  // Recorded after the response is ready, so it never delays the page.
  if (shouldRecord(context.request, response)) {
    context.locals.cfContext.waitUntil(recordPageView(context.request, env as never));

    // And, at most once every six hours per isolate, sweep the spent
    // machinery (worker/cleanup.ts). Also after the response, so a
    // visitor never waits for it, and never throwing into their request.
    const db = (env as { onduu_leads?: D1Database }).onduu_leads;
    if (db && cleanupIsDue()) {
      context.locals.cfContext.waitUntil(runCleanup(db).catch(() => {}));
    }
  }

  // Expire analytics cookies left by the previous site before handing the
  // page back (self-limiting), then attach the browser security headers.
  return withSecurityHeaders(clearStaleCookies(context.request, response));
});
