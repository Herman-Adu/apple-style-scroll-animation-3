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
import { SlideEyebrow, SlideShell } from "./slide-shell"
import { StructureBody } from "./structure-body"

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
      return <BarChartBody alt={infographic.alt} bars={infographic.bars} unit={infographic.unit} facts={facts} />
    case "line-chart":
      return <LineChartBody alt={infographic.alt} xLabels={infographic.xLabels} series={infographic.series} facts={facts} />
    case "sequence":
      return <SequenceBody actors={infographic.actors} steps={infographic.steps} />
    case "structure":
      return <StructureBody area={infographic.area} />
  }
}

export function InfographicSlide({
  infographic,
  facts,
  position,
}: SlideProps & { position?: { index: number; total: number } }) {
  const caveat = infographic.illustrative ? "Illustrative" : infographic.demoData ? "Demo data" : null

  return (
    <SlideShell
      id={infographic.id}
      format={infographic.format}
      position={position}
      badge={
        caveat ? (
          <span className="rounded-full border border-border px-4 py-1 font-mono text-lg normal-case tracking-normal text-foreground">
            {caveat}
          </span>
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        <SlideEyebrow>{infographic.eyebrow}</SlideEyebrow>
        <h1 className="text-balance text-6xl font-extrabold leading-tight tracking-tight">{infographic.title}</h1>
        <p className="text-pretty text-2xl leading-relaxed text-muted-foreground">{infographic.summary}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Body infographic={infographic} facts={facts} />
      </div>
    </SlideShell>
  )
}
