/// <reference types="astro/client" />

// locals shape provided by @astrojs/cloudflare v14: the execution context
// lives on cfContext; bindings come from `import { env } from
// "cloudflare:workers"`, not from locals.
declare namespace App {
  interface Locals {
    cfContext: ExecutionContext;
  }
}
