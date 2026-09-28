// Single source of truth for brand identity.
//
// The theme is a *library* of named templates (the brand default now; seasonal /
// campaign themes like "Christmas" in the future) with exactly one active. The
// storefront, admin, and email all resolve the active template — there is no
// second brand-colour field to drift. Everything here is pure and serialisable
// so it round-trips through the `StoreSettings.theme` JSON column untouched.

/** How headlines are tinted. Drives the shared `TwoToneTitle` primitive. */
export type HeadingStyle = "two-tone" | "solid" | "gradient"

/**
 * How far the accent treatment reaches.
 *  - "primary": heroes + section titles carry the accent; repeated/card titles
 *    (marked `emphasis="secondary"`) stay calm. The tasteful default.
 *  - "all": the accent reaches down to small cards and repeated item titles for
 *    a bolder, fully-branded look.
 * Injected as `data-heading-scope` on <html>; pure CSS toggles the reach with
 * no per-heading edits.
 */
export type HeadingScope = "primary" | "all"

export type ThemeKind = "system" | "custom" | "seasonal"

/** The colour tokens a template controls. Values are any valid CSS colour
 * string (oklch, hex, …) so pickers and hand-authored presets both work. */
export interface ThemeTokens {
  /** Primary brand colour -> --accent-teal */
  accent: string
  /** Second tone -> --accent-teal-muted (two-tone gradient end, hairlines) */
  accentMuted: string
  /** Whole-title gradient start (used when headingStyle === "gradient"). */
  gradientFrom?: string
  /** Whole-title gradient end. */
  gradientTo?: string
}

/** A single named theme. `tokens` holds the base (dark-first, matching the
 * site's primary surface); optional `light`/`dark` refine per colour scheme. */
export interface ThemeTemplate {
  id: string
  name: string
  kind: ThemeKind
  headingStyle: HeadingStyle
  /** How far the accent reaches. Defaults to "primary" when absent so existing
   * persisted themes round-trip unchanged. */
  headingScope?: HeadingScope
  tokens: ThemeTokens & {
    light?: Partial<ThemeTokens>
    dark?: Partial<ThemeTokens>
  }
  /** RESERVED for future seasonal effects (snow, campaign banners…). Unused. */
  effects?: unknown
}

/** The persisted library: every template plus which one is live. */
export interface ThemeState {
  activeThemeId: string
  themes: ThemeTemplate[]
}

export type ColorScheme = "light" | "dark"

/* -------------------------------------------------------------------------- */
/* Built-in presets                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The default system theme. Its light/dark values are the EXACT tokens that
 * shipped in globals.css, so activating it is a visual no-op — the whole point
 * of the single source of truth is that nothing changes until a client edits.
 */
export const TITANIUM_TEAL: ThemeTemplate = {
  id: "titanium-teal",
  name: "Titanium Teal",
  kind: "system",
  headingStyle: "two-tone",
  tokens: {
    accent: "oklch(0.74 0.086 195)",
    accentMuted: "oklch(0.62 0.07 197)",
    light: {
      accent: "oklch(0.58 0.09 197)",
      accentMuted: "oklch(0.52 0.08 198)",
    },
    dark: {
      accent: "oklch(0.74 0.086 195)",
      accentMuted: "oklch(0.62 0.07 197)",
    },
  },
}

/** A warmer amber alternate — demonstrates re-theming with zero code edits. */
export const SOLAR_AMBER: ThemeTemplate = {
  id: "solar-amber",
  name: "Solar Amber",
  kind: "system",
  headingStyle: "two-tone",
  tokens: {
    accent: "oklch(0.78 0.15 70)",
    accentMuted: "oklch(0.68 0.13 55)",
    light: { accent: "oklch(0.66 0.15 58)", accentMuted: "oklch(0.6 0.13 50)" },
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

/* -------------------------------------------------------------------------- */
/* Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Coerce an unknown JSON value (or missing column) into a valid ThemeState. */
export function normalizeThemeState(value: unknown): ThemeState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_THEME_STATE
  const v = value as Partial<ThemeState>
  const themes = Array.isArray(v.themes) ? v.themes.filter(isThemeTemplate) : []
  if (themes.length === 0) return DEFAULT_THEME_STATE
  const activeThemeId = themes.some((t) => t.id === v.activeThemeId) ? v.activeThemeId! : themes[0].id
  return { activeThemeId, themes }
}

function isThemeTemplate(value: unknown): value is ThemeTemplate {
  if (!value || typeof value !== "object") return false
  const t = value as Partial<ThemeTemplate>
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    !!t.tokens &&
    typeof t.tokens.accent === "string" &&
    typeof t.tokens.accentMuted === "string"
  )
}

/** The live template (falls back to the first, then the built-in default). */
export function getActiveTheme(state: ThemeState): ThemeTemplate {
  return state.themes.find((t) => t.id === state.activeThemeId) ?? state.themes[0] ?? TITANIUM_TEAL
}

/** The accent reach for a template, defaulting to the tasteful "primary". */
export function getHeadingScope(theme: ThemeTemplate): HeadingScope {
  return theme.headingScope ?? "primary"
}

/** Resolve the effective tokens for a colour scheme (base merged with override). */
export function resolveTokens(theme: ThemeTemplate, scheme: ColorScheme): ThemeTokens {
  const base = theme.tokens
  const override = scheme === "light" ? base.light : base.dark
  return {
    accent: override?.accent ?? base.accent,
    accentMuted: override?.accentMuted ?? base.accentMuted,
    gradientFrom: override?.gradientFrom ?? base.gradientFrom ?? override?.accent ?? base.accent,
    gradientTo: override?.gradientTo ?? base.gradientTo ?? override?.accentMuted ?? base.accentMuted,
  }
}

/** Insert or replace a template by id (immutable). */
export function upsertTheme(state: ThemeState, theme: ThemeTemplate): ThemeState {
  const exists = state.themes.some((t) => t.id === theme.id)
  const themes = exists ? state.themes.map((t) => (t.id === theme.id ? theme : t)) : [...state.themes, theme]
  return { ...state, themes }
}

/** Make a template active (no-op if the id is unknown). */
export function activateTheme(state: ThemeState, id: string): ThemeState {
  if (!state.themes.some((t) => t.id === id)) return state
  return { ...state, activeThemeId: id }
}

/** Remove a template. Never removes the last one; reassigns active if needed. */
export function removeTheme(state: ThemeState, id: string): ThemeState {
  const themes = state.themes.filter((t) => t.id !== id)
  if (themes.length === 0) return state
  const activeThemeId = themes.some((t) => t.id === state.activeThemeId) ? state.activeThemeId : themes[0].id
  return { activeThemeId, themes }
}

/** Duplicate a template under a fresh id/name (for "duplicate" + seasonal slots). */
export function duplicateTheme(theme: ThemeTemplate, id: string, name: string): ThemeTemplate {
  return { ...structuredCloneSafe(theme), id, name, kind: "custom" }
}

/** structuredClone with a JSON fallback for older runtimes. */
function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Build the CSS that overrides the accent/gradient tokens on :root (light) and
 * .dark. Rendered as an inline <style> after globals.css so the whole app
 * re-themes with no per-component edits, SSR-seeded to avoid any flash.
 */
export function buildThemeCss(theme: ThemeTemplate): string {
  const light = resolveTokens(theme, "light")
  const dark = resolveTokens(theme, "dark")
  const block = (t: ThemeTokens) =>
    [
      `--accent-teal: ${t.accent};`,
      `--accent-teal-muted: ${t.accentMuted};`,
      `--brand-gradient-from: ${t.gradientFrom};`,
      `--brand-gradient-to: ${t.gradientTo};`,
    ].join(" ")
  return `:root { ${block(light)} }\n.dark { ${block(dark)} }`
}
