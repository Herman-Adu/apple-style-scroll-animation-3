import type { Order, OrderStatus } from "./types";

const VALID_STATUSES: OrderStatus[] = [
  "processing",
  "fulfilled",
  "cancelled",
  "refunded",
];

export const orderSelect = {
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
  discountCode: true,
  total: true,
  currency: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  refundedAmount: true,
  refunds: true,
  carrier: true,
  trackingNumber: true,
  trackingUrl: true,
  shippedAt: true,
  createdAt: true,
} as const;

export type OrderRow = {
  id: string;
  number: string;
  userId: string;
  email: string;
  status: string;
  items: unknown;
  subtotal: number;
  shipping: number;
  discount: number;
  appliedOffers: unknown;
  discountCode?: string | null;
  total: number;
  currency: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  refundedAmount?: number;
  refunds?: unknown;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: Date | null;
  createdAt: Date;
};

export function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    status: (VALID_STATUSES.includes(row.status as OrderStatus)
      ? row.status
      : "processing") as OrderStatus,
    items: Array.isArray(row.items) ? (row.items as Order["items"]) : [],
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount ?? 0,
    appliedOffers: Array.isArray(row.appliedOffers)
      ? (row.appliedOffers as Order["appliedOffers"])
      : [],
    discountCode: row.discountCode ?? undefined,
    total: row.total,
    currency: row.currency,
    stripeSessionId: row.stripeSessionId ?? undefined,
    stripePaymentIntentId: row.stripePaymentIntentId ?? undefined,
    refundedAmount: row.refundedAmount ?? 0,
    refunds: Array.isArray(row.refunds)
      ? (row.refunds as Order["refunds"])
      : [],
    carrier: (row.carrier as Order["carrier"]) ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    shippedAt: row.shippedAt ? row.shippedAt.toISOString() : undefined,
  };
}
