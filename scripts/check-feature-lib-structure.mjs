#!/usr/bin/env node
import { readdir, stat } from "fs/promises";
import { join } from "path";

const ROOT = process.cwd();
const FEATURES = join(ROOT, "features");
const ALLOWED = new Set(["actions", "data", "domain", "adapters"]);

async function listDirs(path) {
  try {
    const names = await readdir(path);
    const dirs = [];
    for (const name of names) {
      const full = join(path, name);
      try {
        const s = await stat(full);
        if (s.isDirectory()) dirs.push(name);
      } catch (e) {
        // ignore
      }
    }
    return dirs;
  } catch (e) {
    return [];
  }
}

async function listFiles(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function run() {
  const features = await listDirs(FEATURES);
  const report = { features: {}, issues: [] };

  for (const f of features) {
    const libPath = join(FEATURES, f, "lib");
    const libDirs = await listDirs(libPath);
    const unexpected = libDirs.filter((d) => !ALLOWED.has(d));
    const looseFiles = await listFiles(libPath);
    const rootFiles = await readdir(join(FEATURES, f)).catch(() => []);
    const hasRootActions = rootFiles.includes("actions.ts");
    const hasLibActions = libDirs.includes("actions");

    report.features[f] = {
      libDirs,
      hasRootActions,
      hasLibActions,
      unexpected,
      looseFiles,
    };

    if (unexpected.length > 0 || looseFiles.length > 0 || hasRootActions) {
      report.issues.push({
        feature: f,
        unexpected,
        looseFiles,
        hasRootActions,
      });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.issues.length > 0) {
    console.error("\nFeature lib layout issues found — see JSON above.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
