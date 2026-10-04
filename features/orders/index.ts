// Orders slice, client-safe entry: types, analytics, invoice and tracking helpers,
// and `ordersAdapter`, which only reaches "use server" files (RPC boundaries, so
// Stripe stays on the server). Webhook-side finalize code is in `@/features/orders/server`.

export { ordersAdapter } from "./lib/adapters";

export * from "./lib/domain/analytics";
export * from "./lib/domain/invoice";
export * from "./lib/domain/tracking";
export * from "./lib/domain/types";
