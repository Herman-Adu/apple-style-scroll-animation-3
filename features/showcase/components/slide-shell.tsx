import type { CSSProperties, ReactNode } from "react"
import Image from "next/image"
import { siteConfig } from "@/lib/data/site"
import { ADUDEV } from "../lib/domain/brand"
import { SOCIAL_FORMATS, type SocialAsset } from "../lib/domain/social-assets"

const { colors } = ADUDEV

/**
 * Local overrides so every slide uses the AduDev palette whatever store theme
 * is active. `--primary` is the accent every slide body reaches for, which is
 * what keeps a chart or a diagram from inheriting the store's own colour.
 */
export const brandTokens = {
  "--background": colors.base,
  "--foreground": colors.text,
  "--card": colors.surface,
  "--card-foreground": colors.text,
  "--border": colors.border,
  "--muted-foreground": colors.muted,
  "--primary": colors.orange,
} as CSSProperties

const pad = (n: number) => String(n).padStart(2, "0")

/** The rule-and-label that opens every slide, under the wordmark. */
export function SlideEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-4 text-2xl font-semibold uppercase tracking-widest text-primary">
      <span aria-hidden className="h-0.5 w-12 bg-primary" />
      {children}
    </p>
  )
}

/**
 * The frame every slide shares: canvas size, AduDev palette, wordmark, page
 * number and signature.
 *
 * A pack carousel interleaves infographic slides with social slides in one PDF,
 * so the two cannot merely look similar — a different padding or header between
 * consecutive pages reads as a mistake. They render the same frame instead.
 */
export function SlideShell({
  id,
  format,
  position,
  badge,
  children,
}: {
  id: string
  format: SocialAsset["format"]
  position?: { index: number; total: number }
  badge?: ReactNode
  children: ReactNode
}) {
  const { width, height } = SOCIAL_FORMATS[format]

  return (
    <section
      data-social-asset={id}
      style={{ width, height, ...brandTokens }}
      className="dark flex shrink-0 flex-col gap-10 overflow-hidden bg-background p-20 font-sans text-foreground break-after-page"
    >
      <header className="flex items-center justify-between text-2xl font-medium uppercase tracking-widest text-muted-foreground">
        <Image
          src={ADUDEV.logos.wordmarkLight}
          alt={ADUDEV.name}
          width={988}
          height={333}
          className="h-14 w-auto"
          priority
        />
        <span className="flex items-center gap-6">
          {badge}
          {position ? (
            <span className="tabular-nums">
              {pad(position.index + 1)} / {pad(position.total)}
            </span>
          ) : null}
        </span>
      </header>

      {children}

      <footer className="flex items-center gap-4 text-2xl text-muted-foreground">
        <Image src={ADUDEV.logos.monogramLight} alt="" width={257} height={257} className="size-10" />
        <span>
          {ADUDEV.name} · Case study: {siteConfig.name}
        </span>
      </footer>
    </section>
  )
}
