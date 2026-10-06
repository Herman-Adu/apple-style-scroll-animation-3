// @ts-check
import { randomBytes } from "node:crypto"
import { DEMO_EMAIL_DOMAIN, DEMO_ID_PREFIX } from "./showcase-demo-data.mjs"

/**
 * A throwaway admin for recording the showcase clips. It lives on the demo email
 * domain, so `pnpm showcase:unseed` removes it with the rest of the demo rows, and
 * its password is random per seed and only ever written to a git-ignored file.
 */
export const DEMO_ADMIN = Object.freeze({
  id: `${DEMO_ID_PREFIX}user_admin`,
  name: "Demo Admin",
  email: `admin@${DEMO_EMAIL_DOMAIN}`,
  role: "admin",
  roleOverride: "admin",
  status: "active",
  onboardingStatus: "complete",
  emailVerified: true,
})

export const ADMIN_CREDENTIALS_FILE = ".generated/showcase-admin.json"

/** @param {{ userId: string, passwordHash: string }} options */
export function buildCredentialAccount({ userId, passwordHash }) {
  return {
    id: `${DEMO_ID_PREFIX}account_admin`,
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  }
}

export function generateDemoPassword() {
  return randomBytes(24).toString("base64url")
}

/** @param {string | null | undefined} address */
export function isDemoAdminEmail(address) {
  return address === DEMO_ADMIN.email
}

/**
 * @param {string} text
 * @returns {{ email: string, password: string } | null}
 */
export function parseAdminCredentials(text) {
  try {
    const parsed = JSON.parse(text)
    const { email, password } = parsed ?? {}
    if (typeof email !== "string" || typeof password !== "string") return null
    if (email.trim() === "" || password === "") return null
    return { email, password }
  } catch {
    return null
  }
}
