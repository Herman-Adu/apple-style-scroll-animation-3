import type { AdminLockRight } from "./actions"

export type LockToggle = { email: string; canLock: boolean }

/** Optimistic reducer for the lock-rights switch. Owner and env-seeded rows aren't editable in the UI. */
export function applyLockToggle(rows: AdminLockRight[], toggle: LockToggle): AdminLockRight[] {
  return rows.map((row) => {
    if (row.email !== toggle.email || row.isOwner || row.source === "env") return row
    return { ...row, canLock: toggle.canLock, source: toggle.canLock ? "granted" : null }
  })
}
