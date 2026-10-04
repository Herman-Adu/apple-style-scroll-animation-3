import { describe, expect, it } from "vitest"
import {
  VERSION_KEEP,
  pickOriginalVersion,
  summarizeChange,
  versionIdsToPrune,
  type TemplateContent,
} from "@/features/email/lib/domain/content/versions"
import type { EmailBlock } from "@/features/email/lib/domain/blocks/types"

const content = (over: Partial<TemplateContent> = {}): TemplateContent => ({
  name: "Promo",
  category: "marketing",
  subject: "Hello",
  previewText: "Preview",
  description: "",
  blocks: [{ id: "a", type: "heading", text: "Hi" }] as EmailBlock[],
  ...over,
})

describe("pickOriginalVersion", () => {
  it("returns the lowest version number", () => {
    const v = pickOriginalVersion([
      { id: 3, version: 5 },
      { id: 1, version: 1 },
      { id: 2, version: 3 },
    ])
    expect(v?.id).toBe(1)
  })

  it("returns null when there is no history", () => {
    expect(pickOriginalVersion([])).toBeNull()
  })
})

describe("versionIdsToPrune", () => {
  it("keeps the original and the newest VERSION_KEEP - 1 versions", () => {
    const versions = Array.from({ length: VERSION_KEEP + 5 }, (_, i) => ({ id: i + 1, version: i + 1 }))
    const pruned = versionIdsToPrune(versions)
    expect(pruned).toHaveLength(5)
    expect(pruned).not.toContain(1)
    expect(pruned).toEqual([2, 3, 4, 5, 6])
  })

  it("prunes nothing under the limit", () => {
    expect(versionIdsToPrune([{ id: 1, version: 1 }, { id: 2, version: 2 }])).toEqual([])
  })
})

describe("summarizeChange", () => {
  it("reports no changes for identical content", () => {
    expect(summarizeChange(content(), content())).toEqual([])
  })

  it("names changed fields", () => {
    expect(summarizeChange(content(), content({ subject: "Bye", name: "Sale" }))).toEqual(["name", "subject line"])
  })

  it("counts added, removed and edited blocks", () => {
    const before = content({
      blocks: [
        { id: "a", type: "heading", text: "Hi" },
        { id: "b", type: "divider" },
      ] as EmailBlock[],
    })
    const after = content({
      blocks: [
        { id: "a", type: "heading", text: "Hello" },
        { id: "c", type: "spacer", size: 24 },
        { id: "d", type: "divider" },
      ] as EmailBlock[],
    })
    expect(summarizeChange(before, after)).toEqual(["2 sections added", "1 section removed", "1 section edited"])
  })

  it("reports a reorder when the same blocks move", () => {
    const blocks = [
      { id: "a", type: "divider" },
      { id: "b", type: "divider" },
    ] as EmailBlock[]
    expect(summarizeChange(content({ blocks }), content({ blocks: [blocks[1], blocks[0]] }))).toEqual([
      "sections reordered",
    ])
  })
})
