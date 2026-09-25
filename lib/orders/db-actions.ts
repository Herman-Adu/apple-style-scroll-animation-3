"use server"

// Server Actions backing the `db` orders adapter. Identity is always derived
// from the Better Auth session on the server — the client never chooses whose
// orders it reads or whose id/email an order is recorded under. Admin-only
// actions (listAll / updateStatus) additionally require an admin session. This
// is the authorization boundary; hiding UI is not access control.

import { headers } from "next/headers"
import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/config"
import type { CreateOrderInput, Order, OrderStatus } from "./types"

const VALID_STATUSES: OrderStatus[] = ["processing", "fulfilled", "cancelled", "refunded"]

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
    appliedOffers: Array.isArray(row.appliedOffers)
      ? (row.appliedOffers as Order["appliedOffers"])
      : [],
    total: row.total,
    currency: row.currency,
  }
}

// --- session guards --------------------------------------------------------

async function sessionUser(): Promise<{ id: string; email: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return null
  return { id: session.user.id, email: session.user.email ?? "" }
}

async function requireUser(): Promise<{ id: string; email: string }> {
  const user = await sessionUser()
  if (!user) throw new Error("Not signed in.")
  return user
}

async function requireAdminId(): Promise<string> {
  const user = await requireUser()
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, role: true, roleOverride: true },
  })
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.")
  return user.id
}

/** Next human-friendly reference for the current year, e.g. MOMO-2026-0001. */
async function nextNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.order.count({ where: { number: { startsWith: `MOMO-${year}-` } } })
  return `MOMO-${year}-${String(count + 1).padStart(4, "0")}`
}

// --- actions ---------------------------------------------------------------

/** The signed-in customer's own orders. The passed id is ignored in favor of
 * the session user, so one account can never read another's history. */
export async function listMyOrdersAction(): Promise<Order[]> {
  const user = await sessionUser()
  if (!user) return []
  const rows = await prisma.order.findMany({
    where: { userId: user.id },
    select: orderSelect,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toOrder)
}

/** Every customer's orders — admin dashboard only. */
export async function listAllOrdersAction(): Promise<Order[]> {
  await requireAdminId()
  const rows = await prisma.order.findMany({
    select: orderSelect,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toOrder)
}

/** Record an order for the signed-in customer. Identity (userId/email) is taken
 * from the session, never from the client payload. */
export async function createOrderAction(input: CreateOrderInput): Promise<Order> {
  const user = await requireUser()
  const row = await prisma.order.create({
    data: {
      id: crypto.randomUUID(),
      number: await nextNumber(),
      userId: user.id,
      email: user.email || input.email,
      status: "processing",
      items: input.items as unknown as Prisma.InputJsonValue,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount ?? 0,
      appliedOffers: (input.appliedOffers ?? []) as unknown as Prisma.InputJsonValue,
      total: input.total,
      currency: input.currency,
    },
    select: orderSelect,
  })
  return toOrder(row)
}

/** Update fulfilment status — admin only. */
export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<Order> {
  await requireAdminId()
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid status.")
  const row = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: orderSelect,
  })
  return toOrder(row)
}
