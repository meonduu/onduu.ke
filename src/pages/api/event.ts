// Collection endpoint for the first-party engagement tracker
// (src/components/analytics.ts). POST only, same-origin only, strict
// allowlists in worker/events.ts. Bots and visitors signalling Global
// Privacy Control or Do Not Track are acknowledged and not recorded.
// Recording runs in waitUntil and can never delay or break a response.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { BOT } from "../../../worker/pageviews";
import { clientKeyOf } from "../../../worker/submissions";
import {
  MAX_BODY_BYTES,
  bumpHealth,
  parseEvents,
  recordEvents,
  withinEventRateLimit,
} from "../../../worker/events";

interface Env {
  onduu_leads?: D1Database;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (env as Env).onduu_leads;
  const url = new URL(request.url);

  // sendBeacon and fetch both send Origin on cross-origin POSTs; a missing
  // header is allowed because same-origin sendBeacon may omit it.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) {
    return new Response(null, { status: 403 });
  }
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return new Response(null, { status: 415 });
  }
  // The tracker already stays silent for GPC/DNT; honour stragglers here too.
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return new Response(null, { status: 204 });
  }
  const userAgent = request.headers.get("user-agent") || "";
  if (BOT.test(userAgent)) return new Response(null, { status: 204 });

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (db && !(await withinEventRateLimit(db, await clientKeyOf(request, "event", (env as { CLIENT_KEY_SECRET?: string }).CLIENT_KEY_SECRET)))) {
    return new Response(null, { status: 429 });
  }

  const { rows, rejected } = parseEvents(json, {
    ownHost: url.host,
    country: (request as Request & { cf?: { country?: string } }).cf?.country ?? null,
    userAgent,
  });
  if (rows.length === 0 && rejected > 0 && !Array.isArray((json as { events?: unknown })?.events)) {
    return new Response(null, { status: 400 });
  }
  if (db) {
    locals.cfContext.waitUntil(
      recordEvents(db, rows).then(() => bumpHealth(db, rows.length, rejected)),
    );
  }
  return new Response(null, { status: 204 });
};

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
