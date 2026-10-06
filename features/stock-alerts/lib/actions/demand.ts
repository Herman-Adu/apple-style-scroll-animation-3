"use server"

// Admin-only view of back-in-stock demand. Hiding the UI is not access
// control, so each action starts with requireAdmin().

import { requireAdmin } from "@/lib/auth/server"
import { countWaitingByProduct, deleteAlertById } from "../data/alerts"
import type { WaitingByProduct } from "../domain/demand"

export async function getWaitingDemandAction(): Promise<WaitingByProduct> {
  await requireAdmin()
  return countWaitingByProduct()
}

export async function deleteStockAlertAction(id: number): Promise<boolean> {
  await requireAdmin()
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid alert id.")
  return deleteAlertById(id)
}
