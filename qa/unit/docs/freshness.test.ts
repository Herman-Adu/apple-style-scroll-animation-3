import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { docs } from "@/features/docs/content"
import { docImages, docText, internalDocLinks, missingMentions } from "@/features/docs/lib/freshness"
import { PALETTE_BLOCKS } from "@/features/email/lib/blocks/labels"
import { STARTERS } from "@/features/email/lib/content/starters"

const emailDocs = docs.filter((d) => d.slug.startsWith("email-"))
const emailDocsText = emailDocs.map(docText).join("\n")

describe("docs freshness helpers", () => {
  const sample = {
    ...docs[0],
    body: [
      { type: "paragraph" as const, text: "See /docs/whats-new and [live URL]/docs/platform-glossary." },
      { type: "paragraph" as const, text: "Source lives in features/docs/api, not a link." },
      { type: "table" as const, headers: ["A"], rows: [["Black Friday"]] },
      { type: "steps" as const, items: [{ title: "Lock", text: "Locked blocks" }] },
      { type: "image" as const, src: "/docs/showcase/email-christmas.png", alt: "x" },
    ],
  }

  it("flattens every text-bearing block", () => {
    const text = docText(sample)
    expect(text).toContain("Black Friday")
    expect(text).toContain("Locked blocks")
  })

  it("extracts internal doc links but not image paths", () => {
    expect(internalDocLinks(sample)).toEqual(["whats-new", "platform-glossary"])
  })

  it("lists image sources", () => {
    expect(docImages(sample)).toEqual(["/docs/showcase/email-christmas.png"])
  })

  it("reports terms the text does not mention, case-insensitively", () => {
    expect(missingMentions("Product picks and black friday", ["Product picks", "Black Friday", "Christmas"])).toEqual([
      "Christmas",
    ])
  })
})

describe("docs registry integrity", () => {
  it("has unique slugs", () => {
    const slugs = docs.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("uses ISO dates for updatedAt", () => {
    for (const doc of docs) expect(doc.updatedAt, doc.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("only links to docs that exist", () => {
    const slugs = new Set(docs.map((d) => d.slug))
    const broken = docs.flatMap((d) => internalDocLinks(d).filter((s) => !slugs.has(s)).map((s) => `${d.slug} -> ${s}`))
    expect(broken).toEqual([])
  })

  it("only references images that exist in public/", () => {
    const missing = docs.flatMap((d) =>
      docImages(d)
        .filter((src) => src.startsWith("/") && !existsSync(join(process.cwd(), "public", src)))
        .map((src) => `${d.slug} -> ${src}`),
    )
    expect(missing).toEqual([])
  })
})

describe("email guides keep up with the product", () => {
  it("mention every starter in the gallery", () => {
    expect(missingMentions(emailDocsText, STARTERS.map((s) => s.name))).toEqual([])
  })

  it("mention every block in the editor palette", () => {
    expect(missingMentions(emailDocsText, PALETTE_BLOCKS.map((b) => b.label))).toEqual([])
  })
})
