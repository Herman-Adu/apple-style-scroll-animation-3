import { expect, test } from "@playwright/test"

/**
 * Smoke: every primary route responds 200, renders its main landmark, and logs
 * no console errors. This is the repeatable version of the by-hand 200/render
 * checks — the first thing to run after any change.
 *
 * Detail routes derive their slug from the sitemap so the suite stays in sync
 * with the data source (local today, Strapi later) instead of hardcoding slugs.
 */
const staticRoutes = ["/", "/products", "/articles", "/about", "/contact"]

for (const route of staticRoutes) {
  test(`GET ${route} renders without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    const response = await page.goto(route, { waitUntil: "networkidle" })
    expect(response?.status(), `status for ${route}`).toBe(200)
    await expect(page.locator("main")).toBeVisible()
    expect(errors, `console errors on ${route}`).toEqual([])
  })
}

test("a product and an article detail page render", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  const articleUrl = sitemap.match(/<loc>([^<]*\/articles\/[^<]+)<\/loc>/)?.[1]

  expect(productUrl, "a product URL in sitemap").toBeTruthy()
  expect(articleUrl, "an article URL in sitemap").toBeTruthy()

  for (const url of [productUrl!, articleUrl!]) {
    const path = new URL(url).pathname
    const response = await page.goto(path, { waitUntil: "networkidle" })
    expect(response?.status(), `status for ${path}`).toBe(200)
    await expect(page.locator("main")).toBeVisible()
  }
})
