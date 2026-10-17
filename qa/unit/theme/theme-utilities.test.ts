import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import {
  bareTextUtilities,
  bridgedTokens,
  paintedTextUtilities,
  paletteTokens,
  readStylesheet,
} from "@/qa/config/theme-utilities"

/**
 * The static half of the claim S67 said a new palette token owes.
 *
 * A Tailwind v4 colour utility exists only because `--color-<name>` is declared
 * in `@theme inline`. Without that line `text-info` matches nothing, the text
 * silently inherits `--foreground`, and every colour guard in this repo stays
 * green *because the stylesheet is correct* - the token is declared, its value
 * models fine, and nothing reads the bridge. S67 proved the mechanism on
 * `--destructive-strong` by deleting the line and watching a browser probe come
 * back `rgb(11,11,11)` while the token still resolved `rgb(188,0,0)`.
 *
 * S74 added `--info` and asserted its bridge line with a string match on the
 * `@theme inline` block in `muted-text-contrast.test.ts`. That is the right
 * layer but the wrong shape: it names one token, so the next token added owes
 * the same line and nothing asks for it.
 *
 * **Why the list is derived from usage rather than written down.** The set that
 * matters is not "every token" - 21 of the 44 bridged colours have no
 * `text-<token>` in the app at all, and a bridge nothing reaches cannot be
 * mispainted. It is also not "every bridged token", because that is the set
 * that *disappears* when a bridge line is deleted: the hole this guard exists
 * to catch would delete its own test case and the sweep would report nothing,
 * which is S63's quiet guard and S74's canary problem in one. So the candidates
 * come from the opposite side - a colour declared in the `:root` palette *and*
 * reached by a bare `text-<token>` somewhere in the app's markup - and the
 * bridge is the thing asserted. Delete `--color-info` and the candidate is
 * still there, still demanding a bridge, and the assertion names it.
 *
 * `qa/axe/theme-utilities-paint.spec.ts` is the other half: the same derived
 * list, put to Chromium on a served page, which is the only instrument that can
 * say a declared bridge actually paints.
 */

/**
 * The two shapes the usage sweep has to tell apart, as a fixture rather than as
 * the tree. A variant-prefixed class compiles to a selector needing that
 * ancestor (`.dark .dark\:text-info`), so a probe carrying the bare class would
 * not match it and a sweep that counted it would fail on a correct stylesheet.
 * `text-info-strong` is the boundary case: a longer token name that starts with
 * a shorter one.
 */
const USAGE_CANARY = `
  const a = "text-info px-2"
  const b = "dark:text-success"
  const c = "text-warning-strong"
  const d = cn("text-destructive-strong", open && "text-accent-teal")
`

const CSS_CANARY = `
:root {
  --info: oklch(0.48 0.15 237);
  --radius: 0.625rem;
  --surface: var(--info);
}
@theme inline {
  --color-info: var(--info);
  --radius-sm: calc(var(--radius) - 4px);
}
`

describe("the palette the stylesheet declares", () => {
  it("reads the colours out of :root and leaves the non-colours behind", () => {
    const tokens = paletteTokens(CSS_CANARY)
    expect([...tokens]).toEqual(["info"])
  })

  it("reads the @theme inline bridges, and only the colour ones", () => {
    expect([...bridgedTokens(CSS_CANARY)]).toEqual(["info"])
  })

  it("finds the real stylesheet's own bridge for every colour it declares", () => {
    const bridges = bridgedTokens(readStylesheet(REPO_ROOT))
    expect(bridges.has("info")).toBe(true)
    expect(bridges.has("destructive-strong")).toBe(true)
  })
})

describe("which text utilities the app actually reaches", () => {
  const tokens = ["info", "success", "warning", "destructive-strong", "accent-teal"]

  it("counts a bare utility and ignores a variant-prefixed one", () => {
    // `dark:text-success` is deliberately absent: its selector needs the
    // ancestor, so it is not a claim a bare probe can put to the browser.
    expect(bareTextUtilities(USAGE_CANARY, tokens)).toEqual([
      "info",
      "destructive-strong",
      "accent-teal",
    ])
  })

  it("does not read a longer token name as a shorter one", () => {
    // `text-warning-strong` is in the fixture and `warning` is a candidate
    // token; a sweep without a right-hand boundary would report it.
    expect(bareTextUtilities(USAGE_CANARY, ["warning"])).toEqual([])
  })
})

describe("every colour the app draws text in is bridged into Tailwind", () => {
  const utilities = paintedTextUtilities(REPO_ROOT)

  it("has candidates to check, so a broken sweep cannot pass by finding none", () => {
    expect(utilities.length).toBeGreaterThan(10)
  })

  it("includes the two tokens whose bridge has been wrong or unproven", () => {
    // `--info` is S74's, asserted until now by one string match; S67 proved the
    // mechanism on `--destructive-strong`.
    expect(utilities.map((u) => u.token)).toContain("info")
    expect(utilities.map((u) => u.token)).toContain("destructive-strong")
  })

  it("declares --color-<token> in @theme inline for each one", () => {
    const bridges = bridgedTokens(readStylesheet(REPO_ROOT))
    expect(
      utilities
        .filter((u) => !bridges.has(u.token))
        .map((u) => `text-${u.token} (${u.files[0]}) needs --color-${u.token}: var(--${u.token}) in @theme inline`),
      "a colour utility with no @theme inline bridge matches nothing and the text inherits --foreground",
    ).toEqual([])
  })
})
