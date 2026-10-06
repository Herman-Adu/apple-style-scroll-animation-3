"use client"

import { use, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Minus, Pencil, Plus, PlusCircle, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCatalog } from "@/features/catalog"
import type { Product } from "@/features/products"
import { effectiveStock } from "@/features/products"
import { sortByWaiting, waitingFor, type WaitingByProduct } from "@/features/stock-alerts"
import { formatMoney } from "@/lib/format"
import { StockBadge } from "./status-badges"
import { ProductFormDialog } from "./product-form-dialog"
import { ColumnsMenu, type ColumnOption } from "./columns-menu"

const PRODUCT_COLUMNS: ColumnOption[] = [{ key: "category", label: "Category" }]

type WaitingSort = "none" | "desc" | "asc"

const NEXT_WAITING_SORT: Record<WaitingSort, WaitingSort> = { none: "desc", desc: "asc", asc: "none" }
const WAITING_ARIA_SORT = { none: "none", desc: "descending", asc: "ascending" } as const

export function ProductManager({ demandPromise }: { demandPromise: Promise<WaitingByProduct> }) {
  const { products, createProduct, updateProduct, deleteProduct, adjustStock } = useCatalog()
  const waiting = use(demandPromise)
  const [waitingSort, setWaitingSort] = useState<WaitingSort>("none")
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<Product | undefined>(undefined)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(["category"]))

  function toggleCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matching = q ? products.filter((p) => [p.name, p.category].some((f) => f.toLowerCase().includes(q))) : products
    return waitingSort === "none" ? matching : sortByWaiting(matching, waiting, waitingSort)
  }, [products, query, waiting, waitingSort])

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!pendingDelete) return
    deleteProduct(pendingDelete.slug)
    toast.success(`Deleted ${pendingDelete.name}`)
    setPendingDelete(undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnsMenu columns={PRODUCT_COLUMNS} hidden={hiddenCols} onToggle={toggleCol} />
          <Button onClick={openCreate} className="gap-2">
            <PlusCircle className="size-4" aria-hidden />
            New product
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Product</th>
                {!hiddenCols.has("category") ? <th className="px-4 py-3 font-medium">Category</th> : null}
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" aria-sort={WAITING_ARIA_SORT[waitingSort]}>
                  <button
                    type="button"
                    onClick={() => setWaitingSort(NEXT_WAITING_SORT[waitingSort])}
                    className="inline-flex items-center gap-1 uppercase tracking-widest transition-colors hover:text-foreground"
                  >
                    Waiting
                    {waitingSort === "desc" ? (
                      <ArrowDown className="size-3" aria-hidden />
                    ) : waitingSort === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : (
                      <ArrowUpDown className="size-3" aria-hidden />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.slug} className="transition-colors hover:bg-accent-teal/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="size-8 shrink-0 rounded-md border border-border"
                          style={{ backgroundColor: product.accent }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    {!hiddenCols.has("category") ? (
                      <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                    ) : null}
                    <td className="px-4 py-3 font-mono tabular-nums">{formatMoney(product.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjustStock(product.slug, -1)}
                          disabled={product.stock <= 0}
                          className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          aria-label={`Decrease stock of ${product.name}`}
                        >
                          <Minus className="size-3" aria-hidden />
                        </button>
                        <span className="w-10 text-center font-mono tabular-nums">{effectiveStock(product)}</span>
                        <button
                          type="button"
                          onClick={() => adjustStock(product.slug, 1)}
                          className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Increase stock of ${product.name}`}
                        >
                          <Plus className="size-3" aria-hidden />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge product={product} />
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {waitingFor(waiting, product.slug) > 0 ? (
                        <span aria-label={`${waitingFor(waiting, product.slug)} waiting for ${product.name}`}>
                          {waitingFor(waiting, product.slug)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground" aria-label={`Nobody waiting for ${product.name}`}>
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent-teal/10 hover:text-accent-teal"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(product)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        onCreate={(input) => {
          const created = createProduct(input)
          toast.success(`Created ${created.name}`)
        }}
        onUpdate={(slug, patch) => {
          updateProduct(slug, patch)
          toast.success("Product updated")
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from the catalog and storefront. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
