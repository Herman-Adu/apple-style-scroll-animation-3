import Image from "next/image"
import { ADUDEV } from "../lib/domain/brand"
import { caseStudyUrl, type SocialAsset } from "../lib/domain/social-assets"
import { SlideEyebrow, SlideShell } from "./slide-shell"
import { LayersGraphic } from "./layers-graphic"
import { QrCode } from "./qr-code"
import { SlideDiagram } from "./slide-diagram"
import { StepTrack } from "./step-track"

const { colors } = ADUDEV

type Props = {
  asset: SocialAsset
  position?: { index: number; total: number }
}

function CtaPanel({ cta }: { cta: NonNullable<SocialAsset["cta"]> }) {
  const [host, ...path] = cta.link.split("/")

  return (
    <div className="mt-auto flex items-stretch gap-12 rounded-3xl border border-border bg-card p-12">
      <div className="flex shrink-0 flex-col gap-4">
        <QrCode text={caseStudyUrl()} label={`QR code linking to ${cta.link}`} size={320} />
        <span className="text-center text-2xl text-muted-foreground">Scan to read</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-semibold uppercase tracking-widest" style={{ color: colors.orange }}>
            Case study
          </p>
          <p className="text-3xl font-semibold leading-snug">{host}</p>
          <p className="break-words text-2xl leading-snug text-muted-foreground">/{path.join("/")}</p>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-pretty text-3xl font-semibold leading-snug">{cta.ask}</p>
          <p
            className="w-fit rounded-xl px-6 py-4 text-3xl font-bold"
            style={{ backgroundColor: colors.orange, color: colors.onOrange }}
          >
            {cta.email}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SocialSlide({ asset, position }: Props) {
  const isSquare = asset.format === "square"
  const isSideBySide = isSquare && Boolean(asset.image || asset.visual)
  const hasDiagram = Boolean(asset.diagram)

  return (
    <SlideShell id={asset.id} format={asset.format} position={position}>

      <div className={isSideBySide ? "flex min-h-0 flex-1 gap-12" : "flex min-h-0 flex-1 flex-col gap-10"}>
        <div className={isSideBySide ? "flex w-1/2 flex-col justify-center gap-8" : "flex flex-col gap-6"}>
          <SlideEyebrow>{asset.eyebrow}</SlideEyebrow>
          <h1
            className={
              asset.role === "cover"
                ? "text-balance text-8xl font-extrabold leading-none tracking-tight"
                : hasDiagram
                  ? "text-balance text-6xl font-extrabold leading-tight tracking-tight"
                  : "text-balance text-7xl font-extrabold leading-tight tracking-tight"
            }
          >
            {asset.title}
          </h1>
          <p className="text-pretty text-3xl leading-relaxed text-muted-foreground">{asset.body}</p>
        </div>

        {asset.image ? (
          <div
            className={
              isSquare
                ? "relative w-1/2 overflow-hidden rounded-3xl border border-border bg-card"
                : "relative min-h-0 flex-1 overflow-hidden rounded-t-3xl border border-b-0 border-border bg-card"
            }
          >
            <Image
              src={asset.image.src}
              alt={asset.image.alt}
              fill
              priority
              sizes="1080px"
              className="object-cover object-top"
            />
          </div>
        ) : null}

        {asset.diagram ? (
          <div className="min-h-0 flex-1 rounded-3xl border border-border bg-card p-6">
            <SlideDiagram source={asset.diagram.source} alt={asset.diagram.alt} />
          </div>
        ) : null}

        {asset.visual === "layers" ? (
          <div className="w-1/2">
            <LayersGraphic />
          </div>
        ) : null}

        {asset.points ? (
          <ul className="mt-auto flex flex-col border-t border-border">
            {asset.points.map((point) => (
              <li
                key={point}
                className={
                  isSquare
                    ? "border-b border-border py-6 text-3xl font-medium leading-snug"
                    : "border-b border-border py-12 text-5xl font-medium leading-tight"
                }
              >
                {point}
              </li>
            ))}
          </ul>
        ) : null}

        {asset.progress ? <StepTrack steps={asset.progress.steps} current={asset.progress.current} /> : null}

        {asset.cta ? <CtaPanel cta={asset.cta} /> : null}
      </div>

    </SlideShell>
  )
}
