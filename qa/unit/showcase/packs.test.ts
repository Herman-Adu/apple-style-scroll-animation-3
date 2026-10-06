import { describe, expect, it } from "vitest"
import { findHardCodedNumbers } from "@/features/showcase/lib/domain/facts"
import { getInfographic } from "@/features/showcase/lib/domain/infographics"
import { getPack, packProblems, packSlides, packs, type Pack } from "@/features/showcase/lib/domain/packs"
import { carouselSlides, getSocialAsset } from "@/features/showcase/lib/domain/social-assets"

const recruiter = getPack("recruiter")!

describe("audience packs", () => {
  it.each(packs.map((p) => [p.id, p] as const))("%s pack has no problems", (_id, pack) => {
    expect(packProblems(pack)).toEqual([])
  })

  it("the recruiter pack opens with outcomes, puts proof before technology and closes with contact", () => {
    expect(recruiter.slides.map((s) => s.role)).toEqual(["outcome", "proof", "judgement", "example", "technology", "close"])
  })

  it("reuses the back-in-stock sequence as the worked example and the stack as the technology slide", () => {
    const byRole = Object.fromEntries(recruiter.slides.map((s) => [s.role, s.id]))
    expect(byRole.example).toBe("infographic-sequence")
    expect(byRole.technology).toBe("infographic-stack")
  })

  it("binds the proof strip to test, coverage and architecture facts", () => {
    const proof = getInfographic(recruiter.slides.find((s) => s.role === "proof")!.id)!
    const facts = JSON.stringify(proof).match(/"fact":"[\w.]+"/g) ?? []
    expect(facts).toEqual(
      expect.arrayContaining(['"fact":"tests.total"', '"fact":"coverage.lines"', '"fact":"coverage.branches"']),
    )
    expect(findHardCodedNumbers(proof)).toEqual([])
  })

  it("the engineering-judgement slide is the one-way dependency rule", () => {
    const slide = getInfographic(recruiter.slides.find((s) => s.role === "judgement")!.id)!
    expect(slide.kind).toBe("layers")
    expect(slide.summary).toMatch(/CI/)
  })

  it("closes on a contact slide with a QR link and an email", () => {
    const close = getSocialAsset(recruiter.slides.at(-1)!.id)!
    expect(close.role).toBe("cta")
    expect(close.cta?.email).toMatch(/@/)
    expect(close.cta?.link).toBeTruthy()
  })

  it("resolves every slide, all in carousel format", () => {
    const slides = packSlides(recruiter)
    expect(slides).toHaveLength(recruiter.slides.length)
    expect(slides.every((s) => s.format === "carousel")).toBe(true)
  })

  it("keeps pack-only slides out of the email case-study carousel", () => {
    expect(carouselSlides().map((s) => s.id)).not.toContain(recruiter.slides.at(-1)!.id)
  })
})

describe("packProblems", () => {
  const withSlides = (slides: Pack["slides"]): Pack => ({ ...recruiter, slides })

  it("flags a slide id that does not exist", () => {
    expect(packProblems(withSlides([...recruiter.slides.slice(0, -1), { id: "nope", role: "close" }]))).toContain(
      'slide "nope" does not exist',
    )
  })

  it("flags technology shown before proof", () => {
    const [outcome, proof, judgement, example, technology, close] = recruiter.slides
    expect(packProblems(withSlides([outcome, technology, judgement, example, proof, close]))).toContain(
      "proof must come before technology",
    )
  })

  it("flags a slide that is not carousel format", () => {
    const slides = recruiter.slides.map((s) => (s.role === "judgement" ? { ...s, id: "infographic-layers" } : s))
    expect(packProblems(withSlides(slides))).toContain('slide "infographic-layers" is square, not carousel')
  })

  it("flags a pack that does not end on a contact slide", () => {
    expect(packProblems(withSlides(recruiter.slides.slice(0, -1)))).toContain("the last slide must be a contact slide")
  })
})
