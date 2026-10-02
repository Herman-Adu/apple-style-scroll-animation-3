import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { AdminShell } from "@/features/admin"
import { getLockPermissionsAction } from "@/features/admin"
import { LockPermissionsPanel, PanelHeader } from "@/features/admin"
import { canManagePermissions } from "@/lib/auth/permissions"
import { getServerCanLockBlocks, getServerSession } from "@/lib/auth/server"

export const metadata: Metadata = { title: "Permissions", robots: { index: false } }

const formatWhen = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
})

export default async function PermissionsPage() {
  const session = await getServerSession()

  if (!canManagePermissions(session)) {
    const canLock = await getServerCanLockBlocks()
    return (
      <AdminShell title="Permissions">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6">
          <PanelHeader
            id="permissions-readonly"
            icon={ShieldCheck}
            title="Managed by the owner"
            description={`Only the owner can grant or revoke permissions. You ${canLock ? "have" : "don't have"} email block lock rights.`}
          />
        </div>
      </AdminShell>
    )
  }

  const { admins, audit } = await getLockPermissionsAction()
  const auditRows = audit.map((entry) => ({
    id: entry.id,
    action: entry.action,
    subjectEmail: entry.subjectEmail,
    actorEmail: entry.actorEmail,
    when: formatWhen.format(entry.createdAt),
  }))

  return (
    <AdminShell title="Permissions">
      <div className="mx-auto max-w-3xl">
        <LockPermissionsPanel admins={admins} audit={auditRows} />
      </div>
    </AdminShell>
  )
}
