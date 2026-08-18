/**
 * Do-not-scan list (docs/specs/instant-scan.md §6). Checked before any
 * network request. Matches the domain itself and any subdomain of an entry.
 *
 * Additions go through a normal PR so every entry has history. The removal
 * request route for domain owners is me@onduu.ke (to be published on the
 * scan page at launch).
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
