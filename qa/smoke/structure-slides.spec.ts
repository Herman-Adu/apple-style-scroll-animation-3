import { expect, test } from "@playwright/test"
import { packCarouselId } from "@/features/showcase/lib/domain/packs"
import { signatureOverruns } from "../social/slide-geometry"

/**
 * The structure slides are the only ones whose height is set by live data: add
 * a tenth item to the admin nav and the grid gains a row. `qa/social/export.spec.ts`
 * checks all seventy slides, but it runs only under `pnpm showcase:assets` —
 * not a merge gate. Without this, a nav change could pass every gate and the
 * overflow would surface later, against whoever next re-exported.
 *
 * One page load, not one per slide. The carousel route stacks all ten pages in
 * a single document and `signatureOverruns` walks every `[data-social-asset]`
 * on it, so this covers the four structure slides and the six around them.
 * Checking them individually meant five more cold route compiles in a suite
 * that already timed out its heaviest routes under that load.
 */
test("every page of the site tour keeps clear of its signature", async ({ page }) => {
  await page.goto(`/showcase-render/${packCarouselId("site-tour")}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator("[data-social-asset]")).toHaveCount(10)
  expect(await signatureOverruns(page)).toEqual([])
})
