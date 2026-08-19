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
import { spawn } from "node:child_process";
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

async function spawnWorker(extraArgs) {
  const root = fileURLToPath(new URL("../..", import.meta.url));
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const port = await reservePort();
    const stateDir = mkdtempSync(join(tmpdir(), "onduu-test-"));
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
        const res = await fetch(`http://127.0.0.1:${port}/robots.txt`).catch(() => null);
        if (res?.ok && !exited) return `http://127.0.0.1:${port}`;
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

export async function startWorker(extraArgs = []) {
  if (baseUrl) return baseUrl;
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

export async function fetchPath(path, accept = "text/html", init = {}) {
  const base = await startWorker();
  const headers = { accept, ...(init.headers ?? {}) };
  return fetch(`${base}${path}`, { redirect: "manual", ...init, headers });
}
