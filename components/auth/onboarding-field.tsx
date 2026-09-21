"use client"

import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { OnboardingField } from "@/lib/data/onboarding"
import { cn } from "@/lib/utils"

/**
 * Renders a single onboarding field based purely on its data definition.
 * Adding a new field type is the only reason to touch this file.
 */
export function OnboardingFieldControl({
  field,
  value,
  onChange,
}: {
  field: OnboardingField
  value: unknown
  onChange: (value: unknown) => void
}) {
  const inputClass =
    "h-12 border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 focus-visible:border-foreground/30 focus-visible:ring-foreground/10"

  switch (field.type) {
    case "text":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
          aria-label={field.label}
        />
      )

    case "textarea":
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 focus-visible:border-foreground/30 focus-visible:ring-foreground/10"
          aria-label={field.label}
        />
      )

    case "single-select":
      return (
        <div className="grid gap-3">
          {field.options?.map((option) => {
            const selected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors",
                  selected
                    ? "border-foreground/40 bg-foreground/[0.06]"
                    : "border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]",
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block text-xs text-foreground/45">{option.description}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                    selected ? "border-foreground bg-foreground" : "border-foreground/30",
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-background" />}
                </span>
              </button>
            )
          })}
        </div>
      )

    case "multi-select": {
      const current = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="grid grid-cols-2 gap-3">
          {field.options?.map((option) => {
            const selected = current.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    selected
                      ? current.filter((v) => v !== option.value)
                      : [...current, option.value],
                  )
                }
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
                  selected
                    ? "border-foreground/40 bg-foreground/[0.06]"
                    : "border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                    selected ? "border-foreground bg-foreground" : "border-foreground/30",
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-background" />}
                </span>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </button>
            )
          })}
        </div>
      )
    }

    case "toggle":
      return (
        <div className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/[0.02] px-5 py-4">
          <Label htmlFor={field.key} className="text-sm text-foreground/80">
            {field.label}
          </Label>
          <Switch
            id={field.key}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      )

    default:
      return null
  }
}
