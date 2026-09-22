import Link from "next/link"
import { Lock } from "lucide-react"

/**
 * Server-rendered notice shown in place of an admin-only guide body when the
 * viewer is not an admin. The body is withheld on the server (see
 * fetchDocForViewer), so no protected content reaches the client — this notice
 * is the entirety of what a non-admin receives for a locked guide.
 */
export function DocLockedNotice() {
  return (
    <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/[0.06] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent-amber/40 bg-accent-amber/10">
        <Lock className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">This is an internal guide</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/50">
        This guide is for the Momo Audio team. Sign in with an admin account to read it, or browse the public user
        guides instead.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-full bg-accent-teal px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/docs"
          className="rounded-full border border-foreground/15 px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Browse user guides
        </Link>
      </div>
    </div>
  )
}
