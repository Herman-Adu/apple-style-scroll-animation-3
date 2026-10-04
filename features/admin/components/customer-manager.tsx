"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import { UserAvatar } from "@/components/account/user-avatar"
import {
  customerKpis,
  filterBySegment,
  searchCustomers,
  sortCustomers,
  SEGMENTS,
} from "@/features/customers"
import type { CustomerRecord, CustomerSegment, CustomerSort } from "@/features/customers"
import { useAdminCustomers, type AdminCustomersData } from "../hooks/use-admin-customers"
import { CustomerStatusBadge, RoleBadge, OfferChip } from "./customer-badges"
import { isOwner } from "@/lib/auth/domain/config"
import { ColumnsMenu, type ColumnOption } from "./columns-menu"

const CUSTOMER_COLUMNS: ColumnOption[] = [
  { key: "orders", label: "Orders" },
  { key: "offers", label: "Offers" },
  { key: "joined", label: "Joined" },
]

const SORT_OPTIONS: { value: CustomerSort; label: string }[] = [
  { value: "recent", label: "Newest" },
  { value: "top-spend", label: "Top spend" },
  { value: "most-orders", label: "Most orders" },
  { value: "name", label: "Name A–Z" },
]

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

export function CustomerManager({ customersPromise }: { customersPromise: Promise<AdminCustomersData> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const segment = (searchParams.get("segment") as CustomerSegment | null) ?? "all"

  const { records, refresh } = useAdminCustomers(use(customersPromise))
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<CustomerSort>("recent")
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(["orders", "offers", "joined"]))

  function toggleCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const kpis = useMemo(() => customerKpis(records), [records])

  const visible: CustomerRecord[] = useMemo(() => {
    const bySegment = filterBySegment(records, segment)
    const bySearch = searchCustomers(bySegment, query)
    return sortCustomers(bySearch, sort)
  }, [records, segment, query, sort])

  function setSegment(next: CustomerSegment) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "all") params.delete("segment")
    else params.set("segment", next)
    const qs = params.toString()
    router.replace(qs ? `/admin/customers?${qs}` : "/admin/customers")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Customers" value={String(kpis.total)} sub={`${kpis.active} active`} />
        <KpiCard
          label="Lifetime revenue"
          value={formatMoney({ amount: kpis.lifetimeRevenue, currency: kpis.currency })}
          sub={`${kpis.paying} paying`}
        />
        <KpiCard
          label="Avg. per customer"
          value={formatMoney({ amount: kpis.avgPerCustomer, currency: kpis.currency })}
        />
        <KpiCard label="Newsletter" value={`${kpis.subscribers}`} sub="subscribed" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {SEGMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSegment(s.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                segment === s.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="h-9 w-full pl-8 sm:w-56"
              aria-label="Search customers"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as CustomerSort)}>
            <SelectTrigger className="h-9 w-36" aria-label="Sort customers">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnsMenu columns={CUSTOMER_COLUMNS} hidden={hiddenCols} onToggle={toggleCol} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {!hiddenCols.has("orders") ? <th className="px-4 py-3 font-medium">Orders</th> : null}
                <th className="px-4 py-3 font-medium">Lifetime spend</th>
                {!hiddenCols.has("offers") ? <th className="px-4 py-3 font-medium">Offers</th> : null}
                {!hiddenCols.has("joined") ? <th className="px-4 py-3 font-medium">Joined</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No customers in this view.
                  </td>
                </tr>
              ) : (
                visible.map((record) => {
                  const { user, stats } = record
                  return (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/admin/customers/${user.id}`)}
                      className="cursor-pointer transition-colors hover:bg-accent-teal/5"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} src={user.profile.avatarUrl} size={36} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium">{user.name}</p>
                              <RoleBadge role={record.effectiveRole} owner={isOwner(user.email)} />
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CustomerStatusBadge status={user.status} />
                      </td>
                      {!hiddenCols.has("orders") ? (
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{stats.orderCount}</td>
                      ) : null}
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {formatMoney({ amount: stats.lifetimeSpend, currency: stats.currency })}
                      </td>
                      {!hiddenCols.has("offers") ? (
                        <td className="px-4 py-3">
                          {user.offers && user.offers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.offers.slice(0, 2).map((o) => (
                                <OfferChip key={o.id} offer={o} />
                              ))}
                              {user.offers.length > 2 ? (
                                <span className="text-xs text-muted-foreground">
                                  +{user.offers.length - 2}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      ) : null}
                      {!hiddenCols.has("joined") ? (
                        <td className="px-4 py-3 text-muted-foreground">{record.joinedLabel}</td>
                      ) : null}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {visible.length} of {records.length}.{" "}
        <button type="button" onClick={refresh} className="underline underline-offset-2 hover:text-foreground">
          Refresh
        </button>
        . Card and payment details are managed by Stripe and never stored here.{" "}
        <Link href="/admin/orders" className="underline underline-offset-2 hover:text-foreground">
          View all orders
        </Link>
      </p>
    </div>
  )
}
