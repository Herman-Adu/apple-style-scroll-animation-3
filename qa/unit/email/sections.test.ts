import { describe, expect, it } from "vitest"
import {
  SECTION_MAX_BLOCKS,
  SECTION_NAME_MAX,
  instantiateSection,
  pickSectionBlocks,
  validateSectionInput,
} from "@/features/email/lib/content/sections"
import type { EmailBlock } from "@/features/email/lib/blocks/types"

const blocks = [
  { id: "a", type: "heading", text: "Hi" },
  { id: "b", type: "text", text: "Body" },
  { id: "c", type: "button", label: "Go", href: "{{shop_url}}" },
] as EmailBlock[]

describe("pickSectionBlocks", () => {
  it("keeps template order regardless of selection order", () => {
    const picked = pickSectionBlocks(blocks, ["c", "a"])
    expect(picked.map((b) => b.type)).toEqual(["heading", "button"])
  })

  it("strips ids so saved sections never collide with template blocks", () => {
    const picked = pickSectionBlocks(blocks, ["a"])
    expect("id" in picked[0]).toBe(false)
  })

  it("ignores unknown ids", () => {
    expect(pickSectionBlocks(blocks, ["zzz"])).toEqual([])
  })
})

describe("instantiateSection", () => {
  it("gives every block a fresh id", () => {
    let n = 0
    const out = instantiateSection(pickSectionBlocks(blocks, ["a", "b"]), () => `new-${n++}`)
    expect(out.map((b) => b.id)).toEqual(["new-0", "new-1"])
    expect(out[1]).toMatchObject({ type: "text", text: "Body" })
  })

  it("produces independent copies on each insert", () => {
    const saved = pickSectionBlocks(blocks, ["a"])
    const first = instantiateSection(saved, () => "x")
    ;(first[0] as unknown as { text: string }).text = "changed"
    expect((saved[0] as unknown as { text: string }).text).toBe("Hi")
  })
})

describe("validateSectionInput", () => {
  const one = pickSectionBlocks(blocks, ["a"])

  it("accepts a trimmed name and returns it", () => {
    expect(validateSectionInput({ name: "  Brand header  ", blocks: one })).toEqual({
      ok: true,
      name: "Brand header",
    })
  })

  it("rejects an empty name", () => {
    expect(validateSectionInput({ name: "   ", blocks: one }).ok).toBe(false)
  })

  it("rejects an over-long name", () => {
    expect(validateSectionInput({ name: "x".repeat(SECTION_NAME_MAX + 1), blocks: one }).ok).toBe(false)
  })

  it("rejects no blocks and too many blocks", () => {
    expect(validateSectionInput({ name: "A", blocks: [] }).ok).toBe(false)
    const many = Array.from({ length: SECTION_MAX_BLOCKS + 1 }, () => one[0])
    expect(validateSectionInput({ name: "A", blocks: many }).ok).toBe(false)
  })

  it("rejects blocks with an unknown type", () => {
    const bad = [{ type: "script", text: "x" }] as unknown as typeof one
    expect(validateSectionInput({ name: "A", blocks: bad }).ok).toBe(false)
  })
})
