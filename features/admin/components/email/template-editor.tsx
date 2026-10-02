"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Eraser,
  GripVertical,
  Lock,
  LockOpen,
  Redo2,
  Undo2,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Minus,
  MousePointerClick,
  Plus,
  RotateCcw,
  Save,
  Send,
  SeparatorHorizontal,
  Sparkles,
  Trash2,
  Type,
  Heading as HeadingIcon,
  List as ListIcon,
  MessageSquareQuote,
  ShoppingBag,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { VersionHistory } from "./version-history"
import { SavedSections } from "./saved-sections"
import { instantiateSection, type SectionBlock } from "@/features/email/sections"
import {
  canReorder,
  insertBlocks,
  insertionIndex,
  isLocked,
  removeIfUnlocked,
  reorder,
  setLocked,
  updateIfUnlocked,
} from "@/features/email/locks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import type { BlockType, EmailBlock, EmailBranding } from "@/features/email/blocks/types"
import { BLOCK_PRESETS } from "@/features/email/blocks/system-templates"
import { PLACEHOLDERS, placeholderToken } from "@/features/email/placeholders"
import { PlaceholderField } from "./placeholder-picker"
import type { ProductImageMap } from "@/features/products/lib/product"
import type { Money } from "@/features/products/schema"
import {
  createTemplateAction,
  resetTemplateAction,
  restoreTemplateVersionAction,
  saveTemplateAction,
  sendTemplateTestAction,
} from "@/features/email/admin-actions"
import { SUBJECT_SOFT_LIMIT, PREVIEW_SOFT_LIMIT } from "@/features/email/copy-quality"
import { CopyQualityHint } from "./copy-quality-hint"
import { EmailPreviewPane } from "./block-preview"

export type EditorTemplate = {
  id: number
  key: string
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
  isSystem: boolean
  version: number
}

const uid = () => `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

const PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "hero", label: "Hero", icon: Sparkles },
  { type: "heading", label: "Heading", icon: HeadingIcon },
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "list", label: "List", icon: ListIcon },
  { type: "callout", label: "Callout", icon: MessageSquareQuote },
  { type: "orderSummary", label: "Order summary", icon: ShoppingBag },
  { type: "productPicks", label: "Product picks", icon: LayoutGrid },
  { type: "divider", label: "Divider", icon: SeparatorHorizontal },
  { type: "spacer", label: "Spacer", icon: Minus },
]

function makeBlock(type: BlockType): EmailBlock {
  const id = uid()
  switch (type) {
    case "hero":
      return { id, type, eyebrow: "The collection", heading: "A *reference* headline", subheading: "Supporting line that sets the tone.", imageUrl: "/email/hero-momo.png", align: "left" }
    case "heading":
      return { id, type, text: "Section heading", align: "left" }
    case "text":
      return { id, type, text: "Write your message here. Use *asterisks* to highlight words in your accent color.", align: "left" }
    case "button":
      return { id, type, label: "Shop now", href: "{{shop_url}}", align: "left" }
    case "image":
      return { id, type, src: "/email/hero-offer.png", alt: "", href: "" }
    case "list":
      return { id, type, title: "What happens next", items: ["First step", "Second step", "Third step"], ordered: true }
    case "callout":
      return { id, type, title: "Good to know", body: "A highlighted note for the reader.", }
    case "orderSummary":
      return { id, type }
    case "productPicks":
      return { id, type, title: "You might also like", slugs: [] }
    case "divider":
      return { id, type }
    case "spacer":
      return { id, type, size: "md" }
    default:
      return { id, type: "text", text: "", align: "left" } as EmailBlock
  }
}

function blockLabel(type: BlockType): string {
  return PALETTE.find((p) => p.type === type)?.label ?? type
}

const CATEGORIES = ["transactional", "marketing", "system"]

export function TemplateEditor({
  template,
  branding,
  products,
}: {
  template: EditorTemplate
  branding: EmailBranding
  /** Slug -> live name/image lookup powering the product picker and preview. */
  products: ProductImageMap
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)

  const [name, setName] = useState(template.name)
  const [category, setCategory] = useState(template.category)
  const [subject, setSubject] = useState(template.subject)
  const [previewText, setPreviewText] = useState(template.previewText)
  const [description, setDescription] = useState(template.description)
  const [blocks, setBlocks] = useState<EmailBlock[]>(template.blocks)
  const [selectedId, setSelectedId] = useState<string | null>(template.blocks[0]?.id ?? null)
  const [dirty, setDirty] = useState(false)
  const [testTo, setTestTo] = useState("")

  const selected = blocks.find((b) => b.id === selectedId) ?? null

  /** Snapshot of everything a content manager can change, used by undo/redo. */
  type Snapshot = {
    name: string
    category: string
    subject: string
    previewText: string
    description: string
    blocks: EmailBlock[]
  }
  const [history, setHistory] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const HISTORY_LIMIT = 50
  /** Last state persisted to the database; the target for "Discard changes". */
  const [saved, setSaved] = useState<Snapshot>(() => ({
    name: template.name,
    category: template.category,
    subject: template.subject,
    previewText: template.previewText,
    description: template.description,
    blocks: template.blocks,
  }))
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  function snapshot(): Snapshot {
    return { name, category, subject, previewText, description, blocks }
  }

  function restore(s: Snapshot) {
    setName(s.name)
    setCategory(s.category)
    setSubject(s.subject)
    setPreviewText(s.previewText)
    setDescription(s.description)
    setBlocks(s.blocks)
  }

  const mutate = (fn: () => void) => {
    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), snapshot()])
    setFuture([])
    fn()
    setDirty(true)
  }

  function undo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setFuture((f) => [snapshot(), ...f])
    setHistory((h) => h.slice(0, -1))
    restore(prev)
    setDirty(true)
  }

  function redo() {
    if (future.length === 0) return
    const next = future[0]
    setHistory((h) => [...h, snapshot()])
    setFuture((f) => f.slice(1))
    restore(next)
    setDirty(true)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.key.toLowerCase() !== "z") return
      const target = e.target as HTMLElement | null
      const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"
      // Allow native undo inside text fields; only hijack Cmd/Ctrl+Z for the block list elsewhere.
      if (isEditable) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [history, future, name, category, subject, previewText, description, blocks])

  function updateBlock(id: string, patch: Partial<EmailBlock>) {
    mutate(() => setBlocks((prev) => updateIfUnlocked(prev, id, patch)))
  }

  function toggleLock(id: string) {
    const block = blocks.find((b) => b.id === id)
    if (!block) return
    const locked = !isLocked(block)
    mutate(() => setBlocks((prev) => setLocked(prev, id, locked)))
    toast.success(locked ? `${blockLabel(block.type)} locked` : `${blockLabel(block.type)} unlocked`, {
      description: locked ? "It can't be edited, moved or removed until unlocked." : undefined,
    })
  }

  /** New content goes above any locked blocks at the end, so a locked footer stays last. */
  function addBlocks(added: EmailBlock[]) {
    if (added.length === 0) return
    mutate(() => setBlocks((prev) => insertBlocks(prev, added)))
    setSelectedId(added[0].id)
  }

  const insertsAboveLocked = insertionIndex(blocks) < blocks.length

  function addBlock(type: BlockType) {
    addBlocks([makeBlock(type)])
  }

  function addPreset(key: string) {
    const preset = BLOCK_PRESETS.find((p) => p.key === key)
    if (!preset) return
    addBlocks(preset.blocks.map((b) => ({ ...b, id: uid() }) as EmailBlock))
  }

  function insertSavedSection(sectionBlocks: SectionBlock[], sectionName: string) {
    const added = instantiateSection(sectionBlocks, uid).map((b) => ({ ...b, locked: false }) as EmailBlock)
    if (added.length === 0) return
    addBlocks(added)
    toast.success(`Inserted \u201c${sectionName}\u201d`, {
      description: insertsAboveLocked ? "Added above the locked blocks at the end." : "Added to the end of the template.",
    })
  }

  function removeBlock(id: string) {
    if (isLocked(blocks.find((b) => b.id === id))) return
    mutate(() => setBlocks((prev) => removeIfUnlocked(prev, id)))
    if (selectedId === id) setSelectedId(null)
  }

  /** Insert a copy of one section directly after itself, so a content manager
   *  can build e.g. a second callout off an existing one without re-entering
   *  every field by hand. */
  function duplicateBlock(id: string) {
    const copy = ((prev: EmailBlock[]) => {
      const source = prev.find((b) => b.id === id)
      return source && !isLocked(source) ? ({ ...source, id: uid() } as EmailBlock) : null
    })(blocks)
    if (!copy) return
    mutate(() =>
      setBlocks((prev) => {
        const i = prev.findIndex((b) => b.id === id)
        if (i < 0) return prev
        const next = [...prev]
        next.splice(i + 1, 0, copy)
        return next
      }),
    )
    setSelectedId(copy.id)
  }

  function moveBlock(from: number, to: number) {
    if (from < 0 || to < 0) return
    if (!canReorder(blocks, from, to)) {
      toast.info("Locked blocks stay in place", { description: "Unlock it first to move it or move past it." })
      return
    }
    mutate(() => setBlocks((prev) => reorder(prev, from, to)))
  }

  function move(id: string, dir: -1 | 1) {
    const i = blocks.findIndex((b) => b.id === id)
    moveBlock(i, i + dir)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    moveBlock(
      blocks.findIndex((b) => b.id === active.id),
      blocks.findIndex((b) => b.id === over.id),
    )
  }

  function save() {
    startTransition(async () => {
      const res = await saveTemplateAction(template.id, { name, category, subject, previewText, description, blocks })
      if (res.ok) {
        setSaved(snapshot())
        setDirty(false)
        toast.success("Template saved")
        router.refresh()
      } else toast.error("Could not save template")
    })
  }

  /** Local editor state is seeded from props once, so server-side content
   *  changes (reset, restore) are applied directly. They go through undo
   *  history so an accidental click can be reversed. */
  function applyServerTemplate(t: Snapshot) {
    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), snapshot()])
    setFuture([])
    restore(t)
    setSaved({
      name: t.name,
      category: t.category,
      subject: t.subject,
      previewText: t.previewText,
      description: t.description,
      blocks: t.blocks,
    })
    setSelectedId(t.blocks[0]?.id ?? null)
    setDirty(false)
    router.refresh()
  }

  function reset() {
    startTransition(async () => {
      const res = await resetTemplateAction(template.id)
      if (!res.ok) {
        toast.error(res.error ?? "Could not reset template")
        return
      }
      applyServerTemplate(res.template)
      toast.success(template.isSystem ? "Template reset to default" : "Template reset to original", {
        description: "Press Undo, or open History, to bring your changes back.",
      })
    })
  }

  async function restoreVersion(versionId: number): Promise<boolean> {
    const res = await restoreTemplateVersionAction(template.id, versionId)
    if (!res.ok) {
      toast.error(res.error ?? "Could not restore version")
      return false
    }
    applyServerTemplate(res.template)
    toast.success("Version restored", { description: "Saved as a new version." })
    return true
  }

  /** Return to the last saved state without touching the database. Goes
   *  through history so the discarded edits can be brought back with Undo. */
  function discardChanges() {
    if (!dirty) return
    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), snapshot()])
    setFuture([])
    restore(saved)
    setSelectedId(saved.blocks[0]?.id ?? null)
    setDirty(false)
    toast.success("Changes discarded", { description: "Press Undo to bring them back." })
  }

  function duplicateTemplate() {
    setDuplicating(true)
    void (async () => {
      const res = await createTemplateAction({
        name: `${name || "Untitled template"} (copy)`,
        category: category === "system" ? "marketing" : category,
        subject,
        previewText,
        description,
        blocks: blocks.map((b) => ({ ...b, id: uid() }) as EmailBlock),
      })
      setDuplicating(false)
      if (!res.ok) {
        toast.error("Could not duplicate template")
        return
      }
      toast.success("Template duplicated", {
        description: dirty ? "The copy includes your unsaved edits; this template is unchanged." : undefined,
      })
      router.push(`/admin/email/templates/${res.id}`)
    })()
  }

  function goBack() {
    if (dirty) setLeaveOpen(true)
    else router.push("/admin/email/templates")
  }

  function sendTest() {
    if (!testTo.trim()) return
    setTesting(true)
    void (async () => {
      const res = await sendTemplateTestAction({ id: template.id, to: testTo.trim() })
      setTesting(false)
      if (res.ok) toast.success(`Test sent to ${testTo.trim()}`)
      else toast.error(res.error ?? "Could not send test")
    })()
  }

  const workingBranding = useMemo(() => branding, [branding])

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={goBack}>
          <ArrowLeft className="size-4" />
          Templates
        </Button>
        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave without saving?</DialogTitle>
              <DialogDescription>
                You have unsaved changes to this template. If you leave now they will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeaveOpen(false)}>
                Keep editing
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDirty(false)
                  setLeaveOpen(false)
                  router.push("/admin/email/templates")
                }}
              >
                Leave without saving
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">{name || "Untitled template"}</h2>
            {template.isSystem ? <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">System</Badge> : null}
            {dirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={discardChanges}
          disabled={pending || !dirty}
          title="Go back to the last saved version"
        >
          <Eraser className="size-4" />
          Discard changes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={duplicateTemplate}
          disabled={pending || duplicating}
          title="Create an editable copy of this template"
        >
          {duplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
          Duplicate
        </Button>
        <VersionHistory
          templateId={template.id}
          currentVersion={template.version}
          dirty={dirty}
          onRestore={restoreVersion}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={reset}
          disabled={pending}
          title={
            template.isSystem
              ? "Restore the built-in default for this template"
              : "Restore this template as it was first created or copied"
          }
        >
          <RotateCcw className="size-4" />
          {template.isSystem ? "Reset to default" : "Reset to original"}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Send className="size-4" />
              Send test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send a test email</DialogTitle>
              <DialogDescription>
                We&apos;ll render this template with sample data and send it to the address below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="test-to">Recipient</Label>
              <Input
                id="test-to"
                type="email"
                placeholder="you@example.com"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Save your changes first to test the latest version.</p>
            </div>
            <DialogFooter>
              <Button onClick={sendTest} disabled={testing || !testTo.trim()} className="gap-1.5">
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button size="sm" className="gap-1.5" onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* Left: settings + blocks */}
        <div className="min-w-0 space-y-5">
          {/* Meta */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Name</Label>
                <Input id="tpl-name" value={name} onChange={(e) => mutate(() => setName(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-cat">Category</Label>
                <Select value={category} onValueChange={(v) => mutate(() => setCategory(v))} disabled={template.isSystem}>
                  <SelectTrigger id="tpl-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <PlaceholderField
                  id="tpl-subject"
                  label="Subject line"
                  value={subject}
                  onChange={(v) => mutate(() => setSubject(v))}
                  placeholder="e.g. Order confirmed — {{order_number}}"
                >
                  <CopyQualityHint value={subject} limit={SUBJECT_SOFT_LIMIT} checkSpam />
                </PlaceholderField>
              </div>
              <div className="sm:col-span-2">
                <PlaceholderField
                  id="tpl-preview"
                  label="Preview text"
                  value={previewText}
                  onChange={(v) => mutate(() => setPreviewText(v))}
                  placeholder="Short summary shown in the inbox preview"
                >
                  <CopyQualityHint value={previewText} limit={PREVIEW_SOFT_LIMIT} />
                </PlaceholderField>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-desc">Internal description</Label>
                <Input
                  id="tpl-desc"
                  value={description}
                  onChange={(e) => mutate(() => setDescription(e.target.value))}
                  placeholder="What this template is for (only your team sees this)"
                />
              </div>
            </div>
            <TokenChips />
          </div>

          {/* Palette */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Add a section</h3>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => addBlock(p.type)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
                >
                  <p.icon className="size-3.5" aria-hidden />
                  {p.label}
                </button>
              ))}
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Quick presets
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Add a whole ready-made section — you can edit every part afterwards.
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => addPreset(preset.key)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
                >
                  <Plus className="size-3.5" aria-hidden />
                  {preset.label}
                </button>
              ))}
            </div>

            <SavedSections blocks={blocks} labelFor={blockLabel} onInsert={insertSavedSection} />
          </div>

          {/* Block list */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sections</h3>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={undo}
                  disabled={history.length === 0}
                  aria-label="Undo"
                  title="Undo (Cmd/Ctrl+Z)"
                >
                  <Undo2 className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={redo}
                  disabled={future.length === 0}
                  aria-label="Redo"
                  title="Redo (Cmd/Ctrl+Shift+Z)"
                >
                  <Redo2 className="size-4" />
                </Button>
              </div>
            </div>
            {blocks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No sections yet. Add one from the palette above.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {blocks.map((block, i) => (
                      <SortableBlockRow
                        key={block.id}
                        block={block}
                        canMoveUp={canReorder(blocks, i, i - 1)}
                        canMoveDown={canReorder(blocks, i, i + 1)}
                        selected={selectedId === block.id}
                        products={products}
                        onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                        onToggleLock={() => toggleLock(block.id)}
                        onMove={(dir) => move(block.id, dir)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        onChange={(patch) => updateBlock(block.id, patch)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right: sticky live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <EmailPreviewPane blocks={blocks} branding={workingBranding} products={products} className="h-[720px]" />
        </div>
      </div>
    </div>
  )
}

/**
 * One draggable row in the Sections list. Dragging reorders via dnd-kit's
 * `useSortable`; the up/down buttons remain as a keyboard/pointer-free
 * fallback for the same `move()` handler.
 */
function SortableBlockRow({
  block,
  canMoveUp,
  canMoveDown,
  selected,
  products,
  onSelect,
  onToggleLock,
  onMove,
  onDuplicate,
  onRemove,
  onChange,
}: {
  block: EmailBlock
  canMoveUp: boolean
  canMoveDown: boolean
  selected: boolean
  products: ProductImageMap
  onSelect: () => void
  onToggleLock: () => void
  onMove: (dir: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
  onChange: (patch: Partial<EmailBlock>) => void
}) {
  const locked = isLocked(block)
  const label = blockLabel(block.type)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: locked,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-card transition-colors",
        selected ? "border-accent-teal/50 bg-accent-teal/[0.04]" : "border-border",
        locked && !selected ? "border-dashed bg-muted/40" : "",
        isDragging ? "relative z-10 shadow-lg" : "",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {locked ? (
          <span className="shrink-0 text-amber-600 dark:text-amber-400" title="Locked: can't be moved">
            <Lock className="size-4" aria-hidden="true" />
            <span className="sr-only">Locked</span>
          </span>
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
            aria-label={`Drag to reorder ${label}`}
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="shrink-0 text-sm font-medium">{label}</span>
          {locked ? (
            <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[11px] text-amber-600 dark:text-amber-400">
              Locked
            </Badge>
          ) : null}
          <span className="truncate text-xs text-muted-foreground">{blockSummary(block, products)}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className={cn("size-7", locked ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}
            onClick={onToggleLock}
            aria-pressed={locked}
            aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
            title={locked ? "Unlock to edit, move or remove" : "Lock to protect from changes"}
          >
            {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={() => onMove(-1)} disabled={!canMoveUp} aria-label="Move up">
            <ChevronUp className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={() => onMove(1)} disabled={!canMoveDown} aria-label="Move down">
            <ChevronDown className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={onDuplicate} disabled={locked} aria-label={`Duplicate ${label}`}>
            <Copy className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={locked}
            aria-label="Remove section"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {selected ? (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
          {locked ? (
            <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <Lock className="size-3.5 shrink-0" aria-hidden="true" />
              This block is locked. Unlock it to make changes.
            </p>
          ) : null}
          <fieldset disabled={locked} className="min-w-0 disabled:opacity-60">
            <legend className="sr-only">{`${label} settings`}</legend>
            <BlockFields block={block} products={products} onChange={onChange} />
          </fieldset>
        </div>
      ) : null}
    </div>
  )
}

function blockSummary(block: EmailBlock, products: ProductImageMap): string {
  switch (block.type) {
    case "hero":
      return block.productSlug && products[block.productSlug]
        ? `${block.heading.replace(/\*/g, "")} · linked to ${products[block.productSlug].name}${block.showPrice ? " + price" : ""}`
        : block.heading.replace(/\*/g, "")
    case "heading":
    case "text":
      return block.text.replace(/\*/g, "")
    case "button":
      return block.label
    case "image":
      return block.productSlug && products[block.productSlug]
        ? `Linked to ${products[block.productSlug].name}${block.showPrice ? " + price" : ""}`
        : block.src
    case "list":
      return block.title || `${block.items.length} items`
    case "callout":
      return block.title || block.body.replace(/\*/g, "")
    case "orderSummary":
      return "Dynamic order table"
    case "productPicks": {
      const picked = block.slugs.filter((slug) => products[slug])
      return picked.length
        ? `${picked.length} product${picked.length === 1 ? "" : "s"}: ${picked.map((slug) => products[slug].name).join(", ")}`
        : "No products picked yet"
    }
    case "spacer":
      return block.size
    case "divider":
      return "Horizontal rule"
    default:
      return ""
  }
}

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

function AlignField({ value, onChange }: { value: string; onChange: (v: "left" | "center" | "right") => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Alignment</Label>
      <div className="flex gap-1.5">
        {ALIGN_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value as "left" | "center" | "right")}
            className={cn(
              "flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              value === o.value
                ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BlockFields({
  block,
  products,
  onChange,
}: {
  block: EmailBlock
  products: ProductImageMap
  onChange: (patch: Partial<EmailBlock>) => void
}) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <FieldInput label="Eyebrow" value={block.eyebrow} onChange={(v) => onChange({ eyebrow: v } as Partial<EmailBlock>)} />
          <FieldInput label="Heading" value={block.heading} onChange={(v) => onChange({ heading: v } as Partial<EmailBlock>)} hint="Wrap words in *asterisks* to accent them" />
          <FieldTextarea label="Subheading" value={block.subheading} onChange={(v) => onChange({ subheading: v } as Partial<EmailBlock>)} />
          <ProductLinkField
            productSlug={block.productSlug}
            products={products}
            onChange={(slug) => onChange({ productSlug: slug } as Partial<EmailBlock>)}
          />
          <FieldInput
            label="Image URL"
            value={block.imageUrl}
            onChange={(v) => onChange({ imageUrl: v } as Partial<EmailBlock>)}
            hint={block.productSlug ? "Linked to a product above — this URL is ignored" : "Leave blank to use the brand hero"}
            disabled={!!block.productSlug}
          />
          {block.productSlug ? (
            <ShowPriceField
              checked={!!block.showPrice}
              price={products[block.productSlug]?.price}
              onChange={(checked) => onChange({ showPrice: checked } as Partial<EmailBlock>)}
            />
          ) : null}
          <AlignField value={block.align} onChange={(v) => onChange({ align: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "heading":
      return (
        <div className="space-y-3">
          <FieldInput label="Text" value={block.text} onChange={(v) => onChange({ text: v } as Partial<EmailBlock>)} />
          <AlignField value={block.align} onChange={(v) => onChange({ align: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "text":
      return (
        <div className="space-y-3">
          <FieldTextarea label="Text" value={block.text} onChange={(v) => onChange({ text: v } as Partial<EmailBlock>)} hint="Wrap words in *asterisks* to accent them" />
          <AlignField value={block.align} onChange={(v) => onChange({ align: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "button":
      return (
        <div className="space-y-3">
          <FieldInput label="Label" value={block.label} onChange={(v) => onChange({ label: v } as Partial<EmailBlock>)} />
          <FieldInput label="Link" value={block.href} onChange={(v) => onChange({ href: v } as Partial<EmailBlock>)} hint="Use {{shop_url}} for the store" />
          <AlignField value={block.align} onChange={(v) => onChange({ align: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "image":
      return (
        <div className="space-y-3">
          <ProductLinkField
            productSlug={block.productSlug}
            products={products}
            onChange={(slug) => onChange({ productSlug: slug } as Partial<EmailBlock>)}
          />
          <FieldInput
            label="Image URL"
            value={block.src}
            onChange={(v) => onChange({ src: v } as Partial<EmailBlock>)}
            hint={block.productSlug ? "Linked to a product above — this URL is ignored" : undefined}
            disabled={!!block.productSlug}
          />
          <FieldInput
            label="Alt text"
            value={block.alt}
            onChange={(v) => onChange({ alt: v } as Partial<EmailBlock>)}
            hint={block.productSlug ? "Linked to a product above — this text is ignored" : undefined}
            disabled={!!block.productSlug}
          />
          {block.productSlug ? (
            <ShowPriceField
              checked={!!block.showPrice}
              price={products[block.productSlug]?.price}
              onChange={(checked) => onChange({ showPrice: checked } as Partial<EmailBlock>)}
            />
          ) : null}
          <FieldInput label="Link (optional)" value={block.href} onChange={(v) => onChange({ href: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "list":
      return (
        <div className="space-y-3">
          <FieldInput label="Title" value={block.title} onChange={(v) => onChange({ title: v } as Partial<EmailBlock>)} />
          <FieldTextarea
            label="Items (one per line)"
            value={block.items.join("\n")}
            onChange={(v) => onChange({ items: v.split("\n") } as Partial<EmailBlock>)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={block.ordered}
              onChange={(e) => onChange({ ordered: e.target.checked } as Partial<EmailBlock>)}
              className="size-4 rounded border-border accent-[var(--accent-teal,#2dd4bf)]"
            />
            Numbered list
          </label>
        </div>
      )
    case "callout":
      return (
        <div className="space-y-3">
          <FieldInput label="Title" value={block.title} onChange={(v) => onChange({ title: v } as Partial<EmailBlock>)} />
          <FieldTextarea label="Body" value={block.body} onChange={(v) => onChange({ body: v } as Partial<EmailBlock>)} />
        </div>
      )
    case "spacer":
      return (
        <div className="space-y-1.5">
          <Label>Height</Label>
          <div className="flex gap-1.5">
            {(["sm", "md", "lg"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ size: s } as Partial<EmailBlock>)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-1.5 text-sm uppercase transition-colors",
                  block.size === s
                    ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )
    case "orderSummary":
      return (
        <p className="text-sm text-muted-foreground">
          This block expands to the customer&apos;s real order items and totals when the email is sent. The preview shows sample data.
        </p>
      )
    case "productPicks":
      return (
        <div className="space-y-3">
          <FieldInput label="Title" value={block.title} onChange={(v) => onChange({ title: v } as Partial<EmailBlock>)} />
          <ProductMultiPickField
            slugs={block.slugs}
            products={products}
            onChange={(slugs) => onChange({ slugs } as Partial<EmailBlock>)}
          />
        </div>
      )
    case "divider":
      return <p className="text-sm text-muted-foreground">A thin horizontal rule. No settings.</p>
    default:
      return null
  }
}

function FieldInput({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  disabled?: boolean
}) {
  return (
    <PlaceholderField label={label} value={value} onChange={onChange} disabled={disabled}>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </PlaceholderField>
  )
}

const UNLINKED = "__unlinked__"

/**
 * Link a hero/image block to a live product instead of a hand-entered image
 * URL. Selecting a product resolves its name/image at render time
 * (`RenderContext.products`), so the picture can never drift out of sync with
 * — or be mismatched against — the product title. See `HeroBlock.productSlug`
 * / `ImageBlock.productSlug` in `features/email/blocks/types.ts`.
 */
function ProductLinkField({
  productSlug,
  products,
  onChange,
}: {
  productSlug: string | null | undefined
  products: ProductImageMap
  onChange: (slug: string | null) => void
}) {
  const entries = Object.entries(products)
  const linked = productSlug ? products[productSlug] : undefined

  return (
    <div className="space-y-1.5">
      <Label>Link to product</Label>
      <Select value={productSlug || UNLINKED} onValueChange={(v) => onChange(v === UNLINKED ? null : v)}>
        <SelectTrigger>
          <SelectValue placeholder="No product linked" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNLINKED}>No product linked</SelectItem>
          {entries.map(([slug, p]) => (
            <SelectItem key={slug} value={slug}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {linked ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
          <img src={linked.image || "/placeholder.svg"} alt={linked.name} className="size-10 rounded-md object-cover" />
          <p className="text-xs text-muted-foreground">
            Image and name are pulled live from <span className="font-medium text-foreground">{linked.name}</span>. They stay in
            sync automatically if the product changes.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Pick a product so the image and name always match its catalog listing.</p>
      )}
    </div>
  )
}

/**
 * Hand-pick several products for a `ProductPicksBlock` (e.g. "You might also
 * like"). Each entry resolves its image/name/price live from
 * `RenderContext.products` at render time — only the slug is stored — so the
 * picks can never drift out of sync with the catalog. See
 * `ProductPicksBlock` in `features/email/blocks/types.ts`.
 */
function ProductMultiPickField({
  slugs,
  products,
  onChange,
}: {
  slugs: string[]
  products: ProductImageMap
  onChange: (slugs: string[]) => void
}) {
  const ADD = "__add__"
  const available = Object.entries(products).filter(([slug]) => !slugs.includes(slug))

  function add(slug: string) {
    if (slug === ADD || slugs.includes(slug)) return
    onChange([...slugs, slug])
  }

  function remove(slug: string) {
    onChange(slugs.filter((s) => s !== slug))
  }

  return (
    <div className="space-y-1.5">
      <Label>Products</Label>
      <div className="space-y-2">
        {slugs.map((slug) => {
          const p = products[slug]
          return (
            <div key={slug} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
              {p ? (
                <>
                  <img src={p.image || "/placeholder.svg"} alt={p.name} className="size-10 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(p.price)}</p>
                  </div>
                </>
              ) : (
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">Unknown product ({slug})</p>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(slug)}
                aria-label={`Remove ${p?.name ?? slug}`}
              >
                <X className="size-4" />
              </Button>
            </div>
          )
        })}
      </div>
      {available.length > 0 ? (
        <Select value={ADD} onValueChange={add}>
          <SelectTrigger>
            <SelectValue placeholder="Add a product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ADD} disabled>
              Add a product&hellip;
            </SelectItem>
            {available.map(([slug, p]) => (
              <SelectItem key={slug} value={slug}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : slugs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No products available to pick from.</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Each product&apos;s image, name, and price are pulled live from the catalog and stay in sync automatically.
      </p>
    </div>
  )
}

/**
 * Toggles showing a linked product's price alongside its image/name. The
 * amount itself is never typed in or stored — it's resolved live from
 * `ProductImageMap` (same source as the image/name) so it can't go stale if
 * the price changes after this template was built.
 */
function ShowPriceField({
  checked,
  price,
  onChange,
}: {
  checked: boolean
  price: Money | undefined
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-[var(--accent-teal,#2dd4bf)]"
      />
      Show price{price ? ` (currently ${formatMoney(price)}, updates automatically)` : ""}
    </label>
  )
}

function FieldTextarea({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <PlaceholderField label={label} value={value} onChange={onChange} multiline>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </PlaceholderField>
  )
}

function TokenChips() {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Placeholders — use the Placeholder button on any field, or click to copy
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLACEHOLDERS.map((p) => {
          const token = placeholderToken(p.key)
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(token)
                toast.success(`Copied ${token}`)
              }}
              title={`${p.label} — e.g. ${p.sample}`}
              className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
            >
              {token}
            </button>
          )
        })}
      </div>
    </div>
  )
}
