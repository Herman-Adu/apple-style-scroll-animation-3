import { test } from "./fixtures"
import { beat, saveClip, scrollToBottom, showCaption, visit } from "./clip"
import { getClip } from "./shot-list"

/** Clip 6, engineering proof for recruiters: the public docs site and the quality page. No login needed. */
test("clip: engineering proof", async ({ page }) => {
  const [docsCaption, rulesCaption, numbersCaption] = getClip("engineering").captions

  await visit(page, "/docs")
  await showCaption(page, docsCaption)
  await beat(page, 2600)

  await visit(page, "/docs/engineering-quality")
  await showCaption(page, rulesCaption)
  await beat(page, 2400)
  await showCaption(page, numbersCaption)
  await scrollToBottom(page)
  await beat(page, 1800)

  await saveClip(page, "engineering")
})
