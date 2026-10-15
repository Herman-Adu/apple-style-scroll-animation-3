// Single source of truth for brand identity.
//
// The theme is a *library* of named templates (the brand default now; seasonal /
// campaign themes like "Christmas" in the future) with exactly one active. The
// storefront, admin, and email all resolve the active template — there is no
// second brand-colour field to drift. Everything here is pure and serialisable
// so it round-trips through the `StoreSettings.theme` JSON column untouched.

import {
  BUILT_IN_PRESETS,
  DEFAULT_HEADING_ACCENT,
  DEFAULT_THEME_STATE,
  TITANIUM_TEAL,
} from "./theme-presets"
import { isSupersededSnapshot } from "./theme-snapshots"

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

/**
 * Independent accent reach per heading tier. Each flag turns the brand accent
 * on/off for that tier site-wide, so a client can, e.g., accent page titles
 * (h1) but leave section headlines (h2) and small card titles plain — any
 * combination. Injected as `data-accent-h1|h2|cards` on <html>; pure CSS gates
 * each tier with no per-heading edits.
 *  - h1:    page/hero titles (SectionHeading `as="h1"`, page & scroll heroes)
 *  - h2:    section headlines (the default tier)
 *  - cards: repeated/card & list/timeline titles (`emphasis="secondary"`)
 */
export interface HeadingAccent {
  h1: boolean
  h2: boolean
  cards: boolean
}

export type HeadingTier = "h1" | "h2" | "card"

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
  /** LEGACY. Superseded by `headingAccent`. Kept only so old persisted themes
   * still migrate cleanly via `getHeadingAccent`. Do not write new values here. */
  headingScope?: HeadingScope
  /** Per-tier accent reach (h1 / h2 / cards). Absent falls back to the legacy
   * `headingScope`, then to `DEFAULT_HEADING_ACCENT`, so everything round-trips. */
  headingAccent?: HeadingAccent
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
/* Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Refresh an unedited snapshot of a built-in preset from shipped code. The
 * database, not this file, is what the browser paints for a store that once
 * installed a preset — `./theme-snapshots` has the whole story and decides
 * which copies are stale.
 */
function refreshPresetTokens(theme: ThemeTemplate): ThemeTemplate {
  const builtIn = BUILT_IN_PRESETS.find((preset) => preset.id === theme.id)
  if (!builtIn || !isSupersededSnapshot(theme)) return theme
  return { ...theme, tokens: structuredCloneSafe(builtIn.tokens) }
}

/** Coerce an unknown JSON value (or missing column) into a valid ThemeState. */
export function normalizeThemeState(value: unknown): ThemeState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_THEME_STATE
  const v = value as Partial<ThemeState>
  const themes = Array.isArray(v.themes) ? v.themes.filter(isThemeTemplate).map(refreshPresetTokens) : []
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

/**
 * The per-tier accent reach for a template. Prefers the new `headingAccent`;
 * otherwise migrates the legacy `headingScope` ("all" lit everything; "primary"
 * kept cards calm); otherwise the shipped default. Always returns a full object.
 */
export function getHeadingAccent(theme: ThemeTemplate): HeadingAccent {
  if (theme.headingAccent) {
    return {
      h1: theme.headingAccent.h1 ?? DEFAULT_HEADING_ACCENT.h1,
      h2: theme.headingAccent.h2 ?? DEFAULT_HEADING_ACCENT.h2,
      cards: theme.headingAccent.cards ?? DEFAULT_HEADING_ACCENT.cards,
    }
  }
  if (theme.headingScope === "all") return { h1: true, h2: true, cards: true }
  return { ...DEFAULT_HEADING_ACCENT }
}

/**
 * Restore the active template's *look* — heading style, per-tier accent reach
 * and brand colour tokens — to the shipped Titanium Teal defaults, while keeping
 * its id/name/kind so the client's named theme (and library) is preserved.
 */
export function resetActiveThemeToDefault(state: ThemeState): ThemeState {
  const active = getActiveTheme(state)
  const reset: ThemeTemplate = {
    ...active,
    headingStyle: TITANIUM_TEAL.headingStyle,
    headingAccent: { ...DEFAULT_HEADING_ACCENT },
    headingScope: undefined,
    tokens: structuredCloneSafe(TITANIUM_TEAL.tokens),
  }
  return upsertTheme(state, reset)
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
