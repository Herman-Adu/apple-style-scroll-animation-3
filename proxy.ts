import { NextResponse, type NextRequest } from "next/server"
import { getRequestSession } from "@/lib/auth/server"
import { adminGateDecision } from "@/lib/auth/domain/permissions"

/**
 * First line of defence for /admin: page visits and server-action POSTs are
 * refused before any page or action code runs. This is not the only check —
 * every admin server action also calls requireAdmin(), and lock rules are
 * enforced again inside the save/reset/restore actions.
 */
export async function proxy(request: NextRequest) {
  const session = await getRequestSession(request)
  const decision = adminGateDecision(session, { method: request.method, pathname: request.nextUrl.pathname })

  if (decision.action === "allow") return NextResponse.next()
  if (decision.action === "redirect") return NextResponse.redirect(new URL(decision.to, request.url))
  return NextResponse.json({ ok: false, error: "Not authorized" }, { status: decision.status })
}

export const config = {
  matcher: ["/admin/:path*"],
}
