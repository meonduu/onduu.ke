// Public-DNS email security check. Reads only published records, so it
// needs no bindings for the lookup itself; the result is logged (domain and
// outcome, never the visitor — see worker/tool-log.ts) after the response is
// on its way, so logging never delays or breaks a check.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleCheck } from "../../../worker/email-check.js";
import { logToolCheck, summariseEmailCheck } from "../../../worker/tool-log";

export const GET: APIRoute = async ({ request, locals }) => {
  const response = await handleCheck(request);
  if (response.ok) {
    const copy = response.clone();
    locals.cfContext?.waitUntil(
      copy
        .json()
        .then((body) => {
          const entry = summariseEmailCheck(body as never);
          if (entry) {
            return logToolCheck((env as { onduu_leads?: D1Database }).onduu_leads, entry);
          }
        })
        .catch(() => {}),
    );
  }
  return response;
};

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
