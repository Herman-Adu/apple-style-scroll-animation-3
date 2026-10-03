"use client"

import { useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import { getActiveTheme, upsertTheme, type ThemeTemplate } from "@/features/settings"
import { ThemePreview } from "./theme-preview"

/** A colour input row that accepts any CSS colour string (oklch, hex, …). The
 * native picker only supports hex, so it's an optional convenience alongside
 * the free-text field which is the real source. */
function ColorRow({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : undefined
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <span
          className="size-9 shrink-0 rounded-md border border-border"
          style={{ background: value || "transparent" }}
          aria-hidden
        />
        <input
          type="color"
          value={hex ?? "#2dd4bf"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
          aria-label={`${label} picker`}
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function BrandColorsForm() {
  const { settings, update } = useStoreSettings()
  const active = getActiveTheme(settings.theme)
  const [draft, setDraft] = useState<ThemeTemplate>(active)
  const [saving, setSaving] = useState(false)

  function setToken(key: "accent" | "accentMuted" | "gradientFrom" | "gradientTo", value: string) {
    setDraft((prev) => ({ ...prev, tokens: { ...prev.tokens, [key]: value } }))
  }

  function save() {
    setSaving(true)
    update({ theme: upsertTheme(settings.theme, draft) })
    toast.success(`${draft.name} updated`)
    // update() writes through optimistically; clear the spinner on next tick.
    setTimeout(() => setSaving(false), 300)
  }

  const isGradient = draft.headingStyle === "gradient"

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Editing: {draft.name}
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            These colours drive every teal affordance across the storefront, admin, and email accents.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorRow
              id="accent"
              label="Accent (primary brand)"
              value={draft.tokens.accent}
              onChange={(v) => setToken("accent", v)}
              hint="Buttons, links, active states."
            />
            <ColorRow
              id="accentMuted"
              label="Second tone"
              value={draft.tokens.accentMuted}
              onChange={(v) => setToken("accentMuted", v)}
              hint="Two-tone gradient end, hairlines."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Heading gradient
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Used when the heading style is <strong>Gradient</strong>
            {isGradient ? "." : " — switch to Gradient on the Headings tab to see it."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorRow
              id="gradientFrom"
              label="Gradient from"
              value={draft.tokens.gradientFrom ?? draft.tokens.accent}
              onChange={(v) => setToken("gradientFrom", v)}
            />
            <ColorRow
              id="gradientTo"
              label="Gradient to"
              value={draft.tokens.gradientTo ?? draft.tokens.accentMuted}
              onChange={(v) => setToken("gradientTo", v)}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save colours
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <ThemePreview theme={draft} />
      </div>
    </div>
  )
}
