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
      if (msg.type() !== "error") return
      const text = msg.text()
      // Ignore missing Vercel Web Analytics script in local/dev environments
      if (text.includes("/_vercel/insights")) return
      errors.push(text)
    })

    const response = await page.goto(route, { waitUntil: "networkidle" })
    expect(response?.status(), `status for ${route}`).toBe(200)
    await expect(page.locator("main")).toBeVisible()
    expect(errors, `console errors on ${route}`).toEqual([])
  })
}

test("the scroll container is not position: static", async ({ page }) => {
  // Framer Motion measures every scroll-driven hero against the root element and
  // warns when it is static, because the offsets it reads are then unreliable. In
  // dev that warning also turns the Next.js indicator into a red "1 Issue" badge,
  // which was landing in the recorded demo clips.
  await page.goto("/", { waitUntil: "networkidle" })
  const position = await page.evaluate(() => getComputedStyle(document.documentElement).position)
  expect(position).not.toBe("static")
})

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
