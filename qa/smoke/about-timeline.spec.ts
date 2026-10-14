import { expect, test, type Page } from "@playwright/test"

/**
 * Smoke: the About timeline's teal progress line survives being painted.
 *
 * The line is the only thing that marks scroll progress through the story, and
 * it was authored as a 1 CSS pixel column. A browser cannot paint less than one
 * device pixel, so at a device pixel ratio of 1 — a plain 1080p display, which
 * is what `devices["Desktop Chrome"]` emulates — it blends the teal with the
 * page at partial alpha and lands at about 3.4:1 against the background. Zoomed
 * out it falls to 1.7:1. The grey static track sits in the same column
 * underneath, so what survives reads as "the track is there, the teal is gone".
 *
 * Asserting the width class would pin the fix rather than the defect, and a
 * computed-style check reads `oklch(...)` at full strength however faintly it is
 * actually drawn — the blending happens at rasterisation, after computed style.
 * So this measures the pixels Chromium really put on the screen.
 *
 * Pixels come back through a canvas rather than a decoder, which is the same
 * trick qa/smoke/showcase-brand.spec.ts uses to normalise a colour: the
 * screenshot is handed to the page as a data URL and read out of a 2D context,
 * so the suite needs no image dependency.
 */

/** WCAG relative luminance, on a 0-255 channel. */
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

/** Reads a PNG buffer back as RGBA bytes using the page's own canvas. */
const pixelsOf = async (page: Page, png: Buffer, width: number, height: number) => {
  const data = await page.evaluate(
    async ({ url, w, h }) => {
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.drawImage(image, 0, 0)
      return Array.from(ctx.getImageData(0, 0, w, h).data)
    },
    { url: `data:image/png;base64,${png.toString("base64")}`, w: width, h: height },
  )
  const at = (x: number, y: number) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  return { at, width, height }
}

test("the timeline progress line is visible at standard pixel density", async ({ page }, testInfo) => {
  const scale = testInfo.project.use.deviceScaleFactor ?? 1
  expect(scale, "this guard only means something below retina density").toBeLessThanOrEqual(1)

  await page.goto("/about", { waitUntil: "networkidle" })

  const line = page.locator("[data-timeline-progress]")
  await expect(line).toHaveCount(1)

  // The line completes when the container's end reaches 55% of the viewport
  // (the `useScroll` offset). Stop just past that: scrolling further is still
  // complete but pushes the line off the top, leaving only a stub to measure.
  const container = await line.evaluate((el) => {
    const r = (el.parentElement as HTMLElement).getBoundingClientRect()
    return { top: r.top + window.scrollY, height: r.height }
  })
  const viewport = page.viewportSize()
  if (!viewport) throw new Error("smoke runs with a fixed viewport")
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    container.top + container.height - viewport.height * 0.55 + 40,
  )
  await page.waitForTimeout(2_000)

  const box = await line.boundingBox()
  if (!box) throw new Error("the progress line has no box")

  const visibleTop = Math.max(0, box.y)
  const visibleBottom = Math.min(viewport.height, box.y + box.height)
  expect(visibleBottom - visibleTop, "the line should be on screen to be measured").toBeGreaterThan(80)

  // The icon nodes are teal circles centred on the line, so a band that catches
  // one measures the circle at full strength and passes however faint the line
  // is. That is exactly how the first draft of this spec passed against the
  // 1px line. Sample the longest stretch of bare line instead.
  const nodes = await page.locator("[data-timeline-node]").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom }
    }),
  )
  const band = { width: 40, height: 40 }
  const clear = (y: number) => nodes.every((n) => y + band.height < n.top - 8 || y > n.bottom + 8)
  const candidates: number[] = []
  for (let y = Math.ceil(visibleTop) + 4; y <= Math.floor(visibleBottom) - band.height - 4; y++) {
    if (clear(y)) candidates.push(y)
  }
  expect(candidates.length, "no stretch of line long enough to sample between the icon nodes").toBeGreaterThan(0)

  const clip = {
    x: Math.max(0, Math.round(box.x + box.width / 2) - band.width / 2),
    y: candidates[Math.floor(candidates.length / 2)],
    ...band,
  }

  const pixels = await pixelsOf(page, await page.screenshot({ clip }), band.width, band.height)

  // Background is the far edge of the band, well outside the line's 12px glow;
  // the line is the brightest pixel in the few columns it occupies.
  const centre = band.width / 2
  const background = pixels.at(0, band.height - 1)
  let brightest = [0, 0, 0]
  for (let x = Math.floor(centre) - 3; x <= Math.ceil(centre) + 3; x++) {
    for (let y = 0; y < band.height; y++) {
      const p = pixels.at(x, y)
      if (luminance(p) > luminance(brightest)) brightest = p
    }
  }

  const ratio = contrast(brightest, background)
  expect(
    ratio,
    `the teal progress line reached only rgb(${brightest.join(",")}) against rgb(${background.join(",")}) ` +
      `— ${ratio.toFixed(2)}:1. A one-device-pixel line gets blended away at this density.`,
  ).toBeGreaterThanOrEqual(6)
})
