import { expect, test } from "@playwright/test"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { beat, clearCaption, saveClip, showCaption, smoothScroll } from "./clip"
import { CHECKOUT_DISCOUNT_CODE, getClip } from "./shot-list"

/**
 * Clip 2, checkout: add a product, apply a seeded discount code and watch the
 * total drop. It stops at the Stripe payment form, so no order is ever placed.
 */
const credentials = adminCredentials()

test("clip: checkout with a discount code", async ({ context, request }) => {
  test.skip(!credentials, "Checkout needs a signed-in shopper. Run pnpm showcase:seed -- --confirm first")
  const [addCaption, codeCaption, savedCaption, stripeCaption] = getClip("checkout").captions

  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  expect(productUrl, "a product URL in sitemap").toBeTruthy()

  const page = await openSignedInAdminPage(context, credentials!, new URL(productUrl!).pathname)
  await showCaption(page, addCaption)
  await beat(page, 1800)

  const addToCart = page.getByRole("button", { name: /add to cart|pre-order/i }).first()
  await expect(addToCart).toBeEnabled()
  await addToCart.click()
  await beat(page, 1500)
  await clearCaption(page)

  await page.goto("/checkout", { waitUntil: "networkidle" })
  await showCaption(page, codeCaption)
  await beat(page, 1500)

  await page.getByLabel("Discount code").pressSequentially(CHECKOUT_DISCOUNT_CODE, { delay: 120 })
  await beat(page, 600)
  await page.getByRole("button", { name: "Apply" }).click()
  await expect(page.getByText(/you saved/i).first()).toBeVisible({ timeout: 15_000 })

  await showCaption(page, savedCaption)
  await beat(page, 2600)

  await showCaption(page, stripeCaption)
  await smoothScroll(page, 600, 12)
  await beat(page, 2400)

  await saveClip(page, "checkout")
})
