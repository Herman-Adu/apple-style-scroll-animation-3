import path from "node:path"
import type { Locator, Page } from "@playwright/test"
import { formatFromEnv, slugForFormat } from "../../scripts/lib/showcase-formats.mjs"
import {
  CAPTION_BAND_RATIO,
  CAPTION_ELEMENT_ID,
  HEADLINE_MIN_PX,
  buildCaptionHtml,
  captionPlacement,
} from "./caption"
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

/** The app's error boundary, and the sign-in wall a gated route redirects to. */
const BROKEN_PAGE = /something broke|an unexpected error interrupted/i
const SIGN_IN_WALL = /sign in to your account/i

export interface VisitOptions {
  /** The journey clip signs in on camera, so for that one shot a sign-in page is the point. */
  expectSignIn?: boolean
}

/**
 * Goes to a route and refuses to film it if it came up broken or gated.
 *
 * Both have happened and both were published: /docs recorded the error screen,
 * and the storefront clip recorded a sign-in wall under a caption promising
 * checkout. A take that fails costs seconds; a bad clip costs a whole pass.
 */
export async function visit(page: Page, route: string, { expectSignIn = false }: VisitOptions = {}) {
  const response = await page.goto(route, { waitUntil: "networkidle" })
  const status = response?.status() ?? 0
  if (status >= 400) throw new Error(`${route} answered ${status}; not filming it`)

  const text = await page.evaluate(() => document.body.innerText)
  if (BROKEN_PAGE.test(text)) throw new Error(`${route} rendered the error screen; not filming it`)
  if (!expectSignIn && SIGN_IN_WALL.test(text)) {
    throw new Error(`${route} asked for a sign-in; not filming it. Seed the demo admin, or sign in first.`)
  }
}

/**
 * Puts an element on screen at once.
 *
 * `scrollIntoViewIfNeeded` scrolls and then waits for the element to settle, and
 * on a page with a 500vh sticky hero that took sixteen seconds — recorded as one
 * frozen frame, over half the restock clip. This asks the page to do the scroll
 * and moves on.
 */
export async function jumpTo(target: Locator) {
  await target.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }))
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

/**
 * How much of each caption band is covered by headline text, as a share of the band.
 * Covering a table row or a paragraph is fine; covering a product name or a page
 * title is what makes a clip look careless, so only large text is counted.
 */
function measureHeadlineCover(page: Page, bandRatio: number, headlineMinPx: number) {
  return page.evaluate(
    ({ ratio, minPx, captionId }) => {
      const height = window.innerHeight

      // The site header is pinned to the top, and content scrolled underneath it
      // is invisible but still has a box there. Start the top band below it, or a
      // heading hidden behind the header pushes the caption to the other end.
      let headerBottom = 0
      for (const element of document.body.querySelectorAll<HTMLElement>("*")) {
        const position = getComputedStyle(element).position
        if (position !== "fixed" && position !== "sticky") continue
        const box = element.getBoundingClientRect()
        if (box.top <= 4 && box.height > 0 && box.height < height * 0.3) {
          headerBottom = Math.max(headerBottom, box.bottom)
        }
      }

      const bands = {
        top: { from: headerBottom, to: headerBottom + height * ratio },
        bottom: { from: height * (1 - ratio), to: height },
      }
      const cover = { top: { headline: 0, items: 0 }, bottom: { headline: 0, items: 0 } }
      const bandArea = window.innerWidth * height * ratio

      for (const element of document.body.querySelectorAll<HTMLElement>("*")) {
        if (element.id === captionId || element.closest(`#${captionId}`)) continue
        // Only elements that paint text themselves, so a wrapper is not counted twice.
        const ownText = [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? "").trim() !== "",
        )
        if (!ownText) continue

        const style = getComputedStyle(element)
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) < 0.15) continue

        const box = element.getBoundingClientRect()
        if (box.width <= 0 || box.height <= 0) continue
        const headline = Number.parseFloat(style.fontSize) >= minPx
        for (const band of ["top", "bottom"] as const) {
          const overlap = Math.min(box.bottom, bands[band].to) - Math.max(box.top, bands[band].from)
          if (overlap <= 0) continue
          cover[band].items += 1
          if (headline) cover[band].headline += overlap * box.width
        }
      }
      return {
        top: { headline: cover.top.headline / bandArea, items: cover.top.items },
        bottom: { headline: cover.bottom.headline / bandArea, items: cover.bottom.items },
      }
    },
    { ratio: bandRatio, minPx: headlineMinPx, captionId: CAPTION_ELEMENT_ID },
  )
}

/**
 * Shows a burned-in caption, replacing any caption already on screen. The band is
 * chosen per shot: a caption dropped on the product name reads as a mistake.
 */
export async function showCaption(page: Page, text: string) {
  const cover = await measureHeadlineCover(page, CAPTION_BAND_RATIO, HEADLINE_MIN_PX)
  const html = buildCaptionHtml(text, captionPlacement(cover.top, cover.bottom))
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
