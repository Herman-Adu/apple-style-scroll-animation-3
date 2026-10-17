import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * The bridge between the palette and Tailwind, and who crosses it.
 *
 * `app/globals.css` declares the palette twice over: the colours themselves in
 * `:root` and `.dark`, and a `@theme inline` block whose `--color-<name>` lines
 * are the only reason `text-<name>` is a class at all. Delete one of those
 * lines and the utility matches nothing, the text inherits `--foreground`, and
 * every colour guard in this repo stays green because the *stylesheet* is
 * correct - S67 found this on `--destructive-strong` and only a browser probe
 * could see it.
 *
 * This module answers the one question both halves of the guard need: which
 * colours does the app actually draw text in? `qa/unit/theme/theme-utilities.test.ts`
 * asserts each of those is bridged, and `qa/axe/theme-utilities-paint.spec.ts`
 * asks Chromium whether the bridge paints.
 *
 * Everything here takes markup as a string where it can, so the sweeps are
 * provable against a fixture rather than against whatever the tree happens to
 * hold. The two functions that touch disk take the repository root as an
 * argument rather than importing `qa/config/repo-root.ts`, and that is a
 * constraint rather than a preference: Playwright transpiles a spec to CJS, so
 * a module reaching this one from `qa/axe/` cannot load anything that evaluates
 * `import.meta` - which `repo-root.ts` does, and `contrast.ts` does through it.
 * The neighbouring specs resolve their own paths relatively for the same
 * reason. It is also why the colour test below is a narrow `oklch(` match
 * rather than `parseOklch` from `contrast.ts`: nothing here needs the model,
 * only the question of whether a declaration names a colour at all.
 */

/** Where the app's own markup lives; `qa/` asserts rather than renders. */
const SOURCE_TREES = ["app", "components", "features", "lib"]

const STYLESHEET = "app/globals.css"

/** A declaration that names a colour. The whole palette is authored in `oklch()`. */
const IS_COLOUR = /^oklch\(/

/** The body of the `@theme inline` block, or `""` when there is none. */
function themeBlock(css: string): string {
  const start = css.indexOf("@theme inline")
  if (start === -1) return ""
  const body = css.slice(start)
  const end = body.indexOf("\n}")
  return end === -1 ? body : body.slice(0, end)
}

/** The body of the `:root` block. The light palette; `.dark` redeclares the same names. */
function rootBlock(css: string): string {
  return /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ""
}

/**
 * The colour names the palette declares - every `:root` custom property whose
 * value is an `oklch()`. That filter is what keeps `--radius` and the font
 * stacks out, and it is deliberately narrower than "every property": a name
 * that is an alias (`--surface: var(--info)`) is not a colour of its own and
 * has no utility to check.
 */
export function paletteTokens(css: string): Set<string> {
  const names = new Set<string>()
  for (const match of rootBlock(css).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    if (IS_COLOUR.test(match[2].trim())) names.add(match[1])
  }
  return names
}

/**
 * The tokens `@theme inline` bridges into Tailwind: the `--color-<name>:
 * var(--<token>)` lines, keyed by the token they point at rather than by the
 * utility, because that is the name the palette and the markup both use. The
 * two are the same in every line this stylesheet has ever carried, and keying
 * by the target is what makes an aliasing bridge visible rather than silently
 * counted as its own colour.
 */
export function bridgedTokens(css: string): Set<string> {
  const tokens = new Set<string>()
  for (const match of themeBlock(css).matchAll(
    /--color-([a-z0-9-]+):\s*var\(\s*--([a-z0-9-]+)\s*\)/g,
  )) {
    tokens.add(match[2])
  }
  return tokens
}

/**
 * Which of `tokens` appear in `source` as a bare `text-<token>`, in the order
 * given.
 *
 * It cannot tell markup from prose *about* markup: a doc page explaining that
 * `text-info` is a class counts as a use, which is how `info` comes back with
 * three files rather than its two admin components. That is not the leak it
 * looks like, because Tailwind's own scanner reads strings the same way - a
 * token named in prose really does get its utility generated - so the two
 * agree, and this guard is asking about exactly the classes Tailwind emits.
 *
 * Two boundaries, and both are the point rather than tidiness. The left-hand
 * one refuses a variant prefix: `dark:text-success` compiles to a selector
 * needing the `.dark` ancestor, so it is not a claim a bare probe can put to a
 * browser, and counting it would fail this guard on a perfectly good
 * stylesheet. The right-hand one refuses a longer name that begins with a
 * shorter one, so `text-warning-strong` is not read as `warning` - the same
 * leftmost-match trap that made `palette-literals`' first inventory wrong.
 */
export function bareTextUtilities(source: string, tokens: Iterable<string>): string[] {
  return [...tokens].filter((token) =>
    new RegExp(String.raw`(?<![\w:-])text-${token}(?![\w-])`).test(source),
  )
}

/** The app's stylesheet, read from `repoRoot`. */
export function readStylesheet(repoRoot: string): string {
  return readFileSync(join(repoRoot, STYLESHEET), "utf8")
}

function sourceFiles(repoRoot: string, dir: string): string[] {
  const absolute = join(repoRoot, dir)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${dir}/${entry.name}`
    if (entry.isDirectory()) return sourceFiles(repoRoot, relative)
    return /\.tsx?$/.test(entry.name) ? [relative] : []
  })
}

export interface TextUtility {
  /** The palette token, so `destructive-strong` for `text-destructive-strong`. */
  readonly token: string
  /** Every file carrying the bare utility, so a failure can name one. */
  readonly files: string[]
}

/**
 * Every palette colour the app draws text in, with the files that reach it.
 *
 * Derived from the palette and the markup, never from the `@theme inline` block
 * - a candidate list taken from the bridges is the set that vanishes when a
 * bridge is deleted, which is the one failure this exists to catch.
 */
export function paintedTextUtilities(repoRoot: string): TextUtility[] {
  const tokens = paletteTokens(readStylesheet(repoRoot))
  const files = SOURCE_TREES.flatMap((tree) => sourceFiles(repoRoot, tree))
  const found = new Map<string, string[]>()
  for (const file of files) {
    const source = readFileSync(join(repoRoot, file), "utf8")
    for (const token of bareTextUtilities(source, tokens)) {
      const seen = found.get(token)
      if (seen) seen.push(file)
      else found.set(token, [file])
    }
  }
  return [...found].map(([token, carriers]) => ({ token, files: carriers }))
}
