import { expect, test } from "@playwright/test"

/**
 * Admin routes are behind the proxy. A signed-out visitor to any admin page,
 * including the owner-only permissions page, is sent to sign-in with a return path.
 */
const adminRoutes = ["/admin", "/admin/settings", "/admin/settings/permissions"]

for (const route of adminRoutes) {
  test(`signed-out ${route} redirects to sign-in`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(new RegExp(`/sign-in\\?redirect=${encodeURIComponent(route)}`))
  })
}
