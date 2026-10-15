import { describe, expect, it } from "vitest"
import {
  composite,
  contrastRatio,
  luminance,
  oklchToSrgb,
  parseOklch,
  readThemes,
  tokenLookup,
  toRgb255,
  type Srgb,
} from "@/qa/config/contrast"

/**
 * The contrast model is the thing every other colour guard in this suite trusts,
 * so it is pinned against numbers from outside this repo rather than against
 * itself. S60's pixel guard passed against an unfixed component because it was
 * measuring the wrong pixels; a measuring guard has to be shown measuring the
 * right thing.
 */
const hex = (value: string): Srgb => {
  const channels = [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255)
  return [channels[0], channels[1], channels[2]] as const
}

const WHITE = hex("ffffff")
const BLACK = hex("000000")

describe("contrast ratio", () => {
  it("is 21:1 for white on black, the maximum the formula can return", () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 4)
  })

  it("does not depend on which colour is given first", () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(contrastRatio(BLACK, WHITE), 10)
  })

  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio(hex("767676"), hex("767676"))).toBeCloseTo(1, 10)
  })

  // WebAIM publishes these two as the greys that sit exactly on the AA and AAA
  // thresholds for normal text against white. If this model drifts, these move.
  it("reads #767676 on white as 4.54:1, the published AA boundary grey", () => {
    expect(contrastRatio(hex("767676"), WHITE)).toBeCloseTo(4.54, 2)
  })

  it("reads #595959 on white as 7.00:1, the published AAA boundary grey", () => {
    expect(contrastRatio(hex("595959"), WHITE)).toBeCloseTo(7.0, 2)
  })

  it("puts #777777 under AA, one step lighter than the boundary grey", () => {
    expect(contrastRatio(hex("777777"), WHITE)).toBeLessThan(4.5)
  })
})

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance(BLACK)).toBeCloseTo(0, 10)
    expect(luminance(WHITE)).toBeCloseTo(1, 10)
  })
})

describe("oklch", () => {
  it("reads lightness, chroma, hue and an optional alpha", () => {
    expect(parseOklch("oklch(0.74 0.086 195)")).toEqual({ l: 0.74, c: 0.086, h: 195, alpha: 1 })
    expect(parseOklch("oklch(1 0 0 / 0.6)")).toEqual({ l: 1, c: 0, h: 0, alpha: 0.6 })
  })

  it("is null for a value that is not an oklch colour", () => {
    expect(parseOklch("var(--accent-teal)")).toBeNull()
  })

  it("converts the achromatic extremes to white and black", () => {
    expect(toRgb255(oklchToSrgb({ l: 1, c: 0, h: 0, alpha: 1 }))).toBe("rgb(255,255,255)")
    expect(toRgb255(oklchToSrgb({ l: 0, c: 0, h: 0, alpha: 1 }))).toBe("rgb(0,0,0)")
  })
})

describe("compositing a translucent colour", () => {
  it("returns the surface at alpha 0 and the colour at alpha 1", () => {
    expect(composite(WHITE, BLACK, 0)).toEqual(BLACK)
    expect(composite(WHITE, BLACK, 1)).toEqual(WHITE)
  })

  it("is the reason an alpha-modified label cannot be judged from its token", () => {
    // `text-foreground` is 15.7:1 on the light background; the same token at the
    // 40% the source was written with renders mid-grey and fails AA.
    const themes = readThemes()
    const light = tokenLookup(themes, "light")
    const foreground = oklchToSrgb(light.resolve("foreground")!)
    const background = oklchToSrgb(light.resolve("background")!)

    expect(contrastRatio(foreground, background)).toBeGreaterThan(15)
    expect(contrastRatio(composite(foreground, background, 0.4), background)).toBeLessThan(3)
  })
})

describe("the theme blocks in globals.css", () => {
  const themes = readThemes()

  it("reads both themes", () => {
    expect(themes.light.size).toBeGreaterThan(20)
    expect(themes.dark.size).toBeGreaterThan(20)
  })

  it("resolves a token the dark block overrides to the dark value", () => {
    expect(tokenLookup(themes, "light").resolve("background")!.l).toBeCloseTo(0.985, 3)
    expect(tokenLookup(themes, "dark").resolve("background")!.l).toBeCloseTo(0.02, 3)
  })

  it("follows a var() reference to the colour behind it", () => {
    // `--brand-gradient-from: var(--accent-teal)` in both themes.
    expect(tokenLookup(themes, "dark").resolve("brand-gradient-from")).toEqual(
      tokenLookup(themes, "dark").resolve("accent-teal"),
    )
  })

  it("falls back to the light value for a token the dark block does not redefine", () => {
    // `--media` is the cinematic surface: dark in both themes by design.
    expect(tokenLookup(themes, "dark").resolve("media")).toEqual(tokenLookup(themes, "light").resolve("media"))
  })

  it("reproduces the two ratios axe measured in a browser for text-foreground/40", () => {
    // S62 recorded 3.30:1 on dark and 2.68:1 on light from a real axe run. This
    // model never saw those numbers; agreeing with them is what says it is
    // modelling what the browser paints.
    const measured = (theme: "light" | "dark") => {
      const lookup = tokenLookup(themes, theme)
      const foreground = oklchToSrgb(lookup.resolve("foreground")!)
      const background = oklchToSrgb(lookup.resolve("background")!)
      return contrastRatio(composite(foreground, background, 0.4), background)
    }
    expect(measured("dark")).toBeCloseTo(3.3, 1)
    expect(measured("light")).toBeCloseTo(2.68, 1)
  })
})
