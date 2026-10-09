import { expect, test } from "@playwright/test"

/**
 * Smoke: a rendered slide carries AduDev's brand, not the store's.
 *
 * The source guard in qa/unit/showcase/slide-palette.test.ts stops a component
 * naming `accent-teal`; this checks the pixels that reach the PDF, which is what
 * a reader on LinkedIn sees. Three carousels shipped with teal arrows and teal
 * bars, so both halves are worth having.
 *
 * Colours are normalised through a 1x1 canvas rather than parsed. Chromium
 * reports a computed colour in whatever space it was authored in — these slides
 * resolve to `oklch(...)`, which a naive rgb() regex reads straight past. That
 * is exactly how the first draft of this spec passed against teal slides.
 */
const ADUDEV_ORANGE = "244,124,0"

/** One slide per body type that previously rendered the store accent. */
const SLIDES = [
  "/showcase-render/infographic-sequence",
  "/showcase-render/infographic-buyer-stock-alerts",
  "/showcase-render/infographic-stack",
  "/showcase-render/infographic-site-map",
]

/** Paints each computed colour and reads the pixel back, so any colour space works. */
const coolColours = () => {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  const toRgba = (value: string): number[] | null => {
    if (!value) return null
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000"
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    return Array.from(ctx.getImageData(0, 0, 1, 1).data)
  }
  const hits: string[] = []
  for (const el of Array.from(document.querySelectorAll("*"))) {
    const s = getComputedStyle(el)
    for (const value of [s.color, s.backgroundColor, s.borderTopColor, s.fill]) {
      const rgba = toRgba(value)
      if (!rgba) continue
      const [r, g, b, a] = rgba
      // Teal reads green and blue over red. Grey and white have no such bias.
      if (a > 0 && g - r > 20 && b - r > 20) hits.push(`${el.tagName.toLowerCase()} ${value}`)
    }
  }
  return [...new Set(hits)]
}

for (const slide of SLIDES) {
  test(`${slide} renders in the AduDev palette`, async ({ page }) => {
    await page.goto(slide, { waitUntil: "networkidle" })
    await expect(page.locator("[data-social-asset]")).toHaveCount(1)
    const cool = await page.evaluate(coolColours)
    expect(cool, "cool-toned colours are the store's accent, not AduDev's").toEqual([])
  })
}

test("a slide is signed with the AduDev wordmark", async ({ page }) => {
  await page.goto("/showcase-render/infographic-sequence", { waitUntil: "networkidle" })
  await expect(page.getByAltText("AduDev")).toBeVisible()
})

test("the chart accent is the AduDev orange", async ({ page }) => {
  await page.goto("/showcase-render/infographic-buyer-stock-alerts", { waitUntil: "networkidle" })
  const fills = await page.locator("[data-social-asset] [data-chart-fill]").evaluateAll((nodes) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    return nodes.map((node) => {
      ctx.fillStyle = getComputedStyle(node).backgroundColor
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
      return `${r},${g},${b}`
    })
  })
  expect(fills.length, "the bar chart draws fills").toBeGreaterThan(0)
  expect([...new Set(fills)]).toEqual([ADUDEV_ORANGE])
})
