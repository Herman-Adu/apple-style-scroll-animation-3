import "server-only";

export {
  sendOrderConfirmation,
  sendOrderNotification,
  sendLowStockAlert,
  sendBackInStockEmail,
  sendRefundConfirmation,
  sendShippingConfirmation,
} from "./lib/adapters/sending/transactional"; // Server-only public surface of the email slice. Import from here in server code;
// client-safe exports live in ./index.
export * from "./lib/adapters/sending/campaign-send";
export * from "./lib/adapters/sending/provider";
export * from "./lib/data/repo";
