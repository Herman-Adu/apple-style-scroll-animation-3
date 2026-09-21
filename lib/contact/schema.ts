import { z } from "zod"
import { enquiryTypes } from "@/lib/data/contact"

/**
 * Server-side contract for a contact enquiry. This is the authoritative
 * validation — the client form's inline checks are UX sugar; this schema is
 * what the server action trusts. Dynamic per-type fields are validated in a
 * superRefine against the enquiry-type config so required fields can't be
 * bypassed by a crafted request.
 */

const fieldValueSchema = z.union([z.string(), z.number()])

export const enquiryInputSchema = z
  .object({
    type: z.string().min(1),
    name: z.string().trim().min(2, "Please enter your name.").max(100),
    email: z.string().trim().email("Please enter a valid email.").max(200),
    fields: z.record(z.string(), fieldValueSchema).default({}),
    /**
     * Honeypot. Real users never see or fill this; bots tend to fill every
     * field. Any value here marks the submission as spam. Kept lenient (any
     * string) so the action can branch on it rather than failing validation.
     */
    website: z.string().max(200).optional(),
  })
  .superRefine((val, ctx) => {
    const type = enquiryTypes.find((t) => t.id === val.type)
    if (!type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["type"], message: "Unknown enquiry type." })
      return
    }
    for (const field of type.fields) {
      if (!field.required) continue
      const v = val.fields[field.name]
      const missing =
        field.type === "rating"
          ? !(typeof v === "number" && v > 0)
          : !(typeof v === "string" && v.trim().length > 0)
      if (missing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fields", field.name],
          message: `${field.label} is required.`,
        })
      }
    }
  })

export type EnquiryInput = z.infer<typeof enquiryInputSchema>
