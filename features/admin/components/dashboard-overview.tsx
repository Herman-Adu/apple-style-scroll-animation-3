"use client"

import Link from "next/link"
import { AlertTriangle, DollarSign, Package, Receipt, TrendingUp } from "lucide-react"
import { useCatalog } from "@/features/catalog"
import { inventorySummary, salesSummary, topProducts } from "@/features/orders"
import { formatMoney } from "@/lib/format"
import { StatCard } from "./stat-card"
import { StockBadge } from "./status-badges"
import { useAdminOrders } from "../hooks/use-admin-orders"

export function DashboardOverview() {
  const { products } = useCatalog()
  const { orders, loading } = useAdminOrders()

  const sales = salesSummary(orders)
  const inventory = inventorySummary(products)
  const best = topProducts(orders, 5)
  const currency = sales.currency

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatMoney({ amount: sales.revenue, currency })}
          hint={`${sales.orderCount} orders · avg ${formatMoney({ amount: Math.round(sales.averageOrderValue), currency })}`}
          icon={DollarSign}
        />
        <StatCard label="Units sold" value={sales.unitsSold.toLocaleString()} hint="Across all fulfilled orders" icon={TrendingUp} />
        <StatCard
          label="Products"
          value={inventory.totalProducts.toLocaleString()}
          hint={`${inventory.totalUnits.toLocaleString()} units in stock`}
          icon={Package}
        />
        <StatCard
          label="Low / out of stock"
          value={`${inventory.lowStockCount} / ${inventory.outOfStockCount}`}
          hint="Needs restocking"
          icon={AlertTriangle}
          tone={inventory.outOfStockCount > 0 ? "danger" : inventory.lowStockCount > 0 ? "warning" : "default"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Restock alerts</h2>
            <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground">
              Manage
            </Link>
          </div>
          <div className="divide-y divide-border">
            {inventory.lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Everything is well stocked.</p>
            ) : (
              inventory.lowStock.map((product) => (
                <div key={product.slug} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <StockBadge product={product} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top sellers */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Top sellers</h2>
            <Link href="/admin/analytics" className="text-xs text-muted-foreground hover:text-foreground">
              Analytics
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : best.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              best.map((p, i) => (
                <div key={p.slug} className="flex items-center justify-between px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular-nums">{p.unitsSold} units</p>
                    <p className="text-xs text-muted-foreground">{formatMoney({ amount: p.revenue, currency })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
