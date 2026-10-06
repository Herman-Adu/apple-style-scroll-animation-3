import { describe, expect, it } from "vitest"
import { planScroll } from "../../showcase/scroll-plan"

describe("planScroll", () => {
  it("scrolls exactly to the bottom of the page, footer included", () => {
    const deltas = planScroll({ scrollHeight: 6000, viewportHeight: 720, steps: 30 })
    expect(deltas.reduce((sum, delta) => sum + delta, 0)).toBe(6000 - 720)
  })

  it("uses the requested number of steps with whole, positive deltas", () => {
    const deltas = planScroll({ scrollHeight: 4321, viewportHeight: 720, steps: 24 })
    expect(deltas).toHaveLength(24)
    for (const delta of deltas) {
      expect(Number.isInteger(delta)).toBe(true)
      expect(delta).toBeGreaterThan(0)
    }
  })

  it("eases in and out: the first and last steps are smaller than the middle", () => {
    const deltas = planScroll({ scrollHeight: 8000, viewportHeight: 720, steps: 30 })
    const middle = deltas[Math.floor(deltas.length / 2)]
    expect(deltas[0]).toBeLessThan(middle)
    expect(deltas[deltas.length - 1]).toBeLessThan(middle)
  })

  it("returns no steps when the page already fits in the viewport", () => {
    expect(planScroll({ scrollHeight: 700, viewportHeight: 720, steps: 20 })).toEqual([])
  })

  it("rejects a step count below one", () => {
    expect(() => planScroll({ scrollHeight: 4000, viewportHeight: 720, steps: 0 })).toThrow(/steps/)
  })
})
