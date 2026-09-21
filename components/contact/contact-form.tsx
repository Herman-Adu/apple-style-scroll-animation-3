"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Newspaper,
  Star as StarIcon,
} from "lucide-react"
import { enquiryTypes } from "@/lib/data/contact"
import { products } from "@/lib/data/products"
import { submitEnquiryAction } from "@/app/contact/actions"
import type { EnquiryField, EnquiryType } from "@/lib/contact/types"
import { reviewsProvider } from "@/lib/reviews/provider"
import { useAuth } from "@/lib/auth/auth-context"
import { StarRating } from "./star-rating"
import { cn } from "@/lib/utils"

const iconMap = {
  message: MessageSquare,
  lifebuoy: LifeBuoy,
  star: StarIcon,
  building: Building2,
  newspaper: Newspaper,
} as const

const steps = ["Topic", "Your details", "Details", "Review"]

const inputClass =
  "w-full rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none transition-colors focus:border-foreground/30"
const labelClass = "mb-2 block text-xs uppercase tracking-[0.15em] text-foreground/50"

function resolveOptions(field: EnquiryField): string[] {
  if (field.optionsSource === "products") return products.map((p) => p.name)
  return field.options ?? []
}

function slugForProductName(name: string): string | undefined {
  return products.find((p) => p.name === name)?.slug
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function ContactForm() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [typeId, setTypeId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [values, setValues] = useState<Record<string, string | number>>({})
  // Honeypot: hidden from real users; only bots fill it.
  const [website, setWebsite] = useState("")
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  // Prefill contact details from the signed-in user once auth resolves.
  useEffect(() => {
    if (!user) return
    setName((prev) => prev || user.profile.displayName || user.name)
    setEmail((prev) => prev || user.email)
  }, [user])

  // Deep-link prefill: /contact?topic=review&product=Momo%20X preselects the
  // topic and product so "Write a review" on a product page lands ready to go.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const topic = params.get("topic")
    const product = params.get("product")
    if (topic && enquiryTypes.some((t) => t.id === topic)) {
      setTypeId(topic)
      if (product) {
        const hasProductField = enquiryTypes
          .find((t) => t.id === topic)
          ?.fields.some((f) => f.name === "product")
        if (hasProductField) setValues({ product })
      }
    }
  }, [])

  const selectedType: EnquiryType | undefined = useMemo(
    () => enquiryTypes.find((t) => t.id === typeId),
    [typeId],
  )

  function setField(nameKey: string, value: string | number) {
    setValues((prev) => ({ ...prev, [nameKey]: value }))
  }

  function stepValid(index: number): boolean {
    if (index === 0) return !!typeId
    if (index === 1) return name.trim().length > 1 && isEmail(email)
    if (index === 2) {
      if (!selectedType) return false
      return selectedType.fields.every((f) => {
        if (!f.required) return true
        const v = values[f.name]
        if (f.type === "rating") return typeof v === "number" && v > 0
        return typeof v === "string" && v.trim().length > 0
      })
    }
    return true
  }

  function goNext() {
    if (!stepValid(step)) {
      setTouched(true)
      return
    }
    setTouched(false)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function goBack() {
    setTouched(false)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    if (!selectedType) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitEnquiryAction({
        type: selectedType.id,
        name: name.trim(),
        email: email.trim(),
        fields: values,
        website,
      })

      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.")
        return
      }

      // A review enquiry also becomes a public product review.
      if (selectedType.id === "review") {
        const productSlug = slugForProductName(String(values.product ?? ""))
        if (productSlug) {
          await reviewsProvider.add({
            productSlug,
            author: name.trim(),
            avatarUrl: user?.profile.avatarUrl,
            rating: Number(values.rating) || 0,
            headline: String(values.headline ?? ""),
            body: String(values.review ?? ""),
          })
        }
      }

      setResult(res.reference)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setResult(null)
    setStep(0)
    setTypeId(null)
    setValues({})
    setTouched(false)
    setError(null)
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <Check className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-foreground">Message sent</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground/50">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&apos;ve received your{" "}
          {selectedType?.label.toLowerCase()} and will reply to {email} shortly.
        </p>
        <p className="mt-4 inline-block rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/60">
          Ref&nbsp;{result}
        </p>
        <div>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
          >
            Send another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 md:p-8">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-foreground" : "bg-foreground/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.15em] transition-colors",
                i === step ? "text-foreground" : "text-foreground/40",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Honeypot — visually hidden and off the tab order. Real users never
          reach it; a filled value marks the submission as a bot on the server. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Company website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Step 0 — choose a topic */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-foreground">What can we help with?</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {enquiryTypes.map((type) => {
                  const Icon = iconMap[type.icon]
                  const selected = type.id === typeId
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setTypeId(type.id)
                        setValues({})
                      }}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-foreground/40 bg-foreground/[0.06]"
                          : "border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 hover:bg-foreground/[0.04]",
                      )}
                      aria-pressed={selected}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          selected ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/70",
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{type.label}</span>
                        <span className="mt-0.5 text-xs leading-relaxed text-foreground/45">
                          {type.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {touched && !typeId && (
                <p className="text-xs text-red-400">Please choose a topic to continue.</p>
              )}
            </div>
          )}

          {/* Step 1 — your details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">Your details</h3>
              {user && (
                <p className="-mt-2 text-xs text-foreground/45">
                  Prefilled from your account — edit if you&apos;d like a reply elsewhere.
                </p>
              )}
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Full name
                </label>
                <input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  autoComplete="name"
                />
                {touched && name.trim().length <= 1 && (
                  <p className="mt-1.5 text-xs text-red-400">Please enter your name.</p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoComplete="email"
                />
                {touched && !isEmail(email) && (
                  <p className="mt-1.5 text-xs text-red-400">Please enter a valid email.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — dynamic details */}
          {step === 2 && selectedType && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">{selectedType.label}</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {selectedType.fields.map((field) => {
                  const value = values[field.name]
                  const missing =
                    touched &&
                    field.required &&
                    (field.type === "rating"
                      ? !(typeof value === "number" && value > 0)
                      : !(typeof value === "string" && value.trim().length > 0))
                  return (
                    <div key={field.name} className={cn(field.full && "sm:col-span-2")}>
                      <label htmlFor={`field-${field.name}`} className={labelClass}>
                        {field.label}
                        {!field.required && <span className="ml-1 text-foreground/25">(optional)</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          id={`field-${field.name}`}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          className={cn(inputClass, "resize-none")}
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={`field-${field.name}`}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          className={cn(inputClass, "appearance-none")}
                        >
                          <option value="" disabled className="bg-[#0a0a0a]">
                            Select…
                          </option>
                          {resolveOptions(field).map((opt) => (
                            <option key={opt} value={opt} className="bg-[#0a0a0a]">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "rating" ? (
                        <StarRating
                          value={(value as number) ?? 0}
                          onChange={(v) => setField(field.name, v)}
                        />
                      ) : (
                        <input
                          id={`field-${field.name}`}
                          type={field.type}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      )}

                      {missing && <p className="mt-1.5 text-xs text-red-400">This field is required.</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3 — review */}
          {step === 3 && selectedType && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">Review &amp; send</h3>
              <dl className="divide-y divide-foreground/5 rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">Topic</dt>
                  <dd className="text-sm text-foreground">{selectedType.label}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">Name</dt>
                  <dd className="text-sm text-foreground">{name}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">Email</dt>
                  <dd className="text-sm text-foreground">{email}</dd>
                </div>
                {selectedType.fields.map((field) => {
                  const value = values[field.name]
                  if (value === undefined || value === "" ) return null
                  return (
                    <div key={field.name} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">{field.label}</dt>
                      <dd className="max-w-[60%] text-right text-sm text-foreground">
                        {field.type === "rating" ? `${value}/5` : String(value)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full border border-foreground/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </button>
        ) : (
          <span />
        )}

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Sending
              </>
            ) : (
              <>
                Send message
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
