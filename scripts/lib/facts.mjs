/**
 * Pure builders for .generated/facts.json: the one file every number on a
 * showcase slide is read from. Inputs are the raw tool outputs (Vitest JSON
 * report, Playwright --list JSON, coverage summary, arch metrics).
 */

export const COVERAGE_METRICS = ["lines", "branches"];
const ARCH_FACTS = ["deepImports", "libToFeatures", "anyTypes", "largeFiles", "useEffect"];
const VITEST_LAYER = /(?:^|[\\/])qa[\\/](unit|integration)[\\/]/;
const PLAYWRIGHT_LAYERS = ["smoke", "axe", "seo"];

const sum = (values) => values.reduce((total, n) => total + n, 0);

export function countVitestTests(report) {
  const perFile = (report.testResults ?? []).map((file) => ({
    layer: file.name.match(VITEST_LAYER)?.[1],
    passed: (file.assertionResults ?? []).filter((a) => a.status === "passed").length,
  }));
  return Object.fromEntries(
    ["unit", "integration"].map((layer) => [
      layer,
      sum(perFile.filter((f) => f.layer === layer).map((f) => f.passed)),
    ]),
  );
}

const specsOf = (suite) => [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(specsOf)];

export function countPlaywrightTests(list) {
  const specs = (list.suites ?? []).flatMap(specsOf);
  return Object.fromEntries(
    PLAYWRIGHT_LAYERS.map((layer) => [
      layer,
      sum(
        specs
          .filter((spec) => spec.file.split(/[\\/]/)[0] === layer)
          .map((spec) => spec.tests.length),
      ),
    ]),
  );
}

export function coverageFrom(summary) {
  return Object.fromEntries(COVERAGE_METRICS.map((m) => [m, summary.total[m].pct]));
}

export function buildFacts({ vitest, playwright, coverage, arch, docsPages, routePages, repo, generatedAt }) {
  const layers = { ...countVitestTests(vitest), ...countPlaywrightTests(playwright) };
  return {
    generatedAt,
    tests: { ...layers, total: sum(Object.values(layers)) },
    coverage: coverageFrom(coverage),
    arch: Object.fromEntries(ARCH_FACTS.map((key) => [key, arch[key]])),
    docs: { pages: docsPages },
    routes: { pages: routePages },
    repo,
  };
}

/**
 * Merged pull requests, read from history rather than counted by hand.
 * Squash merges read "Title (#12)"; the older merge commits read "Merge pull
 * request #12 from ...". Both are counted once, because a branch that was
 * merged twice is still one reviewed change.
 */
export function countMergedPrs(subjects) {
  const numbers = new Set();
  for (const subject of subjects) {
    const squashed = /\(#(\d+)\)\s*$/.exec(subject);
    const merged = /^Merge pull request #(\d+)\b/.exec(subject);
    if (squashed) numbers.add(Number(squashed[1]));
    if (merged) numbers.add(Number(merged[1]));
  }
  return { mergedPrs: numbers.size, latestPr: numbers.size ? Math.max(...numbers) : 0 };
}

/** One-way ratchet: equal or higher passes, any drop is reported. */
export function compareCoverage(baseline, now) {
  return COVERAGE_METRICS.filter((m) => now[m] < baseline[m]).map((metric) => ({
    metric,
    baseline: baseline[metric],
    now: now[metric],
  }));
}

export function floorCoverage(coverage) {
  return Object.fromEntries(
    COVERAGE_METRICS.map((m) => [m, Math.floor(coverage[m] * 10 + 1e-9) / 10]),
  );
}
