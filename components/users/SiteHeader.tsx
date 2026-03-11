"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
];

export function SiteHeader() {
  const { isAuthenticated, user, loading, logout, refresh } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
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
    router.push("/login");
  }

  // Hide header on dashboard pages (dashboard has its own shell)
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

          {!loading && (
            <>
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                      <LayoutDashboard className="size-3.5" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <div className="flex items-center gap-1.5 pl-1.5 border-l border-border">
                    <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary overflow-hidden">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="size-7 rounded-full object-cover"
                        />
                      ) : (
                        <User className="size-3.5" />
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                      title="Logout"
                    >
                      <LogOut className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="text-xs">Get Started</Button>
                  </Link>
                </div>
              )}
            </>
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
            <div className="h-px bg-border my-1.5" />
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 text-sm font-medium rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-2 text-sm font-medium rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
