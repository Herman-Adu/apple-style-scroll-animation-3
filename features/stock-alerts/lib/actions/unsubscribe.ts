"use server"

import { redirect } from "next/navigation"
import type { StockAlertResult } from "../domain/alert"
import { removeAlertByToken } from "../data/alerts"

const MAX_TOKEN_LENGTH = 128

/**
 * Open to anyone holding the emailed link. The token is a random secret, so
 * this validates its shape, deletes by it, and answers the same way for any
 * unknown token without revealing which alerts exist.
 */
export async function unsubscribeStockAlert(token: unknown): Promise<StockAlertResult> {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, error: "This unsubscribe link isn't valid." }
  }
  const removed = await removeAlertByToken(token)
  if (!removed) return { ok: false, error: "This alert was already removed, or the link isn't valid." }
  return { ok: true, message: "You're unsubscribed. We won't email you about this product." }
}

/** Form target for the confirmation page: a scanner that only opens the link changes nothing. */
export async function unsubscribeStockAlertForm(formData: FormData): Promise<void> {
  const result = await unsubscribeStockAlert(formData.get("token"))
  redirect(`/stock-alerts/unsubscribe?status=${result.ok ? "done" : "invalid"}`)
}
