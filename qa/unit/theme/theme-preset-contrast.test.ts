import { describe, expect, it } from "vitest"
import {
  BUILT_IN_PRESETS,
  TITANIUM_TEAL,
  accentStrong,
  buildThemeCss,
  resolveTokens,
  type ColorScheme,
} from "@/features/settings"
import {
  composite,
  contrastRatio,
  oklchToSrgb,
  parseOklch,
  readThemes,
  tokenLookup,
  toRgb255,
  type Srgb,
  type ThemeName,
} from "@/qa/config/contrast"

/**
 * The brand accent the browser paints is NOT the one in `app/globals.css`.
 *
 * `buildThemeCss` emits the active template's tokens as a `:root` / `.dark`
 * block in an inline <style> rendered *after* the stylesheet, so it wins the
 * cascade - `features/docs/content/the-theme-system.ts` says so in as many
 * words. S66 darkened light `--accent-teal` from 0.58 to 0.51 in globals.css
 * and every static guard went green, while five routes kept failing axe at
 * 3.44-3.95:1: the served page was still painting 0.58, because
 * `TITANIUM_TEAL.tokens.light` had not moved and the theme layer re-asserted
 * it over the fix.
 *
 * So a guard that reads only the stylesheet measures a palette no visitor sees.
 * These two claims close that gap:
 *
 *  - The system preset must equal the stylesheet token for token. Its own
 *    comment promises activating it is a visual no-op, and that promise is only
 *    true while the two agree.
 *  - Every built-in preset must clear AA as text, in both schemes, because any
 *    of them can be made live from the admin with no code change. Exempting the
 *    ones that fail would be the same bug signing its own permission slip:
 *    `solar-amber` shipped a light accent at 3.11:1.
 */

/** AA for normal text (1.4.3). The accent is read as text (chips, eyebrows, prices). */
const TEXT_FLOOR = 4.5

/** The scheme names this suite uses, and the CSS class the theme layer keys off. */
const SCHEMES: readonly ColorScheme[] = ["light", "dark"]

const themes = readThemes()

/** The opaque surfaces accent text is drawn on, per scheme. */
function surfaces(scheme: ThemeName): { name: string; colour: Srgb }[] {
  const tokens = tokenLookup(themes, scheme)
  return ["background", "card"].map((name) => {
    const token = tokens.resolve(name)
    expect(token, `--${name} in the ${scheme} block`).not.toBeNull()
    return { name, colour: oklchToSrgb(token!) }
  })
}

function srgb(value: string, label: string): Srgb {
  const parsed = parseOklch(value)
  expect(parsed, `${label} is an oklch() value this model can read`).not.toBeNull()
  return oklchToSrgb(parsed!)
}

describe("the theme layer and the stylesheet agree", () => {
  for (const scheme of SCHEMES) {
    it(`the system preset's ${scheme} tokens are the ones in globals.css`, () => {
      const resolved = resolveTokens(TITANIUM_TEAL, scheme)
      const tokens = tokenLookup(themes, scheme)

      // Compare as rendered colours, not as strings: either file may write the
      // same colour with different spacing or precision, and it is the painted
      // pixel that has to match.
      for (const [property, value] of [
        ["accent-teal", resolved.accent],
        ["accent-teal-muted", resolved.accentMuted],
      ] as const) {
        const stylesheet = tokens.resolve(property)
        expect(stylesheet, `--${property} in the ${scheme} block`).not.toBeNull()
        expect(toRgb255(srgb(value, `${property} in TITANIUM_TEAL.${scheme}`))).toBe(
          toRgb255(oklchToSrgb(stylesheet!)),
        )
      }
    })
  }
})

describe("every preset a client can activate is readable as text", () => {
  for (const preset of BUILT_IN_PRESETS) {
    for (const scheme of SCHEMES) {
      it(`${preset.id} clears AA on ${scheme}`, () => {
        const resolved = resolveTokens(preset, scheme)
        for (const { name, colour } of surfaces(scheme)) {
          for (const [property, value] of [
            ["accent", resolved.accent],
            ["accentMuted", resolved.accentMuted],
          ] as const) {
            const ratio = contrastRatio(srgb(value, `${preset.id}.${scheme}.${property}`), colour)
            expect(
              Number(ratio.toFixed(2)),
              `${preset.id} ${property} on ${scheme} --${name}`,
            ).toBeGreaterThanOrEqual(TEXT_FLOOR)
          }
        }
      })
    }
  }
})

/**
 * The accent's text role, for the one case the block above cannot reach: accent
 * words on a tint mixed from the accent itself.
 *
 * `qa/unit/theme/accent-tint-contrast.test.ts` holds that pair for the
 * stylesheet and explains why the roles had to split. This block holds the half
 * that only the theme layer can answer. `buildThemeCss` emits `--accent-teal`
 * from `StoreSettings.theme`, so the tint a visitor sees is mixed from the
 * *client's* accent - and a text role frozen in `app/globals.css` would be
 * measured against a colour it was never chosen for. Activate Solar Amber and a
 * constant token would put teal words on an amber chip.
 *
 * So the token is derived, and these are the two claims that makes necessary:
 * the theme layer emits it at all, and the derivation clears AA against tints
 * of every accent a client can activate - including the custom ones, which is
 * why the rule is a function of the accent rather than a table of presets.
 *
 * **The ceiling is not slack.** The drop clears AA up to `bg-accent-teal/20`
 * and no further: electric-indigo on light reads 4.55:1 at `/20` and under AA
 * at `/21`. That is exactly the highest alpha in the markup, so the pair of
 * guards has to close from both ends - `accent-tint-contrast` asserts no site
 * asks for more than `MAX_TINT_ALPHA`, and this asserts every preset is
 * readable up to it. Raising a tint past it is a palette change, not a class
 * change, and both files say so.
 */
const MAX_TINT_ALPHA = 0.2

/** The five opaque surfaces a tinted chip can sit on, per scheme. */
function tintBases(scheme: ThemeName): { name: string; colour: Srgb }[] {
  const tokens = tokenLookup(themes, scheme)
  return ["background", "card", "muted", "popover", "sidebar"].map((name) => {
    const token = tokens.resolve(name)
    expect(token, `--${name} in the ${scheme} block`).not.toBeNull()
    return { name, colour: oklchToSrgb(token!) }
  })
}

/** Pulls one declaration out of the `:root` / `.dark` blocks the theme layer emits. */
function emitted(css: string, selector: ":root" | ".dark", property: string): string | null {
  const block = new RegExp(String.raw`${selector === ":root" ? ":root" : "\\.dark"}\s*\{([^}]*)\}`).exec(css)
  if (!block) return null
  const declaration = new RegExp(String.raw`--${property}:\s*([^;]+);`).exec(block[1])
  return declaration ? declaration[1].trim() : null
}

describe("the accent's text role tracks the accent the theme layer emits", () => {
  it("emits the token in both blocks, so neither scheme falls back to the other's value", () => {
    const css = buildThemeCss(TITANIUM_TEAL)
    for (const selector of [":root", ".dark"] as const) {
      expect(
        emitted(css, selector, "accent-teal-strong"),
        `buildThemeCss emits --accent-teal-strong in ${selector} (got: ${css})`,
      ).not.toBeNull()
    }
  })

  for (const scheme of SCHEMES) {
    it(`the system preset's emitted ${scheme} text role is the one in globals.css`, () => {
      // Same promise the block above makes for the accent: activating the
      // shipped preset is a visual no-op, which is only true while the derived
      // value and the stylesheet literal agree.
      const selector = scheme === "light" ? ":root" : ".dark"
      const value = emitted(buildThemeCss(TITANIUM_TEAL), selector, "accent-teal-strong")
      expect(value, `--accent-teal-strong in ${selector}`).not.toBeNull()
      const stylesheet = tokenLookup(themes, scheme).resolve("accent-teal-strong")
      expect(stylesheet, `--accent-teal-strong in the ${scheme} block of globals.css`).not.toBeNull()
      expect(toRgb255(srgb(value!, `the emitted ${scheme} text role`))).toBe(
        toRgb255(oklchToSrgb(stylesheet!)),
      )
    })
  }

  for (const preset of BUILT_IN_PRESETS) {
    for (const scheme of SCHEMES) {
      it(`${preset.id} stays readable on a tint of its own accent on ${scheme}`, () => {
        const accentValue = resolveTokens(preset, scheme).accent
        const accent = srgb(accentValue, `${preset.id}.${scheme}.accent`)
        const strong = srgb(
          accentStrong(accentValue, scheme),
          `${preset.id}.${scheme} derived text role`,
        )

        // Alpha is swept, not listed: a list of the alphas the markup happens to
        // use today is the S63 allow-list in another costume, and the one a
        // future chip asks for would be the one missing from it. Contrast falls
        // monotonically as the tint thickens, so sweeping to the ceiling covers
        // every value under it.
        const measured = tintBases(scheme).flatMap(({ name, colour }) =>
          Array.from({ length: Math.round(MAX_TINT_ALPHA * 100) }, (_, i) => (i + 1) / 100).map(
            (alpha) => ({
              where: `${preset.id} ${scheme}: text role on bg-accent/${alpha * 100} over --${name}`,
              ratio: Number(contrastRatio(strong, composite(accent, colour, alpha)).toFixed(2)),
            }),
          ),
        )

        expect(
          measured.filter(({ ratio }) => ratio < TEXT_FLOOR),
          `worst: ${JSON.stringify(
            measured.reduce((worst, row) => (row.ratio < worst.ratio ? row : worst)),
          )}`,
        ).toEqual([])
      })
    }
  }
})
