// Boots the built Astro Worker in workerd via `wrangler dev` and exposes it
// over HTTP for the tests. The previous vinext harness imported the built
// worker into Node and injected stub env/ctx objects; the Astro entry imports
// "cloudflare:workers", which only exists inside workerd, so the tests now
// exercise the real runtime instead — one spawned server per test process.
//
// The child logs to a file and is unref()ed: piped stdio would hold the node
// --test event loop open and hang the run after the last test finishes.
import { spawn } from "node:child_process";
import { openSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

let baseUrl = null;
let proc = null;
let logPath = null;

export async function startWorker(extraArgs = []) {
  if (baseUrl) return baseUrl;

  const root = fileURLToPath(new URL("../..", import.meta.url));
  // Several test files run in parallel, each with its own wrangler dev.
  // Give every instance a private port and a private state directory, or the
  // concurrent local-D1/registry state makes spawns die instantly; retry the
  // spawn a few times for the races that remain.
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const port = 21000 + Math.floor(Math.random() * 20000);
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
    process.on("exit", () => {
      try {
        current.kill("SIGTERM");
      } catch {
        /* already gone */
      }
    });

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline && !exited) {
      const res = await fetch(`http://127.0.0.1:${port}/robots.txt`).catch(() => null);
      if (res?.ok) {
        baseUrl = `http://127.0.0.1:${port}`;
        return baseUrl;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    proc.kill("SIGTERM");
    lastError = new Error(
      `wrangler dev did not become ready:\n${readFileSync(logPath, "utf8").slice(-2000)}`,
    );
  }
  throw lastError;
}

export async function fetchPath(path, accept = "text/html", init = {}) {
  const base = await startWorker();
  const headers = { accept, ...(init.headers ?? {}) };
  return fetch(`${base}${path}`, { redirect: "manual", ...init, headers });
}
