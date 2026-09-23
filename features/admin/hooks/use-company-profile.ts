"use client"

// Store-level company profile, persisted to localStorage in this demo. Kept in a
// tiny external store (not the auth adapter) because it's a property of the *store*,
// not of the signed-in user — swapping localStorage for an API later only touches
// read()/write() here.

import { useCallback } from "react"
import { useSyncExternalStore } from "react"
import { DEFAULT_COMPANY, EMPTY_ADDRESS, type CompanyProfile } from "@/lib/data/company"

const STORAGE_KEY = "admin:company"

const listeners = new Set<() => void>()
let cache: CompanyProfile | null = null

// Reconciles stored data with the current shape. Notably migrates the legacy
// freeform `address` string into the structured address object.
function normalize(stored: Partial<CompanyProfile> & { address?: unknown }): CompanyProfile {
  const merged = { ...DEFAULT_COMPANY, ...stored } as CompanyProfile
  if (typeof stored.address === "string") {
    merged.address = { ...EMPTY_ADDRESS, line1: stored.address }
  } else {
    merged.address = { ...EMPTY_ADDRESS, ...(stored.address as Partial<CompanyProfile["address"]>) }
  }
  return merged
}

function read(): CompanyProfile {
  if (cache) return cache
  if (typeof window === "undefined") {
    cache = DEFAULT_COMPANY
    return cache
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cache = raw ? normalize(JSON.parse(raw) as Partial<CompanyProfile>) : DEFAULT_COMPANY
  } catch {
    cache = DEFAULT_COMPANY
  }
  return cache
}

function write(next: CompanyProfile) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore storage failures (private mode, quota)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function useCompanyProfile() {
  const company = useSyncExternalStore(subscribe, read, () => DEFAULT_COMPANY)

  const update = useCallback((patch: Partial<CompanyProfile>) => {
    write({ ...read(), ...patch })
  }, [])

  const completeOnboarding = useCallback((patch: Partial<CompanyProfile>) => {
    write({ ...read(), ...patch, onboarded: true })
  }, [])

  const skipOnboarding = useCallback(() => {
    write({ ...read(), onboarded: true })
  }, [])

  return { company, update, completeOnboarding, skipOnboarding }
}
