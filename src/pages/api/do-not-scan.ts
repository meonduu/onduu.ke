// Domain-owner opt-out request: records it and emails a one-time
// confirmation link to an address at the domain. The action itself happens
// on /do-not-scan/confirm, never here.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleOptOutRequest } from "../../../worker/do-not-scan";
import type { SubmissionEnv } from "../../../worker/submissions";

export const ALL: APIRoute = ({ request }) =>
  handleOptOutRequest(request, env as unknown as SubmissionEnv);
