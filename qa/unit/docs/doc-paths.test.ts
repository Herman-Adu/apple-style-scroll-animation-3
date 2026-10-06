import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import { docText } from "@/features/docs/lib/domain/freshness";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * Handoff docs go stale when files move (R5-R9 reshaped `lib/` and every slice).
 * This guard makes any `features/…`, `lib/…`, `components/…`, `app/…` or `qa/…`
 * source path quoted in a doc fail the build once the file is gone.
 *
 * `architecture-health.md` is a dated W3 snapshot of the code before the R-sprints,
 * so it is allowed to name paths that no longer exist.
 */
const HISTORICAL_DOCS = new Set(["docs/architecture-health.md"]);

// The lookbehind skips paths that belong to another project, e.g. Strapi's `src/components/…`.
const PATH_PATTERN =
  /(?<![\w/.-])(?:features|lib|components|app|qa|hooks|scripts)\/[A-Za-z0-9_\-./[\]()]+\.(?:tsx?|mjs|md|json)\b/g;

const pathsIn = (text: string) =>
  [...text.matchAll(PATH_PATTERN)]
    .map((match) => match[0])
    .filter((path) => !path.includes("*"));

const exists = (path: string) => existsSync(join(REPO_ROOT, path));

const markdownDocs = [
  "README.md",
  "SHOWCASE.md",
  ...readdirSync(join(REPO_ROOT, "docs"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => `docs/${file}`),
].filter((file) => !HISTORICAL_DOCS.has(file));

describe("docs name only files that exist", () => {
  it.each(markdownDocs)("%s", (file) => {
    const text = readFileSync(join(REPO_ROOT, file), "utf8");
    expect([...new Set(pathsIn(text))].filter((p) => !exists(p))).toEqual([]);
  });

  it("in-app docs content", () => {
    const missing = docs.flatMap((doc) =>
      [...new Set(pathsIn(docText(doc)))]
        .filter((path) => !exists(path))
        .map((path) => `${doc.slug} -> ${path}`),
    );
    expect(missing).toEqual([]);
  });
});
