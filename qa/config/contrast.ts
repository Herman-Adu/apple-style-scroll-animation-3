import { readFileSync } from "node:fs"
import { join } from "node:path"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * WCAG contrast, measured the way a browser renders these styles.
 *
 * The palette is authored in `oklch()` and most muted text is written as a
 * Tailwind alpha modifier (`text-foreground/40`), which compiles to
 * `color-mix(in oklab, var(--color-foreground) 40%, transparent)` - the token at
 * 40% alpha - and is then composited over whatever surface is behind it. None of
 * that is visible in the source, which is why an unreadable label could be
 * written 209 times without a test noticing: there was no function that could
 * say what `text-foreground/40` actually renders as.
 *
 * So: oklch -> sRGB -> composite over the surface at the utility's alpha ->
 * relative luminance -> contrast ratio. Compositing happens in gamma-encoded
 * sRGB because that is where a browser does it.
 *
 * The model is checked against outside numbers in `contrast-math.test.ts`, and
 * it independently reproduces the two ratios axe measured in a real browser in
 * S62 (`text-foreground/40` at 3.30:1 on dark and 2.68:1 on light).
 */

export type Srgb = readonly [number, number, number]

export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
  /** Alpha carried by the token itself, e.g. `--on-media-muted: oklch(1 0 0 / 0.6)`. */
  readonly alpha: number
}

const OKLCH = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/
const VAR_REFERENCE = /var\(\s*--([a-z0-9-]+)\s*\)/

export function parseOklch(value: string): Oklch | null {
  const match = OKLCH.exec(value)
  if (!match) return null
  return {
    l: Number(match[1]),
    c: Number(match[2]),
    h: Number(match[3]),
    alpha: match[4] === undefined ? 1 : Number(match[4]),
  }
}

/** oklch -> gamma-encoded sRGB, each channel clamped to the displayable range. */
export function oklchToSrgb({ l, c, h }: Oklch): Srgb {
  const hue = (h * Math.PI) / 180
  const a = c * Math.cos(hue)
  const b = c * Math.sin(hue)
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
  const encoded = linear.map((channel) => {
    const clamped = Math.min(1, Math.max(0, channel))
    return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055
  })
  return [encoded[0], encoded[1], encoded[2]] as const
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function luminance(colour: Srgb): number {
  return 0.2126 * toLinear(colour[0]) + 0.7152 * toLinear(colour[1]) + 0.0722 * toLinear(colour[2])
}

/** WCAG 2.1 contrast ratio. Order does not matter. */
export function contrastRatio(a: Srgb, b: Srgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Composite a translucent colour over an opaque surface, in gamma-encoded sRGB. */
export function composite(colour: Srgb, surface: Srgb, alpha: number): Srgb {
  const mix = colour.map((channel, i) => channel * alpha + surface[i] * (1 - alpha))
  return [mix[0], mix[1], mix[2]] as const
}

export function toRgb255(colour: Srgb): string {
  return `rgb(${colour.map((channel) => Math.round(channel * 255)).join(",")})`
}

/** The ratio `text-<token>/<alpha>` renders at over `surface`. */
export function alphaContrast(token: Oklch, surface: Srgb, alpha: number): number {
  return contrastRatio(composite(oklchToSrgb(token), surface, alpha * token.alpha), surface)
}

export type ThemeName = "light" | "dark"

/**
 * The custom-property blocks in `app/globals.css`. `:root` is the light theme
 * and `.dark` overrides it, so a token the dark block does not redefine - like
 * `--media`, which is dark on purpose in both - resolves to its light value.
 */
export function readThemes(cssPath = join(REPO_ROOT, "app/globals.css")): Record<ThemeName, Map<string, string>> {
  const css = readFileSync(cssPath, "utf8")
  const block = (selector: RegExp) => {
    const body = selector.exec(css)?.[1] ?? ""
    const declarations = new Map<string, string>()
    for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
      declarations.set(match[1], match[2].trim())
    }
    return declarations
  }
  return { light: block(/:root\s*\{([\s\S]*?)\n\}/), dark: block(/\.dark\s*\{([\s\S]*?)\n\}/) }
}

export interface TokenLookup {
  readonly theme: ThemeName
  resolve(name: string): Oklch | null
}

export function tokenLookup(themes: Record<ThemeName, Map<string, string>>, theme: ThemeName): TokenLookup {
  const resolve = (name: string, depth = 0): Oklch | null => {
    if (depth > 4) return null
    const raw = themes[theme].get(name) ?? themes.light.get(name)
    if (!raw) return null
    const reference = VAR_REFERENCE.exec(raw)
    if (reference) return resolve(reference[1], depth + 1)
    return parseOklch(raw)
  }
  return { theme, resolve: (name) => resolve(name) }
}
