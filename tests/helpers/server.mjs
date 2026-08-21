// Boots the built Astro Worker in workerd via `wrangler dev` and exposes it
// over HTTP for the tests. The previous vinext harness imported the built
// worker into Node and injected stub env/ctx objects; the Astro entry imports
// "cloudflare:workers", which only exists inside workerd, so the tests now
// exercise the real runtime instead — one spawned server per test process.
//
// The child logs to a file and is unref()ed: piped stdio would hold the node
// --test event loop open and hang the run after the last test finishes.
//
// Two races used to make this intermittently wrong (seen 19 Aug 2026 on
// "robots disallows the dashboard" and on the SCAN_ENABLED launch-gate test,
// each failing once and passing on re-run):
//
//   1. The port was picked at random with no check that it was free. Test
//      files run in parallel, so two processes could choose the same port.
//   2. Readiness was "GET /robots.txt returned ok" on that port, from ANY
//      server. The process that lost the bind could therefore adopt the
//      winner's worker — which is how a file that spawns with
//      `--var SCAN_ENABLED:false` ended up asserting against a worker
//      started without it, and saw /api/scan answer instead of 404.
//
// Now the port is reserved by binding to :0 and reading back the assigned
// number, and readiness additionally requires this child's own log to name
// that port, which only happens when this child is the one serving it.
import { spawn, spawnSync } from "node:child_process";
import { openSync, readFileSync, mkdtempSync, existsSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

let baseUrl = null;
let starting = null;
let proc = null;
let logPath = null;

/** Ask the OS for a free port, then release it for wrangler to claim. */
function reservePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const readLog = () => (logPath && existsSync(logPath) ? readFileSync(logPath, "utf8") : "");

// Set by startWorkerWithoutSchema(): one spawn with no migrations applied,
// for tests of how the site behaves when a table is missing.
let skipMigrations = false;

async function spawnWorker(extraArgs) {
  const root = fileURLToPath(new URL("../..", import.meta.url));
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const port = await reservePort();
    const stateDir = mkdtempSync(join(tmpdir(), "onduu-test-"));
    // The Worker gets the real schema. Until 21 Aug 2026 the test database
    // was empty — every table missing — so a route that touched D1 could
    // only be exercised with an in-memory stand-in, and the first end-to-end
    // test of one (the do-not-scan request) met a 500 from a rate-limit
    // query against a table that did not exist. Applying the migrations
    // here means "through the real built Worker" includes the database.
    const applied = skipMigrations ? { status: 0 } : spawnSync(
      "npx",
      ["wrangler", "d1", "migrations", "apply", "onduu-leads", "--local", "-c", "dist/server/wrangler.json", "--persist-to", join(stateDir, "state")],
      { cwd: root, encoding: "utf8" },
    );
    if (applied.status !== 0) {
      throw new Error(`migrations did not apply to the test database:\n${applied.stderr || applied.stdout}`);
    }
    logPath = join(stateDir, "wrangler.log");
    const logFd = openSync(logPath, "w");
    proc = spawn(
      "npx",
      [
        "wrangler",
        "dev",
        "-c",
        "dist/server/wrangler.json",
        "--port",
        String(port),
        "--inspector-port",
        "0",
        "--persist-to",
        join(stateDir, "state"),
        ...extraArgs,
      ],
      { cwd: root, stdio: ["ignore", logFd, logFd] },
    );
    proc.unref();
    let exited = false;
    proc.on("exit", () => (exited = true));
    const current = proc;
    const cleanup = () => {
      try {
        current.kill("SIGTERM");
      } catch {
        /* already gone */
      }
    };
    process.once("exit", cleanup);

    const deadline = Date.now() + 60_000;
    let reason = "timed out before responding";
    while (Date.now() < deadline && !exited) {
      const log = readLog();
      // Someone else owns the port: give up on it immediately rather than
      // waiting out the deadline against a server that is not ours.
      if (/EADDRINUSE|address already in use/i.test(log)) {
        reason = "port was taken";
        break;
      }
      // Our own child must claim this port before we trust anything on it.
      if (log.includes(`:${port}`)) {
        // Two probes, spaced apart. One success is not enough: wrangler can
        // answer while still settling, and a request landing in that window
        // came back as a 500 rather than the routed response (seen 19 Aug
        // 2026 on the SCAN_ENABLED gate test, which asserts a 404).
        const ok = async () => (await fetch(`http://127.0.0.1:${port}/robots.txt`).catch(() => null))?.ok;
        if (await ok()) {
          await new Promise((r) => setTimeout(r, 250));
          if ((await ok()) && !exited) return `http://127.0.0.1:${port}`;
        }
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    cleanup();
    process.off("exit", cleanup);
    lastError = new Error(
      `wrangler dev did not become ready (${exited ? "process exited" : reason}):\n` +
        `${readLog().slice(-2000)}`,
    );
  }
  throw lastError;
}

let lastExtraArgs = [];
let restarting = null;

/** The wrangler child can die mid-run (seen 20 Aug 2026: every request to
 *  /api/scan failing at the TCP level after a first drop). A dead server
 *  cannot be retried against — respawn it once, shared across concurrent
 *  callers, with the same configuration it was started with. */
export async function restartWorker() {
  if (!restarting) {
    console.error("[test-harness] worker unreachable — respawning");
    restarting = (async () => {
      try {
        proc?.kill("SIGTERM");
      } catch {
        /* already gone */
      }
      baseUrl = null;
      starting = null;
      const url = await startWorker(lastExtraArgs);
      restarting = null;
      return url;
    })().catch((err) => {
      restarting = null;
      throw err;
    });
  }
  return restarting;
}

/**
 * A Worker whose database has no tables at all — the state production is in
 * between a deploy and `wrangler d1 migrations apply`. Tears down the shared
 * Worker, so call it from the LAST test in a file: everything after it in
 * the same process sees the bare database too.
 */
export async function startWorkerWithoutSchema() {
  try {
    proc?.kill("SIGTERM");
  } catch {
    /* already gone */
  }
  baseUrl = null;
  starting = null;
  skipMigrations = true;
  try {
    return await startWorker(lastExtraArgs);
  } finally {
    skipMigrations = false;
  }
}

export async function startWorker(extraArgs = []) {
  if (baseUrl) return baseUrl;
  if (extraArgs.length) lastExtraArgs = extraArgs;
  // Concurrent callers in one process must share a single spawn, or a
  // fetchPath() racing a startWorker([...]) can start a second, differently
  // configured worker and overwrite baseUrl with it.
  if (!starting) {
    starting = spawnWorker(extraArgs).then(
      (url) => (baseUrl = url),
      (err) => {
        starting = null;
        throw err;
      },
    );
  }
  return starting;
}

// Miniflare's proxy occasionally drops an established connection under
// parallel test load, surfacing either as a rejected fetch (ECONNRESET) or
// as a 500 whose body is "Network connection lost" from its entry worker
// (seen three times on 20 Aug 2026, each passing on re-run). That is
// transport noise, not a test outcome — so it is retried, LOUDLY, a bounded
// number of times. A real response, any status, is never retried: an
// assertion failure must stay a failure.
const TRANSPORT_NOISE = /Network connection lost|entry\.worker\.js/;

export async function fetchPath(path, accept = "text/html", init = {}) {
  const headers = { accept, ...(init.headers ?? {}) };
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const base = await startWorker();
    let res;
    try {
      res = await fetch(`${base}${path}`, { redirect: "manual", ...init, headers });
    } catch (err) {
      lastErr = err;
      console.error(`[test-harness] fetch ${path} dropped (attempt ${attempt}/3): ${err.message}`);
      if (attempt >= 2) {
        await restartWorker();
      } else {
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
      continue;
    }
    if (res.status >= 500) {
      const body = await res.clone().text().catch(() => "");
      if (TRANSPORT_NOISE.test(body)) {
        console.error(`[test-harness] miniflare dropped ${path} (attempt ${attempt}/3)`);
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
    }
    return res;
  }
  throw lastErr ?? new Error(`fetchPath(${path}): transport failed on all attempts`);
}
