import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildFacts,
  compareCoverage,
  countMergedPrs,
  countPlaywrightTests,
  countVitestTests,
  coverageFrom,
  floorCoverage,
} from "@/scripts/lib/facts.mjs"
import { FACT_KEYS, factsSchema, resolveFact } from "@/features/showcase/lib/domain/facts"
import { REPO_ROOT } from "@/qa/config/repo-root"

const fixture = (name: string) => JSON.parse(readFileSync(join(REPO_ROOT, "qa/fixtures/facts", name), "utf8"))

const arch = { deepImports: 0, libToFeatures: 0, anyTypes: 0, largeFiles: 21, useEffect: 32, clientComponents: 153 }

const built = () =>
  buildFacts({
    vitest: fixture("vitest-report.json"),
    playwright: fixture("playwright-list.json"),
    coverage: fixture("coverage-summary.json"),
    arch,
    docsPages: 52,
    routePages: 45,
    repo: { mergedPrs: 165, latestPr: 174 },
    generatedAt: "2026-10-06T00:00:00.000Z",
  })

describe("facts builder", () => {
  it("counts passed Vitest tests per layer, on any platform", () => {
    expect(countVitestTests(fixture("vitest-report.json"))).toEqual({ unit: 3, integration: 2 })
  })

  it("counts merged pull requests from both merge styles, without double counting", () => {
    expect(
      countMergedPrs([
        "S39: publish what the template generates (#174)",
        "Merge pull request #59 from Herman-Adu/v0/low-stock-alert-trigger",
        "S38: one dev port (#172)",
        "chore: a commit that merged nothing",
        // The same PR can appear twice when a branch is re-merged; it is still
        // one reviewed change.
        "S38: one dev port (#172)",
      ]),
    ).toEqual({ mergedPrs: 3, latestPr: 174 })
  })

  it("reports no pull requests for a history that has none", () => {
    expect(countMergedPrs(["initial commit", ""])).toEqual({ mergedPrs: 0, latestPr: 0 })
  })

  it("counts listed Playwright tests per layer, including nested describes", () => {
    expect(countPlaywrightTests(fixture("playwright-list.json"))).toEqual({ smoke: 3, axe: 1, seo: 2 })
  })

  it("reads line and branch coverage from the summary", () => {
    expect(coverageFrom(fixture("coverage-summary.json"))).toEqual({ lines: 71.2, branches: 61.5 })
  })

  it("assembles every figure a slide may use", () => {
    expect(built()).toEqual({
      generatedAt: "2026-10-06T00:00:00.000Z",
      tests: { unit: 3, integration: 2, smoke: 3, axe: 1, seo: 2, total: 11 },
      coverage: { lines: 71.2, branches: 61.5 },
      arch: { deepImports: 0, libToFeatures: 0, anyTypes: 0, largeFiles: 21, useEffect: 32 },
      docs: { pages: 52 },
      routes: { pages: 45 },
      repo: { mergedPrs: 165, latestPr: 174 },
    })
  })

  it("writes a file the showcase schema accepts, with every fact key resolvable", () => {
    const facts = factsSchema.parse(built())
    for (const key of FACT_KEYS) expect(typeof resolveFact(facts, key), key).toBe("number")
  })

  it("resolves nothing when facts have not been generated", () => {
    expect(resolveFact(null, "arch.useEffect")).toBeNull()
  })
})

describe("coverage ratchet", () => {
  const baseline = { lines: 71.2, branches: 61.5 }

  it("passes when coverage is equal", () => {
    expect(compareCoverage(baseline, { lines: 71.2, branches: 61.5 })).toEqual([])
  })

  it("passes when coverage goes up", () => {
    expect(compareCoverage(baseline, { lines: 80, branches: 62 })).toEqual([])
  })

  it("fails each metric that went down", () => {
    expect(compareCoverage(baseline, { lines: 71.1, branches: 70 })).toEqual([
      { metric: "lines", baseline: 71.2, now: 71.1 },
    ])
  })

  it("stores the baseline floored to one decimal so rounding noise cannot fail CI", () => {
    expect(floorCoverage({ lines: 71.29, branches: 61.51 })).toEqual({ lines: 71.2, branches: 61.5 })
  })
})

describe("committed coverage baseline", () => {
  it("exists and covers lines and branches", () => {
    const baseline = JSON.parse(readFileSync(join(REPO_ROOT, "qa/baselines/coverage.json"), "utf8"))
    expect(baseline.lines).toBeGreaterThan(0)
    expect(baseline.branches).toBeGreaterThan(0)
  })

  it("measures the whole feature and shared libraries, not a hand-picked subset", () => {
    const config = readFileSync(join(REPO_ROOT, "qa/config/vitest.config.mts"), "utf8")
    expect(config).toContain('"features/**/lib/**/*.{ts,tsx}"')
    expect(config).toContain('"lib/**/*.{ts,tsx}"')
  })
})

describe("facts wiring", () => {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> }

  it("has a facts script and runs it before showcase assets", () => {
    expect(pkg.scripts.facts).toBe("node scripts/facts.mjs")
    expect(pkg.scripts["showcase:assets"]).toMatch(/^pnpm facts && /)
  })

  it("runs facts in CI and keeps the generated file as an artifact", () => {
    const ci = readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8")
    expect(ci).toContain("run: pnpm facts")
    expect(ci).toContain("path: .generated/facts.json")
  })

  it("never commits the generated file", () => {
    expect(readFileSync(join(REPO_ROOT, ".gitignore"), "utf8")).toMatch(/^\/\.generated\/$/m)
  })
})
