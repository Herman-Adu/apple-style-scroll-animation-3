import { describe, expect, it } from "vitest"
import { contrastRatio, oklchToSrgb, readThemes, tokenLookup, type ThemeName } from "@/qa/config/contrast"

/**
 * The red "Sold out" tag is drawn as `bg-destructive` with `text-destructive-foreground`.
 * Both tokens were once the same red, so the label vanished into its own tag.
 * Text on a destructive surface must be a light colour that actually contrasts.
 *
 * The oklch and WCAG arithmetic this used to carry inline now lives in
 * `qa/config/contrast.ts`, where S66's muted-text sweep reads it too and
 * `contrast-math.test.ts` pins it against published reference values.
 */
const themes = readThemes()
const THEMES: readonly ThemeName[] = ["light", "dark"]

const pair = (theme: ThemeName) => {
  const lookup = tokenLookup(themes, theme)
  return { surface: lookup.resolve("destructive"), label: lookup.resolve("destructive-foreground") }
}

describe("destructive tokens", () => {
  it.each(THEMES)("defines a surface and a label in the %s theme", (theme) => {
    const { surface, label } = pair(theme)
    expect(surface).not.toBeNull()
    expect(label).not.toBeNull()
  })

  it.each(THEMES)("never uses the surface colour as its own label colour in the %s theme", (theme) => {
    const { surface, label } = pair(theme)
    expect(label).not.toEqual(surface)
  })

  it.each(THEMES)("keeps the label readable on the surface in the %s theme (WCAG AA, 4.5:1)", (theme) => {
    const { surface, label } = pair(theme)
    const ratio = contrastRatio(oklchToSrgb(label!), oklchToSrgb(surface!))
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(4.5)
  })
})
