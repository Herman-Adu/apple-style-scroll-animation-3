import { expect, test } from "@playwright/test"

/**
 * Smoke: the unsubscribe link in a back-in-stock email.
 *
 * Opening the link must change nothing (mail scanners follow links), so the
 * page asks for a confirm click. An unknown token is the safe path to click
 * through in a shared database: it deletes nothing.
 */
const page_ = "/stock-alerts/unsubscribe"

test("a link with a token asks for confirmation before removing anything", async ({ page }) => {
  await page.goto(`${page_}?token=smoke-unknown-token`, { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { name: "Stop this stock alert?" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Unsubscribe" })).toBeVisible()
})

test("confirming with an unknown token lands on the invalid message", async ({ page }) => {
  await page.goto(`${page_}?token=smoke-unknown-token`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Unsubscribe" }).click()
  await expect(page).toHaveURL(/status=invalid/)
  await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible()
})

test("a link with no token is treated as invalid", async ({ page }) => {
  await page.goto(page_, { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Unsubscribe" })).toHaveCount(0)
})

test("the done state confirms the unsubscribe", async ({ page }) => {
  await page.goto(`${page_}?status=done`, { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { name: "You're unsubscribed" })).toBeVisible()
})
