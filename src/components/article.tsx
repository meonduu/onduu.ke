import { Link } from "./nav-link";
import { Header, Footer } from "./components";
import type { Article, Block, Inline } from "../data/insights-data";
import { articles } from "../data/insights-data";

function isExternal(href: string) {
  return /^https?:\/\//.test(href) && !href.startsWith("https://onduu.ke");
}

function InlineRun({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === "strong") return <strong key={i}>{n.v}</strong>;
        if (n.t === "em") return <em key={i}>{n.v}</em>;
        if (n.t === "code") return <code key={i}>{n.v}</code>;
        if (n.t === "a") {
          if (isExternal(n.href)) {
            return (
              <a key={i} href={n.href} rel="noopener noreferrer" target="_blank">
                {n.v}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            );
          }
          return (
            <Link key={i} href={n.href}>
              {n.v}
            </Link>
          );
        }
        return <span key={i}>{n.v}</span>;
      })}
    </>
  );
}

function ProseBlock({ block }: { block: Block }) {
  if (block.type === "p")
    return (
      <p>
        <InlineRun nodes={block.nodes} />
      </p>
    );
  if (block.type === "h2") return <h2>{block.text}</h2>;
  if (block.type === "h3") return <h3>{block.text}</h3>;
  if (block.type === "ul")
    return (
      <ul>
        {block.items.map((item, i) => (
          <li key={i}>
            <InlineRun nodes={item} />
          </li>
        ))}
      </ul>
    );
  if (block.type === "ol")
    return (
      <ol>
        {block.items.map((item, i) => (
          <li key={i}>
            <InlineRun nodes={item} />
          </li>
        ))}
      </ol>
    );
  if (block.type !== "embed") return null;
  return (
    <div className="embed">
      <iframe
        src={block.src}
        title={block.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export function ArticlePage({ article }: { article: Article }) {
  const related = articles
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3);

  return (
    <>
      <Header />
      <main id="main">
        <article className="article">
          <header className="article-head">
            <Link className="article-back" href="/insights">
              <span aria-hidden="true">←</span> All insights
            </Link>
            <p className="eyebrow">INSIGHT / {article.category.toUpperCase()}</p>
            <h1>{article.title}</h1>
            <p className="lede">{article.lede}</p>
            <div className="article-meta">
              <time dateTime={article.date}>{article.dateLabel}</time>
              <span>· {article.readTime}</span>
              <span>· {article.author}</span>
            </div>
            {article.tags.length > 0 && (
              <ul className="article-tags">
                {article.tags.map((t) => (
                  <li key={t}>{`#${t}`}</li>
                ))}
              </ul>
            )}
          </header>
          <div className="article-prose">
            {article.body.map((block, i) => (
              <ProseBlock key={i} block={block} />
            ))}
          </div>
        </article>
        {related.length > 0 && (
          <section className="content-section">
            <div>
              <p className="section-number">MORE / {article.category.toUpperCase()}</p>
              <h2>Related insights</h2>
            </div>
            <div className="section-body">
              <div className="content-cards">
                {related.map((a) => (
                  <article key={a.slug}>
                    <small>{a.dateLabel}</small>
                    <h3>
                      <Link href={`/insights/${a.slug}`}>{a.title}</Link>
                    </h3>
                    <p>{a.excerpt}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export function InsightsIndex() {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div>
            <p className="eyebrow">ONDUU / INSIGHTS</p>
            <h1>The layer your business runs on.</h1>
            <p className="lede">
              Domains, DNS, business email, and the software that now acts through them.
              Written from running this layer in Kenya since 2005. No hype, no recycled
              trends.
            </p>
          </div>
          <aside className="hero-index">
            {categories.map((c) => (
              <span key={c}>{c}</span>
            ))}
            <span>
              {articles.length} article{articles.length === 1 ? "" : "s"}
            </span>
          </aside>
        </section>
        <section className="content-section">
          <div>
            <p className="section-number">01 / ARCHIVE</p>
            <h2>All insights</h2>
          </div>
          <div className="section-body">
            <ul className="post-rows">
              {sorted.map((a) => (
                <li key={a.slug}>
                  <Link className="post-row" href={`/insights/${a.slug}`}>
                    <div className="post-row-meta">
                      <span className="post-row-category">{a.category}</span>
                      <time dateTime={a.date}>{a.dateLabel}</time>
                      <span>· {a.readTime}</span>
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                    <span className="post-row-read">
                      Read article <span aria-hidden="true">↗</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
