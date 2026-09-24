"use client"

import { useState } from "react"
import { Eye, MoreHorizontal, Plus, Send, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { OfferTag } from "@/lib/auth/types"
import { OfferChip, offerSummary } from "./customer-badges"
import { OfferEmailPreview, type PreviewOffer } from "./offer-email-preview"

type OfferKind = OfferTag["kind"]

/** Expiry presets. Numeric strings are day counts; the rest are special modes. */
type DurationMode = "7" | "14" | "30" | "custom" | "none"

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `offer_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/** Resolve the chosen duration into an ISO expiry timestamp (or undefined). */
function resolveExpiry(mode: DurationMode, customDate: string): string | undefined {
  if (mode === "none") return undefined
  if (mode === "custom") {
    if (!customDate) return undefined
    // End of the selected day, local time, so the offer stays valid all day.
    const d = new Date(`${customDate}T23:59:59`)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  const days = Number(mode)
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

/** Build the human label an offer would carry given the composed fields. */
function resolveLabel(label: string, kind: OfferKind, numeric: number): string {
  const trimmed = label.trim()
  if (trimmed) return trimmed
  if (kind === "percent") return `${Number.isFinite(numeric) ? numeric : 0}% off`
  if (kind === "shipping") return "Free shipping"
  return "Special offer"
}

/**
 * Manages a customer's personal offer tags. Offers carry an optional expiry
 * (enforced by the checkout pricing engine) and can optionally trigger a branded
 * email to the customer. The discount itself is always recomputed server-side at
 * checkout, so nothing here touches payment data.
 *
 * Persistence and email are owned by the parent:
 * - `onChange` persists add/remove through the AuthAdapter.
 * - `onNotify` (when "Email the customer" is on) is the single path for an added
 *   offer: the parent persists AND emails it, stamping `notifiedAt`.
 * - `onResend` re-sends the branded email for an existing offer.
 * The admin can preview the exact branded email before sending or re-sending.
 */
export function OfferEditor({
  offers,
  onChange,
  onNotify,
  onResend,
  customerName = "",
}: {
  offers: OfferTag[]
  onChange: (next: OfferTag[]) => void
  onNotify?: (offer: OfferTag) => void
  onResend?: (offer: OfferTag) => void
  customerName?: string
}) {
  const [kind, setKind] = useState<OfferKind>("percent")
  const [value, setValue] = useState("10")
  const [label, setLabel] = useState("")
  const [note, setNote] = useState("")
  const [duration, setDuration] = useState<DurationMode>("30")
  const [customDate, setCustomDate] = useState("")
  const [notify, setNotify] = useState(true)
  const [preview, setPreview] = useState<PreviewOffer | null>(null)

  const canNotify = Boolean(onNotify)

  /** The offer the compose form currently describes — used for add + preview. */
  function composedOffer(): OfferTag {
    const numeric = Number(value)
    return {
      id: createId(),
      label: resolveLabel(label, kind, numeric),
      kind,
      value: kind === "percent" ? (Number.isFinite(numeric) ? numeric : 0) : undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      expiresAt: resolveExpiry(duration, customDate),
    }
  }

  function add() {
    const offer = composedOffer()
    // Single persistence path: when emailing, the parent both saves and sends
    // (and stamps notifiedAt) so the two writes can never race each other.
    if (notify && onNotify) onNotify(offer)
    else onChange([...offers, offer])
    setLabel("")
    setNote("")
  }

  function remove(id: string) {
    onChange(offers.filter((o) => o.id !== id))
  }

  function toPreview(offer: OfferTag): PreviewOffer {
    return { label: offer.label, kind: offer.kind, value: offer.value, expiresAt: offer.expiresAt, note: offer.note }
  }

  return (
    <div className="flex flex-col gap-4">
      {offers.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {offers.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-2">
              <OfferChip offer={o} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  aria-label={`Actions for ${o.label}`}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => setPreview(toPreview(o))}>
                    <Eye className="size-4" /> Preview email
                  </DropdownMenuItem>
                  {onResend ? (
                    <DropdownMenuItem onSelect={() => onResend(o)}>
                      <Send className="size-4" /> {o.notifiedAt ? "Resend email" : "Send email"}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => remove(o.id)}>
                    <Trash2 className="size-4" /> Remove offer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
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
          <Select value={duration} onValueChange={(v) => setDuration(v as DurationMode)}>
            <SelectTrigger className="h-9 sm:w-40" aria-label="Offer duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Expires in 7 days</SelectItem>
              <SelectItem value="14">Expires in 14 days</SelectItem>
              <SelectItem value="30">Expires in 30 days</SelectItem>
              <SelectItem value="custom">Custom date</SelectItem>
              <SelectItem value="none">No expiry</SelectItem>
            </SelectContent>
          </Select>

          {duration === "custom" ? (
            <Input
              type="date"
              value={customDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-9 sm:w-44"
              aria-label="Custom expiry date"
            />
          ) : null}

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)"
            className="h-9 flex-1"
            aria-label="Offer note"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2.5 text-sm">
            <Switch
              checked={notify && canNotify}
              onCheckedChange={setNotify}
              disabled={!canNotify}
              aria-label="Email the customer"
            />
            <span className="text-muted-foreground">Email the customer a branded offer</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview(toPreview(composedOffer()))}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              <Eye className="size-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={add}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Add offer
            </button>
          </div>
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
          {duration !== "none" ? (
            <span className="text-muted-foreground">
              {" · "}
              {duration === "custom"
                ? customDate
                  ? `expires ${customDate}`
                  : "pick a date"
                : `expires in ${duration} days`}
            </span>
          ) : (
            <span className="text-muted-foreground">{" · no expiry"}</span>
          )}
        </p>
      </div>

      <OfferEmailPreview
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        offer={preview}
        customerName={customerName}
      />
    </div>
  )
}
