import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { BUILT_IN_PRESETS, buildThemeCss } from "@/features/settings"
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
 * `--destructive` does two opposed jobs, and until S67 it was one value trying
 * to do both in both themes - the last colour in the palette written that way.
 *
 *  - **The surface role.** The red fill under a white label: the "Sold out" tag,
 *    the destructive button and badge, the status dot. What matters is the
 *    label's contrast *against the fill*.
 *  - **The text role.** Red words on the page: a form error, the out-of-stock
 *    line, an admin delete icon on hover. What matters is the red's contrast
 *    *against the surface behind it*.
 *
 * The two pull in opposite directions, and on dark they pull past each other.
 * Measured with the model in `qa/config/contrast.ts` at the palette's own
 * chroma and hue: as text on dark the red needs `L >= 0.62` to clear AA on
 * every surface, while the white label on it needs `L <= 0.58`. There is no
 * overlap, so splitting the token per theme - which is what S66's handoff
 * proposed - cannot settle it either. The roles need separate tokens:
 * `--destructive` keeps the surface, and `--destructive-strong` carries the
 * text, the way `--accent-teal-muted` carries accent text that needs more
 * contrast than `--accent-teal` has.
 *
 * Two things this file learned from S66 and S64, both of which it had wrong:
 *
 *  - **It measured a colour the app never paints.** The tag is
 *    `bg-destructive/90`, not `bg-destructive`, so the label sits on the token
 *    composited over the page - and that reads 4.32:1 on light where the solid
 *    colour reads 4.56:1. The old assertion checked the solid and passed while
 *    the rendered tag was below AA. Measure the alpha the markup asks for.
 *  - **A tint mixed from a token moves with that token.** `hover:text-destructive`
 *    sits on `hover:bg-destructive/10`, so the text role has to clear a surface
 *    mixed from the surface role. That is the S66 accent-on-its-own-tint case,
 *    and it is the tightest constraint on the text role in both themes.
 *
 * Unlike the accent, `--destructive` is not painted from the database:
 * `buildThemeCss` emits only the four accent and gradient tokens, so no
 * `StoreSettings.theme` row can override these two. For this token the
 * stylesheet really is the surface, which is why there is no preset claim here
 * to match `theme-preset-contrast.test.ts`.
 */

/** AA for normal text (1.4.3). Both roles end up held to this. */
const TEXT_FLOOR = 4.5

/** Every opaque surface either role is drawn on, matching the muted-text sweep. */
const PAGE_SURFACES = ["background", "card", "muted", "popover", "sidebar"] as const
const THEMES: readonly ThemeName[] = ["light", "dark"]

/**
 * The alphas the markup actually asks for on a destructive fill.
 * `/90` is the "Sold out" tag and the button's hover; `/60` is the dark-theme
 * button and badge fill. Solid is the default variant.
 */
const FILL_ALPHAS = [
  { utility: "bg-destructive", alpha: 1 },
  { utility: "bg-destructive/90", alpha: 0.9 },
  { utility: "dark:bg-destructive/60", alpha: 0.6, theme: "dark" as ThemeName },
] as const

/**
 * Every tint the text role is drawn on, mixed from the surface role. Read off
 * the source rather than chosen: `/[0.06]` is the docs callout, `/10` and `/12`
 * the admin hover rows and the email status pills, and `/20` the dark-theme
 * focus state of the three shadcn menus - which is written
 * `dark:data-[variant=destructive]:focus:bg-destructive/20` in all three, so
 * light never paints it and is not held to it. That exemption is the `dark:`
 * prefix in the markup, not a concession: on light this tint would measure
 * 4.09:1, so the day one of those loses its prefix the guard goes red.
 */
const TINT_ALPHAS = [
  { alpha: 0.06 },
  { alpha: 0.1 },
  { alpha: 0.12 },
  { alpha: 0.2, theme: "dark" as ThemeName },
] as const

const themes = readThemes()

function resolved(theme: ThemeName, token: string): Srgb {
  const colour = tokenLookup(themes, theme).resolve(token)
  expect(colour, `--${token} is an oklch colour in the ${theme} theme`).not.toBeNull()
  return oklchToSrgb(colour!)
}

function surface(theme: ThemeName, name: string): Srgb {
  return resolved(theme, name)
}

/** Fails with every measurement printed: a measuring guard has to show its numbers (S60). */
function expectAllAtLeast(measured: { where: string; ratio: number; rendered: string }[], floor: number) {
  expect(
    measured.filter(({ ratio }) => ratio < floor),
    JSON.stringify(measured, null, 1),
  ).toEqual([])
}

const round = (ratio: number) => Number(ratio.toFixed(2))

/**
 * The premise of every measurement in this file. S66's lesson was that a colour
 * guard is only as true as the layer it reads, and the accent's guards were
 * reading the wrong one: `buildThemeCss` re-asserts the active template's
 * tokens in an inline `<style>` after the stylesheet, so for `--accent-teal`
 * the database is the surface and `theme-preset-contrast.test.ts` had to be
 * written to compare the two.
 *
 * It emits four tokens, and neither destructive token is among them - which is
 * why this file can measure `app/globals.css` and speak for what a visitor
 * sees. That is a fact about the theme layer today, not a property of it, so it
 * is asserted rather than assumed: the day a template gains a destructive
 * token, every ratio above stops describing the served page and this is the
 * test that says so.
 */
it("is not repainted by the theme layer, which is why the stylesheet speaks for these ratios", () => {
  for (const preset of BUILT_IN_PRESETS) {
    expect(buildThemeCss(preset), `${preset.id} emits a destructive token`).not.toMatch(/--destructive/)
  }
})

describe("--destructive, the surface role", () => {
  it.each(THEMES)("defines a surface and a label in the %s theme", (theme) => {
    expect(tokenLookup(themes, theme).resolve("destructive")).not.toBeNull()
    expect(tokenLookup(themes, theme).resolve("destructive-foreground")).not.toBeNull()
  })

  it.each(THEMES)("never uses the surface colour as its own label colour in the %s theme", (theme) => {
    expect(resolved(theme, "destructive-foreground")).not.toEqual(resolved(theme, "destructive"))
  })

  it.each(THEMES)(
    `keeps the white label readable on the fill as the markup renders it in the %s theme (AA, ${TEXT_FLOOR}:1)`,
    (theme) => {
      const label = resolved(theme, "destructive-foreground")
      const fill = resolved(theme, "destructive")
      const measured = FILL_ALPHAS.filter((f) => !("theme" in f) || f.theme === theme).flatMap(({ utility, alpha }) =>
        PAGE_SURFACES.map((name) => {
          const painted = composite(fill, surface(theme, name), alpha)
          return {
            where: `${utility} over --${name}`,
            ratio: round(contrastRatio(label, painted)),
            rendered: toRgb255(painted),
          }
        }),
      )
      expectAllAtLeast(measured, TEXT_FLOOR)
    },
  )
})

describe("--destructive-strong, the text role", () => {
  it.each(THEMES)("is defined in the %s theme", (theme) => {
    expect(
      themes[theme].has("destructive-strong"),
      `--destructive-strong missing from the ${theme} theme`,
    ).toBe(true)
  })

  it("is exposed to Tailwind as a utility", () => {
    const css = readFileSync(join(REPO_ROOT, "app/globals.css"), "utf8")
    const themeBlock = /@theme inline\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ""
    // Without this line `text-destructive-strong` is not a class and silently does nothing.
    expect(themeBlock, "--color-destructive-strong missing from @theme inline").toContain(
      "--color-destructive-strong: var(--destructive-strong);",
    )
  })

  it.each(THEMES)(`reaches ${TEXT_FLOOR}:1 on every page surface in the %s theme`, (theme) => {
    const text = resolved(theme, "destructive-strong")
    const measured = PAGE_SURFACES.map((name) => ({
      where: `--${name}`,
      ratio: round(contrastRatio(text, surface(theme, name))),
      rendered: toRgb255(text),
    }))
    expectAllAtLeast(measured, TEXT_FLOOR)
  })

  it.each(THEMES)(
    `reaches ${TEXT_FLOOR}:1 on the tints mixed from --destructive in the %s theme`,
    (theme) => {
      const text = resolved(theme, "destructive-strong")
      const fill = resolved(theme, "destructive")
      const measured = TINT_ALPHAS.filter((t) => !("theme" in t) || t.theme === theme).flatMap(({ alpha }) =>
        PAGE_SURFACES.map((name) => {
          const tint = composite(fill, surface(theme, name), alpha)
          return {
            where: `bg-destructive/${alpha * 100} over --${name}`,
            ratio: round(contrastRatio(text, tint)),
            rendered: toRgb255(tint),
          }
        }),
      )
      expectAllAtLeast(measured, TEXT_FLOOR)
    },
  )
})

/* ------------------------------------------------------- the roles stay apart */

/**
 * Where the app's own markup lives. `qa/` is left out: it asserts, it does not
 * render - the same boundary the muted-text sweep draws.
 */
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

/** Blanks block comments while keeping newlines, so a reported line number still points at the right line. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
}

/**
 * `text-destructive` used as a text colour, including behind a variant prefix -
 * `hover:text-destructive` and `data-[error=true]:text-destructive` colour text
 * a user reads, so a rule that only matched at a class boundary would miss
 * them. The negative lookahead keeps `text-destructive-strong` and
 * `text-destructive-foreground` out: those are the two colours that are
 * allowed to carry text.
 */
const SURFACE_AS_TEXT = /text-destructive(?![-\w])(?:\/\d+)?/g

it("never sets text in the surface role's colour", () => {
  const offences = SOURCE_TREES.flatMap(sourceFiles).flatMap((file) => {
    const lines = withoutComments(readFileSync(join(REPO_ROOT, file), "utf8")).split("\n")
    return lines.flatMap((line, index) =>
      [...line.matchAll(SURFACE_AS_TEXT)].map((match) => ({
        file,
        line: index + 1,
        utility: match[0],
      })),
    )
  })

  // `--destructive` is the fill under a white label, so it is tuned for that and
  // is below AA as text in both themes. `--destructive-strong` is the text role.
  expect(offences, `use text-destructive-strong instead:\n${JSON.stringify(offences, null, 1)}`).toEqual([])
})
