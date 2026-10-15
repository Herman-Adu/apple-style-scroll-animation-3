import { describe, expect, it } from "vitest"
import { canonicalJson, contentHash } from "@/features/showcase/lib/domain/slide-source"

/**
 * The fingerprint half of the export guard.
 *
 * `export-freshness` compares the facts a published file drew, so a slide that
 * draws no fact is invisible to it. `shared/offer.png` draws none: S61 (#216)
 * rewrote its third column from "Handover / Written handover guide" to "Yours
 * to run / Source escrow if I stop trading" - that sprint's whole point being
 * that "handover" was the wrong promise - and the PNG was not re-exported for
 * three sprints, so the image, the buyer carousel and the business-case brief
 * all kept showing the retired wording.
 *
 * A hash of the slide definition catches that. These are the rules it has to
 * follow to be usable as a merge gate: the same source must always give the
 * same hash, on any machine, and a different source must give a different one.
 */
describe("the canonical form of a slide definition", () => {
  it("is insensitive to the order the keys were typed in, because that is not rendered", () => {
    expect(canonicalJson({ title: "A", eyebrow: "B" })).toEqual(canonicalJson({ eyebrow: "B", title: "A" }))
    expect(contentHash({ title: "A", eyebrow: "B" })).toEqual(contentHash({ eyebrow: "B", title: "A" }))
  })

  it("sorts by code unit, not by locale, so two machines agree", () => {
    expect(canonicalJson({ Z: 1, a: 2 })).toBe('{"Z":1,"a":2}')
  })

  it("treats a key set to undefined as absent, the way an optional slide field renders", () => {
    expect(contentHash({ id: "x", role: undefined })).toEqual(contentHash({ id: "x" }))
  })

  it("keeps array order, because page order is rendered", () => {
    expect(contentHash([{ id: "a" }, { id: "b" }])).not.toEqual(contentHash([{ id: "b" }, { id: "a" }]))
  })

  it("changes when a word deep inside a column changes", () => {
    const handover = { columns: [{ heading: "Handover", items: ["Written handover guide"] }] }
    const yoursToRun = { columns: [{ heading: "Yours to run", items: ["Written handover guide"] }] }
    expect(contentHash(handover)).not.toEqual(contentHash(yoursToRun))
  })

  it("tells a fact reference apart from the words beside it", () => {
    expect(contentHash({ value: { fact: "tests.unit" } })).not.toEqual(contentHash({ value: "tests.unit" }))
  })
})

describe("the hash itself", () => {
  it("is sixteen lowercase hex characters, so a manifest record stays readable", () => {
    expect(contentHash({ id: "infographic-offer" })).toMatch(/^[0-9a-f]{16}$/)
  })

  it("is the same every time it is asked", () => {
    const slide = { id: "infographic-offer", columns: [{ heading: "Yours to run" }] }
    expect(contentHash(slide)).toBe(contentHash(slide))
  })

  /**
   * Pinned on purpose. Every hash in `public/showcase/export-manifest.json` was
   * written by this function, so changing the algorithm invalidates all of them
   * - and would do it silently, by making every file look stale at once. This
   * fails first, in the layer that cannot deadlock the export, and says so.
   */
  it("is pinned, because the committed manifest is full of its output", () => {
    expect(contentHash({ a: 1 })).toBe("4d11c27d39f25a19")
    expect(contentHash("Handover")).toBe("eced24d4a11fb6c8")
  })
})
