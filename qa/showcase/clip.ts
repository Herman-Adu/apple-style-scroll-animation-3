import path from "node:path"
import type { Page } from "@playwright/test"
import { formatFromEnv, slugForFormat } from "../../scripts/lib/showcase-formats.mjs"
import { CAPTION_ELEMENT_ID, buildCaptionHtml } from "./caption"
import { STEP_PAUSE_MS, planPacedScroll } from "./scroll-plan"

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

/**
 * Where the canvas frame sequences are, in page coordinates. Such a section is
 * sticky: its progress runs from its top edge to one viewport before its bottom
 * edge, which is the span that has to be paced frame by frame.
 */
function measureFrameSequences(page: Page, selectors: readonly string[]) {
  return page.evaluate((list) => {
    const pageTop = window.scrollY
    return list.flatMap((selector) => {
      const element = document.querySelector(selector)
      if (!element) return []
      const box = element.getBoundingClientRect()
      const start = box.top + pageTop
      const end = start + box.height - window.innerHeight
      return end > start ? [{ start, end }] : []
    })
  }, [...selectors])
}

export interface ScrollOptions {
  /** Selectors for canvas frame sequences, which are paced so that every frame renders. */
  frameSequenceSelectors?: readonly string[]
}

/**
 * Scrolls from the current position to the true bottom of the page, footer
 * included, at one readable pace throughout.
 *
 * Steps are driven by the clock, not by a sleep per step: a `mouse.wheel` call
 * costs about 20ms of its own, which silently stretched a 12-second sequence to
 * 16. Waiting until each step is *due* keeps the section the length it plans to be.
 */
export async function scrollToBottom(page: Page, { frameSequenceSelectors = [] }: ScrollOptions = {}) {
  for (let pass = 0; pass < MAX_SCROLL_PASSES; pass++) {
    const { scrollHeight, viewportHeight, scrollY } = await measurePage(page)
    const frameSequences = await measureFrameSequences(page, frameSequenceSelectors)
    const deltas = planPacedScroll({ scrollHeight, viewportHeight, scrollY, frameSequences }).flatMap(
      (segment) => segment.deltas,
    )
    if (deltas.length === 0) return

    const startedAt = Date.now()
    for (const [index, delta] of deltas.entries()) {
      await page.mouse.wheel(0, delta)
      const due = startedAt + (index + 1) * STEP_PAUSE_MS
      const wait = due - Date.now()
      if (wait > 0) await page.waitForTimeout(wait)
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
