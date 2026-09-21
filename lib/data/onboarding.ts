// Data-driven onboarding definition. Add / reorder steps here — the flow UI renders
// whatever this file describes, so no component code changes when the flow changes.

export type OnboardingFieldType = "text" | "textarea" | "single-select" | "multi-select" | "toggle"

export interface OnboardingOption {
  value: string
  label: string
  description?: string
}

export interface OnboardingField {
  /** Maps to a key on UserProfile. */
  key: "displayName" | "goals" | "interests" | "bio" | "newsletter"
  type: OnboardingFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: OnboardingOption[]
}

export interface OnboardingStep {
  id: string
  title: string
  subtitle: string
  fields: OnboardingField[]
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "identity",
    title: "What should we call you?",
    subtitle: "This is how you'll appear across your account.",
    fields: [
      {
        key: "displayName",
        type: "text",
        label: "Display name",
        placeholder: "e.g. Alex Rivera",
        required: true,
      },
    ],
  },
  {
    id: "goals",
    title: "What brings you here?",
    subtitle: "Pick everything that applies — we'll tailor recommendations to match.",
    fields: [
      {
        key: "goals",
        type: "multi-select",
        label: "Goals",
        required: true,
        options: [
          { value: "listen", label: "Immersive listening", description: "Music, films, and spatial audio" },
          { value: "create", label: "Creating & mixing", description: "Studio-grade monitoring" },
          { value: "focus", label: "Focus & calm", description: "Noise control for deep work" },
          { value: "gift", label: "Finding a gift", description: "Something special for someone" },
        ],
      },
    ],
  },
  {
    id: "interests",
    title: "Which products interest you?",
    subtitle: "Pick as many as you like.",
    fields: [
      {
        key: "interests",
        type: "multi-select",
        label: "Interests",
        options: [
          { value: "headphones", label: "Headphones" },
          { value: "speakers", label: "Speakers" },
          { value: "earbuds", label: "Earbuds" },
          { value: "accessories", label: "Accessories" },
        ],
      },
    ],
  },
  {
    id: "profile",
    title: "Round out your profile",
    subtitle: "Optional, but it helps us personalize your experience.",
    fields: [
      {
        key: "bio",
        type: "textarea",
        label: "Short bio",
        placeholder: "Tell us a little about your setup or taste in sound…",
      },
      {
        key: "newsletter",
        type: "toggle",
        label: "Send me product news and early access",
      },
    ],
  },
]
