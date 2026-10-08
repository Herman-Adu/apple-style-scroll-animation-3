import { describe, expect, it } from "vitest"
import { SHOWCASE_FORMATS } from "../../../scripts/lib/showcase-formats.mjs"
import { products } from "@/features/products"
import {
  FRAME_SEQUENCE_MS,
  READING_PIXELS_PER_STEP,
  STEP_PAUSE_MS,
  planPacedScroll,
} from "../../showcase/scroll-plan"

const allDeltas = (segments: { deltas: number[] }[]) => segments.flatMap((segment) => segment.deltas)
const total = (deltas: number[]) => deltas.reduce((sum, delta) => sum + delta, 0)
const pixelsPerSecond = (READING_PIXELS_PER_STEP / STEP_PAUSE_MS) * 1000

describe("planPacedScroll", () => {
  it("scrolls exactly to the bottom of the page, footer included", () => {
    const segments = planPacedScroll({ scrollHeight: 6000, viewportHeight: 720, scrollY: 0 })
    expect(total(allDeltas(segments))).toBe(6000 - 720)
  })

  it("carries on from where the scroll already is", () => {
    const segments = planPacedScroll({ scrollHeight: 6000, viewportHeight: 720, scrollY: 2000 })
    expect(total(allDeltas(segments))).toBe(6000 - 720 - 2000)
  })

  it("uses whole, positive deltas", () => {
    const deltas = allDeltas(planPacedScroll({ scrollHeight: 4321, viewportHeight: 720, scrollY: 0 }))
    expect(deltas.length).toBeGreaterThan(0)
    for (const delta of deltas) {
      expect(Number.isInteger(delta)).toBe(true)
      expect(delta).toBeGreaterThan(0)
    }
  })

  it("eases in and out: the first and last steps are smaller than the middle", () => {
    const deltas = allDeltas(planPacedScroll({ scrollHeight: 8000, viewportHeight: 720, scrollY: 0 }))
    const middle = deltas[Math.floor(deltas.length / 2)]
    expect(deltas[0]).toBeLessThan(middle)
    expect(deltas[deltas.length - 1]).toBeLessThan(middle)
  })

  it("returns no steps when the page already fits in the viewport", () => {
    expect(planPacedScroll({ scrollHeight: 700, viewportHeight: 720, scrollY: 0 })).toEqual([])
  })

  it("holds one pace, so a longer page takes longer instead of scrolling faster", () => {
    const short = allDeltas(planPacedScroll({ scrollHeight: 4720, viewportHeight: 720, scrollY: 0 }))
    const long = allDeltas(planPacedScroll({ scrollHeight: 8720, viewportHeight: 720, scrollY: 0 }))
    expect(short.length).toBe(4000 / READING_PIXELS_PER_STEP)
    expect(long.length).toBe(8000 / READING_PIXELS_PER_STEP)
    expect(Math.max(...long)).toBeLessThanOrEqual(Math.max(...short) + 1)
  })

  it("reads a page at a steady, watchable speed", () => {
    expect(pixelsPerSecond).toBeGreaterThan(500)
    expect(pixelsPerSecond).toBeLessThan(800)
  })

  it("scrolls a short page and a long one at the same speed", () => {
    const perStep = (scrollHeight: number) => {
      const deltas = allDeltas(planPacedScroll({ scrollHeight, viewportHeight: 960, scrollY: 0 }))
      return total(deltas) / deltas.length
    }
    // The About timeline is about a thousand pixels; the page around it is four times that.
    expect(Math.abs(perStep(1960) - perStep(5960))).toBeLessThan(1)
  })

  it("gives a frame sequence the same time on camera however tall it is", () => {
    const pace = { viewportHeight: 720, scrollY: 0 }
    const tall = planPacedScroll({ ...pace, scrollHeight: 12_000, frameSequences: [{ start: 0, end: 8000 }] })
    const shorter = planPacedScroll({ ...pace, scrollHeight: 8000, frameSequences: [{ start: 0, end: 4000 }] })
    const steps = (segments: { frameSequence: boolean; deltas: number[] }[]) =>
      segments.filter((segment) => segment.frameSequence).flatMap((segment) => segment.deltas).length

    expect(steps(tall)).toBe(FRAME_SEQUENCE_MS / STEP_PAUSE_MS)
    expect(steps(shorter)).toBe(steps(tall))
  })

  it("splits the page into the sections before, inside and after a frame sequence", () => {
    const segments = planPacedScroll({
      scrollHeight: 10_000,
      viewportHeight: 1000,
      scrollY: 0,
      frameSequences: [{ start: 2000, end: 6000 }],
    })
    expect(segments.map((segment) => segment.frameSequence)).toEqual([false, true, false])
    expect(total(segments[0].deltas)).toBe(2000)
    expect(total(segments[1].deltas)).toBe(4000)
    expect(total(segments[2].deltas)).toBe(10_000 - 1000 - 6000)
  })

  it("ignores a frame sequence the scroll has already passed", () => {
    const segments = planPacedScroll({
      scrollHeight: 10_000,
      viewportHeight: 1000,
      scrollY: 7000,
      frameSequences: [{ start: 0, end: 6000 }],
    })
    expect(segments.map((segment) => segment.frameSequence)).toEqual([false])
    expect(total(allDeltas(segments))).toBe(10_000 - 1000 - 7000)
  })

  it("merges overlapping frame sequences into one paced section", () => {
    const segments = planPacedScroll({
      scrollHeight: 10_000,
      viewportHeight: 1000,
      scrollY: 0,
      frameSequences: [
        { start: 1000, end: 4000 },
        { start: 3000, end: 5000 },
      ],
    })
    expect(segments.map((segment) => segment.frameSequence)).toEqual([false, true, false])
    expect(total(segments[1].deltas)).toBe(4000)
  })

  it("clips a frame sequence to the part of the page that is still scrollable", () => {
    const segments = planPacedScroll({
      scrollHeight: 5000,
      viewportHeight: 1000,
      scrollY: 0,
      frameSequences: [{ start: 0, end: 9000 }],
    })
    expect(segments.map((segment) => segment.frameSequence)).toEqual([true])
    expect(total(allDeltas(segments))).toBe(4000)
  })

  it("rejects a pace or a step pause below one", () => {
    const page = { scrollHeight: 4000, viewportHeight: 720, scrollY: 0 }
    expect(() => planPacedScroll({ ...page, pixelsPerStep: 0 })).toThrow(/pixel per step/i)
    expect(() => planPacedScroll({ ...page, stepPauseMs: 0 })).toThrow(/step pause/i)
  })
})

describe("the recorded homepage hero", () => {
  const hero = products.find((product) => product.hero.kind === "frames")?.hero
  const frameCount = hero && hero.kind === "frames" ? hero.frameCount : 0

  it("is a frame sequence measured in whole frames", () => {
    expect(frameCount).toBeGreaterThan(100)
  })

  it.each(Object.entries(SHOWCASE_FORMATS))(
    "renders every canvas frame at the %s recording size",
    (_format, size) => {
      // The hero is `scrollVh` tall in viewport units, so its pixel height — and
      // the scroll distance one frame is worth — changes with every format.
      const heroHeight = ((hero?.scrollVh ?? 0) / 100) * size.height
      const scrubbedDistance = heroHeight - size.height
      const framePitch = scrubbedDistance / (frameCount - 1)

      const segments = planPacedScroll({
        scrollHeight: heroHeight + 4000,
        viewportHeight: size.height,
        scrollY: 0,
        frameSequences: [{ start: 0, end: scrubbedDistance }],
      })
      const scrubbed = segments.find((segment) => segment.frameSequence)
      expect(scrubbed, "a frame-sequence segment").toBeDefined()
      expect(scrubbed!.deltas.length).toBeGreaterThanOrEqual(frameCount)
      expect(Math.max(...scrubbed!.deltas)).toBeLessThanOrEqual(framePitch)
    },
  )

  it("spends twelve seconds on the hero, then reads the rest of the homepage at the page pace", () => {
    const heroHeight = ((hero?.scrollVh ?? 0) / 100) * 1600
    const segments = planPacedScroll({
      scrollHeight: 11_800,
      viewportHeight: 1600,
      scrollY: 0,
      frameSequences: [{ start: 0, end: heroHeight - 1600 }],
    })
    const seconds = (frameSequence: boolean) =>
      (segments
        .filter((segment) => segment.frameSequence === frameSequence)
        .flatMap((segment) => segment.deltas).length *
        STEP_PAUSE_MS) /
      1000

    expect(seconds(true)).toBe(12)
    // 11,800px of page, less a 1,600px viewport and the 6,400px the hero scrubs over.
    expect(seconds(false)).toBeCloseTo(3800 / pixelsPerSecond, 1)
  })
})
