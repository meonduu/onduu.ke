// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://onduu.ke",
  // Every HTML page renders on demand in the Worker, matching the vinext
  // setup: the middleware must see each page request for first-party
  // page-view recording and stale-cookie expiry. Do not prerender routes
  // without moving that logic first.
  output: "server",
  // No sessions anywhere on the site. Without this, the adapter declares a
  // SESSION KV binding that wrangler would auto-provision on deploy — a
  // production resource this project has not approved.
  session: false,
  // Parity with the vinext Worker: bare cross-origin POSTs reach the route
  // handlers (405 from /api/check, Turnstile + validation on /api/submit)
  // instead of a blanket 403. Revisit as a hardening option post-migration.
  security: { checkOrigin: false },
  adapter: cloudflare({
    // public/ holds only SVGs, which are served as-is; no runtime image
    // transformation, so no IMAGES binding (dropped from wrangler.jsonc).
    imageService: "passthrough",
  }),
  integrations: [react()],
  // Same port as the vinext dev server, so .claude/launch.json keeps working.
  server: { port: 3000 },
  vite: {
    resolve: {
      // SSR runs inside workerd, which has no CommonJS require();
      // react-dom/server otherwise resolves to the CJS Node build and crashes
      // with "require is not defined". The .edge build is ESM.
      alias: { "react-dom/server": "react-dom/server.edge" },
    },
    ssr: {
      optimizeDeps: {
        // Two dev-only workerd crashes, both fixed by pre-bundling:
        // - astro/assets/services/noop is discovered lazily on first render,
        //   forcing a mid-flight optimizer re-run that kills the server
        //   ("file does not exist … deps_ssr/route-cache-*.js");
        // - @astrojs/react's server renderer pulls in a nested CommonJS
        //   picomatch, which loaded raw hits "require is not defined" in
        //   workerd. Optimizing the renderer inlines it as ESM.
        include: ["astro/assets/services/noop", "@astrojs/react/server.js"],
      },
    },
  },
});
