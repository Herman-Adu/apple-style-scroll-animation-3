// Data-driven company (store) profile definition. This is the *business* identity
// an admin manages — distinct from the personal customer profile collected by the
// storefront onboarding. The `companySections` below drive BOTH the admin onboarding
// takeover and the tabbed company profile edit form, so they never drift.
//
// The structured address is the single source of truth for the business location —
// consumed later by Strapi global data, invoices, receipts, and email footers via the
// `formatAddress*` helpers. Keep it field-by-field (never a freeform blob).

import type { OnboardingOption } from "./onboarding"

export interface CompanyAddress {
  line1: string
  line2: string
  city: string
  county: string
  postcode: string
  country: string
}

export const EMPTY_ADDRESS: CompanyAddress = {
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
}

export interface CompanyProfile {
  companyName: string
  contactPerson: string
  contactEmail: string
  supportPhone: string
  address: CompanyAddress
  vatNumber: string
  industry: string
  logoUrl?: string
  /** True once the admin has completed or skipped the company onboarding takeover. */
  onboarded: boolean
}

export const DEFAULT_COMPANY: CompanyProfile = {
  companyName: "",
  contactPerson: "",
  contactEmail: "",
  supportPhone: "",
  address: { ...EMPTY_ADDRESS },
  vatNumber: "",
  industry: "",
  logoUrl: undefined,
  onboarded: false,
}

/* ------------------------------------------------------------------ */
/* Validation (UK formats)                                             */
/* ------------------------------------------------------------------ */

export function validateUkPostcode(value: string): string | null {
  if (!value.trim()) return null
  // Covers the standard UK outward+inward postcode formats, spacing optional.
  return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(value.trim())
    ? null
    : "Enter a valid UK postcode (e.g. SW1A 1AA)."
}

export function validateUkPhone(value: string): string | null {
  if (!value.trim()) return null
  const digits = value.replace(/[\s().-]/g, "")
  return /^(?:\+44|0)\d{9,10}$/.test(digits)
    ? null
    : "Enter a valid UK phone number (e.g. +44 20 7946 0958)."
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : "Enter a valid email address."
}

export function validateVatNumber(value: string): string | null {
  if (!value.trim()) return null
  return /^GB\d{9}$/i.test(value.replace(/\s/g, ""))
    ? null
    : "Enter a valid UK VAT number (e.g. GB123456789)."
}

/* ------------------------------------------------------------------ */
/* Field descriptors                                                   */
/* ------------------------------------------------------------------ */

export type CompanyScalarKey =
  | "companyName"
  | "contactPerson"
  | "contactEmail"
  | "supportPhone"
  | "vatNumber"
  | "industry"

export type CompanyAddressSubKey = keyof CompanyAddress

export type CompanyFieldType = "text" | "tel" | "email" | "single-select" | "address"

export interface CompanyField {
  /** A scalar key on CompanyProfile, or the composite "address". */
  key: CompanyScalarKey | "address"
  type: CompanyFieldType
  label: string
  placeholder?: string
  required?: boolean
  hint?: string
  options?: OnboardingOption[]
  /** Format validator, run against the trimmed string value when non-empty. */
  validate?: (value: string) => string | null
}

export interface AddressSubField {
  key: CompanyAddressSubKey
  label: string
  placeholder?: string
  required?: boolean
  validate?: (value: string) => string | null
  autoComplete?: string
  /** When true, spans both columns of the address grid. */
  wide?: boolean
}

export const addressSubFields: AddressSubField[] = [
  { key: "line1", label: "Address line 1", placeholder: "e.g. 12 Berner Street", required: true, autoComplete: "address-line1", wide: true },
  { key: "line2", label: "Address line 2", placeholder: "Apartment, suite, unit (optional)", autoComplete: "address-line2", wide: true },
  { key: "city", label: "Town / city", placeholder: "e.g. London", required: true, autoComplete: "address-level2" },
  { key: "county", label: "County", placeholder: "e.g. Greater London", autoComplete: "address-level1" },
  { key: "postcode", label: "Postcode", placeholder: "e.g. SW1A 1AA", required: true, validate: validateUkPostcode, autoComplete: "postal-code" },
  { key: "country", label: "Country", placeholder: "United Kingdom", required: true, autoComplete: "country-name" },
]

const industryField: CompanyField = {
  key: "industry",
  type: "single-select",
  label: "Industry",
  required: true,
  options: [
    { value: "audio", label: "Audio & electronics", description: "Headphones, speakers, hi-fi" },
    { value: "retail", label: "General retail", description: "Multi-category storefront" },
    { value: "fashion", label: "Fashion & apparel", description: "Clothing and accessories" },
    { value: "home", label: "Home & living", description: "Furniture and homeware" },
    { value: "beauty", label: "Health & beauty", description: "Cosmetics and wellness" },
    { value: "other", label: "Something else", description: "Tell us later" },
  ],
}

/* ------------------------------------------------------------------ */
/* Sections — drive both the profile tabs and the onboarding steps     */
/* ------------------------------------------------------------------ */

export interface CompanySection {
  id: string
  /** Short label used for the profile page tab. */
  label: string
  /** Heading used for the onboarding step. */
  title: string
  subtitle: string
  fields: CompanyField[]
}

export const companySections: CompanySection[] = [
  {
    id: "identity",
    label: "Identity",
    title: "Tell us about your company",
    subtitle: "This is the business identity behind your store — it appears on invoices and receipts.",
    fields: [
      {
        key: "companyName",
        type: "text",
        label: "Legal company name",
        placeholder: "e.g. MOMO Audio Ltd",
        required: true,
      },
      industryField,
    ],
  },
  {
    id: "contact",
    label: "Contact",
    title: "Who's the main point of contact?",
    subtitle: "Used for account, billing, and customer correspondence.",
    fields: [
      {
        key: "contactPerson",
        type: "text",
        label: "Contact name",
        placeholder: "e.g. Herman Adu",
        required: true,
      },
      {
        key: "contactEmail",
        type: "email",
        label: "Admin email",
        placeholder: "e.g. admin@momoaudio.com",
        validate: validateEmail,
      },
      {
        key: "supportPhone",
        type: "tel",
        label: "Support phone",
        placeholder: "e.g. +44 20 7946 0958",
        validate: validateUkPhone,
      },
    ],
  },
  {
    id: "address",
    label: "Address",
    title: "Where's the business based?",
    subtitle: "Your registered UK address — used on invoices, receipts, and email footers.",
    fields: [{ key: "address", type: "address", label: "Registered address" }],
  },
  {
    id: "registration",
    label: "Tax & registration",
    title: "Business & tax details",
    subtitle: "Optional now — you can complete these anytime from your company profile.",
    fields: [
      {
        key: "vatNumber",
        type: "text",
        label: "VAT / registration number",
        placeholder: "e.g. GB123456789",
        validate: validateVatNumber,
        hint: "UK VAT numbers start with GB followed by 9 digits.",
      },
    ],
  },
]

/** Onboarding reads the same sections in order — no separate definition to drift. */
export const companyOnboardingSteps = companySections

/* ------------------------------------------------------------------ */
/* Validation + formatting helpers                                     */
/* ------------------------------------------------------------------ */

/** Full validation for a scalar field: required + format. Returns first error, or null. */
export function validateCompanyField(field: CompanyField, value: unknown): string | null {
  if (field.type === "address") return null
  const str = typeof value === "string" ? value : ""
  if (field.required && !str.trim()) return `${field.label} is required.`
  return field.validate?.(str) ?? null
}

/** True when no address sub-field has been filled in. */
export function isAddressEmpty(address: CompanyAddress): boolean {
  return addressSubFields.every((sub) => !(address[sub.key] ?? "").trim())
}

/** Full validation for the address: required + format per sub-field. */
export function validateAddress(address: CompanyAddress): Partial<Record<CompanyAddressSubKey, string>> {
  const errors: Partial<Record<CompanyAddressSubKey, string>> = {}
  for (const sub of addressSubFields) {
    const value = address[sub.key] ?? ""
    if (sub.required && !value.trim()) {
      errors[sub.key] = `${sub.label} is required.`
      continue
    }
    const err = sub.validate?.(value)
    if (err) errors[sub.key] = err
  }
  return errors
}

/** Multi-line address for receipts / email footers, skipping empty parts. */
export function formatAddressLines(address: CompanyAddress): string[] {
  return [address.line1, address.line2, address.city, address.county, address.postcode, address.country]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
}

/** Single-line address for compact display and previews. */
export function formatAddressOneLine(address: CompanyAddress): string {
  return formatAddressLines(address).join(", ")
}

/** Resolves the human-readable label for a stored option value (e.g. industry). */
export function companyOptionLabel(fieldKey: CompanyScalarKey, value?: string): string | undefined {
  if (!value) return undefined
  for (const section of companySections) {
    const field = section.fields.find((f) => f.key === fieldKey)
    const option = field?.options?.find((o) => o.value === value)
    if (option) return option.label
  }
  return value
}
