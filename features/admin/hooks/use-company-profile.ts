"use client"

// The store's company profile, now backed by Neon (via the store settings
// singleton) instead of localStorage — so it persists across devices/browsers
// and is Strapi-portable. This hook is a thin projection over the settings
// provider that keeps the original interface, so the profile edit form and the
// onboarding takeover are unchanged. Writes go through the admin-guarded server
// action inside the provider.

import { useCallback } from "react"
import type { CompanyProfile } from "@/lib/data/company"
import { toCompanyProfile } from "@/lib/settings/types"
import { useStoreSettings } from "./use-settings"

export function useCompanyProfile() {
  const { settings, update: updateSettings } = useStoreSettings()
  const company = toCompanyProfile(settings)

  const update = useCallback(
    (patch: Partial<CompanyProfile>) => updateSettings(patch),
    [updateSettings],
  )

  const completeOnboarding = useCallback(
    (patch: Partial<CompanyProfile>) => updateSettings({ ...patch, onboarded: true }),
    [updateSettings],
  )

  const skipOnboarding = useCallback(() => updateSettings({ onboarded: true }), [updateSettings])

  return { company, update, completeOnboarding, skipOnboarding }
}
