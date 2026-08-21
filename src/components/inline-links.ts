/**
 * Body copy lives in data files and React escapes it, so a raw <a> in one
 * of those strings prints as visible markup — a mistake caught just before
 * shipping once already (20 Aug 2026).
 *
 * This is the parser half, kept free of JSX so it can be unit-tested
 * directly: the renderer in components.tsx maps these tokens to elements.
 * Deliberately minimal — no emphasis, no images, no nesting. It is a link
 * parser, not a markdown engine, and widening it would put arbitrary
 * markup back into content strings.
 */
export type InlineToken = string | { label: string; href: string };

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g;

export function parseInlineLinks(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ label, href });
    last = m.index + whole.length;
  }
  if (last === 0) return [text];
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** An href that leaves the site, so it needs target and rel. */
export const isExternal = (href: string) => !href.startsWith("/");
