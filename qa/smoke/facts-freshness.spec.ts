import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { expect, test } from "@playwright/test"
import { facts } from "../../lib/facts"
import { countMergedPrs, countVitestTests } from "../../scripts/lib/facts.mjs"

/**
 * The committed snapshot is what every live page and every exported slide
 * reads, so a stale one becomes a false claim printed on a slide captioned
 * "counted on every run, never typed in by hand".
 *
 * It has gone stale three times. In S44 the numbers lagged three sprints. In
 * S48 the browser counts were generated while a 62-test spec still sat in
 * `qa/smoke/`; that spec then moved and `pnpm facts` was never re-run, so the
 * snapshot claimed 84 smoke tests and 1,671 in total against a real 22 and
 * 1,609 — and five PDFs were exported with the wrong number drawn on them. In
 * S54 it read 181 merged PRs and 1,482 unit tests against a real 195 and 1,566.
 *
 * Nothing caught any of them. The other fact tests assert the snapshot is
 * self-consistent, which a wrong snapshot also is, and their stale-number
 * check is a hand-written blocklist of past mistakes — a list of what already
 * went wrong, which is never what goes wrong next. Only a recount can see it,
 * so every number a post leans on is recounted here: the browser layers from a
 * Playwright `--list`, merged pull requests from `git log`, and the unit layer
 * from a real Vitest run.
 *
 * All three recounts call the generator's own counting functions, so the guard
 * and `pnpm facts` cannot drift into two definitions of the same number.
 *
 * This lives in the browser gate, not the unit suite, deliberately.
 * `scripts/facts.mjs:38` abandons the run if Vitest fails, so a unit-test guard
 * would deadlock — the stale snapshot would block the command that repairs it.
 * `pnpm facts` only *lists* Playwright tests, so a failure here never does.
 *
 * What this cannot do is fail in CI: the `app` job runs `pnpm facts` before
 * `pnpm test:smoke` (`.github/workflows/ci.yml:80`), so by the time these
 * recounts run the snapshot on disk has just been regenerated from the same
 * measurements. This is the local gate AGENTS.md requires before a merge, and
 * it is the last point at which a stale snapshot can still be caught.
 */
const REPO_ROOT = path.join(__dirname, "..", "..")

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })

function countBrowserTests(): Record<string, number> {
  const raw = execFileSync(
    "pnpm",
    ["exec", "playwright", "test", "--config", "qa/config/playwright.config.mts", "--list", "--reporter=json"],
    { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" },
  )
  const parsed = JSON.parse(raw.slice(raw.indexOf("{")))
  const counts: Record<string, number> = { smoke: 0, seo: 0, axe: 0 }
  const walk = (suite: { suites?: unknown[]; specs?: unknown[]; file?: string }) => {
    for (const spec of (suite.specs ?? []) as { file?: string }[]) {
      const file = (spec.file ?? suite.file ?? "").split("\\").join("/")
      const layer = Object.keys(counts).find((name) => file.includes(`${name}/`))
      if (layer) counts[layer] += 1
    }
    for (const child of (suite.suites ?? []) as Parameters<typeof walk>[0][]) walk(child)
  }
  for (const suite of parsed.suites ?? []) walk(suite)
  return counts
}

/**
 * The generator reads subject lines from `git log` (`scripts/facts.mjs:69`), so
 * the recount reads them the same way and hands them to the same parser.
 */
function countPullRequests(): { mergedPrs: number; latestPr: number } {
  return countMergedPrs(git("log", "--format=%s").split("\n"))
}

/** Vitest 5 writes the JSON report to a file; `--reporter=json` alone prints nothing. */
function runUnitSuite(): { numFailedTests: number; unit: number } {
  const dir = mkdtempSync(path.join(os.tmpdir(), "facts-freshness-"))
  try {
    const report = path.join(dir, "vitest-report.json")
    try {
      execFileSync(
        "pnpm",
        [
          "exec", "vitest", "run", "--config", "qa/config/vitest.config.mts", "qa/unit",
          "--reporter=json", `--outputFile.json=${report}`,
        ],
        { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" },
      )
    } catch (error) {
      // A failing unit test exits non-zero but still writes the report, and the
      // report is what this test reads. Only a run that produced none is fatal,
      // and then print what Vitest said: `execFileSync` captures its output and
      // puts none of it in the message, which turns a plain broken unit suite
      // into an unreadable "Command failed".
      if (!existsSync(report)) {
        const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string }
        throw new Error(`could not count the unit suite
${stdout}
${stderr}`)
      }
    }
    const parsed = JSON.parse(readFileSync(report, "utf8"))
    return { numFailedTests: parsed.numFailedTests ?? 0, unit: countVitestTests(parsed).unit }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test("the committed facts snapshot still matches the suite", () => {
  const counted = countBrowserTests()
  for (const layer of ["smoke", "seo", "axe"] as const) {
    expect(counted[layer], `${layer} tests actually present`).toBeGreaterThan(0)
    expect(facts.tests[layer], `snapshot.tests.${layer} is stale — rerun pnpm facts`).toBe(counted[layer])
  }
  const { unit, integration, smoke, axe, seo, total } = facts.tests
  expect(total, "snapshot total").toBe(unit + integration + smoke + axe + seo)
})

test("the committed facts snapshot still matches the merged pull requests in git history", () => {
  // A shallow clone has no history to recount against, and would make this
  // agree with any snapshot at all. `actions/checkout` fetches one commit by
  // default, which is why CI asks for `fetch-depth: 0` — before it did, every
  // run published a facts artifact claiming 0 merged pull requests. Anywhere
  // else, say so rather than passing on a count of nothing.
  test.skip(
    git("rev-parse", "--is-shallow-repository").trim() === "true",
    "shallow clone: no history to recount merged pull requests from",
  )
  const counted = countPullRequests()
  expect(counted.mergedPrs, "merged pull requests actually present in history").toBeGreaterThan(0)
  expect(facts.repo.mergedPrs, "snapshot.repo.mergedPrs is stale — rerun pnpm facts").toBe(counted.mergedPrs)
  expect(facts.repo.latestPr, "snapshot.repo.latestPr is stale — rerun pnpm facts").toBe(counted.latestPr)
})

test("the committed facts snapshot still matches a fresh count of the unit suite", () => {
  // Running the unit layer is the only honest recount: `vitest list` collects
  // 753 of the 1,566 tests the suite actually runs, because `it.each` cases are
  // generated at run time. A full run of `qa/unit` costs ~11s.
  test.setTimeout(5 * 60_000)
  const counted = runUnitSuite()
  // Said before the comparison, because the count is of tests that *passed*: a
  // red unit suite would otherwise arrive here disguised as a stale snapshot.
  expect(counted.numFailedTests, "the unit suite must be green for its count to mean anything").toBe(0)
  expect(counted.unit, "unit tests actually ran").toBeGreaterThan(0)
  expect(facts.tests.unit, "snapshot.tests.unit is stale — rerun pnpm facts").toBe(counted.unit)
})
