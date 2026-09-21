import { Info, TriangleAlert, CheckCircle2, Lightbulb } from "lucide-react"
import type { DocBlock } from "../schema"
import { slugifyHeading } from "../lib/doc"
import { MermaidDiagram } from "@/components/docs/mermaid-diagram"
import { DocChart } from "@/components/docs/doc-chart"

/**
 * Server-side renderer for the doc block union. Everything here is an RSC;
 * only the `mermaid` and `chart` cases mount client islands. This keeps the
 * reading experience zero-JS except for the two interactive/visual widgets.
 */

const calloutConfig = {
  info: { Icon: Info, className: "border-foreground/15 bg-foreground/[0.03]", iconClass: "text-foreground/50" },
  tip: { Icon: Lightbulb, className: "border-accent-teal/30 bg-accent-teal/[0.06]", iconClass: "text-accent-teal" },
  success: { Icon: CheckCircle2, className: "border-accent-teal/30 bg-accent-teal/[0.06]", iconClass: "text-accent-teal" },
  warning: { Icon: TriangleAlert, className: "border-destructive/30 bg-destructive/[0.06]", iconClass: "text-destructive" },
} as const

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          id={slugifyHeading(block.text)}
          className="mt-16 scroll-mt-28 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
        >
          {block.text}
        </h2>
      )

    case "paragraph":
      return <p className="mt-6 text-base leading-relaxed text-foreground/70 md:text-lg">{block.text}</p>

    case "quote":
      return (
        <blockquote className="my-10 border-l-2 border-accent-teal/50 pl-6">
          <p className="text-lg font-medium leading-snug text-foreground md:text-xl">{block.text}</p>
          {block.attribution && (
            <cite className="mt-3 block text-sm not-italic text-foreground/40">— {block.attribution}</cite>
          )}
        </blockquote>
      )

    case "callout": {
      const { Icon, className, iconClass } = calloutConfig[block.variant]
      return (
        <div className={`my-8 flex gap-4 rounded-2xl border p-5 ${className}`}>
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={1.5} />
          <div>
            {block.title && <p className="mb-1 text-sm font-semibold text-foreground">{block.title}</p>}
            <p className="text-sm leading-relaxed text-foreground/70">{block.text}</p>
          </div>
        </div>
      )
    }

    case "code":
      return (
        <div className="my-8 overflow-hidden rounded-2xl border border-foreground/10 bg-card/60">
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              {block.title ?? block.language}
            </span>
            <span className="font-mono text-[10px] text-foreground/30">{block.language}</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
            <code className="font-mono text-foreground/80">{block.code}</code>
          </pre>
        </div>
      )

    case "list":
      return block.ordered ? (
        <ol className="mt-6 list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground/70 md:text-lg">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1.5">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-6 space-y-2 text-base leading-relaxed text-foreground/70 md:text-lg">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case "steps":
      return (
        <ol className="mt-8 space-y-5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-teal/40 font-mono text-xs text-accent-teal">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/60">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )

    case "table":
      return (
        <div className="my-8 overflow-x-auto rounded-2xl border border-foreground/10">
          {block.title && (
            <div className="border-b border-foreground/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              {block.title}
            </div>
          )}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/[0.02]">
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-semibold text-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-foreground/[0.06] last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 align-top text-foreground/70">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "divider":
      return <hr className="my-12 border-foreground/10" />

    case "mermaid":
      return <MermaidDiagram diagram={block.diagram} title={block.title} caption={block.caption} />

    case "chart":
      return (
        <DocChart
          chartType={block.chartType}
          data={block.data}
          xKey={block.xKey}
          series={block.series}
          title={block.title}
          caption={block.caption}
          unit={block.unit}
        />
      )

    default:
      return null
  }
}

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
