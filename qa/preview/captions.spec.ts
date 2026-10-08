import { mkdirSync } from "node:fs"
import path from "node:path"
import { adminCredentials, canSignInOnCamera } from "../showcase/admin-session"
import { showCaption } from "../showcase/clip"
import { test } from "../showcase/fixtures"
import { CLIPS } from "../showcase/shot-list"

/**
 * Not a clip and not a test: a contact sheet. It puts every caption on its own
 * route at every recording size, so placement can be judged in a couple of
 * minutes rather than after a fifteen-minute recording run.
 *
 *   pnpm showcase:captions
 *   open test-results/preview/captions/
 *
 * It goes through the same fixture as the clips, so what it shows is what a take
 * would record: dev chrome hidden, every real person already a stand-in.
 */
const credentials = adminCredentials()
const outDir = path.join("test-results", "preview", "captions")

test("every caption, on its route, at this size", async ({ context }, testInfo) => {
  test.skip(!canSignInOnCamera(credentials), "Run pnpm showcase:seed -- --confirm first: the admin routes need the demo admin")
  mkdirSync(outDir, { recursive: true })

  const signIn = await context.newPage()
  await signIn.goto("/sign-in?redirect=%2Fadmin", { waitUntil: "networkidle" })
  await signIn.locator('input[type="email"]').fill(credentials!.email)
  await signIn.locator('input[type="password"]').fill(credentials!.password)
  await signIn.locator('button[type="submit"]').click()
  await signIn.waitForURL("**/admin", { timeout: 30_000 })
  await signIn.close()

  const page = await context.newPage()
  for (const clip of CLIPS) {
    for (const [index, caption] of clip.captions.entries()) {
      // Captions outnumber routes on some clips; the last route carries the rest.
      const route = clip.routes[Math.min(index, clip.routes.length - 1)]
      await page.goto(route, { waitUntil: "networkidle" })
      await page.waitForTimeout(1600)
      await showCaption(page, caption)
      await page.waitForTimeout(250)
      await page.screenshot({ path: path.join(outDir, `${clip.slug}-${index}-${testInfo.project.name}.png`) })
    }
  }
})
