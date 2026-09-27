"use client"

import { useState } from "react"
import { Check, Copy, RotateCcw, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import {
  BUILT_IN_PRESETS,
  DEFAULT_THEME_STATE,
  activateTheme,
  duplicateTheme,
  getActiveTheme,
  removeTheme,
  resolveTokens,
  upsertTheme,
  type ThemeTemplate,
} from "@/lib/settings/theme"
import { cn } from "@/lib/utils"
import { ThemePreview } from "./theme-preview"

function Swatch({ theme }: { theme: ThemeTemplate }) {
  const t = resolveTokens(theme, "dark")
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="size-6 rounded-full ring-1 ring-border" style={{ background: t.accent }} />
      <span className="size-6 rounded-full ring-1 ring-border" style={{ background: t.accentMuted }} />
    </div>
  )
}

export function ActivePresets() {
  const { settings, update } = useStoreSettings()
  const state = settings.theme
  const active = getActiveTheme(state)
  const [previewId, setPreviewId] = useState(active.id)

  const previewTheme = state.themes.find((t) => t.id === previewId) ?? active
  const installedIds = new Set(state.themes.map((t) => t.id))

  function activate(id: string) {
    update({ theme: activateTheme(state, id) })
    setPreviewId(id)
    toast.success("Theme activated")
  }

  function install(preset: ThemeTemplate) {
    const next = upsertTheme(state, preset)
    update({ theme: activateTheme(next, preset.id) })
    setPreviewId(preset.id)
    toast.success(`${preset.name} activated`)
  }

  function duplicate(theme: ThemeTemplate) {
    const id = `${theme.id}-copy-${Date.now().toString(36)}`
    const copy = duplicateTheme(theme, id, `${theme.name} copy`)
    update({ theme: upsertTheme(state, copy) })
    setPreviewId(id)
    toast.success("Template duplicated")
  }

  function del(theme: ThemeTemplate) {
    if (state.themes.length <= 1) {
      toast.error("Keep at least one theme")
      return
    }
    const next = removeTheme(state, theme.id)
    update({ theme: next })
    setPreviewId(next.activeThemeId)
    toast.success("Template removed")
  }

  function reset() {
    update({ theme: DEFAULT_THEME_STATE })
    setPreviewId(DEFAULT_THEME_STATE.activeThemeId)
    toast.success("Reset to default theme")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Your themes</h3>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs">
              <RotateCcw className="size-3.5" />
              Reset to default
            </Button>
          </div>
          <ul className="space-y-2">
            {state.themes.map((theme) => {
              const isActive = theme.id === state.activeThemeId
              return (
                <li
                  key={theme.id}
                  onMouseEnter={() => setPreviewId(theme.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    isActive ? "border-accent-teal/50 bg-accent-teal/8" : "border-border hover:border-accent-teal/30",
                  )}
                >
                  <Swatch theme={theme} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{theme.name}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {theme.kind} · {theme.headingStyle}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-accent-teal/15 px-2.5 py-1 text-[11px] font-medium text-accent-teal">
                      <Star className="size-3" aria-hidden />
                      Active
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => activate(theme.id)} className="gap-1 text-xs">
                      <Check className="size-3.5" />
                      Activate
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => duplicate(theme)}
                    title="Duplicate"
                    aria-label={`Duplicate ${theme.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent-teal/12 hover:text-accent-teal"
                  >
                    <Copy className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => del(theme)}
                    disabled={theme.kind === "system" || state.themes.length <= 1}
                    title={theme.kind === "system" ? "Built-in themes can't be deleted" : "Delete"}
                    aria-label={`Delete ${theme.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Presets</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Start from a built-in palette. Activating a preset adds it to your themes.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {BUILT_IN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onMouseEnter={() => setPreviewId(preset.id)}
                onClick={() => install(preset)}
                className="group rounded-xl border border-border p-3 text-left transition-colors hover:border-accent-teal/40"
              >
                <Swatch theme={preset} />
                <p className="mt-2 text-sm font-medium text-foreground">{preset.name}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {installedIds.has(preset.id) ? "installed" : preset.headingStyle}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <ThemePreview theme={previewTheme} />
      </div>
    </div>
  )
}
