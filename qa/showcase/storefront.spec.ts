import { expect, test } from "@playwright/test"
import { beat, saveClip, smoothScroll } from "./clip"

/**
 * Clip A, storefront: scroll animation, product page, add to cart, checkout.
 * Product slug comes from the sitemap so the clip follows the live catalogue.
 */
test("clip: storefront journey", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  expect(productUrl, "a product URL in sitemap").toBeTruthy()

  await page.goto("/", { waitUntil: "networkidle" })
  await beat(page, 1500)
  await smoothScroll(page, 2400)
  await beat(page)

  await page.goto(new URL(productUrl!).pathname, { waitUntil: "networkidle" })
  await beat(page)

  const addToCart = page.getByRole("button", { name: /add to cart|pre-order/i }).first()
  if (await addToCart.isEnabled()) {
    await addToCart.click()
    await beat(page, 1500)
  }

  await page.goto("/checkout", { waitUntil: "networkidle" })
  await beat(page, 2500)

  await saveClip(page, "storefront")
})
