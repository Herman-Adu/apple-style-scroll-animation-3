import { expect, test } from "./fixtures"
import { beat, clearCaption, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/**
 * Clip 9, the rest of the site: About, Articles and Contact, the three pages no
 * other clip visited. Each page is scrolled at the one reading pace, so the
 * About timeline reveals itself on the way past; Contact waits for the store map.
 */
test("clip: the rest of the site", async ({ page }) => {
  const [aboutCaption, articlesCaption, contactCaption] = getClip("sitetour").captions

  await page.goto("/about", { waitUntil: "networkidle" })
  await beat(page, 1200)
  await showCaption(page, aboutCaption)
  await beat(page, 2000)
  await clearCaption(page)
  await scrollToBottom(page)
  await beat(page, 1000)

  await page.goto("/articles", { waitUntil: "networkidle" })
  await showCaption(page, articlesCaption)
  await beat(page, 2000)
  await clearCaption(page)
  await scrollToBottom(page)
  await beat(page, 1000)

  await page.goto("/contact", { waitUntil: "networkidle" })
  await showCaption(page, contactCaption)
  await beat(page, 1600)
  await clearCaption(page)
  await scrollToBottom(page)

  // The map is an embedded iframe, so hold on it until it has actually arrived.
  const map = page.locator("#studios iframe")
  await expect(map).toBeVisible()
  await map.scrollIntoViewIfNeeded()
  await beat(page, 2600)

  await saveClip(page, "sitetour")
})
