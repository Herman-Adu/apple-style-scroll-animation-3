import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * Slides are AduDev's, not the store's.
 *
 * A carousel is AduDev showing its work; the store it was built for is the
 * subject, not the brand. `accent-teal` is Momo Audio's accent and belongs on
 * the storefront, in screenshots and in recordings — never on a slide. Three
 * carousels shipped with teal arrows, teal bars and a "Momo Audio" header
 * because the infographic slides never picked up the brand shell the pack
 * slides use, and nothing failed when they didn't.
 */
const components = path.join(REPO_ROOT, "features", "showcase", "components")

const slideSources = readdirSync(components)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => ({ file, text: readFileSync(path.join(components, file), "utf8") }))

describe("showcase slides use the AduDev palette", () => {
  it("finds the slide components", () => {
    expect(slideSources.length).toBeGreaterThan(3)
  })

  it("never reaches for the store's accent colour", () => {
    const offenders = slideSources
      .filter(({ text }) => /accent-teal/.test(text))
      .map(({ file }) => file)
    expect(offenders, "these render the store accent on an AduDev slide").toEqual([])
  })

  it("never hard-codes a hex colour instead of using a brand token", () => {
    // Brand values live in domain/brand.ts so a fork can rebrand in one place.
    const offenders = slideSources
      .flatMap(({ file, text }) => (text.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => `${file} ${hex}`))
    expect(offenders).toEqual([])
  })
})
