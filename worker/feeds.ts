/**
 * sitemap.xml, rss.xml and robots.txt.
 *
 * Required by the definitive brief, section 26 ("Provide sitemap, robots
 * policy, RSS feed and a useful 404") and listed in the minimum viable
 * release. Gated routes are excluded from both the sitemap and robots, so
 * unapproved commercial copy is not advertised to crawlers.
 */
import { articles } from "../src/data/insights-data";
import { GATED_ROUTES, SITE_URL } from "../src/data/route-policy";
import { pages } from "../src/data/site-pages";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function publicRoutes() {
  const routes = ["", "insights", "email-security", "dns", "kedomains", "scan", ...Object.keys(pages)];
  return routes.filter((r) => !GATED_ROUTES.has(r));
}

export function sitemap(): Response {
  const urls = [
    ...publicRoutes().map((r) => ({ loc: `${SITE_URL}/${r}`.replace(/\/$/, "") || SITE_URL })),
    ...articles.map((a) => ({
      loc: `${SITE_URL}/insights/${a.slug}`,
      lastmod: a.date,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escape(u.loc)}</loc>${"lastmod" in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

export function rss(): Response {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const items = sorted
    .map((a) => {
      const url = `${SITE_URL}/insights/${a.slug}`;
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${a.date}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${escape(a.category)}</category>
      <dc:creator>${escape(a.author)}</dc:creator>
      <description>${escape(a.excerpt || a.lede)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Onduu Insights</title>
    <link>${SITE_URL}/insights</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Evidence-led guidance for Kenyan business leaders on conversion, digital control, infrastructure and supervised agents.</description>
    <language>en-KE</language>
    <lastBuildDate>${new Date(`${sorted[0].date}T00:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

export function robots(): Response {
  const disallow = [...GATED_ROUTES].map((r) => `Disallow: /${r}`).join("\n");
  const body = `User-agent: *
Allow: /
${disallow}
Disallow: /api/
Disallow: /go

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
