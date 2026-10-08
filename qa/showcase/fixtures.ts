import { test as base } from "@playwright/test"

/**
 * Clips record a dev server, which paints its own chrome over the page: the
 * Next.js dev tools indicator sits in the bottom corner and turns into a red
 * "1 Issue" badge the moment anything logs a warning. It is not part of the
 * product, and on camera it reads as a broken site.
 *
 * Every clip runs through this fixture, so no take can miss it. A unit test
 * fails if a spec imports `test` from Playwright directly.
 */
export const DEV_CHROME_SELECTORS = ["nextjs-portal", "#__next-build-watcher", "[data-nextjs-toast]"]

export function devChromeStyle(): string {
  return `${DEV_CHROME_SELECTORS.join(",")}{display:none!important}`
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
    }, devChromeStyle())
    await use(context)
  },
})

export { expect } from "@playwright/test"
