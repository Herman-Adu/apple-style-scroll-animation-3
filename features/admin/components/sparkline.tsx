"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * Lightweight inline sparkline. Pure SVG (no chart lib) so it stays crisp and
 * cheap inside tiny KPI cards. Colors follow `currentColor` — set text color on
 * the wrapper (e.g. `text-accent-teal`) to tint both the line and its fill.
 */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const gradientId = useId()
  if (!data || data.length === 0) return null

  const width = 100
  const height = 32
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = data.length > 1 ? width / (data.length - 1) : width

  const points = data.map((value, i) => {
    const x = i * step
    const y = height - ((value - min) / range) * (height - 4) - 2
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
  const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
