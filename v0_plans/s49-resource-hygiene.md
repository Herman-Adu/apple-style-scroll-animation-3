# S49: resource hygiene as part of the process

Branch: `v0/s49-resource-hygiene`. Data impact: **none**.

## Why

Housekeeping only ever happened when someone noticed. On Oct 9, 2026 the
machine was carrying:

- **Nine live Claude Code sessions.** Eight were not the session doing the work;
  they dated from Oct 4 and Oct 8 and each had 22-26 minutes of accumulated CPU,
  so they had done real work and then been left open. With their MCP servers and
  `cmd` wrappers that came to **133 processes and about 1.15 GB**.
- **289 MB of build and test output** in `.next` (234 MB) and `test-results`
  (55 MB). Both are gitignored, so `git status` reports a clean tree while they
  sit there, and a stale `.next` is the known cause of smoke failing with
  `SyntaxError: Unexpected end of JSON input`.

None of this is visible from the repo. A sprint can pass every gate with a clean
`git status` on a machine that has no headroom left, which is exactly how
Playwright started timing out at its default worker count.

## What this sprint adds

Two commands and one habit.

1. **`pnpm clean`** deletes regenerable build and test output and reports what it
   freed. Safe by construction: it only touches paths on an allow-list.
2. **`pnpm health`** reports, and changes nothing: free memory, the regenerable
   output sitting on disk, and how many Claude Code sessions are running with
   which ones look stale.
3. **A close-out step in `sprint-workflow`**, so the check happens every sprint
   rather than when someone remembers.

## The decisions behind it

**Disk is deleted automatically; processes are only ever reported.** A script
cannot tell a session someone is still using from one that was abandoned. The
only evidence available is age and CPU time, and both are circumstantial. Acting
on them would mean killing a long-running session out from under its owner, so
`doctor` prints the candidates and a human decides.

**Some output that looks like junk is not.** `.generated` holds the fact snapshot
the slides read their numbers from, and `pnpm facts` refuses to rewrite it while
the test suite is red, so deleting it can strand every carousel with no way back
until the suite is green. It is on the protected list with `node_modules`,
`.vercel` and `.superpowers`. This is why the allow-list is an allow-list.

**Not wired into CI.** These are local-machine concerns; the runner is fresh
every time. Only the pure rules are tested, in `qa/unit/meta/`.

## Shape

Follows the `arch-audit` split already in the repo: pure rules in
`scripts/lib/`, a thin CLI in `scripts/`.

- `scripts/lib/housekeeping.mjs` - `REGENERABLE`, `PROTECTED`,
  `isSafeToDelete()`, `staleSessions()`, `currentSessionPid()`
- `scripts/lib/disk-usage.mjs` - so both CLIs report one number per directory
- `scripts/clean.mjs`, `scripts/health.mjs` - the CLIs
- `qa/unit/meta/housekeeping.test.ts` - the rules
- `qa/config/playwright.config.mts` - caps local workers at 2
- `.agents/skills/sprint-workflow/SKILL.md` - the close-out step
- `.agents/skills/sprint-workflow/references/troubleshooting.md` - six local
  gotchas that were costing a session each time they were rediscovered

## Two things found while building it

**`pnpm doctor` is a pnpm built-in.** Named that way, the script was shadowed:
the command printed nothing and exited 0. Hence `pnpm health`, and a test that
fails if any script is named after a built-in.

**Identifying our own session by walking the process tree does not work on
Windows.** The shells in between exit, nothing reparents, and the walk dies on a
dangling ppid — so the report offered to kill the session that asked. Claude Code
exports `CLAUDE_PID`; read that, and keep the walk only as a fallback.

**The worker cap replaced a documented flag.** The known fix was to remember
`--workers=2` on every local smoke run. Putting it in the config means
`pnpm test:smoke` just works, which matters because AGENTS.md says to use the
`pnpm test:*` scripts. CI keeps the default; `PW_WORKERS` overrides.

## Done when

`pnpm clean` and `pnpm health` both run, the rules are covered by unit tests, the
sprint skill tells the next agent to run them, and `tsc`, lint, arch and the
unit, integration and browser suites are green.
