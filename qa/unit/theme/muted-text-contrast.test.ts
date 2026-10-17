import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import {
  alphaContrast,
  contrastRatio,
  oklchToSrgb,
  readThemes,
  tokenLookup,
  toRgb255,
  type Srgb,
  type ThemeName,
} from "@/qa/config/contrast"

/**
 * Muted text has to be readable, and the repo had no way to notice that it was
 * not. `text-foreground/40` measured 2.68:1 on light and 3.30:1 on dark - both
 * under AA for normal text - and it was written 85 times in 31 files. S62 fixed
 * the docs surface, but only because adding `/docs/what-you-receive` put a doc
 * route in `qa/axe` for the first time; everywhere else was unscanned rather
 * than passing, and axe can only speak for the routes it is given.
 *
 * Two guards, because neither alone is enough:
 *
 *  - The tokens below carry a floor each, measured against both surfaces in
 *    both themes. That is what makes "use the token" a real answer.
 *  - The sweep reads every alpha-modified text utility in the source and
 *    measures what it renders as. That is the half that was missing: a guard
 *    written against the string `text-foreground/40` would have reported
 *    nothing about `text-foreground/50`, which is 3.65:1 on light and was
 *    written 75 times. An allow-list of utilities would have been this bug
 *    agreeing with itself.
 *
 * The sweep refuses a token it has not been taught to place, rather than
 * skipping it, so a new colour cannot enter the source unmeasured.
 */

/** AA for normal text (1.4.3). Everything a user reads is held to this. */
const TEXT_FLOOR = 4.5
/** AA for non-text contrast (1.4.11): graphical objects and control states. */
const GLYPH_FLOOR = 3

/**
 * Every opaque surface the app draws muted text on. Narrowing this to the page
 * background would let a label pass here and fail inside a panel: `--muted` is
 * the tightest of the five in both themes and is where `text-foreground/60`
 * comes closest to the floor, at 4.99:1.
 */
const PAGE_SURFACES = ["background", "card", "muted", "popover", "sidebar"] as const
const THEMES: readonly ThemeName[] = ["light", "dark"]

const themes = readThemes()

interface NamedToken {
  readonly token: string
  readonly floor: number
  readonly role: string
}

/**
 * Every token a reader reads text in, with the floor that applies to it. These
 * floors are the reason the fix for a faint label can be "use the token", so
 * they are pinned here rather than assumed.
 *
 * There is no new token for muted *text*. `--muted-foreground` was already that
 * token, already AA in both themes, and already used 376 times - the ramp from
 * `text-foreground/25` to `/55` was a second muted grey written by eye beside
 * it, and a `--muted-label` would have been a third. `--muted-glyph` is new
 * because no token held the non-text role.
 *
 * The destructive pair is absent because it is held in full by
 * `destructive-contrast.test.ts`, and asserting it twice would mean two files
 * to keep in step. S66 left it here as a known gap - one value for both themes
 * doing two opposed jobs, text on the page and the surface under the white
 * "Sold out" label - and recorded it as "split it per theme, the way every
 * other colour here already is". S67 measured that and it was not enough: on
 * dark the text role needs `L >= 0.62` and the white label on the fill needs
 * `L <= 0.58`, so no per-theme value settles it either. The roles are two
 * tokens now - `--destructive` the fill, `--destructive-strong` the text - and
 * the floors they are held to include the tints mixed from the fill, which the
 * sweep below cannot model for the same reason it cannot model the accent's.
 */
const TOKEN_FLOORS: readonly NamedToken[] = [
  {
    token: "muted-foreground",
    floor: TEXT_FLOOR,
    role: "muted labels, secondary body copy and input placeholders - text, so AA for normal text",
  },
  {
    token: "muted-glyph",
    floor: GLYPH_FLOOR,
    role: "the recessive glyph: an unfilled star in a rating, the watermark year on the About timeline",
  },
  {
    token: "accent-teal",
    floor: TEXT_FLOOR,
    role: "the single accent colour, and a text colour on 122 of its uses",
  },
  {
    token: "accent-teal-muted",
    floor: TEXT_FLOOR,
    role: "the accent's second tone, and where accent text goes when it needs more contrast",
  },
  {
    token: "success",
    floor: TEXT_FLOOR,
    role: 'the positive status colour - the "Open now" badge reads it as text, so AA for normal text',
  },
  {
    token: "warning",
    floor: TEXT_FLOOR,
    role: 'the caution status colour - the "Only N left" line on a product page reads it as text, so AA for normal text',
  },
]

describe.each(TOKEN_FLOORS)("--$token", ({ token, floor, role }) => {
  it.each(THEMES)(`is defined in the %s theme (${role})`, (theme) => {
    expect(themes[theme].has(token), `--${token} missing from the ${theme} theme`).toBe(true)
  })

  it.each(THEMES)(`reaches ${floor}:1 on every surface in the %s theme`, (theme) => {
    const lookup = tokenLookup(themes, theme)
    const colour = lookup.resolve(token)
    expect(colour, `--${token} is not an oklch colour in the ${theme} theme`).not.toBeNull()

    const measured = PAGE_SURFACES.map((surface) => {
      const behind = oklchToSrgb(lookup.resolve(surface)!)
      const ratio = contrastRatio(oklchToSrgb(colour!), behind)
      return { surface, ratio: Number(ratio.toFixed(2)), rendered: toRgb255(oklchToSrgb(colour!)) }
    })

    // Print what was measured, not just a pass: a measuring guard has to show
    // the value it read before either number can be trusted (S60).
    expect(measured.filter(({ ratio }) => ratio < floor), JSON.stringify(measured)).toEqual([])
  })
})

it("exposes every muted token to Tailwind as a utility", () => {
  const css = readFileSync(join(REPO_ROOT, "app/globals.css"), "utf8")
  const themeBlock = /@theme inline\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ""
  for (const { token } of TOKEN_FLOORS) {
    // Without this line `text-muted-label` is not a class and silently does nothing.
    expect(themeBlock, `--color-${token} missing from @theme inline`).toContain(
      `--color-${token}: var(--${token});`,
    )
  }
})

/* ------------------------------------------------------------------ sweep */

type Placement =
  /** A neutral text token, composited over the page surfaces. */
  | { kind: "page"; floor: number }
  /** Drawn on the cinematic media surface, which is dark in both themes. */
  | { kind: "media"; floor: number }
  /**
   * A token carrying hue and meaning. Dimming one of these is refused outright
   * rather than measured: `--accent-teal` is 3.93:1 on light and `--destructive`
   * 4.41:1 on dark at full strength, so there is no alpha below 100% that is
   * safe, and lowering the alpha also drains the hue the colour is there to
   * carry. Use the token, or `--accent-teal-muted`, which is 5.08:1 and 5.95:1.
   */
  | { kind: "coloured" }

const PLACEMENTS: Record<string, Placement> = {
  foreground: { kind: "page", floor: TEXT_FLOOR },
  "muted-foreground": { kind: "page", floor: TEXT_FLOOR },
  "sidebar-foreground": { kind: "page", floor: TEXT_FLOOR },
  "muted-glyph": { kind: "page", floor: GLYPH_FLOOR },
  "on-media": { kind: "media", floor: TEXT_FLOOR },
  white: { kind: "media", floor: TEXT_FLOOR },
  "accent-teal": { kind: "coloured" },
  "accent-teal-muted": { kind: "coloured" },
  destructive: { kind: "coloured" },
  "destructive-strong": { kind: "coloured" },
  success: { kind: "coloured" },
  warning: { kind: "coloured" },
  "accent-orange": { kind: "coloured" },
}

/** Where the app's own markup lives. `qa/` is left out: it asserts, it does not render. */
const SOURCE_TREES = ["app", "components", "features", "lib"]

function sourceFiles(dir: string): string[] {
  const absolute = join(REPO_ROOT, dir)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${dir}/${entry.name}`
    if (entry.isDirectory()) return sourceFiles(relative)
    return /\.(tsx?|css)$/.test(entry.name) ? [relative] : []
  })
}

/**
 * Every alpha-modified text colour in the source, including the ones behind a
 * variant prefix - `placeholder:text-foreground/30` is the colour of text a
 * user reads, and a rule that only matched at a class boundary would miss it.
 */
interface Occurrence {
  readonly file: string
  readonly line: number
  readonly utility: string
  readonly token: string
  readonly alpha: number
}

/**
 * Blanks out block comments while keeping every newline, so a line number in a
 * failure still points at the right line. A mention is not a usage: the first
 * run of this sweep reported the comment in `globals.css` that explains what
 * `text-foreground/25` used to be. That is the S52 rule - what gets refused has
 * to be an occurrence that reaches a reader, never the vocabulary needed to
 * describe it.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
}

function occurrences(): Occurrence[] {
  const found: Occurrence[] = []
  for (const dir of SOURCE_TREES) {
    for (const file of sourceFiles(dir)) {
      const lines = withoutComments(readFileSync(join(REPO_ROOT, file), "utf8")).split("\n")
      lines.forEach((line, index) => {
        for (const match of line.matchAll(/\btext-([a-z][a-z0-9-]*)\/(\d{1,3})\b/g)) {
          found.push({
            file,
            line: index + 1,
            utility: `text-${match[1]}/${match[2]}`,
            token: match[1],
            alpha: Number(match[2]) / 100,
          })
        }
      })
    }
  }
  return found
}

const found = occurrences()

describe("every alpha-modified text colour in the source", () => {
  it("finds the utilities to measure, so a silent sweep cannot pass", () => {
    expect(found.length).toBeGreaterThan(50)
  })

  it("is drawn from a token this guard knows where to place", () => {
    const unplaced = [...new Set(found.filter((o) => !PLACEMENTS[o.token]).map((o) => o.utility))]
    expect(
      unplaced,
      `add these to PLACEMENTS with the surface they are drawn on: ${unplaced.join(", ")}`,
    ).toEqual([])
  })

  it("never dims a token that carries hue and meaning", () => {
    const dimmed = found
      .filter((o) => PLACEMENTS[o.token]?.kind === "coloured")
      .map((o) => `${o.file}:${o.line} ${o.utility}`)
    expect(dimmed, "use the token at full strength, or --accent-teal-muted").toEqual([])
  })

  it("renders at or above its floor in both themes", () => {
    const failures = found.flatMap((occurrence) => {
      const placement = PLACEMENTS[occurrence.token]
      if (!placement || placement.kind === "coloured") return []
      const surfaces = placement.kind === "media" ? (["media"] as const) : PAGE_SURFACES
      // Media tokens are theme-independent by design, so one theme speaks for both.
      const themeNames = placement.kind === "media" ? (["light"] as const) : THEMES

      return themeNames.flatMap((theme) => {
        const lookup = tokenLookup(themes, theme)
        const colour = occurrence.token === "white" ? null : lookup.resolve(occurrence.token)
        const literal: Srgb | null = occurrence.token === "white" ? ([1, 1, 1] as const) : null

        return surfaces.flatMap((surface) => {
          const behind = oklchToSrgb(lookup.resolve(surface)!)
          const ratio = literal
            ? contrastRatio(
                literal.map((c, i) => c * occurrence.alpha + behind[i] * (1 - occurrence.alpha)) as unknown as Srgb,
                behind,
              )
            : alphaContrast(colour!, behind, occurrence.alpha)
          return ratio < placement.floor
            ? [
                `${occurrence.file}:${occurrence.line} ${occurrence.utility} is ${ratio.toFixed(2)}:1 on ${theme}/${surface}, needs ${placement.floor}:1`,
              ]
            : []
        })
      })
    })

    expect(failures).toEqual([])
  })
})
