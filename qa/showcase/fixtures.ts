import { test as base } from "@playwright/test"
import { adminCredentials } from "./admin-session"
import { installIdentityMask } from "./real-identities"

/**
 * Every clip runs through this fixture, so no take can miss either of the two
 * things that must be true of all of them. A unit test fails if a spec imports
 * `test` from Playwright directly.
 *
 * 1. No dev chrome. Clips record a dev server, which paints the Next.js dev tools
 *    indicator over the page and turns it into a red "1 Issue" badge the moment
 *    anything logs a warning. On camera that reads as a broken site.
 * 2. Nobody real. Installing the mask per clip missed the two that only visit
 *    public pages — and the contact page lists an address that is also a real
 *    account, so those takes published it.
 * 3. No smooth scrolling. The site sets `scroll-behavior: smooth`, which applies
 *    to programmatic scrolls, so `scrollIntoViewIfNeeded` crawls the full height
 *    of a 500vh hero. That cost the restock clip sixteen seconds on one frozen
 *    frame — over half its length. Wheel-driven scrolling, which is how the
 *    clips show a page moving, is not affected by this property.
 */
export const DEV_CHROME_SELECTORS = ["nextjs-portal", "#__next-build-watcher", "[data-nextjs-toast]"]

export function recordingStyle(): string {
  return [
    `${DEV_CHROME_SELECTORS.join(",")}{display:none!important}`,
    "html{scroll-behavior:auto!important}",
  ].join("")
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((css: string) => {
      const hide = () => {
        if (document.getElementById("showcase-hide-dev-chrome")) return
        const style = document.createElement("style")
        style.id = "showcase-hide-dev-chrome"
        style.textContent = css
        document.head?.appendChild(style)
      }
      hide()
      document.addEventListener("DOMContentLoaded", hide)
    }, recordingStyle())
    await installIdentityMask(context, { signedInAs: adminCredentials()?.email })
    await use(context)
  },
})

export { expect } from "@playwright/test"
