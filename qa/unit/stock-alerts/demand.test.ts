import { describe, expect, it } from "vitest"
import { sortByWaiting, topWaiting, totalWaiting, waitingFor } from "@/features/stock-alerts/lib/domain/demand"

/**
 * Demand is "how many people are waiting for each product". These pure rules
 * feed the product manager column and the dashboard card, so they are pinned
 * here and the UI only renders their output.
 */
const counts = { "momo-x": 12, "momo-s": 3, "momo-pro": 7, "momo-mini": 1, "momo-old": 0 }

describe("totalWaiting", () => {
  it("adds every product's waiting count", () => {
    expect(totalWaiting(counts)).toBe(23)
  })

  it("is zero when nobody is waiting", () => {
    expect(totalWaiting({})).toBe(0)
  })
})

describe("waitingFor", () => {
  it("reads one product's count and treats a missing product as zero", () => {
    expect(waitingFor(counts, "momo-x")).toBe(12)
    expect(waitingFor(counts, "never-requested")).toBe(0)
  })
})

describe("topWaiting", () => {
  it("returns the three most-wanted products, biggest first", () => {
    expect(topWaiting(counts)).toEqual([
      { slug: "momo-x", count: 12 },
      { slug: "momo-pro", count: 7 },
      { slug: "momo-s", count: 3 },
    ])
  })

  it("leaves out products nobody is waiting for", () => {
    expect(topWaiting({ a: 0, b: 2 })).toEqual([{ slug: "b", count: 2 }])
  })

  it("breaks ties by slug so the order is stable", () => {
    expect(topWaiting({ b: 5, a: 5 })).toEqual([
      { slug: "a", count: 5 },
      { slug: "b", count: 5 },
    ])
  })

  it("honours a custom limit", () => {
    expect(topWaiting(counts, 1)).toEqual([{ slug: "momo-x", count: 12 }])
  })

  it("does not mutate the counts it was given", () => {
    const input = { ...counts }
    topWaiting(input)
    expect(input).toEqual(counts)
  })
})

describe("sortByWaiting", () => {
  const items = [{ slug: "momo-s" }, { slug: "momo-x" }, { slug: "momo-mini" }, { slug: "momo-pro" }]

  it("sorts most-waiting first when descending", () => {
    expect(sortByWaiting(items, counts, "desc").map((i) => i.slug)).toEqual(["momo-x", "momo-pro", "momo-s", "momo-mini"])
  })

  it("sorts least-waiting first when ascending", () => {
    expect(sortByWaiting(items, counts, "asc").map((i) => i.slug)).toEqual(["momo-mini", "momo-s", "momo-pro", "momo-x"])
  })

  it("keeps the original order for ties and returns a new array", () => {
    const tied = [{ slug: "b" }, { slug: "a" }]
    const sorted = sortByWaiting(tied, {}, "desc")
    expect(sorted.map((i) => i.slug)).toEqual(["b", "a"])
    expect(sorted).not.toBe(tied)
  })
})
