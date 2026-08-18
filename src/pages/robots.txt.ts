import type { APIRoute } from "astro";
import { robots } from "../../worker/feeds";

export const GET: APIRoute = () => robots();
