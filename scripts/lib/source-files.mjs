import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

export const SOURCE_DIRS = ["app", "components", "features", "hooks", "lib"];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
      yield full;
  }
}

/** Every TypeScript source file under the app's source folders, as { path, text } records. */
export function collectSources(root, dirs = SOURCE_DIRS) {
  return dirs
    .flatMap((dir) => [...walk(join(root, dir))])
    .map((full) => ({
      path: relative(root, full).replace(/\\/g, "/"),
      text: readFileSync(full, "utf8"),
    }));
}
