"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import {
  DEFAULT_HEADING_ACCENT,
  getActiveTheme,
  getHeadingAccent,
  resetActiveThemeToDefault,
  TITANIUM_TEAL,
  upsertTheme,
  type HeadingAccent,
  type HeadingStyle,
  type ThemeTemplate,
} from "@/features/settings"
import { cn } from "@/lib/utils"
import { ThemePreview } from "./theme-preview"

const OPTIONS: { value: HeadingStyle; label: string; desc: string }[] = [
  { value: "two-tone", label: "Two-tone", desc: "White title with the last word in your brand accent." },
  { value: "solid", label: "Solid", desc: "Entire headline in a single accent colour." },
  { value: "gradient", label: "Gradient", desc: "Whole title filled with your brand gradient." },
]

const TIER_OPTIONS: { key: keyof HeadingAccent; label: string; desc: string }[] = [
  { key: "h1", label: "Page & hero titles", desc: "The largest headline on each page — heroes and page titles." },
  { key: "h2", label: "Section headlines", desc: "The titles that introduce each section down the page." },
  { key: "cards", label: "Card & list titles", desc: "Small repeated titles — value cards, list items, timeline milestones." },
]

export function HeadingStyleForm() {
  const { settings, update } = useStoreSettings()
  const active = getActiveTheme(settings.theme)
  const [draft, setDraft] = useState<ThemeTemplate>(active)
  const [saving, setSaving] = useState(false)

  const accent = getHeadingAccent(draft)

  function save() {
    setSaving(true)
    update({ theme: upsertTheme(settings.theme, draft) })
    toast.success("Heading style updated")
    setTimeout(() => setSaving(false), 300)
  }

  function toggleTier(key: keyof HeadingAccent) {
    setDraft((prev) => {
      const current = getHeadingAccent(prev)
      return {
        ...prev,
        headingScope: undefined,
        headingAccent: { ...current, [key]: !current[key] },
      }
    })
  }

  function resetToDefault() {
    const nextState = resetActiveThemeToDefault(settings.theme)
    setDraft(getActiveTheme(nextState))
    update({ theme: nextState })
    toast.success("Theme reset to Titanium Teal defaults")
  }

  const isDefault =
    draft.headingStyle === TITANIUM_TEAL.headingStyle &&
    accent.h1 === DEFAULT_HEADING_ACCENT.h1 &&
    accent.h2 === DEFAULT_HEADING_ACCENT.h2 &&
    accent.cards === DEFAULT_HEADING_ACCENT.cards

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="min-w-0 space-y-6">
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
            Switch the brand accent on or off for each heading tier independently. Accent your page titles but keep
            section headlines calm, light up everything, or any mix — the whole site updates instantly.
          </p>
          <div className="grid gap-3">
            {TIER_OPTIONS.map((opt) => {
              const on = accent[opt.key]
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleTier(opt.key)}
                  role="switch"
                  aria-checked={on}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                    on ? "border-accent-teal/50 bg-accent-teal/8" : "border-border hover:border-accent-teal/30",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                      on ? "bg-accent-teal" : "bg-border",
                    )}
                    aria-hidden
                  >
                    <span
                      className={cn(
                        "absolute size-4 rounded-full bg-background transition-transform",
                        on ? "translate-x-[18px]" : "translate-x-0.5",
                      )}
                    />
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

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={resetToDefault}
            disabled={isDefault}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            Reset to default
          </Button>
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
