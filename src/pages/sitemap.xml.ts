import type { APIRoute } from "astro";
import { sitemap } from "../../worker/feeds";

export const GET: APIRoute = () => sitemap();
