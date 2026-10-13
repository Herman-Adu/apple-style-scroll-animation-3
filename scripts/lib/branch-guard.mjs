/**
 * The rule behind the `pre-commit` hook: no commit lands on `main`.
 *
 * `AGENTS.md` non-negotiable 1 has always said so, but a sentence cannot stop a
 * commit. S52's closeout was committed on local `main` and only then branched;
 * the content was identical to the squash that followed, so nothing in review,
 * CI or any diff could have shown it - the single trace was a local ref one
 * commit ahead of `origin/main`.
 *
 * The decision is a pure function so it can be tested without staging a commit
 * and inspecting the aftermath, which is the same reason `housekeeping.mjs`
 * keeps its rules apart from `clean` and `health`.
 */

/**
 * Branches a commit may never land on directly.
 *
 * Only `main`: every `v0/<id>-<name>` branch is disposable by design, and a
 * guard that argued about sprint branches would be turned off within a week.
 */
export const PROTECTED_BRANCHES = ["main"];

/**
 * The deliberate way past the guard, for the case nobody planned for.
 *
 * A hook with no way out gets uninstalled wholesale the first time it is wrong,
 * which trades one blocked commit for no guard at all. Naming it in full on the
 * command line is the point: it leaves a trace in shell history that reads as a
 * decision.
 */
export const OVERRIDE = "ALLOW_COMMIT_ON_MAIN";

/** Where the tracked hooks live, as `core.hooksPath` is pointed at them. */
export const HOOKS_DIR = ".githooks";

/**
 * Why this commit must not happen, or `null` to let it through.
 *
 * `branch` is `null` for a detached HEAD, which is what a rebase, a bisect and a
 * `git merge` in progress all look like - none of them is someone typing a
 * commit on `main`, so the guard stays out of the way. Names are compared
 * exactly, because git refs are case-sensitive and `Main` is a different branch.
 */
export function refusalFor(branch, env = {}) {
  if (branch === null || branch === undefined) return null;
  if (!PROTECTED_BRANCHES.includes(branch)) return null;
  if (env[OVERRIDE]) return null;

  return [
    `Refusing to commit on ${branch}.`,
    "",
    "AGENTS.md non-negotiable 1: one sprint = one v0/<id>-<name> branch = one PR.",
    "Your staged work is untouched. Move it to a branch and commit there:",
    "",
    "    git checkout -b v0/<id>-<name>",
    "",
    `If you really mean to commit here, say so: ${OVERRIDE}=1 git commit ...`,
  ].join("\n");
}
