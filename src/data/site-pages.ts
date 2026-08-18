import type { PageContent } from "../components/components";
import { briefPages } from "./pages-brief";
import { pages as prototypePages } from "./site-data";
import { strategyPages, REMOVED_ROUTES } from "./pages-strategy";

// Single source for route content, in three layers of increasing authority:
// the 15 August prototype copy, the definitive-brief overrides, and the
// current-strategy overrides (docs/strategy/, 18 August 2026). Routes the
// strategy removed are dropped here and 301-redirected in src/middleware.ts.
const merged: Record<string, PageContent> = {
  ...prototypePages,
  ...briefPages,
  ...strategyPages,
};
for (const route of REMOVED_ROUTES) delete merged[route];

export const pages = merged;
