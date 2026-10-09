#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/health.mjs
 *
 * Reports what the machine is carrying and changes nothing. It always exits 0:
 * a health report that can fail a chained command would just get dropped from
 * the chain.
 *
 * Processes are reported, never killed. Age does not prove a session was
 * abandoned, and the only way to be badly wrong is to kill one someone is
 * using, so the decision stays with a human.
 */
import { freemem, totalmem } from "node:os";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { REGENERABLE, currentSessionPid, staleSessions } from "./lib/housekeeping.mjs";
import { directorySize, formatBytes } from "./lib/disk-usage.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SESSION_NAME = "claude";
const MAX_AGE_HOURS = 12;

const gb = (bytes) => (bytes / 1024 ** 3).toFixed(1);

console.log("Memory");
const free = freemem();
const total = totalmem();
console.log(`  ${gb(free)} GB free of ${gb(total)} GB (${Math.round((free / total) * 100)}%)`);
if (free / total < 0.2) {
  console.log("  Low headroom. Smoke needs --workers=2 here; see sprint-workflow/references/troubleshooting.md.");
}

console.log("\nRegenerable output");
let residue = 0;
for (const path of REGENERABLE) {
  const size = directorySize(join(ROOT, path));
  if (size === null) continue;
  residue += size;
  console.log(`  ${path}  ${formatBytes(size)}`);
}
console.log(residue ? `  Total ${formatBytes(residue)} - run \`pnpm clean\`.` : "  Clean.");

console.log("\nClaude Code sessions");
for (const line of describeSessions()) console.log(`  ${line}`);

/**
 * Best-effort: the listing is platform-specific and entirely cosmetic, so every
 * failure degrades to a note rather than an error.
 */
function describeSessions() {
  let table;
  try {
    table = processTable();
  } catch {
    return ["Could not list processes on this platform; skipping."];
  }

  const sessions = [...table.values()].filter((p) => p.name.includes(SESSION_NAME));
  if (!sessions.length) return ["None found."];

  // Which one is us? The report must never propose killing the session that
  // asked for it. Claude Code exports its own pid; the tree walk is only a
  // fallback, because the shells in between exit and leave a dangling ppid.
  const currentPid =
    currentSessionPid(process.env) ?? findAncestor(table, process.pid, SESSION_NAME);
  const stale = staleSessions(sessions, { currentPid, maxAgeHours: MAX_AGE_HOURS });

  const lines = [
    currentPid
      ? `${sessions.length} running (pid ${currentPid} is this one).`
      : `${sessions.length} running (could not identify this one, so none is excluded below).`,
  ];
  if (!stale.length) return [...lines, `None older than ${MAX_AGE_HOURS}h.`];

  lines.push(`${stale.length} older than ${MAX_AGE_HOURS}h, oldest first:`);
  for (const { pid, ageHours } of stale) lines.push(`  pid ${pid}  ${Math.round(ageHours)}h old`);
  lines.push("Close the ones you are finished with from their own window, or kill the tree:");
  lines.push(process.platform === "win32" ? "  taskkill /PID <pid> /T /F" : "  pkill -P <pid> && kill <pid>");
  lines.push("Look before killing: this cannot tell an abandoned session from a busy one.");
  return lines;
}

function findAncestor(table, startPid, name) {
  const seen = new Set();
  let pid = startPid;
  while (table.has(pid) && !seen.has(pid)) {
    seen.add(pid);
    const parentPid = table.get(pid).parentPid;
    const parent = table.get(parentPid);
    if (!parent) return null;
    if (parent.name.includes(name)) return parentPid;
    pid = parentPid;
  }
  return null;
}

/** Map of pid -> { pid, parentPid, name, startedAt }. */
function processTable() {
  const rows =
    process.platform === "win32"
      ? execFileSync(
          "powershell",
          [
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId)`t$($_.ParentProcessId)`t$($_.Name)`t$(if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') })\" }",
          ],
          { encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "ignore"] },
        )
          .split("\n")
          .map((line) => line.trim().split("\t"))
          .filter((parts) => parts.length >= 3)
          .map(([pid, parentPid, name, stamp]) => ({
            pid: Number(pid),
            parentPid: Number(parentPid),
            name: name.toLowerCase(),
            startedAt: stamp ? Date.parse(stamp) : NaN,
          }))
      : execFileSync("ps", ["-eo", "pid=,ppid=,etimes=,comm="], {
          encoding: "utf8",
          timeout: 20_000,
          stdio: ["ignore", "pipe", "ignore"],
        })
          .split("\n")
          .map((line) => line.trim().split(/\s+/))
          .filter((parts) => parts.length >= 4)
          .map(([pid, parentPid, seconds, name]) => ({
            pid: Number(pid),
            parentPid: Number(parentPid),
            name: name.toLowerCase(),
            startedAt: Date.now() - Number(seconds) * 1000,
          }));

  return new Map(
    rows.filter((row) => Number.isFinite(row.pid)).map((row) => [row.pid, row]),
  );
}
