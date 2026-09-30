// Shared shapes for store-wide discount codes. See prisma/schema.prisma
// (DiscountCode model) for the persisted field semantics — this module is the
// app-facing mirror admins and checkout code share.

export type DiscountCodeKind = "percent" | "shipping"

export interface DiscountCode {
  id: string
  code: string
  label: string
  kind: DiscountCodeKind
  /** Percent amount (0-100) for `percent` codes. Unused for `shipping`. */
  value: number | null
  active: boolean
  expiresAt: string | null
  /** Minimum cart subtotal (major currency units) required to redeem. */
  minSubtotal: number | null
  /** Store-wide redemption cap. Null = unlimited. */
  maxRedemptions: number | null
  redemptionCount: number
  createdAt: string
  updatedAt: string
}

export interface DiscountCodeInput {
  code: string
  label: string
  kind: DiscountCodeKind
  value?: number | null
  expiresAt?: string | null
  minSubtotal?: number | null
  maxRedemptions?: number | null
}

export type DiscountCodePatch = Partial<DiscountCodeInput> & { active?: boolean }
