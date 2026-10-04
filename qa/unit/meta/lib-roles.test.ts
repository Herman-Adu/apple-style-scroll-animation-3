import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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
 * There is no slice-root `actions.ts`: a slice's server actions are exported from its
 * `index.ts` (a "use server" file is an RPC boundary, so client bundles get stubs).
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

describe("server actions are exposed through the slice index.ts", () => {
  it("no slice has a root actions.ts", () => {
    const stray = slices.filter((slice) =>
      existsSync(join(FEATURES, slice, "actions.ts")),
    );
    expect(stray).toEqual([]);
  });

  it("nothing imports a slice's /actions entry", () => {
    const importers = walk(FEATURES)
      .concat(walk(join(REPO_ROOT, "app")), walk(join(REPO_ROOT, "components")))
      .filter(isCode)
      .filter((file) => /@\/features\/[^/"']+\/actions["']/.test(read(file)))
      .map(posix);
    expect(importers).toEqual([]);
  });

  it.each(
    slices.filter((slice) => existsSync(join(FEATURES, slice, "index.ts"))),
  )('%s/index.ts has no "use server" directive', (slice) => {
    expect(read(join(FEATURES, slice, "index.ts"))).not.toMatch(USE_SERVER);
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
  /** Barrels that still re-export from outside domain/. Shrinks to empty in R7c. */
  const DOMAIN_REEXPORTS = ["features/email/lib/domain/blocks/index.ts"];
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

  it.each(
    domainFiles.map(posix).filter((file) => !DOMAIN_REEXPORTS.includes(file)),
  )("%s never imports a relative path outside domain/", (file) => {
    const abs = join(REPO_ROOT, file);
    const domainRoot = file.slice(
      0,
      file.indexOf("/domain/") + "/domain".length,
    );
    const source = stripComments(read(abs));
    const escaping = [...source.matchAll(/from\s+["'](\.[^"']*)["']/g)]
      .map((match) => match[1])
      .filter((spec) => {
        const target = posix(resolve(dirname(abs), spec));
        return target !== domainRoot && !target.startsWith(`${domainRoot}/`);
      });
    expect(escaping).toEqual([]);
  });
});
