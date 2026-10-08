import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { expect, test } from "./fixtures"
import { beat, clearCaption, saveClip, scrollToBottom, showCaption, visit } from "./clip"
import { FRAME_SEQUENCE_SECTIONS, getClip } from "./shot-list"

/**
 * Clip 1, storefront tour: the home page scrolled all the way to the footer,
 * then a product page and the checkout. Product slug comes from the sitemap so
 * the clip follows the live catalogue.
 *
 * It signs in off camera first. Checkout is behind an account, so without a
 * session the last shot is a sign-in wall under a caption promising a checkout —
 * which is exactly what shipped before `visit` started refusing to film it.
 */
const credentials = adminCredentials()

test("clip: storefront journey", async ({ context, request }) => {
  test.skip(!credentials, "The last shot is the checkout, which needs an account. Run pnpm showcase:seed -- --confirm")
  const [homeCaption, productCaption, checkoutCaption] = getClip("storefront").captions

  const sitemap = await (await request.get("/sitemap.xml")).text()
  const productUrl = sitemap.match(/<loc>([^<]*\/products\/[^<]+)<\/loc>/)?.[1]
  expect(productUrl, "a product URL in sitemap").toBeTruthy()

  const page = await openSignedInAdminPage(context, credentials!, "/")
  await beat(page, 1500)
  await showCaption(page, homeCaption)
  await beat(page, 1800)
  await clearCaption(page)
  await scrollToBottom(page, { frameSequenceSelectors: FRAME_SEQUENCE_SECTIONS.home })
  await beat(page, 1500)

  await visit(page, new URL(productUrl!).pathname)
  await showCaption(page, productCaption)
  await beat(page, 2200)

  const addToCart = page.getByRole("button", { name: /add to cart|pre-order/i }).first()
  if (await addToCart.isEnabled()) {
    await addToCart.click()
    await beat(page, 1500)
  }

  await visit(page, "/checkout")
  await showCaption(page, checkoutCaption)
  await beat(page, 2800)

  await saveClip(page, "storefront")
})
