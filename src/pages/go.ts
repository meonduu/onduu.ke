// Private dashboard, reachable only through Cloudflare Access (bound to the
// onduu.ke hostname; workers_dev stays disabled for exactly this reason).
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleDashboard } from "../../worker/dashboard";

export const ALL: APIRoute = ({ request }) => handleDashboard(request, env as never);
