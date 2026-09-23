"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { OnboardingFieldControl } from "@/components/auth/onboarding-field"
import { useCompanyProfile } from "../hooks/use-company-profile"
import { companyOnboardingSteps, type CompanyProfile } from "@/lib/data/company"
import type { OnboardingField } from "@/lib/data/onboarding"

/**
 * First-run company onboarding, shown as a full-screen takeover inside the admin
 * dashboard when the store has no company profile yet. Mirrors the storefront
 * onboarding flow but collects *business* details and is skippable.
 */
export function AdminOnboarding() {
  const { company, completeOnboarding, skipOnboarding } = useCompanyProfile()
  const [mounted, setMounted] = useState(false)

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [draft, setDraft] = useState<Partial<CompanyProfile>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  // Seed the draft from any existing values once, when the overlay first mounts.
  useEffect(() => {
    setDraft({
      companyName: company.companyName,
      industry: company.industry,
      contactPerson: company.contactPerson,
      supportPhone: company.supportPhone,
      address: company.address,
      vatNumber: company.vatNumber,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const step = companyOnboardingSteps[stepIndex]
  const isLast = stepIndex === companyOnboardingSteps.length - 1
  const progress = ((stepIndex + 1) / companyOnboardingSteps.length) * 100

  const stepValid = useMemo(() => {
    return step.fields.every((field) => {
      if (!field.required) return true
      const value = draft[field.key]
      return value !== undefined && String(value).trim() !== ""
    })
  }, [step, draft])

  if (!mounted || company.onboarded) return null

  function setValue(key: keyof CompanyProfile, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function goNext() {
    if (!isLast) {
      setDirection(1)
      setStepIndex((i) => i + 1)
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      setDirection(-1)
      setStepIndex((i) => i - 1)
    }
  }

  function finish() {
    setSubmitting(true)
    completeOnboarding(draft)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-accent-teal/[0.06] blur-[120px]"
      />
      <div className="relative w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-[0.35em] text-foreground">MOMO</span>
            <span className="rounded-sm border border-accent-teal/30 bg-accent-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-teal">
              Admin
            </span>
          </span>
          <button
            type="button"
            onClick={skipOnboarding}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>
              Step {stepIndex + 1} / {companyOnboardingSteps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-px w-full bg-border">
            <motion.div
              className="h-px bg-accent-teal"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">{step.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.subtitle}</p>

            <div className="mt-10 space-y-8">
              {step.fields.map((field) => (
                <div key={field.key} className="space-y-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{field.label}</label>
                  <OnboardingFieldControl
                    field={field as unknown as OnboardingField}
                    value={draft[field.key]}
                    onChange={(value) => setValue(field.key, value)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back
          </Button>

          {isLast ? (
            <Button
              type="button"
              onClick={finish}
              disabled={!stepValid || submitting}
              className="h-11 bg-accent-teal px-6 text-background hover:bg-accent-teal/90"
            >
              {submitting ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  Finish setup
                  <Check className="ml-2 h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!stepValid}
              className="h-11 bg-accent-teal px-6 text-background hover:bg-accent-teal/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
