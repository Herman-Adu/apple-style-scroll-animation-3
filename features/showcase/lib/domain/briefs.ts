import { briefPdfPath, type AssetGroup } from "./asset-paths"
import { type ExportItem, SOCIAL_FORMATS } from "./social-assets"
import { type Pack } from "./packs"

/**
 * A brief is one PDF to forward, not a post to swipe.
 *
 * It is deliberately not in `packs`. A pack publishes `carousel.pdf`, and the
 * posting calendar requires every published carousel to hold exactly one feed
 * slot - correctly, because an asset nobody schedules was how the site-tour and
 * enquiry clips went unposted for three sprints. A document sent in a reply or
 * attached to a proposal has no feed slot to hold, so it publishes as
 * `brief.pdf` and the calendar leaves it alone.
 *
 * It reuses the `Pack` shape, and therefore `packProblems`, so the same rules
 * still apply: carousel-size pages, proof before any technology is named, and a
 * way to make contact at the end.
 */
export const briefs: Pack[] = [
  {
    id: "business-case",
    audience: "CTOs and the people who have to justify the decision",
    slides: [
      { id: "infographic-tour-structure-overview", role: "architecture" },
      { id: "infographic-cto-build-vs-buy", role: "judgement" },
      { id: "infographic-buyer-cost-line", role: "cost" },
      { id: "infographic-cto-replatform-risk", role: "control" },
      { id: "infographic-recruiter-proof", role: "proof" },
      { id: "infographic-stack", role: "technology" },
      { id: "infographic-offer", role: "offer" },
      { id: "carousel-cta", role: "close" },
    ],
  },
]

export const briefId = (id: string) => `brief-${id}`

export const getBrief = (id: string): Pack | undefined => briefs.find((brief) => brief.id === id)

export function getBriefByExportId(exportId: string): Pack | undefined {
  return briefs.find((brief) => briefId(brief.id) === exportId)
}

/** One document PDF per brief, pages in order. */
export function briefExportPlan(): ExportItem[] {
  return briefs.map((brief) => ({
    kind: "pdf",
    asset: briefId(brief.id),
    file: briefPdfPath(brief.id as AssetGroup),
    ...SOCIAL_FORMATS.carousel,
  }))
}
