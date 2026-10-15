import { describe, expect, it } from "vitest"
import {
  BUILT_IN_PRESETS,
  SOLAR_AMBER,
  TITANIUM_TEAL,
  normalizeThemeState,
  resolveTokens,
  type ThemeState,
  type ThemeTemplate,
} from "@/features/settings"

/**
 * `StoreSettings.theme` stores a full copy of every installed template, so a
 * store that ever activated a built-in preset froze that preset's colours in
 * its own database. Shipped code then stops being the source of truth for them:
 * S66 darkened light `--accent-teal` in `app/globals.css` AND in
 * `TITANIUM_TEAL`, and the served page still painted the old 0.58, because the
 * database held a snapshot taken before either edit and `buildThemeCss` renders
 * whatever came out of the column.
 *
 * So a persisted system preset is re-hydrated from code - but only when its
 * colours still match a set that preset actually used to ship with. A client
 * can edit the active template's colours in place (`brand-colors-form` upserts
 * under the same id), and silently reverting a client's brand colour to ship a
 * contrast fix would be a worse bug than the one being fixed.
 */

const state = (themes: ThemeTemplate[], activeThemeId = themes[0]?.id): ThemeState => ({ activeThemeId, themes })

/** The exact snapshot in this repo's own database before S66 - the bug's evidence. */
const SUPERSEDED_TITANIUM: ThemeTemplate = {
  ...TITANIUM_TEAL,
  tokens: {
    accent: "oklch(0.74 0.086 195)",
    accentMuted: "oklch(0.62 0.07 197)",
    light: { accent: "oklch(0.58 0.09 197)", accentMuted: "oklch(0.52 0.08 198)" },
    dark: { accent: "oklch(0.74 0.086 195)", accentMuted: "oklch(0.62 0.07 197)" },
  },
}

describe("a persisted system preset tracks shipped code", () => {
  it("re-hydrates a stale snapshot of a built-in preset", () => {
    const normalized = normalizeThemeState(state([SUPERSEDED_TITANIUM]))
    const tokens = resolveTokens(normalized.themes[0], "light")

    expect(tokens.accent).toBe(resolveTokens(TITANIUM_TEAL, "light").accent)
    expect(tokens.accentMuted).toBe(resolveTokens(TITANIUM_TEAL, "light").accentMuted)
  })

  it("re-hydrates every built-in whose snapshot is stale, not only the active one", () => {
    const stale: ThemeTemplate = {
      ...SOLAR_AMBER,
      tokens: {
        ...SOLAR_AMBER.tokens,
        light: { accent: "oklch(0.66 0.15 58)", accentMuted: "oklch(0.6 0.13 50)" },
      },
    }
    const normalized = normalizeThemeState(state([SUPERSEDED_TITANIUM, stale], TITANIUM_TEAL.id))
    const amber = normalized.themes.find((t) => t.id === SOLAR_AMBER.id)!

    expect(resolveTokens(amber, "light").accent).toBe(resolveTokens(SOLAR_AMBER, "light").accent)
  })

  it("leaves a client's own colour alone, even one channel from a shipped set", () => {
    const edited: ThemeTemplate = {
      ...SUPERSEDED_TITANIUM,
      tokens: {
        ...SUPERSEDED_TITANIUM.tokens,
        light: { accent: "oklch(0.58 0.09 198)", accentMuted: "oklch(0.52 0.08 198)" },
      },
    }
    const normalized = normalizeThemeState(state([edited]))

    expect(resolveTokens(normalized.themes[0], "light").accent).toBe("oklch(0.58 0.09 198)")
  })

  it("never touches a client-authored template", () => {
    const custom: ThemeTemplate = {
      id: "house-red",
      name: "House Red",
      kind: "custom",
      headingStyle: "solid",
      tokens: { accent: "oklch(0.5 0.2 25)", accentMuted: "oklch(0.44 0.18 25)" },
    }
    const normalized = normalizeThemeState(state([custom]))

    expect(normalized.themes[0]).toEqual(custom)
  })

  it("leaves a preset that is already current untouched, so the table cannot loop", () => {
    for (const preset of BUILT_IN_PRESETS) {
      const normalized = normalizeThemeState(state([preset]))
      expect(normalized.themes[0], preset.id).toEqual(preset)
    }
  })
})
