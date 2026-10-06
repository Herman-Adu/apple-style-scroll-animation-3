import { test } from "@playwright/test"
import { adminCredentialsFromEnv, openSignedInAdminPage } from "./admin-session"
import { beat, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/** Clip 4, discount codes, offers and saved message templates. Needs the seeded demo data and admin env. */
const credentials = adminCredentialsFromEnv()

test("clip: discounts and message templates", async ({ context }) => {
  test.skip(!credentials, "Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD to record the admin clips")
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
