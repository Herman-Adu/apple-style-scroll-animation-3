import { describe, expect, it } from "vitest"
import { findHardCodedNumbers } from "@/features/showcase/lib/domain/facts"
import { getInfographic, infographicProblems, type Infographic } from "@/features/showcase/lib/domain/infographics"
import { buildDemoData } from "../../../scripts/lib/showcase-demo-data.mjs"
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

describe("buyer pack", () => {
  const buyer = getPack("buyer")!
  const slideFor = (role: string, nth = 0) => getInfographic(buyer.slides.filter((s) => s.role === role)[nth].id)!

  it("leads with cost, then control, the stock-alert story, the offer and a contact close", () => {
    expect(buyer.slides.map((s) => s.role)).toEqual(["cost", "cost", "control", "example", "offer", "close"])
  })

  it("shows three-year cost as a table and a cumulative line, both marked illustrative", () => {
    const table = slideFor("cost", 0)
    const line = slideFor("cost", 1)
    expect(table.kind).toBe("table")
    expect(line.kind).toBe("line-chart")
    expect(table.illustrative).toBe(true)
    expect(line.illustrative).toBe(true)
  })

  it("the cost table and the cost line show the same numbers", () => {
    const table = slideFor("cost", 0)
    const line = slideFor("cost", 1)
    if (table.kind !== "table" || line.kind !== "line-chart") throw new Error("wrong kinds")
    expect(table.rows.map((r) => r.label)).toEqual(line.xLabels)
    line.series.forEach((series, column) => {
      expect(table.columns[column + 1]).toBe(series.name)
      expect(table.rows.map((r) => r.cells[column])).toEqual(series.values)
    })
  })

  it("shows editors self-serving as a before and after", () => {
    const slide = slideFor("control")
    if (slide.kind !== "table") throw new Error("expected a table")
    expect(slide.columns.slice(1)).toEqual(["Before", "With this store"])
  })

  it("the stock-alert chart matches the waiting alerts the demo seed writes", () => {
    const slide = slideFor("example")
    if (slide.kind !== "bar-chart") throw new Error("expected a bar chart")
    expect(slide.demoData).toBe(true)
    const names: Record<string, string> = { "momo-studio": "MOMO Studio", "momo-x": "MOMO X", "momo-beat": "MOMO Beat", "momo-air": "MOMO Air" }
    const seeded = buildDemoData(new Date("2026-10-06T09:00:00.000Z")).stockAlerts.reduce<Record<string, number>>(
      (counts, alert: { productSlug: string }) => ({ ...counts, [names[alert.productSlug]]: (counts[names[alert.productSlug]] ?? 0) + 1 }),
      {},
    )
    expect(Object.fromEntries(slide.bars.map((b) => [b.label, b.value]))).toEqual(seeded)
  })

  it("ends with the offer and hand-over, then the build-vs-buy contact slide", () => {
    expect(buyer.slides.slice(-2).map((s) => s.id)).toEqual(["infographic-offer", "carousel-cta"])
  })

  it("keeps buyer-only slides out of the email case-study carousel", () => {
    expect(carouselSlides().map((s) => s.id)).not.toContain(buyer.slides[0].id)
  })
})

describe("demo-data and typed table values", () => {
  const base = getInfographic("infographic-buyer-stock-alerts")!

  it("allows typed chart values on a slide marked as demo data", () => {
    expect(infographicProblems(base)).toEqual([])
    expect(findHardCodedNumbers(base)).toEqual([])
  })

  it("still rejects typed chart values with neither flag", () => {
    const { demoData: _demoData, ...plain } = base as Infographic & { demoData?: true }
    expect(infographicProblems(plain as Infographic)).toContain("typed values: read them from facts or mark the slide illustrative")
  })

  it("rejects typed numbers in a table that is not illustrative", () => {
    const table = getInfographic("infographic-buyer-cost-table")!
    const { illustrative: _illustrative, ...plain } = table
    expect(infographicProblems(plain as Infographic)).toContain("typed values: read them from facts or mark the slide illustrative")
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
