import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { getPack, packProblems, packSlides, packs } from "@/features/showcase/lib/domain/packs"
import { carouselSlides, type SocialAsset } from "@/features/showcase/lib/domain/social-assets"
import { BUILD_STEPS, SECURITY_STEPS, TOUR_STOPS } from "@/features/showcase/lib/domain/topic-slides"

const publicFile = (file: string) => existsSync(join(REPO_ROOT, "public", file))
const TOPICS = ["security", "how-it-was-built", "site-tour"] as const

describe("topic carousels", () => {
  it("follow the audience packs and the checkout sequence", () => {
    expect(packs.map((p) => p.id)).toEqual(["recruiter", "buyer", "engineer", "checkout-sequence", ...TOPICS])
  })

  it.each(TOPICS)("%s is ready to export: carousel slides only, closing on contact", (id) => {
    expect(packProblems(getPack(id)!)).toEqual([])
  })

  const SHARED_CLOSERS = ["recruiter-cta", "carousel-cta"]

  it("stay out of the email case-study carousel", () => {
    const caseStudy = carouselSlides().map((s) => s.id)
    for (const id of TOPICS) {
      for (const slide of packSlides(getPack(id)!)) {
        if (SHARED_CLOSERS.includes(slide.id)) continue
        expect(caseStudy).not.toContain(slide.id)
      }
    }
  })
})

describe.each([
  ["security", SECURITY_STEPS],
  ["how-it-was-built", BUILD_STEPS],
] as const)("%s carousel", (id, steps) => {
  const pack = getPack(id)!
  const slides = packSlides(pack) as SocialAsset[]
  const names = steps.map((s) => s.name)

  it("opens on an overview cover with no step lit", () => {
    expect(pack.slides[0].role).toBe("cover")
    expect(slides[0].progress).toEqual({ steps: names, current: -1 })
  })

  it("gives each step its own slide, in order, with that step lit", () => {
    const stepSlides = slides.filter((s) => s.progress && s.progress.current >= 0)
    expect(stepSlides).toHaveLength(steps.length)
    stepSlides.forEach((slide, current) => {
      expect(slide.progress).toEqual({ steps: names, current })
      expect(slide.title).toBe(steps[current].title)
    })
  })
})

describe("security carousel", () => {
  it("covers the three permission layers, the merge gates and locked brand blocks", () => {
    expect(SECURITY_STEPS.map((s) => s.name)).toEqual(["Proxy", "Server action", "Screen", "Merge gates", "Locked blocks"])
  })
})

describe("how-it-was-built carousel", () => {
  it("walks the delivery loop and ends on the counted test suite", () => {
    expect(BUILD_STEPS.map((s) => s.name)).toEqual(["Plan", "Test first", "One PR", "Green only", "Ratchet"])
    const ids = getPack("how-it-was-built")!.slides.map((s) => s.id)
    expect(ids.at(-2)).toBe("infographic-engineer-tests")
  })
})

describe("site tour carousel", () => {
  const pack = getPack("site-tour")!
  const slides = packSlides(pack) as SocialAsset[]

  it("opens on four structure slides, then one recorded still per stop", () => {
    expect(pack.slides.slice(0, 4).map((s) => s.id)).toEqual([
      "infographic-tour-structure-overview",
      "infographic-tour-structure-storefront",
      "infographic-tour-structure-admin",
      "infographic-tour-structure-docs",
    ])
    expect(slides.slice(4, -1).map((s) => s.id)).toEqual(TOUR_STOPS.map((s) => `tour-${s.id}`))
  })

  it.each(TOUR_STOPS.map((s) => [s.id, s.still] as const))("the %s still is committed", (_id, still) => {
    expect(publicFile(still), still).toBe(true)
  })

  it("describes every still for screen readers", () => {
    for (const slide of slides.slice(4, -1)) expect(slide.image?.alt.length).toBeGreaterThan(30)
  })
})
