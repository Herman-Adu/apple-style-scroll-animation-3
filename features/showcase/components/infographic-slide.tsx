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
  }
}

export function InfographicSlide({ infographic, facts }: SlideProps) {
  const { width, height } = SOCIAL_FORMATS[infographic.format]

  return (
    <section
      data-social-asset={infographic.id}
      style={{ width, height }}
      className="dark flex shrink-0 flex-col gap-10 overflow-hidden bg-background p-16 font-sans text-foreground break-after-page"
    >
      <header className="flex items-center justify-between text-xl font-medium uppercase tracking-widest text-muted-foreground">
        <span>{siteConfig.name}</span>
        <span className="font-mono text-accent-teal">{infographic.eyebrow}</span>
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
