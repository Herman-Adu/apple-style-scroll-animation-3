/**
 * Changelog coverage: does the What's New doc record every sprint that merged?
 *
 * `docs/next-steps.md` is the repo's source of truth for what is on `main`, and
 * its sprint ledger gains a row with a PR number and merge SHA immediately after
 * every squash merge. These helpers read that ledger so the guard in
 * `qa/unit/docs/changelog-coverage.test.ts` derives the answer instead of
 * comparing against a list of PR numbers written by hand — a list can only check
 * the past, which is how the page drifted for eleven sprints after S37.
 *
 * Everything here is pure: markdown comes in as a string and data goes out, so
 * the domain layer keeps its no-filesystem rule and only the test touches disk.
 */

/** One row of the sprint ledger table. */
export type LedgerRow = {
  /** The sprint column verbatim: `S41`, `S25a`, `W26`, `D1`, `Locks`, `SEC1`. */
  sprint: string
  /** Every PR reference in the row, with the `#`, in the order written. */
  prs: string[]
  /** Every merge SHA in the row, without backticks, in the order written. */
  shas: string[]
}

/**
 * The sprint from which What's New must record every merged sprint.
 *
 * S37 (#170) was a docs-audit sprint that brought the changelog current, so S38
 * is the first sprint that should have been recorded and was not. Sprints before
 * the floor stay as a curated changelog grouped by theme, which deliberately
 * summarises internal churn (ledger syncs, continuity guards, refactor steps)
 * rather than listing every PR. A test pins this value, so raising the floor to
 * silence the guard shows up in a diff.
 */
export const CHANGELOG_COVERAGE_FLOOR = 38

const LEDGER_HEADING = "## Sprint ledger"
const SNAPSHOT_HEADING = "## Current handoff snapshot"
const SPRINT_ID = /^S(\d+)[a-z]?$/
const SNAPSHOT_SPRINT = /`main` is at (S\d+[a-z]?)/
const SEPARATOR_CELL = /^-{3,}$/

/**
 * The body of a `## ` section, or the whole document when that heading is
 * absent — which keeps these helpers usable against a small inline fixture.
 */
function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading)
  if (start === -1) return markdown
  const body = markdown.slice(start + heading.length)
  const end = body.indexOf("\n## ")
  return end === -1 ? body : body.slice(0, end)
}

/** Rows of the sprint ledger table, header and separator dropped. */
export function parseSprintLedger(markdown: string): LedgerRow[] {
  return section(markdown, LEDGER_HEADING)
    .split("\n")
    .filter((line) => line.trimStart().startsWith("|"))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
      const [sprint = "", prCell = "", shaCell = ""] = cells
      return {
        sprint,
        prs: prCell.match(/#\d+/g) ?? [],
        shas: (shaCell.match(/`[0-9a-f]{7,40}`/g) ?? []).map((sha) =>
          sha.replaceAll("`", ""),
        ),
      }
    })
    .filter(
      (row) =>
        row.sprint !== "" &&
        row.sprint !== "Sprint" &&
        !SEPARATOR_CELL.test(row.sprint),
    )
}

/**
 * The number of an `S`-series sprint, suffix and all (`S25a` is 25), or `null`
 * for the documentation (`D1`), security (`SEC1`), week (`W26`) and `Locks`
 * series, which the changelog covers by theme rather than one row per sprint.
 */
export function sprintNumber(sprint: string): number | null {
  const match = SPRINT_ID.exec(sprint)
  return match ? Number(match[1]) : null
}

/** The highest-numbered `S`-series row, independent of the order written. */
export function newestLedgerSprint(rows: LedgerRow[]): LedgerRow | null {
  return rows
    .filter((row) => sprintNumber(row.sprint) !== null)
    .reduce<LedgerRow | null>(
      (newest, row) =>
        newest === null ||
        sprintNumber(row.sprint)! > sprintNumber(newest.sprint)!
          ? row
          : newest,
      null,
    )
}

/** True when the changelog mentions this PR and not merely a longer number. */
function mentionsPr(changelogText: string, pr: string): boolean {
  return new RegExp(`${pr}(?!\\d)`).test(changelogText)
}

/**
 * Ledger rows at or after the floor whose PRs are recorded nowhere in the
 * changelog. A sprint counts as recorded when any one of its PRs is mentioned,
 * because a sprint that merged as two PRs tells one story.
 */
export function missingChangelogSprints(
  rows: LedgerRow[],
  changelogText: string,
  floor: number = CHANGELOG_COVERAGE_FLOOR,
): LedgerRow[] {
  return rows.filter((row) => {
    const number = sprintNumber(row.sprint)
    if (number === null || number < floor || row.prs.length === 0) return false
    return !row.prs.some((pr) => mentionsPr(changelogText, pr))
  })
}

/** The sprint the handoff snapshot claims `main` is at, or `null`. */
export function handoffSnapshotSprint(markdown: string): string | null {
  return SNAPSHOT_SPRINT.exec(section(markdown, SNAPSHOT_HEADING))?.[1] ?? null
}
