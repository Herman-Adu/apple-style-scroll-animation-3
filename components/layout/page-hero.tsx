import type { ReactNode } from "react"
import Image from "next/image"
import type { PageHeroContent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MountReveal } from "@/components/primitives/mount-reveal"
import { HeroCopy } from "./page-hero-copy"

/**
 * Shared, data-driven page hero. **A server component**, which is the point of
 * it: every animated element here is wrapped in `MountReveal`, the one client
 * leaf, so the copy, the headline and the image markup render on the server.
 * Before S70 this file carried `"use client"` for nothing but its entrance
 * animations, and S70 made it the hero of every product page too — so that
 * directive would have reached nine routes instead of five.
 * `qa/unit/products/product-hero-is-server.test.ts` holds that line for this
 * file and for the product wrapper together.
 *
 * Used by Home's siblings (`/about`, `/products`, `/articles`, `/contact`,
 * `/docs`) and, through `ProductHero`, by every product page. Home keeps its
 * own scroll cinematic. Two treatments:
 * - "immersive" (default): full-bleed image behind overlaid copy.
 * - "split": image fills one half of the viewport (full-bleed to the screen
 *   edge) while the copy sits in the same max-w-7xl container as the site nav,
 *   so the headline lines up exactly with the "momo" logo.
 */
export function PageHero({
  content,
  actions,
  glowClassName,
  imageGlowClassName,
}: {
  content: PageHeroContent
  /**
   * Optional interactive leaf below the copy — a product page's Add-to-cart
   * button. Everything above it is static, so the button arrives as a client
   * island inside a server-rendered hero rather than making the hero client
   * code to carry it.
   */
  actions?: ReactNode
  /**
   * Optional override for the split hero's teal glow layer (paint +
   * positioning). Lets a single page contain the glow so it doesn't clip at
   * the image/copy seam. Other pages keep the default `.accent-glow`.
   */
  glowClassName?: string
  /**
   * Optional second contained glow layer over the split hero's image half
   * (e.g. lower-left) to balance the copy-side glow. Masked to feather every
   * edge to zero, so it never draws a line at the seam or container bottom.
   */
  imageGlowClassName?: string
}) {
  if (content.layout === "split")
    return (
      <SplitHero
        content={content}
        actions={actions}
        glowClassName={glowClassName}
        imageGlowClassName={imageGlowClassName}
      />
    )
  return <ImmersiveHero content={content} actions={actions} />
}

/* -------------------------------------------------------------------------- */
/* Immersive (full-bleed) — articles, contact                                 */
/* -------------------------------------------------------------------------- */

function ImmersiveHero({ content, actions }: { content: PageHeroContent; actions?: ReactNode }) {
  const { image, imageAlt, align = "left" } = content

  return (
    <section className="relative flex min-h-[66vh] items-end overflow-hidden md:min-h-[76vh]">
      {/* Background image — subtle Ken Burns settle (decorative) */}
      <MountReveal from={{ scale: 1.12, opacity: 0 }} duration={1.4} className="absolute inset-0">
        <Image
          src={image || "/placeholder.svg"}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </MountReveal>

      {/* Strong dark overlay: base tint + vertical + directional gradients */}
      <div className="absolute inset-0 bg-[#050505]/55" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/20"
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0",
          align === "right"
            ? "bg-gradient-to-l from-[#050505]/85 via-[#050505]/25 to-transparent"
            : "bg-gradient-to-r from-[#050505]/85 via-[#050505]/25 to-transparent",
        )}
        aria-hidden
      />

      {/* Faint teal glow anchored to the copy side */}
      <div
        className={cn(
          "accent-glow pointer-events-none absolute bottom-0 h-[60%] w-[55%]",
          align === "right" ? "right-0" : "left-0",
        )}
        aria-hidden
      />

      {/* Content — same container as the site nav so copy aligns with the logo */}
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-40 md:px-10 md:pb-24 md:pt-48">
        <HeroCopy content={content} tone="over-image" align={align} actions={actions} />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Split — about, products, docs, every product page                          */
/* Image fills one half full-bleed to the screen edge; copy lives in the      */
/* nav's max-w-7xl container so the headline aligns with the logo.            */
/* -------------------------------------------------------------------------- */

function SplitHero({
  content,
  actions,
  glowClassName,
  imageGlowClassName,
}: {
  content: PageHeroContent
  actions?: ReactNode
  glowClassName?: string
  imageGlowClassName?: string
}) {
  const { image, imageAlt, align = "left" } = content

  // `align: "right"` puts the image on the LEFT half; otherwise on the RIGHT.
  const imageOnRight = align !== "right"

  /*
   * Contained dual-glow design pattern (shared by every split hero):
   * - the copy-half glow sits in the TOP outer corner,
   * - the image-half glow sits diagonally opposite in the BOTTOM outer corner.
   * Both are anchored to the outer screen edge (away from the seam) and masked
   * so the teal feathers to zero before any edge — no seam or border line ever
   * appears. Positions flip automatically with the image side. The optional
   * props still override per page if a one-off ever needs it.
   */
  const copyGlow =
    glowClassName ??
    (imageOnRight
      ? "accent-glow-contained-tl inset-y-0 left-0 w-1/2"
      : "accent-glow-contained inset-y-0 right-0 w-1/2")
  const imageGlow =
    imageGlowClassName ??
    (imageOnRight
      ? "accent-glow-contained-br inset-y-0 right-0 w-1/2"
      : "accent-glow-contained-bl inset-y-0 left-0 w-1/2")

  return (
    <section className="relative overflow-hidden bg-[#050505]">
      {/* Image — mobile: top band; desktop: one half, full-bleed to screen edge */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[42vh] md:inset-y-0 md:h-full md:w-1/2",
          imageOnRight ? "md:left-auto md:right-0" : "md:right-auto md:left-0",
        )}
      >
        <MountReveal from={{ scale: 1.1, opacity: 0 }} duration={1.3} className="absolute inset-0">
          <Image
            src={image || "/placeholder.svg"}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </MountReveal>

        {/* Legibility tint */}
        <div className="absolute inset-0 bg-[#050505]/25" aria-hidden />
        {/* Mobile vertical feather into the copy below */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] md:hidden"
          aria-hidden
        />
        {/* Desktop horizontal feather toward the copy side */}
        <div
          className={cn(
            "absolute inset-0 hidden md:block",
            imageOnRight
              ? "bg-gradient-to-l from-transparent via-transparent to-[#050505]"
              : "bg-gradient-to-r from-transparent via-transparent to-[#050505]",
          )}
          aria-hidden
        />
      </div>

      {/* Contained teal glow in the copy half's top outer corner */}
      <div className={cn("pointer-events-none absolute hidden md:block", copyGlow)} aria-hidden />

      {/* Diagonally opposite glow in the image half's bottom outer corner */}
      <div className={cn("pointer-events-none absolute hidden md:block", imageGlow)} aria-hidden />

      {/* Copy — nav-aligned container; sits in the half opposite the image */}
      <div className="relative mx-auto flex min-h-[62vh] max-w-7xl items-end px-5 pb-14 pt-[46vh] md:min-h-[80vh] md:items-center md:px-10 md:py-32 md:pt-32">
        <div className={cn("w-full md:w-1/2", imageOnRight ? "" : "md:ml-auto md:pl-10 lg:pl-14")}>
          <HeroCopy content={content} tone="on-surface" align="left" actions={actions} />
        </div>
      </div>
    </section>
  )
}
