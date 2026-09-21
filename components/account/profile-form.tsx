"use client"

import { useRef, useState } from "react"
import { Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { OnboardingFieldControl } from "@/components/auth/onboarding-field"
import { UserAvatar } from "@/components/account/user-avatar"
import { onboardingSteps } from "@/lib/data/onboarding"
import { useAuth } from "@/lib/auth/auth-context"
import type { ProfileUpdate, UserProfile } from "@/lib/auth/types"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Reuse the same data-driven field definitions the onboarding flow uses, so the
// edit form and onboarding never drift apart.
const editableFields = onboardingSteps.flatMap((step) => step.fields)

export function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const [draft, setDraft] = useState<ProfileUpdate>(() => ({
    displayName: user?.profile.displayName ?? "",
    avatarUrl: user?.profile.avatarUrl,
    goal: user?.profile.goal,
    interests: user?.profile.interests ?? [],
    newsletter: user?.profile.newsletter ?? false,
    bio: user?.profile.bio ?? "",
  }))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setValue<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  // The avatar persists immediately (rather than waiting for "Save changes") so it
  // shows up in the nav and cart right after uploading — the behaviour users expect.
  async function persistAvatar(avatarUrl: string | undefined) {
    setDraft((prev) => ({ ...prev, avatarUrl }))
    setAvatarError(null)
    setAvatarSaving(true)
    try {
      await updateProfile({ avatarUrl })
    } finally {
      setAvatarSaving(false)
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setAvatarError(null)
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be under 2MB.")
      return
    }
    await persistAvatar(await fileToDataUrl(file))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile(draft)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.2em] text-foreground/50">Photo</label>
        <div className="flex items-center gap-5">
          <UserAvatar name={draft.displayName || user?.name || "?"} src={draft.avatarUrl} size={72} />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={avatarSaving}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5"
              >
                {avatarSaving ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {draft.avatarUrl ? "Change" : "Upload"}
              </Button>
              {draft.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={avatarSaving}
                  onClick={() => persistAvatar(undefined)}
                  className="h-9 text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-foreground/40">
              {avatarError ?? "JPG, PNG or GIF, up to 2MB. Falls back to your initials."}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="sr-only"
          aria-label="Upload profile photo"
        />
      </div>

      {editableFields.map((field) => (
        <div key={field.key} className="space-y-3">
          <label className="text-xs uppercase tracking-[0.2em] text-foreground/50">{field.label}</label>
          <OnboardingFieldControl
            field={field}
            value={draft[field.key as keyof ProfileUpdate]}
            onChange={(value) => setValue(field.key as keyof UserProfile, value as never)}
          />
        </div>
      ))}

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={saving}
          className="h-11 bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          {saving ? <Spinner className="size-4" /> : "Save changes"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-foreground/60">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
