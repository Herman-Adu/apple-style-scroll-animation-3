#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/arch-audit.mjs            print metrics vs baseline, exit 1 if any got worse
 *   node scripts/arch-audit.mjs --update   write the current metrics as the new baseline
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import { compare, measure } from "./lib/arch-audit-metrics.mjs"

const ROOT = new URL("..", import.meta.url).pathname
const SOURCE_DIRS = ["app", "components", "features", "hooks", "lib"]
const BASELINE = join(ROOT, "qa/baselines/arch.json")

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) yield full
  }
}

const records = SOURCE_DIRS.flatMap((dir) => [...walk(join(ROOT, dir))]).map((full) => ({
  path: relative(ROOT, full),
  text: readFileSync(full, "utf8"),
}))
const now = measure(records)

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, `${JSON.stringify(now, null, 2)}\n`)
  console.log("Baseline updated:", now)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"))
console.table(Object.fromEntries(Object.keys(now).map((k) => [k, { baseline: baseline[k], now: now[k] }])))

const regressions = compare(baseline, now)
if (regressions.length) {
  for (const r of regressions) console.error(`Worse: ${r.metric} ${r.baseline} -> ${r.now}`)
  process.exit(1)
}
console.log("Architecture metrics: no regressions.")
