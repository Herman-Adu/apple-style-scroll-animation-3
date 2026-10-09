import { mkdirSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { packExportPlan } from "../../features/showcase/lib/domain/packs"
import { exportPlan } from "../../features/showcase/lib/domain/social-assets"

const publicPath = (file: string) => path.join(process.cwd(), "public", file)

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

/**
 * No slide may draw its content over its own signature.
 *
 * This is how the old site map shipped — three columns of routes running under
 * the AduDev footer. The check lives here because the export already renders
 * every slide with its fonts settled, so it costs nothing and makes it
 * impossible to publish an overflowing page.
 *
 * The obvious check, `scrollHeight > clientHeight` on the frame, does not see
 * it: the frame is `overflow-hidden` and the body is a flex child, so both
 * heights stay equal at 1350 while content sits 88px past the footer.
 */
async function expectNothingOverTheSignature(page: Page) {
  const overruns = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-social-asset]")).flatMap((slide) => {
      const footer = slide.querySelector("footer")
      if (!footer) return []
      const footerTop = footer.getBoundingClientRect().top
      let worst = { what: "", over: Number.NEGATIVE_INFINITY }
      for (const node of Array.from(slide.querySelectorAll("*"))) {
        if (node === footer || footer.contains(node)) continue
        const box = node.getBoundingClientRect()
        if (box.height === 0) continue
        const over = box.bottom - footerTop
        if (over > worst.over) worst = { what: node.tagName.toLowerCase(), over: Math.round(over) }
      }
      return worst.over > 0
        ? [`${slide.getAttribute("data-social-asset")}: ${worst.what} overruns the footer by ${worst.over}px`]
        : []
    }),
  )
  expect(overruns).toEqual([])
}

/** Assets live one folder per audience or topic, so each file makes its own. */
function ensureDir(file: string) {
  mkdirSync(path.dirname(publicPath(file)), { recursive: true })
}

for (const item of [...exportPlan(), ...packExportPlan()]) {
  test(`export ${item.file}`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height })
    await page.goto(`/showcase-render/${item.asset}`, { waitUntil: "networkidle" })
    await expect(page.locator("[data-social-asset]").first()).toBeVisible()
    await waitForAssets(page)
    await expectNothingOverTheSignature(page)
    // The export runs against `next dev`, whose dev-tools badge would otherwise be baked into the PNG.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })

    ensureDir(item.file)
    if (item.kind === "png") {
      await page.screenshot({ path: publicPath(item.file), clip: { x: 0, y: 0, width: item.width, height: item.height } })
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
  })
}
