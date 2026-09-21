"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * Generic scroll-into-view entrance: fades and lifts its children the first
 * time they enter the viewport. Respects `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  once = true,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  once?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
