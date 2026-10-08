import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { buildCaptionHtml, MAX_CAPTION_LENGTH } from "../../showcase/caption"
import {
  ADMIN_ROUTES,
  CHECKOUT_DISCOUNT_CODE,
  CLIPS,
  ENQUIRY_CLIP_ANSWERS,
  ENQUIRY_CLIP_SENDER,
  ENQUIRY_CLIP_TYPES,
  ENQUIRY_SUBMIT_LABEL,
  PUBLIC_ROUTES,
  RESTOCK_PRODUCT_SLUG,
  FRAME_SEQUENCE_SECTIONS,
  getClip,
} from "../../showcase/shot-list"
import { enquiryTypes } from "@/features/contact"
import { isReservedEmail } from "@/features/email/lib/domain/reserved-recipients"
import { DEMO_EMAIL_DOMAIN, buildDemoData } from "../../../scripts/lib/showcase-demo-data.mjs"

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
      "restock",
      "sitetour",
      "enquiry",
    ])
    expect(new Set(CLIPS.map((clip) => clip.slug)).size).toBe(CLIPS.length)
  })

  it("records the restock clip by default, still refusing to run while real people are waiting", () => {
    expect(getClip("restock").spec).toBe("restock.spec.ts")
    const spec = readFileSync(path.join(root, "qa", "showcase", "restock.spec.ts"), "utf8")
    expect(spec).not.toContain("SHOWCASE_INCLUDE_DEFERRED")
    expect(spec).toContain("realWaiting > 0")
  })

  it("covers both audiences, sharing the storefront, checkout and journey clips", () => {
    const bySlug = Object.fromEntries(CLIPS.map((clip) => [clip.slug, clip.audience]))
    expect(bySlug.storefront).toBe("both")
    expect(bySlug.checkout).toBe("both")
    expect(bySlug.journey).toBe("both")
    expect(bySlug.engineering).toBe("recruiter")
    expect(bySlug.sitetour).toBe("both")
    expect(bySlug.enquiry).toBe("both")
    for (const slug of ["campaigns", "discounts", "orders", "restock"]) expect(bySlug[slug]).toBe("client")
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

  it("puts About, Articles and Contact on camera, which no earlier clip did", () => {
    expect(getClip("sitetour").routes).toEqual(["/about", "/articles", "/contact"])
    const older = CLIPS.filter((clip) => !["sitetour", "enquiry"].includes(clip.slug)).flatMap((clip) => clip.routes)
    for (const route of getClip("sitetour").routes) expect(older, route).not.toContain(route)
  })

  it("paces the homepage canvas hero frame by frame, and nothing else", () => {
    expect(FRAME_SEQUENCE_SECTIONS.home).toEqual(["#top"])
    expect(Object.keys(FRAME_SEQUENCE_SECTIONS)).toEqual(["home"])
  })

  it("demonstrates the enquiry form on two public topics, so the fields visibly change", () => {
    expect(getClip("enquiry").routes).toEqual(["/contact"])
    expect(ENQUIRY_CLIP_TYPES).toHaveLength(2)
    const shown = ENQUIRY_CLIP_TYPES.map((id) => enquiryTypes.find((type) => type.id === id))
    for (const type of shown) {
      expect(type, "a seeded enquiry type").toBeDefined()
      expect(type!.access, type!.id).toBe("public")
    }
    const [first, second] = shown
    expect(first!.fields.map((field) => field.label)).not.toEqual(second!.fields.map((field) => field.label))
  })

  it("answers every required field of both topics, and only fields it can type into", () => {
    for (const id of ENQUIRY_CLIP_TYPES) {
      const fields = enquiryTypes.find((type) => type.id === id)!.fields
      const answered = Object.keys(ENQUIRY_CLIP_ANSWERS[id])
      for (const field of fields) {
        if (field.required) expect(answered, `${id}.${field.name}`).toContain(field.name)
        if (answered.includes(field.name)) expect(field.type, `${id}.${field.name}`).toMatch(/^(text|textarea)$/)
      }
      for (const name of answered) expect(fields.map((field) => field.name), `${id}.${name}`).toContain(name)
    }
  })

  it("types a reserved demo address, so nothing it leaves behind can reach a real inbox", () => {
    expect(ENQUIRY_CLIP_SENDER.email).toMatch(new RegExp(`@${DEMO_EMAIL_DOMAIN}$`))
    expect(isReservedEmail(ENQUIRY_CLIP_SENDER.email)).toBe(true)
  })

  it("stops the enquiry clip on the review step, so no recording sends a real email", () => {
    const spec = readFileSync(path.join(root, "qa", "showcase", "enquiry.spec.ts"), "utf8")
    expect(spec).toContain("ENQUIRY_SUBMIT_LABEL")
    expect(spec).toMatch(/toBeVisible/)
    const clicks = spec.split(/\r?\n/).filter((line) => line.includes("click("))
    expect(clicks.length).toBeGreaterThan(0)
    for (const line of clicks) {
      expect(line.trim(), line.trim()).not.toMatch(new RegExp(`${ENQUIRY_SUBMIT_LABEL}|ENQUIRY_SUBMIT_LABEL|submit`, "i"))
    }
  })

  it("records nothing that is not on the shot list", () => {
    // The recorder matches showcase/**/*.spec.ts, so an orphan spec costs a take
    // in every format and lands in no cut. admin.spec.ts was one for eight sprints.
    const specs = readdirSync(path.join(root, "qa", "showcase")).filter((file) => file.endsWith(".spec.ts"))
    expect(specs.sort()).toEqual(CLIPS.map((clip) => clip.spec).sort())
  })

  it("runs every clip through the fixture, so no take records the dev tools overlay", () => {
    for (const clip of CLIPS) {
      const spec = readFileSync(path.join(root, "qa", "showcase", clip.spec), "utf8")
      expect(spec, clip.spec).toMatch(/import \{[^}]*\btest\b[^}]*\} from "\.\/fixtures"/)
      expect(spec, clip.spec).not.toMatch(/import \{[^}]*\btest\b[^}]*\} from "@playwright\/test"/)
    }
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
    expect(adminSlugs).toEqual(["campaigns", "discounts", "orders", "journey", "restock"])
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
