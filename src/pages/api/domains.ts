// Domain availability search across the KeNIC namespace. Public DNS and
// RDAP observations only; the search and its result are logged (domain and
// outcome, never the visitor — see worker/tool-log.ts) after the response is
// on its way.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleDomainSearch } from "../../../worker/domains";
import { logToolCheck, summariseDomainSearch } from "../../../worker/tool-log";

export const ALL: APIRoute = async ({ request, locals }) => {
  const response = await handleDomainSearch(request);
  if (response.ok) {
    const copy = response.clone();
    locals.cfContext?.waitUntil(
      copy
        .json()
        .then((body) => {
          const entry = summariseDomainSearch(body as never);
          if (entry) {
            return logToolCheck((env as { onduu_leads?: D1Database }).onduu_leads, entry);
          }
        })
        .catch(() => {}),
    );
  }
  return response;
};
