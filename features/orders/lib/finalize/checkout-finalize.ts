import "server-only";

// Shared, transaction-aware checkout mechanics used by BOTH the direct order
// path (db-actions.createOrderAction) and the Stripe payment path (reserve at
// session creation, finalize/release from the webhook). Keeping the oversell
// guard, stock decrement, stock restore, and order-number generation in one
// place means every path enforces identical rules — the storefront can never
// oversell and we never charge for stock we can't fulfil.
// The steps live in ./finalize: order-row (DB row -> Order), order-number,
// stock (reserve / restore / low-stock alert), finalize (paid session -> Order)
// and release (expired session, refund reconciliation).

export { nextOrderNumber } from "./order-number";
export {
  commitStock,
  effectiveProductsFor,
  notifyLowStock,
  restoreStock,
  type LowStockItem,
  type ReservedLine,
} from "./stock";
export { finalizeCheckout, getOrderByStripeSession } from "./finalize";
export { reconcileRefund, releaseCheckout, releaseReservationById } from "./release";
