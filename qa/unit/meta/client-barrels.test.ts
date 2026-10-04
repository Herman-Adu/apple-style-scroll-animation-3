import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A slice `index.ts` is imported by client components, so nothing it reaches may
 * pull server-only code into a browser bundle.
 *
 * The walk STOPS at a `"use server"` file: an RPC boundary. A client bundle gets a
 * stub per exported action, never the file's code, so what that file imports
 * (Prisma, Stripe, `server-only`) stays on the server. Everything else must be
 * client-safe. Server-only loaders belong in `server.ts`, which is not covered here.
 */
const ROOT = join(__dirname, "../../..");
const STRIPE_SERVER = "lib/stripe/server.ts";
const USE_SERVER = /^\s*["']use server["']/;
const SERVER_ONLY_SPECIFIERS = new Set([
  "server-only",
  "next/headers",
  "stripe",
  "@prisma/client",
]);
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g;

function resolveSpecifier(fromFile: string, spec: string): string | null {
  const base = spec.startsWith("@/")
    ? join(ROOT, spec.slice(2))
    : spec.startsWith(".")
      ? join(dirname(fromFile), spec)
      : null;
  if (!base) return null;
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

interface Reach {
  files: Set<string>;
  serverOnly: Set<string>;
}

function reachableFrom(entry: string): Reach {
  const seen = new Set<string>();
  const serverOnly = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    if (USE_SERVER.test(source.replace(/^\uFEFF/, ""))) continue;
    for (const match of source.matchAll(IMPORT_RE)) {
      const line = source.slice(
        source.lastIndexOf("\n", match.index) + 1,
        match.index + match[0].length,
      );
      if (/^\s*(import|export)\s+type\b/.test(line)) continue;
      const spec = match[1] ?? match[2];
      if (SERVER_ONLY_SPECIFIERS.has(spec) || /^@\/lib\/db(\/|$)/.test(spec)) {
        serverOnly.add(
          `${relative(ROOT, file).replace(/\\/g, "/")} -> ${spec}`,
        );
        continue;
      }
      const next = resolveSpecifier(file, spec);
      if (next) queue.push(next);
    }
  }
  return {
    files: new Set([...seen].map((f) => relative(ROOT, f).replace(/\\/g, "/"))),
    serverOnly,
  };
}

const sliceEntries = readdirSync(join(ROOT, "features"), {
  withFileTypes: true,
})
  .filter(
    (d) =>
      d.isDirectory() && existsSync(join(ROOT, "features", d.name, "index.ts")),
  )
  .map((d) => `features/${d.name}/index.ts`);

describe("slice index entries stay client-safe", () => {
  it.each(sliceEntries)("%s never loads the Stripe server client", (entry) => {
    expect(reachableFrom(join(ROOT, entry)).files.has(STRIPE_SERVER)).toBe(
      false,
    );
  });

  it.each(sliceEntries)(
    "%s never reaches server-only code outside a use-server file",
    (entry) => {
      expect([...reachableFrom(join(ROOT, entry)).serverOnly]).toEqual([]);
    },
  );
});
