import { z } from "zod"
import { FACT_KEYS, factRefsIn, resolveFact, type FactKey, type Facts } from "./facts"
import { getBriefByExportId, briefExportPlan } from "./briefs"
import { getInfographic, infographics } from "./infographics"
import { getPackByCarouselId, packExportPlan, packSlides } from "./packs"
import {
  CAROUSEL_ID,
  carouselSlides,
  exportPlan,
  getSocialAsset,
  socialAssets,
  type ExportItem,
  type SocialAsset,
} from "./social-assets"
import type { Infographic } from "./infographics"

/**
 * What each committed export in `public/showcase/` was rendered from.
 *
 * A docs page resolves its numbers when it renders; a slide bakes them into a
 * PNG or a PDF. So the snapshot guard (`qa/smoke/facts-freshness.spec.ts`)
 * keeps the numbers honest for everything live and does nothing at all for the
 * images beside the post. S48 shipped five PDFs with the wrong figure drawn on
 * them; by S64 eight files were quoting the Oct 9 snapshot under a column
 * headed TODAY, while the post text beside them read the live facts.
 *
 * The record is per file and holds only the facts that file actually draws, so
 * the guard is quiet about the sixty-five exports that draw none and about
 * `before-after.png`, which draws four facts that have all read the same value
 * since S43. A whole-snapshot record would demand a re-export of everything
 * every time one test was added, and a guard that cries wolf gets an
 * allow-list, which is the guard agreeing with the bug.
 *
 * Deliberately absent: anything that rebuilds the whole manifest from today's
 * facts. That would turn the guard green without re-rendering a file.
 * `mergeExportManifest` only ever takes records for files a run just wrote.
 */
export const EXPORT_MANIFEST_FILE = "public/showcase/export-manifest.json"

export const exportManifestSchema = z.object({
  exports: z.record(
    z.string(),
    z.object({
      /** `generatedAt` of the facts the file was rendered from. Provenance for a reader; the values below are what the guard compares. */
      renderedFrom: z.string(),
      /**
       * Any key, not only a current `FactKey`: a record written before a slide
       * was edited may name a fact nothing draws any more, and that is a
       * finding to report rather than a reason to refuse to read the file.
       */
      facts: z.record(z.string(), z.number()),
    }),
  ),
})

export type ExportManifest = z.infer<typeof exportManifestSchema>
export type ExportRecord = ExportManifest["exports"][string]

export type FactComparison = { key: FactKey; rendered: number | null; current: number | null }
export type ExportComparison = {
  file: string
  asset: string
  renderedFrom: string | null
  compared: FactComparison[]
  problems: string[]
}

/** Every file `pnpm showcase:assets` publishes: the slides, the pack carousels and the briefs. */
export function exportPlanItems(): ExportItem[] {
  return [...exportPlan(), ...packExportPlan(), ...briefExportPlan()]
}

/** The slides one export renders, in page order. The same resolution the render route uses. */
export function exportSlides(asset: string): (Infographic | SocialAsset)[] {
  if (asset === CAROUSEL_ID) return carouselSlides()
  const pack = getPackByCarouselId(asset) ?? getBriefByExportId(asset)
  if (pack) return packSlides(pack)
  const infographic = getInfographic(asset)
  if (infographic) return [infographic]
  const found = getSocialAsset(asset)
  return found ? [found] : []
}

/** Every fact the export's slides read, de-duplicated, in schema order. */
export function exportFactKeys(asset: string): FactKey[] {
  const drawn = new Set(exportSlides(asset).flatMap(factRefsIn))
  return FACT_KEYS.filter((key) => drawn.has(key))
}

/** What to write down about a file a render just produced. */
export function exportManifestRecord(asset: string, facts: Facts): ExportRecord {
  return {
    renderedFrom: facts.generatedAt,
    facts: Object.fromEntries(
      exportFactKeys(asset).flatMap((key) => {
        const value = resolveFact(facts, key)
        return value === null ? [] : [[key, value] as const]
      }),
    ),
  }
}

/**
 * The slides whose numbers come from facts, so the count stated in
 * `docs/showcase-pipeline.md` is read off the slides rather than retyped.
 */
export function factBoundSlides(): string[] {
  return [...socialAssets, ...infographics].filter((slide) => factRefsIn(slide).length > 0).map((slide) => slide.id)
}

/**
 * Every published file beside the facts it was rendered from. Returns a row per
 * file whether or not anything is wrong, because a guard that measures has to
 * be able to show what it measured.
 */
export function compareExports(manifest: ExportManifest, facts: Facts): ExportComparison[] {
  return exportPlanItems().map((item) => {
    const record = manifest.exports[item.file]
    const keys = exportFactKeys(item.asset)
    const compared = keys.map((key) => ({
      key,
      rendered: record?.facts[key] ?? null,
      current: resolveFact(facts, key),
    }))
    const extra = Object.keys(record?.facts ?? {}).filter((key) => !(keys as string[]).includes(key))

    return {
      file: item.file,
      asset: item.asset,
      renderedFrom: record?.renderedFrom ?? null,
      compared,
      problems: !record
        ? ["no record of the facts it was rendered from"]
        : [
            ...compared.flatMap(({ key, rendered, current }) =>
              rendered === null
                ? [`draws ${key}, which it was not rendered with`]
                : rendered === current
                  ? []
                  : [`${key} was ${rendered} when it was rendered, now ${current}`],
            ),
            ...extra.map((key) => `was rendered with ${key}, which it no longer draws`),
          ],
    }
  })
}

/** The published files that no longer agree with the facts drawn on them. Empty means the kit is current. */
export function staleExports(manifest: ExportManifest, facts: Facts): ExportComparison[] {
  return compareExports(manifest, facts).filter((row) => row.problems.length > 0)
}

/**
 * The manifest to commit after a run: the records the run produced, over
 * whatever was there before, minus any file the harness no longer publishes.
 *
 * A file the run did not render keeps its old record and therefore its
 * staleness, which is what makes a partial export safe to run.
 */
export function mergeExportManifest(
  existing: ExportManifest | null,
  recorded: Record<string, ExportRecord>,
): ExportManifest {
  const published = exportPlanItems().map((item) => item.file)
  const merged = { ...existing?.exports, ...recorded }
  return {
    exports: Object.fromEntries(
      published
        .filter((file) => merged[file])
        .sort()
        .map((file) => [file, merged[file]]),
    ),
  }
}
