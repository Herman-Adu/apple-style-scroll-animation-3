"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Pencil, Plus, Send, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  createPresetAction,
  deletePresetAction,
  savePresetAction,
  sendCustomerMessageAction,
} from "@/features/email/admin-actions"

export type PresetItem = { id: number; name: string; category: string; subject: string; body: string }
export type MessageItem = {
  id: number
  customerEmail: string
  customerName: string
  subject: string
  body: string
  status: string
  createdAt: string | Date
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

const STATUS_STYLES: Record<string, string> = {
  sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  skipped: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function MessageCenter({
  presets,
  messages,
  prefillTo,
  prefillName,
}: {
  presets: PresetItem[]
  messages: MessageItem[]
  prefillTo?: string
  prefillName?: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const [to, setTo] = useState(prefillTo ?? "")
  const [name, setName] = useState(prefillName ?? "")
  const [subject, setSubject] = useState("")
  const [heading, setHeading] = useState("")
  const [body, setBody] = useState("")

  function applyPreset(id: string) {
    const p = presets.find((x) => String(x.id) === id)
    if (!p) return
    setSubject(fillName(p.subject))
    setHeading(fillName(p.subject))
    setBody(fillName(p.body))
    toast.success(`Applied "${p.name}"`)
  }

  function fillName(s: string) {
    return s.replace(/\{\{\s*customer_name\s*\}\}/g, name || "there")
  }

  function send() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Recipient, subject and message are required.")
      return
    }
    setSending(true)
    void (async () => {
      const res = await sendCustomerMessageAction({ to: to.trim(), name: name.trim(), subject, heading, body })
      setSending(false)
      if (res.ok) {
        toast.success(res.skipped ? "Saved (email sending is not configured)" : `Message sent to ${to.trim()}`)
        setSubject("")
        setHeading("")
        setBody("")
        router.refresh()
      } else toast.error(res.error ?? "Could not send message")
    })()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      {/* Composer */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
              <Mail className="size-4" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight">New message</h3>
              <p className="text-xs text-muted-foreground">Replies go to your support address.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="msg-to">Customer email</Label>
                <Input id="msg-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="customer@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="msg-name">Customer name</Label>
                <Input id="msg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
              </div>
            </div>

            {presets.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Start from a preset</Label>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger className="gap-2">
                    <Wand2 className="size-4 text-accent-teal" />
                    <SelectValue placeholder="Choose a preset reply" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} <span className="text-muted-foreground">· {p.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="msg-subject">Subject</Label>
              <Input id="msg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-heading">Hero heading</Label>
              <Input
                id="msg-heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Defaults to the subject. Use *asterisks* to accent words."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-body">Message</Label>
              <Textarea
                id="msg-body"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"Write your message. Separate paragraphs with a blank line.\n\nUse {{customer_name}} and it fills automatically."}
              />
              <p className="text-xs text-muted-foreground">
                Each paragraph becomes its own branded text block. Delivery instructions, next steps, refunds — anything.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={send} disabled={sending} className="gap-1.5">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send message
              </Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent messages
          </h3>
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No messages sent yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {messages.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{m.subject}</span>
                      <Badge variant="outline" className={cn("shrink-0 capitalize", STATUS_STYLES[m.status] ?? "")}>
                        {m.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.customerName ? `${m.customerName} · ` : ""}
                      {m.customerEmail}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmt(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Presets sidebar */}
      <PresetPanel presets={presets} />
    </div>
  )
}

function PresetPanel({ presets }: { presets: PresetItem[] }) {
  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Presets</h3>
          <PresetDialog
            trigger={
              <Button size="sm" variant="outline" className="h-8 gap-1.5">
                <Plus className="size-3.5" />
                New
              </Button>
            }
          />
        </div>
        {presets.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Save reusable replies for shipping, refunds, delays and more.
          </p>
        ) : (
          <ul className="space-y-2">
            {presets.map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.subject}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <PresetDialog
                      preset={p}
                      trigger={
                        <Button size="icon" variant="ghost" className="size-7" aria-label={`Edit ${p.name}`}>
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <DeletePresetButton id={p.id} />
                  </div>
                </div>
                <Badge variant="outline" className="mt-2 capitalize">
                  {p.category}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DeletePresetButton({ id }: { id: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-7 text-muted-foreground hover:text-destructive"
      aria-label="Delete preset"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deletePresetAction(id)
          if (res.ok) {
            toast.success("Preset deleted")
            router.refresh()
          } else toast.error("Could not delete preset")
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  )
}

function PresetDialog({ preset, trigger }: { preset?: PresetItem; trigger: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(preset?.name ?? "")
  const [category, setCategory] = useState(preset?.category ?? "general")
  const [subject, setSubject] = useState(preset?.subject ?? "")
  const [body, setBody] = useState(preset?.body ?? "")

  function save() {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Name, subject and body are required.")
      return
    }
    startTransition(async () => {
      const res = preset
        ? await savePresetAction(preset.id, { name, category, subject, body })
        : await createPresetAction({ name, category, subject, body })
      if (res.ok) {
        toast.success(preset ? "Preset updated" : "Preset created")
        setOpen(false)
        if (!preset) {
          setName("")
          setCategory("general")
          setSubject("")
          setBody("")
        }
        router.refresh()
      } else toast.error("Could not save preset")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{preset ? "Edit preset" : "New preset"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Name</Label>
              <Input id="preset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shipping delay" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-cat">Category</Label>
              <Input id="preset-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="general" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preset-subject">Subject</Label>
            <Input id="preset-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preset-body">Body</Label>
            <Textarea
              id="preset-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Use {{customer_name}} to personalize."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {preset ? "Save changes" : "Create preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
