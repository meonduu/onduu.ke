import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StandardPage } from "../components";
import { ArticlePage, InsightsIndex } from "../article";
import { articles, articlesBySlug } from "../insights-data";
import { isGated, SITE_URL } from "../route-policy";
import { pages } from "../site-data";

export function generateStaticParams() {
  return [
    ...Object.keys(pages).map((key) => ({ slug: key.split("/") })),
    { slug: ["insights"] },
    ...articles.map((a) => ({ slug: ["insights", a.slug] })),
  ];
}

// Every indexable page needs a unique title, meta description, canonical URL
// and Open Graph tags (brief, section 26). Gated routes are noindex.
function meta({
  title,
  description,
  path,
  gated = false,
}: {
  title: string;
  description: string;
  path: string;
  gated?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: gated ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: "Onduu", type: "website" },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");

  if (key === "insights") {
    return meta({
      title: "Website Revenue, Resilience and Agent Operations Insights | Onduu",
      description:
        "Evidence-led guidance for Kenyan business leaders on conversion, digital control, infrastructure and supervised agents.",
      path: "/insights",
    });
  }

  if (slug[0] === "insights" && slug.length === 2) {
    const article = articlesBySlug.get(slug[1]);
    if (article) {
      return {
        ...meta({
          title: `${article.title} | Onduu`,
          description: article.lede,
          path: `/insights/${article.slug}`,
        }),
        authors: [{ name: article.author }],
      };
    }
  }

  const page = pages[key];
  if (!page) return {};
  return meta({
    title: `${page.title} | Onduu`,
    description: page.intro,
    path: `/${key}`,
    gated: isGated(key),
  });
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");
  if (key === "insights") return <InsightsIndex />;
  if (slug[0] === "insights" && slug.length === 2) {
    const article = articlesBySlug.get(slug[1]);
    if (article) return <ArticlePage article={article} />;
  }
  const page = pages[key];
  if (!page) notFound();
  return <StandardPage page={page} />;
}
