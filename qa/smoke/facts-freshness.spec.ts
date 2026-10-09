import { execFileSync } from "node:child_process"
import path from "node:path"
import { expect, test } from "@playwright/test"
import { facts } from "../../lib/facts"

/**
 * The committed snapshot is what every live page and every exported slide
 * reads, so a stale one becomes a false claim printed on a slide captioned
 * "counted on every run, never typed in by hand".
 *
 * It has gone stale twice. In S44 the numbers lagged three sprints. In S48 the
 * browser counts were generated while a 62-test spec still sat in `qa/smoke/`;
 * that spec then moved and `pnpm facts` was never re-run, so the snapshot
 * claimed 84 smoke tests and 1,671 in total against a real 22 and 1,609 — and
 * five PDFs were exported with the wrong number drawn on them.
 *
 * Nothing caught either: the other fact tests assert the snapshot is
 * self-consistent, which a wrong snapshot also is.
 *
 * This lives in the browser gate, not the unit suite, deliberately.
 * `scripts/facts.mjs:38` abandons the run if Vitest fails, so a unit-test guard
 * would deadlock — the stale snapshot would block the command that repairs it.
 * `pnpm facts` only *lists* Playwright tests, so a failure here never does.
 */
const REPO_ROOT = path.join(__dirname, "..", "..")

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

test("the committed facts snapshot still matches the suite", () => {
  const counted = countBrowserTests()
  for (const layer of ["smoke", "seo", "axe"] as const) {
    expect(counted[layer], `${layer} tests actually present`).toBeGreaterThan(0)
    expect(facts.tests[layer], `snapshot.tests.${layer} is stale — rerun pnpm facts`).toBe(counted[layer])
  }
  const { unit, integration, smoke, axe, seo, total } = facts.tests
  expect(total, "snapshot total").toBe(unit + integration + smoke + axe + seo)
})
