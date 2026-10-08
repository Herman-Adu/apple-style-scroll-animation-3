import { test } from "@playwright/test"
import { beat, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/** Clip 6, engineering proof for recruiters: the public docs site and the quality page. No login needed. */
test("clip: engineering proof", async ({ page }) => {
  const [docsCaption, rulesCaption, numbersCaption] = getClip("engineering").captions

  await page.goto("/docs", { waitUntil: "networkidle" })
  await showCaption(page, docsCaption)
  await beat(page, 2600)

  await page.goto("/docs/engineering-quality", { waitUntil: "networkidle" })
  await showCaption(page, rulesCaption)
  await beat(page, 2400)
  await showCaption(page, numbersCaption)
  await scrollToBottom(page)
  await beat(page, 1800)

  await saveClip(page, "engineering")
})
