/**
 * The `pre-commit` hook. Asks `branch-guard.mjs` and gets out of the way.
 *
 * Kept to a shim on purpose: everything worth testing is in the pure rule, and
 * a hook is the one place in the repo where a crash would block every commit, so
 * there is as little here as possible to crash.
 */
import { execFileSync } from "node:child_process";
import { refusalFor, refusalForPaths } from "./lib/branch-guard.mjs";

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

/** Paths staged for this commit, forward-slashed and repo-relative as git prints them. */
function stagedPaths() {
  try {
    return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch {
    return []; // No index, or no git: never a reason to block a commit.
  }
}

for (const refusal of [refusalFor(currentBranch(), process.env), refusalForPaths(stagedPaths(), process.env)]) {
  if (refusal !== null) {
    console.error(`\n${refusal}\n`);
    process.exit(1);
  }
}
