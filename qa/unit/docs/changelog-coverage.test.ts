import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import {
  CHANGELOG_COVERAGE_FLOOR,
  handoffSnapshotSprint,
  missingChangelogSprints,
  newestLedgerSprint,
  parseSprintLedger,
  sprintNumber,
} from "@/features/docs/lib/domain/changelog";
import { docText } from "@/features/docs/lib/domain/freshness";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * The two halves of the repo's record of itself, and they are two files since
 * S72: `docs/sprint-ledger.md` holds the merge history, `docs/next-steps.md`
 * holds what is on `main` right now. The changelog is checked against the
 * ledger rather than against a list of PR numbers written by hand, because a
 * hand-written list can only ever check the past - the page drifted for eleven
 * sprints after S37 because nothing failed when a sprint shipped without an
 * entry.
 *
 * Reading both by path is what the split made explicit here. Before S72 one
 * file answered both questions, so the assertion that the snapshot names the
 * newest row was comparing a file with itself.
 */
const LEDGER = readFileSync(join(REPO_ROOT, "docs/sprint-ledger.md"), "utf8");
const SNAPSHOT = readFileSync(join(REPO_ROOT, "docs/next-steps.md"), "utf8");

const FIXTURE = `## Sprint ledger

| Sprint | PR       | Merge SHA            | What shipped |
| ------ | -------- | -------------------- | ------------ |
| Locks  | #83      | \`df311b7\`            | Lock permissions |
| D1     | #84      | \`a0fd4bb\`            | Security posture |
| S2     | #92, #93 | \`0f29299\`, \`2475fbe\` | Two merges in one sprint |
| S25a   | #153     | \`e4a143d\`            | Troubleshooting |
| W26    | #157     | \`4853540\`            | Generated facts |
| S41    | #177     | \`8155f9a\`            | Recordings pace by distance |
| S0     | archived | archived             | Historical placeholder |
`;

describe("sprint ledger parsing", () => {
  const rows = parseSprintLedger(FIXTURE);

  it("reads sprint, PR and merge SHA from each row", () => {
    expect(rows).toContainEqual({
      sprint: "S41",
      prs: ["#177"],
      shas: ["8155f9a"],
    });
  });

  it("keeps both references when a sprint merged as two PRs", () => {
    const s2 = rows.find((row) => row.sprint === "S2");
    expect(s2?.prs).toEqual(["#92", "#93"]);
    expect(s2?.shas).toEqual(["0f29299", "2475fbe"]);
  });

  it("skips the header and separator rows", () => {
    expect(rows.map((row) => row.sprint)).not.toContain("Sprint");
    expect(rows.map((row) => row.sprint)).not.toContain("------");
  });

  it("keeps the documentation and security series as rows", () => {
    expect(rows.map((row) => row.sprint)).toEqual([
      "Locks",
      "D1",
      "S2",
      "S25a",
      "W26",
      "S41",
      "S0",
    ]);
  });
});

describe("sprint numbering", () => {
  it("reads the number out of an S-series sprint, suffix and all", () => {
    expect(sprintNumber("S41")).toBe(41);
    expect(sprintNumber("S25a")).toBe(25);
    expect(sprintNumber("S0")).toBe(0);
  });

  it("has no number for the documentation, security and week series", () => {
    expect(sprintNumber("Locks")).toBeNull();
    expect(sprintNumber("D1")).toBeNull();
    expect(sprintNumber("W26")).toBeNull();
    expect(sprintNumber("SEC1")).toBeNull();
  });

  it("finds the newest S-series sprint regardless of row order", () => {
    expect(newestLedgerSprint(parseSprintLedger(FIXTURE))?.sprint).toBe("S41");
  });
});

describe("changelog coverage", () => {
  /**
   * S37 (#170) was the last sprint to bring What's New current, so S38 is the
   * first sprint that should have been recorded and was not. Pinned here so
   * raising the floor — which would weaken the guard — shows up in a diff.
   */
  it("covers every sprint from S38 onwards", () => {
    expect(CHANGELOG_COVERAGE_FLOOR).toBe(38);
  });

  it("reports a sprint whose PR is recorded nowhere in the changelog", () => {
    const missing = missingChangelogSprints(
      parseSprintLedger(FIXTURE),
      "the changelog mentions #177 only",
      25,
    );
    expect(missing.map((row) => row.sprint)).toEqual(["S25a"]);
  });

  it("counts a sprint as recorded when any of its PRs is mentioned", () => {
    const missing = missingChangelogSprints(
      parseSprintLedger(FIXTURE),
      "shipped in #92",
      2,
    );
    expect(missing.map((row) => row.sprint)).not.toContain("S2");
  });

  it("records every merged sprint from the floor onwards in What's New", () => {
    const whatsNew = docText(docs.find((doc) => doc.slug === "whats-new")!);
    const missing = missingChangelogSprints(parseSprintLedger(LEDGER), whatsNew);
    expect(
      missing.map((row) => `${row.sprint} (${row.prs.join(", ")})`),
    ).toEqual([]);
  });
});

describe("handoff snapshot", () => {
  it("reads the sprint the snapshot claims main is at", () => {
    expect(
      handoffSnapshotSprint(
        "## Current handoff snapshot (Oct 9, 2026)\n\n- `main` is at S48: PR #191 merged as `a2ef81c`.\n",
      ),
    ).toBe("S48");
  });

  it("names the newest sprint in the ledger, now that the two are separate files", () => {
    expect(handoffSnapshotSprint(SNAPSHOT)).toBe(
      newestLedgerSprint(parseSprintLedger(LEDGER))?.sprint,
    );
  });
});
