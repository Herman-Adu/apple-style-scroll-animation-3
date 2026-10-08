import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");

const SLICE_ENTRY_FILES = new Set(["index.ts", "server.ts"]);
const SLICE_FOLDERS = new Set(["components", "hooks", "lib", "content"]);
const LIB_ROOT_FILES = new Set([
  "env.ts",
  "format.ts",
  "nav.ts",
  "types.ts",
  "utils.ts",
]);
// `facts` holds the measured-numbers schema and the committed snapshot. It
// lives here, not in a slice, because both showcase and docs read it and
// shared code may never import a feature.
const LIB_FOLDERS = new Set(["auth", "data", "db", "facts", "seo", "strapi", "stripe"]);

const entries = (dir: string) =>
  readdirSync(join(ROOT, dir), { withFileTypes: true });
const slices = entries("features")
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe("feature slice layout", () => {
  it.each(slices)("%s has an index.ts public entry", (slice) => {
    expect(existsSync(join(ROOT, "features", slice, "index.ts"))).toBe(true);
  });

  it.each(slices)("%s keeps only entry files in its root", (slice) => {
    const strayFiles = entries(`features/${slice}`)
      .filter((entry) => entry.isFile() && !SLICE_ENTRY_FILES.has(entry.name))
      .map((entry) => entry.name);
    expect(strayFiles).toEqual([]);
  });

  it.each(slices)(
    "%s only uses components/, hooks/, lib/ and content/ folders",
    (slice) => {
      const strayFolders = entries(`features/${slice}`)
        .filter(
          (entry) => entry.isDirectory() && !SLICE_FOLDERS.has(entry.name),
        )
        .map((entry) => entry.name);
      expect(strayFolders).toEqual([]);
    },
  );
});

describe("root lib holds shared infrastructure only", () => {
  it("has no domain folders", () => {
    const strayFolders = entries("lib")
      .filter((entry) => entry.isDirectory() && !LIB_FOLDERS.has(entry.name))
      .map((entry) => entry.name);
    expect(strayFolders).toEqual([]);
  });

  it("keeps only small cross-cutting files at its root", () => {
    const strayFiles = entries("lib")
      .filter((entry) => entry.isFile() && !LIB_ROOT_FILES.has(entry.name))
      .map((entry) => entry.name);
    expect(strayFiles).toEqual([]);
  });

  it("has no review data (it lives in features/reviews)", () => {
    expect(existsSync(join(ROOT, "lib/data/reviews.ts"))).toBe(false);
  });
});
