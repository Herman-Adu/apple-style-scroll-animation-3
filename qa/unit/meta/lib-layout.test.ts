import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * R7: every `features/<slice>/lib/` is split into actions / data / domain / adapters.
 * See `.agents/skills/feature-slices/SKILL.md` and `scripts/check-feature-lib-structure.mjs`.
 */
const LIB_FOLDERS = new Set(["actions", "data", "domain", "adapters"]);

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
      expect(unexpectedFolders(slice)).toEqual([]);
    },
  );

  it.each(slicesWithLib)("%s lib/ has no loose files at its root", (slice) => {
    expect(looseFiles(slice)).toEqual([]);
  });
});
