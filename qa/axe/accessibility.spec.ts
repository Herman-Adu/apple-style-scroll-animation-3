import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

/**
 * Accessibility: WCAG 2 A/AA scan on every primary route. Animations are
 * disabled via reduced-motion + a CSS override so transient states don't cause
 * flaky contrast/visibility readings.
 */
const routes = ["/", "/products", "/articles", "/about", "/contact"]

test.use({ colorScheme: "dark" })

for (const route of routes) {
  test(`${route} has no serious/critical a11y violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(route, { waitUntil: "networkidle" })
    await page.addStyleTag({
      content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}`,
    })

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()

    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    // Surface the rule ids in the failure message for fast triage.
    expect(serious.map((v) => `${v.id} (${v.impact})`)).toEqual([])
  })
}
