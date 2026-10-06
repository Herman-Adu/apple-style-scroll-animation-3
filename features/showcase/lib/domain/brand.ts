import { siteConfig } from "@/lib/data/site"

export const ADUDEV = {
  name: "AduDev",
  email: siteConfig.email,
  colors: {
    base: "#0F0F0F",
    surface: "#1A1A1A",
    border: "#2D2D2D",
    orange: "#F47C00",
    onOrange: "#0F0F0F",
    text: "#FFFFFF",
    muted: "#A8A8A8",
  },
  logos: {
    wordmarkLight: "/brand/adudev-wordmark-light.png",
    wordmarkDark: "/brand/adudev-wordmark-dark.png",
    monogramLight: "/brand/adudev-monogram-light.png",
    monogramDark: "/brand/adudev-monogram-dark.png",
  },
} as const

function channel(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}
