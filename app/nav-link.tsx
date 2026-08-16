import type { ReactNode } from "react";

/**
 * Plain anchor used for all in-site navigation.
 *
 * vinext's own <Link> is broken in the production build: clicking one throws
 * "TypeError: e is not a function" from inside its startTransition handler and
 * the navigation never happens, while the same click works in the dev server.
 * Reproduced on vinext 1.0.0-beta.2 and 1.0.0-beta.6 (with
 * @vitejs/plugin-rsc 0.5.34), so upgrading is not a fix.
 *
 * A normal anchor does a full page load. For a content site that is a fine
 * trade — the pages are server-rendered and fast — and it removes a whole
 * class of hydration-dependent failure. It also matches the brief's
 * "minimal client JavaScript" requirement (section 28).
 *
 * If vinext fixes client navigation, swapping this back is a one-file change.
 */
export function Link({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}
