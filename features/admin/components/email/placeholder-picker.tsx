"use client"

import { useId, useRef, useState, type ReactNode, type RefObject } from "react"
import { Braces, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  PLACEHOLDERS,
  PLACEHOLDER_GROUPS,
  insertAtSelection,
  placeholderToken,
  unknownPlaceholders,
} from "@/features/email/placeholders"

type TextEl = HTMLInputElement | HTMLTextAreaElement

/**
 * Returns a ref for the field plus an insert function that drops a token at the
 * caret (or replaces the selection) and restores focus after React re-renders.
 */
export function usePlaceholderInsert<T extends TextEl>(value: string, onChange: (v: string) => void) {
  const ref = useRef<T>(null)
  const insert = (key: string) => {
    const el = ref.current
    const next = insertAtSelection(value, el?.selectionStart ?? null, el?.selectionEnd ?? null, placeholderToken(key))
    onChange(next.value)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(next.caret, next.caret)
    })
  }
  return { ref: ref as RefObject<T>, insert }
}

export function PlaceholderPicker({ onInsert, label = "Insert placeholder" }: { onInsert: (key: string) => void; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-accent-teal"
          aria-label={label}
        >
          <Braces className="size-3.5" aria-hidden="true" />
          Placeholder
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-80 overflow-y-auto p-2">
          {PLACEHOLDER_GROUPS.map((group) => {
            const items = PLACEHOLDERS.filter((p) => p.group === group)
            if (!items.length) return null
            return (
              <div key={group} className="pb-2">
                <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {items.map((p) => (
                    <li key={p.key}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onInsert(p.key)
                          setOpen(false)
                        }}
                        className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-sm text-foreground">{p.label}</span>
                          <code className="font-mono text-[11px] text-accent-teal">{placeholderToken(p.key)}</code>
                        </span>
                        <span className="truncate text-xs text-muted-foreground">e.g. {p.sample}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Label + input (or textarea) with a placeholder picker that inserts at the
 * caret, plus inline typo warnings. `children` renders below (e.g. quality hints).
 */
export function PlaceholderField({
  id,
  label,
  value,
  onChange,
  multiline,
  placeholder,
  disabled,
  children,
}: {
  id?: string
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
  disabled?: boolean
  children?: ReactNode
}) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const { ref: inputRef, insert: insertIntoInput } = usePlaceholderInsert<HTMLInputElement>(value, onChange)
  const { ref: areaRef, insert: insertIntoArea } = usePlaceholderInsert<HTMLTextAreaElement>(value, onChange)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        {disabled ? null : <PlaceholderPicker onInsert={multiline ? insertIntoArea : insertIntoInput} label={`Insert placeholder into ${label}`} />}
      </div>
      {multiline ? (
        <Textarea id={fieldId} ref={areaRef} value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} disabled={disabled} />
      ) : (
        <Input id={fieldId} ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
      )}
      <PlaceholderWarning value={value} onChange={onChange} />
      {children}
    </div>
  )
}

/** Inline warning for unknown {{placeholders}}, with a one-click fix when a close match exists. */
export function PlaceholderWarning({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const unknown = unknownPlaceholders(value)
  if (!unknown.length) return null
  return (
    <ul className="flex flex-col gap-1" aria-live="polite">
      {unknown.map(({ key, suggestion }) => (
        <li key={key} className="flex flex-wrap items-center gap-1.5 text-xs text-amber-500">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <code className="font-mono">{placeholderToken(key)}</code> isn&apos;t a known placeholder and will send blank.
          </span>
          {suggestion ? (
            <button
              type="button"
              onClick={() =>
                onChange(value.replace(new RegExp(`\\{\\{\\s*${key.replace(/\./g, "\\.")}\\s*\\}\\}`, "g"), placeholderToken(suggestion)))
              }
              className="font-medium text-accent-teal underline-offset-2 hover:underline"
            >
              Did you mean {placeholderToken(suggestion)}?
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
