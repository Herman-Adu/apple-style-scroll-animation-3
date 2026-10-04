import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "../domain/config"

/**
 * Persistence for lock rights. Callers decide whether a change is allowed
 * (lib/auth/permissions); this module only reads and writes rows. Grants and
 * revokes write their audit row in the same transaction, so the log can't drift
 * from the locker list.
 */

export type PermissionAuditEntry = {
  id: number
  action: string
  permission: string
  subjectEmail: string
  actorEmail: string
  createdAt: Date
}

export async function listGrantedLockerEmails(): Promise<string[]> {
  const rows = await prisma.blockLocker.findMany({ select: { email: true }, orderBy: { email: "asc" } })
  return rows.map((row) => row.email)
}

export async function listAdminEmails(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { email: true, role: true, roleOverride: true } })
  return users.filter((user) => effectiveRole(user) === "admin").map((user) => user.email.trim().toLowerCase())
}

export async function listPermissionAudit(limit = 50): Promise<PermissionAuditEntry[]> {
  return prisma.permissionAudit.findMany({ orderBy: { createdAt: "desc" }, take: limit })
}

export async function grantLockRights(email: string, actorEmail: string): Promise<void> {
  await prisma.$transaction([
    prisma.blockLocker.create({ data: { email, grantedBy: actorEmail } }),
    prisma.permissionAudit.create({ data: { action: "grant", subjectEmail: email, actorEmail } }),
  ])
}

export async function revokeLockRights(email: string, actorEmail: string): Promise<void> {
  await prisma.$transaction([
    prisma.blockLocker.delete({ where: { email } }),
    prisma.permissionAudit.create({ data: { action: "revoke", subjectEmail: email, actorEmail } }),
  ])
}
