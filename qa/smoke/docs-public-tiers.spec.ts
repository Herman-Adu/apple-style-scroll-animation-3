import { expect, test } from "@playwright/test"

/**
 * The public tier promise, as an anonymous visitor sees it.
 *
 * The unit guards prove the two docs say the same thing; only a browser can
 * prove the public one is actually readable without an account and that the
 * gated master is not listed beside it. Both halves matter: a page nobody can
 * open is not an answer, and a nav rail that names the owner's pricing doc to a
 * stranger leaks the thing the gate exists for.
 */
const PUBLIC_DOC = "/docs/what-you-receive"
const GATED_DOC = "/docs/tier-deliverables"

test("an anonymous visitor can read what they receive", async ({ page }) => {
  const response = await page.goto(PUBLIC_DOC, { waitUntil: "networkidle" })

  expect(response?.status(), `status for ${PUBLIC_DOC}`).toBe(200)
  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What You Receive")
  // The body itself, not just the title and summary the locked notice also
  // renders: a gated doc would show those and nothing else.
  await expect(page.getByRole("table").first()).toBeVisible()
  await expect(page.locator("main")).toContainText("no exit fee")
})

test("the gated master is not listed to them", async ({ page }) => {
  await page.goto(PUBLIC_DOC, { waitUntil: "networkidle" })

  await expect(
    page.getByRole("navigation", { name: "All documentation" }).getByRole("link", {
      name: "What You Receive",
    }),
  ).toBeVisible()
  await expect(page.locator(`a[href="${GATED_DOC}"]`)).toHaveCount(0)
})
