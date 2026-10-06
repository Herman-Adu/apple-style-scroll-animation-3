import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolveFact, type Facts } from "../lib/domain/facts"
import {
  CHART_LABEL_PX,
  resolveChartValue,
  type ChartValue,
  type SequenceStep,
  type TableCell,
} from "../lib/domain/infographics"

const formatValue = (value: number | null) => (value === null ? "–" : value.toLocaleString("en-GB"))

function ChartLabel({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span data-chart-label="true" style={{ fontSize: CHART_LABEL_PX }} className={`leading-tight ${className}`}>
      {children}
    </span>
  )
}

export function TableBody({
  columns,
  rows,
  facts,
}: {
  columns: string[]
  rows: { label: string; cells: TableCell[] }[]
  facts: Facts | null
}) {
  const cellText = (cell: TableCell) =>
    typeof cell === "string" ? cell : formatValue(typeof cell === "number" ? cell : resolveFact(facts, cell.fact))

  return (
    <div className="flex flex-1 flex-col justify-center">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-border pb-4 pr-6 font-mono text-xl font-medium uppercase tracking-widest text-muted-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <th scope="row" className="py-6 pr-6 text-3xl font-semibold">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td key={`${row.label}-${columns[index + 1]}`} className="py-6 pr-6 text-2xl leading-snug text-muted-foreground">
                  {cellText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BarChartBody({
  alt,
  bars,
  facts,
}: {
  alt: string
  bars: { label: string; value: ChartValue }[]
  facts: Facts | null
}) {
  const values = bars.map((bar) => resolveChartValue(facts, bar.value))
  const max = Math.max(1, ...values.map((v) => v ?? 0))

  return (
    <figure role="img" aria-label={alt} className="flex flex-1 flex-col justify-center gap-8">
      {bars.map((bar, index) => {
        const value = values[index]
        const share = value ? Math.max((value / max) * 100, 1) : 0
        return (
          <div key={bar.label} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-6">
              <ChartLabel className="font-medium">{bar.label}</ChartLabel>
              <span className="font-mono text-4xl font-semibold text-accent-teal">{formatValue(value)}</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent-teal" style={{ width: `${share}%` }} />
            </div>
          </div>
        )
      })}
    </figure>
  )
}

const SERIES_TONES = ["text-accent-teal", "text-muted-foreground"] as const

export function LineChartBody({
  alt,
  xLabels,
  series,
  facts,
}: {
  alt: string
  xLabels: string[]
  series: { name: string; values: ChartValue[] }[]
  facts: Facts | null
}) {
  const resolved = series.map((s) => s.values.map((v) => resolveChartValue(facts, v) ?? 0))
  const max = Math.max(1, ...resolved.flat())
  const lastIndex = Math.max(1, xLabels.length - 1)
  const points = (values: number[]) =>
    values.map((v, i) => `${(i / lastIndex) * 100},${96 - (v / max) * 88}`).join(" ")

  return (
    <figure role="img" aria-label={alt} className="flex flex-1 flex-col gap-6">
      <ul className="flex flex-wrap gap-x-10 gap-y-3">
        {series.map((s, index) => (
          <li key={s.name} className="flex items-center gap-3">
            <span className={`h-1.5 w-10 rounded-full bg-current ${SERIES_TONES[index]}`} />
            <ChartLabel className="text-foreground">{s.name}</ChartLabel>
          </li>
        ))}
      </ul>

      <div className="relative min-h-0 flex-1 border-b border-l border-border">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible" className="absolute inset-0 size-full" aria-hidden="true">
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1={0}
              x2={100}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="text-border"
            />
          ))}
          {resolved.map((values, index) => (
            <polyline
              key={series[index].name}
              points={points(values)}
              fill="none"
              stroke="currentColor"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={SERIES_TONES[index]}
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between gap-4">
        {xLabels.map((label) => (
          <ChartLabel key={label} className="text-muted-foreground">
            {label}
          </ChartLabel>
        ))}
      </div>
    </figure>
  )
}

function SequenceArrow({ step, row, actors }: { step: SequenceStep; row: number; actors: string[] }) {
  const from = actors.indexOf(step.from) + 1
  const to = actors.indexOf(step.to) + 1
  const span = Math.abs(to - from) + 1
  const rightward = to > from

  return (
    <div
      style={{ gridColumn: `${Math.min(from, to)} / span ${span}`, gridRow: row + 2 }}
      className="flex flex-col justify-center gap-2"
    >
      <span className="self-center bg-background px-3 text-center text-2xl leading-snug">{step.label}</span>
      <div style={{ paddingInline: `calc(100% / ${span * 2})` }} className="flex items-center text-accent-teal">
        {rightward ? null : <ChevronLeft className="-mr-3 size-7 shrink-0" />}
        <span className="h-0.5 flex-1 bg-current" />
        {rightward ? <ChevronRight className="-ml-3 size-7 shrink-0" /> : null}
      </div>
    </div>
  )
}

export function SequenceBody({ actors, steps }: { actors: string[]; steps: SequenceStep[] }) {
  const stepKey = (step: SequenceStep) => `${step.from}-${step.to}-${step.label}`

  return (
    <div className="flex flex-1 flex-col">
      <ol className="sr-only">
        {steps.map((step) => (
          <li key={stepKey(step)}>{`${step.from} to ${step.to}: ${step.label}`}</li>
        ))}
      </ol>
      <div
        aria-hidden="true"
        className="grid flex-1 gap-x-4"
        style={{
          gridTemplateColumns: `repeat(${actors.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {actors.map((actor, column) => (
          <div
            key={actor}
            style={{ gridColumn: column + 1, gridRow: 1 }}
            className="rounded-lg border border-border bg-card px-3 py-4 text-center text-2xl font-semibold text-card-foreground"
          >
            {actor}
          </div>
        ))}
        {steps.flatMap((step, row) =>
          actors.map((actor, column) => (
            <div key={`${stepKey(step)}-${actor}`} style={{ gridColumn: column + 1, gridRow: row + 2 }} className="flex justify-center">
              <span className="w-px bg-border" />
            </div>
          )),
        )}
        {steps.map((step, row) => (
          <SequenceArrow key={stepKey(step)} step={step} row={row} actors={actors} />
        ))}
      </div>
    </div>
  )
}
