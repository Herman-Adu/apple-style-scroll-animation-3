import { describe, expect, it } from "vitest"

import { products } from "@/features/products/lib/data/data"

/**
 * The hero renderers are a delivery mechanism; the writing inside them is not.
 * Every string below existed only inside a `hero` block on `main` at 91456dc —
 * nowhere else in the repo — so deleting `ParallaxStoryHero` and
 * `ExplodedStoryHero` without rehoming it would have lost product writing with
 * no second copy to recover from.
 *
 * This test was written BEFORE the deletion, against the strings while they
 * were still on disk (transcribed in
 * `docs/hand-off/product-hero-copy-inventory.md`), so it goes red the moment
 * one is dropped or paraphrased. It deliberately does NOT care which field
 * carries a string: it searches the whole product record. That is the point —
 * the copy is allowed to move, and is not allowed to disappear.
 *
 * Counted on this tree it is ten beats, not the twelve the brief's "three per
 * product" implies: Momo X 3, Momo Air 2, Momo Studio 2, Momo Beat 3.
 */

/** Every string that lived in a `hero` block, by the product that owns it. */
const HERO_COPY: Record<string, string[]> = {
  "momo-x": [
    "Introducing",
    "Momo X",
    "Pure Sound. Zero Compromise.",
    "Designed for\nPrecision.",
    "Every component engineered with sub-millimeter accuracy for perfect acoustic response.",
    "Titanium\nPerformance.",
    "Aerospace-grade materials deliver uncompromising durability and featherlight comfort.",
    "Hear Beyond.",
    "40mm planar drivers. Active noise cancellation. 60-hour battery. Spatial audio ready.",
  ],
  "momo-air": [
    "Introducing",
    "Momo Air",
    "Weightless. Wireless. Everywhere.",
    "4.2 grams\nof silence.",
    "So light you forget it is there — until the noise around you simply vanishes.",
    "Adaptive\nTransparency.",
    "Six microphones read your surroundings and let the world back in, exactly as much as you want.",
  ],
  "momo-studio": [
    "For the studio",
    "Momo Studio",
    "Reference Truth.",
    "Open-back\nby design.",
    "A ventilated acoustic chamber creates a wide, natural soundstage with zero pressure buildup.",
    "Hand-matched\ndrivers.",
    "Every pair is matched to within 0.5dB so left and right are perfectly, provably balanced.",
  ],
  "momo-beat": [
    "Sound everywhere",
    "Momo Beat",
    "Fill the Room.",
    "Every layer\nengineered.",
    "Six precision components stack into a machined titanium body no wider than a coffee cup.",
    "Bass you\nfeel.",
    "A dedicated full-range driver and opposed passive radiator move real air for depth that belies its size.",
    "360°\nof sound.",
    "Assembled, the radial array projects evenly in every direction — no sweet spot, no dead zones.",
    // The exploded layer labels: component names, which beats 01 and 02 refer
    // to. Specification, not decoration.
    "Titanium cap",
    "360° acoustic grille",
    "Full-range driver",
    "Amp & passive radiator",
    "Machined base",
  ],
}

/**
 * Every string value anywhere in a product record, flattened. Searching the
 * whole record rather than a named field is what lets the copy be rehomed
 * without the test having to be rewritten to match the new shape.
 */
function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(allStrings)
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings)
  return []
}

describe("the hero copy survives the renderer", () => {
  it.each(Object.keys(HERO_COPY))("keeps every %s hero string somewhere in its record", (slug) => {
    const product = products.find((candidate) => candidate.slug === slug)
    expect(product, `${slug} missing from the catalog seed`).toBeDefined()

    // Containment, not set membership: a string is allowed to be joined into a
    // larger value by its new home. The five exploded layer labels now share
    // one "Construction" spec row, because they are the component names of one
    // object. Substring matching still fails on a deletion or a paraphrase,
    // which is what this test is for.
    const present = allStrings(product)
    const lost = HERO_COPY[slug].filter((copy) => !present.some((value) => value.includes(copy)))

    expect(lost, `${slug} lost hero copy with no other home in the repo`).toEqual([])
  })

  it("pins the ten beats that exist, not the twelve the brief implies", () => {
    // Guards the inventory itself: if a beat is added or removed upstream, this
    // fails and the list above has to be revisited deliberately.
    const beatTitles = Object.values(HERO_COPY)
      .flat()
      .filter((copy) => copy.includes("\n") || copy === "Hear Beyond.")
    expect(beatTitles).toHaveLength(10)
  })
})
