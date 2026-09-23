"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, ShoppingBag, User } from "lucide-react"
import { mainNav, siteConfig } from "@/lib/data/site"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useActiveSection } from "@/hooks/use-active-section"
import { NAV_SECTION_IDS } from "@/lib/nav"
import { AccountMenu } from "@/components/layout/account-menu"
import { NavDropdown } from "@/components/layout/nav-dropdown"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const category = searchParams.get("category")
  const activeId = useActiveSection(NAV_SECTION_IDS)
  const { itemCount, openCart } = useCart()
  const { status, user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Auth state is client-only (persisted session), so the server always renders
  // the signed-out link. Gate the auth-aware UI on mount so the first client
  // render matches the server and we avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Routes whose first viewport is a dark photo hero sitting behind the header.
  // Over those, the transparent (un-scrolled) header needs light text in both themes.
  const overDarkHero =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/articles" ||
    pathname.startsWith("/products")

  // When scrolled the header becomes an adaptive glass bar, so text follows the theme.
  const onDark = !scrolled && !menuOpen && overDarkHero
  const chromeText = onDark ? "text-white" : "text-foreground"
  const chromeHover = onDark ? "hover:bg-white/10" : "hover:bg-foreground/10"

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || menuOpen
          ? "border-b border-foreground/10 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
        <Link
          href="/"
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.35em] transition-opacity hover:opacity-70",
            chromeText,
          )}
        >
          {siteConfig.shortName}
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {mainNav.map((link) => (
            <NavDropdown key={link.href} link={link} activeId={activeId} category={category} onDark={onDark} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/*
            Profile, theme, and cart. On mobile these sit centered in the header
            (absolute, viewport-centered like the desktop nav); from md up they
            return to their normal inline position in the right-hand cluster.
          */}
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 md:static md:left-auto md:translate-x-0">
            {mounted && status === "authenticated" && user ? (
              <AccountMenu chromeText={chromeText} chromeHover={chromeHover} />
            ) : (
              <Link
                href="/sign-in"
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  chromeText,
                  chromeHover,
                )}
                aria-label="Sign in"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            )}

            <ThemeToggle chromeText={chromeText} chromeHover={chromeHover} />

            <button
              type="button"
              onClick={openCart}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                chromeText,
                chromeHover,
              )}
              aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className={cn("absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold", onDark ? "bg-white text-black" : "bg-foreground text-background")}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden",
              chromeText,
              chromeHover,
            )}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>

    <MobileNav
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      activeId={activeId}
      category={category}
    />
    </>
  )
}
