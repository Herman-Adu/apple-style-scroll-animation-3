import { getInfographic, type Infographic } from "./infographics"
import { getSocialAsset, type SocialAsset } from "./social-assets"

export type PackRole =
  | "outcome"
  | "proof"
  | "judgement"
  | "example"
  | "technology"
  | "cost"
  | "control"
  | "offer"
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
]

export function getPack(id: string): Pack | undefined {
  return packs.find((p) => p.id === id)
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
