/**
 * Points git at the tracked hooks, from `postinstall` so a fresh clone is
 * guarded by its first `pnpm install`.
 *
 * `.git/hooks` is not tracked, so a hook committed there reaches nobody; a
 * tracked directory plus `core.hooksPath` is what makes it travel. This never
 * fails an install: a missing git, a worktree that is not a repo, or a tarball
 * of the sources are all fine, they just get no hook.
 */
import { execFileSync } from "node:child_process";
import { HOOKS_DIR } from "./lib/branch-guard.mjs";

try {
  execFileSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" });
  execFileSync("git", ["config", "core.hooksPath", HOOKS_DIR], { stdio: "ignore" });
  console.log(`Git hooks: core.hooksPath -> ${HOOKS_DIR}`);
} catch {
  console.log("Git hooks: not a git repo, skipped.");
}
