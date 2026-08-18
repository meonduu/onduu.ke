import type { PageContent } from "../components/components";
import { briefPages } from "./pages-brief";
import { pages as prototypePages } from "./site-data";

// Single source for route content. Entries in pages-brief.ts carry the exact
// approved copy from the definitive brief and take precedence over the earlier
// prototype copy for the routes they cover.
export const pages: Record<string, PageContent> = {
  ...prototypePages,
  ...briefPages,
};
