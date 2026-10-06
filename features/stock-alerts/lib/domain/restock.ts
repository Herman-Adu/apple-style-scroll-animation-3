export { crossedBackInStock } from "@/features/products"

/** Where the email's unsubscribe link lands. The token is the only credential, so it is encoded. */
export function unsubscribePath(token: string): string {
  return `/stock-alerts/unsubscribe?token=${encodeURIComponent(token)}`
}
