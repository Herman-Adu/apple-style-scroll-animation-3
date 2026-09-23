"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, ArrowUpRight, BarChart3, DollarSign, Package, Receipt, Sparkles, TrendingUp } from "lucide-react"
import { useCatalog } from "@/features/catalog"
import { inventorySummary, revenueByDay, salesSummary, topProducts } from "@/features/orders"
import { formatMoney } from "@/lib/format"
import { StatCard } from "./stat-card"
import { StockBadge } from "./status-badges"
import { RadialGauge } from "./radial-gauge"
import { useAdminOrders } from "../hooks/use-admin-orders"

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso))
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

const QUICK_ACTIONS = [
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: Receipt, label: "Orders" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
]

export function DashboardOverview() {
  const reduce = useReducedMotion()
  const { products } = useCatalog()
  const { orders, loading } = useAdminOrders()

  const sales = salesSummary(orders)
  const inventory = inventorySummary(products)
  const best = topProducts(orders, 5)
  const currency = sales.currency

  const rev = useMemo(() => revenueByDay(orders, 14).map((d) => ({ ...d, label: shortDate(d.date) })), [orders])
  const revSeries = rev.map((d) => d.revenue)
  const revDelta = useMemo(() => {
    if (revSeries.length < 14) return undefined
    const prev = revSeries.slice(0, 7).reduce((a, b) => a + b, 0)
    const last = revSeries.slice(7).reduce((a, b) => a + b, 0)
    return prev > 0 ? ((last - prev) / prev) * 100 : undefined
  }, [revSeries])

  const stockHealth =
    inventory.totalProducts > 0
      ? Math.round(((inventory.totalProducts - inventory.outOfStockCount) / inventory.totalProducts) * 100)
      : 100

  const money = (n: number) => formatMoney({ amount: Math.round(n), currency })
  const count = (n: number) => Math.round(n).toLocaleString()

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} accent label="Revenue" countTo={sales.revenue} format={money} delta={revDelta} series={revSeries} icon={DollarSign} />
        <StatCard index={1} label="Units sold" countTo={sales.unitsSold} format={count} hint="Across fulfilled orders" icon={TrendingUp} />
        <StatCard index={2} label="Products" countTo={inventory.totalProducts} format={count} hint={`${inventory.totalUnits.toLocaleString()} units in stock`} icon={Package} />
        <StatCard
          index={3}
          label="Low / out of stock"
          value={`${inventory.lowStockCount} / ${inventory.outOfStockCount}`}
          hint="Needs restocking"
          icon={AlertTriangle}
          tone={inventory.outOfStockCount > 0 ? "danger" : inventory.lowStockCount > 0 ? "warning" : "default"}
        />
      </section>

      {/* Revenue trend + quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <section className="h-full rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Revenue</h2>
                <p className="text-xs text-muted-foreground">Last 14 days</p>
              </div>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Full analytics <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rev} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent-teal)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-accent-teal)" stopOpacity={0} />
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
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                    labelStyle={{ color: "var(--color-muted-foreground)" }}
                    formatter={(value: number) => [money(value), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-accent-teal)" strokeWidth={2} fill="url(#adminRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-accent-teal/25 bg-card p-6 text-center">
            <div className="accent-glow-contained pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative mt-1 flex size-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-accent-teal/25 blur-xl" aria-hidden />
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: "conic-gradient(from 0deg, transparent 10%, var(--color-accent-teal), transparent 70%)" }}
                animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <div className="absolute inset-[3px] rounded-full bg-card" />
              <Sparkles className="relative size-6 text-accent-teal" aria-hidden />
            </div>
            <h2 className="relative mt-5 text-base font-semibold text-balance">Manage your store</h2>
            <p className="relative mt-1 text-xs text-muted-foreground text-pretty">Jump straight to what needs your attention.</p>
            <div className="relative mt-5 flex items-center justify-center gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="group flex flex-col items-center gap-1.5">
                  <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors group-hover:border-accent-teal/50 group-hover:text-accent-teal">
                    <action.icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-[11px] text-muted-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>

      {/* Gauge + restock + top sellers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal>
          <section className="flex h-full flex-col items-center rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-sm font-semibold">Inventory health</h2>
              <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground">
                Manage
              </Link>
            </div>
            <div className="my-3 flex flex-1 items-center">
              <RadialGauge value={stockHealth} caption="in-stock rate" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {inventory.outOfStockCount} out of stock · {inventory.lowStockCount} running low
            </p>
          </section>
        </Reveal>

        <Reveal delay={0.06}>
          <section className="h-full rounded-2xl border border-border/70 bg-card">
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
        </Reveal>

        <Reveal delay={0.12}>
          <section className="h-full rounded-2xl border border-border/70 bg-card">
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
        </Reveal>
      </div>
    </div>
  )
}
