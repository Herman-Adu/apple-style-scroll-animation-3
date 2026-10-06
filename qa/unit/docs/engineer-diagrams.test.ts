import { describe, expect, it } from "vitest"
import { docs } from "@/features/docs/content"
import type { DocBlock } from "@/features/docs/lib/domain/schema"
import { getInfographic } from "@/features/showcase/lib/domain/infographics"

const SLUG = "architecture-in-diagrams"
const doc = docs.find((d) => d.slug === SLUG)

type Mermaid = Extract<DocBlock, { type: "mermaid" }>
const diagram = (title: string) =>
  doc?.body.find((b): b is Mermaid => b.type === "mermaid" && b.title === title)?.diagram ?? ""

/** Slide id -> the title of its full-size Mermaid figure on the docs page. */
const SEQUENCE_FIGURES = {
  "infographic-engineer-checkout": "Checkout to confirmation email",
  "infographic-engineer-restock": "Restock to back-in-stock alert",
  "infographic-engineer-theme": "Theme activation",
} as const

function parseSequence(text: string) {
  const alias = new Map<string, string>()
  for (const [, id, name] of text.matchAll(/^\s*participant (\w+) as (.+)$/gm)) alias.set(id, name.trim())
  const messages = [...text.matchAll(/^\s*(\w+)-{1,2}>>(\w+):\s*(.+)$/gm)].map(([, from, to, label]) => ({
    from: alias.get(from) ?? from,
    to: alias.get(to) ?? to,
    label: label.trim(),
  }))
  return { participants: [...alias.values()], messages }
}

describe("architecture in diagrams docs page", () => {
  it("is a public developer page in the Architecture category", () => {
    expect(doc).toBeDefined()
    expect(doc?.audience).toBe("developer")
    expect(doc?.access).toBe("public")
    expect(doc?.category).toBe("Architecture")
  })

  it("draws every block of the architecture slide as a subgraph", () => {
    const slide = getInfographic("infographic-engineer-architecture")
    if (slide?.kind !== "layers") throw new Error("expected the architecture layers slide")
    const text = diagram("Four blocks, one direction")
    expect(text).toMatch(/^flowchart/)
    for (const layer of slide.layers) expect(text, layer.name).toContain(`["${layer.name}"]`)
  })

  it.each(Object.entries(SEQUENCE_FIGURES))("%s agrees with its full-size figure", (id, title) => {
    const slide = getInfographic(id)
    if (slide?.kind !== "sequence") throw new Error(`${id} is not a sequence slide`)
    const { participants, messages } = parseSequence(diagram(title))

    expect(participants).toEqual(expect.arrayContaining(slide.actors))

    const missing = slide.steps.reduce<{ at: number; missing: string[] }>(
      (state, step) => {
        const found = messages.findIndex(
          (m, index) => index >= state.at && m.from === step.from && m.to === step.to && m.label === step.label,
        )
        return found < 0 ? { ...state, missing: [...state.missing, step.label] } : { ...state, at: found + 1 }
      },
      { at: 0, missing: [] },
    ).missing
    expect(missing, "slide steps must appear in the figure, in order").toEqual([])
  })
})
