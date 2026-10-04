import { describe, expect, it, vi } from "vitest"
import { renderBlocks, renderEmail, renderText } from "@/features/email/lib/domain/blocks/render"
import { DEFAULT_BRANDING, type EmailBlock } from "@/features/email/lib/domain/blocks/types"
import { SYSTEM_TEMPLATES } from "@/features/email/lib/domain/blocks/system-templates"

const blocks: EmailBlock[] = [
  { id: "h1", type: "heading", text: "Hello {{customer_name}}", align: "center" },
  { id: "t1", type: "text", text: "Line one\nLine two", align: "left" },
  { id: "b1", type: "button", label: "Shop <now>", href: "https://example.com/{{slug}}", align: "center" },
]

describe("renderEmail", () => {
  const html = renderEmail(blocks, DEFAULT_BRANDING, { vars: { customer_name: "Ada", slug: "x1" } })

  it("produces a full HTML document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true)
    expect(html).toContain("</html>")
  })

  it("opts out of dark-mode colour inversion", () => {
    expect(html).toContain('<meta name="color-scheme" content="light" />')
    expect(html).toContain('<meta name="supported-color-schemes" content="light" />')
  })

  it("fills tokens from vars", () => {
    expect(html).toContain("Hello Ada")
    expect(html).toContain("https://example.com/x1")
    expect(html).not.toContain("{{customer_name}}")
  })

  it("escapes HTML in user-authored copy", () => {
    expect(html).toContain("Shop &lt;now&gt;")
    expect(html).not.toContain("Shop <now>")
  })

  it("always applies the brand header and footer", () => {
    expect(html).toContain(DEFAULT_BRANDING.brandName)
    expect(html).toContain("All rights reserved")
  })
})

describe("renderBlocks", () => {
  it("drops unknown tokens instead of leaking braces", () => {
    const out = renderBlocks([{ id: "h", type: "heading", text: "Hi {{missing}}" }] as EmailBlock[], DEFAULT_BRANDING)
    expect(out).not.toContain("{{")
  })

  it("converts newlines in text blocks to <br />", () => {
    expect(renderBlocks([blocks[1]], DEFAULT_BRANDING)).toContain("Line one<br />Line two")
  })
})

describe("renderText", () => {
  it("produces a plain-text fallback with tokens filled", () => {
    const text = renderText(blocks, DEFAULT_BRANDING, { vars: { customer_name: "Ada" } })
    expect(text).toContain("Hello Ada")
    expect(text).toContain("Line one\nLine two")
    expect(text).not.toMatch(/<(br|td|tr|p|a|div|table)\b/)
  })
})

describe("system templates", () => {
  it.each(SYSTEM_TEMPLATES.map((t) => [t.key, t] as const))("%s renders without throwing", (_key, t) => {
    expect(() => renderEmail(t.blocks, DEFAULT_BRANDING)).not.toThrow()
  })

  it("have unique keys and unique block ids", () => {
    const keys = SYSTEM_TEMPLATES.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
    const ids = SYSTEM_TEMPLATES.flatMap((t) => t.blocks.map((b) => b.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("derive block ids from template key, position and type", () => {
    for (const t of SYSTEM_TEMPLATES) {
      expect(t.blocks.map((b) => b.id)).toEqual(t.blocks.map((b, i) => `${t.key}-${i}-${b.type}`))
    }
  })

  it("produce identical ids when the module is loaded again", async () => {
    vi.resetModules()
    const fresh = await import("@/features/email/lib/domain/blocks/system-templates")
    expect(fresh.SYSTEM_TEMPLATES.map((t) => t.blocks.map((b) => b.id))).toEqual(
      SYSTEM_TEMPLATES.map((t) => t.blocks.map((b) => b.id)),
    )
  })
})
