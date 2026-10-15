/**
 * A fingerprint of what the renderer read, so a published file can be held to
 * its source the way `export-manifest` holds it to the facts.
 *
 * The facts half of the guard only sees a file that draws a number, and 64 of
 * the 73 exports draw none. `shared/offer.png` is one of them: S61 (#216)
 * rewrote its third column from "Handover / Written handover guide" to "Yours
 * to run / Source escrow if I stop trading" - that sprint's entire point being
 * that "handover" was the wrong promise - and the slide was never re-exported,
 * so the committed PNG, the buyer carousel and the business-case brief all
 * showed the retired wording for three sprints.
 *
 * ## Why a hash of the definition and not of the file
 *
 * Only a deterministic function of the repo may gate a committed artefact.
 * Hashing the *rendered* PNG would gate it on a run: S64 measured that all nine
 * PDFs change on every export (Chromium writes a creation date and a document
 * id) and the two mermaid slides re-lay out, and its coverage guard went red on
 * CI for the same class of reason - Node 24 read 41.91/31.69 from the tree this
 * machine read 41.88/31.62 from. The slide definition is plain data in
 * `features/showcase/lib/domain/`, so its hash is the same on every machine.
 *
 * What that buys and what it does not: the definitions reach outside the slice
 * - the four structure slides are derived from `mainNav`, `adminNav` and the
 * docs taxonomy - so a navigation change dates those slides here without
 * anything being registered. A change to the slide *components* or to a
 * screenshot a slide embeds is not covered, because neither is part of the
 * definition. Those are a re-export to be judged by eye, not a merge gate.
 */

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        // An optional slide field left undefined renders exactly as an absent
        // one, so it must not change the hash.
        .filter(([, entry]) => entry !== undefined)
        // Code-unit order, never `localeCompare`: a locale-aware sort would
        // make the hash depend on the machine that wrote it.
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonical(entry)]),
    )
  }
  return value
}

/**
 * The slide definition as one stable string.
 *
 * Key order is normalised because it is not rendered - re-ordering the fields
 * of a slide must not demand a re-export of every file that pages it. Array
 * order is kept, because page order is rendered and the shell prints the page
 * number.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonical(value))
}

// Written through the constructor rather than as `0x...n` literals: this repo
// compiles with `target: "ES6"`, which has no BigInt literal syntax.
const FNV_OFFSET = BigInt("0xcbf29ce484222325")
const FNV_PRIME = BigInt("0x100000001b3")
const SIXTY_FOUR_BITS = BigInt("0xffffffffffffffff")

/**
 * FNV-1a over the canonical form, as sixteen hex characters.
 *
 * Deliberately not `node:crypto`: this module is reachable from
 * `features/showcase/index.ts`, which is the slice's client-safe surface, and a
 * `node:` import there would reach a browser bundle. A 64-bit hash is not
 * cryptography and is not meant to be - nothing here defends against a crafted
 * collision, only against an edit nobody re-exported, and two different slide
 * definitions landing on the same value by accident is one chance in 1.8e19.
 */
export function contentHash(value: unknown): string {
  const text = canonicalJson(value)
  let hash = FNV_OFFSET
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index)
    // Two bytes per code unit, low first, so a non-ASCII character cannot hash
    // as the ASCII character in its low byte.
    hash = ((hash ^ BigInt(unit & 0xff)) * FNV_PRIME) & SIXTY_FOUR_BITS
    hash = ((hash ^ BigInt(unit >> 8)) * FNV_PRIME) & SIXTY_FOUR_BITS
  }
  return hash.toString(16).padStart(16, "0")
}
