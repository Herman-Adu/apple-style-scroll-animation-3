"use client"

import type { CSSProperties } from "react"
import { TwoToneTitle } from "@/components/primitives/two-tone-title"
import { resolveTokens, type ColorScheme, type ThemeTemplate } from "@/lib/settings/theme"
import { cn } from "@/lib/utils"

/** CSS custom props scoped to the preview so it re-themes independently of the
 * globally injected `<style id="brand-theme">` — lets admins see a draft before
 * they save it as the live theme. */
function scopeStyle(theme: ThemeTemplate, scheme: ColorScheme): CSSProperties {
  const t = resolveTokens(theme, scheme)
  return {
    "--accent-teal": t.accent,
    "--accent-teal-muted": t.accentMuted,
    "--brand-gradient-from": t.gradientFrom,
    "--brand-gradient-to": t.gradientTo,
  } as CSSProperties
}

/**
 * Reusable, self-contained sample of every surface the theme touches — a hero
 * H1, a section heading, a button, a filter pill, a "today" row, and an email
 * snippet — so every Theme sub-page previews the exact same tokens.
 */
export function ThemePreview({ theme, className }: { theme: ThemeTemplate; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Live preview</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {theme.headingStyle}
        </span>
      </div>

      {/* Cinematic dark surface — mirrors the scroll heroes. */}
      <div
        data-heading-style={theme.headingStyle}
        style={scopeStyle(theme, "dark")}
        className="overflow-hidden rounded-2xl border border-border bg-media p-6 text-on-media"
      >
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.35em] text-on-media-muted">Introducing</p>
        <h3 className="text-4xl font-bold tracking-tight">
          <TwoToneTitle title="Momo X" />
        </h3>
        <p className="mt-2 text-sm text-on-media-muted">Pure sound. Zero compromise.</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-accent-teal px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Pre-order
          </button>
          <span className="rounded-full border border-accent-teal/40 bg-accent-teal/12 px-3 py-1 text-xs font-medium text-accent-teal">
            Active filter
          </span>
        </div>
      </div>

      {/* App surface — mirrors section headings + today row. */}
      <div
        data-heading-style={theme.headingStyle}
        style={scopeStyle(theme, "dark")}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">The collection</p>
        <h3>
          <TwoToneTitle
            title="Engineered for every kind of listening."
            className="text-2xl font-bold tracking-tight text-foreground"
          />
        </h3>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-teal/10 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-accent-teal">
            Sunday
            <span className="rounded bg-accent-teal/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Today
            </span>
          </span>
          <span className="text-muted-foreground">Closed</span>
        </div>
      </div>

      {/* Email snippet — proves emails inherit the same accent. */}
      <div className="rounded-2xl border border-border bg-card p-6" style={scopeStyle(theme, "light")}>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Email accent</p>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="h-1.5 w-16 rounded-full" style={{ background: "var(--accent-teal)" }} aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">Welcome to Momo</p>
          <p className="mt-1 text-xs text-muted-foreground">Thanks for joining — your journey starts here.</p>
          <span
            className="mt-3 inline-block rounded-md px-3 py-1.5 text-xs font-medium text-background"
            style={{ background: "var(--accent-teal)" }}
          >
            Confirm email
          </span>
        </div>
      </div>
    </div>
  )
}
