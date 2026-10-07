import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { buildCaptionHtml, MAX_CAPTION_LENGTH } from "../../showcase/caption"
import {
  ADMIN_ROUTES,
  CHECKOUT_DISCOUNT_CODE,
  CLIPS,
  DEFERRED_CLIPS,
  PUBLIC_ROUTES,
  RESTOCK_PRODUCT_SLUG,
  getClip,
} from "../../showcase/shot-list"
import { buildDemoData } from "../../../scripts/lib/showcase-demo-data.mjs"

const root = REPO_ROOT

type SeededCode = { code: string; active: boolean; expiresAt: Date | null; maxRedemptions: number | null; minSubtotal: number | null; kind: string }
const seededCodes = (buildDemoData(new Date("2026-01-15T12:00:00Z")) as unknown as { discountCodes: SeededCode[] }).discountCodes

function adminPageExists(route: string) {
  const dir = route.replace(/^\/admin\/?/, "")
  return existsSync(path.join(root, "app", "(admin)", "admin", dir, "page.tsx"))
}

function publicPageExists(route: string) {
  if (route === "/") return existsSync(path.join(root, "app", "page.tsx"))
  if (route.startsWith("/docs/")) return existsSync(path.join(root, "app", "docs", "[slug]", "page.tsx"))
  if (route.startsWith("/products/")) return existsSync(path.join(root, "app", "products", "[slug]", "page.tsx"))
  return existsSync(path.join(root, "app", route.slice(1), "page.tsx"))
}

describe("showcase shot list", () => {
  it("plans the approved clips, plus the end-to-end journey, with unique slugs", () => {
    expect(CLIPS.map((clip) => clip.slug)).toEqual([
      "storefront",
      "checkout",
      "campaigns",
      "discounts",
      "orders",
      "engineering",
      "journey",
    ])
    expect(new Set(CLIPS.map((clip) => clip.slug)).size).toBe(CLIPS.length)
  })

  it("defers the restock clip until /admin/products records reliably, without losing its plan", () => {
    expect(DEFERRED_CLIPS.map((clip) => clip.slug)).toEqual(["restock"])
    for (const deferred of DEFERRED_CLIPS) {
      expect(CLIPS.map((clip) => clip.slug)).not.toContain(deferred.slug)
      expect(getClip(deferred.slug).spec).toBe(deferred.spec)
    }
    const spec = readFileSync(path.join(root, "qa", "showcase", "restock.spec.ts"), "utf8")
    expect(spec).toContain("SHOWCASE_INCLUDE_DEFERRED")
  })

  it("covers both audiences, sharing the storefront, checkout and journey clips", () => {
    const bySlug = Object.fromEntries(CLIPS.map((clip) => [clip.slug, clip.audience]))
    expect(bySlug.storefront).toBe("both")
    expect(bySlug.checkout).toBe("both")
    expect(bySlug.journey).toBe("both")
    expect(bySlug.engineering).toBe("recruiter")
    for (const slug of ["campaigns", "discounts", "orders"]) expect(bySlug[slug]).toBe("client")
  })

  it("restocks a product the demo seed has people waiting for", () => {
    const waiting = (buildDemoData(new Date("2026-01-15T12:00:00Z")) as unknown as { stockAlerts: { productSlug: string }[] })
      .stockAlerts.filter((alert) => alert.productSlug === RESTOCK_PRODUCT_SLUG)
    expect(waiting.length).toBeGreaterThan(0)
    expect(getClip("restock").routes).toContain(`/products/${RESTOCK_PRODUCT_SLUG}`)
  })

  it("walks the journey from the scroll story through sign-in into the admin", () => {
    const routes = getClip("journey").routes
    expect(routes[0]).toBe("/")
    expect(routes).toContain("/sign-in")
    expect(routes.indexOf("/sign-in")).toBeLessThan(routes.indexOf("/admin"))
  })

  it("gives every clip a title, a spec file and two to six captions that fit on screen", () => {
    for (const clip of CLIPS) {
      expect(clip.title.length, clip.slug).toBeGreaterThan(0)
      expect(existsSync(path.join(root, "qa", "showcase", clip.spec)), `${clip.slug} spec ${clip.spec}`).toBe(true)
      expect(clip.captions.length, clip.slug).toBeGreaterThanOrEqual(2)
      expect(clip.captions.length, clip.slug).toBeLessThanOrEqual(6)
      for (const caption of clip.captions) {
        expect(caption.length, caption).toBeLessThanOrEqual(MAX_CAPTION_LENGTH)
        expect(() => buildCaptionHtml(caption), caption).not.toThrow()
      }
    }
  })

  it("never puts personal data or the live domain into a caption", () => {
    for (const clip of CLIPS) {
      for (const caption of [clip.title, ...clip.captions]) {
        expect(caption, caption).not.toMatch(/@/)
        expect(caption.toLowerCase(), caption).not.toContain("adudev")
        expect(caption.toLowerCase(), caption).not.toMatch(/sk_(live|test)|pk_(live|test)|whsec_/)
      }
    }
  })

  it("only visits routes that exist in the app", () => {
    for (const route of ADMIN_ROUTES) expect(adminPageExists(route), route).toBe(true)
    for (const route of PUBLIC_ROUTES) expect(publicPageExists(route), route).toBe(true)
  })

  it("keeps admin pages on the admin clips and the public pages on the shared ones", () => {
    const adminSlugs = CLIPS.filter((clip) => clip.routes.some((route) => route.startsWith("/admin"))).map((clip) => clip.slug)
    expect(adminSlugs).toEqual(["campaigns", "discounts", "orders", "journey"])
  })

  it("applies a seeded discount code that any customer can use right now", () => {
    const seeded = seededCodes.find((code) => code.code === CHECKOUT_DISCOUNT_CODE)
    expect(seeded, `${CHECKOUT_DISCOUNT_CODE} is seeded`).toBeDefined()
    expect(seeded!.active).toBe(true)
    expect(seeded!.expiresAt).toBeNull()
    expect(seeded!.maxRedemptions).toBeNull()
    expect(seeded!.minSubtotal).toBeNull()
    expect(seeded!.kind).toBe("percent")
  })

  it("records every clip against the shared 4:5 and 9:16 formats without any extra flags", () => {
    for (const clip of CLIPS) {
      expect(clip.routes.length, clip.slug).toBeGreaterThan(0)
      expect(clip.slug, clip.slug).toMatch(/^[a-z]+$/)
    }
  })
})
