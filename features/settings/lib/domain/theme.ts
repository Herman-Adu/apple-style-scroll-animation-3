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
 * How much darker the accent's text role is than the accent itself, per scheme.
 *
 * On light the two roles cannot be one token: the accent reads 4.80:1 on
 * `--muted`, so a tint mixed from it - `bg-accent-teal/10` and up - drags accent
 * words under AA, and no alpha a designer would accept clears it. 0.06 is the
 * drop that fixes every preset: titanium-teal needs 0.06, solar-amber 0.05 and
 * electric-indigo 0.06. On dark the accent clears AA on its own tints with
 * 1.84 to spare, so the text role is the accent and the drop is nothing.
 *
 * The ceiling this buys is exactly the markup's: AA holds to
 * `bg-accent-teal/20` and fails at `/21` on electric-indigo's light accent.
 * `qa/unit/theme/accent-tint-contrast.test.ts` is what keeps the markup inside
 * it, and `theme-preset-contrast.test.ts` holds this rule against every preset.
 */
const ACCENT_STRONG_DROP: Record<ColorScheme, number> = { light: 0.06, dark: 0 }

/** The `oklch(L C H)` the presets and the admin's colour form are written in. */
const OKLCH_LCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/

/**
 * The text role for accent words on a tint of the accent - derived, not stored.
 *
 * It has to be derived because `buildThemeCss` paints `--accent-teal` from the
 * client's own row, so a constant would be measured against somebody else's
 * hue. A value this cannot read is returned unchanged rather than guessed at:
 * the colour forms only ever write `oklch(L C H)`, and a store holding anything
 * else is already outside what any contrast guard in the repo can model.
 */
export function accentStrong(accent: string, scheme: ColorScheme): string {
  const drop = ACCENT_STRONG_DROP[scheme]
  if (drop === 0) return accent
  const match = OKLCH_LCH.exec(accent.trim())
  if (!match) return accent
  const lightness = Math.max(0, Number(match[1]) - drop)
  return `oklch(${Number(lightness.toFixed(3))} ${match[2]} ${match[3]})`
}

/**
 * Build the CSS that overrides the accent/gradient tokens on :root (light) and
 * .dark. Rendered as an inline <style> after globals.css so the whole app
 * re-themes with no per-component edits, SSR-seeded to avoid any flash.
 *
 * The text role is emitted here too, and emitted for both schemes even though
 * dark's is the accent unchanged: this block wins the cascade, so a scheme left
 * out would keep whatever the other one set and paint light's darker teal on a
 * black page.
 */
export function buildThemeCss(theme: ThemeTemplate): string {
  const block = (t: ThemeTokens, scheme: ColorScheme) =>
    [
      `--accent-teal: ${t.accent};`,
      `--accent-teal-strong: ${accentStrong(t.accent, scheme)};`,
      `--accent-teal-muted: ${t.accentMuted};`,
      `--brand-gradient-from: ${t.gradientFrom};`,
      `--brand-gradient-to: ${t.gradientTo};`,
    ].join(" ")
  const light = block(resolveTokens(theme, "light"), "light")
  const dark = block(resolveTokens(theme, "dark"), "dark")
  return `:root { ${light} }\n.dark { ${dark} }`
}
