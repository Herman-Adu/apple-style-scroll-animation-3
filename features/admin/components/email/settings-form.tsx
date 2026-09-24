"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EmailBranding } from "@/features/email/blocks/types"
import { SYSTEM_TEMPLATES } from "@/features/email/blocks/system-templates"
import { saveEmailSettings } from "@/features/email/admin-actions"
import { BlockPreview } from "./block-preview"

const PREVIEW_BLOCKS = SYSTEM_TEMPLATES.find((t) => t.key === "welcome")!.blocks

export function SettingsForm({ branding }: { branding: EmailBranding }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<EmailBranding>(branding)

  const set = <K extends keyof EmailBranding>(key: K, value: EmailBranding[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const working = useMemo(() => form, [form])

  function save() {
    startTransition(async () => {
      const res = await saveEmailSettings({
        brandName: form.brandName,
        fromName: form.fromName,
        supportEmail: form.supportEmail,
        heroImageUrl: form.heroImageUrl,
        accentColor: form.accentColor,
        footerText: form.footerText,
        footerCities: form.footerCities,
        address: form.address,
      })
      if (res.ok) {
        toast.success("Brand settings saved")
        router.refresh()
      } else toast.error("Could not save settings")
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Brand identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand name</Label>
              <Input id="brandName" value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fromName">From name</Label>
              <Input id="fromName" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accentColor">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accentColor"
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                  aria-label="Accent color picker"
                />
                <Input value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">Support / reply-to email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
                placeholder="support@yourbrand.com"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="heroImageUrl">Default hero image URL</Label>
              <Input
                id="heroImageUrl"
                value={form.heroImageUrl}
                onChange={(e) => set("heroImageUrl", e.target.value)}
                placeholder="/email/hero-momo.png"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Footer</h3>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="footerText">Footer tagline</Label>
              <Input id="footerText" value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footerCities">Footer cities</Label>
              <Input
                id="footerCities"
                value={form.footerCities}
                onChange={(e) => set("footerCities", e.target.value)}
                placeholder="London · Berlin · Tokyo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Postal address</Label>
              <Textarea
                id="address"
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Included in the footer for compliance"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save settings
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Live preview</span>
          <span className="text-xs text-muted-foreground">Welcome email</span>
        </div>
        <BlockPreview blocks={PREVIEW_BLOCKS} branding={working} className="h-[640px]" />
      </div>
    </div>
  )
}
