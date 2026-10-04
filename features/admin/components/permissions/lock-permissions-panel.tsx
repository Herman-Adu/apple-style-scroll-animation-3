"use client"

import { useOptimistic, useTransition } from "react"
import { History, Lock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { grantLockRightsAction, revokeLockRightsAction } from "../../lib/actions/permissions"
import type { AdminLockRight } from "../../lib/domain/permissions/types"
import { applyLockToggle } from "../../lib/domain/permissions/optimistic"

export type AuditRow = { id: number; action: string; subjectEmail: string; actorEmail: string; when: string }

const sourceLabel: Record<NonNullable<AdminLockRight["source"]>, string> = {
  owner: "Owner",
  granted: "Granted",
  env: "Env seed",
}

export function LockPermissionsPanel({ admins, audit }: { admins: AdminLockRight[]; audit: AuditRow[] }) {
  const [optimisticAdmins, applyOptimistic] = useOptimistic(admins, applyLockToggle)
  const [isPending, startTransition] = useTransition()

  function toggle(email: string, canLock: boolean) {
    startTransition(async () => {
      applyOptimistic({ email, canLock })
      const result = canLock ? await grantLockRightsAction(email) : await revokeLockRightsAction(email)
      if (result.ok) toast.success(canLock ? `Lock rights granted to ${email}` : `Lock rights revoked from ${email}`)
      else toast.error(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="lockers-heading" className="rounded-2xl border border-border bg-card p-6">
        <PanelHeader
          id="lockers-heading"
          icon={Lock}
          title="Email block lock rights"
          description="Admins with lock rights can lock and unlock blocks in email templates. The owner always has them."
        />
        <ul className="mt-5 flex flex-col divide-y divide-border" aria-busy={isPending}>
          {optimisticAdmins.map((row) => {
            const editable = !row.isOwner && row.source !== "env"
            const switchId = `lock-${row.email}`
            return (
              <li key={row.email} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <label htmlFor={switchId} className="truncate text-sm font-medium text-foreground">
                    {row.email}
                  </label>
                  <div className="flex items-center gap-2">
                    {row.source ? (
                      <Badge variant="outline" className="border-accent-teal/30 text-accent-teal">
                        {sourceLabel[row.source]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No lock rights</span>
                    )}
                    {row.source === "env" && (
                      <span className="text-xs text-muted-foreground">Set by EMAIL_BLOCK_LOCKERS</span>
                    )}
                  </div>
                </div>
                <Switch
                  id={switchId}
                  checked={row.canLock}
                  disabled={!editable}
                  onCheckedChange={(checked) => toggle(row.email, checked)}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="audit-heading" className="rounded-2xl border border-border bg-card p-6">
        <PanelHeader
          id="audit-heading"
          icon={History}
          title="Audit log"
          description="Every grant and revoke, newest first."
        />
        {audit.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{entry.when}</TableCell>
                    <TableCell className="capitalize">{entry.action}</TableCell>
                    <TableCell>{entry.subjectEmail}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.actorEmail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}

export function PanelHeader({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal/12 text-accent-teal ring-1 ring-accent-teal/25">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <div>
        <h2 id={id} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
    </div>
  )
}
