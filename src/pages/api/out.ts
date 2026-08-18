// First-party outbound-click counting (strategy measure: "approved
// HOSTAFRICA-path clicks"). Accepts a route name from a fixed allowlist and
// records it as a synthetic page view — same table, same privacy posture:
// no IP, no user-agent, no identifier, nothing stored on the device.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { recordPageView } from "../../../worker/pageviews";

const ALLOWED = new Set(["hostafrica-domains", "hostafrica-infrastructure"]);

export const POST: APIRoute = async ({ request, locals }) => {
  let route = "";
  try {
    route = String(((await request.json()) as { route?: unknown }).route ?? "");
  } catch {
    /* fall through to the allowlist check */
  }
  if (!ALLOWED.has(route)) return new Response(null, { status: 204 });

  const synthetic = new Request(`https://onduu.ke/outbound/${route}`, {
    headers: request.headers,
  });
  locals.cfContext.waitUntil(recordPageView(synthetic, env as never));
  return new Response(null, { status: 204 });
};

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
