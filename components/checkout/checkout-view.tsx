"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { formatMoney } from "@/lib/format"

export function CheckoutView() {
  const { lines, subtotal, currency, itemCount, clear } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [placed, setPlaced] = useState(false)

  const displayName = user?.profile.displayName || user?.name || "there"

  function placeOrder() {
    // Demo order placement. A real integration (e.g. Stripe) would create a
    // server-side session here from the authenticated user's cart.
    setPlaced(true)
    clear()
  }

  if (placed) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
          <ShoppingBag className="h-7 w-7 text-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">Order confirmed</h1>
        <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-foreground/50">
          Thanks, {displayName}. A confirmation is on its way to {user?.email}. You can track this
          order from your account.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account"
            className="rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
          >
            Go to account
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-foreground/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:bg-foreground/5"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

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
                <dd className="text-foreground">{formatMoney({ amount: subtotal, currency })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-foreground/50">Shipping</dt>
                <dd className="text-foreground/70">Calculated next step</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-4">
              <span className="text-sm text-foreground/50">Total</span>
              <span className="text-lg font-semibold text-foreground">
                {formatMoney({ amount: subtotal, currency })}
              </span>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
            >
              <Lock className="h-3.5 w-3.5" strokeWidth={2} />
              Place order
            </button>
            <p className="mt-3 text-center text-xs text-foreground/40">
              Secure checkout. You&apos;re signed in as {user?.email}.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
