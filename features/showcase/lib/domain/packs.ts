import { getInfographic, type Infographic } from "./infographics"
import { CHECKOUT_STEPS } from "./sequence-slides"
import { BUILD_STEPS, SECURITY_STEPS, TOUR_STOPS } from "./topic-slides"
import { SOCIAL_FORMATS, getSocialAsset, type ExportItem, type SocialAsset } from "./social-assets"
import { carouselPdfPath, type AssetGroup } from "./asset-paths"

export type PackRole =
  | "cover"
  | "step"
  | "outcome"
  | "proof"
  | "judgement"
  | "example"
  | "technology"
  | "cost"
  | "control"
  | "offer"
  | "architecture"
  | "sequence"
  | "testing"
  | "close"
export type Pack = { id: string; audience: string; slides: { id: string; role: PackRole }[] }

export const packs: Pack[] = [
  {
    id: "recruiter",
    audience: "Recruiters and hiring managers",
    slides: [
      { id: "infographic-recruiter-built", role: "outcome" },
      { id: "infographic-recruiter-proof", role: "proof" },
      { id: "infographic-recruiter-judgement", role: "judgement" },
      { id: "infographic-sequence", role: "example" },
      { id: "infographic-stack", role: "technology" },
      { id: "recruiter-cta", role: "close" },
    ],
  },
  {
    id: "buyer",
    audience: "Business owners and buyers",
    slides: [
      { id: "infographic-buyer-cost-table", role: "cost" },
      { id: "infographic-buyer-cost-line", role: "cost" },
      { id: "infographic-buyer-self-serve", role: "control" },
      { id: "infographic-buyer-stock-alerts", role: "example" },
      { id: "infographic-offer", role: "offer" },
      { id: "carousel-cta", role: "close" },
    ],
  },
  {
    id: "engineer",
    audience: "Engineers and technical leads",
    slides: [
      { id: "infographic-engineer-architecture", role: "architecture" },
      { id: "infographic-engineer-checkout", role: "sequence" },
      { id: "infographic-engineer-restock", role: "sequence" },
      { id: "infographic-engineer-theme", role: "sequence" },
      { id: "infographic-engineer-tests", role: "testing" },
      { id: "infographic-engineer-coverage", role: "testing" },
      { id: "recruiter-cta", role: "close" },
    ],
  },
  {
    id: "checkout-sequence",
    audience: "Everyone: one flow, one step per swipe",
    slides: [
      { id: "sequence-checkout-cover", role: "cover" },
      ...CHECKOUT_STEPS.map((_, i) => ({ id: `sequence-checkout-${i + 1}`, role: "step" as const })),
      { id: "recruiter-cta", role: "close" },
    ],
  },
  {
    id: "security",
    audience: "Engineers and buyers who ask who can touch the data",
    slides: [
      { id: "security-cover", role: "cover" },
      ...SECURITY_STEPS.map((_, i) => ({ id: `security-${i + 1}`, role: "step" as const })),
      { id: "recruiter-cta", role: "close" },
    ],
  },
  {
    id: "how-it-was-built",
    audience: "Recruiters and engineers: the delivery process",
    slides: [
      { id: "build-cover", role: "cover" },
      ...BUILD_STEPS.map((_, i) => ({ id: `build-${i + 1}`, role: "step" as const })),
      { id: "infographic-engineer-tests", role: "testing" },
      { id: "recruiter-cta", role: "close" },
    ],
  },
  {
    id: "site-tour",
    audience: "Everyone: what the site looks like, stop by stop",
    slides: [
      { id: "infographic-tour-structure-overview", role: "architecture" },
      { id: "infographic-tour-structure-storefront", role: "architecture" },
      { id: "infographic-tour-structure-admin", role: "architecture" },
      { id: "infographic-tour-structure-docs", role: "architecture" },
      ...TOUR_STOPS.map((s) => ({ id: `tour-${s.id}`, role: "example" as const })),
      { id: "carousel-cta", role: "close" },
    ],
  },
]

export function getPack(id: string): Pack | undefined {
  return packs.find((p) => p.id === id)
}

export const packCarouselId = (packId: string) => `pack-${packId}`
export const packCarouselPdf = (packId: string) => carouselPdfPath(packId.replace(/^pack-/, "") as AssetGroup)

export function getPackByCarouselId(carouselId: string): Pack | undefined {
  return packs.find((p) => packCarouselId(p.id) === carouselId)
}

/** One LinkedIn document PDF per pack, pages in pack order. */
export function packExportPlan(): ExportItem[] {
  return packs.map((p) => ({
    kind: "pdf",
    asset: packCarouselId(p.id),
    file: packCarouselPdf(p.id),
    ...SOCIAL_FORMATS.carousel,
  }))
}

const resolveSlide = (id: string): Infographic | SocialAsset | undefined => getInfographic(id) ?? getSocialAsset(id)

export function packSlides(pack: Pack): (Infographic | SocialAsset)[] {
  return pack.slides.flatMap((s) => resolveSlide(s.id) ?? [])
}

/** Every reason a pack would not tell its story in order. Empty means it is ready to export. */
export function packProblems(pack: Pack): string[] {
  const indexOf = (role: PackRole) => pack.slides.findIndex((s) => s.role === role)
  const last = pack.slides.at(-1)
  const lastAsset = last ? getSocialAsset(last.id) : undefined

  return [
    ...pack.slides.flatMap(({ id }) => {
      const slide = resolveSlide(id)
      if (!slide) return [`slide "${id}" does not exist`]
      return slide.format === "carousel" ? [] : [`slide "${id}" is ${slide.format}, not carousel`]
    }),
    ...(indexOf("proof") >= 0 && indexOf("technology") >= 0 && indexOf("proof") > indexOf("technology")
      ? ["proof must come before technology"]
      : []),
    ...(last?.role === "close" && lastAsset?.cta ? [] : ["the last slide must be a contact slide"]),
  ]
}
