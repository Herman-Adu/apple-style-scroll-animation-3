"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * 270° radial gauge (gap centered at the bottom). Pure SVG. The value arc
 * animates up from zero on mount via a CSS transition on `stroke-dasharray`.
 */
export function RadialGauge({
  value,
  max = 100,
  caption,
}: {
  value: number
  max?: number
  caption?: string
}) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    const t = window.setTimeout(() => setShown(value), 80)
    return () => window.clearTimeout(t)
  }, [value, reduce])

  const size = 168
  const strokeWidth = 13
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const arc = 0.75 // 270° of the full circle
  const fraction = Math.max(0, Math.min(1, shown / max))

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-foreground/10"
          strokeDasharray={`${arc * circumference} ${circumference}`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-accent-teal transition-[stroke-dasharray] duration-1000 ease-out"
          strokeDasharray={`${arc * circumference * fraction} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tabular-nums">{Math.round(value)}</span>
        {caption ? (
          <span className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">{caption}</span>
        ) : null}
      </div>
    </div>
  )
}
