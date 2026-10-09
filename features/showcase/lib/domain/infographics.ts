import { resolveFact, type FactRef, type Facts } from "./facts"
import type { SocialFormat } from "./social-assets"
import type { AreaId } from "./site-structure"

type Base = {
  id: string
  format: SocialFormat
  eyebrow: string
  title: string
  summary: string
  /** Typed chart values are only allowed on slides that print "Illustrative". */
  illustrative?: true
  /** Typed values that mirror the seeded demo store; the slide prints "Demo data" and a test binds them to the seed. */
  demoData?: true
  /** Set on slides written for one audience pack, so catalogue guards can tell them from the core set. */
  pack?: "recruiter" | "buyer" | "engineer"
}

export type ChartValue = number | FactRef
export type TableCell = string | number | FactRef
export type SequenceStep = { from: string; to: string; label: string }

export type StackSource = { pkg: string; major?: number } | { file: string }
export type StackItem = { name: string; version?: string; source: StackSource }

export type Infographic =
  | (Base & { kind: "stack"; groups: { label: string; items: StackItem[] }[] })
  | (Base & { kind: "layers"; layers: { name: string; detail: string }[] })
  | (Base & { kind: "before-after"; rows: { label: string; before: number; after: FactRef; note: string }[] })
  | (Base & { kind: "flow"; steps: { title: string; detail: string }[] })
  | (Base & { kind: "gates"; steps: { name: string; detail: string }[] })
  | (Base & { kind: "offer"; columns: { heading: string; items: string[] }[] })
  | (Base & { kind: "table"; columns: string[]; rows: { label: string; cells: TableCell[] }[] })
  | (Base & { kind: "bar-chart"; alt: string; unit?: string; bars: { label: string; value: ChartValue }[] })
  | (Base & { kind: "line-chart"; alt: string; xLabels: string[]; series: { name: string; values: ChartValue[] }[] })
  | (Base & { kind: "sequence"; actors: string[]; steps: SequenceStep[] })
  | (Base & { kind: "structure"; area: AreaId })

export const INFOGRAPHIC_KINDS = [
  "stack",
  "layers",
  "before-after",
  "flow",
  "gates",
  "offer",
  "table",
  "bar-chart",
  "line-chart",
  "sequence",
  "structure",
] as const

export const SLIDE_LIMITS = {
  sequenceActors: 4,
  sequenceSteps: 6,
  stepLabelChars: 32,
  chartItems: 6,
  lineSeries: 2,
  chartLabelChars: 14,
  tableColumns: 4,
  tableRows: 6,
  altMinChars: 30,
} as const

export const CHART_LABEL_MIN_PX = 24
export const CHART_LABEL_PX = 28

export function resolveChartValue(facts: Facts | null, value: ChartValue): number | null {
  return typeof value === "number" ? value : resolveFact(facts, value.fact)
}

const between = (name: string, length: number, min: number, max: number) =>
  length < min || length > max ? [`${name}: needs ${min} to ${max}, has ${length}`] : []

const altProblems = (alt: string) =>
  alt.trim().length < SLIDE_LIMITS.altMinChars ? [`alt: describe the chart in at least ${SLIDE_LIMITS.altMinChars} characters`] : []

const labelProblems = (labels: string[]) =>
  labels
    .filter((label) => label.length > SLIDE_LIMITS.chartLabelChars)
    .map((label) => `label "${label}" is over ${SLIDE_LIMITS.chartLabelChars} characters`)

const typedValueProblems = (infographic: Infographic, values: (ChartValue | TableCell)[]) =>
  !infographic.illustrative && !infographic.demoData && values.some((v) => typeof v === "number")
    ? ["typed values: read them from facts or mark the slide illustrative"]
    : []

function sequenceProblems(actors: string[], steps: SequenceStep[]): string[] {
  const known = new Set(actors)
  return [
    ...between("actors", actors.length, 2, SLIDE_LIMITS.sequenceActors),
    ...(known.size === actors.length ? [] : ["actors: names must be unique"]),
    ...between("steps", steps.length, 1, SLIDE_LIMITS.sequenceSteps),
    ...steps.flatMap((step) => [
      ...[step.from, step.to].filter((name) => !known.has(name)).map((name) => `step "${step.label}": unknown actor ${name}`),
      ...(step.from === step.to ? [`step "${step.label}": an actor cannot message itself`] : []),
      ...(step.label.length > SLIDE_LIMITS.stepLabelChars ? [`step "${step.label}": label is too long`] : []),
    ]),
  ]
}

/** Every reason a slide would not fit or would not read well. Empty means it is within the limits. */
export function infographicProblems(infographic: Infographic): string[] {
  switch (infographic.kind) {
    case "sequence":
      return sequenceProblems(infographic.actors, infographic.steps)
    case "bar-chart":
      return [
        ...altProblems(infographic.alt),
        ...between("bars", infographic.bars.length, 2, SLIDE_LIMITS.chartItems),
        ...labelProblems(infographic.bars.map((b) => b.label)),
        ...typedValueProblems(infographic, infographic.bars.map((b) => b.value)),
      ]
    case "line-chart":
      return [
        ...altProblems(infographic.alt),
        ...between("series", infographic.series.length, 1, SLIDE_LIMITS.lineSeries),
        ...between("x labels", infographic.xLabels.length, 2, SLIDE_LIMITS.chartItems),
        ...labelProblems(infographic.xLabels),
        ...infographic.series
          .filter((s) => s.values.length !== infographic.xLabels.length)
          .map((s) => `series "${s.name}": values must match the x labels`),
        ...typedValueProblems(infographic, infographic.series.flatMap((s) => s.values)),
      ]
    case "table":
      return [
        ...between("columns", infographic.columns.length, 2, SLIDE_LIMITS.tableColumns),
        ...between("rows", infographic.rows.length, 1, SLIDE_LIMITS.tableRows),
        ...infographic.rows
          .filter((row) => row.cells.length !== infographic.columns.length - 1)
          .map((row) => `row "${row.label}": needs ${infographic.columns.length - 1} cells, has ${row.cells.length}`),
        ...typedValueProblems(infographic, infographic.rows.flatMap((row) => row.cells)),
      ]
    default:
      return []
  }
}

export { getInfographic, infographics } from "./infographic-registry"
