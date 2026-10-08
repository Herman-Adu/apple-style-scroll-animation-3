import { expect, test } from "./fixtures"
import { beat, clearCaption, jumpTo, saveClip, scrollToBottom, showCaption, visit } from "./clip"
import { FRAME_SEQUENCE_SECTIONS, getClip } from "./shot-list"

/**
 * Clip 9, the whole site in one take: the homepage scroll story, then About,
 * Articles and Contact. The homepage is paced exactly as the storefront clip
 * paces it, frame by frame through the canvas hero. The other three are scrolled
 * at the one reading pace, so the About timeline reveals itself on the way past;
 * Contact waits for the store map.
 */
test("clip: the rest of the site", async ({ page }) => {
  const [homeCaption, aboutCaption, articlesCaption, contactCaption] = getClip("sitetour").captions

  await visit(page, "/")
  await beat(page, 1500)
  await showCaption(page, homeCaption)
  await beat(page, 1800)
  await clearCaption(page)
  await scrollToBottom(page, { frameSequenceSelectors: FRAME_SEQUENCE_SECTIONS.home })
  await beat(page, 1500)

  await visit(page, "/about")
  await beat(page, 1200)
  await showCaption(page, aboutCaption)
  await beat(page, 2000)
  await clearCaption(page)
  await scrollToBottom(page)
  await beat(page, 1000)

  await visit(page, "/articles")
  await showCaption(page, articlesCaption)
  await beat(page, 2000)
  await clearCaption(page)
  await scrollToBottom(page)
  await beat(page, 1000)

  await visit(page, "/contact")
  await showCaption(page, contactCaption)
  await beat(page, 1600)
  await clearCaption(page)
  await scrollToBottom(page)

  // The map is an embedded iframe, so hold on it until it has actually arrived.
  const map = page.locator("#studios iframe")
  await expect(map).toBeVisible()
  await jumpTo(map)
  await beat(page, 2600)

  await saveClip(page, "sitetour")
})
