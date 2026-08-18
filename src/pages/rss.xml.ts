import type { APIRoute } from "astro";
import { rss } from "../../worker/feeds";

export const GET: APIRoute = () => rss();
