"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
   { href: "/cart", label: "Cart" },
   { href: "/about", label: "About" },
 
];

export function SiteHeader() {
  const { isAuthenticated, user, loading, logout, refresh } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refresh session on route change to keep nav in sync
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    setMobileOpen(false);
    logout();
  }

  // Hide header on dashboard or admin layouts (they have their own navigation)
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground shrink-0"
        >
          Welcona
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-0.5 ml-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {!loading && isAuthenticated && user?.role === "admin" && (
            <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-border">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <LayoutDashboard className="size-3.5" />
                  <span>Admin Panel</span>
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                title="Logout"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border/60 bg-background">
          <div className="flex flex-col px-4 py-3 gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!loading && isAuthenticated && user?.role === "admin" && (
              <>
                <div className="h-px bg-border my-1.5" />
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
