"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Save, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { EmailBlock, EmailBranding } from "@/features/email/blocks/types"
import { saveCampaignAction, sendCampaignAction } from "@/features/email/admin-actions"
import { BlockPreview } from "./block-preview"

type AudienceType = "all_subscribers" | "manual"

export type EditorCampaign = {
  id: number
  name: string
  subject: string
  previewText: string
  templateId: number | null
  audience: { type: AudienceType; emails?: string[] }
  status: string
  stats: { recipients?: number; sent?: number; failed?: number; skipped?: number } | null
}
export type TemplateOption = { id: number; name: string; category: string; subject: string; blocks: EmailBlock[] }

export function CampaignEditor({
  campaign,
  templates,
  branding,
  optedInCount,
}: {
  campaign: EditorCampaign
  templates: TemplateOption[]
  branding: EmailBranding
  optedInCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sending, setSending] = useState(false)

  const [name, setName] = useState(campaign.name)
  const [subject, setSubject] = useState(campaign.subject)
  const [previewText, setPreviewText] = useState(campaign.previewText)
  const [templateId, setTemplateId] = useState<number | null>(campaign.templateId)
  const [audienceType, setAudienceType] = useState<AudienceType>(campaign.audience?.type ?? "all_subscribers")
  const [manualEmails, setManualEmails] = useState((campaign.audience?.emails ?? []).join("\n"))
  const [dirty, setDirty] = useState(false)

  const sent = campaign.status === "sent"
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null

  const manualCount = useMemo(
    () => manualEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean).length,
    [manualEmails],
  )
  const recipientCount = audienceType === "all_subscribers" ? optedInCount : manualCount

  const mark = (fn: () => void) => {
    fn()
    setDirty(true)
  }

  function buildAudience() {
    return audienceType === "all_subscribers"
      ? ({ type: "all_subscribers" } as const)
      : ({ type: "manual", emails: manualEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean) } as const)
  }

  function save() {
    startTransition(async () => {
      const res = await saveCampaignAction(campaign.id, {
        name,
        subject,
        previewText,
        templateId,
        audience: buildAudience(),
      })
      if (res.ok) {
        setDirty(false)
        toast.success("Campaign saved")
        router.refresh()
      } else toast.error("Could not save campaign")
    })
  }

  function send() {
    setSending(true)
    void (async () => {
      // Persist latest edits before sending.
      await saveCampaignAction(campaign.id, { name, subject, previewText, templateId, audience: buildAudience() })
      const res = await sendCampaignAction(campaign.id)
      setSending(false)
      if (res.ok) {
        toast.success(`Sent to ${res.sent} recipient${res.sent === 1 ? "" : "s"}`)
        router.refresh()
      } else toast.error(res.error ?? "Could not send campaign")
    })()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/admin/email/campaigns")}>
          <ArrowLeft className="size-4" />
          Campaigns
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">{name || "Untitled campaign"}</h2>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                sent
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {campaign.status}
            </Badge>
            {dirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
          </div>
        </div>
        {!sent ? (
          <>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={save} disabled={pending || !dirty}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
            <SendDialog
              disabled={!templateId || recipientCount === 0}
              recipientCount={recipientCount}
              sending={sending}
              onSend={send}
            />
          </>
        ) : null}
      </div>

      {sent && campaign.stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Recipients" value={campaign.stats.recipients ?? 0} />
          <Stat label="Sent" value={campaign.stats.sent ?? 0} accent />
          <Stat label="Failed" value={campaign.stats.failed ?? 0} />
          <Stat label="Skipped" value={campaign.stats.skipped ?? 0} />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Details</h3>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Campaign name</Label>
                <Input id="c-name" value={name} disabled={sent} onChange={(e) => mark(() => setName(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-template">Template</Label>
                <Select
                  value={templateId ? String(templateId) : undefined}
                  disabled={sent}
                  onValueChange={(v) => mark(() => setTemplateId(Number(v)))}
                >
                  <SelectTrigger id="c-template">
                    <SelectValue placeholder="Choose a template to send" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} <span className="text-muted-foreground">· {t.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-subject">Subject line</Label>
                <Input
                  id="c-subject"
                  value={subject}
                  disabled={sent}
                  onChange={(e) => mark(() => setSubject(e.target.value))}
                  placeholder={selectedTemplate ? `Defaults to: ${selectedTemplate.subject}` : "Subject"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-preview">Preview text</Label>
                <Input
                  id="c-preview"
                  value={previewText}
                  disabled={sent}
                  onChange={(e) => mark(() => setPreviewText(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Audience</h3>
            <div className="flex gap-2">
              {(
                [
                  { value: "all_subscribers", label: `All subscribers (${optedInCount})` },
                  { value: "manual", label: "Specific emails" },
                ] as const
              ).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={sent}
                  onClick={() => mark(() => setAudienceType(o.value))}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60",
                    audienceType === o.value
                      ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {audienceType === "manual" ? (
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="c-emails">Email addresses</Label>
                <Textarea
                  id="c-emails"
                  rows={5}
                  value={manualEmails}
                  disabled={sent}
                  onChange={(e) => mark(() => setManualEmails(e.target.value))}
                  placeholder={"One per line, or comma-separated"}
                />
                <p className="text-xs text-muted-foreground">{manualCount} recipient{manualCount === 1 ? "" : "s"}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Sends to every opted-in subscriber. {optedInCount} will receive this campaign.
              </p>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Preview</span>
            <span className="text-xs text-muted-foreground">Sample data</span>
          </div>
          {selectedTemplate ? (
            <BlockPreview blocks={selectedTemplate.blocks} branding={branding} className="h-[640px]" />
          ) : (
            <div className="flex h-[640px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Choose a template to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", accent && "text-accent-teal")}>{value}</p>
    </div>
  )
}

function SendDialog({
  disabled,
  recipientCount,
  sending,
  onSend,
}: {
  disabled: boolean
  recipientCount: number
  sending: boolean
  onSend: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5" disabled={disabled}>
          <Send className="size-4" />
          Send campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send this campaign?</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-accent-teal" aria-hidden />
          <p className="text-sm text-muted-foreground">
            This will email <span className="font-semibold text-foreground">{recipientCount}</span> recipient
            {recipientCount === 1 ? "" : "s"}. This can&apos;t be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="gap-1.5"
            disabled={sending}
            onClick={() => {
              onSend()
              setOpen(false)
            }}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
