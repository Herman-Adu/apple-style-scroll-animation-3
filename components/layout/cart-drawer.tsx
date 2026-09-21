"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Minus, Plus, ShoppingBag, User, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { formatMoney } from "@/lib/format"

export function CartDrawer() {
  const { isOpen, openCart, closeCart, lines, subtotal, currency, itemCount, updateQuantity, removeItem } =
    useCart()
  const { status, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthenticated = status === "authenticated" && !!user

  // Reopen the cart when the visitor returns from sign-in with a checkout intent.
  useEffect(() => {
    if (searchParams.get("checkout") === "1") {
      openCart()
    }
  }, [searchParams, openCart])

  function handleCheckout() {
    closeCart()
    if (isAuthenticated) {
      router.push("/checkout")
    } else {
      const returnTo = encodeURIComponent(`${pathname || "/"}?checkout=1`)
      router.push(`/sign-in?redirect=${returnTo}`)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden
          />
          <motion.aside
            className="glass backdrop-blur-xl backdrop-saturate-150 fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                Cart {itemCount > 0 && <span className="text-foreground/40">({itemCount})</span>}
              </h2>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {status === "authenticated" && user ? (
              <div className="flex items-center gap-3 border-b border-foreground/10 bg-foreground/[0.02] px-6 py-3">
                <UserAvatar
                  name={user.profile.displayName || user.name}
                  src={user.profile.avatarUrl}
                  size={36}
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-foreground/40">Signed in as</p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.profile.displayName || user.name}
                  </p>
                </div>
                <Link
                  href="/account"
                  onClick={closeCart}
                  className="ml-auto shrink-0 text-[11px] uppercase tracking-[0.15em] text-foreground/50 transition-colors hover:text-foreground"
                >
                  Account
                </Link>
              </div>
            ) : status === "unauthenticated" ? (
              <Link
                href="/sign-in"
                onClick={closeCart}
                className="flex items-center gap-3 border-b border-foreground/10 bg-foreground/[0.02] px-6 py-3 transition-colors hover:bg-foreground/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-foreground/50">
                  <User className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">Sign in for faster checkout</span>
                  <span className="block text-xs text-foreground/40">Save your details and track orders</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-foreground/40" strokeWidth={1.5} />
              </Link>
            ) : null}

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
                  <ShoppingBag className="h-6 w-6 text-foreground/40" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-foreground/50">Your cart is empty.</p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
                >
                  Explore products
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="flex flex-col divide-y divide-foreground/5">
                    {lines.map((line) => (
                      <li key={`${line.product.slug}-${line.color}`} className="flex gap-4 py-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5">
                          <Image
                            src={line.product.image || "/placeholder.svg"}
                            alt={line.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{line.product.name}</p>
                              <p className="text-xs text-foreground/40">{line.color}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(line.product.slug, line.color)}
                              className="text-foreground/30 transition-colors hover:text-foreground"
                              aria-label={`Remove ${line.product.name}`}
                            >
                              <X className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center gap-3 rounded-full border border-foreground/10 px-2 py-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(line.product.slug, line.color, line.quantity - 1)
                                }
                                className="text-foreground/60 transition-colors hover:text-foreground"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                              <span className="min-w-4 text-center text-sm text-foreground">{line.quantity}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(line.product.slug, line.color, line.quantity + 1)
                                }
                                className="text-foreground/60 transition-colors hover:text-foreground"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {formatMoney({
                                amount: line.product.price.amount * line.quantity,
                                currency: line.product.price.currency,
                              })}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-foreground/10 px-6 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/50">Subtotal</span>
                    <span className="text-lg font-semibold text-foreground">
                      {formatMoney({ amount: subtotal, currency })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/40">Shipping and taxes calculated at checkout.</p>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="mt-4 w-full rounded-full bg-foreground py-4 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
                  >
                    {isAuthenticated ? "Checkout" : "Sign in to check out"}
                  </button>
                  {!isAuthenticated && (
                    <p className="mt-2 text-center text-xs text-foreground/40">
                      You&apos;ll return to your cart after signing in.
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
