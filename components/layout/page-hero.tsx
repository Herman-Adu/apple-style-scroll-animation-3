"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import type { PageHeroContent } from "@/lib/types"
import { cn } from "@/lib/utils"

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * Renders a headline with an optional accent substring in a subtle teal
 * gradient (two-tone). Falls back to the plain title if the accent isn't found.
 */
function TwoToneTitle({ title, accent }: { title: string; accent?: string }) {
  if (!accent) return <>{title}</>
  const at = title.indexOf(accent)
  if (at === -1) return <>{title}</>
  const before = title.slice(0, at)
  const after = title.slice(at + accent.length)
  return (
    <>
      {before}
      <span className="bg-gradient-to-r from-accent-teal to-accent-teal-muted bg-clip-text text-transparent">
        {accent}
      </span>
      {after}
    </>
  )
}

/**
 * Shared, data-driven hero header used on top-level pages (Home keeps its own
 * scroll hero). Two treatments:
 * - "immersive" (default): full-bleed image behind overlaid copy.
 * - "split": image fills one half of the viewport (full-bleed to the screen
 *   edge) while the copy sits in the same max-w-7xl container as the site nav,
 *   so the headline lines up exactly with the "momo" logo.
 */
export function PageHero({
  content,
  glowClassName,
  imageGlowClassName,
}: {
  content: PageHeroContent
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
    return <SplitHero content={content} glowClassName={glowClassName} imageGlowClassName={imageGlowClassName} />
  return <ImmersiveHero content={content} />
}

/* -------------------------------------------------------------------------- */
/* Shared animated copy                                                       */
/* -------------------------------------------------------------------------- */

function HeroCopy({
  content,
  tone,
  align = "left",
}: {
  content: PageHeroContent
  /** "over-image" sits on the immersive photo; "on-surface" on a dark panel. */
  tone: "over-image" | "on-surface"
  /** Text alignment for this instance (split always renders left). */
  align?: "left" | "center" | "right"
}) {
  const { eyebrow, title, titleAccent, subtitle } = content
  const reduce = useReducedMotion()

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        align === "right" && "ml-auto text-right",
      )}
    >
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
        className="mb-5 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-white/50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" aria-hidden />
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.25 }}
        className={cn(
          "text-balance font-bold leading-[1.03] tracking-tight text-white",
          tone === "over-image"
            ? "text-5xl md:text-7xl lg:text-8xl"
            : "text-4xl md:text-6xl lg:text-7xl",
        )}
      >
        <TwoToneTitle title={title} accent={titleAccent} />
      </motion.h1>
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
        className={cn(
          "mt-6 text-pretty text-lg leading-relaxed text-white/60 md:text-xl",
          align === "center" ? "mx-auto max-w-xl" : "max-w-xl",
          align === "right" && "ml-auto",
        )}
      >
        {subtitle}
      </motion.p>
      <motion.div
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.55 }}
        className={cn(
          "mt-10 h-px w-24 origin-left bg-gradient-to-r from-accent-teal to-transparent",
          align === "center" && "mx-auto origin-center",
          align === "right" && "ml-auto origin-right",
        )}
        aria-hidden
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Immersive (full-bleed) — articles, contact                                 */
/* -------------------------------------------------------------------------- */

function ImmersiveHero({ content }: { content: PageHeroContent }) {
  const { image, imageAlt, align = "left" } = content
  const reduce = useReducedMotion()

  return (
    <section className="relative flex min-h-[66vh] items-end overflow-hidden md:min-h-[76vh]">
      {/* Background image — subtle Ken Burns settle (decorative) */}
      <motion.div
        initial={reduce ? false : { scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT }}
        className="absolute inset-0"
      >
        <Image
          src={image || "/placeholder.svg"}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

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
        <HeroCopy content={content} tone="over-image" align={align} />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Split — about, products                                                    */
/* Image fills one half full-bleed to the screen edge; copy lives in the      */
/* nav's max-w-7xl container so the headline aligns with the logo.            */
/* -------------------------------------------------------------------------- */

function SplitHero({
  content,
  glowClassName,
  imageGlowClassName,
}: {
  content: PageHeroContent
  glowClassName?: string
  imageGlowClassName?: string
}) {
  const { image, imageAlt, align = "left" } = content
  const reduce = useReducedMotion()

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
        <motion.div
          initial={reduce ? false : { scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.3, ease: EASE_OUT }}
          className="absolute inset-0"
        >
          <Image
            src={image || "/placeholder.svg"}
            alt={imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

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
          <HeroCopy content={content} tone="on-surface" align="left" />
        </div>
      </div>
    </section>
  )
}
