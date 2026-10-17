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
  // the selector is what says which. For contrast, carry axe's own numbers too -
  // the measured ratio and the background it composited, which is the only
  // place the real surface behind a translucent element is ever named.
  expect(
    serious.map(
      (v) =>
        `${label}: ${v.id} (${v.impact}) ${v.nodes
          .map((n) => [n.target.join(" "), ...n.any.map((check) => check.message)].join(" -- "))
          .join(" | ")}`,
    ),
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

  /**
   * The opening-hours pill renders "Open now" or "Closed" from the clock, and
   * the two branches are different colours. Every local run during the working
   * day scanned the green branch, so the grey one went under AA unseen until a
   * CI run at 09:53 UTC happened to land outside opening hours - which is S67's
   * lesson again: a scanned route only speaks for the states its data puts on
   * screen. Pinning the clock to the small hours makes the closed state a
   * state the guard always sees, instead of one it sees by luck.
   */
  test(`the closed opening-hours pill has no violations on ${theme}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-18T03:00:00"))
    await prepare(page, theme)
    await page.goto("/contact", { waitUntil: "networkidle" })
    await settle(page, theme)
    await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible()
    await scan(page, `/contact closed (${theme})`)
  })

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
    // Adding opens the drawer by itself, and then the open drawer covers the
    // "Open cart" button - clicking it waits 30s for a hit target instead.
    const drawer = page.getByRole("dialog", { name: "Shopping cart" })
    if (!(await drawer.isVisible().catch(() => false))) {
      await page.getByLabel(/^Open cart/).click()
    }
    await expect(drawer).toBeVisible()
    await scan(page, `cart drawer (${theme})`)
  })

  /**
   * The availability row on a product detail page, in the low-stock state.
   *
   * A product detail page has been scanned here in both themes since before
   * S66, and it reported nothing about the three raw Tailwind literals S71
   * found in that row at 1.88-2.46:1 on light. Not because the scan was wrong
   * - because of which page it got. The route comes from the first
   * `/products/` URL in the sitemap, and that is `momo-x`, the pre-order:
   * neither amber renders on it at all. The one state that puts the "Only N
   * left" line on screen is `momo-studio`, three entries further down, and no
   * scan had ever opened it.
   *
   * That is S67's lesson one turn on. There, the state was unreachable because
   * the database had no sold-out product. Here the state exists and is served -
   * `curl /products/momo-studio` has it - and the gate still could not see it,
   * because a route list picks one instance of a page type and the states live
   * in the others. So the walk below is the fix, the way pinning the clock made
   * the "Closed" pill a state the guard always sees: find the product that
   * renders the state, rather than hoping the first one does.
   *
   * It also asserts what axe cannot. `text-warning` is only a class because
   * `--color-warning` is declared in `@theme inline`; without that line the
   * utility matches nothing and the text silently inherits `--foreground`,
   * which is 15.8:1 here - so axe would pass, and pass *because* the fix had
   * been undone. The computed colour is read back and refused if it is the
   * inherited one, which is the S67 probe's claim made on real markup.
   */
  test(`the low-stock availability row has no violations on ${theme}`, async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text()
    const products = [...sitemap.matchAll(/<loc>([^<]*\/products\/[^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname,
    )
    expect(products.length, "product URLs in sitemap").toBeGreaterThan(0)

    await prepare(page, theme)

    // Which product is low on stock is the admin's business and the database's,
    // so it is found rather than named. Walking also means this fails loudly
    // when no product is low any more, instead of scanning a page that renders
    // the row in some other colour and reporting it green.
    let found: { path: string; label: string } | null = null
    let line = page.locator("never")
    for (const path of products) {
      await page.goto(path, { waitUntil: "networkidle" })
      // The availability row, not the listing badge: both render "Only N left"
      // from the same `stockLabel`, and the badge is the one with `text-black`
      // on an amber fill, which reads 10.45:1 and is a different surface. The
      // row is addressed by its shape - the words directly after the
      // aria-hidden dot - and not by the colour class, because the class is
      // what is under test: anchoring on it would turn "the fix was reverted"
      // into "no product is low on stock", which is a different and untrue
      // failure.
      line = page.locator('span[aria-hidden="true"] + span', { hasText: /^Only \d+ left$/ }).first()
      if (!(await line.isVisible().catch(() => false))) continue
      found = { path, label: (await line.textContent()) ?? "" }
      break
    }
    expect(
      found,
      `a product rendering "Only N left" among ${products.join(", ")} - the low-stock state is what this scan is for`,
    ).not.toBeNull()

    await settle(page, theme)

    // The words and the dot beside them, read back as the browser resolved
    // them. `--warning` is compared through the same `getComputedStyle`, so the
    // authoring colour space does not have to be parsed on either side.
    // Normalised through a 1x1 canvas rather than parsed: these tokens are
    // authored in `oklch()` and Chromium reports them in the space they were
    // authored in, which a naive `rgb()` comparison reads straight past. The
    // trick is `qa/axe/destructive-contrast.spec.ts`'s.
    const painted = await line.evaluate((el: HTMLElement) => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      const normalise = (value: string) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = "#000"
        ctx.fillStyle = value
        ctx.fillRect(0, 0, 1, 1)
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).join(",")
      }
      const root = getComputedStyle(document.documentElement)
      const dot = el.previousElementSibling
      return {
        text: normalise(getComputedStyle(el).color),
        dot: dot ? normalise(getComputedStyle(dot).backgroundColor) : null,
        warning: normalise(root.getPropertyValue("--warning").trim()),
        foreground: normalise(root.getPropertyValue("--foreground").trim()),
      }
    })

    expect(painted, "the availability row in the DOM").not.toBeNull()
    // Refused if the class painted nothing: that is the failure a correct
    // stylesheet hides from every static guard.
    expect(painted!.text, `text-warning inherited --foreground: ${JSON.stringify(painted)}`).not.toBe(
      painted!.foreground,
    )
    expect(painted!.text, JSON.stringify(painted)).toBe(painted!.warning)
    expect(painted!.dot, JSON.stringify(painted)).toBe(painted!.warning)

    await scan(page, `${found!.path} low stock "${found!.label}" (${theme})`)
  })

  /**
   * The third literal. `bg-emerald-500` was the in-stock dot at 2.16-2.46:1 on
   * light, under 1.4.11's 3:1 for a graphical object, and it is on nearly every
   * product page - including `momo-x`, the one the scan above used to get. axe
   * never said so and never will: `color-contrast` measures text, and this dot
   * is 8px and `aria-hidden`. So the floor is held in the unit model, where
   * `--success` is already measured, and the only question left for a browser
   * is the S67 one - whether `bg-success` paints that token or silently nothing.
   */
  test(`the in-stock dot paints its token on ${theme}`, async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text()
    const products = [...sitemap.matchAll(/<loc>([^<]*\/products\/[^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1]).pathname,
    )
    await prepare(page, theme)

    let dot = page.locator("never")
    let where = ""
    for (const path of products) {
      await page.goto(path, { waitUntil: "networkidle" })
      const row = page.locator('span[aria-hidden="true"] + span', { hasText: /^In stock$/ }).first()
      if (!(await row.isVisible().catch(() => false))) continue
      dot = row.locator("xpath=preceding-sibling::span[1]")
      where = path
      break
    }
    expect(where, `a product rendering "In stock" among ${products.join(", ")}`).not.toBe("")
    await settle(page, theme)

    const painted = await dot.evaluate((el: HTMLElement) => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      const normalise = (value: string) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = "#000"
        ctx.fillStyle = value
        ctx.fillRect(0, 0, 1, 1)
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).join(",")
      }
      const root = getComputedStyle(document.documentElement)
      return {
        fill: normalise(getComputedStyle(el).backgroundColor),
        success: normalise(root.getPropertyValue("--success").trim()),
      }
    })

    // A missing `--color-success` line leaves the fill transparent, which is
    // the failure no static guard and no axe scan can see.
    expect(painted.fill, `${where}: ${JSON.stringify(painted)}`).toBe(painted.success)
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
