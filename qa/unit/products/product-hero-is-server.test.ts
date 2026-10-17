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
 * The one rule this sprint exists to hold. Three client renderers all carrying
 * framer-motion became one server component; if `product-hero.tsx` ever needs
 * `"use client"`, the design has gone wrong and the sprint's result has been
 * undone. Cheap to assert, so it is asserted rather than remembered.
 *
 * Read from disk rather than imported: a directive is a property of the file,
 * and a bundler has already resolved it away by the time a module is in hand.
 */
describe("the product hero", () => {
  const source = readFileSync(join(ROOT, HERO), "utf8")

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
    expect(source).not.toMatch(/\buse(State|Effect|Ref|Transform|Scroll)\s*\(/)
  })
})
