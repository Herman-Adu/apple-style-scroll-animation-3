import type { ReactNode } from "react"
import type { PageHeroContent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TwoToneTitle } from "@/components/primitives/two-tone-title"
import { MountReveal } from "@/components/primitives/mount-reveal"

/**
 * The copy block both `PageHero` treatments share: eyebrow, two-tone headline,
 * subtitle, the teal rule, and an optional actions slot. Its own file because
 * `page-hero.tsx` is about the two *layouts* — where the image sits, how the
 * field is lit — and this is what goes in the half the image leaves.
 *
 * A server component. Each animated element is wrapped in `MountReveal`, the
 * one client leaf; the text itself, and `TwoToneTitle`'s markup, render on the
 * server. See the note on `PageHero` for why that matters as of S70.
 */
export function HeroCopy({
  content,
  tone,
  align = "left",
  actions,
}: {
  content: PageHeroContent
  /** "over-image" sits on the immersive photo; "on-surface" on a dark panel. */
  tone: "over-image" | "on-surface"
  /** Text alignment for this instance (split always renders left). */
  align?: "left" | "center" | "right"
  /** Optional interactive leaf below the rule — a product page's buy button. */
  actions?: ReactNode
}) {
  const { eyebrow, title, titleAccent, subtitle } = content

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        align === "right" && "ml-auto text-right",
      )}
    >
      <MountReveal
        as="p"
        from={{ opacity: 0, y: 12 }}
        duration={0.6}
        ease="easeOut"
        delay={0.15}
        className="mb-5 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-white/50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" aria-hidden />
        {eyebrow}
      </MountReveal>
      <MountReveal
        as="h1"
        from={{ opacity: 0, y: 18 }}
        duration={0.7}
        delay={0.25}
        className={cn(
          "text-balance font-bold leading-[1.03] tracking-tight text-white",
          tone === "over-image"
            ? "text-5xl md:text-7xl lg:text-8xl"
            : "text-4xl md:text-6xl lg:text-7xl",
        )}
      >
        <TwoToneTitle title={title} accent={titleAccent} tier="h1" />
      </MountReveal>
      <MountReveal
        as="p"
        from={{ opacity: 0, y: 18 }}
        duration={0.7}
        ease="easeOut"
        delay={0.4}
        className={cn(
          "mt-6 text-pretty text-lg leading-relaxed text-white/60 md:text-xl",
          align === "center" ? "mx-auto max-w-xl" : "max-w-xl",
          align === "right" && "ml-auto",
        )}
      >
        {subtitle}
      </MountReveal>
      <MountReveal
        from={{ scaleX: 0 }}
        duration={0.9}
        delay={0.55}
        className={cn(
          "mt-10 h-px w-24 origin-left bg-gradient-to-r from-accent-teal to-transparent",
          align === "center" && "mx-auto origin-center",
          align === "right" && "ml-auto origin-right",
        )}
        aria-hidden
      />
      {actions ? (
        <div
          className={cn(
            "mt-10",
            align === "center" && "flex justify-center",
            align === "right" && "flex justify-end",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}
