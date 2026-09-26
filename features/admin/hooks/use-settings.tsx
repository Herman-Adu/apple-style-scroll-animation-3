"use client"

// Client provider for the store settings singleton. Seeded server-side from the
// authoritative Neon row (so the first client render matches SSR — no hydration
// mismatch and no flash of defaults). Admin edits update the local state
// optimistically for instant feedback and write through to Neon via a server
// action; the action returns the fresh row, which reconciles any divergence.
// A plain page load re-fetches server-side, so other sessions' changes appear
// on next load.

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { getStoreSettingsAction, updateStoreSettingsAction } from "@/lib/settings/db-actions"
import type { StoreSettings } from "@/lib/settings/types"

interface SettingsContextValue {
  settings: StoreSettings
  update: (patch: Partial<StoreSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: StoreSettings
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings)

  const refresh = useCallback(async () => {
    try {
      setSettings(await getStoreSettingsAction())
    } catch {
      // Non-fatal; the current in-memory state still holds.
    }
  }, [])

  const update = useCallback(
    (patch: Partial<StoreSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch })) // optimistic
      void updateStoreSettingsAction(patch).then(
        (fresh) => setSettings(fresh),
        () => void refresh(),
      )
    },
    [refresh],
  )

  const value = useMemo<SettingsContextValue>(() => ({ settings, update }), [settings, update])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useStoreSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useStoreSettings must be used within a SettingsProvider")
  return ctx
}
