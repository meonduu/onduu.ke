// Request/response wiring that lived in worker/index.ts under vinext.
// The worker modules themselves are unchanged; only the mounting moved.
import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { clearStaleCookies } from "../worker/stale-cookies";
import { recordPageView, shouldRecord } from "../worker/pageviews";

// v8.8 URLs that the migrated articles still link to, and that search
// engines have indexed. /email-security was the checker, so /check is its
// direct successor.
const REDIRECTS: Record<string, string> = {
  "/email-security": "/check",
  "/email-security/glossary": "/check",
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
  // page back. Self-limiting: once gone, the browser stops sending them.
  return clearStaleCookies(context.request, response);
});
