import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { BrowserContext, Page } from "@playwright/test"
import {
  ADMIN_CREDENTIALS_FILE,
  DEMO_ADMIN,
  isDemoAdminEmail,
  parseAdminCredentials,
} from "../../scripts/lib/showcase-admin.mjs"

const MASKED_EMAIL = DEMO_ADMIN.email

export interface AdminCredentials {
  email: string
  password: string
}

/** Credentials come only from env, so nothing sensitive is committed. Null when either is missing. */
export function adminCredentialsFromEnv(env: NodeJS.ProcessEnv = process.env): AdminCredentials | null {
  const email = env.QA_ADMIN_EMAIL
  const password = env.QA_ADMIN_PASSWORD
  return email && password ? { email, password } : null
}

function readSeededCredentialsFile(): string | null {
  const file = path.join(process.cwd(), ADMIN_CREDENTIALS_FILE)
  return existsSync(file) ? readFileSync(file, "utf8") : null
}

/** Env first, then the demo admin written by `pnpm showcase:seed` (git-ignored), else null. */
export function adminCredentials(
  env: NodeJS.ProcessEnv = process.env,
  readFile: () => string | null = readSeededCredentialsFile,
): AdminCredentials | null {
  const fromEnv = adminCredentialsFromEnv(env)
  if (fromEnv) return fromEnv
  const text = readFile()
  return text ? parseAdminCredentials(text) : null
}

/** Only the throwaway demo admin may be typed into the sign-in form on camera. */
export function canSignInOnCamera(credentials: AdminCredentials | null): boolean {
  return credentials !== null && isDemoAdminEmail(credentials.email)
}

/**
 * Signs in on a throwaway page, so the sign-in form (with the real address typed
 * into it) is never part of a saved clip, then returns a fresh page that is already
 * signed in. Everywhere the admin prints the real address, the recording shows a
 * demo address instead.
 */
export async function openSignedInAdminPage(context: BrowserContext, credentials: AdminCredentials, landing: string): Promise<Page> {
  await context.addInitScript(
    ({ real, alias }) => {
      const mask = () => {
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.nodeValue?.includes(real)) node.nodeValue = node.nodeValue.split(real).join(alias)
        }
      }
      new MutationObserver(mask).observe(document, { childList: true, subtree: true, characterData: true })
      document.addEventListener("DOMContentLoaded", mask)
    },
    { real: credentials.email, alias: MASKED_EMAIL },
  )

  const signIn = await context.newPage()
  await signIn.goto(`/sign-in?redirect=${encodeURIComponent(landing)}`, { waitUntil: "networkidle" })
  await signIn.locator('input[type="email"]').fill(credentials.email)
  await signIn.locator('input[type="password"]').fill(credentials.password)
  await signIn.locator('button[type="submit"]').click()
  await signIn.waitForURL(`**${landing}`, { timeout: 30_000 })
  await signIn.close()

  const page = await context.newPage()
  await page.goto(landing, { waitUntil: "networkidle" })
  return page
}
