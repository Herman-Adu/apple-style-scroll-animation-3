import { expect, test } from "./fixtures"
import { beat, clearCaption, saveClip, scrollToBottom, showCaption } from "./clip"
import { installIdentityMask } from "./real-identities"
import { FRAME_SEQUENCE_SECTIONS, getClip } from "./shot-list"

/**
 * Clip 1, storefront tour: the home page scrolled all the way to the footer,
 * then a product page and the checkout. Product slug comes from the sitemap so
 * the clip follows the live catalogue.
 */
test("clip: storefront journey", async ({ page, request }) => {
  const [homeCaption, productCaption, checkoutCaption] = getClip("storefront").captions

  // The product page carries review authors, so real reviewers get a stand-in.
  await installIdentityMask(page.context())

  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  expect(productUrl, "a product URL in sitemap").toBeTruthy()

  await page.goto("/", { waitUntil: "networkidle" })
  await beat(page, 1500)
  await showCaption(page, homeCaption)
  await beat(page, 1800)
  await clearCaption(page)
  await scrollToBottom(page, { frameSequenceSelectors: FRAME_SEQUENCE_SECTIONS.home })
  await beat(page, 1500)

  await page.goto(new URL(productUrl!).pathname, { waitUntil: "networkidle" })
  await showCaption(page, productCaption)
  await beat(page, 2200)

  const addToCart = page.getByRole("button", { name: /add to cart|pre-order/i }).first()
  if (await addToCart.isEnabled()) {
    await addToCart.click()
    await beat(page, 1500)
  }

  await page.goto("/checkout", { waitUntil: "networkidle" })
  await showCaption(page, checkoutCaption)
  await beat(page, 2800)

  await saveClip(page, "storefront")
})
