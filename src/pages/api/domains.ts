// Domain availability search across the .co.ke/.ke pair. Public DNS and
// RDAP observations only; nothing about a search is stored.
import type { APIRoute } from "astro";
import { handleDomainSearch } from "../../../worker/domains";

export const ALL: APIRoute = ({ request }) => handleDomainSearch(request);
