// Request/response wiring that lived in worker/index.ts under vinext.
// The worker modules themselves are unchanged; only the mounting moved.
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { clearStaleCookies } from "../worker/stale-cookies";
import { withSecurityHeaders } from "../worker/security-headers";
import { recordPageView, shouldRecord } from "../worker/pageviews";

// Route history, each old URL 301ing to its successor: the checker began
// life at /email-security (v8.8), moved to /check in the rebuild, and moved
// back to /email-security on 18 Aug 2026 (owner rename, with /domains →
// /kedomains). The /solutions and /infrastructure trees were removed by the
// 18 August 2026 strategy (docs/strategy/): delivery offers became guides
// and paths.
const REDIRECTS: Record<string, string> = {
  "/email-security/glossary": "/email-security",
  "/check": "/email-security",
  "/domains": "/kedomains",
  "/solutions": "/paths",
  "/solutions/digital-revenue-risk-review": "/readiness",
  "/solutions/website-revenue-system": "/guides/website-revenue-system",
  "/solutions/agent-workflow-pilot": "/guides/agents-on-vps",
  "/infrastructure": "/paths/hostafrica-infrastructure",
  "/infrastructure/kenyan-vps-data-location": "/guides/kenyan-vps",
  "/infrastructure/buzz-agent-collaboration": "/guides/agents-on-vps",
  // Labs removed 19 Aug 2026 (owner): its ground is covered by the guides
  // and the free tools, so inbound links land on the guides index.
  "/labs": "/guides",
};

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const redirectTo = REDIRECTS[url.pathname.replace(/\/$/, "")];
  if (redirectTo) return Response.redirect(new URL(redirectTo, url).toString(), 301);

  const response = await next();

  // Recorded after the response is ready, so it never delays the page.
  if (shouldRecord(context.request, response)) {
    context.locals.cfContext.waitUntil(recordPageView(context.request, env as never));
  }

  // Expire analytics cookies left by the previous site before handing the
  // page back (self-limiting), then attach the browser security headers.
  return withSecurityHeaders(clearStaleCookies(context.request, response));
});
