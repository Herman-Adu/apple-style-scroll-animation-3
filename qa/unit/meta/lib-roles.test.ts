import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * R7 roles. What each folder of `features/<slice>/lib/` means
 * (full definition in `.agents/skills/feature-slices/SKILL.md`):
 *
 *  - domain/    pure types, schemas, rules. No I/O, env, framework or SDK.
 *  - data/      where data comes from: DB repos, CMS loaders, seed/fallback datasets, `api.ts`.
 *  - adapters/  boundary glue: SDK wrappers, CMS payload mappers, Next.js APIs, providers.
 *  - actions/   the only place `"use server"` files live.
 *
 * The slice-root `actions.ts` is a public entry: re-exports only, no logic.
 */
const FEATURES = join(REPO_ROOT, "features");

const slices = readdirSync(FEATURES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : [join(dir, entry.name)],
      )
    : [];

const posix = (file: string) => relative(REPO_ROOT, file).replace(/\\/g, "/");
const read = (file: string) => readFileSync(file, "utf8");
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const isCode = (file: string) => /\.(ts|tsx)$/.test(file);
const USE_SERVER = /^\s*["']use server["']/m;

describe("slice-root actions.ts is a public entry, not an implementation", () => {
  const withActions = slices.filter((slice) =>
    existsSync(join(FEATURES, slice, "actions.ts")),
  );

  it.each(withActions)("%s/actions.ts only re-exports", (slice) => {
    const source = stripComments(read(join(FEATURES, slice, "actions.ts")));
    expect(source).not.toMatch(USE_SERVER);
    const residue = source
      .replace(
        /export\s+(type\s+)?(\*(\s+as\s+\w+)?|\{[^}]*\})\s+from\s+["'][^"']+["']/g,
        "",
      )
      .replace(/[;\s]/g, "");
    expect(residue).toBe("");
  });
});

describe('"use server" files live in lib/actions/', () => {
  it("has no server action file outside features/*/lib/actions/", () => {
    const stray = walk(FEATURES)
      .filter(isCode)
      .filter((file) => USE_SERVER.test(read(file)))
      .map(posix)
      .filter((file) => !/^features\/[^/]+\/lib\/actions\//.test(file));
    expect(stray).toEqual([]);
  });
});

describe("domain/ is pure", () => {
  const domainFiles = slices
    .flatMap((slice) => walk(join(FEATURES, slice, "lib", "domain")))
    .filter(isCode);

  const IMPURE: Array<[string, RegExp]> = [
    ["server-only", /\bimport\s+["']server-only["']/],
    ["next/*", /from\s+["']next\//],
    ["prisma", /from\s+["']@prisma\/client["']|from\s+["']@\/lib\/db/],
    ["stripe", /from\s+["']stripe["']|from\s+["']@\/lib\/stripe/],
    ["env", /from\s+["']@\/lib\/env["']|\bprocess\.env\b/],
    ["strapi client", /from\s+["']@\/lib\/strapi\/client["']/],
    ["fetch", /\bfetch\s*\(/],
    ["sibling folder", /from\s+["'](\.\.\/)+(actions|data|adapters)(\/|["'])/],
  ];

  it.each(domainFiles.map(posix))(
    "%s has no I/O, framework or sibling-folder import",
    (file) => {
      const source = stripComments(read(join(REPO_ROOT, file)));
      const found = IMPURE.filter(([, pattern]) => pattern.test(source)).map(
        ([name]) => name,
      );
      expect(found).toEqual([]);
    },
  );
});
