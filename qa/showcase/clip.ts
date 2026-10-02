import path from "node:path"
import type { Page } from "@playwright/test"

export const RAW_CLIP_DIR = path.join(process.cwd(), "test-results", "showcase", "raw")

/** A short hold so viewers can read each beat of the clip. */
export function beat(page: Page, ms = 1200) {
  return page.waitForTimeout(ms)
}

/** Closes the page so the recording is flushed, then saves it under a stable slug. */
export async function saveClip(page: Page, slug: string) {
  const video = page.video()
  await page.close()
  if (video) await video.saveAs(path.join(RAW_CLIP_DIR, `${slug}.webm`))
}

/** Smoothly scrolls the window in small steps so scroll-driven animation plays on camera. */
export async function smoothScroll(page: Page, distance: number, steps = 24) {
  const step = Math.round(distance / steps)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step)
    await page.waitForTimeout(80)
  }
}
