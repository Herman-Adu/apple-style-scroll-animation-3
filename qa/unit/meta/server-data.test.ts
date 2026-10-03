import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = join(__dirname, "../../..")
const read = (path: string) => readFileSync(join(ROOT, path), "utf8")

const SERVER_FED = [
  "features/admin/hooks/use-admin-orders.ts",
  "features/admin/hooks/use-admin-customers.ts",
  "features/admin/hooks/use-admin-discount-codes.ts",
  "components/account/account-view.tsx",
  "components/account/order-history.tsx",
  "features/products/components/product-reviews.tsx",
]

const ADMIN_PAGES = [
  "app/(admin)/admin/page.tsx",
  "app/(admin)/admin/orders/page.tsx",
  "app/(admin)/admin/customers/page.tsx",
  "app/(admin)/admin/customers/[id]/page.tsx",
  "app/(admin)/admin/discounts/page.tsx",
  "app/(admin)/admin/analytics/page.tsx",
]

describe("R4 server data for admin and account", () => {
  it.each(SERVER_FED)("%s loads data without useEffect", (path) => {
    expect(read(path)).not.toMatch(/useEffect/)
  })

  it("the client-only orders hook and the unused email manager are gone", () => {
    expect(existsSync(join(ROOT, "hooks/use-orders.ts"))).toBe(false)
    expect(existsSync(join(ROOT, "features/admin/components/email-manager.tsx"))).toBe(false)
  })

  it.each(ADMIN_PAGES)("%s starts the data load on the server and streams it in", (path) => {
    const page = read(path)
    expect(page).toMatch(/Promise=\{/)
    expect(page).toMatch(/<Suspense/)
  })

  it("the account page loads the signed-in user's orders on the server", () => {
    expect(read("app/account/page.tsx")).toMatch(/listMyOrdersAction/)
  })

  it("admin hooks are seeded from server data, not an empty list", () => {
    for (const path of SERVER_FED.slice(0, 3)) expect(read(path), path).toMatch(/useState\(initial/)
  })
})
