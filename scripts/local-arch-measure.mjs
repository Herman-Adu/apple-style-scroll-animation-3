import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { measure } from "./lib/arch-audit-metrics.mjs";

const ROOT = process.cwd();
const SOURCE_DIRS = ["app", "components", "features", "hooks", "lib"];

function* walk(dir) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
        yield full;
    }
  } catch {
    /* ignore */
  }
}

const records = SOURCE_DIRS.flatMap((d) =>
  [...walk(join(ROOT, d))].map((full) => ({
    path: relative(ROOT, full),
    text: readFileSync(full, "utf8"),
  })),
).filter(Boolean);
const now = measure(records);
console.log("Measured metrics:", now);
const baseline = JSON.parse(
  readFileSync(join(ROOT, "qa", "baselines", "arch.json"), "utf8"),
);
console.table(
  Object.fromEntries(
    Object.keys(now).map((k) => [k, { baseline: baseline[k], now: now[k] }]),
  ),
);
const regressions = Object.keys(baseline).filter(
  (metric) => (now[metric] || 0) > baseline[metric],
);
if (regressions.length) {
  console.error(
    "Regressions:",
    regressions.map((k) => `${k} ${baseline[k]} -> ${now[k]}`).join(", "),
  );
  process.exit(1);
}
console.log("No regressions");
