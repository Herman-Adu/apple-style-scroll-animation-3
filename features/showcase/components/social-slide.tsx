import Image from "next/image"
import { siteConfig } from "@/lib/data/site"
import { SOCIAL_FORMATS, type SocialAsset } from "../lib/domain/social-assets"

type Props = {
  asset: SocialAsset
  position?: { index: number; total: number }
}

export function SocialSlide({ asset, position }: Props) {
  const { width, height } = SOCIAL_FORMATS[asset.format]
  const isSquare = asset.format === "square"

  return (
    <section
      data-social-asset={asset.id}
      style={{ width, height }}
      className="dark flex shrink-0 flex-col gap-12 overflow-hidden bg-background p-20 font-sans text-foreground break-after-page"
    >
      <header className="flex items-center justify-between text-2xl font-medium uppercase tracking-widest text-muted-foreground">
        <span>{siteConfig.name}</span>
        {position ? (
          <span className="tabular-nums">
            {String(position.index + 1).padStart(2, "0")} / {String(position.total).padStart(2, "0")}
          </span>
        ) : null}
      </header>

      <div className={isSquare && asset.image ? "flex min-h-0 flex-1 gap-12" : "flex min-h-0 flex-1 flex-col gap-12"}>
        <div className={isSquare && asset.image ? "flex w-1/2 flex-col justify-center gap-8" : "flex flex-col gap-8"}>
          <p className="text-2xl font-medium uppercase tracking-widest text-muted-foreground">{asset.eyebrow}</p>
          <h1
            className={
              asset.role === "cover"
                ? "text-balance text-8xl font-semibold leading-none tracking-tight"
                : "text-balance text-7xl font-semibold leading-tight tracking-tight"
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
      </div>
    </section>
  )
}
