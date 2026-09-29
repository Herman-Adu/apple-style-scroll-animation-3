import "server-only"

// Shared, transaction-aware checkout mechanics used by BOTH the direct order
// path (db-actions.createOrderAction) and the Stripe payment path (reserve at
// session creation, finalize/release from the webhook). Keeping the oversell
// guard, stock decrement, stock restore, and order-number generation in one
// place means every path enforces identical rules — the storefront can never
// oversell and we never charge for stock we can't fulfil.

import type Stripe from "stripe"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"
import { getAllProducts } from "@/lib/data/products"
import { productSchema } from "@/features/products"
import { recordSale, toMap, type ProductMap } from "@/features/catalog/store"
import type { AppliedOffer, Order, OrderStatus } from "./types"

/** A stock delta: `quantity` units of `slug` were removed (and can be restored). */
export interface ReservedLine {
  slug: string
  quantity: number
}

const VALID_STATUSES: OrderStatus[] = ["processing", "fulfilled", "cancelled", "refunded"]

const orderSelect = {
  id: true,
  number: true,
  userId: true,
  email: true,
  status: true,
  items: true,
  subtotal: true,
  shipping: true,
  discount: true,
  appliedOffers: true,
  total: true,
  currency: true,
  createdAt: true,
} as const

type OrderRow = {
  id: string
  number: string
  userId: string
  email: string
  status: string
  items: unknown
  subtotal: number
  shipping: number
  discount: number
  appliedOffers: unknown
  total: number
  currency: string
  createdAt: Date
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    status: (VALID_STATUSES.includes(row.status as OrderStatus) ? row.status : "processing") as OrderStatus,
    items: Array.isArray(row.items) ? (row.items as Order["items"]) : [],
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount ?? 0,
    appliedOffers: Array.isArray(row.appliedOffers) ? (row.appliedOffers as Order["appliedOffers"]) : [],
    total: row.total,
    currency: row.currency,
  }
}

/** Effective (seed + admin overlay) product map for a set of slugs, read inside
 * the given transaction so the stock guard runs against live, consistent data. */
export async function effectiveProductsFor(
  slugs: string[],
  tx: Prisma.TransactionClient,
): Promise<ProductMap> {
  const rows = await tx.productOverlay.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, data: true, deleted: true },
  })
  const map: ProductMap = toMap(getAllProducts().filter((p) => slugs.includes(p.slug)))
  for (const row of rows) {
    if (row.deleted) {
      delete map[row.slug]
      continue
    }
    const parsed = productSchema.safeParse(row.data)
    if (parsed.success) map[row.slug] = parsed.data
  }
  return map
}

/** Next human-friendly order reference for the current year, e.g. MOMO-2026-0001. */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear()
  const count = await tx.order.count({ where: { number: { startsWith: `MOMO-${year}-` } } })
  return `MOMO-${year}-${String(count + 1).padStart(4, "0")}`
}

/**
 * Enforce the oversell / last-unit guard and decrement physical stock for
 * `lines` inside `tx`. Pre-orders and unknown slugs are left untouched (matching
 * the storefront rules). Throws if the guard fails so the surrounding
 * transaction rolls back. Returns the exact deltas actually removed, so an
 * abandoned checkout can restore precisely what it reserved.
 */
export async function commitStock(
  tx: Prisma.TransactionClient,
  lines: ReservedLine[],
): Promise<ReservedLine[]> {
  const clean = lines.filter((l) => l.quantity > 0)
  const slugs = [...new Set(clean.map((l) => l.slug))]
  if (slugs.length === 0) return []

  const before = await effectiveProductsFor(slugs, tx)
  const sale = recordSale(before, clean)
  if (!sale.ok) throw new Error(sale.error ?? "Some items are no longer available.")

  const decremented: ReservedLine[] = []
  for (const slug of slugs) {
    const prev = before[slug]
    const next = sale.map[slug]
    if (!prev || !next || prev.stock === next.stock) continue
    const data = next as unknown as Prisma.InputJsonValue
    await tx.productOverlay.upsert({
      where: { slug },
      create: { slug, data, deleted: false },
      update: { data, deleted: false },
    })
    decremented.push({ slug, quantity: prev.stock - next.stock })
  }
  return decremented
}

/**
 * Restore previously-reserved stock within `tx` — the inverse of `commitStock`.
 * Reads current effective stock and adds the reserved quantity back, so a
 * concurrent change between reservation and release is preserved.
 */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  reserved: ReservedLine[],
): Promise<void> {
  const list = reserved.filter((r) => r.quantity > 0)
  const slugs = [...new Set(list.map((r) => r.slug))]
  if (slugs.length === 0) return

  const before = await effectiveProductsFor(slugs, tx)
  for (const { slug, quantity } of list) {
    const prev = before[slug]
    if (!prev) continue
    const next = { ...prev, stock: prev.stock + quantity }
    const data = next as unknown as Prisma.InputJsonValue
    await tx.productOverlay.upsert({
      where: { slug },
      create: { slug, data, deleted: false },
      update: { data, deleted: false },
    })
  }
}

function toReserved(raw: unknown): ReservedLine[] {
  if (!Array.isArray(raw)) return []
  return (raw as ReservedLine[]).filter(
    (r) => r && typeof r.slug === "string" && typeof r.quantity === "number",
  )
}

/**
 * Finalize a paid Stripe Checkout Session into a real Order. The stock was
 * already reserved at session creation, so this does NOT decrement again — it
 * just materializes the order and marks the pending row completed.
 *
 * Idempotent: guarded by the pending row's `reserved` status and the unique
 * `Order.stripeSessionId`, so a re-delivered `checkout.session.completed` event
 * is a safe no-op. Returns the created Order, or null if nothing was pending.
 */
export async function finalizeCheckout(session: Stripe.Checkout.Session): Promise<Order | null> {
  const pendingId = session.metadata?.pendingCheckoutId
  if (!pendingId) return null

  const created = await prisma.$transaction(async (tx) => {
    const pending = await tx.pendingCheckout.findUnique({ where: { id: pendingId } })
    if (!pending || pending.status !== "reserved") return null // already finalized or released

    const number = await nextOrderNumber(tx)
    const row = await tx.order.create({
      data: {
        id: crypto.randomUUID(),
        number,
        userId: pending.userId,
        email: pending.email,
        status: "processing",
        items: pending.items as Prisma.InputJsonValue,
        subtotal: pending.subtotal,
        shipping: pending.shipping,
        discount: pending.discount,
        appliedOffers: pending.appliedOffers as Prisma.InputJsonValue,
        total: pending.total,
        currency: pending.currency,
        stripeSessionId: session.id,
      },
      select: orderSelect,
    })
    await tx.pendingCheckout.update({ where: { id: pendingId }, data: { status: "completed" } })
    return row
  })

  if (!created) return null

  // Record which personal offers were used (best-effort; never blocks the order).
  const offerIds = (Array.isArray(created.appliedOffers) ? (created.appliedOffers as AppliedOffer[]) : [])
    .map((o) => o.id)
    .filter(Boolean)
  if (offerIds.length > 0) {
    void markOffersRedeemedFor(created.userId, offerIds).catch(() => {})
  }

  return toOrder(created)
}

/** The order already finalized for a Stripe session, if any. Lets the return
 * page show the confirmed order number when the webhook created it first
 * (and lets both paths stay idempotent). */
export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: orderSelect,
  })
  return row ? toOrder(row) : null
}

/** Release a reservation for an expired/failed Stripe session: restore the
 * reserved stock and mark the pending row released. Idempotent. */
export async function releaseCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const pendingId = session.metadata?.pendingCheckoutId
  if (!pendingId) return
  await releaseReservationById(pendingId)
}

/** Release a reservation by pending id — also used if Stripe session creation
 * fails after we've already reserved stock. Idempotent (no-op unless reserved). */
export async function releaseReservationById(pendingId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pending = await tx.pendingCheckout.findUnique({ where: { id: pendingId } })
    if (!pending || pending.status !== "reserved") return
    await restoreStock(tx, toReserved(pending.reservedStock))
    await tx.pendingCheckout.update({ where: { id: pendingId }, data: { status: "released" } })
  })
}

/** Stamp redeemed offers on a user by explicit id (the webhook has no session).
 * Record-only, mirroring markOffersRedeemedAction — never disables an offer. */
async function markOffersRedeemedFor(userId: string, offerIds: string[]): Promise<void> {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { offers: true } })
  const existing = Array.isArray(current?.offers)
    ? (current!.offers as unknown as { id: string; redeemedAt?: string; redemptionCount?: number }[])
    : []
  const target = new Set(offerIds)
  const now = new Date().toISOString()
  const offers = existing.map((offer) =>
    target.has(offer.id)
      ? { ...offer, redeemedAt: now, redemptionCount: (offer.redemptionCount ?? 0) + 1 }
      : offer,
  )
  await prisma.user.update({
    where: { id: userId },
    data: { offers: offers as unknown as Prisma.InputJsonValue },
  })
}
