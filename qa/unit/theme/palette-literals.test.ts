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
 * below rather than present with a zero: the rest are the admin, email and
 * account surfaces, which are staff-facing, plus four buyer-facing files that
 * are their own sprint. Sweeping 130 literals in one branch would have put a
 * palette rewrite and a token design in the same diff.
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
 * Raw palette literals still in the tree, by file, with the count S71 measured.
 * Every line is owed a sprint. The numbers may only go down - see the note above.
 */
const DEBT: Readonly<Record<string, number>> = {
  "components/account/order-card.tsx": 2,
  "components/auth/sign-in-form.tsx": 1,
  "components/auth/sign-up-form.tsx": 1,
  "components/contact/contact-form.tsx": 7,
  "components/scroll/frame-scroll-hero.tsx": 1,
  "components/ui/toast.tsx": 3,
  "features/admin/components/customer-badges.tsx": 11,
  "features/admin/components/customer-detail.tsx": 4,
  "features/admin/components/discount-code-form-dialog.tsx": 1,
  "features/admin/components/discount-code-manager.tsx": 5,
  "features/admin/components/email/campaign-editor.tsx": 4,
  "features/admin/components/email/campaign-list.tsx": 8,
  "features/admin/components/email/copy-quality-hint.tsx": 6,
  "features/admin/components/email/email-overview.tsx": 14,
  "features/admin/components/email/message-center.tsx": 8,
  "features/admin/components/email/placeholder-picker.tsx": 1,
  "features/admin/components/email/template-editor.tsx": 15,
  "features/admin/components/product-form-dialog.tsx": 1,
  "features/admin/components/product-manager.tsx": 2,
  "features/admin/components/stat-card.tsx": 4,
  "features/admin/components/status-badges.tsx": 21,
  "features/products/components/product-reviews.tsx": 3,
  "features/products/components/product-stock-badge.tsx": 1,
  "features/products/components/review-form.tsx": 3,
}

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
 * points at the right line - and so the paragraph above, which has to be able
 * to name `text-amber-500` to explain it, is not itself reported. That is the
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

const found = literals()

const countsByFile = found.reduce<Record<string, number>>((counts, { file }) => {
  return { ...counts, [file]: (counts[file] ?? 0) + 1 }
}, {})

describe("raw Tailwind palette literals", () => {
  it("finds the literals to count, so a silent sweep cannot pass", () => {
    // If the pattern ever stops matching, every assertion below passes trivially.
    expect(found.length).toBeGreaterThan(50)
  })

  it("is absent from the availability row S71 fixed", () => {
    // The three literals this guard was written for. A token now paints all of
    // them, so the file carries none - and this says so by name, because a
    // file simply missing from DEBT is indistinguishable from a file that was
    // never swept.
    const offences = found.filter((l) => l.file === "features/products/components/product-purchase.tsx")
    expect(offences, JSON.stringify(offences, null, 1)).toEqual([])
  })

  it("adds none to a file that has none", () => {
    const unknown = Object.entries(countsByFile)
      .filter(([file]) => DEBT[file] === undefined)
      .map(([file, count]) => `${file} (${count})`)
    expect(
      unknown,
      `use a palette token, not a raw Tailwind colour - a literal cannot move with the theme and no guard measures it:\n${found
        .filter((l) => DEBT[l.file] === undefined)
        .map((l) => ` ${l.file}:${l.line} ${l.utility}`)
        .join("\n")}`,
    ).toEqual([])
  })

  it("holds every file at or below the count S71 measured, and refuses a stale one", () => {
    // Both directions are failures with different fixes: more than recorded is
    // a new literal to replace with a token, fewer is a cleanup to record by
    // lowering the number. Neither may pass silently, which is the whole
    // difference between a ratchet and an allow-list.
    const drifted = Object.entries(DEBT).flatMap(([file, recorded]) => {
      const now = countsByFile[file] ?? 0
      if (now === recorded) return []
      const direction = now > recorded ? "use a token for the new one" : "cleaned up - lower the recorded count"
      return [`${file}: recorded ${recorded}, found ${now} - ${direction}`]
    })
    expect(drifted).toEqual([])
  })

  it("records the blind spot's size, so it is a number someone can watch fall", () => {
    const total = Object.values(DEBT).reduce((sum, count) => sum + count, 0)
    expect(found.length).toBe(total)
    // 130 before S71; the three in the availability row are the first paid off.
    expect(total).toBe(127)
  })
})
