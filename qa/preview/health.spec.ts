import { adminCredentials, canSignInOnCamera } from "../showcase/admin-session"
import { visit } from "../showcase/clip"
import { test } from "../showcase/fixtures"
import { CLIPS } from "../showcase/shot-list"

/**
 * Run this before a recording pass. It opens every route the clips film, through
 * the same fixture a take uses, and fails if any of them come up broken or gated.
 *
 *   pnpm showcase:check
 *
 * It exists because two faults reached published clips: /docs recorded the error
 * screen (the identity mask was rewriting React's streamed payload), and the
 * storefront clip recorded a sign-in wall under a caption promising a checkout.
 * Both reproduce here in seconds. A recording pass costs fifteen minutes.
 */
const credentials = adminCredentials()
const routes = [...new Set(CLIPS.flatMap((clip) => clip.routes))].sort()

test("every route a clip films is fit to film", async ({ context }) => {
  test.skip(!canSignInOnCamera(credentials), "Run pnpm showcase:seed -- --confirm first: the admin routes need the demo admin")

  const signIn = await context.newPage()
  await signIn.goto("/sign-in?redirect=%2Fadmin", { waitUntil: "networkidle" })
  await signIn.locator('input[type="email"]').fill(credentials!.email)
  await signIn.locator('input[type="password"]').fill(credentials!.password)
  await signIn.locator('button[type="submit"]').click()
  await signIn.waitForURL("**/admin", { timeout: 30_000 })
  await signIn.close()

  const page = await context.newPage()
  const broken: string[] = []
  for (const route of routes) {
    // `visit` is what the clips use, so this fails on exactly what a take would.
    try {
      await visit(page, route, { expectSignIn: route.startsWith("/sign-in") })
    } catch (error) {
      broken.push(`${route}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (broken.length > 0) throw new Error(`Not fit to record:\n  ${broken.join("\n  ")}`)
  console.log(`${routes.length} routes checked, all fit to record`)
})
