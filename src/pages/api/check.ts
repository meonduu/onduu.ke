// Public-DNS email security check. Reads only published records, so it
// needs no bindings and no stored state.
import type { APIRoute } from "astro";
import { handleCheck } from "../../../worker/email-check.js";

export const GET: APIRoute = ({ request }) => handleCheck(request);

export const ALL: APIRoute = () =>
  new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
