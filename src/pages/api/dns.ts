// DNS Health Check API (spec: docs/specs/dns-check.md). Public-DNS and RDAP
// reads only. Launch-gated like /api/scan: without the DNS_CHECK_ENABLED
// secret set to "true" this route is a 404, and deleting the secret is the
// instant kill switch. Results are logged (domain and outcome, never the
// visitor — worker/tool-log.ts) after the response is on its way.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleDnsCheck } from "../../../worker/dns-check";
import { logToolCheck, summariseDnsCheck } from "../../../worker/tool-log";

interface DnsEnv {
  DNS_CHECK_ENABLED?: string;
  onduu_leads?: D1Database;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const e = env as unknown as DnsEnv;
  if (e.DNS_CHECK_ENABLED !== "true") return new Response("Not found", { status: 404 });

  const response = await handleDnsCheck(request);
  if (response.ok) {
    const copy = response.clone();
    locals.cfContext?.waitUntil(
      copy
        .json()
        .then((body) => {
          const entry = summariseDnsCheck(body as never);
          if (entry) return logToolCheck(e.onduu_leads, entry);
        })
        .catch(() => {}),
    );
  }
  return response;
};

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
