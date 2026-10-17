import { existsSync, readFileSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { join } from "node:path"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * The half of the colour guards that could not see anything.
 *
 * Every colour guard in this repo resolves a *token*: `muted-text-contrast`
 * sweeps `text-<token>/<alpha>` and places each token on a surface,
 * `destructive-contrast` models two named tokens against five surfaces and four
 * tints, `theme-preset-contrast` compares the stylesheet to what the database
 * paints. All three are blind to the same thing, and blind to it by
 * construction: `text-amber-500` names no token, so there is nothing to
 * resolve, and the guards stay green while the text is unreadable.
 *
 * S71 found three of these on a product detail page - the "Only N left" line
 * and the two availability dots - at 1.88-2.46:1 on light against floors of
 * 4.5:1 and 3:1. They are dark-tuned Tailwind defaults: on dark they measure
 * 7.98-9.79:1, which is why they looked deliberate for as long as only the dark
 * theme was scanned. It is the third time this shape has been found - the
 * `emerald-300` "Open now" badge at 1.25:1 (S66) and the `emerald-500` sold-out
 * surfaces (S67) were the first two - so the sprint that fixed the three also
 * had to ship the guard that can see the fourth.
 *
 * **Why this is a refusal and not a measurement.** Measuring a literal would
 * mean carrying Tailwind's own palette in this repo and keeping it in step with
 * the dependency, and it would answer the wrong question: a raw literal is
 * wrong here even when it happens to pass, because it cannot move with the
 * theme and no `@theme inline` line governs it. The fix for every one of them
 * is a token, and a token is already measured. So the rule is the simple one -
 * use a palette token - and the floors live where they already live.
 *
 * **Why DEBT is a ratchet and not an allow-list.** S63's lesson is that an
 * allow-list is the list of defects that will never be reported: `[live URL]`
 * sat in one for twenty sprints. This is the opposite artefact. It reports the
 * blind spot's full extent - every file, with its count - it refuses any
 * literal in a file not named here, it refuses one more in a file that is, and
 * it refuses a *stale* entry too, so cleaning a file up fails until the number
 * comes down. Nothing on this list is blessed; each line is a defect with a
 * sprint still owed on it. The numbers may only go down.
 *
 * S71 deliberately fixed only `product-purchase.tsx`, which is why it is absent
 * below rather than present with a zero: the rest were the admin, email and
 * account surfaces, which are staff-facing, plus the buyer-facing files that
 * were their own sprint. Sweeping 130 literals in one branch would have put a
 * palette rewrite and a token design in the same diff.
 *
 * S72 was that sprint for the buyer-facing side: eight files, 19 literals, each
 * replaced with a token that was *measured for the surface it is drawn on*
 * rather than with the nearest-looking one. Two of the 19 needed a tint alpha
 * chosen rather than copied, and `status-tint-contrast.test.ts` is what holds
 * them. What remains is 108 in 17 admin and email files.
 */

/** Tailwind's own palette families. A token is `--color-<name>`; none of these is. */
const FAMILIES = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
] as const

/** Every utility prefix that sets a colour a user can see. */
const PREFIXES = [
  "text", "bg", "border", "ring", "fill", "stroke", "from", "to", "via",
  "decoration", "outline", "accent", "caret", "divide", "placeholder",
] as const

/**
 * Shades longest-first: ripgrep and `RegExp` alternation are leftmost-first,
 * not longest-first, so `50|500` reads `text-emerald-500` as `text-emerald-50`
 * and reports a shade that is not in the source. The first inventory taken for
 * this guard was wrong for exactly that reason.
 */
const SHADES = ["950", "900", "800", "700", "600", "500", "400", "300", "200", "100", "50"] as const

/**
 * The alpha modifier is part of the match but not part of the rule - a literal
 * is refused at any alpha. The prefix in front of it is not matched at all:
 * `dark:text-amber-400` is the same defect as `text-amber-400`, and `\b` after
 * a `:` is still a boundary.
 */
const LITERAL = new RegExp(
  String.raw`\b(?:${PREFIXES.join("|")})-(?:${FAMILIES.join("|")})-(?:${SHADES.join("|")})(?:/(?:\d{1,3}|\[[\d.]+\]))?\b`,
  "g",
)

/** Where the app's own markup lives. `qa/` asserts, it does not render - the boundary the other sweeps draw. */
const SOURCE_TREES = ["app", "components", "features", "lib"]

/**
 * A string carrying literals in the shapes this repo actually had, so the
 * pattern is proved against something that does not depend on the tree.
 *
 * Until S74 the canary was `found.length > 50` over the app's own markup: with
 * 108 literals in it, a pattern that broke would take every assertion below
 * with it, and the count was the thing that proved the sweep still saw. S74
 * took the count to zero, which removes that proof - an empty result is what a
 * working sweep and a broken regex both return. So the canary moved off the
 * tree and onto a fixture, and the tree assertion became the plain one: none,
 * anywhere. The three shapes here are the ones that were really in the files -
 * a bare utility, an alpha-modified fill, and a `dark:`-prefixed variant.
 */
const CANARY = "text-amber-500 bg-emerald-500/10 dark:text-sky-400 border-red-500/30"

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
 * Blanks block comments while keeping newlines, so a reported line number still
 * points at the right line - and so the paragraphs above, which have to be able
 * to name `text-amber-500` to explain themselves, are not reported. That is the
 * S52 rule: what is refused is an occurrence that reaches a reader, never the
 * vocabulary needed to describe it.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
}

interface Literal {
  readonly file: string
  readonly line: number
  readonly utility: string
}

function literals(): Literal[] {
  return SOURCE_TREES.flatMap(sourceFiles).flatMap((file) => {
    const lines = withoutComments(readFileSync(join(REPO_ROOT, file), "utf8")).split("\n")
    return lines.flatMap((line, index) =>
      [...line.matchAll(LITERAL)].map((match) => ({ file, line: index + 1, utility: match[0] })),
    )
  })
}

describe("raw Tailwind palette literals", () => {
  it("still matches the shapes it is looking for, so a silent sweep cannot pass", () => {
    // The whole assertion below is `[]`, and a regex that matched nothing would
    // satisfy it. This is the half that cannot be satisfied by being broken.
    expect([...CANARY.matchAll(LITERAL)].map((match) => match[0])).toEqual([
      "text-amber-500",
      "bg-emerald-500/10",
      "text-sky-400",
      "border-red-500/30",
    ])
  })

  it("is zero: no raw palette literal is left in the app's markup", () => {
    // 130 before S71, 127 after it, 108 after S72's buyer-facing eight, and 0
    // after S74 took the 17 admin and email files. There is no DEBT record and
    // no paid-off list any more, because every file is in the second group: a
    // named list of cleared files only existed to tell a swept file from an
    // unswept one, and with nothing left in the tree that distinction is gone.
    // What replaces the ratchet is this - a literal anywhere is a failure, and
    // the fix is the token the colour already has.
    expect(
      literals().map(({ file, line, utility }) => `${file}:${line} ${utility}`),
      "use a palette token, not a raw Tailwind colour - a literal cannot move with the theme and no guard measures it",
    ).toEqual([])
  })
})
