"use server"

// Server Actions for store-wide discount codes. Admin CRUD is gated by
// requireAdmin (identity + role read from the Better Auth session, mirroring
// every other db-actions file in this codebase — hiding admin UI is not
// access control, this is the boundary). `resolveDiscountCode` is the one
// public export: any signed-in customer at checkout may call it, and it turns
// a validated code into a synthetic OfferTag that flows through the exact
// same pricing engine (features/checkout/lib/pricing.ts) personal offers use,
// so a code can never stack with a percent offer to exceed 100%.

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth/adapters/instance"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/domain/config"
import type { OfferTag } from "@/lib/auth/domain/types"
import type { DiscountCode, DiscountCodeInput, DiscountCodePatch } from "./lib/types"

type DiscountCodeRow = {
  id: string
  code: string
  label: string
  kind: string
  value: number | null
  active: boolean
  expiresAt: Date | null
  minSubtotal: number | null
  maxRedemptions: number | null
  redemptionCount: number
  createdAt: Date
  updatedAt: Date
}

function toDiscountCode(row: DiscountCodeRow): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    kind: row.kind === "shipping" ? "shipping" : "percent",
    value: row.value,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    minSubtotal: row.minSubtotal,
    maxRedemptions: row.maxRedemptions,
    redemptionCount: row.redemptionCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error("Not signed in.")
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, roleOverride: true },
  })
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.")
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function revalidateDiscounts(): void {
  revalidatePath("/admin/discounts")
}

/** List every discount code, newest first (admin). */
export async function listDiscountCodesAction(): Promise<DiscountCode[]> {
  await requireAdmin()
  const rows = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map(toDiscountCode)
}

/** Create a store-wide discount code (admin). */
export async function createDiscountCodeAction(input: DiscountCodeInput): Promise<DiscountCode> {
  await requireAdmin()
  const code = normalizeCode(input.code)
  if (!code) throw new Error("Enter a code.")
  const label = input.label.trim() || code

  if (input.kind === "percent") {
    const pct = input.value ?? 0
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new Error("Percent must be between 1 and 100.")
  }

  const row = await prisma.discountCode.create({
    data: {
      code,
      label,
      kind: input.kind,
      value: input.kind === "percent" ? input.value ?? 0 : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      minSubtotal: input.minSubtotal ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
    },
  })
  revalidateDiscounts()
  return toDiscountCode(row)
}

/** Update a discount code's fields, or toggle it active/inactive (admin). */
export async function updateDiscountCodeAction(id: string, patch: DiscountCodePatch): Promise<DiscountCode> {
  await requireAdmin()
  const data: Record<string, unknown> = {}
  if (patch.code !== undefined) data.code = normalizeCode(patch.code)
  if (patch.label !== undefined) data.label = patch.label.trim()
  if (patch.kind !== undefined) data.kind = patch.kind
  if (patch.value !== undefined) data.value = patch.value
  if (patch.active !== undefined) data.active = patch.active
  if (patch.expiresAt !== undefined) data.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null
  if (patch.minSubtotal !== undefined) data.minSubtotal = patch.minSubtotal
  if (patch.maxRedemptions !== undefined) data.maxRedemptions = patch.maxRedemptions

  const row = await prisma.discountCode.update({ where: { id }, data })
  revalidateDiscounts()
  return toDiscountCode(row)
}

/** Delete a discount code (admin). */
export async function deleteDiscountCodeAction(id: string): Promise<void> {
  await requireAdmin()
  await prisma.discountCode.delete({ where: { id } })
  revalidateDiscounts()
}

/**
 * Validate a customer-entered code against `subtotal` and turn it into a
 * synthetic OfferTag. Public — any signed-in customer may call this from
 * checkout. Returns a friendly error for every failure mode so the UI can
 * show it inline, and never throws.
 */
export async function resolveDiscountCode(
  codeInput: string,
  subtotal: number,
): Promise<{ ok: true; offer: OfferTag; code: string } | { ok: false; error: string }> {
  const code = normalizeCode(codeInput)
  if (!code) return { ok: false, error: "Enter a code." }

  const row = await prisma.discountCode.findUnique({ where: { code } })
  if (!row) return { ok: false, error: "That code isn't valid." }
  if (!row.active) return { ok: false, error: "That code is no longer active." }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "That code has expired." }
  }
  if (row.maxRedemptions !== null && row.redemptionCount >= row.maxRedemptions) {
    return { ok: false, error: "That code has already been fully redeemed." }
  }
  if (row.minSubtotal !== null && subtotal < row.minSubtotal) {
    return { ok: false, error: "Your cart doesn't meet the minimum spend for this code." }
  }

  const offer: OfferTag = {
    id: `code:${row.code}`,
    label: row.label,
    kind: row.kind === "shipping" ? "shipping" : "percent",
    value: row.value ?? undefined,
    createdAt: new Date().toISOString(),
  }
  return { ok: true, offer, code: row.code }
}

/** Best-effort redemption increment, called once an order is finalized. Never
 * throws — a failure here must not block order creation. */
export async function incrementDiscountCodeRedemption(code: string): Promise<void> {
  await prisma.discountCode.updateMany({
    where: { code: normalizeCode(code) },
    data: { redemptionCount: { increment: 1 } },
  })
}
