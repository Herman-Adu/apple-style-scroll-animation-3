"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Package, Tag, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/adapters/auth-context";
import { UserAvatar } from "@/components/account/user-avatar";
import { SignOutConfirmDialog } from "@/components/account/sign-out-confirm";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  /** Chrome text colour class, matching the rest of the header actions. */
  chromeText: string;
  /** Chrome hover class, matching the rest of the header actions. */
  chromeHover: string;
}

interface AccountItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

/**
 * Desktop-only (lg+) account control: the avatar links to /account and reveals
 * a hover dropdown mirroring the main NavDropdown glass panel. Below lg the
 * header renders an avatar button that opens the shared MobileNav sheet on its
 * account panel instead, so there is a single slide-in implementation.
 */
export function AccountMenu({ chromeText, chromeHover }: AccountMenuProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!user) return null;

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  const displayName = user.profile.displayName || user.name;

  const items: AccountItem[] = [
    {
      href: "/account",
      label: "Profile",
      active: pathname === "/account",
      icon: <UserRound className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      href: "/account?tab=orders",
      label: "Orders & invoices",
      icon: <Package className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      href: "/account?tab=offers",
      label: "Offers",
      icon: <Tag className="h-4 w-4" strokeWidth={1.5} />,
    },
    ...(user.role === "admin"
      ? [
          {
            href: "/admin",
            label: "Admin dashboard",
            active: pathname.startsWith("/admin"),
            icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />,
          },
        ]
      : []),
  ];

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <Link
        href="/account"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          chromeText,
          chromeHover,
        )}
        aria-label="Your account"
        aria-expanded={open}
        aria-haspopup="menu"
        onFocus={openNow}
        onBlur={closeSoon}
      >
        <UserAvatar name={displayName} src={user.profile.avatarUrl} size={28} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-3 w-64"
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
            role="menu"
          >
            {/* hover bridge so the gap below the trigger doesn't close the panel */}
            <div className="absolute inset-x-0 -top-3 h-3" aria-hidden />
            <div className="glass overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150">
              <div className="flex items-center gap-3 border-b border-foreground/10 px-3 pb-3 pt-2">
                <UserAvatar
                  name={displayName}
                  src={user.profile.avatarUrl}
                  size={40}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    {user.role === "admin" && (
                      <span className="shrink-0 rounded-full bg-accent-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-teal">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-foreground/40">
                    {user.email}
                  </span>
                </span>
              </div>

              <div className="pt-2">
                {items.map((item) => (
                  <MenuLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    active={item.active}
                    onSelect={() => setOpen(false)}
                    icon={item.icon}
                  />
                ))}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setSignOutOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SignOutConfirmDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon,
  active = false,
  onSelect,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent-teal/10 text-accent-teal"
          : "text-foreground/80 hover:bg-accent-teal/10 hover:text-accent-teal",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
