import { test } from "@playwright/test"
import { adminCredentials, canSignInOnCamera } from "./admin-session"
import { installIdentityMask } from "./real-identities"
import { beat, clearCaption, saveClip, scrollToBottom, showCaption } from "./clip"
import { FRAME_SEQUENCE_SECTIONS, getClip } from "./shot-list"

/**
 * Clip 8, the whole journey in one take: the scroll story, signing in on camera,
 * then the admin dashboard, products, theme and docs. Signs in on camera, so it
 * only runs with the throwaway demo admin from `pnpm showcase:seed -- --confirm`;
 * the password field shows dots only.
 */
const credentials = adminCredentials()

test("clip: from scroll story to admin", async ({ page }) => {
  test.skip(!canSignInOnCamera(credentials), "The journey signs in on camera, so it needs the seeded demo admin")
  const [storyCaption, signInCaption, dashboardCaption, productsCaption, themeCaption, docsCaption] =
    getClip("journey").captions

  // This clip signs in on camera instead of going through openSignedInAdminPage,
  // so it installs the mask itself before the first page is loaded.
  await installIdentityMask(page.context())

  await page.goto("/", { waitUntil: "networkidle" })
  await showCaption(page, storyCaption)
  await beat(page, 1600)
  await clearCaption(page)
  await scrollToBottom(page, { frameSequenceSelectors: FRAME_SEQUENCE_SECTIONS.home })
  await beat(page, 800)

  await page.goto(`/sign-in?redirect=${encodeURIComponent("/admin")}`, { waitUntil: "networkidle" })
  await showCaption(page, signInCaption)
  await page.locator('input[type="email"]').pressSequentially(credentials!.email, { delay: 40 })
  await page.locator('input[type="password"]').pressSequentially(credentials!.password, { delay: 15 })
  await beat(page, 600)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL("**/admin", { timeout: 30_000 })
  await page.waitForLoadState("networkidle")

  await showCaption(page, dashboardCaption)
  await beat(page, 1800)
  await scrollToBottom(page)
  await beat(page, 800)

  await page.goto("/admin/products", { waitUntil: "networkidle" })
  await showCaption(page, productsCaption)
  await beat(page, 2400)

  await page.goto("/admin/theme", { waitUntil: "networkidle" })
  await showCaption(page, themeCaption)
  await beat(page, 2400)

  await page.goto("/docs", { waitUntil: "networkidle" })
  await showCaption(page, docsCaption)
  await beat(page, 2400)
  await clearCaption(page)

  await saveClip(page, "journey")
})
