import { readFileSync } from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"
import { exportManifestSchema, staleExports, compareExports, EXPORT_MANIFEST_FILE } from "../../features/showcase/lib/domain/export-manifest"
import { facts } from "../../lib/facts"

/**
 * The other half of the facts guard.
 *
 * `facts-freshness.spec.ts` recounts the committed snapshot, so a wrong number
 * cannot stay in the repo. It says nothing about the images beside the post.
 * A docs page resolves its numbers when it renders; a slide bakes them into a
 * PNG or a PDF the day it is exported, and the launch pack tells the owner to
 * attach those images to the post whose text reads the live facts. S48 shipped
 * five PDFs with the wrong figure drawn on them. By S64, eight files were
 * quoting the Oct 9 snapshot - `recruiter/proof.png` printed "Automated tests
 * 1,617" under a column headed TODAY, beneath "Measured on every run, not
 * claimed", while the real count was 1,830.
 *
 * `public/showcase/export-manifest.json` records, per published file, the value
 * of every fact drawn on it at the moment it was rendered. This compares that
 * to the facts now. Per file and per fact, not per snapshot: 65 of the 73
 * exports draw no facts at all, and `shared/before-after.png` draws four that
 * have read 0/0/0/32 since S43. A whole-snapshot comparison would demand a
 * re-export of all 73 every time one unit test was added, and a guard that
 * cries wolf ends up with an allow-list.
 *
 * ## Why this is a browser test and not a unit test
 *
 * `scripts/facts.mjs:38` abandons the run if Vitest fails, and
 * `pnpm showcase:assets` is `pnpm facts && playwright test`. A unit guard over
 * the real files would therefore block the only command that repairs it - the
 * deadlock `facts-freshness.spec.ts` already avoids for the same reason.
 * `pnpm facts` only *lists* Playwright tests, so a red test here never stops
 * the fix. The pure rules this leans on are unit-tested in
 * `qa/unit/showcase/export-manifest.test.ts`, where they cannot deadlock
 * because they never read the real manifest.
 *
 * In CI this is stronger than it is locally: the `app` job runs `pnpm facts`
 * immediately before `pnpm test:smoke` (`.github/workflows/ci.yml:85`), so the
 * manifest is compared against numbers measured from the tree in that run
 * rather than against a snapshot a branch committed.
 */
const REPO_ROOT = path.join(__dirname, "..", "..")

const manifest = exportManifestSchema.parse(
  JSON.parse(readFileSync(path.join(REPO_ROOT, EXPORT_MANIFEST_FILE), "utf8")),
)

test("every committed showcase export still agrees with the facts drawn on it", () => {
  const compared = compareExports(manifest, facts)
  const drawing = compared.filter((row) => row.compared.length > 0)

  // Printed on a pass as well as a failure. A guard that measures has to be
  // shown measuring the right thing, and "73 files checked" is not evidence
  // when only eight of them carry a number that can go stale.
  console.log(
    [
      `Facts snapshot generated ${facts.generatedAt}`,
      `${compared.length} published exports, ${drawing.length} of them drawing a comparable fact.`,
      "Coverage is recorded in the manifest but never compared: it measures a run, not the repo, and CI's platform moves it.",
      ...drawing.map(
        (row) =>
          `  ${row.file}\n    rendered from ${row.renderedFrom}\n` +
          row.compared
            .map((c) => `    ${c.key}: rendered ${c.rendered}, now ${c.current}${c.rendered === c.current ? "" : "  <- MOVED"}`)
            .join("\n"),
      ),
    ].join("\n"),
  )

  // Asserted before the comparison: an empty plan, or a manifest that matched
  // nothing in it, would otherwise agree with any set of files at all.
  expect(compared.length, "published exports to check").toBeGreaterThan(50)
  expect(drawing.length, "exports drawing at least one fact").toBeGreaterThan(0)

  const stale = staleExports(manifest, facts)
  expect(
    stale.map((row) => `${row.file}: ${row.problems.join("; ")}`),
    "committed exports drawn from facts that have since moved — re-export with `pnpm showcase:assets`",
  ).toEqual([])
})
