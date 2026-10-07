import { test } from "@playwright/test"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { beat, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/** Clip 4, discount codes, offers and saved message templates. Needs the seeded demo data and admin env. */
const credentials = adminCredentials()

test("clip: discounts and message templates", async ({ context }) => {
  test.skip(!credentials, "Run pnpm showcase:seed -- --confirm (or set QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD) to record admin clips")
  const [codesCaption, kindsCaption, templatesCaption] = getClip("discounts").captions

  const page = await openSignedInAdminPage(context, credentials!, "/admin/discounts")
  await showCaption(page, codesCaption)
  await beat(page, 2400)
  await showCaption(page, kindsCaption)
  await scrollToBottom(page, 20)
  await beat(page, 1800)

  await page.goto("/admin/email/messages", { waitUntil: "networkidle" })
  await showCaption(page, templatesCaption)
  await beat(page, 2600)
  await scrollToBottom(page, 20)
  await beat(page, 1500)

  await saveClip(page, "discounts")
})
