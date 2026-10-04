import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * R7: every `features/<slice>/lib/` is split into actions / data / domain / adapters.
 * See `.agents/skills/feature-slices/SKILL.md` and `scripts/check-feature-lib-structure.mjs`.
 *
 * The two allowlists below are the slices not migrated yet. They only ever shrink:
 * an entry that no longer exists fails the "stale" tests, so finished work is removed here.
 */
const LIB_FOLDERS = new Set(["actions", "data", "domain", "adapters"]);

/** Folders outside the four-folder split, per slice. */
const UNMIGRATED_FOLDERS: Record<string, string[]> = {
  email: ["blocks", "content", "sending"],
};

/** Files loose at the root of `lib/`, per slice. */
const UNMIGRATED_LOOSE_FILES: Record<string, string[]> = {
  docs: ["api.ts", "doc.ts", "freshness.ts", "schema.ts", "strapi-source.ts"],
  products: [
    "api.ts",
    "data.ts",
    "mappers.ts",
    "product.ts",
    "schema.ts",
    "structured-data.ts",
  ],
};

const libDir = (slice: string) => join(REPO_ROOT, "features", slice, "lib");

const slicesWithLib = readdirSync(join(REPO_ROOT, "features"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory() && existsSync(libDir(entry.name)))
  .map((entry) => entry.name);

const libEntries = (slice: string) =>
  readdirSync(libDir(slice), { withFileTypes: true });

const unexpectedFolders = (slice: string) =>
  libEntries(slice)
    .filter((entry) => entry.isDirectory() && !LIB_FOLDERS.has(entry.name))
    .map((entry) => entry.name);

const looseFiles = (slice: string) =>
  libEntries(slice)
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

describe("feature lib layout (actions / data / domain / adapters)", () => {
  it.each(slicesWithLib)(
    "%s lib/ has no folders outside the four-folder split",
    (slice) => {
      const allowed = UNMIGRATED_FOLDERS[slice] ?? [];
      expect(
        unexpectedFolders(slice).filter((name) => !allowed.includes(name)),
      ).toEqual([]);
    },
  );

  it.each(slicesWithLib)("%s lib/ has no loose files at its root", (slice) => {
    const allowed = UNMIGRATED_LOOSE_FILES[slice] ?? [];
    expect(looseFiles(slice).filter((name) => !allowed.includes(name))).toEqual(
      [],
    );
  });

  it.each(Object.keys(UNMIGRATED_FOLDERS))(
    "%s: allowlisted folders still exist (not stale)",
    (slice) => {
      expect(
        UNMIGRATED_FOLDERS[slice].filter(
          (name) => !unexpectedFolders(slice).includes(name),
        ),
      ).toEqual([]);
    },
  );

  it.each(Object.keys(UNMIGRATED_LOOSE_FILES))(
    "%s: allowlisted loose files still exist (not stale)",
    (slice) => {
      expect(
        UNMIGRATED_LOOSE_FILES[slice].filter(
          (name) => !looseFiles(slice).includes(name),
        ),
      ).toEqual([]);
    },
  );
});
