import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APP_PORT,
  PROTECTED,
  REGENERABLE,
  currentSessionPid,
  describePortUse,
  isSafeToDelete,
  staleSessions,
} from "@/scripts/lib/housekeeping.mjs";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * `pnpm clean` deletes things, so the list of what it may delete is the part
 * worth pinning down. The rules live apart from the CLI precisely so they can be
 * checked here rather than by running a delete and seeing what survived.
 */
describe("regenerable paths", () => {
  it("names only repo-relative paths", () => {
    const escaping = REGENERABLE.filter(
      (path) => path.startsWith("/") || path.includes("..") || /^[a-z]:/i.test(path),
    );
    expect(escaping).toEqual([]);
  });

  it("never lists anything that is also protected", () => {
    expect(REGENERABLE.filter((path) => PROTECTED.includes(path))).toEqual([]);
  });

  it("covers the output that actually accumulated", () => {
    expect(REGENERABLE).toContain(".next");
    expect(REGENERABLE).toContain("test-results");
  });

  it("protects the fact snapshot, because pnpm facts cannot rewrite it while the suite is red", () => {
    expect(PROTECTED).toContain(".generated");
  });

  it("protects installed and configured state", () => {
    for (const path of ["node_modules", ".vercel"]) {
      expect(PROTECTED).toContain(path);
    }
  });
});

describe("isSafeToDelete", () => {
  it("accepts every regenerable path", () => {
    for (const path of REGENERABLE) {
      expect(isSafeToDelete(path), path).toBe(true);
    }
  });

  it("refuses protected paths", () => {
    for (const path of PROTECTED) {
      expect(isSafeToDelete(path), path).toBe(false);
    }
  });

  it("refuses anything not on the allow-list", () => {
    for (const path of ["features", "docs", ".env.local", "prisma/schema.prisma"]) {
      expect(isSafeToDelete(path), path).toBe(false);
    }
  });

  it("refuses absolute paths and traversal even when they end in a regenerable name", () => {
    for (const path of ["/.next", "C:/repo/.next", "../.next", "foo/../../.next"]) {
      expect(isSafeToDelete(path), path).toBe(false);
    }
  });

  it("refuses empty and non-string input", () => {
    for (const path of ["", " ", null, undefined, 42, {}]) {
      expect(isSafeToDelete(path as string), String(path)).toBe(false);
    }
  });
});

/**
 * Age and CPU time are the only evidence a script has, and neither proves a
 * session was abandoned, so this classifies candidates for a human to confirm.
 * It must never propose the session that is asking.
 */
type StaleSession = { pid: number; ageHours: number };

describe("staleSessions", () => {
  const now = Date.parse("2026-10-09T22:00:00Z");
  const hoursAgo = (n: number) => now - n * 3600_000;

  const sessions = [
    { pid: 100, startedAt: hoursAgo(0.5) },
    { pid: 200, startedAt: hoursAgo(13) },
    { pid: 300, startedAt: hoursAgo(130) },
  ];

  it("never proposes the current session, however old it is", () => {
    const old = [{ pid: 999, startedAt: hoursAgo(500) }];
    expect(staleSessions(old, { currentPid: 999, now })).toEqual([]);
  });

  it("leaves sessions younger than the threshold alone", () => {
    const stale: StaleSession[] = staleSessions(sessions, { currentPid: 100, now });
    expect(stale.map((s) => s.pid)).not.toContain(100);
  });

  it("proposes the ones past the threshold, oldest first", () => {
    const stale: StaleSession[] = staleSessions(sessions, { currentPid: 100, now });
    expect(stale.map((s) => s.pid)).toEqual([300, 200]);
  });

  it("reports an age so the report can justify itself", () => {
    const [oldest] = staleSessions(sessions, { currentPid: 100, now });
    expect(oldest.ageHours).toBeCloseTo(130, 0);
  });

  it("honours a custom threshold", () => {
    const stale = staleSessions(sessions, { currentPid: 100, maxAgeHours: 200, now });
    expect(stale).toEqual([]);
  });

  it("returns nothing for an empty list", () => {
    expect(staleSessions([], { currentPid: 100, now })).toEqual([]);
  });

  it("ignores entries with no usable start time rather than calling them stale", () => {
    const broken = [{ pid: 400, startedAt: undefined }, { pid: 500, startedAt: NaN }];
    expect(staleSessions(broken, { currentPid: 100, now })).toEqual([]);
  });
});

/**
 * How the report knows which session is its own. A process-tree walk looked
 * obvious and does not work: on Windows the shells in between exit, nothing
 * reparents, and the walk dies on a dangling ppid. Claude Code exports the pid,
 * so read that.
 */
describe("currentSessionPid", () => {
  it("reads CLAUDE_PID", () => {
    expect(currentSessionPid({ CLAUDE_PID: "21952" })).toBe(21952);
  });

  it("is null outside a session", () => {
    expect(currentSessionPid({})).toBeNull();
    expect(currentSessionPid()).toBeNull();
  });

  it("refuses values that are not a usable pid", () => {
    for (const value of ["", " ", "nope", "0", "-1", "12.5"]) {
      expect(currentSessionPid({ CLAUDE_PID: value }), value).toBeNull();
    }
  });

  it("excludes the running session from the stale list end to end", () => {
    const now = Date.parse("2026-10-09T22:00:00Z");
    const sessions = [
      { pid: 21952, startedAt: now - 400 * 3600_000 },
      { pid: 777, startedAt: now - 30 * 3600_000 },
    ];
    const stale: StaleSession[] = staleSessions(sessions, {
      currentPid: currentSessionPid({ CLAUDE_PID: "21952" }),
      now,
    });
    expect(stale.map((s) => s.pid)).toEqual([777]);
  });
});

/**
 * From S70's retro: a `next dev` left over from an earlier session held 3000,
 * a product page answered 500 from three-sprint-old code, and Playwright's
 * `webServer` would have run the browser gate against that server rather than
 * this tree. `pnpm health` looked at memory, output and sessions and not at the
 * one piece of state that decides what the gate measures.
 */
describe("describePortUse", () => {
  it("says the port is free when nothing holds it", () => {
    expect(describePortUse([])).toEqual([`Port ${APP_PORT} is free.`]);
    expect(describePortUse(undefined)).toEqual([`Port ${APP_PORT} is free.`]);
  });

  it("names the pid, because that is the only part a human can act on", () => {
    const lines = describePortUse([{ port: APP_PORT, pid: 1234, name: "node.exe", ageHours: 9 }]);
    expect(lines.join("\n")).toContain("pid 1234");
    expect(lines.join("\n")).toContain("node.exe");
    expect(lines.join("\n")).toContain("9h old");
  });

  it("explains what a listener costs, not just that there is one", () => {
    // The report exists to stop ten minutes going into a stale page, so the
    // reason has to travel with it.
    const lines = describePortUse([{ port: APP_PORT, pid: 1234 }]).join("\n");
    expect(lines).toContain("Playwright reuses an existing listener");
    expect(lines).toContain("this tree's build");
  });

  it("ignores a listener on some other port", () => {
    expect(describePortUse([{ port: APP_PORT + 1, pid: 1234 }])).toEqual([`Port ${APP_PORT} is free.`]);
  });

  it("reports every holder, since two servers on one port is the confusing case", () => {
    const lines = describePortUse([
      { port: APP_PORT, pid: 1 },
      { port: APP_PORT, pid: 2 },
    ]).join("\n");
    expect(lines).toContain("2 processes");
    expect(lines).toContain("pid 1");
    expect(lines).toContain("pid 2");
  });

  it("survives a process table that knew nothing about the holder", () => {
    // The pid comes from netstat and the name and age from a separate table,
    // which can fail on its own; the port is still worth reporting.
    const lines = describePortUse([{ port: APP_PORT, pid: 1234 }]).join("\n");
    expect(lines).toContain("pid 1234");
    expect(lines).not.toContain("NaN");
    expect(lines).not.toContain("undefined");
  });

  it("uses the port the browser gate uses, or it reports about the wrong one", () => {
    const config = readFileSync(join(REPO_ROOT, "qa/config/playwright.config.mts"), "utf8");
    expect(config).toContain(`process.env.PORT ?? ${APP_PORT}`);
  });

  it("is asked by the health script, not only exported", () => {
    const health = readFileSync(join(REPO_ROOT, "scripts/health.mjs"), "utf8");
    expect(health).toContain("describePortUse");
    expect(health).toContain("App port");
  });
});

/**
 * `pnpm doctor` silently ran pnpm's own built-in instead of the script and
 * printed nothing, which is how this list exists.
 */
describe("package scripts", () => {
  const scripts = JSON.parse(
    readFileSync(join(REPO_ROOT, "package.json"), "utf8"),
  ).scripts as Record<string, string>;

  const PNPM_BUILTINS = [
    "add",
    "audit",
    "bin",
    "config",
    "dedupe",
    "deploy",
    "doctor",
    "env",
    "exec",
    "fetch",
    "import",
    "init",
    "install",
    "licenses",
    "link",
    "list",
    "outdated",
    "pack",
    "patch",
    "prune",
    "publish",
    "rebuild",
    "remove",
    "root",
    "server",
    "setup",
    "store",
    "unlink",
    "update",
    "why",
  ];

  it("wires both housekeeping commands", () => {
    expect(scripts.clean).toBe("node scripts/clean.mjs");
    expect(scripts.health).toBe("node scripts/health.mjs");
  });

  it("names no script after a pnpm built-in, which would shadow it", () => {
    const shadowed = Object.keys(scripts).filter((name) =>
      PNPM_BUILTINS.includes(name),
    );
    expect(shadowed).toEqual([]);
  });
});
