"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, Lock, ShoppingBag, Tag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth/auth-context"
import { priceCheckout } from "@/features/checkout"
import type { QuoteRequestLine } from "@/features/checkout/actions"
import { EmbeddedPayment } from "@/components/checkout/embedded-payment"
import { UserAvatar } from "@/components/account/user-avatar"
import { formatMoney } from "@/lib/format"
import type { OrderItem } from "@/lib/orders/types"

export function CheckoutView() {
  const { lines, itemCount } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [pay, setPay] = useState(false)

  const displayName = user?.profile.displayName || user?.name || "there"

  // Resolve cart lines into order items, then price them with the customer's
  // personal offers. This runs the same pure engine the server uses, so the
  // savings shown here match exactly what gets charged and recorded.
  const items = useMemo<OrderItem[]>(
    () =>
      lines.map((line) => ({
        slug: line.product.slug,
        name: line.product.name,
        image: line.product.image,
        color: line.color,
        quantity: line.quantity,
        unitAmount: line.product.price.amount,
        currency: line.product.price.currency,
      })),
    [lines],
  )
  const quote = useMemo(
    () => priceCheckout({ items, offers: user?.offers ?? [] }),
    [items, user?.offers],
  )
  const savingsOffers = quote.appliedOffers.filter((offer) => offer.amount > 0)
  const labelOffers = quote.appliedOffers.filter((offer) => offer.amount === 0)

  // What the payment step sends to the server. The server re-prices from the
  // authoritative catalog and rebuilds offer discounts, so these are only a
  // request for *which* items/qty — never prices.
  const paymentLines = useMemo<QuoteRequestLine[]>(
    () =>
      lines.map((line) => ({
        slug: line.product.slug,
        color: line.color,
        quantity: line.quantity,
      })),
    [lines],
  )

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
          <ShoppingBag className="h-7 w-7 text-foreground/40" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-foreground/50">Add something you love before checking out.</p>
        <Link
          href="/products"
          className="mt-8 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
        >
          Explore products
        </Link>
      </main>
    )
  }

  // Payment step: Stripe's embedded Checkout owns the money UI (it shows the
  // itemized total, discount and shipping again inside the iframe).
  if (pay) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <button
          type="button"
          onClick={() => setPay(false)}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to review
        </button>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Payment</h1>
        <p className="mt-2 text-sm text-foreground/50">
          Paying {formatMoney({ amount: quote.total, currency: quote.currency })} — signed in as {user?.email}.
        </p>
        <div className="mt-8">
          <EmbeddedPayment lines={paymentLines} />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back
      </button>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Checkout</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-8">
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">Account</h2>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                name={user?.profile.displayName || user?.name || "You"}
                src={user?.profile.avatarUrl}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-sm text-foreground/50">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">
              Order items {itemCount > 0 && <span className="text-foreground/30">({itemCount})</span>}
            </h2>
            <ul className="mt-4 flex flex-col divide-y divide-foreground/5">
              {lines.map((line) => (
                <li key={`${line.product.slug}-${line.color}`} className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5">
                    <Image
                      src={line.product.image || "/placeholder.svg"}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{line.product.name}</p>
                      <p className="text-xs text-foreground/40">{line.color}</p>
                      <p className="mt-1 text-xs text-foreground/40">Qty {line.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {formatMoney({
                        amount: line.product.price.amount * line.quantity,
                        currency: line.product.price.currency,
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-foreground/50">Subtotal</dt>
                <dd className="text-foreground">{formatMoney({ amount: quote.subtotal, currency: quote.currency })}</dd>
              </div>
              {savingsOffers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-foreground/60">
                    <Tag className="h-3.5 w-3.5" strokeWidth={2} />
                    {offer.label}
                  </dt>
                  <dd className="font-medium text-foreground">
                    &minus;{formatMoney({ amount: offer.amount, currency: quote.currency })}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <dt className="text-foreground/50">Shipping</dt>
                <dd className="text-foreground/70">{quote.shipping === 0 ? "Free" : formatMoney({ amount: quote.shipping, currency: quote.currency })}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-4">
              <span className="text-sm text-foreground/50">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatMoney({ amount: quote.total, currency: quote.currency })}
              </span>
            </div>
            {quote.discount > 0 && (
              <p className="mt-2 text-right text-xs text-foreground/50">
                You saved {formatMoney({ amount: quote.discount, currency: quote.currency })}
              </p>
            )}
            {labelOffers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
                {labelOffers.map((offer) => (
                  <span
                    key={offer.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs text-foreground/70"
                  >
                    <Tag className="h-3 w-3" strokeWidth={2} />
                    {offer.label}
                  </span>
                ))}
              </div>
            )}
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setPay(true)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                  Continue to payment
                </button>
                <p className="mt-3 text-center text-xs text-foreground/40">
                  Secure checkout. You&apos;re signed in as {user.email}.
                </p>
              </>
            ) : (
              <>
                <Link
                  href={`/sign-in?returnTo=${encodeURIComponent("/checkout")}`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                  Sign in to pay
                </Link>
                <p className="mt-3 text-center text-xs text-foreground/40">
                  You need to be signed in to complete checkout.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
