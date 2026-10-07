import { siteConfig } from "@/lib/data/site"
import { SOCIAL_FORMATS } from "../lib/domain/social-assets"
import type { Facts } from "../lib/domain/facts"
import type { Infographic } from "../lib/domain/infographics"
import {
  BeforeAfterBody,
  FlowBody,
  GatesBody,
  LayersBody,
  OfferBody,
  SiteMapBody,
  StackBody,
} from "./infographic-parts"
import { BarChartBody, LineChartBody, SequenceBody, TableBody } from "./infographic-charts"

type SlideProps = { infographic: Infographic; facts: Facts | null }

function Body({ infographic, facts }: SlideProps) {
  switch (infographic.kind) {
    case "stack":
      return <StackBody groups={infographic.groups} />
    case "layers":
      return <LayersBody layers={infographic.layers} />
    case "before-after":
      return <BeforeAfterBody rows={infographic.rows} facts={facts} />
    case "site-map":
      return <SiteMapBody areas={infographic.areas} />
    case "flow":
      return <FlowBody steps={infographic.steps} />
    case "gates":
      return <GatesBody steps={infographic.steps} />
    case "offer":
      return <OfferBody columns={infographic.columns} />
    case "table":
      return <TableBody columns={infographic.columns} rows={infographic.rows} facts={facts} />
    case "bar-chart":
      return <BarChartBody alt={infographic.alt} bars={infographic.bars} facts={facts} />
    case "line-chart":
      return <LineChartBody alt={infographic.alt} xLabels={infographic.xLabels} series={infographic.series} facts={facts} />
    case "sequence":
      return <SequenceBody actors={infographic.actors} steps={infographic.steps} />
  }
}

export function InfographicSlide({
  infographic,
  facts,
  position,
}: SlideProps & { position?: { index: number; total: number } }) {
  const { width, height } = SOCIAL_FORMATS[infographic.format]

  return (
    <section
      data-social-asset={infographic.id}
      style={{ width, height }}
      className="dark flex shrink-0 flex-col gap-10 overflow-hidden bg-background p-16 font-sans text-foreground break-after-page"
    >
      <header className="flex items-center justify-between text-xl font-medium uppercase tracking-widest text-muted-foreground">
        <span>{siteConfig.name}</span>
        <span className="flex items-center gap-4">
          {infographic.illustrative || infographic.demoData ? (
            <span className="rounded-full border border-border px-4 py-1 font-mono text-lg normal-case tracking-normal text-foreground">
              {infographic.illustrative ? "Illustrative" : "Demo data"}
            </span>
          ) : null}
          <span className="font-mono text-accent-teal">{infographic.eyebrow}</span>
          {position ? (
            <span className="font-mono tabular-nums">
              {String(position.index + 1).padStart(2, "0")} / {String(position.total).padStart(2, "0")}
            </span>
          ) : null}
        </span>
      </header>

      <div className="flex flex-col gap-5">
        <h1 className="text-balance text-6xl font-semibold leading-[1.05] tracking-tight">{infographic.title}</h1>
        <p className="text-pretty text-2xl leading-relaxed text-muted-foreground">{infographic.summary}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Body infographic={infographic} facts={facts} />
      </div>
    </section>
  )
}
