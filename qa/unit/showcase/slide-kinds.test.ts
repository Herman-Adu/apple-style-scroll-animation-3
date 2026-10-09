import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { InfographicSlide } from "@/features/showcase/components/infographic-slide"
import { findHardCodedNumbers, type Facts } from "@/features/showcase/lib/domain/facts"
import {
  CHART_LABEL_MIN_PX,
  SLIDE_LIMITS,
  infographicProblems,
  infographics,
  type Infographic,
} from "@/features/showcase/lib/domain/infographics"
import { SOCIAL_FORMATS, type SocialFormat } from "@/features/showcase/lib/domain/social-assets"
import { StructureBody } from "@/features/showcase/components/structure-body"
import { getArea } from "@/features/showcase/lib/domain/site-structure"

const facts: Facts = {
  generatedAt: "2026-10-06T00:00:00.000Z",
  tests: { unit: 941, integration: 146, smoke: 15, axe: 10, seo: 6, total: 1118 },
  coverage: { lines: 35.7, branches: 27.4 },
  arch: { deepImports: 0, libToFeatures: 0, anyTypes: 0, largeFiles: 3, useEffect: 12 },
  docs: { pages: 60 },
  routes: { pages: 40 },
  repo: { mergedPrs: 165, latestPr: 174 },
}

const NEW_KINDS = ["table", "bar-chart", "line-chart", "sequence"] as const
type NewKind = (typeof NEW_KINDS)[number]

function sample<K extends NewKind>(kind: K): Extract<Infographic, { kind: K }> {
  const found = infographics.find((i): i is Extract<Infographic, { kind: K }> => i.kind === kind && !i.pack)
  if (!found) throw new Error(`no ${kind} infographic in the registry`)
  return found
}

const render = (infographic: Infographic, withFacts: Facts | null = facts) =>
  renderToStaticMarkup(createElement(InfographicSlide, { infographic, facts: withFacts }))

const chartLabelSizes = (html: string) =>
  [...html.matchAll(/data-chart-label="true" style="font-size:(\d+)px"/g)].map((m) => Number(m[1]))

describe("slide formats", () => {
  it("offers 4:5 (carousel), square and a 9:16 story format", () => {
    const { carousel, square, story } = SOCIAL_FORMATS
    expect(carousel.width / carousel.height).toBeCloseTo(4 / 5, 5)
    expect(square.width).toBe(square.height)
    expect(story).toEqual({ width: 1080, height: 1920 })
  })
})

describe("registry validation", () => {
  it.each(infographics.map((i) => [i.id, i] as const))("%s is within the slide limits", (_id, infographic) => {
    expect(infographicProblems(infographic)).toEqual([])
  })

  it("has one core example of each new kind", () => {
    for (const kind of NEW_KINDS) {
      expect(infographics.filter((i) => i.kind === kind && !i.pack), kind).toHaveLength(1)
    }
  })

  it("refuses a sequence with more than four actors", () => {
    const seq = sample("sequence")
    const broken = { ...seq, actors: ["A", "B", "C", "D", "E"] }
    expect(infographicProblems(broken).join(" ")).toMatch(/actors/)
    expect(SLIDE_LIMITS.sequenceActors).toBe(4)
  })

  it("refuses a sequence with more than six steps", () => {
    const seq = sample("sequence")
    const step = seq.steps[0]
    const broken = { ...seq, steps: Array.from({ length: 7 }, () => step) }
    expect(infographicProblems(broken).join(" ")).toMatch(/steps/)
    expect(SLIDE_LIMITS.sequenceSteps).toBe(6)
  })

  it("refuses a step between unknown actors or from an actor to itself", () => {
    const seq = sample("sequence")
    const [a] = seq.actors
    expect(infographicProblems({ ...seq, steps: [{ from: a, to: "Nobody", label: "Hello" }] }).join(" ")).toMatch(/Nobody/)
    expect(infographicProblems({ ...seq, steps: [{ from: a, to: a, label: "Hello" }] }).join(" ")).toMatch(/itself/)
  })

  it("refuses chart labels too long to print at the minimum size", () => {
    const bar = sample("bar-chart")
    const broken = { ...bar, bars: [{ ...bar.bars[0], label: "A label far too long for a bar" }, ...bar.bars.slice(1)] }
    expect(infographicProblems(broken).join(" ")).toMatch(/label/)
  })

  it("refuses typed chart values unless the slide is marked illustrative", () => {
    const bar = sample("bar-chart")
    const typed = { ...bar, illustrative: undefined, bars: bar.bars.map((b) => ({ ...b, value: 3 })) }
    expect(infographicProblems(typed).join(" ")).toMatch(/illustrative/)
    expect(findHardCodedNumbers(typed).length).toBeGreaterThan(0)
    const marked = { ...typed, illustrative: true as const }
    expect(infographicProblems(marked)).toEqual([])
    expect(findHardCodedNumbers(marked)).toEqual([])
  })

  it("still refuses digits in the copy of an illustrative slide", () => {
    const line = sample("line-chart")
    expect(findHardCodedNumbers({ ...line, xLabels: ["Year 1", ...line.xLabels.slice(1)] })).toEqual(["xLabels.0"])
  })

  it("refuses a chart without a real text alternative", () => {
    const line = sample("line-chart")
    expect(infographicProblems({ ...line, alt: "Chart" }).join(" ")).toMatch(/alt/)
  })

  it("refuses a series whose length does not match the x labels", () => {
    const line = sample("line-chart")
    const broken = { ...line, series: [{ ...line.series[0], values: line.series[0].values.slice(1) }] }
    expect(infographicProblems(broken).join(" ")).toMatch(/values/)
  })

  it("refuses a table row with the wrong number of cells", () => {
    const table = sample("table")
    const broken = { ...table, rows: [{ ...table.rows[0], cells: table.rows[0].cells.slice(1) }] }
    expect(infographicProblems(broken).join(" ")).toMatch(/cells/)
  })
})

describe("new kinds render at every format", () => {
  const formats = Object.keys(SOCIAL_FORMATS) as SocialFormat[]
  const cases = NEW_KINDS.flatMap((kind) => formats.map((format) => [kind, format] as const))

  it.each(cases)("%s at %s", (kind, format) => {
    const html = render({ ...sample(kind), format })
    const { width, height } = SOCIAL_FORMATS[format]
    expect(html).toContain(`width:${width}px;height:${height}px`)
    expect(html).toContain(sample(kind).title.replace(/'/g, "&#x27;"))
  })
})

describe("charts are readable and accessible", () => {
  it.each(["bar-chart", "line-chart"] as const)("%s has a text alternative", (kind) => {
    const chart = sample(kind)
    expect(render(chart)).toContain(`role="img" aria-label="${chart.alt}"`)
  })

  it("prints every chart label at least at the minimum size", () => {
    const bar = sample("bar-chart")
    const line = sample("line-chart")
    const barSizes = chartLabelSizes(render(bar))
    const lineSizes = chartLabelSizes(render(line))
    // A bar chart prints a label per bar plus its axis ticks, as the line chart
    // prints its series names alongside its x labels. The size is the invariant.
    expect(barSizes.length).toBeGreaterThanOrEqual(bar.bars.length)
    expect(lineSizes.length).toBeGreaterThanOrEqual(line.xLabels.length)
    for (const size of [...barSizes, ...lineSizes]) expect(size).toBeGreaterThanOrEqual(CHART_LABEL_MIN_PX)
  })

  it("shows fact values on a facts chart and a dash when facts are missing", () => {
    const bar = sample("bar-chart")
    expect(render(bar)).toContain(">941<")
    expect(render(bar, null)).toContain(">–<")
  })

  it("prints Illustrative only on illustrative slides", () => {
    expect(sample("line-chart").illustrative).toBe(true)
    expect(render(sample("line-chart"))).toContain(">Illustrative<")
    expect(render(sample("bar-chart"))).not.toContain(">Illustrative<")
  })

  it("gives the sequence a plain text reading order", () => {
    const seq = sample("sequence")
    const html = render(seq)
    const [first] = seq.steps
    expect(html).toContain(`${first.from} to ${first.to}: ${first.label}`)
  })
})

describe("structure body", () => {
  const renderArea = (area: Parameters<typeof getArea>[0]) =>
    renderToStaticMarkup(createElement(StructureBody, { area }))

  /** React escapes markup characters, so "Headings & style" renders as "Headings &amp; style". */
  const escaped = (text: string) =>
    text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#x27;")

  it.each(["overview", "storefront", "admin", "docs"] as const)("prints every group of the %s area", (area) => {
    const html = renderArea(area)
    for (const group of getArea(area).groups) expect(html).toContain(escaped(group.label))
  })

  it("prints the children of a group that has them", () => {
    const html = renderArea("admin")
    const parent = getArea("admin").groups.find((group) => group.children.length > 0)
    expect(parent, "the admin nav has a group with children").toBeDefined()
    for (const child of parent!.children) expect(html).toContain(escaped(child.label))
  })

  it("renders a group with no children as a leaf, with no empty list", () => {
    // Orders and Analytics have no sub-items. An empty <ul> would draw a rule
    // under them and read as a section that failed to load.
    const leaf = getArea("admin").groups.find((group) => group.children.length === 0)
    expect(leaf, "the admin nav has a childless group to exercise").toBeDefined()
    const html = renderArea("admin")
    expect(html).toContain(escaped(leaf!.label))
    expect(html).not.toMatch(/<ul[^>]*><\/ul>/)
  })

  it("names who each front door is for", () => {
    expect(renderArea("storefront")).toContain(escaped(getArea("storefront").forWhom))
  })
})
