import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { measure } from "@/scripts/lib/arch-audit-metrics.mjs";

const ROOT = join(__dirname, "../../..");
const SOURCE_DIRS = ["app", "components", "features", "hooks", "lib"];

function resolveRelativePosix(fromPath: string, specifier: string): string {
  const stack = fromPath.replace(/\\/g, "/").split("/");
  stack.pop();
  for (const part of specifier.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      yield full;
  }
}

const records = SOURCE_DIRS.flatMap((dir) => [...walk(join(ROOT, dir))]).map(
  (full) => ({
    path: relative(ROOT, full),
    text: readFileSync(full, "utf8"),
  }),
);
const metrics = measure(records);

describe("R3 slice boundaries", () => {
  it("lib/ never imports a feature slice", () => {
    const offenders = records
      .filter((r) => {
        if (!r.path.startsWith("lib/")) return false;
        if (/from\s+["']@\/features/.test(r.text)) return true;
        const relativeSpecs = [
          ...r.text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g),
        ].map((match) => match[1]);
        return relativeSpecs.some((spec) =>
          resolveRelativePosix(r.path, spec).startsWith("features/"),
        );
      })
      .map((r) => r.path);
    expect(offenders).toEqual([]);
    expect(metrics.libToFeatures).toBe(0);
  });

  it("other code reaches a slice only through its index, server or actions entry", () => {
    expect(metrics.deepImports).toBe(0);
  });

  it("domain folders have left lib/", () => {
    for (const dir of [
      "lib/orders",
      "lib/catalog",
      "lib/offers",
      "lib/contact",
    ]) {
      expect(existsSync(join(ROOT, dir)), dir).toBe(false);
    }
  });

  it("checkout finalize is split into steps under 300 lines each", () => {
    const finalize = records.filter((r) =>
      r.path
        .replace(/\\/g, "/")
        .startsWith("features/orders/lib/data/finalize/"),
    );
    expect(finalize.length).toBeGreaterThan(1);
    for (const r of finalize)
      expect(r.text.split("\n").length, r.path).toBeLessThanOrEqual(300);
  });

  it("lint bans deep imports into another slice", () => {
    const config = readFileSync(join(ROOT, "eslint.config.mjs"), "utf8");
    expect(config).toMatch(/no-restricted-imports/);
  });
});
