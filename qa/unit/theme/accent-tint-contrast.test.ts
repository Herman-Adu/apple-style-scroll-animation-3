import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import {
  composite,
  contrastRatio,
  oklchToSrgb,
  readThemes,
  tokenLookup,
  toRgb255,
  type Srgb,
  type ThemeName,
} from "@/qa/config/contrast"

/**
 * The brand accent read as *text* on a tint mixed from itself.
 *
 * This is the third time the repo has met this shape. S66 found it on the
 * accent and could not model it; S67 modelled it for `--destructive` and split
 * that colour into a fill role and a text role; S72 met it again on `--success`
 * and resolved it by *lowering the alpha*, which `status-tint-contrast.test.ts`
 * records. None of those three answers works here, and the reason is the
 * measurement that decides the shape:
 *
 * **Light `--accent-teal` has 0.30 of headroom and a tint of itself eats all of
 * it.** The solid token reads 4.80:1 on `--muted`, its worst page surface. A
 * tint mixed from the colour is always closer to it than the page is, so every
 * alpha the markup asks for lands under AA on that surface - `/10` at 4.20:1,
 * `/12` at 4.08:1, `/15` at 3.92:1, `/20` at 3.65:1. Clearing 4.5:1 there would
 * need an alpha near zero, which is no tint at all. So S72's answer - move the
 * alpha - is not available at any value a designer would accept, and the roles
 * have to come apart the way `--destructive`'s did in S67.
 *
 * Hence `--accent-teal-strong`: the accent's hue and chroma, 0.06 darker on
 * light, and identical to the accent on dark, where it has 1.84 of headroom on
 * its worst tint (6.34:1) and needs no second role at all. A token that is a
 * no-op in one theme reads like a mistake, so the no-op is asserted below
 * rather than left to be rediscovered and "fixed".
 *
 * **Why it is derived and not a constant.** `buildThemeCss` emits
 * `--accent-teal` from `StoreSettings.theme`, so the accent a visitor sees is
 * the client's, not the stylesheet's - S66's trap, and the reason
 * `theme-preset-contrast.test.ts` exists. A constant text role would be mixed
 * against somebody else's hue: activate Solar Amber and an amber tint would
 * carry teal words. So the strong token is derived from whichever accent is
 * live, and `theme-preset-contrast.test.ts` holds that derivation for every
 * preset in both schemes. This file holds the stylesheet's own pair.
 *
 * **The near miss that is not the fix.** `--accent-teal-muted` already sits at
 * exactly the lightness the text role needs on the default theme (0.45), and
 * reusing it would have cost no new token. It fails on three of the six
 * preset-scheme pairs - electric-indigo reads 4.43:1 on light and 3.58:1 on
 * dark - because it is the far end of the brand gradient, a client edits it
 * independently of the accent, and nothing makes it track. Its job is to stay a
 * tone apart, which is not a contrast guarantee.
 *
 * Two limits this file cannot see, inherited from `status-tint-contrast`:
 *
 *  - **It pairs by class string, not by element.** One element's Tailwind
 *    classes are one quoted run, which holds for every site here including the
 *    `cn()` conditionals, but a pair split across two template literals would
 *    be missed.
 *  - **It holds every site to all five page surfaces.** Most are drawn on only
 *    one of them. That is deliberately conservative - a static sweep cannot
 *    know which surface a site sits on (S66) - and here it costs nothing,
 *    because the strong token clears AA on all five at every alpha in the tree.
 */

/** AA for normal text (1.4.3). Every pair below is text a reader reads. */
const TEXT_FLOOR = 4.5

/** The same five surfaces the other colour guards use; `--muted` is the tightest. */
const PAGE_SURFACES = ["background", "card", "muted", "popover", "sidebar"] as const
const THEMES: readonly ThemeName[] = ["light", "dark"]

/** The fill role: the only token a `bg-accent-teal/N` tint is ever mixed from. */
const FILL_TOKEN = "accent-teal"

/**
 * The thickest tint the derived text role can survive, and it is not slack.
 *
 * `accentStrong` darkens the accent by 0.06 on light, which clears AA up to
 * `/20` and fails at `/21` on electric-indigo's light accent - the tightest of
 * the three presets a client can activate with no code change. The markup's
 * thickest tint is exactly `/20`, so this guard and
 * `theme-preset-contrast.test.ts` have to close from both ends: that file holds
 * every preset readable up to this ceiling, and the assertion below keeps the
 * markup from walking past it. A thicker chip is a palette decision - it needs a
 * bigger drop, measured against all three presets - and not a class change.
 */
const MAX_TINT_ALPHA = 0.2

/**
 * The text roles that can sit on that tint. `--accent-teal` is in the pattern
 * on purpose: it is the one that fails, and leaving it out would make this the
 * S63 allow-list - a guard green because it stopped looking. Longest first, so
 * `accent-teal-strong` is never read as `accent-teal`.
 */
const TEXT_TOKENS = ["accent-teal-strong", "accent-teal"] as const

const themes = readThemes()

function resolved(theme: ThemeName, token: string): Srgb {
  const colour = tokenLookup(themes, theme).resolve(token)
  expect(colour, `--${token} is an oklch colour in the ${theme} theme`).not.toBeNull()
  return oklchToSrgb(colour!)
}

/** Where the app's own markup lives. `qa/` asserts, it does not render. */
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

/** Blanks block comments while keeping newlines, so a reported line still points at the right line. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
}

/**
 * The tinted fill, with whatever variant prefixes sit in front of it. The
 * prefix is captured rather than ignored: a `dark:`-only fill paints on dark
 * alone, and holding light to a tint it never renders is how a naive sweep
 * reported a 4.09:1 on the shadcn menus that is never on screen.
 */
const FILL = new RegExp(
  String.raw`(?:^|[\s])((?:[a-z-]+:)*)bg-(${FILL_TOKEN})/(\d{1,3}|\[[\d.]+\])(?![-\w])`,
  "g",
)
const TEXT = new RegExp(String.raw`\btext-(${TEXT_TOKENS.join("|")})(?![-\w])`, "g")

interface Pair {
  readonly file: string
  readonly line: number
  readonly alpha: number
  readonly text: string
  readonly themes: readonly ThemeName[]
}

function pairs(): Pair[] {
  return SOURCE_TREES.flatMap(sourceFiles).flatMap((file) => {
    const lines = withoutComments(readFileSync(join(REPO_ROOT, file), "utf8")).split("\n")
    return lines.flatMap((line, index) =>
      // A quoted run is one element's classes; `cn()` conditionals keep each
      // branch in its own string, which is what makes this pairing safe here.
      line.split(/["'`]/).flatMap((chunk) => {
        const fills = [...chunk.matchAll(FILL)]
        const texts = [...chunk.matchAll(TEXT)]
        if (fills.length === 0 || texts.length === 0) return []
        return fills.flatMap((fill) => {
          const raw = fill[3]
          const onDarkOnly = fill[1].includes("dark:")
          return texts.map((text) => ({
            file,
            line: index + 1,
            alpha: raw.startsWith("[") ? Number(raw.slice(1, -1)) : Number(raw) / 100,
            text: text[1],
            themes: onDarkOnly ? (["dark"] as const) : THEMES,
          }))
        })
      }),
    )
  })
}

const found = pairs()

describe("the accent read as text on its own tint", () => {
  it("finds the pairs to measure, so a silent sweep cannot pass", () => {
    // If the pattern stops matching, the measurement below passes trivially -
    // the S71 no-op red in guard form. 52 sites were in the tree when this was
    // written; the floor sits well under that so ordinary deletions do not fail
    // it, and well over zero so a broken pattern does.
    expect(found.length, `found: ${JSON.stringify(found, null, 1)}`).toBeGreaterThanOrEqual(40)
  })

  it(`reaches ${TEXT_FLOOR}:1 wherever the markup paints it`, () => {
    const measured = found.flatMap((pair) =>
      pair.themes.flatMap((theme) =>
        PAGE_SURFACES.map((name) => {
          const tint = composite(resolved(theme, FILL_TOKEN), resolved(theme, name), pair.alpha)
          return {
            where: `${pair.file}:${pair.line} text-${pair.text} on bg-${FILL_TOKEN}/${pair.alpha * 100} over --${name} (${theme})`,
            ratio: Number(contrastRatio(resolved(theme, pair.text), tint).toFixed(2)),
            rendered: toRgb255(tint),
          }
        }),
      ),
    )

    // Print every measurement, not just a pass: a measuring guard has to show
    // the value it read before either number can be trusted (S60).
    expect(
      measured.filter(({ ratio }) => ratio < TEXT_FLOOR),
      JSON.stringify(measured, null, 1),
    ).toEqual([])
  })

  it(`asks for no tint thicker than /${MAX_TINT_ALPHA * 100}, which is where the derivation runs out`, () => {
    // The other half of the pair in `theme-preset-contrast.test.ts`. The
    // measurement above uses this stylesheet's accent; a client's accent is a
    // different colour with a different margin, and electric-indigo has none to
    // spare at this alpha. So the floor below is not a style rule - it is the
    // boundary of what the derived text role can be held to for every preset.
    expect(
      found
        .filter(({ alpha }) => alpha > MAX_TINT_ALPHA)
        .map(({ file, line, alpha }) => `${file}:${line} bg-${FILL_TOKEN}/${alpha * 100}`),
      `a thicker tint needs a bigger drop in accentStrong, measured against every preset first`,
    ).toEqual([])
  })

  it("keeps the text role out of the fill role's job", () => {
    // The split is only worth its token while the two roles differ where it
    // matters. On light the text role must be darker; on dark it is deliberately
    // the same colour, because the accent already clears AA on its own tints
    // there and a second value would be a number nobody could justify.
    const light = tokenLookup(themes, "light")
    const dark = tokenLookup(themes, "dark")
    const lightAccent = light.resolve(FILL_TOKEN)
    const lightStrong = light.resolve("accent-teal-strong")
    const darkAccent = dark.resolve(FILL_TOKEN)
    const darkStrong = dark.resolve("accent-teal-strong")
    for (const [label, token] of [
      ["light --accent-teal", lightAccent],
      ["light --accent-teal-strong", lightStrong],
      ["dark --accent-teal", darkAccent],
      ["dark --accent-teal-strong", darkStrong],
    ] as const) {
      expect(token, `${label} is declared as an oklch colour`).not.toBeNull()
    }

    expect(
      Number((lightAccent!.l - lightStrong!.l).toFixed(3)),
      "light --accent-teal-strong is 0.06 darker than the accent",
    ).toBe(0.06)
    expect(
      [lightStrong!.c, lightStrong!.h],
      "the text role keeps the accent's hue and chroma - the same colour, read differently",
    ).toEqual([lightAccent!.c, lightAccent!.h])
    expect(
      [darkStrong!.l, darkStrong!.c, darkStrong!.h],
      "on dark the text role is the accent itself; the roles only pull apart on light",
    ).toEqual([darkAccent!.l, darkAccent!.c, darkAccent!.h])
  })
})
