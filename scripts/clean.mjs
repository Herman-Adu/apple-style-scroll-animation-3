#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/clean.mjs             delete regenerable build and test output
 *   node scripts/clean.mjs --dry-run   report what would go, delete nothing
 *
 * Only paths on the allow-list in lib/housekeeping.mjs are ever touched, and
 * each one is re-checked here, so a typo in the list cannot become a delete
 * somewhere else in the tree.
 */
import { rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { REGENERABLE, isSafeToDelete } from "./lib/housekeeping.mjs";
import { directorySize, formatBytes } from "./lib/disk-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const dryRun = process.argv.includes("--dry-run");

let freed = 0;
const kept = [];

for (const path of REGENERABLE) {
  if (!isSafeToDelete(path)) {
    console.error(`Refused (not on the allow-list): ${path}`);
    process.exitCode = 1;
    continue;
  }

  const size = directorySize(join(ROOT, path));
  if (size === null) continue;

  freed += size;
  if (dryRun) {
    kept.push(`${path} (${formatBytes(size)})`);
    continue;
  }

  rmSync(join(ROOT, path), { recursive: true, force: true });
  console.log(`Removed ${path} (${formatBytes(size)})`);
}

if (dryRun) {
  console.log(kept.length ? `Would remove:\n  ${kept.join("\n  ")}` : "Nothing to remove.");
  console.log(`Would free ${formatBytes(freed)}.`);
} else {
  console.log(freed ? `Freed ${formatBytes(freed)}.` : "Nothing to remove.");
}
