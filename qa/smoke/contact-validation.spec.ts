import { expect, test } from "@playwright/test"

/**
 * Smoke: the one claim about `contact-form.tsx`'s palette tokens that no
 * static scan and no route scan can make.
 *
 * `qa/unit/theme/status-tint-contrast.test.ts` models the ratios these lines
 * are held to - five surfaces, both themes, in milliseconds - and the
 * "does the utility actually paint" claim S67 added is already held for every
 * class used here, because **S72 added no new token**: `text-destructive-strong`
 * and `bg-success/10 text-success` are all existing `@theme inline` entries
 * that `qa/axe/destructive-contrast.spec.ts` and the theme unit suite already
 * assert. This spec deliberately does not re-prove either of those.
 *
 * What is left is the thing S71's retro warned about: **both of this file's
 * literal sites were on states that are not on screen at rest.** The success
 * panel needs a real submission; the validation lines sit behind a `touched`
 * flag that only a click sets. An axe or smoke scan of `/contact` renders
 * neither, so "the contact page is green" never meant these lines were seen -
 * the same claim S71 found one layer down, where the scanned product instance
 * was the pre-order that paints no amber.
 *
 * So the assertion is on a *driven* state: press Continue with no topic
 * chosen, and the `text-destructive-strong` line renders. The at-rest check
 * above it is not decoration - it is the proof that this spec reaches a state
 * a scan cannot, and it is what went red first while this was written.
 *
 * The success panel is left to the unit measurement on purpose: driving it
 * means a real submission against the shared database, which is a worse trade
 * than a modelled ratio for a panel whose only colour claim is already
 * measured on all five surfaces.
 */

const CONTACT = "/contact"

/** The copy the step-1 validation line carries. */
const TOPIC_ERROR = "Please choose a topic to continue."

test("the topic validation line is not on screen at rest, so no scan of /contact can see it", async ({
  page,
}) => {
  await page.goto(CONTACT, { waitUntil: "networkidle" })

  // The form itself is served - this is not an empty page or a redirect.
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible()
  await expect(page.getByText(TOPIC_ERROR)).toHaveCount(0)
})

test("pressing Continue with no topic chosen paints the line in --destructive-strong", async ({
  page,
}) => {
  await page.goto(CONTACT, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Continue" }).click()

  const line = page.getByText(TOPIC_ERROR)
  await expect(line).toBeVisible()

  // Read back what the served stylesheet resolved, normalised through a 1x1
  // canvas: Chromium reports these colours in the space they were authored in,
  // `oklch()`, which a naive `rgb()` regex reads straight past. The point is
  // not the ratio - that is modelled in the unit suite - but that the state a
  // scan cannot reach paints the token the measurement was made of.
  const painted = await line.evaluate((node) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const toRgb = (value: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = "#000"
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3).join(",")
    }
    const root = getComputedStyle(document.documentElement)
    return {
      colour: toRgb(getComputedStyle(node).color),
      strong: toRgb(root.getPropertyValue("--destructive-strong").trim()),
      inherited: toRgb(root.getPropertyValue("--foreground").trim()),
    }
  })

  expect(
    painted.colour,
    `the driven validation line paints --destructive-strong rgb(${painted.strong}), not the inherited --foreground rgb(${painted.inherited})`,
  ).toBe(painted.strong)
})
