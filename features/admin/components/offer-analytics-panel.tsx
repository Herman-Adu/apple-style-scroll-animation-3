"use client"

import { useMemo } from "react"
import { BadgeCheck, Send, Ticket, TrendingUp } from "lucide-react"
import { offerAnalytics } from "@/features/customers"
import { StatCard } from "./stat-card"
import { useAdminCustomers } from "../hooks/use-admin-customers"

export function OfferAnalyticsPanel() {
  const { records, loading } = useAdminCustomers()
  const users = useMemo(() => records.map((r) => r.user), [records])
  const stats = useMemo(() => offerAnalytics(users), [users])

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading offers…</p>
  }

  if (stats.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm font-medium">No offers yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant a customer a personal offer from their profile to start tracking sends, redemptions and
          conversion here.
        </p>
      </div>
    )
  }

  const conversionPct = Math.round(stats.conversionRate * 100)
  const sentPct = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0
  const kinds = [
    { label: "Percent off", value: stats.byKind.percent },
    { label: "Free shipping", value: stats.byKind.shipping },
    { label: "Custom", value: stats.byKind.custom },
  ]
  const maxKind = Math.max(1, ...kinds.map((k) => k.value))

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offers granted" value={stats.total.toLocaleString()} icon={Ticket} index={0} />
        <StatCard
          label="Emails sent"
          value={stats.sent.toLocaleString()}
          hint={`${sentPct}% of offers`}
          icon={Send}
          index={1}
        />
        <StatCard
          label="Redeemed"
          value={stats.redeemed.toLocaleString()}
          hint={`${stats.redemptions} total use${stats.redemptions === 1 ? "" : "s"}`}
          icon={BadgeCheck}
          index={2}
        />
        <StatCard label="Conversion" value={`${conversionPct}%`} accent icon={TrendingUp} index={3} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Sent → redeemed</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Of {stats.sent} emailed offer{stats.sent === 1 ? "" : "s"}, {stats.redeemed}{" "}
            {stats.redeemed === 1 ? "has" : "have"} been used at checkout.
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-accent-teal transition-[width] duration-500"
              style={{ width: `${stats.sent > 0 ? conversionPct : 0}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-lg font-semibold tabular-nums">{stats.sent}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Emailed</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-lg font-semibold tabular-nums">{stats.redeemed}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Redeemed</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-lg font-semibold tabular-nums">{conversionPct}%</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Rate</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Offers by type</h3>
            <span className="text-xs text-muted-foreground">
              {stats.active} active · {stats.expired} expired
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {kinds.map((k) => (
              <div key={k.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{k.label}</span>
                  <span className="font-mono tabular-nums">{k.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${(k.value / maxKind) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
