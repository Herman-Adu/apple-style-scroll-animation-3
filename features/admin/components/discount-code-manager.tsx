"use client"

import { use, useMemo, useState } from "react"
import { Pencil, PlusCircle, Search, Ticket, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useAdminDiscountCodes } from "@/features/admin/hooks/use-admin-discount-codes"
import type { DiscountCode, DiscountCodeInput } from "@/lib/discount-codes/types"
import { DiscountCodeFormDialog } from "./discount-code-form-dialog"

function benefitLabel(code: DiscountCode): string {
  return code.kind === "percent" ? `${code.value ?? 0}% off` : "Free shipping"
}

function isExpired(code: DiscountCode): boolean {
  return Boolean(code.expiresAt && new Date(code.expiresAt).getTime() <= Date.now())
}

function isExhausted(code: DiscountCode): boolean {
  return code.maxRedemptions != null && code.redemptionCount >= code.maxRedemptions
}

export function DiscountCodeManager({ codesPromise }: { codesPromise: Promise<DiscountCode[]> }) {
  const { codes, createCode, updateCode, deleteCode } = useAdminDiscountCodes(use(codesPromise))
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCode | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<DiscountCode | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return codes
    return codes.filter((c) => [c.code, c.label].some((f) => f.toLowerCase().includes(q)))
  }, [codes, query])

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(code: DiscountCode) {
    setEditing(code)
    setFormOpen(true)
  }

  async function toggleActive(code: DiscountCode) {
    try {
      await updateCode(code.id, { active: !code.active })
      toast.success(code.active ? `Deactivated ${code.code}` : `Activated ${code.code}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the code.")
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteCode(pendingDelete.id)
      toast.success(`Deleted ${pendingDelete.code}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the code.")
    } finally {
      setPendingDelete(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search codes"
            className="pl-9"
            aria-label="Search discount codes"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="size-4" aria-hidden />
          New code
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Benefit</th>
                <th className="px-4 py-3 font-medium">Redemptions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No discount codes yet.
                  </td>
                </tr>
              ) : (
                filtered.map((code) => {
                  const expired = isExpired(code)
                  const exhausted = isExhausted(code)
                  const inactive = !code.active || expired || exhausted
                  return (
                    <tr key={code.id} className="transition-colors hover:bg-accent-teal/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
                            <Ticket className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-mono font-medium tracking-wider">{code.code}</p>
                            <p className="truncate text-xs text-muted-foreground">{code.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{benefitLabel(code)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {code.redemptionCount}
                        {code.maxRedemptions != null ? ` / ${code.maxRedemptions}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            inactive
                              ? "border-border bg-foreground/5 text-muted-foreground"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                          )}
                        >
                          {expired ? "Expired" : exhausted ? "Fully redeemed" : code.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={code.active}
                            onCheckedChange={() => toggleActive(code)}
                            aria-label={code.active ? `Deactivate ${code.code}` : `Activate ${code.code}`}
                          />
                          <button
                            type="button"
                            onClick={() => openEdit(code)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent-teal/10 hover:text-accent-teal"
                            aria-label={`Edit ${code.code}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(code)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${code.code}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DiscountCodeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        discountCode={editing}
        onCreate={async (input: DiscountCodeInput) => {
          const created = await createCode(input)
          toast.success(`Created ${created.code}`)
        }}
        onUpdate={async (id, input: DiscountCodeInput) => {
          await updateCode(id, input)
          toast.success("Code updated")
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers will no longer be able to use this code at checkout. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
