"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { OnboardingFieldControl } from "@/components/auth/onboarding-field"
import { onboardingSteps } from "@/lib/data/onboarding"
import { useAuth } from "@/lib/auth/auth-context"
import type { ProfileUpdate, UserProfile } from "@/lib/auth/types"

export function OnboardingFlow() {
  const { user, completeOnboarding } = useAuth()
  const router = useRouter()

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [draft, setDraft] = useState<ProfileUpdate>(() => ({
    displayName: user?.profile.displayName || user?.name || "",
    goal: user?.profile.goal,
    interests: user?.profile.interests ?? [],
    newsletter: user?.profile.newsletter ?? false,
    bio: user?.profile.bio,
  }))

  const step = onboardingSteps[stepIndex]
  const isLast = stepIndex === onboardingSteps.length - 1
  const progress = ((stepIndex + 1) / onboardingSteps.length) * 100

  const stepValid = useMemo(() => {
    return step.fields.every((field) => {
      if (!field.required) return true
      const value = draft[field.key as keyof ProfileUpdate]
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && String(value).trim() !== ""
    })
  }, [step, draft])

  function setValue<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
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

  async function finish() {
    setSubmitting(true)
    try {
      await completeOnboarding(draft)
      router.replace("/account")
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-foreground/[0.05] blur-[120px]"
      />
      <div className="relative w-full max-w-xl">
        {/* Progress */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-foreground/40">
            <span>
              Step {stepIndex + 1} / {onboardingSteps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-px w-full bg-foreground/10">
            <motion.div
              className="h-px bg-foreground"
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
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
              {step.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/50">{step.subtitle}</p>

            <div className="mt-10 space-y-8">
              {step.fields.map((field) => (
                <OnboardingFieldControl
                  key={field.key}
                  field={field}
                  value={draft[field.key as keyof ProfileUpdate]}
                  onChange={(value) => setValue(field.key as keyof UserProfile, value as never)}
                />
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
            className="text-foreground/60 hover:bg-foreground/5 hover:text-foreground disabled:opacity-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isLast ? (
            <Button
              type="button"
              onClick={finish}
              disabled={!stepValid || submitting}
              className="h-11 bg-foreground px-6 text-background hover:bg-foreground/90"
            >
              {submitting ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  Finish
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!stepValid}
              className="h-11 bg-foreground px-6 text-background hover:bg-foreground/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
