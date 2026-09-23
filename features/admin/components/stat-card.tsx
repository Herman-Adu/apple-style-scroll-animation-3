"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"

export function StatCard({
  label,
  value,
  countTo,
  format,
  hint,
  icon: Icon,
  tone = "default",
  delta,
  series,
  accent = false,
  index = 0,
}: {
  label: string
  /** Static, pre-formatted value. Used when `countTo` is not provided. */
  value?: string
  /** Numeric target — when set (with `format`), the value counts up on mount. */
  countTo?: number
  format?: (n: number) => string
  hint?: string
  icon?: LucideIcon
  tone?: "default" | "warning" | "danger"
  /** Percentage change; sign drives arrow direction and color. */
  delta?: number
  /** Sparkline series. Replaces the hint line when present. */
  series?: number[]
  /** Teal-accented treatment for the headline metric. */
  accent?: boolean
  /** Stagger order for the entrance animation. */
  index?: number
}) {
  const reduce = useReducedMotion()
  const animated = countTo != null && typeof format === "function"
  const [display, setDisplay] = useState(() => (animated ? format!(reduce ? countTo! : 0) : (value ?? "")))

  useEffect(() => {
    if (!animated) {
      if (value != null) setDisplay(value)
      return
    }
    if (reduce) {
      setDisplay(format!(countTo!))
      return
    }
    let raf = 0
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(format!(countTo! * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animated, countTo, format, reduce, value])

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-5 transition-shadow duration-300",
        "hover:shadow-lg hover:shadow-black/20",
        accent ? "border-accent-teal/30" : "border-border/70",
      )}
    >
      {accent ? (
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-accent-teal/15 blur-2xl"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              accent ? "bg-accent-teal/15 text-accent-teal" : "bg-foreground/5 text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <p
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums tracking-tight",
            tone === "warning" && "text-amber-500",
            tone === "danger" && "text-red-500",
          )}
        >
          {display}
        </p>
        {typeof delta === "number" ? (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              delta >= 0 ? "bg-accent-teal/15 text-accent-teal" : "bg-red-500/15 text-red-500",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
      </div>

      {series && series.length > 1 ? (
        <div className={cn("relative mt-3", accent ? "text-accent-teal" : "text-muted-foreground/50")}>
          <Sparkline data={series} />
        </div>
      ) : hint ? (
        <p className="relative mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </motion.div>
  )
}
