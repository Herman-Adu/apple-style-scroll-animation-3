"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Copy, FileText, Loader2, Megaphone, Plus, Receipt, Settings, Trash2, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
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
import { CategoryDisclosure } from "@/components/category-disclosure"
import type { EmailBlock } from "@/features/email"
import { createTemplateAction, deleteTemplateAction } from "@/features/email"
import { buildFromExisting, buildFromStarter, type NewTemplateInput } from "@/features/email"
import { NewTemplateDialog } from "./new-template-dialog"

const newBlockId = () => crypto.randomUUID().slice(0, 8)

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

/**
 * Fixed category order and presentation. Matches the CATEGORIES select in the
 * template editor — add a new entry here (and there) when a new category is
 * introduced, e.g. a future "lifecycle" or "digest" bucket as sends scale.
 */
const CATEGORY_META: { key: string; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    key: "system",
    label: "System",
    icon: Settings,
    blurb: "Internal alerts triggered by store events, sent to your team.",
  },
  {
    key: "transactional",
    label: "Transactional",
    icon: Receipt,
    blurb: "Automated emails sent to customers in response to their own actions.",
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    blurb: "Branded sends for campaigns, offers, and newsletters.",
  },
]
const FALLBACK_CATEGORY_META = { label: "Other", icon: FileText, blurb: "Additional templates." }

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function TemplateList({ templates }: { templates: TemplateListItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [creatingKind, setCreatingKind] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<TemplateListItem | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  // Collapsed category keys. Sections start expanded — the library is small
  // enough today that hiding groups by default would cost more clicks than it
  // saves, but it stays collapsible as more templates land per category.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCategory(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const groups = CATEGORY_META.map((meta) => ({
    meta,
    items: templates.filter((tpl) => tpl.category === meta.key),
  })).filter((group) => group.items.length > 0)

  const knownKeys = new Set(CATEGORY_META.map((c) => c.key))
  const otherItems = templates.filter((tpl) => !knownKeys.has(tpl.category))
  if (otherItems.length > 0) {
    groups.push({ meta: { key: "other", ...FALLBACK_CATEGORY_META }, items: otherItems })
  }

  function create(kind: string, input: NewTemplateInput | null, failure: string) {
    if (!input) return
    setCreatingKind(kind)
    startTransition(async () => {
      const res = await createTemplateAction(input)
      setCreatingKind(null)
      if (res.ok) router.push(`/admin/email/templates/${res.id}`)
      else toast.error(failure)
    })
  }

  function createFromStarter(starterId: string) {
    create(`starter-${starterId}`, buildFromStarter(starterId, newBlockId), "Could not create template")
  }

  function copyExisting(id: number) {
    const tpl = templates.find((t) => t.id === id)
    if (tpl) create(`copy-${id}`, buildFromExisting(tpl, newBlockId), "Could not copy template")
  }

  function duplicate(tpl: TemplateListItem) {
    create(`dup-${tpl.id}`, buildFromExisting(tpl, newBlockId), "Could not duplicate template")
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
        <Button onClick={() => setGalleryOpen(true)} disabled={pending} className="gap-2">
          <Plus className="size-4" />
          New template
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const open = !collapsed.has(group.meta.key)
          return (
            <CategoryDisclosure
              key={group.meta.key}
              label={group.meta.label}
              icon={group.meta.icon}
              count={group.items.length}
              itemLabel="template"
              open={open}
              onToggle={() => toggleCategory(group.meta.key)}
            >
              <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{group.meta.blurb}</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent-teal/40"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                      <FileText className="size-5" aria-hidden />
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
            </CategoryDisclosure>
          )
        })}
      </div>

      <NewTemplateDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        existing={templates.map((t) => ({ id: t.id, name: t.name, isSystem: t.isSystem }))}
        pendingKey={creatingKind?.startsWith("dup-") ? null : creatingKind}
        onPickStarter={createFromStarter}
        onPickExisting={copyExisting}
      />

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
