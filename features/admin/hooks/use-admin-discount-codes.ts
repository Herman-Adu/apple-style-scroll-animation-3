"use client"

import { useCallback, useState } from "react"
import {
  createDiscountCodeAction,
  deleteDiscountCodeAction,
  listDiscountCodesAction,
  updateDiscountCodeAction,
} from "@/features/discount-codes/actions"
import type { DiscountCode, DiscountCodeInput, DiscountCodePatch } from "@/features/discount-codes"

/** Admin view of store-wide discount codes, backed by the Neon-persisted
 * DiscountCode table via Server Actions. The first list arrives from the server. */
export function useAdminDiscountCodes(initialCodes: DiscountCode[]) {
  const [codes, setCodes] = useState(initialCodes)

  const refresh = useCallback(async () => {
    setCodes(await listDiscountCodesAction())
  }, [])

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

  return { codes, createCode, updateCode, deleteCode, refresh }
}
