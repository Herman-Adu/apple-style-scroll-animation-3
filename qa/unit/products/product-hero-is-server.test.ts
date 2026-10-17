import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = join(import.meta.dirname, "../../..")
/**
 * `components/`, not the `ui/` the sprint brief named: `folder-layout.test.ts`
 * allows a slice only `components/`, `hooks/`, `lib/` and `content/`, so a new
 * `ui/` folder would have failed that guard.
 */
const HERO = "features/products/components/product-hero.tsx"
/**
 * S70 made the product page reuse the shared page hero, so the rule below is
 * only kept by *both* files being server components. `product-hero.tsx` is a
 * thin wrapper now; if `page-hero.tsx` carried the directive, every product
 * page would get a client component back and S69's result would be undone
 * through the back door while the guard above stayed green.
 */
const SHARED = "components/layout/page-hero.tsx"

/**
 * The one rule this sprint exists to hold. Three client renderers all carrying
 * framer-motion became one server component; if `product-hero.tsx` ever needs
 * `"use client"`, the design has gone wrong and the sprint's result has been
 * undone. Cheap to assert, so it is asserted rather than remembered.
 *
 * Read from disk rather than imported: a directive is a property of the file,
 * and a bundler has already resolved it away by the time a module is in hand.
 */
describe.each([
  ["the product hero", HERO],
  ["the shared page hero it renders", SHARED],
])("%s", (_name, file) => {
  const source = readFileSync(join(ROOT, file), "utf8")

  it("carries no client directive", () => {
    expect(source).not.toMatch(/^\s*["']use client["']/m)
  })

  it("imports no motion library, which is what would force one", () => {
    // Anchored on the import, not the bare word: the file's own comment
    // explains which library the three deleted renderers each pulled in, and
    // naming it in prose is not the defect this guards against.
    expect(source).not.toMatch(/from\s+["'](?:framer-motion|motion\/react)["']/)
  })

  it("calls no hook, for the same reason", () => {
    expect(source).not.toMatch(/\buse(State|Effect|Ref|Transform|Scroll|ReducedMotion)\s*\(/)
  })
})
