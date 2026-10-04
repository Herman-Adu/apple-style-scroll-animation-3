import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");

const scriptFiles = (dir: string): string[] =>
  readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? scriptFiles(`${dir}/${entry.name}`)
      : /\.mjs$/.test(entry.name)
        ? [`${dir}/${entry.name}`]
        : [],
  );

describe("test runner discovery", () => {
  it("has a root vitest config so editors find the qa config (aliases, stubs, setup)", () => {
    const rootConfigs = [
      "vitest.config.mts",
      "vitest.config.ts",
      "vitest.config.mjs",
    ];
    expect(rootConfigs.some((name) => existsSync(join(ROOT, name)))).toBe(true);
  });

  it("root vitest config re-exports the qa config instead of duplicating it", () => {
    const rootConfig = [
      "vitest.config.mts",
      "vitest.config.ts",
      "vitest.config.mjs",
    ].find((name) => existsSync(join(ROOT, name)));
    expect(rootConfig).toBeDefined();
    expect(readFileSync(join(ROOT, rootConfig!), "utf8")).toContain(
      "qa/config/vitest.config",
    );
  });
});

describe("scripts are cross-platform", () => {
  it.each(scriptFiles("scripts"))(
    "%s does not build paths from URL.pathname",
    (file) => {
      // `new URL(..., import.meta.url).pathname` yields "/C:/..." on Windows. Use fileURLToPath.
      expect(readFileSync(join(ROOT, file), "utf8")).not.toMatch(
        /new URL\([^)]*import\.meta\.url\)\.pathname/,
      );
    },
  );
});
