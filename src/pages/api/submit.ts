// Form submissions. handleSubmit does its own method/validation handling,
// exactly as it did behind worker/index.ts.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleSubmit, type SubmissionEnv } from "../../../worker/submissions";

export const ALL: APIRoute = ({ request }) =>
  handleSubmit(request, env as unknown as SubmissionEnv);
