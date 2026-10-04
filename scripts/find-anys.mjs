#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SOURCE_DIRS = ["app", "components", "features", "hooks", "lib"];
const ANY_RE = /:\s*any\b|\bas any\b|<any>/g;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      yield full;
  }
}

let total = 0;
for (const d of SOURCE_DIRS) {
  const dir = join(ROOT, d);
  try {
    for (const file of walk(dir)) {
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      const hits = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (ANY_RE.test(line)) {
          hits.push({ line: i + 1, text: line.trim() });
        }
        ANY_RE.lastIndex = 0;
      }
      if (hits.length) {
        total += hits.length;
        console.log(`${file.replace(process.cwd() + "/", "")}: ${hits.length}`);
        for (const h of hits) console.log(`  L${h.line}: ${h.text}`);
      }
    }
  } catch (e) {
    // skip missing dirs
  }
}

console.log("\nTotal any matches:", total);
