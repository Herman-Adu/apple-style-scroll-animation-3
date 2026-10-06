import type { BrowserContext, Page } from "@playwright/test"

const MASKED_EMAIL = "admin@demo.momo-audio.test"

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
