import type { PermissionAuditEntry } from "@/lib/auth/data/lock-rights-repo"

export type LockRightSource = "owner" | "granted" | "env" | null
export type AdminLockRight = { email: string; isOwner: boolean; canLock: boolean; source: LockRightSource }
export type LockPermissionsView = { admins: AdminLockRight[]; audit: PermissionAuditEntry[] }
export type GrantResult = { ok: true } | { ok: false; error: string }
