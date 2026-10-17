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
 * Paths that must never be committed, whatever stages them.
 *
 * `public/brand/herman.jpg` is the owner's headshot. It was in the tree only so
 * an agent could see his face while generating banner images, it is referenced
 * by nothing, and committing it would publish a personal photo to a public
 * repo. `git add -A` staged it during S70 and it was caught by eye on the way
 * past; the same pattern had already swept `banner-images-next-session.md` onto
 * `main` in S69a. Catching a file by eye is not a control, and the file being
 * deleted now (2026-10-17) does not retire the pattern - the next banner sprint
 * puts it back in the same place.
 *
 * `.gitignore` carries this path too and is the first line: it stops `git add -A`
 * staging the file at all. This is the backstop for the cases `.gitignore` does
 * not cover - `git add -f`, a path already tracked - and, unlike `.gitignore`,
 * it says out loud why it refused. Deliberately not a pattern over
 * `public/brand/`: the four wordmark and monogram files there are tracked and
 * belong in the repo.
 */
export const FORBIDDEN_PATHS = ["public/brand/herman.jpg"];

/**
 * Why these staged paths must not be committed, or `null` to let them through.
 *
 * Paths arrive as git prints them, forward-slashed and repo-relative, which is
 * true on Windows too. The same `OVERRIDE` stands aside here as for the branch
 * rule, for the same reason: a hook with no way out gets uninstalled wholesale.
 */
export function refusalForPaths(paths, env = {}) {
  if (env[OVERRIDE]) return null;

  const staged = (paths ?? []).filter((path) => FORBIDDEN_PATHS.includes(path));
  if (staged.length === 0) return null;

  return [
    `Refusing to commit ${staged.length === 1 ? "a file that" : "files that"} must not be in this repo:`,
    "",
    ...staged.map((path) => `    ${path}`),
    "",
    "This is a personal photo in a public repo, referenced by nothing in the",
    "codebase. It is kept out of git on purpose - see scripts/lib/branch-guard.mjs.",
    "Unstage it and commit the rest:",
    "",
    ...staged.map((path) => `    git restore --staged ${path}`),
    "",
    `If you really mean to commit it, say so: ${OVERRIDE}=1 git commit ...`,
  ].join("\n");
}

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
