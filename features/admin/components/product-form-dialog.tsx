"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Product } from "@/features/products"
import type { NewProductInput, ProductPatch } from "@/features/catalog"

const CATEGORIES: Product["category"][] = ["Headphones", "Earbuds", "Speakers"]
const RELEASE_STATUSES: { value: Product["releaseStatus"]; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "preorder", label: "Pre-order" },
  { value: "coming-soon", label: "Coming soon" },
]

interface FormState {
  name: string
  category: Product["category"]
  priceAmount: string
  currency: string
  tagline: string
  summary: string
  releaseStatus: Product["releaseStatus"]
  stock: string
  lowStockThreshold: string
  featured: boolean
}

function toForm(product?: Product): FormState {
  return {
    name: product?.name ?? "",
    category: product?.category ?? "Headphones",
    priceAmount: product ? String(product.price.amount) : "",
    currency: product?.price.currency ?? "USD",
    tagline: product?.tagline ?? "",
    summary: product?.summary ?? "",
    releaseStatus: product?.releaseStatus ?? "available",
    stock: product ? String(product.stock) : "0",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "5",
    featured: product?.featured ?? false,
  }
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onCreate,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Provided when editing; omit to create. */
  product?: Product
  onCreate: (input: NewProductInput) => void
  onUpdate: (slug: string, patch: ProductPatch) => void
}) {
  const editing = Boolean(product)
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [error, setError] = useState<string | null>(null)

  // Reset the form whenever the sheet opens for a different product.
  useEffect(() => {
    if (open) {
      setForm(toForm(product))
      setError(null)
    }
  }, [open, product])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function submit() {
    const priceAmount = Number(form.priceAmount)
    const stock = Number(form.stock)
    const lowStockThreshold = Number(form.lowStockThreshold)

    if (!form.name.trim()) return setError("Name is required.")
    if (!Number.isFinite(priceAmount) || priceAmount < 0) return setError("Enter a valid price.")
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number.")
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)
      return setError("Low-stock threshold must be a whole number.")

    const payload = {
      name: form.name.trim(),
      category: form.category,
      priceAmount,
      currency: form.currency,
      tagline: form.tagline,
      summary: form.summary,
      releaseStatus: form.releaseStatus,
      stock,
      lowStockThreshold,
      featured: form.featured,
    }

    if (editing && product) {
      onUpdate(product.slug, payload)
    } else {
      onCreate(payload)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>{editing ? "Edit product" : "New product"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the catalog entry. Changes reflect on the storefront immediately."
              : "Create a catalog entry. Rich marketing content can be added later once Strapi is connected."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Momo X" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as Product["category"])}>
                <SelectTrigger id="p-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-status">Release status</Label>
              <Select
                value={form.releaseStatus}
                onValueChange={(v) => set("releaseStatus", v as Product["releaseStatus"])}
              >
                <SelectTrigger id="p-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELEASE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-price">Price</Label>
              <Input
                id="p-price"
                inputMode="numeric"
                value={form.priceAmount}
                onChange={(e) => set("priceAmount", e.target.value)}
                placeholder="499"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-currency">Currency</Label>
              <Input id="p-currency" value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-stock">Stock</Label>
              <Input
                id="p-stock"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-threshold">Low-stock threshold</Label>
              <Input
                id="p-threshold"
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-tagline">Tagline</Label>
            <Input
              id="p-tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Pure Sound. Zero Compromise."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-summary">Summary</Label>
            <Textarea
              id="p-summary"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              rows={3}
              placeholder="Short description shown on product cards."
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <Label htmlFor="p-featured" className="cursor-pointer">
                Featured
              </Label>
              <p className="text-xs text-muted-foreground">Show first in listings.</p>
            </div>
            <Switch id="p-featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? "Save changes" : "Create product"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
