import { expect, test } from "@playwright/test"

/**
 * SEO: asserts the machine-readable surfaces the SEO bundle produces stay
 * correct — sitemap, robots, RSS, canonical, OG image, and JSON-LD. These are
 * the outputs crawlers and social cards consume, all data-driven off the
 * feature api layer.
 */
test("sitemap.xml lists core routes and detail pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml")
  expect(res.status()).toBe(200)
  const xml = await res.text()
  expect(xml).toContain("<loc>")
  expect(xml).toMatch(/\/products\//)
  expect(xml).toMatch(/\/articles\//)
})

test("robots.txt allows crawling and points to the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt")
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body.toLowerCase()).toContain("sitemap:")
})

test("articles RSS feed is valid RSS 2.0", async ({ request }) => {
  const res = await request.get("/articles/rss.xml")
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"]).toContain("xml")
  const xml = await res.text()
  expect(xml).toContain("<rss")
  expect(xml).toContain("<channel>")
  expect(xml).toMatch(/<item>/)
})

test("home page exposes a canonical and OG image", async ({ page }) => {
  await page.goto("/")
  const canonical = page.locator('link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  const ogImage = page.locator('meta[property="og:image"]')
  await expect(ogImage).toHaveCount(1)
})

test("a product detail page emits Product JSON-LD", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  expect(productUrl).toBeTruthy()

  await page.goto(new URL(productUrl!).pathname)
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  const types = blocks.flatMap((b) => {
    const parsed = JSON.parse(b)
    return Array.isArray(parsed) ? parsed.map((n) => n["@type"]) : [parsed["@type"]]
  })
  expect(types).toContain("Product")
  expect(types).toContain("BreadcrumbList")
})

test("OG image endpoint returns a PNG", async ({ request }) => {
  const res = await request.get("/opengraph-image")
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"]).toContain("image/png")
})
