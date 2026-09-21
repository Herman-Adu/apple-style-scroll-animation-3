"use client"

/**
 * Client island for data charts inside docs. Uses Recharts in a
 * ResponsiveContainer so it fits the reading column. Kept deliberately small:
 * bar / line / area only, themed from the passed series colors (usually chart
 * token vars). The RSC renderer passes plain serializable data.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { DocChartDatum, DocChartSeries } from "@/features/docs/schema"

type Props = {
  chartType: "bar" | "line" | "area"
  data: DocChartDatum[]
  xKey: string
  series: DocChartSeries[]
  title?: string
  caption?: string
  unit?: string
}

const axisStyle = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  fill: "color-mix(in oklch, var(--foreground) 45%, transparent)",
}

function TooltipContent({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { name: string; value: number | string; color: string }[]
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg border px-3 py-2 text-xs backdrop-blur-xl backdrop-saturate-150">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground/70">{entry.name}</span>
          <span className="ml-auto font-medium text-foreground">
            {entry.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DocChart({ chartType, data, xKey, series, title, caption, unit }: Props) {
  const gridColor = "color-mix(in oklch, var(--foreground) 10%, transparent)"

  return (
    <figure className="my-10">
      {title && (
        <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          {title}
        </figcaption>
      )}
      <div className="rounded-2xl border border-foreground/10 bg-card/50 p-6 pt-8 backdrop-blur-sm">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{ fill: gridColor }} content={<TooltipContent unit={unit} />} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<TooltipContent unit={unit} />} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<TooltipContent unit={unit} />} />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      {caption && <figcaption className="mt-3 text-center text-xs text-foreground/40">{caption}</figcaption>}
    </figure>
  )
}
