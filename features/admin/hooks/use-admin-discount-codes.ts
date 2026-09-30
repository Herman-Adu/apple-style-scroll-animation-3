"use client"

import { useCallback, useEffect, useState } from "react"
import {
  createDiscountCodeAction,
  deleteDiscountCodeAction,
  listDiscountCodesAction,
  updateDiscountCodeAction,
} from "@/lib/discount-codes/db-actions"
import type { DiscountCode, DiscountCodeInput, DiscountCodePatch } from "@/lib/discount-codes/types"

/** Admin view of store-wide discount codes, backed by the Neon-persisted
 * DiscountCode table via Server Actions. */
export function useAdminDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await listDiscountCodesAction()
    setCodes(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createCode = useCallback(
    async (input: DiscountCodeInput) => {
      const created = await createDiscountCodeAction(input)
      await refresh()
      return created
    },
    [refresh],
  )

  const updateCode = useCallback(
    async (id: string, patch: DiscountCodePatch) => {
      await updateDiscountCodeAction(id, patch)
      await refresh()
    },
    [refresh],
  )

  const deleteCode = useCallback(
    async (id: string) => {
      await deleteDiscountCodeAction(id)
      await refresh()
    },
    [refresh],
  )

  return { codes, loading, createCode, updateCode, deleteCode, refresh }
}
