// A real SQLite database standing in for D1's throttle tables.
//
// The hand-written stubs these replaced modelled the old
// SELECT-then-UPDATE limiter, so when that became a single atomic upsert
// (22 Aug 2026, security review) every one of them broke — and each had
// only ever confirmed the behaviour its author already assumed. node:sqlite
// is the engine D1 runs, so upsert and RETURNING semantics here are the
// real ones rather than a guess about them.
// node:sqlite needs --experimental-sqlite on Node 22, which CI runs; the
// flag is accepted and ignored on newer versions, so package.json passes
// it unconditionally rather than pinning everyone to Node 24.
import { DatabaseSync } from "node:sqlite";

/** An in-memory D1-shaped handle over one or more throttle tables. */
export function throttleDb(...tables) {
  const db = new DatabaseSync(":memory:");
  for (const t of tables.length ? tables : ["scan_throttle"]) {
    db.exec(
      `CREATE TABLE ${t} (client_key TEXT PRIMARY KEY, window_start TEXT NOT NULL, count INTEGER NOT NULL)`,
    );
  }
  return {
    raw: db,
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        bind: (...args) => ({
          async first() {
            return stmt.get(...args) ?? null;
          },
          async run() {
            stmt.run(...args);
            return { meta: { changes: 1 } };
          },
        }),
      };
    },
  };
}

/** A handle whose every statement throws, for the fail-open paths. */
export function brokenDb(message = "no such table: scan_throttle") {
  return {
    prepare() {
      throw new Error(message);
    },
  };
}
