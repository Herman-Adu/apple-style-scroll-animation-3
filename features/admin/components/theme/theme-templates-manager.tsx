"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Copy, Plus, Snowflake } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import {
  activateTheme,
  duplicateTheme,
  getActiveTheme,
  resolveTokens,
  upsertTheme,
  type ThemeKind,
  type ThemeTemplate,
} from "@/lib/settings/theme"
import { cn } from "@/lib/utils"

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `theme-${Date.now().toString(36)}`
}

export function ThemeTemplatesManager() {
  const { settings, update } = useStoreSettings()
  const state = settings.theme
  const active = getActiveTheme(state)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<ThemeKind>("custom")

  function create() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Name your template")
      return
    }
    let id = slug(trimmed)
    if (state.themes.some((t) => t.id === id)) id = `${id}-${Date.now().toString(36)}`
    const created = { ...duplicateTheme(active, id, trimmed), kind }
    update({ theme: upsertTheme(state, created) })
    setName("")
    toast.success(`Created "${trimmed}" from ${active.name}`)
  }

  function duplicate(theme: ThemeTemplate) {
    const id = `${theme.id}-copy-${Date.now().toString(36)}`
    update({ theme: upsertTheme(state, duplicateTheme(theme, id, `${theme.name} copy`)) })
    toast.success("Template duplicated")
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          New theme template
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Templates start as a copy of the active theme ({active.name}). Use a <strong>Seasonal</strong> template for
          time-boxed campaigns (e.g. a future &quot;Christmas 2026&quot;) — you activate it when the campaign starts and
          switch back after.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="tpl-name">Template name</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale, Christmas 2026"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) create()
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-kind">Kind</Label>
            <div className="flex gap-1 rounded-lg border border-border p-1">
              {(["custom", "seasonal"] as const).map((k) => (
                <button
                  key={k}
                  id={k === "custom" ? "tpl-kind" : undefined}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                    kind === k ? "bg-accent-teal/15 text-accent-teal" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k === "seasonal" ? <Snowflake className="size-3.5" aria-hidden /> : null}
                  {k}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={create} className="gap-1.5">
            <Plus className="size-4" />
            Create
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">All templates</h3>
        <ul className="space-y-2">
          {state.themes.map((theme) => {
            const t = resolveTokens(theme, "dark")
            const isActive = theme.id === state.activeThemeId
            return (
              <li
                key={theme.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="size-6 rounded-full ring-1 ring-border" style={{ background: t.accent }} />
                  <span className="size-6 rounded-full ring-1 ring-border" style={{ background: t.accentMuted }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{theme.name}</p>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {theme.kind} · {theme.headingStyle}
                  </p>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-accent-teal/15 px-2.5 py-1 text-[11px] font-medium text-accent-teal">
                    Active
                  </span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => update({ theme: activateTheme(state, theme.id) })}>
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
              </li>
            )
          })}
        </ul>
      </section>

      {/* The single-source-of-truth cross-link the brief asks for. */}
      <section className="rounded-2xl border border-accent-teal/30 bg-accent-teal/[0.06] p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Emails inherit this theme</h3>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Your transactional and campaign emails use the <strong>active theme&apos;s accent</strong> automatically — one
          brand colour, everywhere. You can still set a per-email override for a specific campaign in Email settings.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/admin/email/settings">
              Email settings
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/admin/email/templates">
              Email templates
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
