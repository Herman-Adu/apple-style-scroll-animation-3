import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { docs } from "@/features/docs/content"
import {
  getPack,
  packCarouselId,
  packCarouselPdf,
  packExportPlan,
  packSlides,
  packs,
} from "@/features/showcase/lib/domain/packs"
import { CHECKOUT_STEPS } from "@/features/showcase/lib/domain/sequence-slides"
import { SOCIAL_FORMATS, carouselSlides, type SocialAsset } from "@/features/showcase/lib/domain/social-assets"

const publicFile = (file: string) => existsSync(join(REPO_ROOT, "public", file))

describe("pack carousels", () => {
  it("covers the three audiences, the checkout sequence and the topic carousels", () => {
    expect(packs.map((p) => p.id)).toEqual([
      "recruiter",
      "buyer",
      "engineer",
      "checkout-sequence",
      "security",
      "how-it-was-built",
      "site-tour",
    ])
  })

  it("exports one carousel-size PDF per pack", () => {
    expect(packExportPlan()).toEqual(
      packs.map((p) => ({
        kind: "pdf",
        asset: packCarouselId(p.id),
        file: packCarouselPdf(p.id),
        ...SOCIAL_FORMATS.carousel,
      })),
    )
  })

  it("names each file linkedin-<pack>-carousel.pdf", () => {
    expect(packCarouselPdf("buyer")).toBe("/showcase/social/linkedin-buyer-carousel.pdf")
    expect(packCarouselId("buyer")).toBe("pack-buyer")
  })
})

describe("checkout sequence carousel", () => {
  const pack = getPack("checkout-sequence")!
  const slides = packSlides(pack) as SocialAsset[]

  it("tells checkout in five steps, in order", () => {
    expect(CHECKOUT_STEPS.map((s) => s.name)).toEqual([
      "Customer pays",
      "Total re-checked",
      "Stripe charges once",
      "Order saved",
      "Email sent",
    ])
  })

  it("opens on a cover, gives each step its own slide and closes on contact", () => {
    expect(pack.slides.map((s) => s.role)).toEqual(["cover", ...CHECKOUT_STEPS.map(() => "step"), "close"])
    expect(slides.at(-1)?.cta?.email).toMatch(/@/)
  })

  it("lights up the current step on each step slide", () => {
    slides.slice(1, -1).forEach((slide, current) => {
      expect(slide.progress).toEqual({ steps: CHECKOUT_STEPS.map((s) => s.name), current })
      expect(slide.title).toBe(CHECKOUT_STEPS[current].title)
    })
  })

  it("stays out of the email case-study carousel", () => {
    const caseStudy = carouselSlides().map((s) => s.id)
    for (const slide of slides) expect(caseStudy).not.toContain(slide.id)
  })
})

describe("launch kit", () => {
  const text = JSON.stringify(docs.find((d) => d.slug === "social-launch-kit")!.body)

  it.each(packs.map((p) => [p.id, packCarouselPdf(p.id)] as const))(
    "links the %s carousel PDF and the file is committed",
    (_id, file) => {
      expect(text).toContain(file)
      expect(publicFile(file), file).toBe(true)
    },
  )
})
