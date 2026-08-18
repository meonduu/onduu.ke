// Dashboard sections. Every one of these refuses without Cloudflare Access
// headers (worker/dashboard.ts fails closed), so a subpath that the Access
// policy does not cover returns 403 rather than leaking enquirer data.
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleDashboard } from "../../../worker/dashboard";

export const ALL: APIRoute = ({ request, params }) =>
  handleDashboard(request, env as never, params.section ?? "");
