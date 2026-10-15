// What a built-in theme preset used to ship as, and how to tell a stale copy of
// shipped code from a colour the client chose.
//
// The `StoreSettings.theme` column holds a full copy of every installed
// template, so a store that once activated a built-in froze that preset's
// colours in its own database — and `buildThemeCss` paints whatever came out of
// the column, as a `:root` block after globals.css. Editing a preset constant
// therefore reaches new stores only. S66 learned this from the served page: the
// stylesheet said 0.51, the constant said 0.51, and the browser painted the
// 0.58 the column remembered, failing five routes at 3.44–3.95:1.
//
// Pure and type-only-dependent on `./theme`, so there is no runtime cycle.

import type { ThemeTemplate, ThemeTokens } from "./theme"

/**
 * Token sets a built-in preset actually used to ship with, by its id — ids are
 * historical facts here, so they are written out rather than read off the
 * constants they describe.
 *
 * Add a row whenever a built-in preset's colours change, or stores that already
 * installed it keep the old ones for good.
 */
const SUPERSEDED_PRESET_TOKENS: Record<string, ThemeTemplate["tokens"][]> = {
  "titanium-teal": [
    {
      accent: "oklch(0.74 0.086 195)",
      accentMuted: "oklch(0.62 0.07 197)",
      light: { accent: "oklch(0.58 0.09 197)", accentMuted: "oklch(0.52 0.08 198)" },
      dark: { accent: "oklch(0.74 0.086 195)", accentMuted: "oklch(0.62 0.07 197)" },
    },
  ],
  "solar-amber": [
    {
      accent: "oklch(0.78 0.15 70)",
      accentMuted: "oklch(0.68 0.13 55)",
      light: { accent: "oklch(0.66 0.15 58)", accentMuted: "oklch(0.6 0.13 50)" },
      dark: { accent: "oklch(0.78 0.15 70)", accentMuted: "oklch(0.68 0.13 55)" },
    },
  ],
}

/** Every colour a token set carries, in a fixed order, so two can be compared. */
function tokenFingerprint(tokens: ThemeTemplate["tokens"]): string {
  const colours = (scope?: Partial<ThemeTokens>) =>
    [scope?.accent, scope?.accentMuted, scope?.gradientFrom, scope?.gradientTo].map((c) => c ?? "").join("|")
  return [colours(tokens), colours(tokens.light), colours(tokens.dark)].join("/")
}

/**
 * True when a persisted template's colours still match a set its preset used to
 * ship with — an unedited snapshot, safe to refresh from code.
 *
 * One channel different means the client chose it: `brand-colors-form` writes an
 * edit back under the same id, and reverting that to ship a contrast fix would
 * be a worse bug than the one being fixed.
 */
export function isSupersededSnapshot(theme: ThemeTemplate): boolean {
  const superseded = SUPERSEDED_PRESET_TOKENS[theme.id] ?? []
  const fingerprint = tokenFingerprint(theme.tokens)
  return superseded.some((tokens) => tokenFingerprint(tokens) === fingerprint)
}
