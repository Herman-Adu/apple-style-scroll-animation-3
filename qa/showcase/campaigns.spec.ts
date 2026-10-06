import { test } from "@playwright/test"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { beat, clearCaption, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/**
 * Clip 3, email campaigns: the campaign list, then one campaign opened. Needs the
 * seeded demo data (pnpm showcase:seed) and an admin account supplied through env.
 */
const credentials = adminCredentials()

test("clip: email campaigns", async ({ context }) => {
  test.skip(!credentials, "Run pnpm showcase:seed -- --confirm (or set QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD) to record admin clips")
  const [introCaption, openCaption, statsCaption] = getClip("campaigns").captions

  const page = await openSignedInAdminPage(context, credentials!, "/admin/email/campaigns")
  await showCaption(page, introCaption)
  await beat(page, 2600)

  const firstCampaign = page.locator('a[href^="/admin/email/campaigns/"]').first()
  if (await firstCampaign.count()) {
    await showCaption(page, openCaption)
    await beat(page, 1500)
    await firstCampaign.click()
    await page.waitForLoadState("networkidle")
    await beat(page, 1800)
    await showCaption(page, statsCaption)
    await scrollToBottom(page, 24)
    await beat(page, 1800)
  }
  await clearCaption(page)

  await saveClip(page, "campaigns")
})
