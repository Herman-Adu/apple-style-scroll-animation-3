import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { docs } from "@/features/docs/content"
import { docText } from "@/features/docs/lib/domain/freshness"
import { briefPdfPath } from "@/features/showcase/lib/domain/asset-paths"
import { briefs, getBrief } from "@/features/showcase/lib/domain/briefs"
import { infographicProblems } from "@/features/showcase/lib/domain/infographics"
import { getInfographic } from "@/features/showcase/lib/domain/infographic-registry"
import { packProblems, packSlides, packs } from "@/features/showcase/lib/domain/packs"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * One forwardable PDF for a CTO weighing the build.
 *
 * The public Business Case docs are the finished argument a reader can take
 * away, but eight pages to browse is not what gets forwarded to a board. This
 * pack is that argument as a single document, built through the pipeline that
 * already makes the audience carousels rather than a second one.
 *
 * It is composed from existing slides wherever one already makes the point, so
 * only the two arguments the catalogue had no slide for are new: the build-buy
 * decision, and what a replatform costs when it goes wrong. Both are bound below
 * to the public doc they come from, because a deck that drifts from the doc it
 * summarises is a fourth copy of the pitch, not a summary of it.
 */
const BRIEF_ID = "business-case"
const NEW_SLIDES = ["infographic-cto-build-vs-buy", "infographic-cto-replatform-risk"] as const

const pack = () => getBrief(BRIEF_ID)

/** Page count straight from the PDF bytes, the way the slide-count guard reads it. */
function pdfPageCount(file: string): number {
  const bytes = readFileSync(join(REPO_ROOT, "public", file.replace(/^[/\\]/, ""))).toString("latin1")
  return (bytes.match(/\/Type\s*\/Page(?!\w)/g) ?? []).length
}

describe("the business case pack", () => {
  it("exists and is ready to export", () => {
    expect(pack(), `no "${BRIEF_ID}" pack`).toBeDefined()
    expect(packProblems(pack()!)).toEqual([])
  })

  it("is aimed at the reader who has to justify the decision", () => {
    expect(pack()!.audience).toMatch(/cto|technical|decision/i)
  })

  it("stays short enough to be read in one sitting", () => {
    // A brief, not a library. Long enough to make the case, short enough to forward.
    expect(pack()!.slides.length).toBeGreaterThanOrEqual(6)
    expect(pack()!.slides.length).toBeLessThanOrEqual(10)
  })

  it("leads with proof before it names a single technology", () => {
    const roles = pack()!.slides.map((slide) => slide.role)
    expect(roles).toContain("proof")
    expect(roles.indexOf("proof")).toBeLessThan(roles.indexOf("technology"))
  })

  it("makes the decision, cost and risk arguments, not just the feature list", () => {
    const roles = pack()!.slides.map((slide) => slide.role)
    expect(roles, "the build-buy decision").toContain("judgement")
    expect(roles, "what it costs over three years").toContain("cost")
    expect(roles, "what lock-in costs").toContain("control")
  })

  it("reuses the catalogue instead of restating it", () => {
    // Only the two genuinely missing arguments are new; everything else already
    // existed. A pack of all-new slides would mean the catalogue was ignored.
    const ids = pack()!.slides.map((slide) => slide.id)
    const added = ids.filter((id) => (NEW_SLIDES as readonly string[]).includes(id))
    expect(added.sort()).toEqual([...NEW_SLIDES].sort())
    expect(ids.length - added.length, "reused slides").toBeGreaterThanOrEqual(4)
  })

  it("ends on a way to make contact", () => {
    expect(pack()!.slides.at(-1)?.role).toBe("close")
  })
})

describe("the two new CTO slides", () => {
  it.each(NEW_SLIDES)("%s exists, fits the page and reads well", (id) => {
    const slide = getInfographic(id)
    expect(slide, `${id} is not in the registry`).toBeDefined()
    expect(slide!.format, `${id} must be a carousel page`).toBe("carousel")
    expect(infographicProblems(slide!)).toEqual([])
  })

  it("says which pack they belong to, so catalogue guards can tell them apart", () => {
    for (const id of NEW_SLIDES) {
      expect(getInfographic(id)!.pack, id).toBe("cto")
    }
  })
})

/**
 * The slides summarise two public docs. Each row label below has to appear in
 * the doc it came from, so a slide cannot quietly start making a different
 * argument than the page a reader was sent to.
 */
describe("the new slides agree with the docs they summarise", () => {
  const docTextBySlug = (slug: string) => {
    const doc = docs.find((candidate) => candidate.slug === slug)
    expect(doc, `missing doc ${slug}`).toBeDefined()
    return docText(doc!)
  }

  it("takes the build-buy options from the public build-vs-buy page", () => {
    const slide = getInfographic("infographic-cto-build-vs-buy")!
    expect(slide.kind).toBe("table")
    const text = docTextBySlug("build-vs-buy-the-decision")
    const labels = slide.kind === "table" ? slide.rows.map((row) => row.label) : []
    expect(labels.length).toBeGreaterThanOrEqual(3)
    expect(labels.filter((label) => !text.includes(label))).toEqual([])
  })

  it("takes the replatform risk from the public cost-of-ownership page", () => {
    const slide = getInfographic("infographic-cto-replatform-risk")!
    expect(slide.kind).toBe("table")
    const text = docTextBySlug("roi-and-total-cost-of-ownership")
    expect(text).toMatch(/replatform risk/i)
    const labels = slide.kind === "table" ? slide.rows.map((row) => row.label) : []
    expect(labels.length).toBeGreaterThanOrEqual(3)
    expect(labels.filter((label) => !text.includes(label))).toEqual([])
  })
})

describe("the published brief", () => {
  it("is one PDF in its own folder, named as a document rather than a post", () => {
    expect(briefPdfPath("business-case")).toBe("/showcase/social/business-case/brief.pdf")
  })

  it("is not a pack, so the posting calendar does not demand a feed slot for it", () => {
    // Every published `carousel.pdf` must hold exactly one slot in the four-week
    // calendar, which is correct for a post and wrong for a document that gets
    // forwarded in a reply. Naming it `brief.pdf` is what keeps both guards honest.
    expect(packs.map((candidate) => candidate.id)).not.toContain(BRIEF_ID)
    expect(briefs.map((candidate) => candidate.id)).toContain(BRIEF_ID)
  })

  it("has one page per slide", () => {
    // The export prints exactly one page per slide, so a page count that has
    // drifted from the pack means the committed PDF is from an older run.
    expect(pdfPageCount(briefPdfPath("business-case"))).toBe(packSlides(pack()!).length)
  })
})
