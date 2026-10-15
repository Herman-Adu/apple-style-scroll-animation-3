// The palettes and shipped defaults this product comes with.
//
// Split from `./theme` so the pure helpers stay readable: a preset is data a
// designer edits, the helpers are logic. `./theme-snapshots` records what these
// used to be, because a store that installed one froze a copy in its database.

import type { HeadingAccent, ThemeState, ThemeTemplate } from "./theme"

/** The tasteful shipped default: titles + section headlines accented, cards calm. */
export const DEFAULT_HEADING_ACCENT: HeadingAccent = { h1: true, h2: true, cards: false }

/**
 * The default system theme. Its light/dark values are the EXACT tokens that
 * shipped in globals.css, so activating it is a visual no-op — the whole point
 * of the single source of truth is that nothing changes until a client edits.
 *
 * That "EXACT" is load-bearing, and until S66 nothing held it: `buildThemeCss`
 * emits these as a `:root` block after the stylesheet, so when S66 darkened
 * light `--accent-teal` in globals.css alone, the theme layer went on painting
 * the old 0.58 and five routes kept failing axe while every static guard passed.
 * `qa/unit/theme/theme-preset-contrast.test.ts` now compares the two.
 */
export const TITANIUM_TEAL: ThemeTemplate = {
  id: "titanium-teal",
  name: "Titanium Teal",
  kind: "system",
  headingStyle: "two-tone",
  headingAccent: DEFAULT_HEADING_ACCENT,
  tokens: {
    accent: "oklch(0.74 0.086 195)",
    accentMuted: "oklch(0.62 0.07 197)",
    light: {
      accent: "oklch(0.51 0.09 197)",
      accentMuted: "oklch(0.45 0.08 198)",
    },
    dark: {
      accent: "oklch(0.74 0.086 195)",
      accentMuted: "oklch(0.62 0.07 197)",
    },
  },
}

/**
 * A warmer amber alternate — demonstrates re-theming with zero code edits.
 *
 * Its light accents are darker than the dark-scheme pair rather than a tint of
 * them: amber at the dark theme's lightness measures 3.11:1 as text on a white
 * page, so the "zero code edits" promise would have handed a client an
 * unreadable storefront. Picked to land on the same ratios Titanium Teal does.
 */
export const SOLAR_AMBER: ThemeTemplate = {
  id: "solar-amber",
  name: "Solar Amber",
  kind: "system",
  headingStyle: "two-tone",
  tokens: {
    accent: "oklch(0.78 0.15 70)",
    accentMuted: "oklch(0.68 0.13 55)",
    light: { accent: "oklch(0.53 0.15 58)", accentMuted: "oklch(0.47 0.13 50)" },
    dark: { accent: "oklch(0.78 0.15 70)", accentMuted: "oklch(0.68 0.13 55)" },
  },
}

/** A vivid indigo alternate. */
export const ELECTRIC_INDIGO: ThemeTemplate = {
  id: "electric-indigo",
  name: "Electric Indigo",
  kind: "system",
  headingStyle: "gradient",
  tokens: {
    accent: "oklch(0.68 0.18 275)",
    accentMuted: "oklch(0.6 0.16 300)",
    gradientFrom: "oklch(0.72 0.18 265)",
    gradientTo: "oklch(0.66 0.19 320)",
    light: { accent: "oklch(0.55 0.2 275)", accentMuted: "oklch(0.5 0.18 300)" },
    dark: { accent: "oklch(0.68 0.18 275)", accentMuted: "oklch(0.6 0.16 300)" },
  },
}

/** Presets a client can pick from in the admin (does not include their customs). */
export const BUILT_IN_PRESETS: ThemeTemplate[] = [TITANIUM_TEAL, SOLAR_AMBER, ELECTRIC_INDIGO]

/** The shipping default state: the brand template, active. */
export const DEFAULT_THEME_STATE: ThemeState = {
  activeThemeId: TITANIUM_TEAL.id,
  themes: [TITANIUM_TEAL],
}
