"use client"

import { useState } from "react"
import { Check, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import {
  getActiveTheme,
  upsertTheme,
  type HeadingScope,
  type HeadingStyle,
  type ThemeTemplate,
} from "@/lib/settings/theme"
import { cn } from "@/lib/utils"
import { ThemePreview } from "./theme-preview"

const OPTIONS: { value: HeadingStyle; label: string; desc: string }[] = [
  { value: "two-tone", label: "Two-tone", desc: "White title with the last word in your brand accent." },
  { value: "solid", label: "Solid", desc: "Entire headline in a single accent colour." },
  { value: "gradient", label: "Gradient", desc: "Whole title filled with your brand gradient." },
]

const SCOPE_OPTIONS: { value: HeadingScope; label: string; desc: string }[] = [
  { value: "primary", label: "Primary headings", desc: "Page titles and section headlines carry the accent. Small card titles stay solid." },
  { value: "all", label: "Every heading", desc: "The accent reaches down to small card titles too — the boldest brand statement." },
]

export function HeadingStyleForm() {
  const { settings, update } = useStoreSettings()
  const active = getActiveTheme(settings.theme)
  const [draft, setDraft] = useState<ThemeTemplate>(active)
  const [saving, setSaving] = useState(false)

  function save() {
    setSaving(true)
    update({ theme: upsertTheme(settings.theme, draft) })
    toast.success("Heading style updated")
    setTimeout(() => setSaving(false), 300)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Heading style</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Applies to every headline site-wide via the shared two-tone primitive — heroes, section titles and page
            headers all follow this.
          </p>
          <div className="grid gap-3">
            {OPTIONS.map((opt) => {
              const selected = draft.headingStyle === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, headingStyle: opt.value }))}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                    selected ? "border-accent-teal/50 bg-accent-teal/8" : "border-border hover:border-accent-teal/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-accent-teal bg-accent-teal text-background" : "border-border",
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Accent reach</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Decide how far the accent travels. Keep it on primary headings for a refined look, or extend it to every
            heading for a bolder brand presence.
          </p>
          <div className="grid gap-3">
            {SCOPE_OPTIONS.map((opt) => {
              const selected = (draft.headingScope ?? "primary") === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, headingScope: opt.value }))}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                    selected ? "border-accent-teal/50 bg-accent-teal/8" : "border-border hover:border-accent-teal/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-accent-teal bg-accent-teal text-background" : "border-border",
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save style
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <ThemePreview theme={draft} />
      </div>
    </div>
  )
}
