import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { factsSchema } from "../../features/showcase/lib/domain/facts"
import {
  EXPORT_MANIFEST_FILE,
  exportManifestRecord,
  exportManifestSchema,
  exportPlanItems,
  mergeExportManifest,
  type ExportRecord,
} from "../../features/showcase/lib/domain/export-manifest"
import { signatureOverruns } from "./slide-geometry"

const publicPath = (file: string) => path.join(process.cwd(), "public", file)

/**
 * The facts the render is reading. `.generated/facts.json` is the file the
 * route loads, not the committed snapshot, so this records what was actually
 * drawn: run the export against an older generated file and the manifest says
 * so, which is what `qa/smoke/export-freshness.spec.ts` then reports.
 *
 * Read before the first render rather than per file, and fatal when missing: a
 * fact-bound slide renders a dash without it, and a run that exported dashes
 * while recording numbers would be a manifest that lies.
 */
const renderFacts = (() => {
  const file = path.join(process.cwd(), ".generated", "facts.json")
  if (!existsSync(file)) throw new Error(`${file} is missing. Run \`pnpm facts\` first, or use \`pnpm showcase:assets\`.`)
  return factsSchema.parse(JSON.parse(readFileSync(file, "utf8")))
})()

/** Only files this run actually wrote. Nothing else may ever enter the manifest. */
const rendered: Record<string, ExportRecord> = {}

async function waitForAssets(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('[data-slide-diagram="pending"]').length === 0)
  await expect(page.locator('[data-slide-diagram="error"]')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    // Multi-page PDFs stack slides below the one-slide viewport, so lazy images there would never load.
    await Promise.all(
      Array.from(document.images).map((img) => {
        img.loading = "eager"
        if (img.complete) return Promise.resolve()
        return new Promise((done) => {
          img.addEventListener("load", done, { once: true })
          img.addEventListener("error", done, { once: true })
        })
      }),
    )
  })
}

/** Assets live one folder per audience or topic, so each file makes its own. */
function ensureDir(file: string) {
  mkdirSync(path.dirname(publicPath(file)), { recursive: true })
}

for (const item of exportPlanItems()) {
  test(`export ${item.file}`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height })
    await page.goto(`/showcase-render/${item.asset}`, { waitUntil: "networkidle" })
    await expect(page.locator("[data-social-asset]").first()).toBeVisible()
    await waitForAssets(page)
    expect(await signatureOverruns(page)).toEqual([])
    // The export runs against `next dev`, whose dev-tools badge would otherwise be baked into the PNG.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })

    ensureDir(item.file)
    if (item.kind === "png") {
      await page.screenshot({ path: publicPath(item.file), clip: { x: 0, y: 0, width: item.width, height: item.height } })
      rendered[item.file] = exportManifestRecord(item.asset, renderFacts)
      return
    }

    await page.emulateMedia({ media: "screen" })
    // Sub-pixel overflow can spill into a blank trailing page, so print exactly one page per slide.
    const slideCount = await page.locator("[data-social-asset]").count()
    await page.pdf({
      pageRanges: `1-${slideCount}`,
      path: publicPath(item.file),
      width: `${item.width}px`,
      height: `${item.height}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    rendered[item.file] = exportManifestRecord(item.asset, renderFacts)
  })
}

/**
 * The record of what was drawn, written once at the end of the run.
 *
 * Only files that reached the line above are in it; a file whose export failed,
 * or that a `--grep` never reached, keeps whatever record it had, and therefore
 * keeps whatever staleness it had. That is deliberate - the manifest is
 * evidence of a render, so nothing may add to it except a render.
 */
test.afterAll(() => {
  const file = path.join(process.cwd(), EXPORT_MANIFEST_FILE)
  const existing = existsSync(file) ? exportManifestSchema.parse(JSON.parse(readFileSync(file, "utf8"))) : null
  writeFileSync(file, `${JSON.stringify(mergeExportManifest(existing, rendered), null, 2)}\n`)
  console.log(`Recorded ${Object.keys(rendered).length} exports in ${EXPORT_MANIFEST_FILE}`)
})
