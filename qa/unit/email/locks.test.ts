import { describe, expect, it } from "vitest"
import type { EmailBlock } from "@/features/email/lib/domain/blocks/types"
import {
  canReorder,
  insertBlocks,
  insertionIndex,
  isLocked,
  lockViolations,
  removeIfUnlocked,
  reorder,
  setLocked,
  updateIfUnlocked,
} from "@/features/email/lib/domain/content/locks"

const header = (locked = true): EmailBlock => ({ id: "header", type: "heading", text: "Brand", align: "center", locked })
const body = (id: string): EmailBlock => ({ id, type: "text", text: id, align: "left" })
const footer = (locked = true): EmailBlock => ({ id: "footer", type: "text", text: "Footer", align: "center", locked })

const ids = (blocks: EmailBlock[]) => blocks.map((b) => b.id)

describe("isLocked / setLocked", () => {
  it("treats a missing flag as unlocked", () => {
    expect(isLocked(body("a"))).toBe(false)
    expect(isLocked(header())).toBe(true)
  })

  it("locks and unlocks a single block without touching others", () => {
    const blocks = [body("a"), body("b")]
    const locked = setLocked(blocks, "a", true)
    expect(isLocked(locked[0])).toBe(true)
    expect(isLocked(locked[1])).toBe(false)
    expect(isLocked(setLocked(locked, "a", false)[0])).toBe(false)
    expect(blocks[0].locked).toBeUndefined()
  })
})

describe("updateIfUnlocked", () => {
  it("applies the patch to unlocked blocks", () => {
    const next = updateIfUnlocked([body("a")], "a", { text: "changed" })
    expect((next[0] as Extract<EmailBlock, { type: "text" }>).text).toBe("changed")
  })

  it("ignores edits to locked blocks and returns the same array", () => {
    const blocks = [header()]
    expect(updateIfUnlocked(blocks, "header", { text: "hacked" })).toBe(blocks)
  })

  it("never lets a patch change the lock flag", () => {
    const next = updateIfUnlocked([body("a")], "a", { locked: true })
    expect(isLocked(next[0])).toBe(false)
  })
})

describe("removeIfUnlocked", () => {
  it("removes unlocked blocks and keeps locked ones", () => {
    const blocks = [header(), body("a")]
    expect(ids(removeIfUnlocked(blocks, "a"))).toEqual(["header"])
    expect(removeIfUnlocked(blocks, "header")).toBe(blocks)
  })
})

describe("reorder", () => {
  const blocks = [header(), body("a"), body("b"), body("c"), footer()]

  it("moves unlocked blocks between locked ones", () => {
    expect(canReorder(blocks, 1, 3)).toBe(true)
    expect(ids(reorder(blocks, 1, 3))).toEqual(["header", "b", "c", "a", "footer"])
  })

  it("refuses to move a locked block", () => {
    expect(canReorder(blocks, 0, 2)).toBe(false)
    expect(reorder(blocks, 4, 1)).toBe(blocks)
  })

  it("refuses moves that would push a locked block out of place", () => {
    expect(canReorder(blocks, 1, 0)).toBe(false)
    expect(canReorder(blocks, 3, 4)).toBe(false)
  })

  it("rejects out-of-range and no-op moves", () => {
    expect(canReorder(blocks, 1, 1)).toBe(false)
    expect(canReorder(blocks, -1, 2)).toBe(false)
    expect(canReorder(blocks, 2, 9)).toBe(false)
  })
})

describe("insertion point", () => {
  it("appends at the end when nothing trailing is locked", () => {
    expect(insertionIndex([header(), body("a")])).toBe(2)
    expect(insertionIndex([])).toBe(0)
  })

  it("inserts above a locked footer", () => {
    const blocks = [header(), body("a"), footer()]
    expect(insertionIndex(blocks)).toBe(2)
    expect(ids(insertBlocks(blocks, [body("new")]))).toEqual(["header", "a", "new", "footer"])
  })

  it("inserts above a run of several locked trailing blocks", () => {
    const legal: EmailBlock = { id: "legal", type: "text", text: "Legal", align: "center", locked: true }
    expect(insertionIndex([body("a"), footer(), legal])).toBe(1)
  })

  it("appends when every block is locked rather than going above the header", () => {
    expect(insertionIndex([header(), footer()])).toBe(2)
  })
})

describe("lockViolations (server check for admins who can't lock)", () => {
  const before = [header(), body("a"), footer()]

  it("allows changes to unlocked blocks and inserting above the footer", () => {
    const after = [header(), { ...body("a"), text: "changed" }, body("new"), footer()]
    expect(lockViolations(before, after)).toEqual([])
  })

  it("ignores JSON key order on locked blocks (Postgres jsonb reorders keys)", () => {
    const reordered = { locked: true, align: "center", text: "Brand", type: "heading", id: "header" } as EmailBlock
    expect(lockViolations(before, [reordered, body("a"), footer()])).toEqual([])
  })

  it("flags an edited locked block", () => {
    const after = [{ ...header(), text: "Hacked" } as EmailBlock, body("a"), footer()]
    expect(lockViolations(before, after)).toEqual([{ id: "header", reason: "edited" }])
  })

  it("flags a removed locked block", () => {
    expect(lockViolations(before, [header(), body("a")])).toEqual([{ id: "footer", reason: "removed" }])
  })

  it("flags unlocking", () => {
    expect(lockViolations(before, [header(false), body("a"), footer()])).toEqual([{ id: "header", reason: "unlocked" }])
  })

  it("flags locking an existing or a new block", () => {
    const after = [header(), { ...body("a"), locked: true } as EmailBlock, footer(), { ...body("z"), locked: true } as EmailBlock]
    expect(lockViolations(before, after)).toEqual([
      { id: "a", reason: "locked" },
      { id: "z", reason: "locked" },
    ])
  })
})
