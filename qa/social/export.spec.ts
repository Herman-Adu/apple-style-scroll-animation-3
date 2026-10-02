import { mkdirSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { exportPlan } from "../../features/showcase/social/assets"

const publicPath = (file: string) => path.join(process.cwd(), "public", file)

async function waitForAssets(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((done) => img.addEventListener("load", done, { once: true })),
      ),
    )
  })
}

test.beforeAll(() => {
  mkdirSync(publicPath("/showcase/social"), { recursive: true })
})

for (const item of exportPlan()) {
  test(`export ${item.file}`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: item.height })
    await page.goto(`/showcase-render/${item.asset}`, { waitUntil: "networkidle" })
    await expect(page.locator("[data-social-asset]").first()).toBeVisible()
    await waitForAssets(page)

    if (item.kind === "png") {
      await page.screenshot({ path: publicPath(item.file), clip: { x: 0, y: 0, width: item.width, height: item.height } })
      return
    }

    await page.emulateMedia({ media: "screen" })
    await page.pdf({
      path: publicPath(item.file),
      width: `${item.width}px`,
      height: `${item.height}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
  })
}
