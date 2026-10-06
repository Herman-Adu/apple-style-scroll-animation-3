import { z } from "zod"
import { isInStock } from "@/features/products"
import type { Product } from "@/features/products"

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  productSlug: z.string().trim().min(1, "Choose a product."),
})

export type StockAlertRequest = z.infer<typeof requestSchema>

export type NormalizedAlertRequest = ({ ok: true } & StockAlertRequest) | { ok: false; error: string }

export type StockAlertResult = { ok: true; message: string } | { ok: false; error: string }

export function normalizeAlertRequest(raw: unknown): NormalizedAlertRequest {
  const parsed = requestSchema.safeParse(raw)
  if (parsed.success) return { ok: true, ...parsed.data }
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." }
}

/** Only an available product with nothing left to sell can be waited for; pre-orders sell without stock. */
export function isEligibleForAlert(product: Pick<Product, "releaseStatus" | "stock" | "reserved">): boolean {
  return product.releaseStatus === "available" && !isInStock(product)
}
