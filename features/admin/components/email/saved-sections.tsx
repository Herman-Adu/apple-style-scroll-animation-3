"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { BookmarkPlus, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createSavedSectionAction,
  deleteSavedSectionAction,
  listSavedSectionsAction,
} from "@/features/email/admin-actions"
import {
  SECTION_MAX_BLOCKS,
  SECTION_NAME_MAX,
  pickSectionBlocks,
  type SectionBlock,
} from "@/features/email/sections"
import type { BlockType, EmailBlock } from "@/features/email/blocks/types"

const SECTIONS_KEY = "email-saved-sections"

export function SavedSections({
  blocks,
  labelFor,
  onInsert,
}: {
  blocks: EmailBlock[]
  labelFor: (type: BlockType) => string
  onInsert: (blocks: SectionBlock[], name: string) => void
}) {
  const { data, isLoading, mutate } = useSWR(SECTIONS_KEY, () => listSavedSectionsAction())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const sections = data ?? []

  function remove(id: number, name: string) {
    if (!window.confirm(`Delete the saved section "${name}"? Templates that already use it are not affected.`)) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteSavedSectionAction(id)
      await mutate()
      setDeletingId(null)
      toast.success("Saved section deleted")
    })
  }

  return (
    <div>
      <div className="mb-3 mt-6 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Saved sections</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => setDialogOpen(true)}
          disabled={blocks.length === 0}
        >
          <BookmarkPlus className="size-3.5" aria-hidden />
          Save blocks
        </Button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Your own reusable groups of blocks, shared across every template.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading saved sections
        </div>
      ) : sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          {"Nothing saved yet. Use \u201cSave blocks\u201d to keep a header, hero or footer you want to reuse."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sections.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.blocks.map((b) => labelFor(b.type)).join(" \u00b7 ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => onInsert(s.blocks, s.name)}
              >
                <Plus className="size-3.5" aria-hidden />
                Insert
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => remove(s.id, s.name)}
                disabled={deletingId === s.id}
                aria-label={`Delete saved section ${s.name}`}
              >
                {deletingId === s.id ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-3.5" aria-hidden />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SaveSectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        blocks={blocks}
        labelFor={labelFor}
        onSaved={() => mutate()}
      />
    </div>
  )
}

function SaveSectionDialog({
  open,
  onOpenChange,
  blocks,
  labelFor,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  blocks: EmailBlock[]
  labelFor: (type: BlockType) => string
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  function handleOpenChange(next: boolean) {
    if (next) {
      setName("")
      setSelected([])
      setError(null)
    }
    onOpenChange(next)
  }

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  function save() {
    setError(null)
    startSaving(async () => {
      const res = await createSavedSectionAction({ name, blocks: pickSectionBlocks(blocks, selected) })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onSaved()
      onOpenChange(false)
      toast.success("Section saved", { description: "Find it under Saved sections in any template." })
    })
  }

  const overLimit = selected.length > SECTION_MAX_BLOCKS

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save blocks as a section</DialogTitle>
          <DialogDescription>
            Tick the blocks to reuse. They are saved in the order they appear in this template.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="section-name">Section name</Label>
            <Input
              id="section-name"
              value={name}
              maxLength={SECTION_NAME_MAX}
              placeholder="e.g. Brand header"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-foreground">
              Blocks <span className="font-normal text-muted-foreground">({selected.length} selected)</span>
            </legend>
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
              {blocks.map((b, i) => {
                const id = `pick-${b.id}`
                return (
                  <li key={b.id}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        id={id}
                        checked={selected.includes(b.id)}
                        onCheckedChange={(c) => toggle(b.id, c === true)}
                      />
                      <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="text-foreground">{labelFor(b.type)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>

          {(error || overLimit) && (
            <p role="alert" className="text-sm text-destructive">
              {overLimit ? `A saved section can hold up to ${SECTION_MAX_BLOCKS} blocks` : error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || selected.length === 0 || !name.trim() || overLimit}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Save section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
