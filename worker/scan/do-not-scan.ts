/**
 * Do-not-scan list (docs/specs/instant-scan.md §6). Checked before any
 * network request. Matches the domain itself and any subdomain of an entry.
 *
 * Additions go through a normal PR so every entry has history. Policy (owner,
 * 18 Aug 2026): a domain owner who opts out has any stored result for their
 * domain deleted and the domain blocked so it is not scanned again. Runtime
 * opt-outs land in the scan_blocklist table, not here — since 21 Aug 2026
 * by self-service at /do-not-scan (worker/do-not-scan.ts), confirmed by
 * email at the domain. The route is published on the /scan page and in the
 * privacy notice.
 */
export const DO_NOT_SCAN: ReadonlySet<string> = new Set<string>([
  // Intentionally empty at launch; entries are added on request or owner
  // decision. Example: "example.go.ke".
]);

export function isBlocked(domain: string, list: ReadonlySet<string> = DO_NOT_SCAN): boolean {
  const labels = domain.toLowerCase().split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    if (list.has(labels.slice(i).join("."))) return true;
  }
  return false;
}
