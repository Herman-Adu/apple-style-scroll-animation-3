import { test } from "@playwright/test"
import { beat, saveClip, smoothScroll } from "./clip"

/**
 * Clip B, admin: sign in, email templates, a template editor, permissions.
 * Needs a real admin account, supplied only through env so no credentials are
 * committed. Skipped when QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD are not set.
 */
const email = process.env.QA_ADMIN_EMAIL
const password = process.env.QA_ADMIN_PASSWORD

test("clip: admin email editor", async ({ page }) => {
  test.skip(!email || !password, "Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD to record the admin clip")

  await page.goto("/sign-in?redirect=/admin/email/templates", { waitUntil: "networkidle" })
  await page.locator('input[type="email"]').fill(email!)
  await page.locator('input[type="password"]').fill(password!)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL("**/admin/email/templates", { timeout: 30_000 })
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
