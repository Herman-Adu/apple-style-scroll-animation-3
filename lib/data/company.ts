// Data-driven company (store) profile definition. This is the *business* identity
// an admin manages — distinct from the personal customer profile collected by the
// storefront onboarding. Add / reorder steps here and both the admin onboarding
// takeover and the company profile edit form update automatically.

import type { OnboardingFieldType, OnboardingOption } from "./onboarding"

export interface CompanyProfile {
  companyName: string
  contactPerson: string
  supportPhone: string
  address: string
  vatNumber: string
  industry: string
  logoUrl?: string
  /** True once the admin has completed or skipped the company onboarding takeover. */
  onboarded: boolean
}

export const DEFAULT_COMPANY: CompanyProfile = {
  companyName: "",
  contactPerson: "",
  supportPhone: "",
  address: "",
  vatNumber: "",
  industry: "",
  logoUrl: undefined,
  onboarded: false,
}

export type CompanyFieldKey =
  | "companyName"
  | "contactPerson"
  | "supportPhone"
  | "address"
  | "vatNumber"
  | "industry"

export interface CompanyField {
  key: CompanyFieldKey
  type: OnboardingFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: OnboardingOption[]
}

export interface CompanyStep {
  id: string
  title: string
  subtitle: string
  fields: CompanyField[]
}

export const companyOnboardingSteps: CompanyStep[] = [
  {
    id: "identity",
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
      {
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
      },
    ],
  },
  {
    id: "contact",
    title: "Who's the main point of contact?",
    subtitle: "We'll use this for account and billing correspondence.",
    fields: [
      {
        key: "contactPerson",
        type: "text",
        label: "Contact name",
        placeholder: "e.g. Herman Adu",
        required: true,
      },
      {
        key: "supportPhone",
        type: "text",
        label: "Support phone",
        placeholder: "e.g. +44 20 7946 0958",
      },
    ],
  },
  {
    id: "registration",
    title: "Business & tax details",
    subtitle: "Optional now — you can complete these anytime from your company profile.",
    fields: [
      {
        key: "address",
        type: "textarea",
        label: "Registered address",
        placeholder: "Street, city, postcode, country",
      },
      {
        key: "vatNumber",
        type: "text",
        label: "VAT / registration number",
        placeholder: "e.g. GB123456789",
      },
    ],
  },
]

/** Flattened field list — used by the company profile edit form so it never drifts from onboarding. */
export const companyFields: CompanyField[] = companyOnboardingSteps.flatMap((step) => step.fields)

/** Resolves the human-readable label for a stored option value (e.g. industry). */
export function companyOptionLabel(fieldKey: CompanyFieldKey, value?: string): string | undefined {
  if (!value) return undefined
  for (const step of companyOnboardingSteps) {
    const field = step.fields.find((f) => f.key === fieldKey)
    const option = field?.options?.find((o) => o.value === value)
    if (option) return option.label
  }
  return value
}
