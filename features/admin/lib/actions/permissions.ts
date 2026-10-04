"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/server"
import { isOwner } from "@/lib/auth/domain/config"
import {
  AuthorizationError,
  blockLockerEmails,
  canManagePermissions,
  validateGrant,
  type GrantAction,
} from "@/lib/auth/domain/permissions"
import {
  grantLockRights,
  listAdminEmails,
  listGrantedLockerEmails,
  listPermissionAudit,
  revokeLockRights,
} from "@/lib/auth/data/lock-rights-repo"
import type { GrantResult, LockPermissionsView, LockRightSource } from "../domain/permissions/types"

const PERMISSIONS_PATH = "/admin/settings/permissions"

async function requireOwner() {
  const session = await requireAdmin()
  if (!canManagePermissions(session)) throw new AuthorizationError("Only the owner can manage permissions")
  return session
}

export async function getLockPermissionsAction(): Promise<LockPermissionsView> {
  await requireOwner()
  const [admins, granted, audit] = await Promise.all([listAdminEmails(), listGrantedLockerEmails(), listPermissionAudit()])
  const fromEnv = blockLockerEmails()
  const sourceOf = (email: string): LockRightSource =>
    isOwner(email) ? "owner" : granted.includes(email) ? "granted" : fromEnv.includes(email) ? "env" : null

  const rows = [...new Set(admins)].map((email) => {
    const source = sourceOf(email)
    return { email, isOwner: source === "owner", canLock: source !== null, source }
  })
  rows.sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.email.localeCompare(b.email))
  return { admins: rows, audit }
}

async function changeLockRights(action: GrantAction, subjectEmail: string): Promise<GrantResult> {
  const session = await requireOwner()
  const [admins, lockers] = await Promise.all([listAdminEmails(), listGrantedLockerEmails()])
  const check = validateGrant({ action, subjectEmail, admins, lockers })
  if (!check.ok) return check
  if (action === "grant") await grantLockRights(check.email, session.email)
  else await revokeLockRights(check.email, session.email)
  revalidatePath(PERMISSIONS_PATH)
  return { ok: true }
}

export async function grantLockRightsAction(email: string): Promise<GrantResult> {
  return changeLockRights("grant", email)
}

export async function revokeLockRightsAction(email: string): Promise<GrantResult> {
  return changeLockRights("revoke", email)
}
