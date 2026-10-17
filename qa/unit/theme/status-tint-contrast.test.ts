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
 * A status colour read as text on a tint mixed from itself.
 *
 * This is the shape S66 found on the accent and could not model: darkening
 * `--accent-teal` darkened `bg-accent-teal/10` with it, so the accent kept only
 * part of its gain. S67 then modelled it for `--destructive`, where it is the
 * tightest constraint on the text role in both themes, and
 * `destructive-contrast.test.ts` holds that pair.
 *
 * `--success` and `--warning` do the same thing and nothing held them. Both are
 * single tokens at the 4.5:1 text floor after S66 and S71, and both are drawn
 * as text inside a pill tinted from themselves - the "Open now" badge on
 * `/contact`, the "Message sent" confirmation on the contact form, the "Pending
 * approval" tag on a review. The token guard in `muted-text-contrast.test.ts`
 * measures them on the five opaque page surfaces, which is the easy case: a
 * tint made of the colour itself is always closer to it than the page is, so a
 * token that clears AA on `--background` can still fail inside its own pill.
 *
 * **Why the alphas are read off the source rather than listed here.** An alpha
 * chosen by the guard measures a pill the app may not paint, and a list of
 * alphas is the S63 allow-list in another costume - the one the markup actually
 * asks for would be the one missing from it. So the sweep finds every pair and
 * measures what it finds, and the floor is the thing that is pinned.
 *
 * Two limits worth writing down, because they are what this file cannot see.
 *
 *  - **It pairs by class string, not by element.** Tailwind classes for one
 *    element are one quoted run, which holds for every site here including the
 *    `cn()` conditionals, but a pair split across two template literals would
 *    be missed.
 *  - **It holds every site to all five page surfaces**, and most are only ever
 *    drawn on `--background`. That is deliberately conservative, and it is the
 *    reason S72 moved the `/contact` badge from `bg-success/15` to `/10`: at
 *    `/15` the badge reads 4.86:1 where it is painted and 4.48:1 on `--muted`,
 *    a surface it is not drawn on. Rather than carry an exemption that says so,
 *    the two success pills now use the same alpha and the guard needs no
 *    exception. A static sweep cannot know which surface a site sits on - S66
 *    recorded that - so the alternative to being conservative is being silent.
 */

/** AA for normal text (1.4.3). Every pair below is text a reader reads. */
const TEXT_FLOOR = 4.5

/** The same five surfaces the token guards use; `--muted` is the tightest. */
const PAGE_SURFACES = ["background", "card", "muted", "popover", "sidebar"] as const
const THEMES: readonly ThemeName[] = ["light", "dark"]

/**
 * The two single-token status colours. `--destructive` is absent on purpose: it
 * is a *pair*, its text role is `--destructive-strong`, and the whole
 * fill-plus-tint model for it lives in `destructive-contrast.test.ts`.
 * Asserting it twice would mean two files to keep in step.
 */
const STATUS_TOKENS = ["success", "warning", "info"] as const

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

const TOKENS = STATUS_TOKENS.join("|")
/**
 * The tinted fill, with whatever variant prefixes sit in front of it. The
 * prefix is captured rather than ignored: `dark:bg-warning/20` paints on dark
 * only, and holding light to a tint it never renders is how
 * `destructive-contrast` would have reported a 4.09:1 that does not exist.
 */
const FILL = new RegExp(String.raw`(?:^|[\s])((?:[a-z-]+:)*)bg-(${TOKENS})/(\d{1,3}|\[[\d.]+\])(?![-\w])`, "g")
const TEXT = new RegExp(String.raw`\btext-(${TOKENS})(?![-\w])`, "g")

interface Pair {
  readonly file: string
  readonly line: number
  readonly fill: string
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
          const prefix = fill[1]
          const raw = fill[3]
          const onDarkOnly = prefix.includes("dark:")
          return texts.map((text) => ({
            file,
            line: index + 1,
            fill: fill[2],
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

describe("a status colour read as text on its own tint", () => {
  it("finds the pairs to measure, so a silent sweep cannot pass", () => {
    // If the pattern stops matching, the measurement below passes trivially -
    // which is the S71 no-op red in guard form.
    expect(
      found.length,
      `found: ${JSON.stringify(found, null, 1)}`,
    ).toBeGreaterThanOrEqual(3)
  })

  it(`reaches ${TEXT_FLOOR}:1 wherever the markup paints it`, () => {
    const measured = found.flatMap((pair) =>
      pair.themes.flatMap((theme) =>
        PAGE_SURFACES.map((name) => {
          const tint = composite(resolved(theme, pair.fill), resolved(theme, name), pair.alpha)
          return {
            where: `${pair.file}:${pair.line} text-${pair.text} on bg-${pair.fill}/${pair.alpha * 100} over --${name} (${theme})`,
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
})
