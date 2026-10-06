"use server"

import { headers } from "next/headers"
import { checkRateLimit } from "@/features/contact/server"
import { getCatalogProducts } from "@/features/catalog"
import { isEligibleForAlert, normalizeAlertRequest } from "../domain/alert"
import type { StockAlertResult } from "../domain/alert"
import { requestStockAlert } from "../data/alerts"

const REQUESTS_PER_MINUTE = 5
const SUCCESS_MESSAGE = "You're on the list. We'll email you once, as soon as it's back."

/**
 * Open to guests, so this is the trust boundary: validate, throttle by IP,
 * confirm the product can actually be restocked, then store. A repeat request
 * answers with the same message so the form never reveals who is already waiting.
 */
export async function subscribeStockAlert(raw: unknown): Promise<StockAlertResult> {
  const request = normalizeAlertRequest(raw)
  if (!request.ok) return { ok: false, error: request.error }

  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = checkRateLimit(`stock-alert:${ip}`, REQUESTS_PER_MINUTE)
  if (!limit.ok) {
    const seconds = Math.ceil(limit.retryAfterMs / 1000)
    return { ok: false, error: `Too many requests. Please wait ${seconds}s and try again.` }
  }

  const product = (await getCatalogProducts()).find((p) => p.slug === request.productSlug)
  if (!product) return { ok: false, error: "We couldn't find that product." }
  if (!isEligibleForAlert(product)) return { ok: false, error: "This product doesn't need an alert right now." }

  await requestStockAlert({ email: request.email, productSlug: request.productSlug })
  return { ok: true, message: SUCCESS_MESSAGE }
}

export async function subscribeStockAlertForm(
  _previous: StockAlertResult | null,
  formData: FormData,
): Promise<StockAlertResult> {
  return subscribeStockAlert({
    email: formData.get("email"),
    productSlug: formData.get("productSlug"),
  })
}
