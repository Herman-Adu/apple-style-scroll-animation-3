"use server"

// Server Actions backing the `db` catalog overlay. Reads (getCatalogProducts)
// are public — the storefront needs live prices/stock. Writes are admin-only:
// identity and role are derived from the Better Auth session on the server, so
// the client can never author or delete a product by calling the action
// directly. Hiding admin UI is not access control; this is the boundary.
//
// Design: marketing content (hero beats, features, specs) stays in the code
// seed (`@/lib/data/products`). This overlay stores the admin-managed layer —
// price, stock, name, created products, deletions — merged onto the seed at
// read time (overlay wins; a `deleted` row tombstones a seed product).

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/config"
import { getAllProducts } from "@/lib/data/products"
import { productSchema, type Product } from "@/features/products"
import { toMap, type ProductMap } from "@/features/catalog/store"

type OverlayRow = { slug: string; data: unknown; deleted: boolean }

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error("Not signed in.")
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, roleOverride: true },
  })
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.")
}

/** Merge the code seed with the DB overlay: overlay wins, tombstones remove. */
function mergeOverlay(seed: Product[], rows: OverlayRow[]): ProductMap {
  const map: ProductMap = toMap(seed)
  for (const row of rows) {
    if (row.deleted) {
      delete map[row.slug]
      continue
    }
    const parsed = productSchema.safeParse(row.data)
    if (parsed.success) map[row.slug] = parsed.data
  }
  return map
}

function sortProducts(map: ProductMap): Product[] {
  return Object.values(map).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function revalidateCatalog(): void {
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath("/admin")
}

/** Live catalog = seed + admin overlay, stable-sorted. Public read. */
export async function getCatalogProducts(): Promise<Product[]> {
  const rows = await prisma.productOverlay.findMany({
    select: { slug: true, data: true, deleted: true },
  })
  return sortProducts(mergeOverlay(getAllProducts(), rows))
}

/** Create or update a product's overlay row (admin). The full effective product
 * is validated server-side before it is persisted. */
export async function saveProductOverlayAction(product: Product): Promise<void> {
  await requireAdmin()
  const parsed = productSchema.parse(product)
  const data = parsed as unknown as Prisma.InputJsonValue
  await prisma.productOverlay.upsert({
    where: { slug: parsed.slug },
    create: { slug: parsed.slug, data, deleted: false },
    update: { data, deleted: false },
  })
  revalidateCatalog()
}

/** Remove a product (admin). Seed products are tombstoned so they stay removed
 * across the code seed; purely-created products are deleted outright. */
export async function deleteProductOverlayAction(slug: string): Promise<void> {
  await requireAdmin()
  const isSeed = getAllProducts().some((p) => p.slug === slug)
  if (isSeed) {
    await prisma.productOverlay.upsert({
      where: { slug },
      create: { slug, data: {}, deleted: true },
      update: { deleted: true },
    })
  } else {
    await prisma.productOverlay.deleteMany({ where: { slug } })
  }
  revalidateCatalog()
}

/** Discard all admin edits and return to the code seed (admin). */
export async function resetCatalogOverlayAction(): Promise<void> {
  await requireAdmin()
  await prisma.productOverlay.deleteMany({})
  revalidateCatalog()
}
