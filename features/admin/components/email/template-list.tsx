"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Copy, FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { EmailBlock } from "@/features/email/blocks/types"
import { createTemplateAction, deleteTemplateAction } from "@/features/email/admin-actions"
import { SYSTEM_TEMPLATES } from "@/features/email/blocks/system-templates"

export type TemplateListItem = {
  id: number
  key: string
  name: string
  category: string
  subject: string
  description: string
  blocks: EmailBlock[]
  isSystem: boolean
  updatedAt: string | Date
}

const CATEGORY_STYLES: Record<string, string> = {
  transactional: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  marketing: "border-accent-teal/30 bg-accent-teal/10 text-accent-teal",
  system: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function TemplateList({ templates }: { templates: TemplateListItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [creatingKind, setCreatingKind] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<TemplateListItem | null>(null)

  function createBlank() {
    setCreatingKind("blank")
    startTransition(async () => {
      const welcome = SYSTEM_TEMPLATES.find((t) => t.key === "welcome")!
      const res = await createTemplateAction({
        name: "Untitled template",
        category: "marketing",
        subject: "",
        previewText: "",
        description: "",
        blocks: welcome.blocks,
      })
      setCreatingKind(null)
      if (res.ok) router.push(`/admin/email/templates/${res.id}`)
      else toast.error("Could not create template")
    })
  }

  function duplicate(tpl: TemplateListItem) {
    setCreatingKind(`dup-${tpl.id}`)
    startTransition(async () => {
      const res = await createTemplateAction({
        name: `${tpl.name} (copy)`,
        category: tpl.category === "system" ? "marketing" : tpl.category,
        subject: tpl.subject,
        previewText: "",
        description: tpl.description,
        blocks: tpl.blocks,
      })
      setCreatingKind(null)
      if (res.ok) router.push(`/admin/email/templates/${res.id}`)
      else toast.error("Could not duplicate template")
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const id = toDelete.id
    setToDelete(null)
    startTransition(async () => {
      const res = await deleteTemplateAction(id)
      if (res.ok) {
        toast.success("Template deleted")
        router.refresh()
      } else toast.error("Could not delete template")
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Templates</h2>
          <p className="text-sm text-muted-foreground">
            Branded, block-based emails. Edit system templates or create your own for campaigns.
          </p>
        </div>
        <Button onClick={createBlank} disabled={pending} className="gap-2">
          {creatingKind === "blank" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New template
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent-teal/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                <FileText className="size-5" aria-hidden />
              </div>
              <Badge
                variant="outline"
                className={cn("capitalize", CATEGORY_STYLES[tpl.category] ?? "")}
              >
                {tpl.category}
              </Badge>
            </div>

            <Link href={`/admin/email/templates/${tpl.id}`} className="mt-4 block">
              <h3 className="font-semibold tracking-tight group-hover:text-accent-teal">{tpl.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {tpl.description || tpl.subject || "No description"}
              </p>
            </Link>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {tpl.isSystem ? "System" : "Custom"} · {formatDate(tpl.updatedAt)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => duplicate(tpl)}
                  disabled={pending}
                  aria-label={`Duplicate ${tpl.name}`}
                >
                  {creatingKind === `dup-${tpl.id}` ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                {!tpl.isSystem && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setToDelete(tpl)}
                    disabled={pending}
                    aria-label={`Delete ${tpl.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? `"${toDelete.name}" will be permanently removed. This cannot be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
