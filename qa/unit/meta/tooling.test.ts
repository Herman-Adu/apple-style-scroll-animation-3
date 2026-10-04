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

describe("tests do not depend on the working directory", () => {
  // Editors start Vitest from the config folder or a package folder, so
  // process.cwd() is not the repo root. Tests resolve it through qa/config/repo-root.
  const testFiles = ["qa/unit", "qa/integration"]
    .flatMap((dir) =>
      readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" }).map(
        (file) => `${dir}/${file.replace(/\\/g, "/")}`,
      ),
    )
    .filter(
      (file) =>
        file.endsWith(".test.ts") && !file.endsWith("meta/tooling.test.ts"),
    );

  it("has a shared repo-root helper", () => {
    expect(existsSync(join(ROOT, "qa/config/repo-root.ts"))).toBe(true);
  });

  it.each(testFiles)(
    "%s does not use process.cwd() as the repo root",
    (file) => {
      expect(readFileSync(join(ROOT, file), "utf8")).not.toMatch(
        /process\.cwd\(\)/,
      );
    },
  );

  it.each(testFiles)("%s does not copy the package.json walk-up", (file) => {
    expect(readFileSync(join(ROOT, file), "utf8")).not.toMatch(
      /existsSync\(join\(repoRoot, "package\.json"\)\)/,
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
