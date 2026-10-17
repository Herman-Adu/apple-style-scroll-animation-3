import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * The fixed cost of starting a session, and the guard that keeps it paid down.
 *
 * Every fresh terminal reads `docs/next-steps.md` at step 0 of
 * `.agents/skills/sprint-workflow/` - correctly; that is the design. But at the
 * end of S71 the file was 88.6 KB / 439 lines (~22k tokens) and **78% of it was
 * history**: sprint rows back to S0, the "current state" bullets that record
 * merges from S5 to S20, and three sections of sprint candidates, almost none of
 * which a session needs to begin. The share grew every sprint, so the cost of
 * opening any session grew with it.
 *
 * So the file is split by *how often it is read*, not by subject:
 *
 *  - `docs/next-steps.md` keeps what a session needs at step 0 - the handoff
 *    snapshot, the next-session block and the sprint protocol.
 *  - `docs/sprint-ledger.md` keeps the historical record, read only when
 *    someone asks about a past sprint.
 *
 * Three ways that split can quietly undo itself, one assertion each:
 *
 *  - A sprint adds its row to the file it already has open, and the ledger is
 *    in two places with two answers. The rows are therefore refused in
 *    `next-steps.md` by shape, not by count.
 *  - The history is moved but nothing points at it, so the next session cannot
 *    find it and rebuilds a summary in the file it can see.
 *  - The snapshot regrows. S71's own ledger row ran to 400 words and its
 *    snapshot bullet to 4.7 KB, each describing a sprint the PR body already
 *    describes in full - one sprint written out in five places. The budget
 *    below is what makes "two sentences and a SHA" enforceable rather than a
 *    preference.
 *
 * The budget is deliberately loose: it is there to catch a file drifting back
 * toward 439 lines, not to police a paragraph. Raising it is allowed and shows
 * up in a diff, which is the point - S71's floor on the changelog guard is
 * pinned the same way.
 */
const NEXT_STEPS = "docs/next-steps.md";
const SPRINT_LEDGER = "docs/sprint-ledger.md";

const read = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");
const lines = (source: string) => source.replace(/\r\n/g, "\n").split("\n");

/**
 * A ledger row: `| S71    | #237     | \`6f0a8e7\` | ...`. Matched by shape so
 * the rule holds for a series this repo has not used yet - the ledger already
 * carries `Locks`, `D1`-`D6`, `W26`, `SEC1` and `S25a` alongside the S-series.
 */
const LEDGER_ROW = /^\|\s*(?:Locks|[A-Z]{1,3}\d+[a-z]?)\s*\|/;

/** What a session pays to read before it has done anything. ~100 lines after S72's split. */
const MAX_NEXT_STEPS_LINES = 150;
const MAX_NEXT_STEPS_BYTES = 20_000;

describe("the historical ledger", () => {
  it("lives in its own file", () => {
    expect(
      existsSync(join(REPO_ROOT, SPRINT_LEDGER)),
      `${SPRINT_LEDGER} is the home of the sprint ledger from S72 on`,
    ).toBe(true);
  });

  it("keeps the table, header row and all", () => {
    const ledger = read(SPRINT_LEDGER);
    expect(ledger).toContain("## Sprint ledger");
    expect(ledger).toContain("| Sprint | PR");
    // The rows the split must not have dropped: the oldest, the newest, and the
    // two out-of-sequence series that sit after them.
    expect(lines(ledger).filter((line) => LEDGER_ROW.test(line)).length).toBeGreaterThan(60);
    expect(ledger).toContain("| Locks  | #83");
    expect(ledger).toContain("| SEC2   | #124");
  });

  it("carries the merge history out of next-steps.md, so there is one answer and not two", () => {
    const stray = lines(read(NEXT_STEPS))
      .map((line, index) => ({ line: index + 1, text: line.slice(0, 40) }))
      .filter(({ text }) => LEDGER_ROW.test(text));
    expect(
      stray,
      `a ledger row belongs in ${SPRINT_LEDGER}:\n${JSON.stringify(stray, null, 1)}`,
    ).toEqual([]);
  });
});

describe("docs/next-steps.md", () => {
  it("names the file the history moved to, so a session can still find it", () => {
    // Without this line the split is a deletion as far as the next session is
    // concerned. `doc-paths.test.ts` then checks the path resolves.
    expect(read(NEXT_STEPS)).toContain(SPRINT_LEDGER);
  });

  it(`stays under ${MAX_NEXT_STEPS_LINES} lines and ${MAX_NEXT_STEPS_BYTES} bytes`, () => {
    const source = read(NEXT_STEPS);
    const measured = {
      lines: lines(source).length,
      bytes: Buffer.byteLength(source, "utf8"),
    };
    // Print what was measured rather than only failing: 439 lines and 88,594
    // bytes is where this started, and the number is the whole point (S60).
    expect(measured, JSON.stringify(measured)).toEqual({
      lines: expect.any(Number),
      bytes: expect.any(Number),
    });
    expect(measured.lines, JSON.stringify(measured)).toBeLessThanOrEqual(MAX_NEXT_STEPS_LINES);
    expect(measured.bytes, JSON.stringify(measured)).toBeLessThanOrEqual(MAX_NEXT_STEPS_BYTES);
  });

  it("keeps the state a session reads at step 0", () => {
    const nextSteps = read(NEXT_STEPS);
    expect(nextSteps).toContain("## Current handoff snapshot");
    expect(nextSteps).toContain("### Next session starts here");
  });
});

describe("docs/sprint-ledger.md", () => {
  it("does not restate the current state, which is next-steps.md's job", () => {
    // The reverse of the stray-row rule. Two files claiming what `main` is at
    // is the drift the five-places problem is made of.
    const ledger = read(SPRINT_LEDGER);
    expect(ledger).not.toContain("## Current handoff snapshot");
    expect(ledger).not.toContain("### Next session starts here");
  });

  it("points back at the file that holds the current state", () => {
    expect(read(SPRINT_LEDGER)).toContain(NEXT_STEPS);
  });
});
