import { test } from "@playwright/test"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"

test("probe", async ({ context }) => {
  const page = await openSignedInAdminPage(context, adminCredentials()!, "/admin/products")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(3000)
  console.log("[v0] url", page.url())
  const labels = await page.locator('[aria-label*="stock of"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))
  console.log("[v0] labels", JSON.stringify(labels.slice(0, 12)), labels.length)
  await page.screenshot({ path: "/tmp/agent-browser/probe-products.png" })
})
