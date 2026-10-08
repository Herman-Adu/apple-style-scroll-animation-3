import { PrismaClient } from "@prisma/client"
import type { Locator, Page } from "@playwright/test"
import { expect, test } from "./fixtures"
import { DEMO_EMAIL_DOMAIN } from "../../scripts/lib/showcase-demo-data.mjs"
import { adminCredentials, openSignedInAdminPage } from "./admin-session"
import { beat, clearCaption, saveClip, showCaption } from "./clip"
import { RESTOCK_PRODUCT_SLUG, getClip } from "./shot-list"

/**
 * Clip 7, back in stock end to end: sold-out product, join the waiting list, the
 * admin sees the demand, restocks in one click, and the Back in stock email.
 *
 * Guarded: it only runs when every unnotified person waiting for the product is a
 * demo address, so the restock emails nobody real (demo addresses are also blocked
 * at the email provider). Stock is set to zero off camera first and put back to the
 * original count at the end. Re-run `pnpm showcase:seed -- --confirm` before each take.
 */
const credentials = adminCredentials()
const prisma = new PrismaClient()

function stockRow(page: Page, name: string): { row: Locator; increase: Locator; decrease: Locator } {
  const increase = page.getByRole("button", { name: `Increase stock of ${name}` })
  const decrease = page.getByRole("button", { name: `Decrease stock of ${name}` })
  const row = page.locator("tr", { has: increase })
  return { row, increase, decrease }
}

async function readStock(row: Locator): Promise<number> {
  return Number((await row.locator("span.font-mono").first().innerText()).trim())
}

async function stepStockTo(page: Page, name: string, target: number) {
  const { row, increase, decrease } = stockRow(page, name)
  for (let current = await readStock(row); current !== target; current = await readStock(row)) {
    const button = current > target ? decrease : increase
    if (!(await button.isEnabled())) break
    await button.click()
    await expect.poll(() => readStock(row), { timeout: 15_000 }).not.toBe(current)
  }
}

test.afterAll(async () => {
  await prisma.$disconnect()
})

test("clip: back in stock end to end", async ({ context }) => {
  test.skip(!credentials, "Run pnpm showcase:seed -- --confirm (or set QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD) to record admin clips")
  const realWaiting = await prisma.stockAlert.count({
    where: { productSlug: RESTOCK_PRODUCT_SLUG, notifiedAt: null, NOT: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } } },
  })
  test.skip(realWaiting > 0, `${realWaiting} real people are waiting for ${RESTOCK_PRODUCT_SLUG}; restocking would email them`)
  const demoWaiting = await prisma.stockAlert.count({ where: { productSlug: RESTOCK_PRODUCT_SLUG, notifiedAt: null } })
  test.skip(demoWaiting === 0, "No demo waiters left. Re-run pnpm showcase:seed -- --confirm")

  const [soldOutCaption, joinCaption, demandCaption, restockCaption, emailCaption] = getClip("restock").captions

  const setup = await openSignedInAdminPage(context, credentials!, `/products/${RESTOCK_PRODUCT_SLUG}`)
  const name = (await setup.locator("h1").first().innerText()).trim()
  await setup.goto("/admin/products", { waitUntil: "networkidle" })
  const original = await readStock(stockRow(setup, name).row)
  await stepStockTo(setup, name, 0)

  try {
    const page = await context.newPage()
    await page.goto(`/products/${RESTOCK_PRODUCT_SLUG}`, { waitUntil: "networkidle" })
    await showCaption(page, soldOutCaption)
    await beat(page, 2400)

    const email = page.locator('input[type="email"]').first()
    await email.scrollIntoViewIfNeeded()
    await email.pressSequentially(`you@${DEMO_EMAIL_DOMAIN}`, { delay: 45 })
    await showCaption(page, joinCaption)
    await page.getByRole("button", { name: /notify me/i }).click()
    await beat(page, 2200)

    await page.goto("/admin/products", { waitUntil: "networkidle" })
    const { row, increase } = stockRow(page, name)
    await row.scrollIntoViewIfNeeded()
    await showCaption(page, demandCaption)
    await beat(page, 2600)

    await showCaption(page, restockCaption)
    await increase.click()
    await expect.poll(() => readStock(row), { timeout: 15_000 }).toBe(1)
    await beat(page, 2000)

    await page.goto("/admin/email/templates", { waitUntil: "networkidle" })
    const template = page.getByRole("link", { name: /back in stock/i }).first()
    if (await template.count()) {
      await template.click()
      await page.waitForLoadState("networkidle")
    }
    await showCaption(page, emailCaption)
    await beat(page, 2800)
    await clearCaption(page)

    await saveClip(page, "restock")
  } finally {
    await setup.goto("/admin/products", { waitUntil: "networkidle" })
    await stepStockTo(setup, name, original)
    expect(await readStock(stockRow(setup, name).row), "stock restored").toBe(original)
  }
})
