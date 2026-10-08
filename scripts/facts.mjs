#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/facts.mjs                    run unit + integration with coverage, write .generated/facts.json,
 *                                             exit 1 if coverage fell below qa/baselines/coverage.json
 *   node scripts/facts.mjs --update-baseline  same, then store today's coverage (floored) as the baseline
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { measure } from "./lib/arch-audit-metrics.mjs";
import { buildFacts, compareCoverage, countMergedPrs, floorCoverage } from "./lib/facts.mjs";
import { collectSources } from "./lib/source-files.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, ".generated/facts.json");
const REPORT = join(ROOT, "qa/.coverage/vitest-report.json");
const SUMMARY = join(ROOT, "qa/.coverage/coverage-summary.json");
const BASELINE = join(ROOT, "qa/baselines/coverage.json");
// Committed, unlike OUT: pages that render live still need the numbers after a deploy.
const SNAPSHOT = join(ROOT, "lib/facts/snapshot.json");

const pnpm = (args, options) =>
  spawnSync("pnpm", args, { cwd: ROOT, shell: process.platform === "win32", ...options });
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const fail = (message) => {
  console.error(`facts: ${message}`);
  process.exit(1);
};

const vitest = pnpm(
  [
    "exec", "vitest", "run", "--config", "qa/config/vitest.config.mts", "--coverage",
    "--reporter=default", "--reporter=json", `--outputFile.json=${REPORT}`,
  ],
  { stdio: "inherit" },
);
if (vitest.status !== 0) fail("Vitest failed, so no facts were written.");

const list = pnpm(
  ["exec", "playwright", "test", "--config", "qa/config/playwright.config.mts", "--list", "--reporter=json"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"] },
);
if (list.status !== 0) fail("Playwright could not list the browser tests.");

const docsIndex = readFileSync(join(ROOT, "features/docs/content/index.ts"), "utf8");
const routePages = readdirSync(join(ROOT, "app"), { recursive: true, encoding: "utf8" }).filter((file) =>
  /(?:^|[\\/])page\.tsx$/.test(file),
).length;

const facts = buildFacts({
  vitest: readJson(REPORT),
  playwright: JSON.parse(list.stdout),
  coverage: readJson(SUMMARY),
  arch: measure(collectSources(ROOT)),
  docsPages: docsIndex.match(/from\s+["']\.\/[^"']+["']/g)?.length ?? 0,
  routePages,
  repo: countMergedPrs(
    spawnSync("git", ["log", "--format=%s"], { cwd: ROOT, maxBuffer: 20e6 }).stdout.toString().split("\n"),
  ),
  generatedAt: new Date().toISOString(),
});

mkdirSync(join(ROOT, ".generated"), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(facts, null, 2)}\n`);
writeFileSync(SNAPSHOT, `${JSON.stringify(facts, null, 2)}
`);
console.log("Facts written to .generated/facts.json and lib/facts/snapshot.json");
console.table({ ...facts.tests, ...facts.coverage, docs: facts.docs.pages, routes: facts.routes.pages });

if (process.argv.includes("--update-baseline")) {
  const baseline = floorCoverage(facts.coverage);
  writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log("Coverage baseline updated:", baseline);
  process.exit(0);
}

if (!existsSync(BASELINE)) fail("qa/baselines/coverage.json is missing. Run `pnpm facts --update-baseline`.");
const regressions = compareCoverage(readJson(BASELINE), facts.coverage);
for (const r of regressions) console.error(`Coverage fell: ${r.metric} ${r.baseline}% -> ${r.now}%`);
if (regressions.length) process.exit(1);
console.log("Coverage: at or above baseline.");
