import "server-only"
import type { UserRole } from "./types"

// Server-only session token: an HMAC-SHA256 signed, URL-safe string of the form
// `<base64url(payload)>.<base64url(signature)>`. The signing secret never leaves
// the server, so a browser can neither read the httpOnly cookie that carries this
// token nor forge a valid one — which is what makes the viewer's role tamper-proof.

export interface SessionPayload {
  /** Stable user id. */
  sub: string
  email: string
  name: string
  role: UserRole
  /** Expiry, epoch milliseconds. */
  exp: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// Prefer a configured secret. The dev fallback keeps preview working out of the
// box; it is intentionally obvious so a missing production secret is easy to spot.
// Set AUTH_SESSION_SECRET in the environment to make sessions genuinely unforgeable.
function secret(): string {
  return process.env.AUTH_SESSION_SECRET || "momo-dev-insecure-secret-set-AUTH_SESSION_SECRET"
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url")
}

function fromBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"))
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

/** Sign a payload into a compact, tamper-evident token. */
export async function signSession(payload: SessionPayload): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(body))
  return `${body}.${toBase64Url(new Uint8Array(signature))}`
}

/** Verify a token's signature + expiry and return its payload, or null if invalid. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  let valid = false
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    )
  } catch {
    return null
  }
  if (!valid) return null

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as SessionPayload
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null
    if (payload.role !== "admin" && payload.role !== "customer") return null
    return payload
  } catch {
    return null
  }
}
