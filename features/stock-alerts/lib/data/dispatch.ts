import "server-only"

import { sendBackInStockEmail } from "@/features/email/server"
import { getBaseUrl } from "@/lib/seo/site"
import { unsubscribePath } from "../domain/restock"
import { claimWaitingAlerts, releaseAlertClaim, type WaitingAlert } from "./alerts"

export type RestockedProduct = { slug: string; name: string }

async function sendOne(alert: WaitingAlert, product: RestockedProduct): Promise<void> {
  try {
    const result = await sendBackInStockEmail({
      to: alert.email,
      productName: product.name,
      productSlug: product.slug,
      unsubscribeUrl: `${getBaseUrl()}${unsubscribePath(alert.token)}`,
    })
    if (!result.ok) await releaseAlertClaim(alert.id)
  } catch {
    await releaseAlertClaim(alert.id).catch(() => {})
  }
}

/**
 * Emails everyone waiting on the given products. It runs after the stock write
 * has committed and never throws: a mail or database problem must not undo or
 * block the restock that triggered it. A failed send gives its claim back so
 * the next restock retries it.
 */
export async function notifyBackInStock(products: RestockedProduct[]): Promise<void> {
  for (const product of products) {
    try {
      const claimed = await claimWaitingAlerts(product.slug)
      for (const alert of claimed) await sendOne(alert, product)
    } catch {
      // Swallowed on purpose; see above.
    }
  }
}
