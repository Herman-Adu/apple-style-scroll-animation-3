import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

/**
 * Accessibility: WCAG 2 A/AA scan on every primary route. Animations are
 * disabled via reduced-motion + a CSS override so transient states don't cause
 * flaky contrast/visibility readings.
 *
 * A route list is a claim about coverage, and until S66 this one made two
 * claims it could not support. It scanned one theme - and the muted-label
 * failure it found in S62 was worse on the *other* one, 2.68:1 on light against
 * 3.30:1 on dark - and it only ever scanned what a `goto` reaches, so the cart
 * drawer and the mobile nav, which between them held 19 of the 209 sub-AA
 * labels, were never rendered by any scan at all.
 */

/** next-themes stores the choice under this key; the class on <html> follows it. */
const THEME_KEY = "theme"
type Theme = "light" | "dark"
const THEMES: readonly Theme[] = ["light", "dark"]

/** Reachable without a session. `/account` and `/checkout` need one, so the unit sweep speaks for them. */
const APP_ROUTES = [
  "/",
  "/products",
  "/articles",
  "/about",
  "/contact",
  // The sign-in surface: its own field and shell chrome, on no other route.
  "/sign-in",
  "/sign-up",
  // One legal page stands for five: they share a single layout, and a failure
  // in shared chrome is the layout's rather than the page's.
  "/privacy",
  // The docs hub and its explorer, a different shell from a doc page.
  "/docs",
  // The public tier promise: a long table in a reading column.
  "/docs/what-you-receive",
  "/stock-alerts/unsubscribe?token=axe-check",
]

/** Slide renders. Their palette is fixed and dark by design, so one theme speaks for both. */
const RENDER_ROUTES = [
  "/showcase-render/infographic-table",
  "/showcase-render/infographic-bar-chart",
  "/showcase-render/infographic-line-chart",
  "/showcase-render/infographic-sequence",
]

async function prepare(page: Page, theme: Theme) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [THEME_KEY, theme] as const,
  )
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme })
}

async function settle(page: Page, theme: Theme) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}`,
  })
  // Fail loudly rather than scanning the other theme and reporting it green.
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
}

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()

  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
  // Surface the offending nodes, not just the rule id: a contrast failure here
  // is usually something only on screen while the page is still loading, and
  // the selector is what says which.
  expect(
    serious.map((v) => `${label}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
  ).toEqual([])
}

for (const theme of THEMES) {
  for (const route of APP_ROUTES) {
    test(`${route} has no serious/critical a11y violations on ${theme}`, async ({ page }) => {
      await prepare(page, theme)
      await page.goto(route, { waitUntil: "networkidle" })
      await settle(page, theme)
      await scan(page, `${route} (${theme})`)
    })
  }

  test(`a product and an article detail page have no violations on ${theme}`, async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text()
    const paths = ["products", "articles"].map((kind) => {
      const url = sitemap.match(new RegExp(`<loc>([^<]*\\/${kind}\\/[^<]+)<\\/loc>`))?.[1]
      expect(url, `a ${kind} URL in sitemap`).toBeTruthy()
      return new URL(url!).pathname
    })

    for (const path of paths) {
      await prepare(page, theme)
      await page.goto(path, { waitUntil: "networkidle" })
      await settle(page, theme)
      await scan(page, `${path} (${theme})`)
    }
  })

  test(`the cart drawer has no violations on ${theme}`, async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text()
    const products = [...sitemap.matchAll(/<loc>([^<]*\/products\/[^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname,
    )
    expect(products.length, "product URLs in sitemap").toBeGreaterThan(0)

    await prepare(page, theme)

    // The button reads "Sold out", "Coming soon" or "Pre-order" depending on
    // stock, so the first product in the sitemap is not reliably buyable. Walk
    // until one is, rather than hardcoding a slug the admin can change.
    let added = false
    for (const path of products) {
      await page.goto(path, { waitUntil: "networkidle" })
      const addToCart = page.getByRole("button", { name: /Add to cart/ }).first()
      if (!(await addToCart.isVisible().catch(() => false))) continue
      if (await addToCart.isDisabled()) continue
      await addToCart.click()
      added = true
      break
    }
    expect(added, "a purchasable product to put in the cart").toBe(true)
    await settle(page, theme)

    // An empty drawer renders none of the per-line labels, which is where the
    // colour was wrong, so the scan has to put something in the cart first.
    await page.getByLabel(/^Open cart/).click()
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible()
    await scan(page, `cart drawer (${theme})`)
  })

  test(`the mobile nav has no violations on ${theme}`, async ({ page }) => {
    await prepare(page, theme)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/", { waitUntil: "networkidle" })
    await settle(page, theme)

    await page.getByLabel("Open menu").click()
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible()
    await scan(page, `mobile nav (${theme})`)
  })
}

for (const route of RENDER_ROUTES) {
  test(`${route} has no serious/critical a11y violations`, async ({ page }) => {
    await prepare(page, "dark")
    await page.goto(route, { waitUntil: "networkidle" })
    await page.addStyleTag({
      content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}`,
    })
    await scan(page, route)
  })
}
