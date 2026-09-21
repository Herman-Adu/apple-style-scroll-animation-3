"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/account/profile-form"
import { UserAvatar } from "@/components/account/user-avatar"
import { onboardingSteps } from "@/lib/data/onboarding"
import { useAuth } from "@/lib/auth/auth-context"

/** Resolves the human-readable label for a stored option value from the data file. */
function optionLabel(fieldKey: string, value?: string) {
  if (!value) return undefined
  for (const step of onboardingSteps) {
    const field = step.fields.find((f) => f.key === fieldKey)
    const option = field?.options?.find((o) => o.value === value)
    if (option) return option.label
  }
  return value
}

export function AccountView() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  if (!user) return null

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.replace("/")
  }

  return (
    <main className="min-h-screen bg-background px-5 pb-24 pt-32 md:px-10">
      <div className="mx-auto max-w-3xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 border-b border-foreground/10 pb-10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <UserAvatar
              name={user.profile.displayName || user.name}
              src={user.profile.avatarUrl}
              size={64}
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40">Account</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {user.profile.displayName || user.name}
              </h1>
              <p className="text-sm text-foreground/50">{user.email}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="border-foreground/15 bg-transparent text-foreground hover:bg-foreground/5"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </motion.header>

        {/* Snapshot of onboarding answers */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-4 py-10 sm:grid-cols-2"
        >
          <SummaryCard label="Primary goal" value={optionLabel("goal", user.profile.goal) ?? "—"} />
          <SummaryCard
            label="Interests"
            value={
              user.profile.interests.length
                ? user.profile.interests.map((i) => optionLabel("interests", i)).join(", ")
                : "—"
            }
          />
          <SummaryCard
            label="Newsletter"
            value={user.profile.newsletter ? "Subscribed" : "Not subscribed"}
          />
          <SummaryCard
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            })}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-sm uppercase tracking-[0.25em] text-foreground/50">Edit profile</h2>
          <div className="mt-6">
            <ProfileForm />
          </div>
        </motion.section>
      </div>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/40">{label}</p>
      <p className="mt-2 text-sm text-foreground/80">{value}</p>
    </div>
  )
}
