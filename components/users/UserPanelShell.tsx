"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  User,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/components/providers/AuthProvider";

type UserPanelShellProps = {
  children: React.ReactNode;
  user: SessionUser | null;
};

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/details", label: "Account Details", icon: User },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function UserPanelShell({ children, user }: UserPanelShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-card/50 backdrop-blur-sm lg:flex">
        <div className="flex h-full flex-col px-4 py-6">
          {/* Brand */}
          <Link
            href="/"
            className="mb-8 px-3 text-sm font-semibold tracking-[0.22em] text-foreground"
          >
            WELCONA
          </Link>

          {/* User identity */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName ?? "Avatar"}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {(user?.fullName ?? user?.email ?? "U")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.fullName ?? "My Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1">
            {sidebarLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card/50 px-5 py-4 lg:hidden">
          <Link href="/" className="text-sm font-semibold tracking-[0.22em]">
            WELCONA
          </Link>
          <div className="flex items-center gap-3">
            {sidebarLinks.map(({ href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg p-2 transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-5 py-8 md:px-8 md:py-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
