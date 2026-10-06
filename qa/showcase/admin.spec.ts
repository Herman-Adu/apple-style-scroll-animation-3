import { test } from "@playwright/test"
import { adminCredentialsFromEnv, openSignedInAdminPage } from "./admin-session"
import { beat, saveClip, smoothScroll } from "./clip"

/**
 * Admin clip: email templates, a template editor, permissions. Needs a real admin
 * account supplied only through env, so no credentials are committed. Skipped when
 * QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD are not set.
 */
const credentials = adminCredentialsFromEnv()

test("clip: admin email editor", async ({ context }) => {
  test.skip(!credentials, "Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD to record the admin clip")

  const page = await openSignedInAdminPage(context, credentials!, "/admin/email/templates")
  await beat(page, 1500)

  const firstTemplate = page.locator('a[href^="/admin/email/templates/"]').first()
  if (await firstTemplate.count()) {
    await firstTemplate.click()
    await page.waitForLoadState("networkidle")
    await beat(page, 1500)
    await smoothScroll(page, 900, 12)
    await beat(page)
  }

  await page.goto("/admin/settings/permissions", { waitUntil: "networkidle" })
  await beat(page, 2000)

  await saveClip(page, "admin")
})
