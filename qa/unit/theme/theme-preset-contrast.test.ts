import { describe, expect, it } from "vitest"
import { BUILT_IN_PRESETS, TITANIUM_TEAL, resolveTokens, type ColorScheme } from "@/features/settings"
import {
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
