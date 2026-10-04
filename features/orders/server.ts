// Server-only public surface of the orders slice. Import from here in server code;
// client-safe exports live in ./index.
// Webhook/checkout-side finalize steps (data/finalize), low-stock and order emails (adapters).
export {
  finalizeCheckout,
  getOrderByStripeSession,
  nextOrderNumber,
  reconcileRefund,
  releaseCheckout,
  releaseReservationById,
} from "./lib/data/finalize/orders";
export {
  commitStock,
  effectiveProductsFor,
  restoreStock,
  type ReservedLine,
} from "./lib/data/finalize/stock";
export { notifyLowStock, type LowStockItem } from "./lib/adapters/low-stock";
export * from "./lib/adapters/notifications";
export { listAllOrdersAction, listMyOrdersAction } from "./lib/actions/orders";
