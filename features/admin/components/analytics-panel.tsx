"use client"

import { useMemo } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DollarSign, Receipt, ShoppingBag, TrendingUp } from "lucide-react"
import { useCatalog } from "@/features/catalog"
import { ordersByStatus, revenueByDay, salesSummary, topProducts } from "@/features/orders"
import { formatMoney } from "@/lib/format"
import { StatCard } from "./stat-card"
import { useAdminOrders } from "../hooks/use-admin-orders"

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso))
}

export function AnalyticsPanel() {
  const { products } = useCatalog()
  const { orders, loading } = useAdminOrders()

  const sales = salesSummary(orders)
  const currency = sales.currency
  const revenueSeries = useMemo(() => revenueByDay(orders, 30).map((p) => ({ ...p, label: shortDate(p.date) })), [orders])
  const best = useMemo(() => topProducts(orders, 6), [orders])
  const statuses = useMemo(() => ordersByStatus(orders), [orders])

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics…</p>
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm font-medium">No sales data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Analytics populate automatically as orders come in. Place a test order from the storefront to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney({ amount: sales.revenue, currency })} icon={DollarSign} />
        <StatCard label="Orders" value={sales.orderCount.toLocaleString()} icon={Receipt} />
        <StatCard label="Units sold" value={sales.unitsSold.toLocaleString()} icon={ShoppingBag} />
        <StatCard
          label="Avg order value"
          value={formatMoney({ amount: Math.round(sales.averageOrderValue), currency })}
          icon={TrendingUp}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Revenue · last 30 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(value: number) => [formatMoney({ amount: value, currency }), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-foreground)"
                strokeWidth={2}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Best sellers · units</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={best} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-foreground)", opacity: 0.05 }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                  formatter={(value: number) => [`${value} units`, "Sold"]}
                />
                <Bar dataKey="unitsSold" fill="var(--color-foreground)" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Orders by status</h2>
          <div className="mt-4 flex flex-col gap-3">
            {statuses.map((s) => {
              const pct = orders.length > 0 ? (s.count / orders.length) * 100 : 0
              return (
                <div key={s.status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{s.status}</span>
                    <span className="font-mono tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
