import { test } from "@playwright/test"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { beat, saveClip, scrollToBottom, showCaption } from "./clip"
import { getClip } from "./shot-list"

/** Clip 5, orders, customers and analytics. Needs the seeded demo data and admin env. */
const credentials = adminCredentials()

test("clip: orders, customers and analytics", async ({ context }) => {
  test.skip(!credentials, "Run pnpm showcase:seed -- --confirm (or set QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD) to record admin clips")
  const [ordersCaption, customersCaption, analyticsCaption] = getClip("orders").captions

  const page = await openSignedInAdminPage(context, credentials!, "/admin/orders")
  await showCaption(page, ordersCaption)
  await beat(page, 2400)
  await scrollToBottom(page, 20)
  await beat(page, 1200)

  await page.goto("/admin/customers", { waitUntil: "networkidle" })
  await showCaption(page, customersCaption)
  await beat(page, 2400)
  await scrollToBottom(page, 20)
  await beat(page, 1200)

  await page.goto("/admin/analytics", { waitUntil: "networkidle" })
  await showCaption(page, analyticsCaption)
  await beat(page, 2600)
  await scrollToBottom(page, 20)
  await beat(page, 1500)

  await saveClip(page, "orders")
})
