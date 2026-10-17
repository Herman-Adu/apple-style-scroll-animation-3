/**
 * Pure rules behind `pnpm clean` and `pnpm doctor`.
 *
 * `clean` deletes things, so what it may delete is an allow-list rather than a
 * pattern: a deny-list grows a hole the first time someone adds a directory.
 * The rules sit apart from the CLIs so they can be unit-tested without running a
 * delete and inspecting the wreckage.
 */

/** Rebuilt by a documented command, so deleting it costs time and nothing else. */
export const REGENERABLE = [
  ".next",
  "test-results",
  "playwright-report",
  "coverage",
  "qa/.coverage",
  ".turbo",
];

/**
 * Looks like junk, is not.
 *
 * `.generated` holds the fact snapshot the slides read their numbers from, and
 * `pnpm facts` writes nothing while the test suite is red, so deleting it can
 * strand every carousel with no way back until the suite is green. The rest is
 * installed or configured state that no command in this repo regenerates for
 * free.
 */
export const PROTECTED = [
  ".generated",
  ".superpowers",
  "node_modules",
  ".vercel",
  "lib/facts/snapshot.json",
];

const DEFAULT_MAX_AGE_HOURS = 12;

/**
 * The port the app and the browser gate both use. `qa/config/playwright.config.mts`
 * reads the same default, and its `webServer` reuses whatever is already
 * listening - which is the whole reason this is worth reporting.
 */
export const APP_PORT = 3000;

/**
 * What a listener on the app's port means for the next command someone runs.
 *
 * From S70's retro. A `next dev` left over from an earlier session was still
 * holding 3000, so the first `curl` of a product page answered 500 from code
 * three sprints old, and Playwright - whose `webServer` reuses an existing
 * listener rather than booting one - would have run the whole browser gate
 * against that server instead of this tree. Ten minutes went into reading a
 * stale page before anyone suspected the port. Nothing in the repo said so:
 * `pnpm health` reported memory, output and sessions, and the one piece of
 * state that silently decides what the gate measures was the piece it did not
 * look at.
 *
 * Reported, never killed, for the same reason sessions are: a listener on 3000
 * is usually the dev server someone is deliberately using, and this cannot tell
 * that from an orphan. The judgement it asks for is not "is this stale" but
 * "is this *your* build", which only the person can answer.
 */
export function describePortUse(listeners, options = {}) {
  const { port = APP_PORT } = options;
  const holders = (listeners ?? []).filter((listener) => Number(listener.port) === Number(port));
  if (holders.length === 0) return [`Port ${port} is free.`];

  const lines = holders.map((holder) => {
    const name = holder.name ? ` ${holder.name}` : "";
    const age = Number.isFinite(holder.ageHours) ? `, ${Math.round(holder.ageHours)}h old` : "";
    return `  pid ${holder.pid}${name}${age}`;
  });

  return [
    `Port ${port} is in use by ${holders.length === 1 ? "a process" : `${holders.length} processes`}:`,
    ...lines,
    "Playwright reuses an existing listener instead of booting one, so the browser",
    "gate measures whatever answers here. Confirm it is this tree's build before",
    "believing anything you read from it, including a curl.",
    process.platform === "win32" ? "  taskkill /PID <pid> /T /F" : "  kill <pid>",
  ];
}

/**
 * True only for an exact entry on the allow-list. Absolute paths, traversal and
 * anything merely ending in a regenerable name are refused, so a caller cannot
 * talk this into deleting `../.next` or `/.next`.
 */
export function isSafeToDelete(path) {
  if (typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed) return false;
  if (trimmed !== path) return false;
  if (trimmed.startsWith("/") || /^[a-z]:/i.test(trimmed)) return false;
  if (trimmed.split("/").includes("..")) return false;
  if (PROTECTED.includes(trimmed)) return false;
  return REGENERABLE.includes(trimmed);
}

/**
 * The pid of the Claude Code session we are running inside, from the
 * `CLAUDE_PID` it exports, or null outside one.
 *
 * Preferred over walking the process tree: on Windows the intervening shells
 * exit and nothing reparents, so a walk hits a dangling ppid and gives up.
 */
export function currentSessionPid(env = {}) {
  const pid = Number(env.CLAUDE_PID);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

/**
 * Claude Code sessions worth asking a human about, oldest first.
 *
 * Age is the only evidence available and it does not prove abandonment, so this
 * proposes candidates and never acts. The session asking is always excluded:
 * reporting yourself as stale is how a cleanup kills the thing running it.
 */
export function staleSessions(sessions, options = {}) {
  const {
    currentPid,
    maxAgeHours = DEFAULT_MAX_AGE_HOURS,
    now = Date.now(),
  } = options;

  return sessions
    .filter((session) => session.pid !== currentPid)
    .map((session) => {
      const startedAt = Number(
        session.startedAt instanceof Date
          ? session.startedAt.getTime()
          : session.startedAt,
      );
      if (!Number.isFinite(startedAt)) return null;
      return { pid: session.pid, ageHours: (now - startedAt) / 3600_000 };
    })
    .filter((session) => session !== null && session.ageHours >= maxAgeHours)
    .sort((a, b) => b.ageHours - a.ageHours);
}
