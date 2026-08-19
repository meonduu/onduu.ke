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
  // Hardening (owner-approved 19 Aug 2026, closing the Phase 0 deferral):
  // form-encoded POSTs whose Origin header does not match the site are
  // rejected with 403 before any handler runs. The site's own forms and
  // tools all post same-origin JSON, so nothing legitimate is affected.
  //
  // CSP (owner-approved 18 Aug 2026): Astro hashes its own inline hydration
  // scripts automatically; the allowances below are Turnstile (script,
  // frame, connect) and the one YouTube embed in Insights (frame).
  // frame-ancestors is intentionally absent — meta CSP cannot carry it, and
  // the X-Frame-Options header (worker/security-headers.ts) covers it.
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com https://www.youtube.com",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", "https://challenges.cloudflare.com"],
      },
      styleDirective: {
        // astro-island applies display:contents via a style attribute; the
        // attribute-scoped 'unsafe-inline' allows exactly that without
        // weakening style elements (which stay 'self' + Astro's hashes).
        resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
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
