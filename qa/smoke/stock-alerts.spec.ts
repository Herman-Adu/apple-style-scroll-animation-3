import { expect, test } from "@playwright/test"

/**
 * Smoke: "Notify me" appears only where a restock is possible.
 *
 * Stock is live (catalog seed plus the admin overlay in Neon), so the sold-out
 * case is covered by the server-render test in qa/unit/products and the action
 * test in qa/integration/stock-alerts. A browser test can't make a product sold
 * out without editing the shared store, so this spec checks the two catalog
 * states that never change: in stock (no form) and pre-order (no form).
 */
const inStock = "/products/momo-air"
const preOrder = "/products/momo-x"
const notifyButton = { name: "Notify me" }

test("an in-stock product does not show the notify form", async ({ page }) => {
  await page.goto(inStock, { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole("button", notifyButton)).toHaveCount(0)
})

test("a pre-order product does not show the notify form", async ({ page }) => {
  await page.goto(preOrder, { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole("button", notifyButton)).toHaveCount(0)
})
