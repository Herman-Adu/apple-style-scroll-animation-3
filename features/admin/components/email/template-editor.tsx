"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Image as ImageIcon,
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
} from "lucide-react"
import { toast } from "sonner"
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
import type { BlockType, EmailBlock, EmailBranding } from "@/features/email/blocks/types"
import { TEMPLATE_TOKENS, BLOCK_PRESETS } from "@/features/email/blocks/system-templates"
import {
  resetTemplateAction,
  saveTemplateAction,
  sendTemplateTestAction,
} from "@/features/email/admin-actions"
import { BlockPreview } from "./block-preview"

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

export function TemplateEditor({ template, branding }: { template: EditorTemplate; branding: EmailBranding }) {
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

  const mutate = (fn: () => void) => {
    fn()
    setDirty(true)
  }

  function updateBlock(id: string, patch: Partial<EmailBlock>) {
    mutate(() => setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b))))
  }

  function addBlock(type: BlockType) {
    const block = makeBlock(type)
    mutate(() => setBlocks((prev) => [...prev, block]))
    setSelectedId(block.id)
  }

  function addPreset(key: string) {
    const preset = BLOCK_PRESETS.find((p) => p.key === key)
    if (!preset) return
    const added = preset.blocks.map((b) => ({ ...b, id: uid() }) as EmailBlock)
    mutate(() => setBlocks((prev) => [...prev, ...added]))
    setSelectedId(added[0]?.id ?? null)
  }

  function removeBlock(id: string) {
    mutate(() => setBlocks((prev) => prev.filter((b) => b.id !== id)))
    if (selectedId === id) setSelectedId(null)
  }

  function move(id: string, dir: -1 | 1) {
    mutate(() =>
      setBlocks((prev) => {
        const i = prev.findIndex((b) => b.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= prev.length) return prev
        const next = [...prev]
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      }),
    )
  }

  function save() {
    startTransition(async () => {
      const res = await saveTemplateAction(template.id, { name, category, subject, previewText, description, blocks })
      if (res.ok) {
        setDirty(false)
        toast.success("Template saved")
        router.refresh()
      } else toast.error("Could not save template")
    })
  }

  function reset() {
    startTransition(async () => {
      const res = await resetTemplateAction(template.id)
      if (res.ok) {
        toast.success("Reset to default")
        router.refresh()
      } else toast.error("Could not reset template")
    })
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
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/admin/email/templates")}>
          <ArrowLeft className="size-4" />
          Templates
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">{name || "Untitled template"}</h2>
            {template.isSystem ? <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">System</Badge> : null}
            {dirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
          </div>
        </div>
        {template.isSystem ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} disabled={pending}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        ) : null}
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* Left: settings + blocks */}
        <div className="space-y-5">
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-subject">Subject line</Label>
                <Input
                  id="tpl-subject"
                  value={subject}
                  onChange={(e) => mutate(() => setSubject(e.target.value))}
                  placeholder="e.g. Order confirmed — {{order_number}}"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tpl-preview">Preview text</Label>
                <Input
                  id="tpl-preview"
                  value={previewText}
                  onChange={(e) => mutate(() => setPreviewText(e.target.value))}
                  placeholder="Short summary shown in the inbox preview"
                />
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
          </div>

          {/* Block list */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sections</h3>
            <div className="space-y-2">
              {blocks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No sections yet. Add one from the palette above.
                </p>
              ) : (
                blocks.map((block, i) => (
                  <div
                    key={block.id}
                    className={cn(
                      "rounded-xl border transition-colors",
                      selectedId === block.id ? "border-accent-teal/50 bg-accent-teal/[0.04]" : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <GripVertical className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setSelectedId(selectedId === block.id ? null : block.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="text-sm font-medium">{blockLabel(block.type)}</span>
                        <span className="ml-2 truncate text-xs text-muted-foreground">{blockSummary(block)}</span>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => move(block.id, -1)} disabled={i === 0} aria-label="Move up">
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => move(block.id, 1)} disabled={i === blocks.length - 1} aria-label="Move down">
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removeBlock(block.id)} aria-label="Remove section">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {selectedId === block.id ? (
                      <div className="border-t border-border px-3 py-3">
                        <BlockFields block={block} onChange={(patch) => updateBlock(block.id, patch)} />
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: sticky live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Live preview</span>
            <span className="text-xs text-muted-foreground">Sample data</span>
          </div>
          <BlockPreview blocks={blocks} branding={workingBranding} className="h-[720px]" />
        </div>
      </div>
    </div>
  )
}

function blockSummary(block: EmailBlock): string {
  switch (block.type) {
    case "hero":
      return block.heading.replace(/\*/g, "")
    case "heading":
    case "text":
      return block.text.replace(/\*/g, "")
    case "button":
      return block.label
    case "image":
      return block.src
    case "list":
      return block.title || `${block.items.length} items`
    case "callout":
      return block.title || block.body.replace(/\*/g, "")
    case "orderSummary":
      return "Dynamic order table"
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

function BlockFields({ block, onChange }: { block: EmailBlock; onChange: (patch: Partial<EmailBlock>) => void }) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <FieldInput label="Eyebrow" value={block.eyebrow} onChange={(v) => onChange({ eyebrow: v } as Partial<EmailBlock>)} />
          <FieldInput label="Heading" value={block.heading} onChange={(v) => onChange({ heading: v } as Partial<EmailBlock>)} hint="Wrap words in *asterisks* to accent them" />
          <FieldTextarea label="Subheading" value={block.subheading} onChange={(v) => onChange({ subheading: v } as Partial<EmailBlock>)} />
          <FieldInput label="Image URL" value={block.imageUrl} onChange={(v) => onChange({ imageUrl: v } as Partial<EmailBlock>)} hint="Leave blank to use the brand hero" />
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
          <FieldInput label="Image URL" value={block.src} onChange={(v) => onChange({ src: v } as Partial<EmailBlock>)} />
          <FieldInput label="Alt text" value={block.alt} onChange={(v) => onChange({ alt: v } as Partial<EmailBlock>)} />
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
    case "divider":
      return <p className="text-sm text-muted-foreground">A thin horizontal rule. No settings.</p>
    default:
      return null
  }
}

function FieldInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function FieldTextarea({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function TokenChips() {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Tokens you can use</p>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_TOKENS.map((t) => (
          <button
            key={t.token}
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(t.token)
              toast.success(`Copied ${t.token}`)
            }}
            title={`Copy ${t.token}`}
            className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-accent-teal"
          >
            {t.token}
          </button>
        ))}
      </div>
    </div>
  )
}
