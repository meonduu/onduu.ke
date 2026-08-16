/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleCheck } from "./email-check.js";
import { sitemap, rss, robots } from "./feeds";
import { handleSubmit, type SubmissionEnv } from "./submissions";
import { clearStaleCookies } from "./stale-cookies";
import { handleDashboard } from "./dashboard";
import { recordPageView, shouldRecord } from "./pageviews";

interface Env extends SubmissionEnv {
  DASHBOARD_TOKEN?: string;
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // v8.8 URLs that the migrated articles still link to, and that search
    // engines have indexed. /email-security was the checker, so /check is its
    // direct successor.
    const REDIRECTS: Record<string, string> = {
      "/email-security": "/check",
      "/email-security/glossary": "/check",
    };
    const redirectTo = REDIRECTS[url.pathname.replace(/\/$/, "")];
    if (redirectTo) return Response.redirect(new URL(redirectTo, url).toString(), 301);

    if (url.pathname === "/go" || url.pathname === "/go/") return handleDashboard(request, env);

    if (url.pathname === "/api/submit") return handleSubmit(request, env);

    if (url.pathname === "/sitemap.xml") return sitemap();
    if (url.pathname === "/rss.xml") return rss();
    if (url.pathname === "/robots.txt") return robots();

    // Public-DNS email security check. Reads only published records, so it
    // needs no bindings and no stored state.
    if (url.pathname === "/api/check") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
      }
      return handleCheck(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // Expire analytics cookies left by the previous site before handing the
    // page back. Self-limiting: once gone, the browser stops sending them.
    const response = await handler.fetch(request, env, ctx);

    // Recorded after the response is ready, so it never delays the page.
    if (shouldRecord(request, response)) ctx.waitUntil(recordPageView(request, env));

    return clearStaleCookies(request, response);
  },
};

export default worker;
