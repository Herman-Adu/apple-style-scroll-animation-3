"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Ban, Mail, ShieldCheck, ShieldOff, Undo2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
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
import { formatMoney, formatDate } from "@/lib/format"
import { UserAvatar } from "@/components/account/user-avatar"
import { OrderStatusBadge } from "./status-badges"
import { CustomerStatusBadge, RoleBadge } from "./customer-badges"
import { OfferEditor } from "./offer-editor"
import { useAdminCustomers } from "../hooks/use-admin-customers"
import { sendPersonalOffer } from "@/features/email"
import type { OfferTag } from "@/lib/auth/types"

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter()
  const { records, loading, setStatus, setRole, setNewsletter, setOffers } = useAdminCustomers()
  const [confirm, setConfirm] = useState<null | "block" | "role">(null)

  const record = useMemo(
    () => records.find((r) => r.user.id === customerId) ?? null,
    [records, customerId],
  )

  if (loading && !record) {
    return <p className="py-10 text-center text-muted-foreground">Loading customer…</p>
  }

  if (!record) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-muted-foreground">That customer could not be found.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2"
        >
          <ArrowLeft className="size-4" /> Back to customers
        </Link>
      </div>
    )
  }

  const { user, stats } = record
  const blocked = user.status === "blocked"
  const isAdmin = record.effectiveRole === "admin"
  const currency = stats.currency

  async function onToggleBlock() {
    setConfirm(null)
    await setStatus(user.id, blocked ? "active" : "blocked")
    toast.success(blocked ? `${user.name} unblocked` : `${user.name} blocked`)
  }

  async function onToggleRole() {
    setConfirm(null)
    await setRole(user.id, isAdmin ? "customer" : "admin")
    toast.success(isAdmin ? `${user.name} is now a customer` : `${user.name} is now an admin`)
  }

  async function onToggleNewsletter(next: boolean) {
    await setNewsletter(user.id, next)
    toast.success(next ? "Subscribed to newsletter" : "Unsubscribed from newsletter")
  }

  async function onOffersChange(next: OfferTag[]) {
    await setOffers(user.id, next)
  }

  /** Deliver the branded offer email, then stamp notifiedAt on success. */
  async function emailOffer(offer: OfferTag): Promise<boolean> {
    const res = await sendPersonalOffer({
      to: user.email,
      name: user.name,
      offer: {
        label: offer.label,
        kind: offer.kind,
        value: offer.value,
        expiresAt: offer.expiresAt,
        note: offer.note,
      },
    })
    if (!res.ok) {
      toast.error(res.error ?? "The offer email failed to send.")
      return false
    }
    if (res.skipped) {
      toast("Email skipped — Resend isn't configured.")
      return false
    }
    return true
  }

  /** Add path when "Email the customer" is on: persist, send, then stamp. */
  async function onOfferNotify(offer: OfferTag) {
    const next = [...(user.offers ?? []), offer]
    await setOffers(user.id, next)
    const sent = await emailOffer(offer)
    if (!sent) return
    await setOffers(
      user.id,
      next.map((o) => (o.id === offer.id ? { ...o, notifiedAt: new Date().toISOString() } : o)),
    )
    toast.success(`Offer emailed to ${user.email}`)
  }

  /** Re-send the branded email for an existing offer and re-stamp notifiedAt. */
  async function onOfferResend(offer: OfferTag) {
    const sent = await emailOffer(offer)
    if (!sent) return
    await setOffers(
      user.id,
      (user.offers ?? []).map((o) =>
        o.id === offer.id ? { ...o, notifiedAt: new Date().toISOString() } : o,
      ),
    )
    toast.success(`Offer re-sent to ${user.email}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/customers")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Customers
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} src={user.profile.avatarUrl} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <RoleBadge role={record.effectiveRole} />
              <CustomerStatusBadge status={user.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/email?to=${encodeURIComponent(user.email)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <Mail className="size-4" /> Email
          </Link>
          <button
            type="button"
            onClick={() => setConfirm("role")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            {isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
            {isAdmin ? "Demote" : "Make admin"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm("block")}
            className={
              blocked
                ? "inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-foreground/5"
                : "inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
            }
          >
            {blocked ? <Undo2 className="size-4" /> : <Ban className="size-4" />}
            {blocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Lifetime spend"
          value={formatMoney({ amount: stats.lifetimeSpend, currency })}
        />
        <StatCard label="Orders" value={String(stats.orderCount)} sub={`${stats.unitCount} units`} />
        <StatCard
          label="Avg. order"
          value={formatMoney({ amount: stats.avgOrderValue, currency })}
        />
        <StatCard
          label="Last order"
          value={stats.lastOrderAt ? formatDate(stats.lastOrderAt) : "—"}
          sub={stats.firstOrderAt ? `First ${formatDate(stats.firstOrderAt)}` : "No orders yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: offers + account */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Personal offers</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Internal deal tags for this customer.
            </p>
            <div className="mt-4">
              <OfferEditor
                offers={user.offers ?? []}
                onChange={onOffersChange}
                onNotify={onOfferNotify}
                onResend={onOfferResend}
                customerName={user.name}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Account</h3>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Newsletter</p>
                  <p className="text-xs text-muted-foreground">Marketing &amp; product updates</p>
                </div>
                <Switch
                  checked={user.profile.newsletter}
                  onCheckedChange={onToggleNewsletter}
                  aria-label="Toggle newsletter subscription"
                />
              </div>

              {user.profile.interests.length > 0 ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Interests
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.profile.interests.map((i) => (
                      <span
                        key={i}
                        className="rounded-full border border-border bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {user.profile.bio ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Bio</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user.profile.bio}</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Right: purchases + order history */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Products purchased</h3>
              <span className="text-xs text-muted-foreground">{stats.products.length} distinct</span>
            </div>
            {stats.products.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No purchases yet.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {stats.products.map((p) => (
                  <div
                    key={p.slug}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground"> · {p.quantity} units</span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      {formatMoney({ amount: p.revenue, currency })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Order history</h3>
              <Link
                href="/admin/orders"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                All orders
              </Link>
            </div>
            {stats.orders.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="mt-4 flex flex-col divide-y divide-border">
                {stats.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-medium">{order.number}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)} · {order.items.reduce((n, i) => n + i.quantity, 0)} items
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums">
                      {formatMoney({ amount: order.total, currency: order.currency })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Card numbers, billing details and payment methods are handled by Stripe and Clerk — they are
        never stored in or shown by this dashboard.
      </p>

      {/* Confirm dialogs */}
      <AlertDialog open={confirm === "block"} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{blocked ? "Unblock this customer?" : "Block this customer?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {blocked
                ? `${user.name} will be able to sign in and place orders again.`
                : `${user.name} will be signed out and refused at sign-in until unblocked. Their orders and history are kept.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onToggleBlock}>
              {blocked ? "Unblock" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === "role"} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAdmin ? "Demote to customer?" : "Promote to admin?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? `${user.name} will lose access to the admin dashboard.`
                : `${user.name} will gain full access to the admin dashboard, including products, orders and other customers.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onToggleRole}>
              {isAdmin ? "Demote" : "Promote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
