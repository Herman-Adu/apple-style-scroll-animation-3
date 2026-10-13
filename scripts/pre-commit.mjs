/**
 * The `pre-commit` hook. Asks `branch-guard.mjs` and gets out of the way.
 *
 * Kept to a shim on purpose: everything worth testing is in the pure rule, and
 * a hook is the one place in the repo where a crash would block every commit, so
 * there is as little here as possible to crash.
 */
import { execFileSync } from "node:child_process";
import { refusalFor } from "./lib/branch-guard.mjs";

/** The branch being committed to, or `null` for a detached HEAD. */
function currentBranch() {
  try {
    return execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null; // Detached HEAD, or no git: never a reason to block a commit.
  }
}

const refusal = refusalFor(currentBranch(), process.env);
if (refusal !== null) {
  console.error(`\n${refusal}\n`);
  process.exit(1);
}
