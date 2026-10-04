// Orders slice, client-safe entry: types, analytics, invoice and tracking helpers,
// and `ordersAdapter`, which only reaches "use server" files (RPC boundaries, so
// Stripe stays on the server). Webhook-side finalize code is in `@/features/orders/server`.

export { ordersAdapter } from "./lib/adapters";

export * from "./lib/analytics";
export * from "./lib/invoice";
export * from "./lib/tracking";
export * from "./lib/types";
