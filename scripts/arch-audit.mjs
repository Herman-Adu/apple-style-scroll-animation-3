#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/arch-audit.mjs            print metrics vs baseline, exit 1 if any got worse
 *   node scripts/arch-audit.mjs --update   write the current metrics as the new baseline
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compare, measure } from "./lib/arch-audit-metrics.mjs";
import { collectSources } from "./lib/source-files.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASELINE = join(ROOT, "qa/baselines/arch.json");

const now = measure(collectSources(ROOT));

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, `${JSON.stringify(now, null, 2)}\n`);
  console.log("Baseline updated:", now);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
console.table(
  Object.fromEntries(
    Object.keys(now).map((k) => [k, { baseline: baseline[k], now: now[k] }]),
  ),
);

const regressions = compare(baseline, now);
if (regressions.length) {
  for (const r of regressions)
    console.error(`Worse: ${r.metric} ${r.baseline} -> ${r.now}`);
  process.exit(1);
}
console.log("Architecture metrics: no regressions.");
