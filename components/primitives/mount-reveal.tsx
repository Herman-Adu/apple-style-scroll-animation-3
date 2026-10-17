"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** Rest value for every property a mount entrance is allowed to animate from. */
const REST = { opacity: 1, y: 0, scale: 1, scaleX: 1 } as const

/** The tags a hero entrance actually wraps. Keyed so `as` stays typed. */
const TAGS = { div: motion.div, p: motion.p, h1: motion.h1 } as const

export type MountRevealFrom = Partial<Record<keyof typeof REST, number>>

/**
 * Entrance that plays **on mount** and then stops — the treatment a page hero
 * uses, because a hero is already in view when the page arrives and has
 * nothing to scroll into. `Reveal` is the other half of this pair and animates
 * `whileInView`; the two are not interchangeable and neither reads as the
 * other with a flag.
 *
 * It exists as its own file so `components/layout/page-hero.tsx` can be a
 * **server component**. That file was `"use client"` for nothing but these
 * animations, and S70 made it the hero of four product pages as well as five
 * top-level ones, so the directive would have travelled to all nine. The copy,
 * the headline and the image markup are server-rendered and passed in as
 * children; only the transform wrapper is client code.
 *
 * `from` declares the offset to arrive from, and the animation returns each
 * property it names to rest — so `{ opacity: 0, y: 18 }` fades and lifts,
 * `{ scaleX: 0 }` draws a rule out from its origin. Honours
 * `prefers-reduced-motion` by rendering at rest.
 */
export function MountReveal({
  children,
  from,
  as = "div",
  duration = 0.6,
  delay = 0,
  ease = EASE_OUT,
  className,
  "aria-hidden": ariaHidden,
}: {
  children?: ReactNode
  /** Properties to animate from; each returns to its rest value. */
  from: MountRevealFrom
  as?: keyof typeof TAGS
  duration?: number
  delay?: number
  /** A cubic-bézier tuple, or a named framer easing like `"easeOut"`. */
  ease?: readonly [number, number, number, number] | "easeOut"
  className?: string
  "aria-hidden"?: boolean
}) {
  const reduce = useReducedMotion()
  const Tag = TAGS[as]
  const to = Object.fromEntries(Object.keys(from).map((key) => [key, REST[key as keyof typeof REST]]))

  return (
    <Tag
      initial={reduce ? false : from}
      animate={to}
      transition={{ duration, ease, delay }}
      className={className}
      aria-hidden={ariaHidden}
    >
      {children}
    </Tag>
  )
}
