import { expect, test, type Page } from "@playwright/test"
import { accentStrong } from "@/features/settings/lib/domain/theme"

/**
 * What the browser can say about the accent's two roles that a model cannot.
 *
 * `qa/unit/theme/accent-tint-contrast.test.ts` models these ratios from
 * `app/globals.css` and is the finer instrument - five surfaces, every alpha in
 * the markup, both themes, in milliseconds. `theme-preset-contrast.test.ts`
 * holds the derivation against every preset a client can activate. This spec
 * covers the two claims neither of them can make, and both are claims about
 * layers that only exist once a page is served.
 *
 * **A token can be right and the class still do nothing.**
 * `text-accent-teal-strong` is only a class because `--color-accent-teal-strong`
 * is declared in `@theme inline`. Without that line the utility matches
 * nothing, the 52 sites S73 moved silently inherit `--foreground`, and every
 * static guard stays green because the stylesheet is correct - S67 proved this
 * by deleting the line and watching a probe come back `rgb(11,11,11)` while the
 * token still resolved. So the probe is refused if its colour comes back as the
 * inherited one.
 *
 * **And this token is painted from the database, which `--destructive-strong`
 * is not.** That is the one real difference from the spec next door.
 * `buildThemeCss` emits `--accent-teal` from `StoreSettings.theme`, so S73 made
 * the text role derive from whatever accent is live rather than sit frozen in
 * the stylesheet - otherwise activating Solar Amber would put teal words on an
 * amber chip. The derivation is a pure function and the unit suite holds it, but
 * only a served page can show that the *emitted* token is the derivation of the
 * *emitted* accent. That is S66's trap, and it cost an hour: five routes kept
 * failing axe while every static guard passed, because the column still held
 * the old value. So the check below reads both tokens off the live page and
 * re-derives one from the other.
 *
 * The route is `/docs`, and it is chosen rather than defaulted to. S72's lesson
 * is that a page's states are part of its coverage: most of the 52 sites S73
 * moved are menus and disclosures, open-state by definition and in no scan at
 * rest. The docs filters are the exception - the selected pill renders
 * `bg-accent-teal/10 text-accent-teal-strong` with nothing filtered, which is
 * the page's resting state - so a real element carries the real pair on screen.
 *
 * Which pill took one correction worth keeping. `/docs` ships two navs with the
 * same pair of utilities, and this spec first reached for the category filter in
 * `doc-category-filter.tsx`; the one actually rendered at rest is the audience
 * filter in `docs-explorer.tsx`. Behind a tolerant `isVisible()` check that
 * mismatch reported green while measuring nothing, so the locator below is
 * asserted, not probed. The synthetic probe runs either way, which is what keeps
 * the measurement alive if the pill is redesigned.
 *
 * Colours are normalised through a 1x1 canvas rather than parsed, and pixels come
 * back through the page's own canvas as a data URL - the tricks
 * `qa/axe/destructive-contrast.spec.ts` and `qa/smoke/showcase-brand.spec.ts`
 * use, so the suite needs no image dependency. Chromium reports these colours in
 * the space they were authored in, `oklch()`, which a naive `rgb()` regex reads
 * straight past. Those helpers are now in a fifth spec and want extracting into
 * `qa/config/`; that is a refactor across five files and is on the record in
 * `docs/sprint-ledger.md` rather than smuggled into a palette sprint.
 */

/** next-themes stores the choice under this key; the class on <html> follows it. */
const THEME_KEY = "theme"
type Theme = "light" | "dark"
const THEMES: readonly Theme[] = ["light", "dark"]

/** AA for normal text (1.4.3). The filter pills are 13px. */
const TEXT_FLOOR = 4.5

/** A real scanned route, with the real cascade and a real pill at rest. */
const PROBE_ROUTE = "/docs"

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
 * resolved: the colour the utility produced, the tokens themselves, and the raw
 * `--accent-teal` / `--accent-teal-strong` declarations as authored, so the
 * derivation can be re-checked against the served values.
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

  document.getElementById("accent-probe")?.remove()
  const probe = document.createElement("span")
  probe.id = "accent-probe"
  probe.className = classes
  probe.textContent = "All"
  document.body.appendChild(probe)

  const style = getComputedStyle(probe)
  const root = getComputedStyle(document.documentElement)
  const raw = (name: string) => root.getPropertyValue(name).trim()

  return {
    colour: toRgba(style.color),
    fill: toRgba(style.backgroundColor),
    accent: toRgba(raw("--accent-teal")),
    strong: toRgba(raw("--accent-teal-strong")),
    inherited: toRgba(raw("--foreground")),
    accentRaw: raw("--accent-teal"),
    strongRaw: raw("--accent-teal-strong"),
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

for (const theme of THEMES) {
  test(`the served page paints the accent's text role on ${theme}`, async ({ page }) => {
    await prepare(page, theme)
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    await settle(page, theme)

    const probe = await page.evaluate(measureProbe, "text-accent-teal-strong")

    expect(
      probe.strongRaw,
      `--accent-teal-strong resolves on the served page (got "${probe.strongRaw}")`,
    ).not.toBe("")

    // The failure this can see and no static guard can: a missing `@theme inline`
    // line leaves the utility matching nothing and the text inheriting.
    expect(
      probe.colour.slice(0, 3),
      `text-accent-teal-strong paints the token ${rgb(probe.strong)}, not the inherited --foreground ${rgb(probe.inherited)}`,
    ).toEqual(probe.strong.slice(0, 3))

    // S66's trap, closed: the theme layer emits both of these out of
    // `StoreSettings.theme`, so the text role has to be the derivation of the
    // accent the page is actually painting - not of the one in the stylesheet.
    expect(
      probe.strongRaw,
      `the emitted --accent-teal-strong is accentStrong("${probe.accentRaw}", "${theme}")`,
    ).toBe(accentStrong(probe.accentRaw, theme))
  })

  test(`the docs filter pill clears AA on the tint Chromium paints on ${theme}`, async ({
    page,
  }) => {
    await prepare(page, theme)
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    await settle(page, theme)

    // The pill's own utilities, copied from the live element rather than
    // invented: an invented probe measures a chip the app may not paint, and
    // 10px uppercase at this tracking is the smallest the pair is ever set in.
    await page.evaluate(
      measureProbe,
      "rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] border-accent-teal/50 bg-accent-teal/10 text-accent-teal-strong",
    )
    const probe = page.locator("#accent-probe")
    await expect(probe).toBeVisible()
    const probeColour = await probe.evaluate((el) => getComputedStyle(el).color)
    const painted = await dominantColour(page, await probe.screenshot())
    const words = await page.evaluate((value) => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.fillStyle = "#000"
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data)
    }, probeColour)

    const ratio = round(contrast(words, painted))
    expect(
      ratio,
      `the text role ${rgb(words)} on the painted tint ${rgb(painted)} (${theme}) measured ${ratio}:1`,
    ).toBeGreaterThanOrEqual(TEXT_FLOOR)

    // And the real pill. Asserted visible rather than probed for, because a
    // `isVisible().catch(() => false)` around this went quiet for a whole run
    // while reporting green: the first draft reached for the *category* filter
    // in `doc-category-filter.tsx`, and the nav this route renders at rest is
    // the *audience* filter in `docs-explorer.tsx`. Two components ship the same
    // pair of utilities, so naming the wrong one cost nothing visible - which is
    // S71's "wrong instance of a page type" one layer down, at the component.
    // If this element moves again the test says so instead of skipping.
    const real = page
      .getByRole("navigation", { name: "Filter docs by audience" })
      .getByRole("button", { name: "All", exact: true })
    await expect(real).toBeVisible()
    const realFill = await dominantColour(page, await real.screenshot())
    const realColour = await real.evaluate((el) => getComputedStyle(el).color)
    const realWords = await page.evaluate((value) => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.fillStyle = "#000"
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data)
    }, realColour)
    const realRatio = round(contrast(realWords, realFill))
    expect(
      realRatio,
      `the rendered pill's words on ${rgb(realFill)} (${theme}) measured ${realRatio}:1`,
    ).toBeGreaterThanOrEqual(TEXT_FLOOR)
  })
}
