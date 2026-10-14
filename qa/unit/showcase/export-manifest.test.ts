import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { factsSchema, type Facts } from "@/features/showcase/lib/domain/facts"
import {
  compareExports,
  exportFactKeys,
  exportManifestRecord,
  exportPlanItems,
  exportSlides,
  factBoundSlides,
  mergeExportManifest,
  staleExports,
  type ExportManifest,
} from "@/features/showcase/lib/domain/export-manifest"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * The other half of the facts guard.
 *
 * `qa/smoke/facts-freshness.spec.ts` recounts the snapshot, so a wrong number
 * cannot be committed. Nothing checked the committed exports against it, and a
 * PNG keeps whatever number was true the day it was rendered: in S48 five PDFs
 * shipped with the wrong figure drawn on them, and by S64 eight files were
 * quoting the Oct 9 snapshot under a column headed TODAY.
 *
 * These are the pure rules. The comparison against the real tree lives in
 * `qa/smoke/export-freshness.spec.ts`, and it lives there rather than here
 * because a red unit test aborts `pnpm facts` (`scripts/facts.mjs:38`), which
 * is the first half of `pnpm showcase:assets` - the command that repairs it.
 * A unit guard over the real files would lock the door on its own key.
 */
const FACTS: Facts = factsSchema.parse({
  generatedAt: "2026-10-14T00:00:00.000Z",
  tests: { unit: 10, integration: 2, smoke: 3, axe: 1, seo: 1, total: 17 },
  coverage: { lines: 50.5, branches: 40.25 },
  arch: { deepImports: 0, libToFeatures: 0, anyTypes: 0, largeFiles: 21, useEffect: 32 },
  docs: { pages: 3 },
  routes: { pages: 4 },
  repo: { mergedPrs: 5, latestPr: 6 },
})

/**
 * A manifest describing the whole plan as rendered from `FACTS`.
 *
 * Built here, in the test, on purpose: shipping a "rebuild the whole manifest
 * from the current facts" helper would hand anyone a way to turn the guard
 * green without re-rendering a single file, which is the guard agreeing with
 * the bug. The export harness only ever records a file it just wrote.
 */
const freshManifest = (): ExportManifest => ({
  exports: Object.fromEntries(exportPlanItems().map((item) => [item.file, exportManifestRecord(item.asset, FACTS)])),
})

const PROOF = "/showcase/social/recruiter/proof.png"
const CASE_STUDY = "/showcase/social/email-case-study/carousel.pdf"

const problemsFor = (manifest: ExportManifest, file: string) =>
  staleExports(manifest, FACTS).find((stale) => stale.file === file)?.problems ?? []

describe("which slides an export draws", () => {
  it("resolves a single infographic to itself", () => {
    expect(exportSlides("infographic-recruiter-proof").map((s) => s.id)).toEqual(["infographic-recruiter-proof"])
  })

  it("resolves a single social asset to itself", () => {
    expect(exportSlides("square-layers").map((s) => s.id)).toEqual(["square-layers"])
  })

  it("resolves a pack carousel to its slides in order", () => {
    expect(exportSlides("pack-engineer").map((s) => s.id)).toEqual([
      "infographic-engineer-architecture",
      "infographic-engineer-checkout",
      "infographic-engineer-restock",
      "infographic-engineer-theme",
      "infographic-engineer-tests",
      "infographic-engineer-coverage",
      "recruiter-cta",
    ])
  })

  it("resolves a brief to its slides", () => {
    expect(exportSlides("brief-business-case").map((s) => s.id)).toContain("infographic-recruiter-proof")
  })

  it("resolves the email case-study carousel to the unpacked carousel slides", () => {
    expect(exportSlides("carousel").map((s) => s.id)).toEqual([
      "carousel-cover",
      "carousel-products",
      "carousel-starters",
      "carousel-locks",
      "carousel-history",
      "carousel-flow",
      "carousel-layers",
      "carousel-cta",
    ])
  })

  it("resolves nothing for an asset that does not exist", () => {
    expect(exportSlides("not-an-asset")).toEqual([])
  })

  it("covers every item the export harness renders", () => {
    for (const item of exportPlanItems()) {
      expect(exportSlides(item.asset), item.asset).not.toEqual([])
    }
  })
})

describe("which facts an export draws", () => {
  it("reads them off the slide, whatever kind it is, in the order the schema lists them", () => {
    expect(exportFactKeys("infographic-recruiter-proof")).toEqual([
      "tests.total",
      "coverage.lines",
      "coverage.branches",
      "arch.deepImports",
    ])
  })

  it("unions the facts of every slide in a pack", () => {
    expect(exportFactKeys("pack-engineer")).toEqual([
      "tests.unit",
      "tests.integration",
      "tests.smoke",
      "tests.axe",
      "tests.seo",
      "coverage.lines",
      "coverage.branches",
    ])
  })

  it("draws no facts from a slide that states none", () => {
    expect(exportFactKeys("carousel")).toEqual([])
  })

  it("records the value of each fact the slide drew, and the snapshot it came from", () => {
    expect(exportManifestRecord("infographic-engineer-coverage", FACTS)).toEqual({
      renderedFrom: "2026-10-14T00:00:00.000Z",
      facts: { "coverage.lines": 50.5, "coverage.branches": 40.25 },
    })
  })

  it("names the fact-bound slides, so the count in docs/showcase-pipeline.md can be pinned", () => {
    // The sentence is true; this keeps it true. The repo has lost a true
    // sentence to a rewrite before, so the count is pinned rather than retyped.
    const doc = readFileSync(join(REPO_ROOT, "docs/showcase-pipeline.md"), "utf8")
    expect(factBoundSlides()).toEqual([
      "infographic-recruiter-proof",
      "infographic-engineer-tests",
      "infographic-engineer-coverage",
      "infographic-before-after",
      "infographic-bar-chart",
    ])
    expect(doc).toContain(`The ${["", "one", "two", "three", "four", "five"][factBoundSlides().length]} fact-bound slides`)
  })
})

describe("comparing the committed exports with the facts they draw", () => {
  it("compares every file the harness publishes, not only the fact-bound ones", () => {
    const compared = compareExports(freshManifest(), FACTS)
    expect(compared.map((row) => row.file).sort()).toEqual(exportPlanItems().map((item) => item.file).sort())
  })

  it("prints what it compared, per file, so the guard can be read", () => {
    const row = compareExports(freshManifest(), FACTS).find((r) => r.file === PROOF)
    expect(row?.compared).toEqual([
      { key: "tests.total", rendered: 17, current: 17 },
      { key: "coverage.lines", rendered: 50.5, current: 50.5 },
      { key: "coverage.branches", rendered: 40.25, current: 40.25 },
      { key: "arch.deepImports", rendered: 0, current: 0 },
    ])
  })

  it("finds nothing stale when every recorded number still holds", () => {
    expect(staleExports(freshManifest(), FACTS)).toEqual([])
  })

  it("names the file and the number when a fact has moved since the render", () => {
    const manifest = freshManifest()
    manifest.exports[PROOF].facts["tests.total"] = 11
    expect(problemsFor(manifest, PROOF)).toEqual(["tests.total was 11 when it was rendered, now 17"])
  })

  it("reports every fact that moved, not just the first", () => {
    const manifest = freshManifest()
    manifest.exports[PROOF].facts["tests.total"] = 11
    manifest.exports[PROOF].facts["coverage.lines"] = 1.5
    expect(problemsFor(manifest, PROOF)).toEqual([
      "tests.total was 11 when it was rendered, now 17",
      "coverage.lines was 1.5 when it was rendered, now 50.5",
    ])
  })

  it("flags a published file with no record of what it was rendered from", () => {
    const manifest = freshManifest()
    delete manifest.exports[PROOF]
    expect(problemsFor(manifest, PROOF)).toEqual(["no record of the facts it was rendered from"])
  })

  it("flags a record that is missing a fact the slide now draws", () => {
    const manifest = freshManifest()
    delete manifest.exports[PROOF].facts["tests.total"]
    expect(problemsFor(manifest, PROOF)).toEqual(["draws tests.total, which it was not rendered with"])
  })

  it("flags a record carrying a fact the slide no longer draws", () => {
    // The slide was edited after the file was rendered, so the committed image
    // is of an older slide. The facts still agree; the file is still stale.
    const manifest = freshManifest()
    manifest.exports[PROOF].facts["repo.mergedPrs"] = 5
    expect(problemsFor(manifest, PROOF)).toEqual(["was rendered with repo.mergedPrs, which it no longer draws"])
  })

  it("leaves a file that draws no facts alone, with no record to keep", () => {
    expect(freshManifest().exports[CASE_STUDY].facts).toEqual({})
    expect(problemsFor(freshManifest(), CASE_STUDY)).toEqual([])
  })

  it("still flags a file that draws no facts when it has no record at all", () => {
    // Not pedantry: the record is the only evidence the file was ever exported
    // from this plan, and a new slide starts with none.
    const manifest = freshManifest()
    delete manifest.exports[CASE_STUDY]
    expect(problemsFor(manifest, CASE_STUDY)).toEqual(["no record of the facts it was rendered from"])
  })
})

describe("writing the manifest back after an export", () => {
  it("replaces the record of every file the run rendered", () => {
    const before = freshManifest()
    before.exports[PROOF].facts["tests.total"] = 11
    const merged = mergeExportManifest(before, { [PROOF]: exportManifestRecord("infographic-recruiter-proof", FACTS) })
    expect(merged.exports[PROOF].facts["tests.total"]).toBe(17)
  })

  it("keeps the records of files the run did not render, so a partial run cannot claim them", () => {
    const before = freshManifest()
    before.exports[PROOF].facts["tests.total"] = 11
    const merged = mergeExportManifest(before, { [CASE_STUDY]: exportManifestRecord("carousel", FACTS) })
    expect(merged.exports[PROOF].facts["tests.total"]).toBe(11)
    expect(staleExports(merged, FACTS).map((s) => s.file)).toEqual([PROOF])
  })

  it("starts a manifest from nothing", () => {
    const merged = mergeExportManifest(null, { [PROOF]: exportManifestRecord("infographic-recruiter-proof", FACTS) })
    expect(Object.keys(merged.exports)).toEqual([PROOF])
  })

  it("drops a record for a file the harness no longer publishes", () => {
    const before = freshManifest()
    before.exports["/showcase/social/shared/gone.png"] = { renderedFrom: "", facts: {} }
    expect(Object.keys(mergeExportManifest(before, {}).exports)).not.toContain("/showcase/social/shared/gone.png")
  })

  it("writes the files in a stable order, so the committed manifest diffs by content", () => {
    const keys = Object.keys(mergeExportManifest(freshManifest(), {}).exports)
    expect(keys).toEqual([...keys].sort())
  })
})
