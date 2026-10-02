// Domain types for the contact / enquiry system.
// UI and data config depend on these; the transport (submit) depends on them too.

export type EnquiryFieldType = "text" | "email" | "tel" | "textarea" | "select" | "rating"

export interface EnquiryField {
  name: string
  label: string
  type: EnquiryFieldType
  placeholder?: string
  required?: boolean
  /** Static options for a select field. */
  options?: string[]
  /** Resolve options at render time from a known dataset. */
  optionsSource?: "products"
  /** Render across the full width of the field grid. */
  full?: boolean
}

/** Who may submit an enquiry type. Missing = "public" (anyone). */
export type EnquiryAccess = "public" | "account"

/** Guidance shown to signed-out users when a type is account-gated. */
export interface EnquiryGate {
  title: string
  description: string
  /** Optional secondary link (e.g. to the docs) shown alongside sign-in. */
  href?: string
  hrefLabel?: string
}

export interface EnquiryType {
  id: string
  label: string
  description: string
  /** Icon key mapped to a lucide icon in the UI layer. */
  icon: "message" | "lifebuoy" | "star" | "building" | "newspaper"
  /** Access rule for submitting this type. Defaults to "public" when omitted. */
  access?: EnquiryAccess
  /** Copy shown to signed-out users when `access` is "account". */
  gate?: EnquiryGate
  /** The dynamic fields collected for this enquiry type. */
  fields: EnquiryField[]
}

export interface EnquiryPayload {
  type: string
  typeLabel: string
  name: string
  email: string
  fields: Record<string, string | number>
  submittedAt: string
}

export interface ContactSubmitResult {
  ok: boolean
  reference: string
}

/** Result of the server action that validates and submits an enquiry. */
export interface ContactActionResult {
  ok: boolean
  reference?: string
  /** User-facing error message when `ok` is false. */
  error?: string
  /** Per-field validation messages keyed by field path, when available. */
  fieldErrors?: Record<string, string[] | undefined>
}
