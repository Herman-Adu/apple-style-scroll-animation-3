import { ArrowDown, ArrowRight, Check } from "lucide-react"
import { resolveFact, type Facts } from "../lib/domain/facts"
import type { Infographic } from "../lib/domain/infographics"

type Kind<K extends Infographic["kind"]> = Extract<Infographic, { kind: K }>

const eyebrowClass = "font-mono text-lg font-medium uppercase tracking-widest text-muted-foreground"

export function StackBody({ groups }: Pick<Kind<"stack">, "groups">) {
  return (
    <div className="flex flex-1 flex-col">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-1 flex-col justify-center gap-5 border-t border-border">
          <p className={eyebrowClass}>{group.label}</p>
          <ul className="flex flex-wrap gap-4">
            {group.items.map((item) => (
              <li
                key={item.name}
                className="flex items-baseline gap-3 rounded-xl border border-border bg-card px-7 py-5 text-3xl font-medium"
              >
                {item.name}
                {item.version ? <span className="font-mono text-2xl text-primary">{item.version}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function LayersBody({ layers }: Pick<Kind<"layers">, "layers">) {
  return (
    <ol className="flex flex-1 flex-col gap-3">
      {layers.map((layer, index) => (
        <li key={layer.name} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex w-full flex-1 items-center gap-8 rounded-xl border border-border bg-card px-8">
            <span className="w-64 shrink-0 font-mono text-3xl font-medium text-primary">{layer.name}</span>
            <span className="text-2xl leading-snug text-muted-foreground">{layer.detail}</span>
          </div>
          {index < layers.length - 1 ? (
            <ArrowDown aria-hidden className="size-7 text-muted-foreground" />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

const formatMeasured = (value: number | null): string =>
  value === null ? "–" : Number.isInteger(value) ? String(value) : value.toFixed(1)

export function BeforeAfterBody({ rows, facts }: Pick<Kind<"before-after">, "rows"> & { facts: Facts | null }) {
  return (
    <ul className="flex flex-1 flex-col">
      {rows.map((row) => (
        <li key={row.label} className="flex flex-1 items-center justify-between gap-6 border-t border-border">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-2xl font-medium leading-snug">{row.label}</span>
            <span className="text-xl text-muted-foreground">{row.note}</span>
          </div>
          <div className="flex shrink-0 items-center gap-5 font-mono">
            <span className="text-4xl text-muted-foreground line-through decoration-2">{row.before}</span>
            <ArrowRight aria-hidden className="size-7 text-muted-foreground" />
            <span className="min-w-24 text-right text-6xl font-semibold text-primary">
              {formatMeasured(resolveFact(facts, row.after.fact))}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SiteMapBody({ areas }: Pick<Kind<"site-map">, "areas">) {
  return (
    <div className="grid flex-1 grid-cols-3 gap-6">
      {areas.map((area) => (
        <section key={area.name} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <h2 className="font-mono text-2xl font-medium uppercase tracking-widest text-primary">{area.name}</h2>
          <ul className="flex flex-col gap-8">
            {area.routes.map((route) => (
              <li key={route.path} className="flex flex-col gap-2">
                <span className="text-3xl font-medium leading-snug">{route.label}</span>
                <span className="font-mono text-xl text-muted-foreground">{route.path}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function FlowBody({ steps }: Pick<Kind<"flow">, "steps">) {
  return (
    <ol className="flex flex-1 flex-col justify-between">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-center gap-8">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-2xl text-primary">
            {index + 1}
          </span>
          <div className="flex flex-col gap-1 border-b border-border pb-5 pt-1 flex-1">
            <span className="text-3xl font-semibold leading-tight">{step.title}</span>
            <span className="text-2xl leading-snug text-muted-foreground">{step.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function GatesBody({ steps }: Pick<Kind<"gates">, "steps">) {
  return (
    <ul className="grid flex-1 auto-rows-fr grid-cols-2 gap-4">
      {steps.map((step) => (
        <li
          key={step.name}
          className="flex items-center gap-5 rounded-xl border border-border bg-card px-6 py-5 odd:last:col-span-2"
        >
          <Check aria-hidden className="size-9 shrink-0 text-success" />
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-semibold leading-tight">{step.name}</span>
            <span className="text-xl text-muted-foreground">{step.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function OfferBody({ columns }: Pick<Kind<"offer">, "columns">) {
  return (
    <div className="grid flex-1 grid-cols-3 gap-6">
      {columns.map((column) => (
        <section key={column.heading} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          {/* Reserve two lines so a heading that wraps does not push its own
              column's rules out of line with the columns either side of it. */}
          <h2 className="min-h-14 font-mono text-xl font-medium uppercase leading-7 tracking-widest text-primary">
            {column.heading}
          </h2>
          <ul className="flex flex-1 flex-col">
            {column.items.map((item) => (
              <li key={item} className="flex flex-1 items-center border-t border-border text-3xl leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
