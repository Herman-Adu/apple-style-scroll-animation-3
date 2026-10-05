"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { mainNav } from "@/components/layout/main-nav";
import { useCart } from "@/features/checkout";
import { useAuth } from "@/lib/auth/adapters/auth-context";
import { useActiveSection } from "@/hooks/use-active-section";
import { NAV_SECTION_IDS } from "@/components/layout/main-nav";
import { AccountMenu } from "@/components/layout/account-menu";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/account/user-avatar";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const activeId = useActiveSection(NAV_SECTION_IDS);
  const { itemCount, openCart } = useCart();
  const { status, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [menuPanel, setMenuPanel] = useState<"root" | "account">("root");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const navOpen = menuOpen && menuPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Routes whose first viewport is a dark photo hero sitting behind the header.
  // Over those, the transparent (un-scrolled) header needs light text in both themes.
  const overDarkHero =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/articles" ||
    pathname.startsWith("/products");

  // When scrolled the header becomes an adaptive glass bar, so text follows the theme.
  const onDark = !scrolled && !navOpen && overDarkHero;
  const chromeText = onDark ? "text-white" : "text-foreground";
  const chromeHover = onDark ? "hover:bg-white/10" : "hover:bg-foreground/10";

  return (
    <>
      <header
        className={cn(
          "relative z-50 transition-colors duration-300",
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
              <NavDropdown
                key={link.href}
                link={link}
                activeId={activeId}
                category={category}
                onDark={onDark}
              />
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
                <>
                  {/* Desktop (lg+): avatar link + hover dropdown. */}
                  <AccountMenu
                    chromeText={chromeText}
                    chromeHover={chromeHover}
                  />
                  {/* Mobile / tablet (<lg): avatar slides in the account panel. */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuPanel("account");
                      setMenuPath(pathname);
                      setMenuOpen(true);
                    }}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                      chromeText,
                      chromeHover,
                    )}
                    aria-label="Your account"
                    aria-haspopup="dialog"
                    aria-expanded={navOpen && menuPanel === "account"}
                  >
                    <UserAvatar
                      name={user.profile.displayName || user.name}
                      src={user.profile.avatarUrl}
                      size={28}
                    />
                  </button>
                </>
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
                  <span
                    className={cn(
                      "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      onDark
                        ? "bg-white text-black"
                        : "bg-foreground text-background",
                    )}
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuPanel("root");
                setMenuPath(pathname);
                setMenuOpen(true);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                chromeText,
                chromeHover,
              )}
              aria-label="Open menu"
              aria-expanded={navOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        key={`${navOpen ? "open" : "closed"}-${menuPanel}`}
        open={navOpen}
        onClose={() => setMenuOpen(false)}
        initialPanel={menuPanel}
        activeId={activeId}
        category={category}
      />
    </>
  );
}
