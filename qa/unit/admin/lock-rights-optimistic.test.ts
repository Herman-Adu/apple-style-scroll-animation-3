import { describe, expect, it } from "vitest"
import { applyLockToggle } from "@/features/admin/permissions/lib/optimistic"
import type { AdminLockRight } from "@/features/admin/permissions/actions"

/**
 * The permissions switch updates optimistically with useOptimistic. The pure
 * reducer flips one admin's lock right; the owner row and env-seeded rows are
 * never touched by the UI.
 */
const rows: AdminLockRight[] = [
  { email: "herman@adudev.co.uk", isOwner: true, canLock: true, source: "owner" },
  { email: "content@adudev.co.uk", isOwner: false, canLock: false, source: null },
  { email: "designer@adudev.co.uk", isOwner: false, canLock: true, source: "granted" },
  { email: "ops@adudev.co.uk", isOwner: false, canLock: true, source: "env" },
]

describe("applyLockToggle", () => {
  it("grants an admin", () => {
    const next = applyLockToggle(rows, { email: "content@adudev.co.uk", canLock: true })
    expect(next[1]).toEqual({ email: "content@adudev.co.uk", isOwner: false, canLock: true, source: "granted" })
  })

  it("revokes a granted admin", () => {
    const next = applyLockToggle(rows, { email: "designer@adudev.co.uk", canLock: false })
    expect(next[2]).toMatchObject({ canLock: false, source: null })
  })

  it("never changes the owner or env-seeded rows", () => {
    expect(applyLockToggle(rows, { email: "herman@adudev.co.uk", canLock: false })).toEqual(rows)
    expect(applyLockToggle(rows, { email: "ops@adudev.co.uk", canLock: false })).toEqual(rows)
  })

  it("does not mutate the input", () => {
    const copy = structuredClone(rows)
    applyLockToggle(rows, { email: "content@adudev.co.uk", canLock: true })
    expect(rows).toEqual(copy)
  })
})
