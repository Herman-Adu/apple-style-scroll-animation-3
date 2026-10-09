import { expect, test } from "@playwright/test"
import { infographics } from "@/features/showcase/lib/domain/infographics"
import { signatureOverruns } from "../social/slide-geometry"

/**
 * The structure slides are the only ones whose height is set by live data: add
 * a tenth item to the admin nav and the grid gains a row. `qa/social/export.spec.ts`
 * checks all seventy slides, but it runs only under `pnpm showcase:assets` —
 * not a merge gate. Without this, a nav change could pass every gate and the
 * overflow would surface later, against whoever next re-exported.
 *
 * Only these four, deliberately: the full set is sixty-two cold route compiles
 * and timed this suite out when it was tried.
 */
const STRUCTURE_SLIDES = infographics.filter((i) => i.kind === "structure").map((i) => i.id)

test("there are structure slides to check", () => {
  expect(STRUCTURE_SLIDES.length).toBeGreaterThan(0)
})

for (const id of STRUCTURE_SLIDES) {
  test(`${id} keeps its content clear of the signature`, async ({ page }) => {
    await page.goto(`/showcase-render/${id}`, { waitUntil: "networkidle" })
    await page.evaluate(() => document.fonts.ready)
    expect(await signatureOverruns(page)).toEqual([])
  })
}
