"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OfferTag } from "@/lib/auth/types"
import { OfferChip, offerSummary } from "./customer-badges"

type OfferKind = OfferTag["kind"]

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `offer_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/**
 * Manages a customer's personal offer tags. These are internal *labels* for the
 * team — the real discount is always enforced by Stripe at checkout, so nothing
 * here touches payment data. Changes are pushed up via onChange for the parent
 * to persist through the AuthAdapter.
 */
export function OfferEditor({
  offers,
  onChange,
}: {
  offers: OfferTag[]
  onChange: (next: OfferTag[]) => void
}) {
  const [kind, setKind] = useState<OfferKind>("percent")
  const [value, setValue] = useState("10")
  const [label, setLabel] = useState("")
  const [note, setNote] = useState("")

  function add() {
    const trimmedLabel = label.trim()
    const numeric = Number(value)
    let resolvedLabel = trimmedLabel
    if (!resolvedLabel) {
      if (kind === "percent") resolvedLabel = `${Number.isFinite(numeric) ? numeric : 0}% off`
      else if (kind === "shipping") resolvedLabel = "Free shipping"
      else resolvedLabel = "Special offer"
    }

    const offer: OfferTag = {
      id: createId(),
      label: resolvedLabel,
      kind,
      value: kind === "percent" ? (Number.isFinite(numeric) ? numeric : 0) : undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onChange([...offers, offer])
    setLabel("")
    setNote("")
  }

  function remove(id: string) {
    onChange(offers.filter((o) => o.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {offers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {offers.map((o) => (
            <OfferChip key={o.id} offer={o} onRemove={() => remove(o.id)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No offers yet. Tag this customer with a personal deal — your team sees it here and Stripe
          enforces the real discount at checkout.
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={kind} onValueChange={(v) => setKind(v as OfferKind)}>
            <SelectTrigger className="h-9 sm:w-40" aria-label="Offer type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent off</SelectItem>
              <SelectItem value="shipping">Free shipping</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {kind === "percent" ? (
            <div className="relative sm:w-28">
              <Input
                type="number"
                min={1}
                max={100}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-9 pr-7"
                aria-label="Percent amount"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          ) : null}

          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={kind === "custom" ? "Offer label" : "Label (optional)"}
            className="h-9 flex-1"
            aria-label="Offer label"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)"
            className="h-9 flex-1"
            aria-label="Offer note"
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Add offer
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Preview:{" "}
          <span className="text-foreground">
            {offerSummary({
              id: "preview",
              label: label.trim(),
              kind,
              value: Number(value),
              createdAt: "",
            })}
          </span>
        </p>
      </div>
    </div>
  )
}
