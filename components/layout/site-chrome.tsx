"use client"

import { Suspense, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { CartDrawer } from "./cart-drawer"

/**
 * Renders the marketing chrome (storefront header, footer, cart drawer) around
 * page content — except on the admin area, which ships its own full-screen
 * shell. Providers stay global in the root layout; only the visual chrome is
 * gated here.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin") ?? false

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>
      {children}
      <SiteFooter />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </>
  )
}
