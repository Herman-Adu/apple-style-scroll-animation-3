"use client"

import { Suspense, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { CartDrawer } from "./cart-drawer"
import { OfferBanner } from "./offer-banner"

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
      {/* Fixed chrome stack: the offer banner sits at the very top and the nav
          docks directly beneath it, so the navigation stays flush against the
          page content below instead of being split apart by the banner. */}
      <div className="fixed inset-x-0 top-0 z-50">
        <OfferBanner />
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
      </div>
      {children}
      <SiteFooter />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </>
  )
}
