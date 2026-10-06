import path from "node:path"
import type { Page } from "@playwright/test"
import { formatFromEnv, slugForFormat } from "../../scripts/lib/showcase-formats.mjs"
import { CAPTION_ELEMENT_ID, buildCaptionHtml } from "./caption"
import { planScroll } from "./scroll-plan"

export const RAW_CLIP_DIR = path.join(process.cwd(), "test-results", "showcase", "raw")

/** A short hold so viewers can read each beat of the clip. */
export function beat(page: Page, ms = 1200) {
  return page.waitForTimeout(ms)
}

/** Closes the page so the recording is flushed, then saves it under a stable slug for the active format. */
export async function saveClip(page: Page, slug: string) {
  const video = page.video()
  await page.close()
  const name = slugForFormat(slug, formatFromEnv(process.env.SHOWCASE_FORMAT))
  if (video) await video.saveAs(path.join(RAW_CLIP_DIR, `${name}.webm`))
}

/** Smoothly scrolls the window in small steps so scroll-driven animation plays on camera. */
export async function smoothScroll(page: Page, distance: number, steps = 24) {
  const step = Math.round(distance / steps)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step)
    await page.waitForTimeout(80)
  }
}

/** Whole-page measurements, re-read each pass because lazy sections can grow the page while scrolling. */
function measurePage(page: Page) {
  return page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    scrollY: window.scrollY,
  }))
}

const MAX_SCROLL_PASSES = 4

/** Scrolls from the current position to the true bottom of the page, footer included, with an eased pace. */
export async function scrollToBottom(page: Page, steps = 36) {
  for (let pass = 0; pass < MAX_SCROLL_PASSES; pass++) {
    const { scrollHeight, viewportHeight, scrollY } = await measurePage(page)
    const deltas = planScroll({ scrollHeight: scrollHeight - scrollY, viewportHeight, steps })
    if (deltas.length === 0) return
    for (const delta of deltas) {
      await page.mouse.wheel(0, delta)
      await page.waitForTimeout(70)
    }
    await page.waitForTimeout(400)
  }
}

/** Shows a burned-in caption, replacing any caption already on screen. */
export async function showCaption(page: Page, text: string) {
  const html = buildCaptionHtml(text)
  await page.evaluate(
    ({ markup, id }) => {
      document.getElementById(id)?.remove()
      document.body.insertAdjacentHTML("beforeend", markup)
    },
    { markup: html, id: CAPTION_ELEMENT_ID },
  )
}

export async function clearCaption(page: Page) {
  await page.evaluate((id) => document.getElementById(id)?.remove(), CAPTION_ELEMENT_ID)
}
