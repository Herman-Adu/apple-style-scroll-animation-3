// Unified store settings: the store's business identity (company profile) plus
// operational/storefront settings, persisted as a single Neon singleton row.
// This replaces the former `admin:company` and `admin:settings` localStorage
// stores. Keeping one type/one table means the previously-duplicated identity
// fields can never drift, and the whole thing is Strapi-portable later.

import { DEFAULT_COMPANY, type CompanyProfile } from "@/lib/data/company"

export type Currency = "GBP" | "USD" | "EUR"

/** The complete store settings record. Extends the company profile with the
 * storefront-facing + operational fields the admin settings screen manages. */
export interface StoreSettings extends CompanyProfile {
  storeName: string
  supportEmail: string
  currency: Currency
  lowStockThreshold: number
  emailAlerts: boolean
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  ...DEFAULT_COMPANY,
  storeName: "MOMO Audio",
  supportEmail: "hello@momoaudio.com",
  currency: "GBP",
  lowStockThreshold: 5,
  emailAlerts: true,
}

/** Project the full settings down to just the company-profile shape, so the
 * company profile / onboarding UI keeps working against a clean CompanyProfile. */
export function toCompanyProfile(s: StoreSettings): CompanyProfile {
  return {
    companyName: s.companyName,
    contactPerson: s.contactPerson,
    contactEmail: s.contactEmail,
    supportPhone: s.supportPhone,
    address: s.address,
    vatNumber: s.vatNumber,
    industry: s.industry,
    logoUrl: s.logoUrl,
    onboarded: s.onboarded,
  }
}
