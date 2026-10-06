import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * The red "Sold out" tag is drawn as `bg-destructive` with `text-destructive-foreground`.
 * Both tokens were once the same red, so the label vanished into its own tag.
 * Text on a destructive surface must be a light colour that actually contrasts.
 */
const css = readFileSync(join(REPO_ROOT, "app/globals.css"), "utf8")

type Oklch = { l: number; c: number; h: number }

function tokenValues(name: string): Oklch[] {
  const pattern = new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`, "g")
  return [...css.matchAll(pattern)].map((match) => {
    const [l, c, h] = match[1].trim().split(/\s+/).map(Number)
    return { l, c, h: h ?? 0 }
  })
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance({ l, c, h }: Oklch): number {
  const hue = (h * Math.PI) / 180
  const a = c * Math.cos(hue)
  const b = c * Math.sin(hue)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
  const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return 0.2126 * toLinear(clamp(r)) + 0.7152 * toLinear(clamp(g)) + 0.0722 * toLinear(clamp(bl))
}

function contrast(a: Oklch, b: Oklch): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe("destructive tokens", () => {
  const surfaces = tokenValues("destructive")
  const labels = tokenValues("destructive-foreground")

  it("defines a surface and a label for every theme", () => {
    expect(surfaces.length).toBeGreaterThan(0)
    expect(labels).toHaveLength(surfaces.length)
  })

  it("never uses the surface colour as its own label colour", () => {
    surfaces.forEach((surface, i) => expect(labels[i]).not.toEqual(surface))
  })

  it("keeps the label readable on the surface (WCAG AA, 4.5:1)", () => {
    surfaces.forEach((surface, i) => expect(contrast(labels[i], surface)).toBeGreaterThanOrEqual(4.5))
  })
})
