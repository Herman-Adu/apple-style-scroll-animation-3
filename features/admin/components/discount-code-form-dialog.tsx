"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DiscountCode, DiscountCodeInput, DiscountCodeKind } from "@/features/discount-codes"

interface FormState {
  code: string
  label: string
  kind: DiscountCodeKind
  value: string
  expiresAt: string
  minSubtotal: string
  maxRedemptions: string
}

function toForm(discountCode?: DiscountCode): FormState {
  return {
    code: discountCode?.code ?? "",
    label: discountCode?.label ?? "",
    kind: discountCode?.kind ?? "percent",
    value: discountCode?.value != null ? String(discountCode.value) : "",
    expiresAt: discountCode?.expiresAt ? discountCode.expiresAt.slice(0, 10) : "",
    minSubtotal: discountCode?.minSubtotal != null ? String(discountCode.minSubtotal) : "",
    maxRedemptions: discountCode?.maxRedemptions != null ? String(discountCode.maxRedemptions) : "",
  }
}

export function DiscountCodeFormDialog({
  open,
  onOpenChange,
  discountCode,
  onCreate,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Provided when editing; omit to create. */
  discountCode?: DiscountCode
  onCreate: (input: DiscountCodeInput) => Promise<void>
  onUpdate: (id: string, input: DiscountCodeInput) => Promise<void>
}) {
  const editing = Boolean(discountCode)
  const [form, setForm] = useState<FormState>(() => toForm(discountCode))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(toForm(discountCode))
      setError(null)
    }
  }, [open, discountCode])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function submit() {
    if (!form.code.trim()) return setError("Enter a code.")
    if (!form.label.trim()) return setError("Enter a label.")

    let value: number | undefined
    if (form.kind === "percent") {
      value = Number(form.value)
      if (!Number.isFinite(value) || value <= 0 || value > 100) {
        return setError("Percent must be between 1 and 100.")
      }
    }

    const minSubtotal = form.minSubtotal.trim() ? Number(form.minSubtotal) : undefined
    if (minSubtotal !== undefined && (!Number.isFinite(minSubtotal) || minSubtotal < 0)) {
      return setError("Minimum spend must be a valid amount.")
    }

    const maxRedemptions = form.maxRedemptions.trim() ? Number(form.maxRedemptions) : undefined
    if (maxRedemptions !== undefined && (!Number.isInteger(maxRedemptions) || maxRedemptions <= 0)) {
      return setError("Redemption limit must be a whole number greater than 0.")
    }

    const payload: DiscountCodeInput = {
      code: form.code.trim(),
      label: form.label.trim(),
      kind: form.kind,
      value,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      minSubtotal,
      maxRedemptions,
    }

    setSaving(true)
    try {
      if (editing && discountCode) {
        await onUpdate(discountCode.id, payload)
      } else {
        await onCreate(payload)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>{editing ? "Edit discount code" : "New discount code"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Update this code. Changes apply to checkouts started after saving."
              : "Create a store-wide code customers can enter at checkout."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dc-code">Code</Label>
            <Input
              id="dc-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="font-mono uppercase tracking-wider"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dc-label">Label</Label>
            <Input
              id="dc-label"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Summer sale — 20% off"
            />
            <p className="text-xs text-muted-foreground">Shown to the customer at checkout and on the order.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dc-kind">Type</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind", v as DiscountCodeKind)}>
                <SelectTrigger id="dc-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent off</SelectItem>
                  <SelectItem value="shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.kind === "percent" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="dc-value">Percent off</Label>
                <Input
                  id="dc-value"
                  inputMode="numeric"
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  placeholder="20"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dc-min">Minimum spend</Label>
              <Input
                id="dc-min"
                inputMode="numeric"
                value={form.minSubtotal}
                onChange={(e) => set("minSubtotal", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dc-max">Redemption limit</Label>
              <Input
                id="dc-max"
                inputMode="numeric"
                value={form.maxRedemptions}
                onChange={(e) => set("maxRedemptions", e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dc-expires">Expires</Label>
            <Input
              id="dc-expires"
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave blank for a code that never expires.</p>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {editing ? "Save changes" : "Create code"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
