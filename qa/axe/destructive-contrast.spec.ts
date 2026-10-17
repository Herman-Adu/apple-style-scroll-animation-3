import { expect, test, type Page } from "@playwright/test"

/**
 * What the browser can say about the two destructive roles that a model cannot.
 *
 * `qa/unit/theme/destructive-contrast.test.ts` models these ratios from
 * `app/globals.css` and is the finer instrument: five surfaces, four tint
 * alphas, both themes, in milliseconds. This spec covers the two claims that
 * one cannot make, and it exists because of something measured while writing
 * it rather than something assumed.
 *
 * **Neither role is on screen anywhere the gate looks.** The first draft of
 * this spec went to `/products` and waited for the "Sold out" tag. It is not
 * there. The fixture in `features/products/lib/data/data.ts` has `momo-air` at
 * `stock: 0`, but the catalog the app serves comes from the database, where
 * nothing is sold out - so the tag renders in no scan, and the text role needs
 * a validation failure or an admin session, which no public route reaches at
 * rest either. `/products` has been scanned in both themes since S66 and was
 * always going to report nothing, whatever the token said. S62's lesson was
 * that a route list is a claim about coverage; this is the same claim one layer
 * down - a scanned route only speaks for the states its data puts on screen,
 * and "axe is green" never meant this tag was measured.
 *
 * So the pixel measurement below is made on a probe element carrying the tag's
 * own utilities, which is deliberately NOT a stand-in for the tag's markup. It
 * is a question put to the served stylesheet: given these classes, on this
 * page, in this theme, what does Chromium paint? That answer depends on the
 * cascade, the inline theme block and the browser's own `color-mix`, none of
 * which the unit model sees. When a real tag *is* on the page, it is measured
 * too, so the day a product sells out this stops being the only path.
 *
 * **A token can be right and the class still do nothing.** `text-destructive-strong`
 * is only a class because `--color-destructive-strong` is declared in
 * `@theme inline`. Without that line the utility matches nothing, the text
 * silently inherits `--foreground`, and every static guard stays green because
 * the stylesheet is correct. Only a browser can catch that, so the probe is
 * refused if its colour comes back as the inherited one.
 *
 * Colours are normalised through a 1x1 canvas rather than parsed, and pixels
 * come back through the page's own canvas as a data URL - the tricks
 * `qa/smoke/showcase-brand.spec.ts` and `qa/smoke/about-timeline.spec.ts` use,
 * so the suite needs no image dependency. Chromium reports these colours in
 * the space they were authored in, `oklch()`, which a naive `rgb()` regex
 * reads straight past.
 */

/** next-themes stores the choice under this key; the class on <html> follows it. */
const THEME_KEY = "theme"
type Theme = "light" | "dark"
const THEMES: readonly Theme[] = ["light", "dark"]

/** AA for normal text (1.4.3). The tag's label is 10px and the status line 14px. */
const TEXT_FLOOR = 4.5

/** The page the probe is mounted on: a real scanned route, with the real cascade. */
const PROBE_ROUTE = "/products"

/** WCAG relative luminance, on 0-255 channels. */
const luminance = ([r, g, b]: number[]): number => {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrast = (a: number[], b: number[]): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const round = (ratio: number) => Number(ratio.toFixed(2))
const rgb = ([r, g, b]: number[]) => `rgb(${r},${g},${b})`

/**
 * Mounts a probe carrying `classes` and reads back what the stylesheet
 * resolved: the colour and fill the utilities produced, and the tokens
 * themselves, each normalised through a 1x1 canvas so the authoring colour
 * space does not matter.
 *
 * Declared at module scope and closing over nothing, because Playwright sends
 * the function's source to the page - a reference to anything in this file
 * would arrive undefined.
 */
function measureProbe(classes: string) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  const toRgba = (value: string): number[] => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000"
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    return Array.from(ctx.getImageData(0, 0, 1, 1).data)
  }

  document.getElementById("destructive-probe")?.remove()
  const probe = document.createElement("span")
  probe.id = "destructive-probe"
  probe.className = classes
  probe.textContent = "Sold out"
  document.body.appendChild(probe)

  const style = getComputedStyle(probe)
  const root = getComputedStyle(document.documentElement)
  const token = (name: string) => toRgba(root.getPropertyValue(name).trim())

  return {
    colour: toRgba(style.color),
    fill: toRgba(style.backgroundColor),
    destructive: token("--destructive"),
    strong: token("--destructive-strong"),
    labelToken: token("--destructive-foreground"),
    inherited: token("--foreground"),
  }
}

/** Reads a screenshot back as the colour covering most of it. */
async function dominantColour(page: Page, png: Buffer): Promise<number[]> {
  return page.evaluate(
    async ({ url }) => {
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.drawImage(image, 0, 0)
      const { data } = ctx.getImageData(0, 0, image.width, image.height)

      // The glyphs and their antialiasing are a minority of a filled pill's
      // pixels; quantising to the nearest 4 keeps a flat fill from splitting
      // across neighbouring buckets.
      const tally = new Map<string, { count: number; colour: number[] }>()
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 255) continue
        const colour = [data[i], data[i + 1], data[i + 2]]
        const key = colour.map((c) => Math.round(c / 4)).join(",")
        const seen = tally.get(key)
        if (seen) seen.count += 1
        else tally.set(key, { count: 1, colour })
      }
      return [...tally.values()].sort((a, b) => b.count - a.count)[0].colour
    },
    { url: `data:image/png;base64,${png.toString("base64")}` },
  )
}

/**
 * The element's effective opacity, multiplied up the ancestor chain.
 *
 * `toBeVisible()` does not read opacity, and this is a scroll-animation site:
 * a product card is in the layout at its final box while its reveal is still
 * at `opacity: 0`, so a screenshot taken then is of whatever sits behind it.
 * That is what made the first version of the low-stock measurement read the
 * page background in both themes - 250,250,250 on light and 0,0,0 on dark,
 * against a label that is itself `--background`, for a flat 1:1. It is also
 * the reason the "Sold out" probe above is mounted on `document.body`: a node
 * outside the revealed subtree has nothing to wait for.
 *
 * Module scope and closing over nothing, like the other page-side functions.
 */
function effectiveOpacity(element: Element) {
  let value = 1
  let node: Element | null = element
  while (node) {
    value *= Number(getComputedStyle(node).opacity)
    node = node.parentElement
  }
  return value
}

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
  // Fail loudly rather than measuring the other theme and reporting it green.
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
}

/**
 * Normalises one real element's own text colour, the same way `measureProbe`
 * does for a mounted one: Chromium may hand back the authoring colour space, so
 * the value goes through a 1x1 canvas before it is compared to anything.
 *
 * Also declared at module scope and closing over nothing - Playwright sends the
 * source to the page, so a reference to anything in this file arrives undefined.
 */
function measureElementColour(element: Element) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = "#000"
  ctx.fillStyle = getComputedStyle(element).color
  ctx.fillRect(0, 0, 1, 1)
  return Array.from(ctx.getImageData(0, 0, 1, 1).data)
}

for (const theme of THEMES) {
  test(`the served page paints the destructive tokens the stylesheet declares on ${theme}`, async ({
    page,
  }) => {
    await prepare(page, theme)
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    await settle(page, theme)

    // `--destructive` is the one role S66's trap does not reach: `buildThemeCss`
    // emits four tokens and no destructive one, so the database cannot repaint
    // these. The unit suite asserts that about the function; this asserts it
    // about a page that has been through the whole cascade.
    const probe = await page.evaluate(measureProbe, "text-destructive-strong")

    expect(
      probe.strong.slice(0, 3),
      `--destructive-strong resolves on the served page (got ${rgb(probe.strong)})`,
    ).not.toEqual([0, 0, 0])

    // The failure this can see and no static guard can: a missing `@theme inline`
    // line leaves the utility matching nothing and the text inheriting.
    expect(
      probe.colour.slice(0, 3),
      `text-destructive-strong paints the token ${rgb(probe.strong)}, not the inherited --foreground ${rgb(probe.inherited)}`,
    ).toEqual(probe.strong.slice(0, 3))
  })

  test(`the Sold out tag's label clears AA on the fill Chromium paints on ${theme}`, async ({ page }) => {
    await prepare(page, theme)
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    await settle(page, theme)

    // The tag's own utilities. `/90` is the whole reason this is a browser
    // test: the label sits on the token composited over the page, and the
    // composite is Chromium's to compute.
    const { colour: label } = await page.evaluate(
      measureProbe,
      "bg-destructive/90 text-destructive-foreground px-3 py-1 text-[10px]",
    )
    const probe = page.locator("#destructive-probe")
    await expect(probe).toBeVisible()
    const painted = await dominantColour(page, await probe.screenshot())

    const ratio = round(contrast(label, painted))
    expect(
      ratio,
      `label ${rgb(label)} on the painted fill ${rgb(painted)} (${theme}) measured ${ratio}:1`,
    ).toBeGreaterThanOrEqual(TEXT_FLOOR)

    // And the real tag, when the catalog has one. Not a fallback: the probe
    // above always runs, so this can only ever add a measurement.
    const real = page.getByText("Sold out", { exact: true }).and(page.locator(":not(#destructive-probe)"))
    if (await real.first().isVisible().catch(() => false)) {
      const realFill = await dominantColour(page, await real.first().screenshot())
      const realRatio = round(contrast(label, realFill))
      expect(
        realRatio,
        `the rendered tag's label on ${rgb(realFill)} (${theme}) measured ${realRatio}:1`,
      ).toBeGreaterThanOrEqual(TEXT_FLOOR)
    }
  })

  test(`the low-stock badge's label clears AA on the warning fill Chromium paints on ${theme}`, async ({
    page,
  }) => {
    await prepare(page, theme)
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    await settle(page, theme)

    /**
     * The other half of the same component, and the one case on this route that
     * is measured on the element the shop actually serves rather than on a
     * probe. S67 had to mount one because nothing in the catalog is sold out;
     * the catalog does carry a low-stock product, so this asserts the badge
     * itself - which is the S73 rule, assert the element rather than probing
     * for it and reporting green on nothing. If the catalog stops carrying one
     * this goes red naming the missing badge, which is the failure wanted: the
     * measurement would otherwise be of a combination no page paints.
     *
     * S74 is why it exists. The badge was `bg-amber-500/90 text-black`, a raw
     * literal that happened to read 10.45:1, and moving it onto `--warning`
     * changed both halves: the fill now flips with the scheme, so a fixed black
     * label could not follow it. `text-background` is the measured choice -
     * 4.79:1 on light and 8.94:1 on dark, where `--foreground` gives 3.94:1 and
     * 2.03:1 and the sibling tag's `--destructive-foreground` gives 2.25:1 on
     * dark. The modelling is in the unit suite; the composite over `/90` is
     * Chromium's to compute, which is what this reads back.
     */
    const badge = page.getByText(/^Only \d+ left$/).first()
    await expect(badge).toBeVisible()

    // Wait for the reveal to finish, or the screenshot is of the card's
    // background. `settle` zeroes transition durations, so this resolves as
    // soon as the reveal has been triggered rather than waiting one out.
    await badge.scrollIntoViewIfNeeded()
    await expect
      .poll(async () => badge.evaluate(effectiveOpacity), { timeout: 10_000 })
      .toBe(1)

    const label = await badge.evaluate(measureElementColour)
    const painted = await dominantColour(page, await badge.screenshot())

    const ratio = round(contrast(label, painted))
    expect(
      ratio,
      `the low-stock label ${rgb(label)} on the painted warning fill ${rgb(painted)} (${theme}) measured ${ratio}:1`,
    ).toBeGreaterThanOrEqual(TEXT_FLOOR)
  })
}
