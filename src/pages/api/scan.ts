/**
 * POST /api/scan — the Instant Public Fitness Scan endpoint.
 *
 * LAUNCH-GATED (docs/specs/instant-scan.md §7): unless the SCAN_ENABLED
 * Worker var is exactly "true", every request gets the same 404 as any
 * unknown route. Production has no such var, so building and deploying
 * this code exposes nothing; enabling it is a separate owner action after
 * the launch gates pass.
 *
 * With the flag on: Turnstile first (owner decision #2, same widget and
 * secret as the forms), then the hourly per-client rate limit, then the
 * 24-hour per-domain cache, and only then a live scan.
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyTurnstile, clientKeyOf } from "../../../worker/submissions";
import { withinScanRateLimit } from "../../../worker/scan/store";
import { runScan } from "../../../worker/scan/scan";

interface ScanEnv {
  SCAN_ENABLED?: string;
  TURNSTILE_SECRET?: string;
  onduu_leads?: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export const ALL: APIRoute = async ({ request }) => {
  const e = env as unknown as ScanEnv;

  if (e.SCAN_ENABLED !== "true") return new Response("Not found", { status: 404 });

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let body: { domain?: unknown; "cf-turnstile-response"?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: "Send JSON with a domain field." }, 400);
  }

  // Fail closed, exactly like /api/submit: no secret, no scans.
  if (!e.TURNSTILE_SECRET || !e.onduu_leads) {
    return json({ ok: false, error: "The scan is not configured." }, 503);
  }
  const passed = await verifyTurnstile(
    typeof body["cf-turnstile-response"] === "string" ? body["cf-turnstile-response"] : "",
    e.TURNSTILE_SECRET,
    request.headers.get("cf-connecting-ip"),
  );
  if (!passed) return json({ ok: false, error: "Please complete the check." }, 403);

  const clientKey = await clientKeyOf(request);
  if (!(await withinScanRateLimit(e.onduu_leads, clientKey))) {
    return json({ ok: false, error: "Too many scans from this connection. Please try again later." }, 429);
  }

  const outcome = await runScan(typeof body.domain === "string" ? body.domain : "", e.onduu_leads);
  if (!outcome.ok)
    return json({ ok: false, error: outcome.error, next: outcome.next }, outcome.status);
  return json(outcome.body);
};
